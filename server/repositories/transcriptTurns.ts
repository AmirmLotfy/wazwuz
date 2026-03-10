import { getFirestore } from "@/lib/db/firestore";
import type { TranscriptTurnRecord } from "@/types/db";

export type { TranscriptTurnRecord };

const COLLECTION = "transcriptTurns";

export async function createTranscriptTurn(
  data: Omit<TranscriptTurnRecord, "id" | "createdAt">
): Promise<TranscriptTurnRecord> {
  const db = getFirestore();
  const now = new Date().toISOString();
  const doc = { ...data, createdAt: now };
  if (db) {
    const ref = await db.collection(COLLECTION).add(doc);
    return { id: ref.id, ...doc } as TranscriptTurnRecord;
  }
  const id = `turn_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  return { id, ...doc } as TranscriptTurnRecord;
}

export async function getTranscriptTurnsByProjectId(
  projectId: string,
  userId: string,
  limit = 50
): Promise<TranscriptTurnRecord[]> {
  const db = getFirestore();
  if (db) {
    const snap = await db
      .collection(COLLECTION)
      .where("projectId", "==", projectId)
      .where("userId", "==", userId)
      .limit(limit * 2)
      .get();
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as TranscriptTurnRecord));
    list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return list.slice(-limit);
  }
  return [];
}
