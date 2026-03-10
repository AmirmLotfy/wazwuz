import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/server/repositories/versions", () => ({
  getVersionNodeById: vi.fn(),
}));

vi.mock("@/server/repositories/assets", () => ({
  getAssetById: vi.fn(),
  getAssetsByProjectId: vi.fn(),
}));

import { resolveProjectExportAsset } from "@/server/services/export-source";
import * as versionsRepo from "@/server/repositories/versions";
import * as assetsRepo from "@/server/repositories/assets";
import type { ProjectRecord } from "@/types/db";

describe("resolveProjectExportAsset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses active version asset when available", async () => {
    vi.mocked(versionsRepo.getVersionNodeById).mockResolvedValueOnce({
      id: "v1",
      projectId: "p1",
      userId: "u1",
      parentId: null,
      label: "v1",
      imageAssetId: "a2",
      createdAt: new Date().toISOString(),
    });
    vi.mocked(assetsRepo.getAssetById).mockResolvedValueOnce({
      id: "a2",
      projectId: "p1",
      userId: "u1",
      type: "generated",
      storagePath: "users/u1/projects/p1/versions/a2.png",
      mimeType: "image/png",
      createdAt: new Date().toISOString(),
    });

    const project: ProjectRecord = {
      id: "p1",
      userId: "u1",
      title: "P1",
      slug: "p1",
      sourceType: "upload",
      activeVersionId: "v1",
      referenceBoardId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const asset = await resolveProjectExportAsset(project, "u1");

    expect(asset?.id).toBe("a2");
  });

  it("falls back to latest project asset", async () => {
    vi.mocked(versionsRepo.getVersionNodeById).mockResolvedValueOnce(null);
    vi.mocked(assetsRepo.getAssetsByProjectId).mockResolvedValueOnce([
      {
        id: "a1",
        projectId: "p1",
        userId: "u1",
        type: "upload",
        storagePath: "users/u1/projects/p1/uploads/a1.png",
        mimeType: "image/png",
        createdAt: new Date().toISOString(),
      },
    ]);

    const project: ProjectRecord = {
      id: "p1",
      userId: "u1",
      title: "P1",
      slug: "p1",
      sourceType: "upload",
      activeVersionId: "v1",
      referenceBoardId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const asset = await resolveProjectExportAsset(project, "u1");

    expect(asset?.id).toBe("a1");
  });
});
