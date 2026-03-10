import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { createLiveEphemeralToken } from "@/server/services/live-session";
import { errorJson } from "@/lib/api/http";

export async function POST() {
  const session = await auth();
  if (!session?.user?.email) {
    return errorJson("Unauthorized", 401, "UNAUTHORIZED");
  }

  const result = await createLiveEphemeralToken();

  if (result.error) {
    return NextResponse.json(
      {
        error: result.error,
        code: "LIVE_SESSION_NOT_CONFIGURED",
        configured: false,
        model: result.model,
        message: result.error,
        sessionUrl: null,
        token: null,
      },
      { status: 503 }
    );
  }

  return NextResponse.json({
    configured: true,
    model: result.model,
    token: result.token,
    sessionUrl: null,
    message:
      "Use token with Live API WebSocket; tool calls go to POST /api/live/tools.",
  });
}
