import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import * as projectsRepo from "@/server/repositories/projects";
import * as referenceBoardsRepo from "@/server/repositories/referenceBoards";

const createSchema = z.object({
  name: z.string().min(1).max(200).default("Reference board"),
});

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
  const project = await projectsRepo.getProjectById(projectId, userId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  const boards = await referenceBoardsRepo.getReferenceBoardsByProjectId(projectId, userId);
  return NextResponse.json({ boards });
}

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
    body = {};
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const board = await referenceBoardsRepo.createReferenceBoard({
    projectId,
    userId,
    name: parsed.data.name,
  });
  return NextResponse.json({ board });
}
