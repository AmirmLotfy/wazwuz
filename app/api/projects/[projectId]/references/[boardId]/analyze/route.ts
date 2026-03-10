import { auth } from "@/auth";
import { NextResponse } from "next/server";
import * as projectsRepo from "@/server/repositories/projects";
import * as referenceBoardsRepo from "@/server/repositories/referenceBoards";
import * as referenceItemsRepo from "@/server/repositories/referenceItems";
import { analyzeReferenceBoard } from "@/server/services/reference-board-analysis";

export async function POST(
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
  const result = await analyzeReferenceBoard(boardId, userId, projectId, items);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  await referenceBoardsRepo.updateReferenceBoard(boardId, userId, {
    extractedTraits: result.traits ?? undefined,
  });
  const updated = await referenceBoardsRepo.getReferenceBoardById(boardId, userId);
  return NextResponse.json({ board: updated, traits: result.traits });
}
