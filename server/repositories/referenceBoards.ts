import { getFirestore } from "@/lib/db/firestore";
import type { ReferenceBoardRecord } from "@/types/db";

const COLLECTION = "referenceBoards";

export async function createReferenceBoard(
  data: Omit<ReferenceBoardRecord, "id" | "createdAt" | "updatedAt">
): Promise<ReferenceBoardRecord> {
  const db = getFirestore();
  const now = new Date().toISOString();
  const doc = { ...data, createdAt: now, updatedAt: now };
  if (db) {
    const ref = await db.collection(COLLECTION).add(doc);
    return { id: ref.id, ...doc } as ReferenceBoardRecord;
  }
  const id = `board_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  return { id, ...doc } as ReferenceBoardRecord;
}

export async function getReferenceBoardsByProjectId(
  projectId: string,
  userId: string
): Promise<ReferenceBoardRecord[]> {
  const db = getFirestore();
  if (db) {
    const snap = await db
      .collection(COLLECTION)
      .where("projectId", "==", projectId)
      .where("userId", "==", userId)
      .get();
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ReferenceBoardRecord));
    list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return list;
  }
  return [];
}

export async function getReferenceBoardById(
  boardId: string,
  userId: string
): Promise<ReferenceBoardRecord | null> {
  const db = getFirestore();
  if (db) {
    const ref = db.collection(COLLECTION).doc(boardId);
    const snap = await ref.get();
    if (!snap.exists) return null;
    const data = snap.data() as Omit<ReferenceBoardRecord, "id">;
    if (data.userId !== userId) return null;
    return { id: snap.id, ...data };
  }
  return null;
}

export async function updateReferenceBoard(
  boardId: string,
  userId: string,
  updates: Partial<Pick<ReferenceBoardRecord, "name" | "summary" | "extractedTraits" | "updatedAt">>
): Promise<boolean> {
  const db = getFirestore();
  if (!db) return false;
  const ref = db.collection(COLLECTION).doc(boardId);
  const snap = await ref.get();
  if (!snap.exists) return false;
  const data = snap.data();
  if (data?.userId !== userId) return false;
  await ref.update({
    ...updates,
    updatedAt: new Date().toISOString(),
  });
  return true;
}

export async function deleteReferenceBoard(
  boardId: string,
  userId: string
): Promise<boolean> {
  const db = getFirestore();
  if (!db) return false;
  const ref = db.collection(COLLECTION).doc(boardId);
  const snap = await ref.get();
  if (!snap.exists) return false;
  if (snap.data()?.userId !== userId) return false;
  await ref.delete();
  return true;
}
