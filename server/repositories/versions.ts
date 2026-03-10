import { getFirestore } from "@/lib/db/firestore";
import type { VersionNodeRecord } from "@/types/db";

const COLLECTION = "versionNodes";

export async function createVersionNode(
  data: Omit<VersionNodeRecord, "id" | "createdAt">
): Promise<VersionNodeRecord> {
  const db = getFirestore();
  const now = new Date().toISOString();
  const doc = { ...data, createdAt: now };
  if (db) {
    const ref = await db.collection(COLLECTION).add(doc);
    return { id: ref.id, ...doc } as VersionNodeRecord;
  }
  const id = `ver_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  return { id, ...doc } as VersionNodeRecord;
}

export async function getVersionNodesByProjectId(
  projectId: string,
  userId: string
): Promise<VersionNodeRecord[]> {
  const db = getFirestore();
  if (db) {
    const snap = await db
      .collection(COLLECTION)
      .where("projectId", "==", projectId)
      .where("userId", "==", userId)
      .get();
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as VersionNodeRecord));
    list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return list;
  }
  return [];
}

export async function getVersionNodeById(
  versionId: string,
  userId: string
): Promise<VersionNodeRecord | null> {
  const db = getFirestore();
  if (db) {
    const ref = db.collection(COLLECTION).doc(versionId);
    const snap = await ref.get();
    if (!snap.exists) return null;
    const data = snap.data() as Omit<VersionNodeRecord, "id">;
    if (data.userId !== userId) return null;
    return { id: snap.id, ...data };
  }
  return null;
}
