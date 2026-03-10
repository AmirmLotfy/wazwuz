import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import * as recipesRepo from "@/server/repositories/recipes";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id?: string }).id ?? session.user.email;
  const recipes = await recipesRepo.getRecipesByUserId(userId);
  return NextResponse.json({ recipes });
}

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  previewAssetId: z.string().optional(),
  config: z.record(z.string(), z.unknown()),
});

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
  const recipe = await recipesRepo.createRecipe({
    userId,
    name: parsed.data.name,
    description: parsed.data.description,
    previewAssetId: parsed.data.previewAssetId,
    config: parsed.data.config,
  });
  return NextResponse.json({ recipe });
}
