import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import * as projectsRepo from "@/server/repositories/projects";
import * as versionsRepo from "@/server/repositories/versions";
import * as batchJobsRepo from "@/server/repositories/batchJobs";

const schema = z.object({
  masterVersionId: z.string(),
  settings: z.record(z.string(), z.unknown()).optional(),
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
  const version = await versionsRepo.getVersionNodeById(parsed.data.masterVersionId, userId);
  if (!version || version.projectId !== projectId) {
    return NextResponse.json({ error: "Master version not found" }, { status: 404 });
  }
  const job = await batchJobsRepo.createBatchJob({
    projectId,
    userId,
    masterVersionId: parsed.data.masterVersionId,
    status: "pending",
    settings: parsed.data.settings,
  });
  return NextResponse.json({ job });
}
