"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

interface Version {
  id: string;
  parentId: string | null;
  label: string;
  summary?: string;
  imageAssetId: string;
  createdAt: string;
}

export function CompareView({
  projectId,
  versions,
  activeVersionId,
}: {
  projectId: string;
  versions: Version[];
  activeVersionId: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const beforeParam = searchParams.get("before");
  const afterParam = searchParams.get("after");

  const defaultBefore = useMemo(
    () => versions[0]?.id ?? null,
    [versions]
  );
  const defaultAfter = useMemo(
    () => activeVersionId ?? versions[versions.length - 1]?.id ?? null,
    [activeVersionId, versions]
  );

  const [beforeId, setBeforeId] = useState<string | null>(beforeParam ?? defaultBefore);
  const [afterId, setAfterId] = useState<string | null>(afterParam ?? defaultAfter);
  const [sliderPercent, setSliderPercent] = useState(50);
  const [dragging, setDragging] = useState(false);

  const beforeVersion = useMemo(
    () => versions.find((v) => v.id === beforeId),
    [versions, beforeId]
  );
  const afterVersion = useMemo(
    () => versions.find((v) => v.id === afterId),
    [versions, afterId]
  );

  const beforeAssetId = beforeVersion?.imageAssetId ?? null;
  const afterAssetId = afterVersion?.imageAssetId ?? null;

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      const container = (e.target as HTMLElement).closest(".compare-container");
      const rect = container?.getBoundingClientRect();
      if (rect) {
        const p = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
        setSliderPercent(p);
      }
    },
    [dragging]
  );
  const handlePointerUp = useCallback(() => {
    setDragging(false);
  }, []);
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handleKeepThis = async () => {
    if (!afterId) return;
    const res = await fetch(`/api/projects/${projectId}/version`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activeVersionId: afterId }),
    });
    if (res.ok) router.push(`/app/project/${projectId}`);
  };

  const handleBranchThis = async () => {
    if (!afterId) return;
    const res = await fetch("/api/live/tools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tool: "branchVersion",
        payload: { projectId, versionId: afterId },
      }),
    });
    if (res.ok) {
      router.push(`/app/project/${projectId}`);
    }
  };

  if (versions.length === 0) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center gap-4 p-8">
        <p className="text-slate-500">No versions yet. Create versions in the studio first.</p>
        <Link
          href={`/app/project/${projectId}`}
          className="font-mono text-xs uppercase tracking-widest text-primary"
        >
          Back to studio
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 flex-wrap gap-4">
        <h1 className="font-display text-xl font-bold">Compare</h1>
        <div className="flex items-center gap-4 flex-wrap">
          <label className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase text-slate-500">Before</span>
            <select
              value={beforeId ?? ""}
              onChange={(e) => setBeforeId(e.target.value || null)}
              className="bg-surface border border-white/10 rounded px-2 py-1 font-mono text-xs"
            >
              {versions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label} – {new Date(v.createdAt).toLocaleDateString()}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase text-slate-500">After</span>
            <select
              value={afterId ?? ""}
              onChange={(e) => setAfterId(e.target.value || null)}
              className="bg-surface border border-white/10 rounded px-2 py-1 font-mono text-xs"
            >
              {versions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label} – {new Date(v.createdAt).toLocaleDateString()}
                </option>
              ))}
            </select>
          </label>
          <Link
            href={`/app/project/${projectId}`}
            className="font-mono text-xs uppercase tracking-widest text-slate-400 hover:text-primary"
          >
            Back to studio
          </Link>
        </div>
      </div>
      <div className="compare-container flex-1 relative overflow-hidden bg-background-dark">
        {/* Before layer (left side, clipped) */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ clipPath: `inset(0 ${100 - sliderPercent}% 0 0)` }}
        >
          {beforeAssetId ? (
            <img
              src={`/api/projects/${projectId}/assets/signed?assetId=${beforeAssetId}`}
              alt="Before"
              className="max-w-full max-h-full object-contain pointer-events-none"
            />
          ) : (
            <span className="text-slate-500">No image</span>
          )}
        </div>
        {/* After layer (right side, clipped) */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ clipPath: `inset(0 0 0 ${sliderPercent}%)` }}
        >
          {afterAssetId ? (
            <img
              src={`/api/projects/${projectId}/assets/signed?assetId=${afterAssetId}`}
              alt="After"
              className="max-w-full max-h-full object-contain pointer-events-none"
            />
          ) : (
            <span className="text-slate-500">No image</span>
          )}
        </div>
        {/* Draggable divider */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-primary cursor-ew-resize flex items-center justify-center z-10"
          style={{ left: `${sliderPercent}%`, transform: "translateX(-50%)" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          role="slider"
          aria-valuenow={sliderPercent}
          aria-valuemin={5}
          aria-valuemax={95}
          tabIndex={0}
        >
          <div className="w-2 h-12 rounded-full bg-primary/80" />
        </div>
      </div>
      <div className="flex items-center gap-4 px-6 py-4 border-t border-white/5">
        <button
          type="button"
          onClick={handleKeepThis}
          className="px-4 py-2 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-wider rounded-lg hover:opacity-90"
        >
          Keep this
        </button>
        <button
          type="button"
          onClick={handleBranchThis}
          className="px-4 py-2 bg-surface border border-white/10 font-mono text-xs uppercase tracking-wider rounded-lg hover:bg-white/5"
        >
          Branch this
        </button>
        <Link
          href={`/app/project/${projectId}`}
          className="font-mono text-xs uppercase tracking-widest text-slate-400 hover:text-primary"
        >
          Back to studio
        </Link>
      </div>
    </div>
  );
}
