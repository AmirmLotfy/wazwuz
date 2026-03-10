import { getFirestore } from "@/lib/db/firestore";
import type { BatchJobRecord } from "@/types/db";

const COLLECTION = "batchJobs";

export async function createBatchJob(
  data: Omit<BatchJobRecord, "id" | "createdAt" | "updatedAt">
): Promise<BatchJobRecord> {
  const db = getFirestore();
  const now = new Date().toISOString();
  const doc = { ...data, createdAt: now, updatedAt: now };
  if (db) {
    const ref = await db.collection(COLLECTION).add(doc);
    return { id: ref.id, ...doc } as BatchJobRecord;
  }
  const id = `batch_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  return { id, ...doc } as BatchJobRecord;
}

export async function getBatchJobById(
  jobId: string,
  userId: string
): Promise<BatchJobRecord | null> {
  const db = getFirestore();
  if (db) {
    const ref = db.collection(COLLECTION).doc(jobId);
    const snap = await ref.get();
    if (!snap.exists) return null;
    const data = snap.data() as Omit<BatchJobRecord, "id">;
    if (data.userId !== userId) return null;
    return { id: snap.id, ...data };
  }
  return null;
}

export async function getBatchJobsByProjectId(
  projectId: string,
  userId: string
): Promise<BatchJobRecord[]> {
  const db = getFirestore();
  if (db) {
    const snap = await db
      .collection(COLLECTION)
      .where("projectId", "==", projectId)
      .where("userId", "==", userId)
      .get();
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as BatchJobRecord));
    list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return list;
  }
  return [];
}

export async function updateBatchJob(
  jobId: string,
  userId: string,
  updates: Partial<
    Pick<
      BatchJobRecord,
      "status" | "progress" | "outputAssetIds" | "samplePreviewIds" | "settings" | "updatedAt"
    >
  >
): Promise<boolean> {
  const db = getFirestore();
  if (!db) return false;
  const ref = db.collection(COLLECTION).doc(jobId);
  const snap = await ref.get();
  if (!snap.exists) return false;
  if (snap.data()?.userId !== userId) return false;
  await ref.update({
    ...updates,
    updatedAt: new Date().toISOString(),
  });
  return true;
}
