export type AccessDecision =
  | { type: "allow" }
  | { type: "redirect"; location: string }
  | { type: "json"; status: number; body: Record<string, unknown> };

interface AccessInput {
  pathname: string;
  search: string;
  isAuthenticated: boolean;
}

export function decideAccess(input: AccessInput): AccessDecision {
  const { pathname, search, isAuthenticated } = input;
  const isApi = pathname.startsWith("/api");
  const isAuthRoute = pathname.startsWith("/api/auth") || pathname.startsWith("/auth");
  const isApp = pathname.startsWith("/app");
  const isSignIn = pathname === "/signin";
  const isSignInVerify = pathname === "/signin/verify";

  if (isApi && !isAuthRoute && !isAuthenticated) {
    return {
      type: "json",
      status: 401,
      body: { error: "Unauthorized", code: "UNAUTHORIZED" },
    };
  }

  if (isAuthRoute || isSignInVerify) return { type: "allow" };

  if (isApp && !isAuthenticated) {
    return {
      type: "redirect",
      location: `/signin?callbackUrl=${encodeURIComponent(`${pathname}${search}`)}`,
    };
  }

  if (isSignIn && isAuthenticated) {
    return {
      type: "redirect",
      location: "/app",
    };
  }

  return { type: "allow" };
}
