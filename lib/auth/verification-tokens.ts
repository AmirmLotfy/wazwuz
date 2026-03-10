import { getFirestore } from "@/lib/db/firestore";

const COLLECTION = "verification_tokens";
const EXPIRY_MS = 24 * 60 * 60 * 1000;

const memoryStore = new Map<string, { identifier: string; expires: number }>();

export async function createVerificationToken(
  identifier: string,
  token: string
): Promise<void> {
  const expires = Date.now() + EXPIRY_MS;
  const db = getFirestore();
  if (db) {
    await db.collection(COLLECTION).doc(token).set({
      identifier,
      expires: new Date(expires),
    });
  } else {
    memoryStore.set(token, { identifier, expires });
  }
}

export async function useVerificationToken(
  token: string
): Promise<string | null> {
  const db = getFirestore();
  if (db) {
    const ref = db.collection(COLLECTION).doc(token);
    const snap = await ref.get();
    if (!snap.exists) return null;
    const data = snap.data();
    if (!data) return null;
    const expires = data.expires?.toDate?.() ?? data.expires;
    const expiresMs = expires instanceof Date ? expires.getTime() : 0;
    if (expiresMs < Date.now()) return null;
    await ref.delete();
    return data.identifier as string;
  }
  const entry = memoryStore.get(token);
  if (!entry || entry.expires < Date.now()) return null;
  memoryStore.delete(token);
  return entry.identifier;
}

export function createToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
