"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

const PRESETS = [
  { id: "1:1", label: "1:1 Square" },
  { id: "4:5", label: "4:5 Portrait" },
  { id: "9:16", label: "9:16 Story" },
  { id: "marketplace", label: "Marketplace" },
  { id: "web-hero", label: "Web hero" },
];

export default function ExportPageClient() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [preset, setPreset] = useState("1:1");
  const [exporting, setExporting] = useState<"download" | "drive" | null>(null);
  const [driveResult, setDriveResult] = useState<{ shareLink?: string } | null>(null);
  const [shareScope, setShareScope] = useState<"restricted" | "anyone">("restricted");

  const { data: driveStatus } = useQuery({
    queryKey: ["drive-status"],
    queryFn: async () => {
      const res = await fetch("/api/drive/status");
      if (!res.ok) return { connected: false };
      return res.json() as Promise<{ connected: boolean }>;
    },
  });

  const handleDownload = () => {
    setExporting("download");
    setDriveResult(null);
    const url = `/api/projects/${projectId}/export?preset=${encodeURIComponent(preset)}`;
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    if (!opened) {
      window.location.href = url;
    }
    setExporting(null);
  };

  const handleExportToDrive = async () => {
    setExporting("drive");
    setDriveResult(null);
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          preset,
          destination: "drive",
          shareScope,
        }),
      });
      const data = await res.json();
      if (res.ok && data.shareLink) setDriveResult({ shareLink: data.shareLink });
      else if (!res.ok) setDriveResult({});
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-4xl font-bold">Export</h1>
        <Link
          href={`/app/project/${projectId}`}
          className="font-mono text-xs uppercase tracking-widest text-slate-400 hover:text-primary"
        >
          Back to studio
        </Link>
      </div>
      <p className="text-slate-500 mb-6">
        Presets (1:1, 4:5, 9:16), quality, and export to download or Google Drive.
      </p>

      <div className="space-y-6">
        <div>
          <label className="block font-mono text-[10px] uppercase text-slate-500 mb-2">
            Preset
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPreset(p.id)}
                className={`px-4 py-2 rounded-lg font-mono text-xs uppercase border ${
                  preset === p.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-white/10 bg-surface hover:bg-white/5"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={handleDownload}
            disabled={!!exporting}
            className="w-full p-4 rounded-xl border border-border-muted bg-surface text-left hover:border-primary/30 disabled:opacity-50 font-mono text-sm"
          >
            Download (current image)
          </button>

          {driveStatus?.connected ? (
            <>
              <div className="p-4 rounded-xl border border-white/10 bg-surface/50">
                <p className="font-mono text-[10px] uppercase text-slate-500 mb-2">Drive link scope</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShareScope("restricted")}
                    className={`px-3 py-2 rounded-lg font-mono text-xs uppercase border ${
                      shareScope === "restricted"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-white/10 bg-surface"
                    }`}
                  >
                    Restricted
                  </button>
                  <button
                    type="button"
                    onClick={() => setShareScope("anyone")}
                    className={`px-3 py-2 rounded-lg font-mono text-xs uppercase border ${
                      shareScope === "anyone"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-white/10 bg-surface"
                    }`}
                  >
                    Anyone with link
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={handleExportToDrive}
                disabled={!!exporting}
                className="w-full p-4 rounded-xl border border-primary/30 bg-primary/10 text-primary font-mono text-sm hover:bg-primary/20 disabled:opacity-50"
              >
                {exporting === "drive" ? "Exporting…" : "Export to Google Drive"}
              </button>
            </>
          ) : (
            <p className="text-xs text-slate-500">
              Sign in with Google to export to Drive. Then connect in{" "}
              <Link href="/app/settings" className="text-primary underline">
                Settings
              </Link>
              .
            </p>
          )}
        </div>

        {driveResult?.shareLink && (
          <div className="p-4 rounded-xl bg-surface border border-white/10">
            <p className="font-mono text-[10px] uppercase text-slate-500 mb-2">Share link</p>
            <a
              href={driveResult.shareLink}
              target="_blank"
              rel="noreferrer"
              className="text-primary break-all text-sm hover:underline"
            >
              {driveResult.shareLink}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
