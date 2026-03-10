import { Storage } from "@google-cloud/storage";

let _storage: Storage | null = null;

export function getStorage(): Storage | null {
  if (process.env.GCS_BUCKET_NAME && process.env.GCP_PROJECT_ID) {
    if (!_storage) {
      _storage = new Storage({ projectId: process.env.GCP_PROJECT_ID });
    }
    return _storage;
  }
  return null;
}

export function getBucketName(): string | null {
  return process.env.GCS_BUCKET_NAME ?? null;
}

/** Path: users/{userId}/projects/{projectId}/uploads/{filename} */
export function uploadPath(
  userId: string,
  projectId: string,
  filename: string
): string {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `users/${userId}/projects/${projectId}/uploads/${Date.now()}_${safe}`;
}

/** Path: users/{userId}/projects/{projectId}/versions/{filename} */
export function versionPath(
  userId: string,
  projectId: string,
  filename: string
): string {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `users/${userId}/projects/${projectId}/versions/${Date.now()}_${safe}`;
}

/** Path: users/{userId}/projects/{projectId}/references/{filename} */
export function referencePath(
  userId: string,
  projectId: string,
  filename: string
): string {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `users/${userId}/projects/${projectId}/references/${Date.now()}_${safe}`;
}
