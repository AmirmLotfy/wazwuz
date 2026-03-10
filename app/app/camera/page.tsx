"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

const FACING_MODES = [
  { value: "environment", label: "Back" },
  { value: "user", label: "Front" },
] as const;

const OUTPUT_CHIPS = [
  { id: "4:5", label: "4:5" },
  { id: "9:16", label: "9:16" },
  { id: "product", label: "Product" },
  { id: "beauty", label: "Beauty" },
  { id: "marketplace", label: "Marketplace" },
] as const;

const DIRECTION_CHIPS = [
  { id: "cleaner", label: "Cleaner" },
  { id: "trendier", label: "Trendier" },
  { id: "premium", label: "Premium" },
  { id: "softer", label: "Softer light" },
] as const;

export default function CameraPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [captured, setCaptured] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [outputTarget, setOutputTarget] = useState("4:5");
  const [direction, setDirection] = useState<string | null>(null);
  const [saveToExistingProjectId, setSaveToExistingProjectId] = useState<string>("");

  const { data: projectsData } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("Failed to fetch projects");
      return res.json() as Promise<{ projects: { id: string; title: string }[] }>;
    },
  });
  const projects = projectsData?.projects ?? [];

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch {
      setError("Camera access denied or unavailable.");
    }
  }, [facingMode]);

  useEffect(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      startCamera();
    }
  }, [facingMode]);

  function stopCamera() {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  function capture() {
    if (!videoRef.current || !stream) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0);
    setCaptured(canvas.toDataURL("image/jpeg", 0.9));
  }

  async function saveToProject() {
    if (!captured) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(captured);
      const blob = await res.blob();
      const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
      const form = new FormData();
      form.set("file", file);
      form.set("outputTarget", outputTarget);
      if (direction) form.set("direction", direction);
      if (saveToExistingProjectId) form.set("projectId", saveToExistingProjectId);
      const uploadRes = await fetch("/api/uploads", { method: "POST", body: form });
      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}));
        throw new Error(err.error ?? uploadRes.statusText);
      }
      const data = await uploadRes.json();
      if (data.projectId) router.push(`/app/project/${data.projectId}`);
      else router.push("/app");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl sm:text-4xl font-bold">Camera</h1>
        <Link
          href="/app"
          className="font-mono text-xs uppercase tracking-widest text-slate-400 hover:text-primary"
        >
          Back to app
        </Link>
      </div>
      {error && (
        <p className="mb-4 p-4 rounded-xl bg-accent-coral/10 border border-accent-coral/30 text-accent-coral">
          {error}
        </p>
      )}
      {!stream && !captured && (
        <button
          type="button"
          onClick={startCamera}
          className="w-full aspect-video rounded-2xl border-2 border-dashed border-border-muted bg-surface flex items-center justify-center gap-3 text-slate-400 hover:border-primary/50 hover:text-primary transition-colors"
        >
          Start camera
        </button>
      )}
      {stream && !captured && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="font-mono text-[10px] uppercase text-slate-500">Camera</span>
            {FACING_MODES.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFacingMode(f.value)}
                className={`px-3 py-1.5 rounded-lg font-mono text-xs uppercase border ${
                  facingMode === f.value ? "border-primary bg-primary/10 text-primary" : "border-white/10 bg-surface"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-background-dark border border-border-muted">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3">
              <div className="border-r border-white/20" />
              <div className="border-r border-white/20" />
              <div />
              <div className="border-r border-white/20" />
              <div className="border-r border-white/20" />
              <div />
              <div className="border-r border-white/20" />
              <div className="border-r border-white/20" />
              <div />
            </div>
            <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-3">
              <div className="flex gap-2 flex-wrap justify-center">
                {OUTPUT_CHIPS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setOutputTarget(c.id)}
                    className={`px-3 py-1.5 rounded-lg font-mono text-[10px] uppercase border ${
                      outputTarget === c.id ? "border-primary bg-primary/10 text-primary" : "border-white/10 bg-surface/80"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 flex-wrap justify-center">
                {DIRECTION_CHIPS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setDirection(direction === c.id ? null : c.id)}
                    className={`px-3 py-1.5 rounded-lg font-mono text-[10px] uppercase border ${
                      direction === c.id ? "border-primary bg-primary/10 text-primary" : "border-white/10 bg-surface/80"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-4 py-2 rounded-xl bg-surface border border-white/10 text-sm font-medium"
                >
                  Stop
                </button>
                <button
                  type="button"
                  onClick={capture}
                  className="size-14 rounded-full bg-primary text-background-dark flex items-center justify-center font-bold shadow-lg"
                >
                  Capture
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {captured && (
        <div className="space-y-4">
          <img
            src={captured}
            alt="Captured"
            className="w-full aspect-video object-contain rounded-2xl border border-border-muted bg-surface"
          />
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-mono text-[10px] uppercase text-slate-500">Save to</span>
            <select
              value={saveToExistingProjectId}
              onChange={(e) => setSaveToExistingProjectId(e.target.value)}
              className="bg-surface border border-white/10 rounded-lg px-4 py-2 font-mono text-sm min-w-[200px]"
            >
              <option value="">New project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-4">
            <button
              type="button"
              onClick={saveToProject}
              disabled={saving}
              className="px-6 py-3 bg-primary text-background-dark font-display font-bold rounded-xl hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save to project"}
            </button>
            <button
              type="button"
              onClick={() => { setCaptured(null); startCamera(); }}
              className="px-4 py-2 rounded-xl bg-surface border border-white/10 text-sm"
            >
              Capture again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
