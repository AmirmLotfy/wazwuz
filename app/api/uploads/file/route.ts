import { POST as uploadPost } from "@/app/api/uploads/route";
import { withDeprecatedAliasHeaders } from "@/lib/api/http";

export async function POST(req: Request) {
  const response = await uploadPost(req);
  return withDeprecatedAliasHeaders(response, "/api/uploads");
}
