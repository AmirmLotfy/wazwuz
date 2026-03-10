import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import * as projectsRepo from "@/server/repositories/projects";
import * as assetsRepo from "@/server/repositories/assets";
import * as versionsRepo from "@/server/repositories/versions";
import { composeImages } from "@/server/services/gemini";
import { getStorage, getBucketName, versionPath } from "@/lib/storage/gcs";

const schema = z.object({
  subjectAssetId: z.string(),
  backgroundAssetId: z.string().optional(),
  moodAssetId: z.string().optional(),
  priorityMode: z.string().optional(),
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

  const storage = getStorage();
  const bucketName = getBucketName();
  if (!storage || !bucketName) {
    return NextResponse.json({ error: "Storage not configured" }, { status: 503 });
  }
  const bucket = storage.bucket(bucketName);

  const subjectAsset = await assetsRepo.getAssetById(parsed.data.subjectAssetId, userId);
  if (!subjectAsset || subjectAsset.projectId !== projectId) {
    return NextResponse.json({ error: "Subject asset not found" }, { status: 404 });
  }
  const [subjectBuf] = await bucket.file(subjectAsset.storagePath).download();

  let backgroundBuffer: Buffer | undefined;
  let backgroundMime: string | undefined;
  if (parsed.data.backgroundAssetId) {
    const bg = await assetsRepo.getAssetById(parsed.data.backgroundAssetId, userId);
    if (bg && bg.projectId === projectId) {
      const [b] = await bucket.file(bg.storagePath).download();
      backgroundBuffer = Buffer.from(b);
      backgroundMime = bg.mimeType;
    }
  }

  let moodBuffer: Buffer | undefined;
  let moodMime: string | undefined;
  if (parsed.data.moodAssetId) {
    const mood = await assetsRepo.getAssetById(parsed.data.moodAssetId, userId);
    if (mood && mood.projectId === projectId) {
      const [b] = await bucket.file(mood.storagePath).download();
      moodBuffer = Buffer.from(b);
      moodMime = mood.mimeType;
    }
  }

  let result: { text?: string; imageParts?: Array<{ mimeType: string; data: Uint8Array }> };
  try {
    result = await composeImages(Buffer.from(subjectBuf), subjectAsset.mimeType, {
      backgroundBuffer,
      backgroundMime,
      moodBuffer,
      moodMime,
      priorityMode: parsed.data.priorityMode,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Composition failed", details: String((e as Error).message) },
      { status: 500 }
    );
  }

  const imageParts = result.imageParts ?? [];
  if (imageParts.length === 0) {
    return NextResponse.json({
      error: result.text ?? "No image output from model",
      versionId: null,
      assetId: null,
    });
  }

  const part = imageParts[0];
  const path = versionPath(userId, projectId, "composed.png");
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

  const versionNode = await versionsRepo.createVersionNode({
    projectId,
    userId,
    parentId: project.activeVersionId,
    label: "Composed",
    summary: "Multi-image composition",
    imageAssetId: newAsset.id,
    toolName: "compose",
    toolPayload: {
      subjectAssetId: parsed.data.subjectAssetId,
      backgroundAssetId: parsed.data.backgroundAssetId,
      moodAssetId: parsed.data.moodAssetId,
      priorityMode: parsed.data.priorityMode,
    },
  });

  await projectsRepo.updateProject(projectId, userId, {
    activeVersionId: versionNode.id,
  });

  return NextResponse.json({
    versionId: versionNode.id,
    assetId: newAsset.id,
  });
}
