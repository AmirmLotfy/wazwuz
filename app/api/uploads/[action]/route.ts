import { POST as uploadPost } from "@/app/api/uploads/route";
import { errorJson, withDeprecatedAliasHeaders } from "@/lib/api/http";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ action: string }> }
) {
  const { action } = await params;
  if (action === "file" || action === "ingest") {
    const response = await uploadPost(req);
    return withDeprecatedAliasHeaders(response, "/api/uploads");
  }
  return errorJson("Unknown action", 404, "UNKNOWN_ACTION");
}
