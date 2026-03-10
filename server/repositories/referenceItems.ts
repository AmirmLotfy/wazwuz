import { getFirestore } from "@/lib/db/firestore";
import type { ReferenceItemRecord } from "@/types/db";

const COLLECTION = "referenceItems";

export async function createReferenceItem(
  data: Omit<ReferenceItemRecord, "id" | "createdAt">
): Promise<ReferenceItemRecord> {
  const db = getFirestore();
  const now = new Date().toISOString();
  const doc = { ...data, createdAt: now };
  if (db) {
    const ref = await db.collection(COLLECTION).add(doc);
    return { id: ref.id, ...doc } as ReferenceItemRecord;
  }
  const id = `item_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  return { id, ...doc } as ReferenceItemRecord;
}

export async function getReferenceItemsByBoardId(
  boardId: string,
  userId: string
): Promise<ReferenceItemRecord[]> {
  const db = getFirestore();
  if (db) {
    const snap = await db
      .collection(COLLECTION)
      .where("boardId", "==", boardId)
      .where("userId", "==", userId)
      .get();
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ReferenceItemRecord));
    list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return list;
  }
  return [];
}

export async function getReferenceItemById(
  itemId: string,
  userId: string
): Promise<ReferenceItemRecord | null> {
  const db = getFirestore();
  if (db) {
    const ref = db.collection(COLLECTION).doc(itemId);
    const snap = await ref.get();
    if (!snap.exists) return null;
    const data = snap.data() as Omit<ReferenceItemRecord, "id">;
    if (data.userId !== userId) return null;
    return { id: snap.id, ...data };
  }
  return null;
}

export async function updateReferenceItem(
  itemId: string,
  userId: string,
  updates: Partial<Pick<ReferenceItemRecord, "note" | "tags" | "sourceUrl" | "extractedSignals">>
): Promise<boolean> {
  const db = getFirestore();
  if (!db) return false;
  const ref = db.collection(COLLECTION).doc(itemId);
  const snap = await ref.get();
  if (!snap.exists) return false;
  if (snap.data()?.userId !== userId) return false;
  await ref.update(updates);
  return true;
}

export async function deleteReferenceItem(
  itemId: string,
  userId: string
): Promise<boolean> {
  const db = getFirestore();
  if (!db) return false;
  const ref = db.collection(COLLECTION).doc(itemId);
  const snap = await ref.get();
  if (!snap.exists) return false;
  if (snap.data()?.userId !== userId) return false;
  await ref.delete();
  return true;
}
