import { getFirestore } from "@/lib/db/firestore";
import type { ProjectRecord } from "@/types/db";

const COLLECTION = "projects";

export async function createProject(
  data: Omit<ProjectRecord, "id" | "createdAt" | "updatedAt">
): Promise<ProjectRecord> {
  const db = getFirestore();
  const now = new Date().toISOString();
  const doc = {
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  if (db) {
    const ref = await db.collection(COLLECTION).add(doc);
    return { id: ref.id, ...doc } as ProjectRecord;
  }
  const id = `proj_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  return { id, ...doc } as ProjectRecord;
}

export async function getProjectsByUserId(userId: string): Promise<ProjectRecord[]> {
  const db = getFirestore();
  if (db) {
    const snap = await db
      .collection(COLLECTION)
      .where("userId", "==", userId)
      .get();
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ProjectRecord));
    list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return list;
  }
  return [];
}

export async function getProjectById(
  projectId: string,
  userId: string
): Promise<ProjectRecord | null> {
  const db = getFirestore();
  if (db) {
    const ref = db.collection(COLLECTION).doc(projectId);
    const snap = await ref.get();
    if (!snap.exists) return null;
    const data = snap.data() as Omit<ProjectRecord, "id">;
    if (data.userId !== userId) return null;
    return { id: snap.id, ...data };
  }
  return null;
}

export async function updateProject(
  projectId: string,
  userId: string,
  updates: Partial<
    Pick<
      ProjectRecord,
      "title" | "activeVersionId" | "referenceBoardId" | "precisionSettings" | "trendSnapshot" | "updatedAt"
    >
  >
): Promise<boolean> {
  const db = getFirestore();
  if (!db) return false;
  const ref = db.collection(COLLECTION).doc(projectId);
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
