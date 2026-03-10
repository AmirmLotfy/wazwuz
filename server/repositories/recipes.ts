import { getFirestore } from "@/lib/db/firestore";
import type { RecipeRecord } from "@/types/db";

const COLLECTION = "recipes";

export async function createRecipe(
  data: Omit<RecipeRecord, "id" | "createdAt" | "updatedAt">
): Promise<RecipeRecord> {
  const db = getFirestore();
  const now = new Date().toISOString();
  const doc = { ...data, createdAt: now, updatedAt: now };
  if (db) {
    const ref = await db.collection(COLLECTION).add(doc);
    return { id: ref.id, ...doc } as RecipeRecord;
  }
  const id = `recipe_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  return { id, ...doc } as RecipeRecord;
}

export async function getRecipeById(
  recipeId: string,
  userId: string
): Promise<RecipeRecord | null> {
  const db = getFirestore();
  if (db) {
    const ref = db.collection(COLLECTION).doc(recipeId);
    const snap = await ref.get();
    if (!snap.exists) return null;
    const data = snap.data() as Omit<RecipeRecord, "id">;
    if (data.userId !== userId) return null;
    return { id: snap.id, ...data };
  }
  return null;
}

export async function getRecipesByUserId(userId: string): Promise<RecipeRecord[]> {
  const db = getFirestore();
  if (db) {
    const snap = await db
      .collection(COLLECTION)
      .where("userId", "==", userId)
      .get();
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as RecipeRecord));
    list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return list;
  }
  return [];
}

export async function updateRecipe(
  recipeId: string,
  userId: string,
  updates: Partial<Pick<RecipeRecord, "name" | "description" | "previewAssetId" | "config" | "updatedAt">>
): Promise<boolean> {
  const db = getFirestore();
  if (!db) return false;
  const ref = db.collection(COLLECTION).doc(recipeId);
  const snap = await ref.get();
  if (!snap.exists) return false;
  if (snap.data()?.userId !== userId) return false;
  await ref.update({
    ...updates,
    updatedAt: new Date().toISOString(),
  });
  return true;
}

export async function deleteRecipe(recipeId: string, userId: string): Promise<boolean> {
  const db = getFirestore();
  if (!db) return false;
  const ref = db.collection(COLLECTION).doc(recipeId);
  const snap = await ref.get();
  if (!snap.exists) return false;
  if (snap.data()?.userId !== userId) return false;
  await ref.delete();
  return true;
}
