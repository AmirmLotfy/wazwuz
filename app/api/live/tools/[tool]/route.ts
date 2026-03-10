import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { runLiveTool, type ToolName } from "@/server/services/live-tools";
import { payloadSchemas, toolEnum } from "../tool-schemas";
import { getServerAccessToken } from "@/lib/auth/server-access-token";
import { errorJson, withDeprecatedAliasHeaders } from "@/lib/api/http";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tool: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return errorJson("Unauthorized", 401, "UNAUTHORIZED");
  }
  const parsedTool = toolEnum.safeParse((await params).tool);
  if (!parsedTool.success) {
    return errorJson("Unknown tool", 400, "UNKNOWN_TOOL");
  }

  let payload: unknown = {};
  try {
    payload = await req.json();
  } catch {
    // allow empty JSON body
  }
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return errorJson("Payload must be an object", 400, "INVALID_PAYLOAD");
  }

  const tool = parsedTool.data as ToolName;
  const payloadValidation = payloadSchemas[tool].safeParse(payload);
  if (!payloadValidation.success) {
    return NextResponse.json(
      { error: "Payload validation failed", code: "PAYLOAD_VALIDATION_FAILED", details: payloadValidation.error.flatten() },
      { status: 400 }
    );
  }

  const accessToken = await getServerAccessToken(req);
  const result = await runLiveTool(tool, payloadValidation.data, { accessToken });
  if (!result.success) {
    return errorJson(result.error ?? "Tool failed", 400, "TOOL_FAILED");
  }
  return withDeprecatedAliasHeaders(
    NextResponse.json(result.data),
    "/api/live/tools"
  );
}
