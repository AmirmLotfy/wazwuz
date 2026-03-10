import { getFirestore } from "@/lib/db/firestore";
import type { ExportRecord } from "@/types/db";

const COLLECTION = "exports";

export async function createExportRecord(
  data: Omit<ExportRecord, "id" | "createdAt">
): Promise<ExportRecord> {
  const db = getFirestore();
  const now = new Date().toISOString();
  const doc = { ...data, createdAt: now };
  if (db) {
    const ref = await db.collection(COLLECTION).add(doc);
    return { id: ref.id, ...doc } as ExportRecord;
  }
  const id = `exp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  return { id, ...doc } as ExportRecord;
}

export async function getExportsByProjectId(
  projectId: string,
  userId: string
): Promise<ExportRecord[]> {
  const db = getFirestore();
  if (db) {
    const snap = await db
      .collection(COLLECTION)
      .where("projectId", "==", projectId)
      .where("userId", "==", userId)
      .get();
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ExportRecord));
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  }
  return [];
}
