import { getFirestore } from "@/lib/db/firestore";
import type { AssetRecord } from "@/types/db";

const COLLECTION = "assets";

export async function createAsset(
  data: Omit<AssetRecord, "id" | "createdAt">
): Promise<AssetRecord> {
  const db = getFirestore();
  const now = new Date().toISOString();
  const doc = { ...data, createdAt: now };
  if (db) {
    const ref = await db.collection(COLLECTION).add(doc);
    return { id: ref.id, ...doc } as AssetRecord;
  }
  const id = `asset_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  return { id, ...doc } as AssetRecord;
}

export async function getAssetsByProjectId(
  projectId: string,
  userId: string
): Promise<AssetRecord[]> {
  const db = getFirestore();
  if (db) {
    const snap = await db
      .collection(COLLECTION)
      .where("projectId", "==", projectId)
      .where("userId", "==", userId)
      .get();
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AssetRecord));
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  }
  return [];
}

export async function getAssetById(
  assetId: string,
  userId: string
): Promise<AssetRecord | null> {
  const db = getFirestore();
  if (db) {
    const ref = db.collection(COLLECTION).doc(assetId);
    const snap = await ref.get();
    if (!snap.exists) return null;
    const data = snap.data() as Omit<AssetRecord, "id">;
    if (data.userId !== userId) return null;
    return { id: snap.id, ...data };
  }
  return null;
}
