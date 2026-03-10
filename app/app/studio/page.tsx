"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

interface Job {
  id: string;
  projectId: string;
  masterVersionId: string;
  status: string;
  progress?: number;
  samplePreviewIds?: string[];
  outputAssetIds?: string[];
}
interface Project {
  id: string;
  title: string;
}
interface Version {
  id: string;
  label: string;
  imageAssetId: string;
}

export default function StudioPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectIdParam = searchParams.get("projectId");
  const queryClient = useQueryClient();
  const [projectId, setProjectId] = useState(projectIdParam ?? "");
  const [masterVersionId, setMasterVersionId] = useState("");
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [running, setRunning] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const { data: projectsData } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("Failed to fetch projects");
      return res.json() as Promise<{ projects: Project[] }>;
    },
  });

  const { data: projectData } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/full`);
      if (!res.ok) throw new Error("Failed to fetch project");
      return res.json() as Promise<{ project: { id: string }; assets: unknown[]; versions: Version[] }>;
    },
    enabled: !!projectId,
  });

  const { data: jobData, refetch: refetchJob } = useQuery({
    queryKey: ["batch", projectId, currentJobId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/batch/${currentJobId}`);
      if (!res.ok) throw new Error("Failed to fetch job");
      return res.json() as Promise<{ job: Job }>;
    },
    enabled: !!projectId && !!currentJobId,
    refetchInterval: (query) => {
      const current = (query.state.data as { job?: Job } | undefined)?.job;
      if (!current) return false;
      return current.status === "queued" || current.status === "running" ? 2000 : false;
    },
  });

  const projects = projectsData?.projects ?? [];
  const versions = projectData?.versions ?? [];
  const job = jobData?.job;

  const handleCreateJob = async () => {
    if (!projectId || !masterVersionId) return;
    const res = await fetch(`/api/projects/${projectId}/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ masterVersionId }),
    });
    const data = await res.json();
    if (!res.ok || !data.job) {
      setFeedback(data.error ?? "Failed to create batch job.");
      return;
    }
    setCurrentJobId(data.job.id);
    setFeedback("Batch job created.");
    queryClient.invalidateQueries({ queryKey: ["batch", projectId] });
  };

  const handlePreview = async () => {
    if (!currentJobId || !projectId) return;
    setPreviewing(true);
    try {
      await fetch(`/api/projects/${projectId}/batch/${currentJobId}/preview`, {
        method: "POST",
      });
      queryClient.invalidateQueries({ queryKey: ["batch", projectId, currentJobId] });
      setFeedback("Preview generation requested.");
    } finally {
      setPreviewing(false);
    }
  };

  const handleRun = async () => {
    if (!currentJobId || !projectId) return;
    setRunning(true);
    try {
      const enqueueRes = await fetch(`/api/projects/${projectId}/batch/${currentJobId}/run`, {
        method: "POST",
      });
      if (!enqueueRes.ok) {
        const out = await enqueueRes.json().catch(() => ({}));
        setFeedback(out.error ?? "Failed to queue batch run.");
        return;
      }
      // Kick processing via worker-style endpoint.
      void fetch(`/api/projects/${projectId}/batch/${currentJobId}/process`, {
        method: "POST",
      });
      await refetchJob();
      setFeedback("Batch run queued.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-4xl font-bold">Studio (Batch)</h1>
        <Link
          href="/app/library"
          className="font-mono text-xs uppercase tracking-widest text-slate-400 hover:text-primary"
        >
          Library
        </Link>
      </div>
      <p className="text-slate-400 mb-8">
        Batch retouching: select a master look and run across multiple assets.
      </p>
      {feedback && (
        <p className="mb-6 rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 font-mono text-xs text-primary">
          {feedback}
        </p>
      )}

      <div className="space-y-6">
        <div>
          <label className="block font-mono text-[10px] uppercase text-slate-500 mb-2">
            Project
          </label>
          <select
            value={projectId}
            onChange={(e) => {
              setProjectId(e.target.value);
              setCurrentJobId(null);
              setMasterVersionId("");
            }}
            className="w-full max-w-md bg-surface border border-white/10 rounded-lg px-4 py-2 font-mono text-sm"
          >
            <option value="">Select project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>

        {projectId && (
          <>
            <div>
              <label className="block font-mono text-[10px] uppercase text-slate-500 mb-2">
                Master version (look to apply)
              </label>
              <select
                value={masterVersionId}
                onChange={(e) => setMasterVersionId(e.target.value)}
                className="w-full max-w-md bg-surface border border-white/10 rounded-lg px-4 py-2 font-mono text-sm"
              >
                <option value="">Select version</option>
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>

            {!currentJobId ? (
              <button
                type="button"
                onClick={handleCreateJob}
                disabled={!masterVersionId}
                className="px-6 py-3 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-wider rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                Create batch job
              </button>
            ) : (
              <div className="space-y-4">
                <p className="font-mono text-xs text-slate-500">
                  Job {currentJobId.slice(0, 12)}… · Status: {job?.status ?? "—"}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handlePreview}
                    disabled={previewing || job?.status !== "pending"}
                    className="px-4 py-2 bg-surface border border-white/10 font-mono text-xs uppercase rounded-lg hover:bg-white/5 disabled:opacity-50"
                  >
                    {previewing ? "Generating…" : "Generate previews"}
                  </button>
                  <button
                    type="button"
                    onClick={handleRun}
                    disabled={
                      running ||
                      !job ||
                      (job.status !== "pending" && job.status !== "queued")
                    }
                    className="px-4 py-2 bg-primary text-primary-foreground font-mono text-xs uppercase rounded-lg hover:opacity-90 disabled:opacity-50"
                  >
                    {running ? "Running…" : "Run full batch"}
                  </button>
                </div>
                {(job?.status === "running" || job?.status === "queued") && job.progress != null && (
                  <div className="w-full max-w-md h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${job.progress}%` }}
                    />
                  </div>
                )}
                {(job?.samplePreviewIds?.length ?? 0) > 0 && (
                  <div>
                    <p className="font-mono text-[10px] uppercase text-slate-500 mb-2">
                      Preview samples
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {job!.samplePreviewIds!.map((aid) => (
                        <img
                          key={aid}
                          src={`/api/projects/${projectId}/assets/signed?assetId=${aid}`}
                          alt=""
                          className="rounded-lg border border-white/10 w-full aspect-square object-cover"
                        />
                      ))}
                    </div>
                  </div>
                )}
                {(job?.outputAssetIds?.length ?? 0) > 0 && (
                  <div>
                    <p className="font-mono text-[10px] uppercase text-slate-500 mb-2">
                      Output ({job!.outputAssetIds!.length})
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {job!.outputAssetIds!.map((aid) => (
                        <img
                          key={aid}
                          src={`/api/projects/${projectId}/assets/signed?assetId=${aid}`}
                          alt=""
                          className="rounded-lg border border-white/10 w-full aspect-square object-cover"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {!projectId && (
          <div className="p-8 rounded-2xl border border-border-muted bg-surface/50 text-center text-slate-500">
            Select a project above, then choose a master version and create a batch job.
          </div>
        )}
      </div>
    </div>
  );
}
