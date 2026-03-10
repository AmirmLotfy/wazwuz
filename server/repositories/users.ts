import { getFirestore } from "@/lib/db/firestore";
import type { UserRecord } from "@/types/db";

const COLLECTION = "users";

export async function createOrUpdateUser(
  id: string,
  data: {
    email: string | null;
    name: string | null;
    avatarUrl: string | null;
    preferences?: Record<string, unknown>;
    driveConnectionMeta?: Record<string, unknown>;
  }
): Promise<UserRecord> {
  const db = getFirestore();
  const now = new Date().toISOString();
  const doc = {
    email: data.email,
    name: data.name,
    avatarUrl: data.avatarUrl,
    createdAt: now,
    updatedAt: now,
    ...(data.preferences && { preferences: data.preferences }),
    ...(data.driveConnectionMeta && { driveConnectionMeta: data.driveConnectionMeta }),
  };
  if (db) {
    const ref = db.collection(COLLECTION).doc(id);
    const snap = await ref.get();
    if (snap.exists) {
      const existing = snap.data() as Omit<UserRecord, "id">;
      const updateDoc = {
        email: data.email,
        name: data.name,
        avatarUrl: data.avatarUrl,
        ...(data.preferences && { preferences: data.preferences }),
        ...(data.driveConnectionMeta && { driveConnectionMeta: data.driveConnectionMeta }),
        updatedAt: now,
      };
      await ref.update(updateDoc);
      return { id, ...existing, ...updateDoc } as UserRecord;
    }
    await ref.set(doc);
    return { id, ...doc } as UserRecord;
  }
  return { id, ...doc } as UserRecord;
}

export async function getUserById(id: string): Promise<UserRecord | null> {
  const db = getFirestore();
  if (db) {
    const snap = await db.collection(COLLECTION).doc(id).get();
    if (!snap.exists) return null;
    return { id: snap.id, ...snap.data() } as UserRecord;
  }
  return null;
}

export async function updateUserPreferences(
  id: string,
  preferences: Record<string, unknown>
): Promise<boolean> {
  const db = getFirestore();
  if (!db) return false;
  const ref = db.collection(COLLECTION).doc(id);
  await ref.update({
    preferences,
    updatedAt: new Date().toISOString(),
  });
  return true;
}
