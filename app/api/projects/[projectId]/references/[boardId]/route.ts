import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import * as projectsRepo from "@/server/repositories/projects";
import * as referenceBoardsRepo from "@/server/repositories/referenceBoards";
import * as referenceItemsRepo from "@/server/repositories/referenceItems";

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  summary: z.string().max(2000).optional().nullable(),
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
  return NextResponse.json({ board, items });
}

export async function PATCH(
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
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  await referenceBoardsRepo.updateReferenceBoard(boardId, userId, {
    name: parsed.data.name,
    summary: parsed.data.summary ?? undefined,
  });
  const updated = await referenceBoardsRepo.getReferenceBoardById(boardId, userId);
  return NextResponse.json({ board: updated });
}

export async function DELETE(
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
  await referenceBoardsRepo.deleteReferenceBoard(boardId, userId);
  return NextResponse.json({ ok: true });
}
