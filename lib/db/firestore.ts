import { Firestore } from "@google-cloud/firestore";

let _db: Firestore | null = null;

export function getFirestore(): Firestore | null {
  if (process.env.GCP_PROJECT_ID) {
    if (!_db) {
      _db = new Firestore({
        projectId: process.env.GCP_PROJECT_ID,
        databaseId: process.env.FIRESTORE_DATABASE_ID ?? "(default)",
      });
    }
    return _db;
  }
  return null;
}
