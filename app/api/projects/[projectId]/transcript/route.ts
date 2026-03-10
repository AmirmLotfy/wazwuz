import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import * as projectsRepo from "@/server/repositories/projects";
import * as transcriptRepo from "@/server/repositories/transcriptTurns";

const createTurnSchema = z.object({
  speaker: z.enum(["user", "assistant"]),
  text: z.string(),
  toolCalls: z
    .array(
      z.object({
        name: z.string(),
        payload: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .optional(),
});

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
  const turns = await transcriptRepo.getTranscriptTurnsByProjectId(projectId, userId);
  return NextResponse.json({ turns });
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
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = createTurnSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const turn = await transcriptRepo.createTranscriptTurn({
    projectId,
    userId,
    speaker: parsed.data.speaker,
    text: parsed.data.text,
    toolCalls: parsed.data.toolCalls,
  });
  return NextResponse.json({ turn });
}
