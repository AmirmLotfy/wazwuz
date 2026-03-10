import { z } from "zod";
import type { ToolName } from "@/server/services/live-tools";

export const TOOLS: ToolName[] = [
  "analyzeUploads",
  "analyzeLiveFrame",
  "suggestDirections",
  "resolveStyleTerm",
  "analyzeReferenceBoard",
  "applyEdit",
  "generateVariants",
  "branchVersion",
  "resetToOriginal",
  "compareVersions",
  "createBatchPreview",
  "runBatchJob",
  "exportProject",
  "createDriveFolder",
  "uploadToDrive",
  "createShareLink",
];

export const toolEnum = z.enum(TOOLS);

export const payloadSchemas: Record<ToolName, z.ZodType<Record<string, unknown>>> = {
  analyzeUploads: z.object({ projectId: z.string().min(1) }),
  analyzeLiveFrame: z.object({
    projectId: z.string().min(1).optional(),
    frameData: z.string().min(1).optional(),
    mimeType: z.string().min(1).optional(),
    frameAssetId: z.string().min(1).optional(),
  }),
  suggestDirections: z.object({
    projectId: z.string().min(1),
    maxSuggestions: z.number().int().min(1).max(8).optional(),
  }),
  resolveStyleTerm: z.object({
    projectId: z.string().min(1).optional(),
    styleTerm: z.string().min(1),
    referenceBoardId: z.string().min(1).optional(),
  }),
  analyzeReferenceBoard: z.object({
    projectId: z.string().min(1),
    boardId: z.string().min(1),
  }),
  applyEdit: z.object({
    projectId: z.string().min(1),
    editPrompt: z.string().min(1).optional(),
    prompt: z.string().min(1).optional(),
  }),
  generateVariants: z.object({
    projectId: z.string().min(1),
    assetId: z.string().min(1).optional(),
    prompt: z.string().min(1).optional(),
    count: z.number().int().min(1).max(6).optional(),
  }),
  branchVersion: z.object({
    projectId: z.string().min(1),
    versionId: z.string().min(1),
  }),
  resetToOriginal: z.object({
    projectId: z.string().min(1),
  }),
  compareVersions: z.object({
    projectId: z.string().min(1),
  }),
  createBatchPreview: z.object({
    projectId: z.string().min(1),
    masterVersionId: z.string().min(1),
  }),
  runBatchJob: z.object({
    projectId: z.string().min(1),
    jobId: z.string().min(1),
  }),
  exportProject: z.object({
    projectId: z.string().min(1),
  }),
  createDriveFolder: z.object({
    folderName: z.string().min(1).optional(),
    parentFolderId: z.string().min(1).optional(),
  }),
  uploadToDrive: z.object({
    projectId: z.string().min(1),
    filename: z.string().min(1).optional(),
    folderId: z.string().min(1).optional(),
  }),
  createShareLink: z.object({
    fileId: z.string().min(1),
    shareScope: z.enum(["restricted", "anyone"]).optional(),
  }),
};
