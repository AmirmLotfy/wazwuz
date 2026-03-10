import { describe, it, expect } from "vitest";
import { z } from "zod";

const createProjectSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  sourceType: z.enum(["upload", "camera", "mixed"]).default("upload"),
  assetIds: z.array(z.string()).optional(),
});

describe("createProjectSchema", () => {
  it("accepts valid payload with title and sourceType", () => {
    const result = createProjectSchema.safeParse({
      title: "My project",
      sourceType: "upload",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("My project");
      expect(result.data.sourceType).toBe("upload");
    }
  });

  it("defaults sourceType to upload", () => {
    const result = createProjectSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sourceType).toBe("upload");
    }
  });

  it("rejects invalid sourceType", () => {
    const result = createProjectSchema.safeParse({
      sourceType: "invalid",
    });
    expect(result.success).toBe(false);
  });
});
