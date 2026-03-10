/**
 * Export preset dimensions (aspect ratio → target width x height).
 * Used for server-side resize/crop before download or Drive upload.
 */
export const EXPORT_PRESET_DIMENSIONS: Record<string, { width: number; height: number }> = {
  "1:1": { width: 1080, height: 1080 },
  "4:5": { width: 1080, height: 1350 },
  "9:16": { width: 1080, height: 1920 },
  marketplace: { width: 1080, height: 1080 },
  "web-hero": { width: 1920, height: 1080 },
};

export function getPresetDimensions(preset: string): { width: number; height: number } | null {
  const dims = EXPORT_PRESET_DIMENSIONS[preset];
  if (dims) return dims;
  const match = preset.match(/^(\d+):(\d+)$/);
  if (match) {
    const w = parseInt(match[1], 10);
    const h = parseInt(match[2], 10);
    if (w > 0 && h > 0 && w <= 4000 && h <= 4000) {
      const scale = 1080 / Math.max(w, h);
      return { width: Math.round(w * scale), height: Math.round(h * scale) };
    }
  }
  return null;
}
