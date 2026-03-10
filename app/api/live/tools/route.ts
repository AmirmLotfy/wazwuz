import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { runLiveTool } from "@/server/services/live-tools";
import { payloadSchemas, toolEnum } from "./tool-schemas";
import { getServerAccessToken } from "@/lib/auth/server-access-token";
import { errorJson } from "@/lib/api/http";

const requestSchema = z.object({
  tool: toolEnum,
  payload: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return errorJson("Unauthorized", 401, "UNAUTHORIZED");
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorJson("Invalid JSON", 400, "INVALID_JSON");
  }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", code: "VALIDATION_FAILED", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { tool, payload = {} } = parsed.data;
  const payloadSchema = payloadSchemas[tool];
  const payloadValidation = payloadSchema.safeParse(payload);
  if (!payloadValidation.success) {
    return NextResponse.json(
      { error: "Payload validation failed", code: "PAYLOAD_VALIDATION_FAILED", details: payloadValidation.error.flatten() },
      { status: 400 }
    );
  }

  const accessToken = await getServerAccessToken(req);
  const result = await runLiveTool(tool, payloadValidation.data, { accessToken });
  if (!result.success) {
    return NextResponse.json(
      { error: result.error ?? "Tool failed", code: "TOOL_FAILED" },
      { status: 400 }
    );
  }
  return NextResponse.json(result.data);
}
