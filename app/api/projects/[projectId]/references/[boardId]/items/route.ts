import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import * as projectsRepo from "@/server/repositories/projects";
import * as referenceBoardsRepo from "@/server/repositories/referenceBoards";
import * as referenceItemsRepo from "@/server/repositories/referenceItems";
import * as assetsRepo from "@/server/repositories/assets";
import { getStorage, getBucketName, referencePath } from "@/lib/storage/gcs";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB for ref images

const createItemSchema = z.object({
  type: z.enum(["upload", "screenshot", "projectFrame", "pastedUrl"]),
  assetId: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  note: z.string().max(2000).optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ projectId: string; boardId: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id?: string }).id ?? session.user.email;
  const { projectId, boardId } = await params;
  const project = await projectsRepo.getProjectById(projectId, userId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  const board = await referenceBoardsRepo.getReferenceBoardById(boardId, userId);
  if (!board || board.projectId !== projectId) {
    return NextResponse.json({ error: "Board not found" }, { status: 404 });
  }
  const items = await referenceItemsRepo.getReferenceItemsByBoardId(boardId, userId);
  return NextResponse.json({ items });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string; boardId: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id?: string }).id ?? session.user.email;
  const { projectId, boardId } = await params;
  const project = await projectsRepo.getProjectById(projectId, userId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  const board = await referenceBoardsRepo.getReferenceBoardById(boardId, userId);
  if (!board || board.projectId !== projectId) {
    return NextResponse.json({ error: "Board not found" }, { status: 404 });
  }

  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const note = (formData.get("note") as string) || undefined;
    const tagsRaw = formData.get("tags");
    const tags = tagsRaw ? (typeof tagsRaw === "string" ? tagsRaw.split(",").map((t) => t.trim()) : []) : undefined;
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    }
    const storage = getStorage();
    const bucketName = getBucketName();
    const path = referencePath(userId, projectId, file.name || "image.jpg");
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
      projectId,
      userId,
      type: "reference",
      storagePath: path,
      mimeType: file.type,
    });
    const item = await referenceItemsRepo.createReferenceItem({
      boardId,
      projectId,
      userId,
      type: "upload",
      assetId: asset.id,
      note,
      tags,
    });
    return NextResponse.json({ item });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = createItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { type, assetId, sourceUrl, note, tags } = parsed.data;
  if (type === "projectFrame" && !assetId) {
    return NextResponse.json({ error: "assetId required for projectFrame" }, { status: 400 });
  }
  if (type === "pastedUrl" && !sourceUrl) {
    return NextResponse.json({ error: "sourceUrl required for pastedUrl" }, { status: 400 });
  }
  if (type === "projectFrame" && assetId) {
    const asset = await assetsRepo.getAssetById(assetId, userId);
    if (!asset || asset.projectId !== projectId) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }
  }
  const item = await referenceItemsRepo.createReferenceItem({
    boardId,
    projectId,
    userId,
    type,
    assetId,
    sourceUrl,
    note,
    tags,
  });
  return NextResponse.json({ item });
}
