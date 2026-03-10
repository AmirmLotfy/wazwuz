import { auth } from "@/auth";
import { NextResponse } from "next/server";
import * as drive from "@/lib/drive/client";
import { getServerAccessToken } from "@/lib/auth/server-access-token";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const accessToken = await getServerAccessToken(req);
  const connected = accessToken ? await drive.validateAccessToken(accessToken) : false;
  return NextResponse.json({
    connected,
  });
}
