import { auth } from "@/auth";
import { NextResponse } from "next/server";
import * as projectsRepo from "@/server/repositories/projects";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  sourceType: z.enum(["upload", "camera", "mixed"]).default("upload"),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id?: string }).id ?? session.user.email;
  try {
    const list = await projectsRepo.getProjectsByUserId(userId);
    return NextResponse.json({ projects: list });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to list projects" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id?: string }).id ?? session.user.email;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { title, sourceType } = parsed.data;
  const slug = (title ?? "Untitled")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  try {
    const project = await projectsRepo.createProject({
      userId,
      title: title ?? "Untitled",
      slug: slug || `project-${Date.now()}`,
      sourceType,
      activeVersionId: null,
      referenceBoardId: null,
    });
    return NextResponse.json({
      project: {
        id: project.id,
        title: project.title,
        slug: project.slug,
        sourceType: project.sourceType,
        activeVersionId: project.activeVersionId,
        createdAt: project.createdAt,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
