import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import * as drive from "@/lib/drive/client";
import { getServerAccessToken } from "@/lib/auth/server-access-token";

const schema = z.object({
  name: z.string().min(1).max(200),
  parentId: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const accessToken = await getServerAccessToken(req);
  if (!accessToken) {
    return NextResponse.json(
      { error: "Connect Google Drive (sign in with Google) to create folders." },
      { status: 400 }
    );
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const folder = await drive.createFolder(
    accessToken,
    parsed.data.name,
    parsed.data.parentId
  );
  if (!folder) {
    return NextResponse.json({ error: "Failed to create folder" }, { status: 500 });
  }
  return NextResponse.json({ folder: { id: folder.id, webViewLink: folder.webViewLink } });
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const accessToken = await getServerAccessToken(req);
  if (!accessToken) {
    return NextResponse.json({ folders: [] });
  }
  const folders = await drive.listFolders(accessToken);
  return NextResponse.json({ folders });
}
