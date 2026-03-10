import { describe, expect, it } from "vitest";
import { decideAccess } from "@/lib/routing/access-policy";

describe("routing access policy", () => {
  it("redirects unauthenticated app requests with callbackUrl including query", () => {
    const decision = decideAccess({
      pathname: "/app/project/abc",
      search: "?branchFrom=v1",
      isAuthenticated: false,
    });

    expect(decision.type).toBe("redirect");
    if (decision.type === "redirect") {
      expect(decision.location).toContain("/signin?callbackUrl=");
      expect(decodeURIComponent(decision.location.split("callbackUrl=")[1])).toBe(
        "/app/project/abc?branchFrom=v1"
      );
    }
  });

  it("allows public auth APIs without session", () => {
    const decision = decideAccess({
      pathname: "/api/auth/magic-link",
      search: "",
      isAuthenticated: false,
    });
    expect(decision.type).toBe("allow");
  });

  it("returns 401 json for protected APIs without session", () => {
    const decision = decideAccess({
      pathname: "/api/projects",
      search: "",
      isAuthenticated: false,
    });
    expect(decision.type).toBe("json");
    if (decision.type === "json") {
      expect(decision.status).toBe(401);
      expect(decision.body.code).toBe("UNAUTHORIZED");
    }
  });

  it("redirects authenticated sign-in page to app", () => {
    const decision = decideAccess({
      pathname: "/signin",
      search: "",
      isAuthenticated: true,
    });
    expect(decision).toEqual({ type: "redirect", location: "/app" });
  });

  it("allows verify page without auth", () => {
    const decision = decideAccess({
      pathname: "/signin/verify",
      search: "",
      isAuthenticated: false,
    });
    expect(decision.type).toBe("allow");
  });
});
