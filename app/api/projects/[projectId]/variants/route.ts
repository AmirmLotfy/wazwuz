import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import * as projectsRepo from "@/server/repositories/projects";
import * as assetsRepo from "@/server/repositories/assets";
import * as versionsRepo from "@/server/repositories/versions";
import { getStorage, getBucketName, versionPath } from "@/lib/storage/gcs";
import { generateVariantsFromImage } from "@/server/services/gemini";

const schema = z.object({
  assetId: z.string(),
  prompt: z.string().optional(),
  count: z.number().min(1).max(6).optional(),
  precisionSettings: z.record(z.string(), z.number().min(0).max(1)).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id?: string }).id ?? session.user.email;
  const { projectId } = await params;
  const project = await projectsRepo.getProjectById(projectId, userId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { assetId, prompt = "Create a creative variant", count = 3, precisionSettings } = parsed.data;
  const asset = await assetsRepo.getAssetById(assetId, userId);
  if (!asset || asset.projectId !== projectId) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }
  const storage = getStorage();
  const bucketName = getBucketName();
  if (!storage || !bucketName) {
    return NextResponse.json(
      { error: "Storage not configured" },
      { status: 503 }
    );
  }
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(asset.storagePath);
  const [exists] = await file.exists();
  if (!exists) {
    return NextResponse.json({ error: "File not found in storage" }, { status: 404 });
  }
  const [buffer] = await file.download();
  const promptWithPrecision =
    precisionSettings && Object.keys(precisionSettings).length > 0
      ? `${prompt} (Precision: ${Object.entries(precisionSettings)
          .map(([k, v]) => `${k}=${Math.round(v * 100)}%`)
          .join(", ")})`
      : prompt;
  let result: { text?: string; imageParts?: Array<{ mimeType: string; data: Uint8Array }> };
  try {
    result = await generateVariantsFromImage(
      Buffer.from(buffer),
      asset.mimeType,
      promptWithPrecision,
      count
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "AI generation failed", details: String((e as Error).message) },
      { status: 500 }
    );
  }
  const imageParts = result.imageParts ?? [];
  if (imageParts.length === 0) {
    return NextResponse.json({
      message: result.text ?? "No image output from model; try a model that supports image generation.",
      versionId: null,
      assetIds: [],
    });
  }
  const parentVersionId = project.activeVersionId;
  const newAssetIds: string[] = [];
  let firstVersionId: string | null = null;
  for (let i = 0; i < imageParts.length; i++) {
    const part = imageParts[i];
    const path = versionPath(userId, projectId, `variant_${i}.png`);
    const blob = bucket.file(path);
    await blob.save(Buffer.from(part.data), {
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
    await projectsRepo.updateProject(projectId, userId, {
      activeVersionId: firstVersionId,
    });
  }
  return NextResponse.json({
    versionId: firstVersionId,
    assetIds: newAssetIds,
  });
}
