import "server-only";
import { GoogleGenAI } from "@google/genai";
import { getLiveModel } from "@/lib/ai/models";

/**
 * Create an ephemeral auth token for the Gemini Live API.
 * Client uses this token (as access_token) to connect to the Live WebSocket.
 * Only supported in Gemini Developer API (v1alpha).
 */
export async function createLiveEphemeralToken(): Promise<{
  token: string;
  model: string;
  error?: string;
}> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = getLiveModel();

  if (!apiKey) {
    return { token: "", model, error: "GEMINI_API_KEY not set" };
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { apiVersion: "v1alpha" },
    });

    const now = new Date();
    const expireTime = new Date(now.getTime() + 30 * 60 * 1000).toISOString();
    const newSessionExpireTime = new Date(now.getTime() + 1 * 60 * 1000).toISOString();

    const authToken = await ai.authTokens.create({
      config: {
        uses: 1,
        expireTime,
        newSessionExpireTime,
        liveConnectConstraints: {
          model,
        },
      },
    });

    const token = authToken.name ?? "";
    if (!token) {
      return { token: "", model, error: "Empty token from API" };
    }
    return { token, model };
  } catch (e) {
    console.error("Live ephemeral token error:", e);
    return {
      token: "",
      model,
      error: (e as Error).message,
    };
  }
}
