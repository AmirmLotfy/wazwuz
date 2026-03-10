import "server-only";
import { getToken } from "next-auth/jwt";

export async function getServerAccessToken(req: Request): Promise<string | undefined> {
  const tokenReq = req as unknown as Parameters<typeof getToken>[0]["req"];
  const token = await getToken({
    req: tokenReq,
    secret: process.env.AUTH_SECRET,
  });
  return token?.access_token as string | undefined;
}
