import { auth } from "@/auth";
import { NextResponse } from "next/server";
import * as projectsRepo from "@/server/repositories/projects";
import * as assetsRepo from "@/server/repositories/assets";

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
  const assets = await assetsRepo.getAssetsByProjectId(projectId, userId);
  return NextResponse.json({ assets });
}
