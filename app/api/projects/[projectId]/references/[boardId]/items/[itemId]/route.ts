import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import * as projectsRepo from "@/server/repositories/projects";
import * as referenceBoardsRepo from "@/server/repositories/referenceBoards";
import * as referenceItemsRepo from "@/server/repositories/referenceItems";

const patchSchema = z.object({
  note: z.string().max(2000).optional(),
  tags: z.array(z.string()).optional(),
  sourceUrl: z.string().url().optional(),
  extractedSignals: z.record(z.string(), z.unknown()).optional(),
});

async function authorize(
  projectId: string,
  boardId: string,
  itemId: string,
  userId: string
) {
  const project = await projectsRepo.getProjectById(projectId, userId);
  if (!project) return { error: "Project not found", status: 404 } as const;

  const board = await referenceBoardsRepo.getReferenceBoardById(boardId, userId);
  if (!board || board.projectId !== projectId) {
    return { error: "Board not found", status: 404 } as const;
  }

  const item = await referenceItemsRepo.getReferenceItemById(itemId, userId);
  if (!item || item.boardId !== boardId || item.projectId !== projectId) {
    return { error: "Reference item not found", status: 404 } as const;
  }
  return { item } as const;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ projectId: string; boardId: string; itemId: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id?: string }).id ?? session.user.email;
  const { projectId, boardId, itemId } = await params;

  const authz = await authorize(projectId, boardId, itemId, userId);
  if ("error" in authz) return NextResponse.json({ error: authz.error }, { status: authz.status });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const ok = await referenceItemsRepo.updateReferenceItem(itemId, userId, parsed.data);
  if (!ok) return NextResponse.json({ error: "Update failed" }, { status: 400 });
  const updated = await referenceItemsRepo.getReferenceItemById(itemId, userId);
  return NextResponse.json({ item: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ projectId: string; boardId: string; itemId: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id?: string }).id ?? session.user.email;
  const { projectId, boardId, itemId } = await params;

  const authz = await authorize(projectId, boardId, itemId, userId);
  if ("error" in authz) return NextResponse.json({ error: authz.error }, { status: authz.status });

  const ok = await referenceItemsRepo.deleteReferenceItem(itemId, userId);
  if (!ok) return NextResponse.json({ error: "Delete failed" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
