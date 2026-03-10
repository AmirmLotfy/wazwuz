import "server-only";
import { auth } from "@/auth";
import * as projectsRepo from "@/server/repositories/projects";
import * as assetsRepo from "@/server/repositories/assets";
import * as versionsRepo from "@/server/repositories/versions";
import * as transcriptRepo from "@/server/repositories/transcriptTurns";
import * as batchJobsRepo from "@/server/repositories/batchJobs";
import * as referenceBoardsRepo from "@/server/repositories/referenceBoards";
import * as referenceItemsRepo from "@/server/repositories/referenceItems";
import { runBatchPreview, runBatchJob } from "@/server/services/batch-execution";
import { createVariantsForProject, applyEditForProject } from "@/server/services/variant-edit";
import * as drive from "@/lib/drive/client";
import { getStorage, getBucketName } from "@/lib/storage/gcs";
import { GoogleGenAI } from "@google/genai";
import { getImageModels } from "@/lib/ai/models";
import { resolveStyleTerm as resolveTrendStyleTerm } from "@/server/services/trend-resolver";
import { analyzeReferenceBoard as analyzeBoardService } from "@/server/services/reference-board-analysis";

export type ToolName =
  | "analyzeUploads"
  | "analyzeLiveFrame"
  | "suggestDirections"
  | "resolveStyleTerm"
  | "analyzeReferenceBoard"
  | "applyEdit"
  | "generateVariants"
  | "branchVersion"
  | "resetToOriginal"
  | "compareVersions"
  | "createBatchPreview"
  | "runBatchJob"
  | "exportProject"
  | "createDriveFolder"
  | "uploadToDrive"
  | "createShareLink";

export interface ToolPayload {
  projectId?: string;
  assetId?: string;
  versionId?: string;
  boardId?: string;
  [key: string]: unknown;
}

function decodeFrameData(frameData: string): Buffer {
  const cleaned = frameData.includes(",") ? frameData.split(",")[1] : frameData;
  return Buffer.from(cleaned, "base64");
}

async function analyzeImageWithGemini(
  image: Buffer,
  mimeType: string,
  prompt: string
): Promise<{ analysis?: Record<string, unknown>; text?: string; error?: string }> {
  if (!process.env.GEMINI_API_KEY) {
    return { error: "GEMINI_API_KEY not configured" };
  }
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: getImageModels().fast,
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType,
                data: image.toString("base64"),
              },
            },
            { text: prompt },
          ],
        },
      ],
    } as unknown as Parameters<typeof ai.models.generateContent>[0]);
    const text = response.text?.trim() ?? "";
    if (!text) return { text };
    try {
      const parsed = JSON.parse(text) as Record<string, unknown>;
      return { analysis: parsed, text };
    } catch {
      return { text };
    }
  } catch (error) {
    return { error: (error as Error).message };
  }
}

export async function runLiveTool(
  tool: ToolName,
  payload: ToolPayload,
  context?: { accessToken?: string }
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  const session = await auth();
  if (!session?.user?.email) {
    return { success: false, error: "Unauthorized" };
  }
  const userId = (session.user as { id?: string }).id ?? session.user.email;

  const projectId = payload.projectId as string | undefined;
  if (projectId) {
    const project = await projectsRepo.getProjectById(projectId, userId);
    if (!project) return { success: false, error: "Project not found" };
  }

  switch (tool) {
    case "branchVersion": {
      if (!projectId || !payload.versionId) return { success: false, error: "Missing projectId or versionId" };
      const version = await versionsRepo.getVersionNodeById(payload.versionId as string, userId);
      if (!version || version.projectId !== projectId) return { success: false, error: "Version not found" };
      await projectsRepo.updateProject(projectId, userId, { activeVersionId: version.id });
      return { success: true, data: { activeVersionId: version.id } };
    }
    case "resetToOriginal": {
      if (!projectId) return { success: false, error: "Missing projectId" };
      const assets = await assetsRepo.getAssetsByProjectId(projectId, userId);
      const first = assets[assets.length - 1];
      const rootVersion = first
        ? await versionsRepo.createVersionNode({
            projectId,
            userId,
            parentId: null,
            label: "Original",
            imageAssetId: first.id,
          })
        : null;
      await projectsRepo.updateProject(projectId, userId, {
        activeVersionId: rootVersion?.id ?? null,
      });
      return { success: true, data: { activeVersionId: rootVersion?.id } };
    }
    case "compareVersions": {
      if (!projectId) return { success: false, error: "Missing projectId" };
      const versions = await versionsRepo.getVersionNodesByProjectId(projectId, userId);
      const project = await projectsRepo.getProjectById(projectId, userId);
      return {
        success: true,
        data: {
          current: project?.activeVersionId,
          versions: versions.map((v) => ({ id: v.id, label: v.label, imageAssetId: v.imageAssetId })),
        },
      };
    }
    case "analyzeUploads": {
      if (!projectId) return { success: false, error: "Missing projectId" };
      const assets = await assetsRepo.getAssetsByProjectId(projectId, userId);
      return { success: true, data: { count: assets.length, assetIds: assets.map((a) => a.id) } };
    }
    case "suggestDirections": {
      if (!projectId) return { success: false, error: "Missing projectId" };
      const project = await projectsRepo.getProjectById(projectId, userId);
      if (!project) return { success: false, error: "Project not found" };
      const assets = await assetsRepo.getAssetsByProjectId(projectId, userId);
      const versions = await versionsRepo.getVersionNodesByProjectId(projectId, userId);
      const board =
        project.referenceBoardId
          ? await referenceBoardsRepo.getReferenceBoardById(project.referenceBoardId, userId)
          : null;
      const suggestions: string[] = [];
      if (assets.length <= 1) suggestions.push("Generate 3 variants for wider style exploration");
      if ((project.precisionSettings?.styleIntensity ?? 0) < 0.55) {
        suggestions.push("Increase style intensity and rerun one variant");
      }
      if (!board) suggestions.push("Attach a reference board for stronger direction matching");
      if (versions.length > 2) suggestions.push("Open compare mode and lock your strongest branch");
      suggestions.push("Run a softer relight pass to preserve natural skin tones");
      return {
        success: true,
        data: {
          suggestions: suggestions.slice(0, Math.max(1, Number(payload.maxSuggestions ?? 4))),
          context: {
            assets: assets.length,
            versions: versions.length,
            hasReferenceBoard: Boolean(board),
          },
        },
      };
    }
    case "resolveStyleTerm": {
      const styleTerm = (payload.styleTerm as string | undefined)?.trim();
      if (!styleTerm) return { success: false, error: "Missing styleTerm" };
      const resolved = await resolveTrendStyleTerm(
        styleTerm,
        projectId,
        payload.referenceBoardId as string | undefined
      );
      if (resolved.error) return { success: false, error: resolved.error };
      return { success: true, data: resolved.traits };
    }
    case "analyzeReferenceBoard": {
      if (!projectId || !payload.boardId) {
        return { success: false, error: "Missing projectId or boardId" };
      }
      const board = await referenceBoardsRepo.getReferenceBoardById(payload.boardId as string, userId);
      if (!board || board.projectId !== projectId) {
        return { success: false, error: "Reference board not found" };
      }
      const items = await referenceItemsRepo.getReferenceItemsByBoardId(board.id, userId);
      const analyzed = await analyzeBoardService(board.id, userId, projectId, items);
      if (analyzed.error) return { success: false, error: analyzed.error };
      await referenceBoardsRepo.updateReferenceBoard(board.id, userId, {
        extractedTraits: analyzed.traits,
        summary: "Analyzed by live assistant",
      });
      return { success: true, data: { boardId: board.id, traits: analyzed.traits ?? {} } };
    }
    case "applyEdit": {
      if (!projectId) return { success: false, error: "Missing projectId" };
      const editPrompt = (payload.editPrompt ?? payload.prompt ?? "Apply a subtle improvement") as string;
      const result = await applyEditForProject(projectId, userId, editPrompt);
      if (!result.success) return { success: false, error: result.error };
      return { success: true, data: { versionId: result.versionId, assetId: result.assetId } };
    }
    case "generateVariants": {
      if (!projectId) return { success: false, error: "Missing projectId" };
      const project = await projectsRepo.getProjectById(projectId, userId);
      const result = await createVariantsForProject(projectId, userId, {
        assetId: payload.assetId as string | undefined,
        prompt: (payload.prompt as string) ?? "Create a creative variant",
        count: typeof payload.count === "number" ? payload.count : 3,
        precisionSettings: project?.precisionSettings,
      });
      if (!result.success) return { success: false, error: result.error };
      return { success: true, data: { versionId: result.versionId, assetIds: result.assetIds } };
    }
    case "analyzeLiveFrame": {
      const mimeType = (payload.mimeType as string | undefined) ?? "image/jpeg";
      let frame: Buffer | null = null;
      if (typeof payload.frameData === "string" && payload.frameData.length > 0) {
        frame = decodeFrameData(payload.frameData);
      } else if (typeof payload.frameAssetId === "string") {
        const asset = await assetsRepo.getAssetById(payload.frameAssetId, userId);
        if (!asset) return { success: false, error: "Frame asset not found" };
        const storage = getStorage();
        const bucketName = getBucketName();
        if (!storage || !bucketName) {
          return { success: false, error: "Storage not configured" };
        }
        const [buffer] = await storage.bucket(bucketName).file(asset.storagePath).download();
        frame = Buffer.from(buffer);
      }
      if (!frame) return { success: false, error: "Missing frameData or frameAssetId" };

      const analysis = await analyzeImageWithGemini(
        frame,
        mimeType,
        'Analyze this camera frame for creative direction. Return concise JSON with keys: framing, lighting, backgroundDistraction, subjectPose, nextActions (array of short actionable steps). Return JSON only.'
      );
      if (analysis.error) return { success: false, error: analysis.error };
      return {
        success: true,
        data: {
          analysis: analysis.analysis ?? null,
          rawText: analysis.text ?? null,
        },
      };
    }
    case "createBatchPreview": {
      if (!projectId || !payload.masterVersionId) return { success: false, error: "Missing projectId or masterVersionId" };
      const project = await projectsRepo.getProjectById(projectId, userId);
      if (!project) return { success: false, error: "Project not found" };
      const job = await batchJobsRepo.createBatchJob({
        projectId,
        userId,
        masterVersionId: payload.masterVersionId as string,
        status: "pending",
      });
      const previewResult = await runBatchPreview(job.id, userId);
      if (previewResult.error) return { success: false, error: previewResult.error };
      return { success: true, data: { jobId: job.id, samplePreviewIds: previewResult.samplePreviewIds } };
    }
    case "runBatchJob": {
      if (!projectId || !payload.jobId) return { success: false, error: "Missing projectId or jobId" };
      const runResult = await runBatchJob(payload.jobId as string, userId);
      if (runResult.error) return { success: false, error: runResult.error };
      return { success: true, data: { outputAssetIds: runResult.outputAssetIds } };
    }
    case "exportProject": {
      if (!projectId) return { success: false, error: "Missing projectId" };
      const exportUrl = `/api/projects/${projectId}/export?preset=1:1`;
      return { success: true, data: { downloadUrl: exportUrl, message: "Export ready; user can download." } };
    }
    case "createDriveFolder": {
      const accessToken = context?.accessToken;
      if (!accessToken) return { success: false, error: "Connect Google Drive (sign in with Google) first." };
      const name = (payload.folderName as string) ?? `WazWuz Export ${new Date().toISOString().slice(0, 10)}`;
      const folder = await drive.createFolder(accessToken, name, payload.parentFolderId as string | undefined);
      if (!folder) return { success: false, error: "Failed to create folder" };
      return { success: true, data: { folderId: folder.id, webViewLink: folder.webViewLink } };
    }
    case "uploadToDrive": {
      const accessToken = context?.accessToken;
      if (!accessToken) return { success: false, error: "Connect Google Drive first." };
      if (!projectId) return { success: false, error: "Missing projectId" };
      const project = await projectsRepo.getProjectById(projectId, userId);
      if (!project) return { success: false, error: "Project not found" };
      const activeVersionAssetId = project.activeVersionId
        ? (await versionsRepo.getVersionNodeById(project.activeVersionId, userId))?.imageAssetId
        : null;
      const assetId =
        activeVersionAssetId ?? (await assetsRepo.getAssetsByProjectId(projectId, userId))[0]?.id;
      if (!assetId) return { success: false, error: "No asset to upload" };
      const asset = await assetsRepo.getAssetById(assetId, userId);
      if (!asset || asset.projectId !== projectId) return { success: false, error: "Asset not found" };
      const storage = getStorage();
      const bucketName = getBucketName();
      if (!storage || !bucketName) return { success: false, error: "Storage not configured" };
      const [buffer] = await storage.bucket(bucketName).file(asset.storagePath).download();
      const filename = (payload.filename as string) ?? `wazwuz-${projectId}.${asset.mimeType.split("/")[1] || "jpg"}`;
      const folderId = payload.folderId as string | undefined;
      const uploaded = await drive.uploadFile(accessToken, Buffer.from(buffer), asset.mimeType, filename, folderId);
      if (!uploaded) return { success: false, error: "Failed to upload to Drive" };
      return { success: true, data: { fileId: uploaded.id, webViewLink: uploaded.webViewLink } };
    }
    case "createShareLink": {
      const accessToken = context?.accessToken;
      if (!accessToken) return { success: false, error: "Connect Google Drive first." };
      const fileId = payload.fileId as string;
      if (!fileId) return { success: false, error: "Missing fileId" };
      const scope =
        payload.shareScope === "anyone" || payload.shareScope === "restricted"
          ? payload.shareScope
          : "restricted";
      const link = await drive.createShareLink(accessToken, fileId, scope);
      if (!link) return { success: false, error: "Failed to create share link" };
      return { success: true, data: { shareLink: link } };
    }
    default:
      return { success: false, error: `Unknown tool: ${tool}` };
  }
}

export async function persistTranscriptTurn(
  projectId: string,
  userId: string,
  speaker: "user" | "assistant",
  text: string,
  toolCalls?: Array<{ name: string; payload?: Record<string, unknown> }>
): Promise<void> {
  await transcriptRepo.createTranscriptTurn({
    projectId,
    userId,
    speaker,
    text,
    toolCalls,
  });
}
