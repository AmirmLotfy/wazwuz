import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import * as recipesRepo from "@/server/repositories/recipes";

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  previewAssetId: z.string().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ recipeId: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id?: string }).id ?? session.user.email;
  const { recipeId } = await params;
  const recipe = await recipesRepo.getRecipeById(recipeId, userId);
  if (!recipe) return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
  return NextResponse.json({ recipe });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ recipeId: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id?: string }).id ?? session.user.email;
  const { recipeId } = await params;

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
  const ok = await recipesRepo.updateRecipe(recipeId, userId, parsed.data);
  if (!ok) return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
  const recipe = await recipesRepo.getRecipeById(recipeId, userId);
  return NextResponse.json({ recipe });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ recipeId: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id?: string }).id ?? session.user.email;
  const { recipeId } = await params;
  const ok = await recipesRepo.deleteRecipe(recipeId, userId);
  if (!ok) return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
