import sharp from "sharp";
import { getPresetDimensions } from "./presets";

/**
 * Resize and center-crop image buffer to the given export preset.
 * Returns JPEG buffer and "image/jpeg" for consistent output; preserves aspect by cropping.
 */
export async function resizeToPreset(
  inputBuffer: Buffer,
  inputMime: string,
  preset: string
): Promise<{ buffer: Buffer; mimeType: string }> {
  const dims = getPresetDimensions(preset);
  if (!dims) {
    return { buffer: inputBuffer, mimeType: inputMime };
  }
  const pipeline = sharp(inputBuffer);
  const meta = await pipeline.metadata();
  const w = meta.width ?? 1;
  const h = meta.height ?? 1;
  const targetAspect = dims.width / dims.height;
  const currentAspect = w / h;
  let cropW = w;
  let cropH = h;
  if (currentAspect > targetAspect) {
    cropW = Math.round(h * targetAspect);
  } else if (currentAspect < targetAspect) {
    cropH = Math.round(w / targetAspect);
  }
  const left = Math.max(0, Math.floor((w - cropW) / 2));
  const top = Math.max(0, Math.floor((h - cropH) / 2));
  const buffer = await sharp(inputBuffer)
    .extract({ left, top, width: cropW, height: cropH })
    .resize(dims.width, dims.height)
    .jpeg({ quality: 90 })
    .toBuffer();
  return { buffer, mimeType: "image/jpeg" };
}
