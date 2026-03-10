import { auth } from "@/auth";
import { NextResponse } from "next/server";
import * as projectsRepo from "@/server/repositories/projects";
import * as exportsRepo from "@/server/repositories/exports";
import { getStorage, getBucketName } from "@/lib/storage/gcs";
import { resizeToPreset } from "@/lib/export/resize";
import { resolveProjectExportAsset } from "@/server/services/export-source";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id?: string }).id ?? session.user.email;
  const { projectId } = await params;
  const url = new URL(req.url);
  const preset = url.searchParams.get("preset") ?? "1:1";

  const project = await projectsRepo.getProjectById(projectId, userId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  const asset = await resolveProjectExportAsset(project, userId);
  if (!asset) {
    return NextResponse.json(
      { error: "No asset to export" },
      { status: 400 }
    );
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
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
  const [buffer] = await file.download();
  const { buffer: outBuffer, mimeType: outMime } = await resizeToPreset(
    buffer,
    asset.mimeType,
    preset
  );
  const ext = outMime.split("/")[1] || "jpg";
  await exportsRepo.createExportRecord({
    projectId,
    userId,
    preset,
    destination: "download",
    status: "completed",
  });
  const filename = `wazwuz-export-${projectId}-${preset.replace(/[/:]/g, "-")}.${ext}`;
  return new NextResponse(new Uint8Array(outBuffer), {
    headers: {
      "Content-Type": outMime,
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
