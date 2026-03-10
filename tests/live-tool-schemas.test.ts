import { describe, expect, it } from "vitest";
import { payloadSchemas } from "@/app/api/live/tools/tool-schemas";

describe("live tool payload schemas", () => {
  it("requires versionId for branchVersion", () => {
    const parsed = payloadSchemas.branchVersion.safeParse({ projectId: "p1" });
    expect(parsed.success).toBe(false);
  });

  it("accepts valid branchVersion payload", () => {
    const parsed = payloadSchemas.branchVersion.safeParse({
      projectId: "p1",
      versionId: "v1",
    });
    expect(parsed.success).toBe(true);
  });

  it("accepts createShareLink with explicit scope", () => {
    const parsed = payloadSchemas.createShareLink.safeParse({
      fileId: "file_123",
      shareScope: "anyone",
    });
    expect(parsed.success).toBe(true);
  });
});
