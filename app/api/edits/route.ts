import { auth } from "@/auth";
import { NextResponse } from "next/server";
import * as projectsRepo from "@/server/repositories/projects";
import * as assetsRepo from "@/server/repositories/assets";
import * as versionsRepo from "@/server/repositories/versions";
import { z } from "zod";

const applyEditSchema = z.object({
  projectId: z.string(),
  parentVersionId: z.string().nullable(),
  label: z.string(),
  summary: z.string().optional(),
  imageAssetId: z.string(),
  toolName: z.string().optional(),
  toolPayload: z.record(z.string(), z.unknown()).optional(),
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
  const parsed = applyEditSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { projectId, parentVersionId, label, summary, imageAssetId, toolName, toolPayload } =
    parsed.data;
  const project = await projectsRepo.getProjectById(projectId, userId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  const asset = await assetsRepo.getAssetById(imageAssetId, userId);
  if (!asset || asset.projectId !== projectId) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }
  const version = await versionsRepo.createVersionNode({
    projectId,
    userId,
    parentId: parentVersionId,
    label,
    summary,
    imageAssetId,
    toolName,
    toolPayload,
  });
  await projectsRepo.updateProject(projectId, userId, {
    activeVersionId: version.id,
  });
  return NextResponse.json({ version });
}
