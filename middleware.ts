import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { decideAccess } from "@/lib/routing/access-policy";

export default auth((req) => {
  const decision = decideAccess({
    pathname: req.nextUrl.pathname,
    search: req.nextUrl.search,
    isAuthenticated: Boolean(req.auth),
  });

  if (decision.type === "allow") return;
  if (decision.type === "json") {
    return NextResponse.json(decision.body, { status: decision.status });
  }
  return Response.redirect(new URL(decision.location, req.nextUrl.origin));
});

export const config = {
  matcher: ["/app/:path*", "/signin", "/signin/verify", "/api/:path*"],
};
