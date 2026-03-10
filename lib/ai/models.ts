/**
 * Server-only AI model configuration.
 * All model IDs are env-driven; do not hardcode in app code.
 * Defaults follow implementation plan; do NOT use gemini-3-pro-preview (use gemini-3.1-pro-preview for reasoning).
 */
export function getLiveModel(): string {
  return process.env.LIVE_MODEL ?? "gemini-2.0-flash-exp";
}

export function getImageModels() {
  return {
    fast:
      process.env.IMAGE_FAST_MODEL ??
      "gemini-3.1-flash-image-preview",
    pro:
      process.env.IMAGE_PRO_MODEL ??
      "gemini-3-pro-image-preview",
    reasoning:
      process.env.REASONING_MODEL ?? "gemini-3.1-pro-preview",
  };
}
