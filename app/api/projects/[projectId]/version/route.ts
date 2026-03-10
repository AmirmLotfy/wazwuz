import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import * as projectsRepo from "@/server/repositories/projects";
import * as versionsRepo from "@/server/repositories/versions";

const schema = z.object({
  activeVersionId: z.string().nullable(),
});

export async function PATCH(
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
  const { activeVersionId } = parsed.data;
  if (activeVersionId != null) {
    const version = await versionsRepo.getVersionNodeById(activeVersionId, userId);
    if (!version || version.projectId !== projectId) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }
  }
  await projectsRepo.updateProject(projectId, userId, { activeVersionId });
  return NextResponse.json({ ok: true, activeVersionId });
}
