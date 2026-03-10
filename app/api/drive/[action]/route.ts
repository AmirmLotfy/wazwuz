import { GET as getDriveStatus } from "@/app/api/drive/status/route";
import { GET as getDriveFolders, POST as postDriveFolders } from "@/app/api/drive/folders/route";
import { errorJson, withDeprecatedAliasHeaders } from "@/lib/api/http";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ action: string }> }
) {
  const { action } = await params;
  if (action === "status") {
    const response = await getDriveStatus(req);
    return withDeprecatedAliasHeaders(response, "/api/drive/status");
  }
  if (action === "folders") {
    const response = await getDriveFolders(req);
    return withDeprecatedAliasHeaders(response, "/api/drive/folders");
  }
  return errorJson("Unknown action", 404, "UNKNOWN_ACTION");
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ action: string }> }
) {
  const { action } = await params;
  if (action === "folders" || action === "create-folder") {
    const response = await postDriveFolders(req);
    return withDeprecatedAliasHeaders(response, "/api/drive/folders");
  }
  return errorJson("Unknown action", 404, "UNKNOWN_ACTION");
}
