import { auth } from "@/auth";
import { NextResponse } from "next/server";
import * as projectsRepo from "@/server/repositories/projects";
import * as assetsRepo from "@/server/repositories/assets";
import { getStorage, getBucketName } from "@/lib/storage/gcs";

export async function GET(
  _req: Request,
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
  const assetId = new URL(_req.url).searchParams.get("assetId");
  if (!assetId) {
    return NextResponse.json({ error: "Missing assetId" }, { status: 400 });
  }
  const asset = await assetsRepo.getAssetById(assetId, userId);
  if (!asset || asset.projectId !== projectId) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }
  const storage = getStorage();
  const bucketName = getBucketName();
  if (!storage || !bucketName) {
    return NextResponse.json(
      { error: "Storage not configured", path: asset.storagePath },
      { status: 503 }
    );
  }
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(asset.storagePath);
  const [exists] = await file.exists();
  if (!exists) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
  const [signedUrl] = await file.getSignedUrl({
    action: "read",
    expires: Date.now() + 60 * 60 * 1000,
  });
  return NextResponse.redirect(signedUrl);
}
