import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import * as projectsRepo from "@/server/repositories/projects";
import { resolveStyleTerm } from "@/server/services/trend-resolver";

const schema = z.object({
  styleTerm: z.string().min(1).max(500),
  referenceBoardId: z.string().optional(),
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
  const result = await resolveStyleTerm(
    parsed.data.styleTerm,
    projectId,
    parsed.data.referenceBoardId
  );
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  if (result.traits) {
    await projectsRepo.updateProject(projectId, userId, {
      trendSnapshot: {
        styleTerm: parsed.data.styleTerm,
        confidence: result.traits.confidence,
        freshness: result.traits.freshness,
        interpretations: result.traits.interpretations,
        traits: result.traits.traits,
        groundingSnippets: result.traits.groundingSnippets,
        resolvedAt: new Date().toISOString(),
      },
    });
  }
  return NextResponse.json({ traits: result.traits });
}
