import { auth } from "@/auth";
import { NextResponse } from "next/server";
import * as projectsRepo from "@/server/repositories/projects";
import * as assetsRepo from "@/server/repositories/assets";
import { getStorage, getBucketName, uploadPath } from "@/lib/storage/gcs";

const MAX_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id?: string }).id ?? session.user.email;
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json(
      { error: "Expected multipart/form-data" },
      { status: 400 }
    );
  }
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }
  const projectId = formData.get("projectId") as string | null;
  const outputTarget = formData.get("outputTarget") as string | null;
  const direction = formData.get("direction") as string | null;
  const file = formData.get("file") as File | null;
  if (!file || typeof file === "string") {
    return NextResponse.json(
      { error: "Missing or invalid file" },
      { status: 400 }
    );
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Invalid file type. Use JPEG, PNG, WebP, or GIF." },
      { status: 400 }
    );
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "File too large (max 50MB)" },
      { status: 400 }
    );
  }
  let resolvedProjectId = projectId;
  if (!resolvedProjectId) {
    const newProject = await projectsRepo.createProject({
      userId,
      title: "Untitled",
      slug: `project-${Date.now()}`,
      sourceType: "upload",
      activeVersionId: null,
      referenceBoardId: null,
    });
    resolvedProjectId = newProject.id;
  } else {
    const project = await projectsRepo.getProjectById(resolvedProjectId, userId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
  }
  const filename = file.name || "image.jpg";
  const path = uploadPath(userId, resolvedProjectId, filename);
  const storage = getStorage();
  const bucketName = getBucketName();
  if (!storage || !bucketName) {
    return NextResponse.json({ error: "Storage not configured" }, { status: 503 });
  }
  const bucket = storage.bucket(bucketName);
  const blob = bucket.file(path);
  const buf = Buffer.from(await file.arrayBuffer());
  await blob.save(buf, {
    contentType: file.type,
    metadata: { cacheControl: "public, max-age=31536000" },
  });
  const asset = await assetsRepo.createAsset({
    projectId: resolvedProjectId,
    userId,
    type: "upload",
    storagePath: path,
    mimeType: file.type,
    metadata: {
      originalName: filename,
      size: file.size,
      ...(outputTarget && { outputTarget }),
      ...(direction && { direction }),
    },
  });
  return NextResponse.json({
    asset: {
      id: asset.id,
      projectId: asset.projectId,
      type: asset.type,
      storagePath: asset.storagePath,
      mimeType: asset.mimeType,
      createdAt: asset.createdAt,
    },
    projectId: resolvedProjectId,
  });
}
