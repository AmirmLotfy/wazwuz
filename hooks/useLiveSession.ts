"use client";

import { useCallback, useRef, useState } from "react";

export type LiveSessionState =
  | "disconnected"
  | "connecting"
  | "idle"
  | "listening"
  | "speaking"
  | "thinking";

export interface TranscriptTurn {
  speaker: "user" | "assistant";
  text: string;
}

export interface UseLiveSessionOptions {
  projectId: string;
  onTurnsChange?: (turns: TranscriptTurn[]) => void;
  onStateChange?: (state: LiveSessionState) => void;
}

export interface UseLiveSessionReturn {
  state: LiveSessionState;
  error: string | null;
  turns: TranscriptTurn[];
  connect: () => Promise<void>;
  disconnect: () => void;
  sendInterrupt: () => void;
  startMic: () => Promise<void>;
  stopMic: () => void;
  isMicActive: boolean;
  isConfigured: boolean;
}

export function useLiveSession({
  projectId,
  onTurnsChange,
  onStateChange,
}: UseLiveSessionOptions): UseLiveSessionReturn {
  const [state, setState] = useState<LiveSessionState>("disconnected");
  const [error, setError] = useState<string | null>(null);
  const [turns, setTurns] = useState<TranscriptTurn[]>([]);
  const [isMicActive, setIsMicActive] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);

  const sessionRef = useRef<{
    sendClientContent: (params: unknown) => void;
    sendToolResponse: (params: unknown) => void;
    sendRealtimeInput: (params: unknown) => void;
    close: () => void;
  } | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const setStateAndNotify = useCallback(
    (s: LiveSessionState) => {
      setState(s);
      onStateChange?.(s);
    },
    [onStateChange]
  );

  const appendTurn = useCallback(
    (turn: TranscriptTurn) => {
      setTurns((prev) => {
        const next = [...prev, turn];
        onTurnsChange?.(next);
        return next;
      });
    },
    [onTurnsChange]
  );

  const disconnect = useCallback(() => {
    stopMic();
    sessionRef.current?.close();
    sessionRef.current = null;
    setStateAndNotify("disconnected");
    setError(null);
  }, [setStateAndNotify]);

  const sendInterrupt = useCallback(() => {
    if (sessionRef.current) {
      try {
        sessionRef.current.sendClientContent({ parts: [{ text: "\n" }] });
      } catch {
        // ignore
      }
    }
  }, []);

  const stopMic = useCallback(() => {
    try {
      processorRef.current?.disconnect();
      processorRef.current = null;
      audioContextRef.current?.close();
      audioContextRef.current = null;
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    } finally {
      setIsMicActive(false);
      if (sessionRef.current) setStateAndNotify("idle");
    }
  }, [setStateAndNotify]);

  const startMic = useCallback(async () => {
    if (!sessionRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const ctx = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const bufferSize = 4096;
      const processor = ctx.createScriptProcessor(bufferSize, 1, 1);
      processor.onaudioprocess = (e) => {
        if (!sessionRef.current) return;
        const input = e.inputBuffer.getChannelData(0);
        const pcm = new Float32Array(input.length);
        for (let i = 0; i < input.length; i++) pcm[i] = input[i];
        const blob = new Blob([pcm.buffer], { type: "audio/pcm" });
        try {
          sessionRef.current.sendRealtimeInput({ media: blob });
        } catch {
          // ignore
        }
      };
      source.connect(processor);
      processor.connect(ctx.destination);
      processorRef.current = processor;
      setIsMicActive(true);
      setStateAndNotify("listening");
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  const connect = useCallback(async () => {
    setError(null);
    setStateAndNotify("connecting");
    try {
      const res = await fetch("/api/live/session", { method: "POST" });
      const data = await res.json();
      if (!data.configured || !data.token) {
        setError(data.message ?? "Live API not configured");
        setStateAndNotify("disconnected");
        return;
      }
      setIsConfigured(true);
      const { token, model } = data;

      const { GoogleGenAI, Modality } = await import("@google/genai/web");
      const ai = new GoogleGenAI({ apiKey: token });
      const session = await ai.live.connect({
        model,
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: {
            parts: [
              {
                text: `You are the Wazwuz creative assistant. The user is in a project (projectId: ${projectId}). When you want to perform actions (create variants, branch version, reset, compare, export, etc.), use the provided tools. Keep responses concise and creative.`,
              },
            ],
          },
          tools: [
            {
              functionDeclarations: [
                { name: "generateVariants", description: "Generate image variants from current asset", parameters: { type: "object", properties: { assetId: { type: "string" }, count: { type: "number" } } } },
                { name: "branchVersion", description: "Set current version to the specified version", parameters: { type: "object", properties: { versionId: { type: "string" } } } },
                { name: "resetToOriginal", description: "Reset project to original image" },
                { name: "compareVersions", description: "Get version list for comparison" },
                { name: "exportProject", description: "Export current image" },
              ],
            },
          ],
        },
        callbacks: {
          onopen: () => {
            setStateAndNotify("idle");
          },
          onmessage: (e: {
            setupComplete?: unknown;
            serverContent?: {
              turnComplete?: boolean;
              modelTurn?: { parts?: Array<{ text?: string }> };
            };
            toolCall?: {
              functionCalls?: Array<{
                name?: string;
                id?: string;
                args?: Record<string, unknown>;
              }>;
            };
          }) => {
            if (e.setupComplete) return;
            const sc = e.serverContent;
            if (sc?.modelTurn?.parts) {
              if (!sc.turnComplete) setStateAndNotify("speaking");
              const text = sc.modelTurn!.parts!
                .map((p) => p.text)
                .filter(Boolean)
                .join("");
              if (text) {
                appendTurn({ speaker: "assistant", text });
                fetch(`/api/projects/${projectId}/transcript`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ speaker: "assistant", text }),
                }).catch(() => {});
              }
              if (sc.turnComplete) setStateAndNotify("idle");
            } else if (sc?.turnComplete) {
              setStateAndNotify("idle");
            }
            if (e.toolCall?.functionCalls?.length) {
              setStateAndNotify("thinking");
              const calls = e.toolCall.functionCalls;
              Promise.all(
                calls.map(async (fc) => {
                  const name = fc.name ?? "";
                  const payload = (fc.args ?? {}) as Record<string, unknown>;
                  const res = await fetch("/api/live/tools", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ tool: name, payload: { ...payload, projectId } }),
                  });
                  const data = await res.json();
                  return { id: fc.id, name, response: data };
                })
              ).then((results) => {
                results.forEach((r) => {
                  try {
                    session.sendToolResponse({
                      functionResponses: [
                        {
                          id: r.id,
                          name: r.name,
                          response: r.response,
                        },
                      ],
                    });
                  } catch {
                    // ignore
                  }
                });
                setStateAndNotify("idle");
              });
            }
          },
          onerror: (e: ErrorEvent) => {
            setError(e.message ?? "Live connection error");
            setStateAndNotify("disconnected");
          },
          onclose: () => {
            sessionRef.current = null;
            setStateAndNotify("disconnected");
          },
        },
      } as unknown as Parameters<typeof ai.live.connect>[0]);

      sessionRef.current = {
        sendClientContent: (params) =>
          session.sendClientContent(
            params as unknown as Parameters<typeof session.sendClientContent>[0]
          ),
        sendToolResponse: (params) =>
          session.sendToolResponse(
            params as unknown as Parameters<typeof session.sendToolResponse>[0]
          ),
        sendRealtimeInput: (params) =>
          session.sendRealtimeInput(
            params as unknown as Parameters<typeof session.sendRealtimeInput>[0]
          ),
        close: () => session.close(),
      };
    } catch (e) {
      setError((e as Error).message);
      setStateAndNotify("disconnected");
    }
  }, [projectId, appendTurn, setStateAndNotify]);

  return {
    state,
    error,
    turns,
    connect,
    disconnect,
    sendInterrupt,
    startMic,
    stopMic,
    isMicActive,
    isConfigured,
  };
}
