import "server-only";
import * as batchJobsRepo from "@/server/repositories/batchJobs";
import * as projectsRepo from "@/server/repositories/projects";
import * as assetsRepo from "@/server/repositories/assets";
import * as versionsRepo from "@/server/repositories/versions";
import { applyStyleFromReference } from "@/server/services/gemini";
import { getStorage, getBucketName, versionPath } from "@/lib/storage/gcs";

const PREVIEW_COUNT = 4;

export async function enqueueBatchJob(
  jobId: string,
  userId: string
): Promise<{ enqueued: boolean; error?: string }> {
  const job = await batchJobsRepo.getBatchJobById(jobId, userId);
  if (!job) return { enqueued: false, error: "Job not found" };
  if (job.status === "running" || job.status === "completed") {
    return { enqueued: false, error: `Job is already ${job.status}` };
  }
  await batchJobsRepo.updateBatchJob(jobId, userId, {
    status: "queued",
    progress: job.progress ?? 0,
  });
  return { enqueued: true };
}

export async function runBatchPreview(
  jobId: string,
  userId: string
): Promise<{ samplePreviewIds?: string[]; error?: string }> {
  const job = await batchJobsRepo.getBatchJobById(jobId, userId);
  if (!job) return { error: "Job not found" };
  if (job.status !== "pending") return { error: "Job already started" };
  if ((job.samplePreviewIds?.length ?? 0) > 0) {
    return { samplePreviewIds: job.samplePreviewIds };
  }

  const project = await projectsRepo.getProjectById(job.projectId, userId);
  if (!project) return { error: "Project not found" };

  const masterVersion = await versionsRepo.getVersionNodeById(job.masterVersionId, userId);
  if (!masterVersion || masterVersion.projectId !== job.projectId) return { error: "Master version not found" };

  const masterAsset = await assetsRepo.getAssetById(masterVersion.imageAssetId, userId);
  if (!masterAsset) return { error: "Master asset not found" };

  const assets = await assetsRepo.getAssetsByProjectId(job.projectId, userId);
  const contentAssets = assets.filter((a) => a.type === "upload" || a.type === "cameraCapture" || a.type === "generated").slice(0, PREVIEW_COUNT);
  if (contentAssets.length === 0) return { error: "No assets to process" };

  const storage = getStorage();
  const bucketName = getBucketName();
  if (!storage || !bucketName) return { error: "Storage not configured" };
  const bucket = storage.bucket(bucketName);

  const [masterBuf] = await bucket.file(masterAsset.storagePath).download();
  const samplePreviewIds: string[] = [];

  for (let i = 0; i < contentAssets.length; i++) {
    const asset = contentAssets[i];
    const [contentBuf] = await bucket.file(asset.storagePath).download();
    const result = await applyStyleFromReference(
      Buffer.from(masterBuf),
      masterAsset.mimeType,
      Buffer.from(contentBuf),
      asset.mimeType
    );
    const imageParts = result.imageParts ?? [];
    if (imageParts.length > 0) {
      const path = versionPath(userId, job.projectId, `batch_preview_${jobId}_${i}.png`);
      await bucket.file(path).save(Buffer.from(imageParts[0].data), {
        contentType: imageParts[0].mimeType,
        metadata: { cacheControl: "public, max-age=31536000" },
      });
      const newAsset = await assetsRepo.createAsset({
        projectId: job.projectId,
        userId,
        type: "generated",
        storagePath: path,
        mimeType: imageParts[0].mimeType,
      });
      samplePreviewIds.push(newAsset.id);
    }
  }

  await batchJobsRepo.updateBatchJob(jobId, userId, {
    samplePreviewIds,
    updatedAt: new Date().toISOString(),
  });
  return { samplePreviewIds };
}

export async function runBatchJob(
  jobId: string,
  userId: string
): Promise<{ outputAssetIds?: string[]; error?: string }> {
  const job = await batchJobsRepo.getBatchJobById(jobId, userId);
  if (!job) return { error: "Job not found" };
  if (job.status === "completed") return { outputAssetIds: job.outputAssetIds ?? [] };
  if (job.status === "running") return { outputAssetIds: job.outputAssetIds ?? [] };
  if (job.status !== "queued" && job.status !== "pending") {
    return { error: `Job cannot run from status ${job.status}` };
  }

  const project = await projectsRepo.getProjectById(job.projectId, userId);
  if (!project) return { error: "Project not found" };

  const masterVersion = await versionsRepo.getVersionNodeById(job.masterVersionId, userId);
  if (!masterVersion || masterVersion.projectId !== job.projectId) return { error: "Master version not found" };

  const masterAsset = await assetsRepo.getAssetById(masterVersion.imageAssetId, userId);
  if (!masterAsset) return { error: "Master asset not found" };

  const assets = await assetsRepo.getAssetsByProjectId(job.projectId, userId);
  const contentAssets = assets.filter((a) => a.type === "upload" || a.type === "cameraCapture" || a.type === "generated");
  if (contentAssets.length === 0) return { error: "No assets to process" };

  const storage = getStorage();
  const bucketName = getBucketName();
  if (!storage || !bucketName) return { error: "Storage not configured" };
  const bucket = storage.bucket(bucketName);

  await batchJobsRepo.updateBatchJob(jobId, userId, { status: "running", progress: 0 });

  const [masterBuf] = await bucket.file(masterAsset.storagePath).download();
  const outputAssetIds: string[] = [];
  let failureCount = 0;
  const total = contentAssets.length;

  for (let i = 0; i < contentAssets.length; i++) {
    const asset = contentAssets[i];
    try {
      const [contentBuf] = await bucket.file(asset.storagePath).download();
      const result = await applyStyleFromReference(
        Buffer.from(masterBuf),
        masterAsset.mimeType,
        Buffer.from(contentBuf),
        asset.mimeType
      );
      const imageParts = result.imageParts ?? [];
      if (imageParts.length > 0) {
        const path = versionPath(userId, job.projectId, `batch_${jobId}_${i}.png`);
        await bucket.file(path).save(Buffer.from(imageParts[0].data), {
          contentType: imageParts[0].mimeType,
          metadata: { cacheControl: "public, max-age=31536000" },
        });
        const newAsset = await assetsRepo.createAsset({
          projectId: job.projectId,
          userId,
          type: "generated",
          storagePath: path,
          mimeType: imageParts[0].mimeType,
        });
        outputAssetIds.push(newAsset.id);
      }
    } catch (e) {
      console.error(`Batch item ${i} failed:`, e);
      failureCount += 1;
    }
    await batchJobsRepo.updateBatchJob(jobId, userId, {
      progress: Math.round(((i + 1) / total) * 100),
      outputAssetIds: [...outputAssetIds],
      settings: {
        ...(job.settings ?? {}),
        totalItems: total,
        failedItems: failureCount,
      },
      updatedAt: new Date().toISOString(),
    });
  }

  await batchJobsRepo.updateBatchJob(jobId, userId, {
    status: failureCount > 0 ? "failed" : "completed",
    progress: 100,
    outputAssetIds,
    settings: {
      ...(job.settings ?? {}),
      totalItems: total,
      failedItems: failureCount,
      completedItems: outputAssetIds.length,
    },
    updatedAt: new Date().toISOString(),
  });
  return { outputAssetIds };
}
