"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

interface Asset {
  id: string;
  type: string;
  storagePath: string;
  mimeType: string;
}
interface Project {
  id: string;
  activeVersionId: string | null;
}
interface Version {
  id: string;
  imageAssetId: string;
  label: string;
}

export function ComposePageClient() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const projectId = params.projectId as string;
  const [subjectId, setSubjectId] = useState<string>("");
  const [backgroundId, setBackgroundId] = useState<string>("");
  const [moodId, setMoodId] = useState<string>("");
  const [priorityMode, setPriorityMode] = useState("balanced");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["project", projectId],
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

  const assets = data?.assets ?? [];
  const project = data?.project;
  const versions = data?.versions ?? [];
  const activeVersion = project?.activeVersionId
    ? versions.find((v) => v.id === project.activeVersionId)
    : null;
  const defaultSubjectId = activeVersion?.imageAssetId ?? assets[0]?.id ?? "";

  const handleSubmit = async () => {
    const sid = subjectId || defaultSubjectId;
    if (!sid) {
      setError("Select a subject asset");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/compose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectAssetId: sid,
          backgroundAssetId: backgroundId || undefined,
          moodAssetId: moodId || undefined,
          priorityMode: priorityMode || "balanced",
        }),
      });
      const out = await res.json();
      if (!res.ok) {
        setError(out.error ?? "Compose failed");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["project-full", projectId] });
      router.push(`/app/project/${projectId}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <p className="text-slate-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-4xl font-bold">Compose</h1>
        <Link
          href={`/app/project/${projectId}`}
          className="font-mono text-xs uppercase tracking-widest text-slate-400 hover:text-primary"
        >
          Back to studio
        </Link>
      </div>
      <p className="text-slate-500 mb-6">
        Multi-image: subject + background + mood. Choose priority and generate.
      </p>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          {error}
        </div>
      )}

      {assets.length === 0 ? (
        <p className="text-slate-500">No assets in this project. Add images in the studio first.</p>
      ) : (
        <div className="space-y-6">
          <div>
            <label className="block font-mono text-[10px] uppercase text-slate-500 mb-2">
              Subject (required)
            </label>
            <select
              value={subjectId || defaultSubjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full bg-surface border border-white/10 rounded-lg px-4 py-2 font-mono text-sm"
            >
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.type} – {a.id.slice(0, 8)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-mono text-[10px] uppercase text-slate-500 mb-2">
              Background (optional)
            </label>
            <select
              value={backgroundId}
              onChange={(e) => setBackgroundId(e.target.value)}
              className="w-full bg-surface border border-white/10 rounded-lg px-4 py-2 font-mono text-sm"
            >
              <option value="">None</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.type} – {a.id.slice(0, 8)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-mono text-[10px] uppercase text-slate-500 mb-2">
              Mood (optional)
            </label>
            <select
              value={moodId}
              onChange={(e) => setMoodId(e.target.value)}
              className="w-full bg-surface border border-white/10 rounded-lg px-4 py-2 font-mono text-sm"
            >
              <option value="">None</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.type} – {a.id.slice(0, 8)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-mono text-[10px] uppercase text-slate-500 mb-2">
              Priority
            </label>
            <select
              value={priorityMode}
              onChange={(e) => setPriorityMode(e.target.value)}
              className="w-full bg-surface border border-white/10 rounded-lg px-4 py-2 font-mono text-sm"
            >
              <option value="balanced">Balanced</option>
              <option value="subject">Subject first</option>
              <option value="background">Background first</option>
              <option value="mood">Mood first</option>
            </select>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-3 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-wider rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Composing…" : "Generate composed image"}
          </button>
        </div>
      )}
    </div>
  );
}
