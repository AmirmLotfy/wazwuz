import "server-only";
import type { ResolvedTraits } from "./trend-resolver";
import * as projectsRepo from "@/server/repositories/projects";
import * as versionsRepo from "@/server/repositories/versions";
import * as assetsRepo from "@/server/repositories/assets";
import { applyEditToImage } from "@/server/services/gemini";
import { getStorage, getBucketName, versionPath } from "@/lib/storage/gcs";

export type TrendApplyMode = "lighting" | "color" | "composition" | "full";

export async function applyTrendToProject(
  projectId: string,
  userId: string,
  traits: ResolvedTraits["traits"],
  mode: TrendApplyMode,
  versionId?: string | null
): Promise<{ versionId?: string; assetId?: string; error?: string }> {
  const project = await projectsRepo.getProjectById(projectId, userId);
  if (!project) return { error: "Project not found" };

  const version = versionId
    ? await versionsRepo.getVersionNodeById(versionId, userId)
    : project.activeVersionId
      ? await versionsRepo.getVersionNodeById(project.activeVersionId, userId)
      : null;

  const assetId = version?.imageAssetId ?? (await assetsRepo.getAssetsByProjectId(projectId, userId))[0]?.id;
  if (!assetId) return { error: "No image to apply trend to" };

  const asset = await assetsRepo.getAssetById(assetId, userId);
  if (!asset || asset.projectId !== projectId) return { error: "Asset not found" };

  const storage = getStorage();
  const bucketName = getBucketName();
  if (!storage || !bucketName) return { error: "Storage not configured" };

  const [buffer] = await storage.bucket(bucketName).file(asset.storagePath).download();
  const traitDesc = Object.entries(traits)
    .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`)
    .join("; ");
  const editPrompt =
    mode === "lighting"
      ? `Adjust lighting only to match: ${traitDesc}`
      : mode === "color"
        ? `Adjust color palette and tone to match: ${traitDesc}`
        : mode === "composition"
          ? `Adjust composition and framing to match: ${traitDesc}`
          : `Apply this style/vibe to the image: ${traitDesc}`;

  let result: { text?: string; imageParts?: Array<{ mimeType: string; data: Uint8Array }> };
  try {
    result = await applyEditToImage(Buffer.from(buffer), asset.mimeType, editPrompt);
  } catch (e) {
    console.error(e);
    return { error: (e as Error).message };
  }

  const imageParts = result.imageParts ?? [];
  if (imageParts.length === 0) {
    return { error: result.text ?? "No image output from model" };
  }

  const part = imageParts[0];
  const path = versionPath(userId, projectId, `trend_${mode}.png`);
  const bucket = storage.bucket(bucketName);
  await bucket.file(path).save(Buffer.from(part.data), {
    contentType: part.mimeType,
    metadata: { cacheControl: "public, max-age=31536000" },
  });

  const newAsset = await assetsRepo.createAsset({
    projectId,
    userId,
    type: "generated",
    storagePath: path,
    mimeType: part.mimeType,
  });

  const parentVersionId = project.activeVersionId;
  const versionNode = await versionsRepo.createVersionNode({
    projectId,
    userId,
    parentId: parentVersionId,
    label: `Trend: ${mode}`,
    summary: traitDesc.slice(0, 200),
    imageAssetId: newAsset.id,
    toolName: "applyTrend",
    toolPayload: { mode, traits },
  });

  await projectsRepo.updateProject(projectId, userId, {
    activeVersionId: versionNode.id,
  });

  return { versionId: versionNode.id, assetId: newAsset.id };
}
