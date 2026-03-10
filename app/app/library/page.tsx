"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

interface Project {
  id: string;
  title: string;
  slug: string;
  sourceType: string;
  activeVersionId: string | null;
  createdAt: string;
}

export default function LibraryPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("Failed to load projects");
      const json = await res.json();
      return json.projects as Project[];
    },
  });

  const projects = data ?? [];

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-4xl font-bold">Library</h1>
        <Link
          href="/app/library/new"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-background-dark font-display font-bold rounded-xl hover:opacity-90"
        >
          New project from upload
        </Link>
      </div>
      <p className="text-slate-400 mb-8">
        Your projects. Create one from uploads or open an existing project.
      </p>
      {isLoading && (
        <div className="p-8 rounded-2xl border border-border-muted bg-surface/50 text-center text-slate-500">
          Loading…
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl bg-accent-coral/10 border border-accent-coral/30 text-accent-coral mb-4">
          {(error as Error).message}
        </div>
      )}
      {!isLoading && !error && projects.length === 0 && (
        <div className="p-8 rounded-2xl border border-border-muted bg-surface/50 text-center text-slate-500">
          No projects yet. Upload images to create your first project.
        </div>
      )}
      {!isLoading && projects.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2">
          {projects.map((p) => (
            <li key={p.id}>
              <Link
                href={`/app/project/${p.id}`}
                className="block p-6 rounded-2xl border border-border-muted bg-surface hover:border-primary/30 transition-colors"
              >
                <span className="font-display font-bold text-lg block mb-1">
                  {p.title}
                </span>
                <span className="font-mono text-xs text-slate-500">
                  {p.sourceType} · {new Date(p.createdAt).toLocaleDateString()}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
