import "server-only";
import { GoogleGenAI } from "@google/genai";
import { getImageModels } from "@/lib/ai/models";

let _ai: GoogleGenAI | null = null;

function getAI(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  if (!_ai) _ai = new GoogleGenAI({ apiKey: key });
  return _ai;
}

function extractImageParts(response: unknown): Array<{ mimeType: string; data: Uint8Array }> {
  const candidateContainer = response as {
    candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { mimeType?: string; data?: string | Uint8Array } }> } }>;
  };
  const parts = candidateContainer.candidates?.[0]?.content?.parts ?? [];
  return parts
    .map((p) => p.inlineData)
    .filter((inlineData): inlineData is { mimeType?: string; data: string | Uint8Array } =>
      Boolean(inlineData?.data)
    )
    .map((inlineData) => ({
      mimeType: inlineData.mimeType ?? "image/png",
      data:
        typeof inlineData.data === "string"
          ? Uint8Array.from(Buffer.from(inlineData.data, "base64"))
          : inlineData.data,
    }));
}

export async function generateVariantsFromImage(
  imageBuffer: Buffer,
  mimeType: string,
  prompt: string,
  _count: number
): Promise<{ text?: string; imageParts?: Array<{ mimeType: string; data: Uint8Array }> }> {
  const ai = getAI();
  if (!ai) return { text: "GEMINI_API_KEY not set" };
  const models = getImageModels();
  try {
    const response = await ai.models.generateContent({
      model: models.fast,
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType,
                data: imageBuffer.toString("base64"),
              },
            },
            {
              text: `${prompt}. Generate variant(s) as images if the model supports image output; otherwise describe the variants.`,
            },
          ],
        },
      ],
    } as unknown as Parameters<typeof ai.models.generateContent>[0]);
    const text = response.text ?? undefined;
    const imageParts = extractImageParts(response);
    return { text, imageParts };
  } catch (e) {
    console.error("Gemini generateVariants error:", e);
    throw e;
  }
}

export async function applyEditToImage(
  imageBuffer: Buffer,
  mimeType: string,
  editPrompt: string
): Promise<{ text?: string; imageParts?: Array<{ mimeType: string; data: Uint8Array }> }> {
  const ai = getAI();
  if (!ai) return { text: "GEMINI_API_KEY not set" };
  const models = getImageModels();
  try {
    const response = await ai.models.generateContent({
      model: models.fast,
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType, data: imageBuffer.toString("base64") } },
            { text: `Apply this edit: ${editPrompt}. Return the edited image if the model supports image output.` },
          ],
        },
      ],
    } as unknown as Parameters<typeof ai.models.generateContent>[0]);
    const text = response.text ?? undefined;
    const imageParts = extractImageParts(response);
    return { text, imageParts };
  } catch (e) {
    console.error("Gemini applyEdit error:", e);
    throw e;
  }
}

export async function composeImages(
  subjectBuffer: Buffer,
  subjectMime: string,
  options: {
    backgroundBuffer?: Buffer;
    backgroundMime?: string;
    moodBuffer?: Buffer;
    moodMime?: string;
    priorityMode?: string;
  }
): Promise<{ text?: string; imageParts?: Array<{ mimeType: string; data: Uint8Array }> }> {
  const ai = getAI();
  if (!ai) return { text: "GEMINI_API_KEY not set" };
  const models = getImageModels();
  const parts: Array<{ inlineData?: { mimeType: string; data: string }; text?: string }> = [
    { inlineData: { mimeType: subjectMime, data: subjectBuffer.toString("base64") } },
  ];
  if (options.backgroundBuffer && options.backgroundMime) {
    parts.push({
      inlineData: { mimeType: options.backgroundMime, data: options.backgroundBuffer.toString("base64") },
    });
  }
  if (options.moodBuffer && options.moodMime) {
    parts.push({
      inlineData: { mimeType: options.moodMime, data: options.moodBuffer.toString("base64") },
    });
  }
  const priority = options.priorityMode ?? "balanced";
  parts.push({
    text: `Compose these images into a single cohesive image. First image is the subject/focus. ${options.backgroundBuffer ? "Second image is the background - integrate it." : ""} ${options.moodBuffer ? "Third image sets the mood/aesthetic - apply its feel." : ""} Priority mode: ${priority}. Output the composed result as an image.`,
  });
  try {
    const response = await ai.models.generateContent({
      model: models.fast,
      contents: [{ role: "user", parts }],
    } as unknown as Parameters<typeof ai.models.generateContent>[0]);
    const text = response.text ?? undefined;
    const imageParts = extractImageParts(response);
    return { text, imageParts };
  } catch (e) {
    console.error("Gemini composeImages error:", e);
    throw e;
  }
}

export async function applyStyleFromReference(
  referenceBuffer: Buffer,
  referenceMime: string,
  contentBuffer: Buffer,
  contentMime: string
): Promise<{ text?: string; imageParts?: Array<{ mimeType: string; data: Uint8Array }> }> {
  const ai = getAI();
  if (!ai) return { text: "GEMINI_API_KEY not set" };
  const models = getImageModels();
  try {
    const response = await ai.models.generateContent({
      model: models.fast,
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: referenceMime, data: referenceBuffer.toString("base64") } },
            { text: "This is the style reference." },
            { inlineData: { mimeType: contentMime, data: contentBuffer.toString("base64") } },
            {
              text: "Apply the style/aesthetic of the first image to the second image. Output the result as an image.",
            },
          ],
        },
      ],
    } as unknown as Parameters<typeof ai.models.generateContent>[0]);
    const text = response.text ?? undefined;
    const imageParts = extractImageParts(response);
    return { text, imageParts };
  } catch (e) {
    console.error("Gemini applyStyleFromReference error:", e);
    throw e;
  }
}
