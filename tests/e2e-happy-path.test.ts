import { describe, it, expect } from "vitest";

const baseUrl = process.env.E2E_BASE_URL;
const e2eRequired = process.env.E2E_REQUIRED === "true";

describe("e2e happy path smoke", () => {
  it("fails explicitly when E2E is required but no base URL is set", () => {
    if (e2eRequired) {
      expect(baseUrl, "Set E2E_BASE_URL when E2E_REQUIRED=true").toBeTruthy();
    }
  });

  it.skipIf(!baseUrl)("serves core public and guarded routes", async () => {
    const home = await fetch(`${baseUrl}/`);
    expect(home.status).toBeLessThan(500);

    const signin = await fetch(`${baseUrl}/signin`);
    expect(signin.status).toBeLessThan(500);

    const app = await fetch(`${baseUrl}/app`, { redirect: "manual" });
    expect([302, 307, 308]).toContain(app.status);
    const location = app.headers.get("location") ?? "";
    expect(location).toContain("/signin");
  });
});
