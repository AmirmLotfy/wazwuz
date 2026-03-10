"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useLiveSession } from "@/hooks/useLiveSession";
import { PrecisionControlStrip } from "@/components/wazwuz/precision-control-strip";

interface Project {
  id: string;
  title: string;
  slug: string;
  sourceType: string;
  activeVersionId: string | null;
  referenceBoardId: string | null;
  precisionSettings?: Record<string, number>;
  createdAt: string;
}
interface Asset {
  id: string;
  projectId: string;
  type: string;
  storagePath: string;
  mimeType: string;
  createdAt: string;
}
interface Version {
  id: string;
  parentId: string | null;
  label: string;
  summary?: string;
  imageAssetId: string;
  createdAt: string;
}

export default function ProjectStudioPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = params.projectId as string;
  const queryClient = useQueryClient();

  const {
    state: liveState,
    error: liveError,
    turns: liveTurns,
    connect,
    disconnect,
    sendInterrupt,
    startMic,
    stopMic,
    isMicActive,
    isConfigured,
  } = useLiveSession({
    projectId,
    onStateChange: (s) => {
      if (s === "idle") {
        queryClient.invalidateQueries({ queryKey: ["project-full", projectId] });
        queryClient.invalidateQueries({ queryKey: ["transcript", projectId] });
      }
    },
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["project-full", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/full`);
      if (!res.ok) throw new Error("Failed to load project");
      return res.json() as Promise<{
        project: Project;
        assets: Asset[];
        versions: Version[];
      }>;
    },
  });

  const { data: transcriptData } = useQuery({
    queryKey: ["transcript", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/transcript`);
      if (!res.ok) return { turns: [] };
      return res.json() as Promise<{ turns: Array<{ speaker: string; text: string; createdAt: string }> }>;
    },
  });
  const serverTurns = transcriptData?.turns ?? [];
  const turns = liveState !== "disconnected" && liveTurns.length > 0
    ? liveTurns.map((t) => ({ speaker: t.speaker, text: t.text }))
    : serverTurns;

  const [runningTool, setRunningTool] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [showLeftRail, setShowLeftRail] = useState(false);
  const [showRightRail, setShowRightRail] = useState(false);

  const branchFrom = searchParams.get("branchFrom");

  useEffect(() => {
    let cancelled = false;
    async function branchFromQuery() {
      if (!branchFrom) return;
      const res = await fetch("/api/live/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "branchVersion",
          payload: { projectId, versionId: branchFrom },
        }),
      });
      if (!cancelled) {
        if (!res.ok) {
          const out = await res.json().catch(() => ({}));
          setActionError(out.error ?? "Failed to branch from selected version.");
        } else {
          await queryClient.invalidateQueries({ queryKey: ["project-full", projectId] });
        }
        router.replace(`/app/project/${projectId}`);
      }
    }
    void branchFromQuery();
    return () => {
      cancelled = true;
    };
  }, [branchFrom, projectId, queryClient, router]);

  async function runTool(tool: string, extraPayload?: Record<string, unknown>) {
    setRunningTool(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const payload = {
        projectId,
        versionId: data?.project?.activeVersionId,
        ...extraPayload,
      };
      if (tool === "generateVariants") {
        const currentAssetId =
          data?.project?.activeVersionId != null
            ? versions.find((v) => v.id === data.project?.activeVersionId)?.imageAssetId
            : undefined;
        const assetId = currentAssetId ?? data?.assets?.[0]?.id;
        if (assetId) {
          const res = await fetch(`/api/projects/${projectId}/variants`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              assetId,
              count: 3,
              precisionSettings: project.precisionSettings,
            }),
          });
          if (res.ok) {
            await queryClient.invalidateQueries({ queryKey: ["project-full", projectId] });
            setActionSuccess("Variants generated.");
          } else {
            const out = await res.json().catch(() => ({}));
            setActionError(out.error ?? "Failed to generate variants.");
          }
        }
        return;
      }
      if (tool === "applyEdit" && extraPayload?.prompt) {
        const res = await fetch("/api/live/tools", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tool: "applyEdit", payload }),
        });
        if (res.ok) {
          await queryClient.invalidateQueries({ queryKey: ["project-full", projectId] });
          setActionSuccess("Edit applied.");
        } else {
          const out = await res.json().catch(() => ({}));
          setActionError(out.error ?? "Failed to apply edit.");
        }
        return;
      }
      if (tool === "branchVersion" && !payload.versionId) {
        setActionError("No active version selected to branch.");
        return;
      }
      const res = await fetch("/api/live/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool, payload }),
      });
      if (!res.ok) {
        const out = await res.json().catch(() => ({}));
        setActionError(out.error ?? "Action failed.");
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["project-full", projectId] });
      setActionSuccess("Action completed.");
    } finally {
      setRunningTool(false);
    }
  }

  async function runMatchReference() {
    const boardId = project.referenceBoardId;
    if (!boardId) {
      window.location.href = `/app/project/${projectId}/references`;
      return;
    }
    setRunningTool(true);
    try {
      const boardRes = await fetch(`/api/projects/${projectId}/references/${boardId}`);
      if (!boardRes.ok) return;
      const { board } = (await boardRes.json()) as { board: { extractedTraits?: Record<string, unknown> } };
      const traits = board?.extractedTraits ?? {};
      const res = await fetch(`/api/projects/${projectId}/trend/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ traits, mode: "full" }),
      });
      if (res.ok) await queryClient.invalidateQueries({ queryKey: ["project-full", projectId] });
    } finally {
      setRunningTool(false);
    }
  }

  const isBusy = runningTool || liveState === "thinking";

  function handleMicClick() {
    if (liveState === "disconnected") {
      connect();
    } else if (isMicActive) {
      stopMic();
    } else {
      startMic();
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <span className="font-mono text-slate-500">Loading project…</span>
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <p className="text-accent-coral mb-4">{(error as Error)?.message ?? "Not found"}</p>
        <Link href="/app/library" className="text-primary font-mono text-sm uppercase">
          Back to Library
        </Link>
      </div>
    );
  }

  const { project, assets, versions } = data;
  const activeVersion = project.activeVersionId
    ? versions.find((v) => v.id === project.activeVersionId)
    : null;
  const displayAssetId = activeVersion?.imageAssetId ?? assets[0]?.id;
  const imageUrl = displayAssetId
    ? `/api/projects/${projectId}/assets/signed?assetId=${displayAssetId}`
    : null;

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      <aside className={`${showLeftRail ? "flex" : "hidden"} lg:flex w-64 border-r border-white/5 bg-surface/30 flex-col p-4 gap-6 shrink-0`}>
        <div className="space-y-4">
          <p className="font-mono text-[10px] uppercase tracking-widest opacity-40">
            Library
          </p>
          <nav className="space-y-1">
            <Link
              href={`/app/project/${projectId}`}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg bg-primary/10 text-primary"
            >
              <span className="text-sm font-medium">Assets</span>
            </Link>
            <Link
              href={`/app/project/${projectId}/versions`}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-white/5 opacity-60 hover:opacity-100"
            >
              <span className="text-sm font-medium">Versions</span>
            </Link>
            <Link
              href={`/app/project/${projectId}/references`}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-white/5 opacity-60 hover:opacity-100"
            >
              <span className="text-sm font-medium">References</span>
            </Link>
            <Link
              href={`/app/project/${projectId}/trend`}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-white/5 opacity-60 hover:opacity-100"
            >
              <span className="text-sm font-medium">Trend</span>
            </Link>
            <Link
              href={`/app/project/${projectId}/compose`}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-white/5 opacity-60 hover:opacity-100"
            >
              <span className="text-sm font-medium">Compose</span>
            </Link>
          </nav>
        </div>
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <p className="font-mono text-[10px] uppercase tracking-widest opacity-40 mb-2">
            Assets
          </p>
          <div className="grid grid-cols-2 gap-2 overflow-y-auto custom-scrollbar">
            {assets.map((a) => (
              <div
                key={a.id}
                className="aspect-square rounded-lg overflow-hidden border border-white/5 bg-background-dark"
              >
                <img
                  src={`/api/projects/${projectId}/assets/signed?assetId=${a.id}`}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23353a27' width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' fill='%236b7280' text-anchor='middle' dy='.3em' font-size='10'%3Eimg%3C/text%3E%3C/svg%3E";
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </aside>
      <section className="flex-1 bg-background-dark p-6 flex flex-col min-w-0">
        <div className="mb-3 flex items-center justify-between lg:hidden">
          <button
            type="button"
            onClick={() => setShowLeftRail((v) => !v)}
            className="px-3 py-1.5 rounded-lg border border-white/10 bg-surface font-mono text-xs uppercase"
          >
            Library
          </button>
          <button
            type="button"
            onClick={() => setShowRightRail((v) => !v)}
            className="px-3 py-1.5 rounded-lg border border-white/10 bg-surface font-mono text-xs uppercase"
          >
            Assistant
          </button>
        </div>
        {actionSuccess && (
          <p className="mb-3 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-mono text-primary">
            {actionSuccess}
          </p>
        )}
        <div className="flex-1 rounded-2xl overflow-hidden border border-white/5 bg-surface flex items-center justify-center min-h-0">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Current"
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23161810' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' fill='%236b7280' text-anchor='middle' dy='.3em'%3ENo image%3C/text%3E%3C/svg%3E";
              }}
            />
          ) : (
            <span className="text-slate-500 font-mono text-sm">
              No image. Upload assets in Library.
            </span>
          )}
        </div>
        <div className="h-24 flex items-center justify-center pt-4">
          <div className="bg-surface/80 backdrop-blur-2xl border border-white/10 px-8 h-16 rounded-full flex items-center gap-6 shadow-2xl">
            <button
              type="button"
              onClick={handleMicClick}
              className={`size-10 rounded-full flex items-center justify-center font-bold text-sm ${
                liveState === "connecting"
                  ? "bg-slate-500 text-white animate-pulse"
                  : liveState !== "disconnected"
                    ? "bg-primary text-background-dark"
                    : "bg-primary/80 text-background-dark hover:bg-primary"
              }`}
              title={liveState === "disconnected" ? "Start Live" : isMicActive ? "Stop mic" : "Start mic"}
            >
              {liveState === "connecting"
                ? "…"
                : liveState === "listening" || isMicActive
                  ? "●"
                  : liveState === "speaking"
                    ? "♪"
                    : liveState === "thinking"
                      ? "○"
                      : "MIC"}
            </button>
            {liveState !== "disconnected" && (
              <button
                type="button"
                onClick={disconnect}
                className="font-mono text-[10px] text-slate-400 hover:text-white uppercase"
              >
                Disconnect
              </button>
            )}
            <div className="h-8 w-px bg-white/10" />
            <Link
              href={`/app/project/${projectId}/compare`}
              className="p-2 hover:bg-white/5 rounded-full font-mono text-xs uppercase"
            >
              Compare
            </Link>
            <Link
              href={`/app/project/${projectId}/versions`}
              className="p-2 hover:bg-white/5 rounded-full font-mono text-xs uppercase"
            >
              Versions
            </Link>
            <Link
              href={`/app/project/${projectId}/export`}
              className="px-4 py-2 bg-primary/20 text-primary rounded-full text-xs font-bold uppercase"
            >
              Export
            </Link>
            <button
              type="button"
              onClick={sendInterrupt}
              className="px-4 py-2 bg-accent-coral text-white text-[10px] font-bold uppercase tracking-widest rounded-full hover:brightness-110"
            >
              Interrupt
            </button>
          </div>
        </div>
      </section>
      <aside className={`${showRightRail ? "flex" : "hidden"} lg:flex w-80 border-l border-white/5 bg-surface/30 flex-col shrink-0`}>
        <div className="p-5 border-b border-white/5">
          <h2 className="font-display font-bold uppercase tracking-tight text-lg">
            Assistant
          </h2>
          <span className="font-mono text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded ml-2">
            {liveState.toUpperCase()}
          </span>
        </div>
        {liveError && (
          <p className="px-5 py-2 text-accent-coral text-xs font-mono">{liveError}</p>
        )}
        {actionError && (
          <p className="px-5 py-2 text-accent-coral text-xs font-mono">{actionError}</p>
        )}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
          {turns.length > 0 && (
            <div className="space-y-3">
              <p className="font-mono text-[10px] uppercase tracking-widest opacity-40">
                Transcript
              </p>
              {turns.map((t, i) => (
                <div key={i} className={t.speaker === "assistant" ? "bg-primary/5 border-l-2 border-primary p-2 rounded-r" : ""}>
                  <p className="text-xs text-slate-400">{t.text}</p>
                </div>
              ))}
            </div>
          )}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest opacity-40 mb-2">
              Suggested actions
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => runTool("generateVariants")}
                disabled={isBusy}
                className="px-3 py-2 bg-surface border border-white/10 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-white/5 disabled:opacity-50"
              >
                Make variants
              </button>
              <button
                type="button"
                onClick={() => runTool("applyEdit", { prompt: "Relight the scene while keeping the subject exactly as is" })}
                disabled={isBusy}
                className="px-3 py-2 bg-surface border border-white/10 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-white/5 disabled:opacity-50"
              >
                Relight
              </button>
              <button
                type="button"
                onClick={() => runTool("applyEdit", { prompt: "Replace the background with a new environment, keep the main subject unchanged" })}
                disabled={isBusy}
                className="px-3 py-2 bg-surface border border-white/10 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-white/5 disabled:opacity-50"
              >
                Background replace
              </button>
              <button
                type="button"
                onClick={runMatchReference}
                disabled={isBusy}
                className="px-3 py-2 bg-surface border border-white/10 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-white/5 disabled:opacity-50"
              >
                Match reference
              </button>
              <button
                type="button"
                onClick={() => runTool("applyEdit", { prompt: "Make the image trendier and more contemporary" })}
                disabled={isBusy}
                className="px-3 py-2 bg-surface border border-white/10 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-white/5 disabled:opacity-50"
              >
                Trendier
              </button>
              <button
                type="button"
                onClick={() => runTool("applyEdit", { prompt: "Make the image cleaner and more minimal" })}
                disabled={isBusy}
                className="px-3 py-2 bg-surface border border-white/10 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-white/5 disabled:opacity-50"
              >
                Cleaner
              </button>
              <button
                type="button"
                onClick={() => runTool("applyEdit", { prompt: "Upscale and enhance fine details and sharpness" })}
                disabled={isBusy}
                className="px-3 py-2 bg-surface border border-white/10 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-white/5 disabled:opacity-50"
              >
                Upscale
              </button>
              <button
                type="button"
                onClick={() => runTool("branchVersion")}
                disabled={isBusy}
                className="px-3 py-2 bg-surface border border-white/10 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-white/5 disabled:opacity-50"
              >
                Branch here
              </button>
              <button
                type="button"
                onClick={() => runTool("resetToOriginal")}
                disabled={isBusy}
                className="px-3 py-2 bg-primary/10 border border-primary/30 rounded-lg text-[10px] font-bold uppercase tracking-wider text-primary hover:bg-primary/20 disabled:opacity-50"
              >
                Reset to original
              </button>
            </div>
          </div>
          <PrecisionControlStrip
            projectId={projectId}
            initialValues={project.precisionSettings}
          />
        </div>
      </aside>
    </div>
  );
}
