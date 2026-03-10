import { auth } from "@/auth";
import { NextResponse } from "next/server";
import * as projectsRepo from "@/server/repositories/projects";
import * as batchJobsRepo from "@/server/repositories/batchJobs";
import { runBatchPreview } from "@/server/services/batch-execution";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string; jobId: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id?: string }).id ?? session.user.email;
  const { projectId, jobId } = await params;
  const project = await projectsRepo.getProjectById(projectId, userId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  const job = await batchJobsRepo.getBatchJobById(jobId, userId);
  if (!job || job.projectId !== projectId) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }
  const result = await runBatchPreview(jobId, userId);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  const updated = await batchJobsRepo.getBatchJobById(jobId, userId);
  return NextResponse.json({ job: updated, samplePreviewIds: result.samplePreviewIds });
}
