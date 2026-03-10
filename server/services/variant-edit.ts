import "server-only";
import * as projectsRepo from "@/server/repositories/projects";
import * as assetsRepo from "@/server/repositories/assets";
import * as versionsRepo from "@/server/repositories/versions";
import { getStorage, getBucketName, versionPath } from "@/lib/storage/gcs";
import { generateVariantsFromImage, applyEditToImage } from "@/server/services/gemini";

export async function createVariantsForProject(
  projectId: string,
  userId: string,
  options: { assetId?: string; prompt?: string; count?: number; precisionSettings?: Record<string, number> }
): Promise<{ success: true; versionId: string | null; assetIds: string[] } | { success: false; error: string }> {
  const project = await projectsRepo.getProjectById(projectId, userId);
  if (!project) return { success: false, error: "Project not found" };

  const assetId =
    options.assetId ??
    (project.activeVersionId
      ? (await versionsRepo.getVersionNodeById(project.activeVersionId, userId))?.imageAssetId
      : null) ??
    (await assetsRepo.getAssetsByProjectId(projectId, userId))[0]?.id;

  if (!assetId) return { success: false, error: "No asset to use" };

  const asset = await assetsRepo.getAssetById(assetId, userId);
  if (!asset || asset.projectId !== projectId) return { success: false, error: "Asset not found" };

  const storage = getStorage();
  const bucketName = getBucketName();
  if (!storage || !bucketName) return { success: false, error: "Storage not configured" };

  const bucket = storage.bucket(bucketName);
  const file = bucket.file(asset.storagePath);
  const [exists] = await file.exists();
  if (!exists) return { success: false, error: "File not found in storage" };

  const [buffer] = await file.download();
  const prompt = options.prompt ?? "Create a creative variant";
  const count = options.count ?? 3;
  const precisionStr =
    options.precisionSettings && Object.keys(options.precisionSettings).length > 0
      ? ` (Precision: ${Object.entries(options.precisionSettings)
          .map(([k, v]) => `${k}=${Math.round(v * 100)}%`)
          .join(", ")})`
      : "";
  const fullPrompt = prompt + precisionStr;

  let result: { text?: string; imageParts?: Array<{ mimeType: string; data: Uint8Array }> };
  try {
    result = await generateVariantsFromImage(Buffer.from(buffer), asset.mimeType, fullPrompt, count);
  } catch (e) {
    console.error(e);
    return { success: false, error: String((e as Error).message) };
  }

  const imageParts = result.imageParts ?? [];
  if (imageParts.length === 0) {
    return { success: true, versionId: null, assetIds: [] };
  }

  const parentVersionId = project.activeVersionId;
  const newAssetIds: string[] = [];
  let firstVersionId: string | null = null;

  for (let i = 0; i < imageParts.length; i++) {
    const part = imageParts[i];
    const path = versionPath(userId, projectId, `variant_${i}.png`);
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
    newAssetIds.push(newAsset.id);
    const version = await versionsRepo.createVersionNode({
      projectId,
      userId,
      parentId: parentVersionId,
      label: `Variant ${i + 1}`,
      summary: prompt,
      imageAssetId: newAsset.id,
      toolName: "generateVariants",
      toolPayload: { prompt, count },
    });
    if (!firstVersionId) firstVersionId = version.id;
  }

  if (firstVersionId) {
    await projectsRepo.updateProject(projectId, userId, { activeVersionId: firstVersionId });
  }
  return { success: true, versionId: firstVersionId, assetIds: newAssetIds };
}

export async function applyEditForProject(
  projectId: string,
  userId: string,
  editPrompt: string,
  options?: { versionId?: string | null }
): Promise<{ success: true; versionId: string; assetId: string } | { success: false; error: string }> {
  const project = await projectsRepo.getProjectById(projectId, userId);
  if (!project) return { success: false, error: "Project not found" };

  const version = options?.versionId
    ? await versionsRepo.getVersionNodeById(options.versionId, userId)
    : project.activeVersionId
      ? await versionsRepo.getVersionNodeById(project.activeVersionId, userId)
      : null;

  const assetId = version?.imageAssetId ?? (await assetsRepo.getAssetsByProjectId(projectId, userId))[0]?.id;
  if (!assetId) return { success: false, error: "No asset to edit" };

  const asset = await assetsRepo.getAssetById(assetId, userId);
  if (!asset || asset.projectId !== projectId) return { success: false, error: "Asset not found" };

  const storage = getStorage();
  const bucketName = getBucketName();
  if (!storage || !bucketName) return { success: false, error: "Storage not configured" };

  const [buffer] = await storage.bucket(bucketName).file(asset.storagePath).download();

  let result: { text?: string; imageParts?: Array<{ mimeType: string; data: Uint8Array }> };
  try {
    result = await applyEditToImage(Buffer.from(buffer), asset.mimeType, editPrompt);
  } catch (e) {
    console.error(e);
    return { success: false, error: String((e as Error).message) };
  }

  const imageParts = result.imageParts ?? [];
  if (imageParts.length === 0) return { success: false, error: result.text ?? "No image output" };

  const part = imageParts[0];
  const path = versionPath(userId, projectId, `edit_${Date.now()}.png`);
  await storage.bucket(bucketName).file(path).save(Buffer.from(part.data), {
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

  const versionNode = await versionsRepo.createVersionNode({
    projectId,
    userId,
    parentId: project.activeVersionId,
    label: "Edit",
    summary: editPrompt.slice(0, 200),
    imageAssetId: newAsset.id,
    toolName: "applyEdit",
    toolPayload: { editPrompt },
  });

  await projectsRepo.updateProject(projectId, userId, { activeVersionId: versionNode.id });
  return { success: true, versionId: versionNode.id, assetId: newAsset.id };
}
