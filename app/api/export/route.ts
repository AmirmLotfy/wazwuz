import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import * as projectsRepo from "@/server/repositories/projects";
import * as exportsRepo from "@/server/repositories/exports";
import { getStorage, getBucketName } from "@/lib/storage/gcs";
import * as drive from "@/lib/drive/client";
import { resizeToPreset } from "@/lib/export/resize";
import { resolveProjectExportAsset } from "@/server/services/export-source";
import { getServerAccessToken } from "@/lib/auth/server-access-token";

const schema = z.object({
  projectId: z.string(),
  preset: z.string().optional(),
  destination: z.enum(["download", "drive"]),
  driveFolderId: z.string().optional(),
  shareScope: z.enum(["restricted", "anyone"]).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id?: string }).id ?? session.user.email;
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
  const { projectId, preset = "1:1", destination, driveFolderId, shareScope = "restricted" } = parsed.data;

  const project = await projectsRepo.getProjectById(projectId, userId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const asset = await resolveProjectExportAsset(project, userId);
  if (!asset) {
    return NextResponse.json({ error: "No asset to export" }, { status: 400 });
  }

  const storage = getStorage();
  const bucketName = getBucketName();
  if (!storage || !bucketName) {
    return NextResponse.json({ error: "Storage not configured" }, { status: 503 });
  }
  const [buffer] = await storage.bucket(bucketName).file(asset.storagePath).download();
  const { buffer: outBuffer, mimeType: outMime } = await resizeToPreset(
    buffer,
    asset.mimeType,
    preset
  );
  const ext = outMime.split("/")[1] || "jpg";
  const filename = `wazwuz-${projectId}-${preset.replace(/[/:]/g, "-")}.${ext}`;

  if (destination === "download") {
    const record = await exportsRepo.createExportRecord({
      projectId,
      userId,
      preset,
      destination: "download",
      status: "completed",
    });
    return NextResponse.json({
      ok: true,
      exportId: record.id,
      downloadUrl: `/api/projects/${projectId}/export?preset=${encodeURIComponent(preset)}`,
    });
  }

  const accessToken = await getServerAccessToken(req);
  if (!accessToken) {
    return NextResponse.json(
      { error: "Connect Google Drive (sign in with Google) to export to Drive." },
      { status: 400 }
    );
  }

  let folderId = driveFolderId;
  if (!folderId) {
    const folder = await drive.createFolder(
      accessToken,
      `WazWuz Export ${new Date().toISOString().slice(0, 10)}`,
      undefined
    );
    folderId = folder?.id ?? undefined;
  }
  if (!folderId) {
    const record = await exportsRepo.createExportRecord({
      projectId,
      userId,
      preset,
      destination: "drive",
      status: "failed",
    });
    return NextResponse.json({ error: "Failed to create Drive folder", exportId: record.id }, { status: 500 });
  }

  const uploaded = await drive.uploadFile(
    accessToken,
    Buffer.from(outBuffer),
    outMime,
    filename,
    folderId
  );
  if (!uploaded) {
    await exportsRepo.createExportRecord({
      projectId,
      userId,
      preset,
      destination: "drive",
      driveFolderId: folderId,
      status: "failed",
    });
    return NextResponse.json({ error: "Failed to upload to Drive" }, { status: 500 });
  }

  const shareLink = await drive.createShareLink(accessToken, uploaded.id, shareScope);

  await exportsRepo.createExportRecord({
    projectId,
    userId,
    preset,
    destination: "drive",
    driveFolderId: folderId,
    shareLink: shareLink ?? undefined,
    status: "completed",
  });

  return NextResponse.json({
    ok: true,
    driveFolderId: folderId,
    shareLink: shareLink ?? undefined,
    fileId: uploaded.id,
  });
}
