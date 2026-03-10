import "server-only";
import type { AssetRecord } from "@/types/db";
import * as assetsRepo from "@/server/repositories/assets";
import * as versionsRepo from "@/server/repositories/versions";
import type { ProjectRecord } from "@/types/db";

export async function resolveProjectExportAsset(
  project: ProjectRecord,
  userId: string
): Promise<AssetRecord | null> {
  if (project.activeVersionId) {
    const activeVersion = await versionsRepo.getVersionNodeById(
      project.activeVersionId,
      userId
    );
    if (activeVersion?.imageAssetId) {
      const versionAsset = await assetsRepo.getAssetById(
        activeVersion.imageAssetId,
        userId
      );
      if (versionAsset && versionAsset.projectId === project.id) {
        return versionAsset;
      }
    }
  }

  const fallbackAsset = (await assetsRepo.getAssetsByProjectId(project.id, userId))[0];
  return fallbackAsset ?? null;
}
