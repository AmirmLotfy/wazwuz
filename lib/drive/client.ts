/**
 * Server-only Google Drive API client using OAuth access token.
 * Use with a server-side OAuth access token (Google sign-in only).
 */

const DRIVE_API = "https://www.googleapis.com/drive/v3";
const DRIVE_UPLOAD = "https://www.googleapis.com/upload/drive/v3/files";

export async function validateAccessToken(accessToken: string): Promise<boolean> {
  const res = await fetch(`${DRIVE_API}/about?fields=user(emailAddress)`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.ok;
}

export async function createFolder(
  accessToken: string,
  name: string,
  parentId?: string
): Promise<{ id: string; webViewLink?: string } | null> {
  const body = {
    name,
    mimeType: "application/vnd.google-apps.folder",
    ...(parentId && { parents: [parentId] }),
  };
  const res = await fetch(DRIVE_API + "/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { id: string; webViewLink?: string };
  return { id: data.id, webViewLink: data.webViewLink };
}

export async function listFolders(
  accessToken: string,
  pageSize = 20
): Promise<{ id: string; name: string }[]> {
  const q = "mimeType='application/vnd.google-apps.folder' and trashed=false";
  const res = await fetch(
    `${DRIVE_API}/files?q=${encodeURIComponent(q)}&pageSize=${pageSize}&fields=files(id,name)`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!res.ok) return [];
  const data = (await res.json()) as { files?: { id: string; name: string }[] };
  return data.files ?? [];
}

export async function uploadFile(
  accessToken: string,
  buffer: Buffer,
  mimeType: string,
  filename: string,
  folderId?: string
): Promise<{ id: string; webViewLink?: string } | null> {
  const createRes = await fetch(DRIVE_API + "/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: filename,
      mimeType,
      ...(folderId && { parents: [folderId] }),
    }),
  });
  if (!createRes.ok) return null;
  const file = (await createRes.json()) as { id: string };
  const patchRes = await fetch(`${DRIVE_UPLOAD}/${file.id}?uploadType=media`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": mimeType,
    },
    body: new Uint8Array(buffer),
  });
  if (!patchRes.ok) return null;
  return { id: file.id };
}

async function getFileWebViewLink(accessToken: string, fileId: string): Promise<string | null> {
  const metaRes = await fetch(
    `${DRIVE_API}/files/${fileId}?fields=webViewLink`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!metaRes.ok) return null;
  const data = (await metaRes.json()) as { webViewLink?: string };
  return data.webViewLink ?? `https://drive.google.com/file/d/${fileId}/view`;
}

/** Create a share link with explicit scope control. */
export async function createShareLink(
  accessToken: string,
  fileId: string,
  scope: "restricted" | "anyone" = "restricted"
): Promise<string | null> {
  if (scope === "restricted") {
    return getFileWebViewLink(accessToken, fileId);
  }

  const res = await fetch(DRIVE_API + "/files/" + fileId + "/permissions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "anyone",
      role: "reader",
    }),
  });
  if (!res.ok) return null;
  return getFileWebViewLink(accessToken, fileId);
}
