import "server-only";
import { GoogleGenAI } from "@google/genai";
import type { ReferenceItemRecord } from "@/types/db";
import * as assetsRepo from "@/server/repositories/assets";
import { getStorage, getBucketName } from "@/lib/storage/gcs";
import { getImageModels } from "@/lib/ai/models";

function getAI(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  return new GoogleGenAI({ apiKey: key });
}

export async function analyzeReferenceBoard(
  _boardId: string,
  userId: string,
  projectId: string,
  items: ReferenceItemRecord[]
): Promise<{ traits?: Record<string, unknown>; error?: string }> {
  const ai = getAI();
  if (!ai) return { error: "GEMINI_API_KEY not set" };

  const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string | Uint8Array } }> = [];
  const notes: string[] = [];

  for (const item of items) {
    if (item.note) notes.push(`[Item ${item.type}]: ${item.note}`);
    if (item.assetId) {
      const asset = await assetsRepo.getAssetById(item.assetId, userId);
      if (!asset || asset.projectId !== projectId) continue;
      const storage = getStorage();
      const bucketName = getBucketName();
      if (!storage || !bucketName) continue;
      try {
        const [buffer] = await storage.bucket(bucketName).file(asset.storagePath).download();
        parts.push({
          inlineData: {
            mimeType: asset.mimeType,
            data: Buffer.from(buffer).toString("base64"),
          },
        });
      } catch {
        // skip failed download
      }
    }
  }

  if (parts.length === 0 && notes.length === 0) {
    return { traits: {}, error: undefined };
  }

  const notesBlock = notes.length > 0
    ? `\nNotes from the board:\n${notes.join("\n")}`
    : "";

  parts.push({
    text: `Analyze these reference images and any notes. Extract visual and style traits that could guide image generation: colors, mood, composition, style keywords, lighting, aesthetic. Return a single JSON object with keys like colorPalette, mood, style, lighting, composition, keywords. Keep it concise.${notesBlock}`,
  });

  try {
    const response = await ai.models.generateContent({
      model: getImageModels().fast,
      contents: [{ role: "user", parts }],
    } as unknown as Parameters<typeof ai.models.generateContent>[0]);
    const text = response.text?.trim() ?? "";
    // Try to parse JSON from the response (might be wrapped in markdown code block)
    let jsonStr = text;
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) jsonStr = match[1].trim();
    const traits = JSON.parse(jsonStr) as Record<string, unknown>;
    return { traits };
  } catch (e) {
    console.error("Reference board analysis error:", e);
    return { error: (e as Error).message };
  }
}
