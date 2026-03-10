import "server-only";
import { GoogleGenAI } from "@google/genai";
import { getImageModels } from "@/lib/ai/models";
import { fetchTrendGrounding } from "@/server/services/trend-grounding";

function getAI(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  return new GoogleGenAI({ apiKey: key });
}

export interface ResolvedTraits {
  traits: Record<string, unknown>;
  confidence: number;
  freshness?: string;
  interpretations?: string[];
  groundingSnippets?: Array<{ title: string; snippet: string; url: string }>;
}

export async function resolveStyleTerm(
  styleTerm: string,
  _projectId?: string,
  _referenceBoardId?: string
): Promise<{ traits?: ResolvedTraits; error?: string }> {
  const ai = getAI();
  if (!ai) return { error: "GEMINI_API_KEY not set" };
  const grounding = await fetchTrendGrounding(styleTerm);
  const groundingContext =
    grounding.snippets.length > 0
      ? `\nGrounding snippets (fresh context):\n${grounding.snippets
          .map((item) => `- ${item.title}: ${item.snippet} (${item.url})`)
          .join("\n")}`
      : "";

  const prompt = `Normalize this style/aesthetic term into structured traits for image generation: "${styleTerm}".
Return a JSON object with:
- "traits": object with keys like colorPalette, mood, lighting, composition, styleKeywords, aesthetic (short descriptors).
- "confidence": number 0-1 for how well the term can be interpreted.
- "freshness": optional string like "current", "timeless", "retro".
- "interpretations": optional array of 1-3 short alternative readings.
- "groundingSnippets": optional array of grounding snippets with title, snippet, url.

${groundingContext}

Reply with only the JSON, no markdown.`;

  try {
    const response = await ai.models.generateContent({
      model: getImageModels().fast,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    const text = response.text?.trim() ?? "";
    let jsonStr = text;
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) jsonStr = match[1].trim();
    const parsed = JSON.parse(jsonStr) as ResolvedTraits;
    if (!parsed.groundingSnippets || parsed.groundingSnippets.length === 0) {
      parsed.groundingSnippets = grounding.snippets;
    }
    return { traits: parsed };
  } catch (e) {
    console.error("Trend resolve error:", e);
    return { error: (e as Error).message };
  }
}
