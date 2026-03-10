"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Recipe {
  id: string;
  name: string;
  description?: string;
  previewAssetId?: string;
  config: Record<string, unknown>;
  createdAt: string;
}
interface Project {
  id: string;
  title: string;
}

export default function RecipesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [applyRecipeId, setApplyRecipeId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState("");

  const { data: recipesData } = useQuery({
    queryKey: ["recipes"],
    queryFn: async () => {
      const res = await fetch("/api/recipes");
      if (!res.ok) throw new Error("Failed to fetch recipes");
      return res.json() as Promise<{ recipes: Recipe[] }>;
    },
  });

  const { data: projectsData } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("Failed to fetch projects");
      return res.json() as Promise<{ projects: Project[] }>;
    },
    enabled: !!applyRecipeId,
  });

  const recipes = recipesData?.recipes ?? [];
  const projects = projectsData?.projects ?? [];
  const recipeToApply = applyRecipeId ? recipes.find((r) => r.id === applyRecipeId) : null;

  async function handleApply() {
    if (!recipeToApply || !selectedProjectId) return;
    const config = recipeToApply.config as { traits?: Record<string, unknown>; mode?: string };
    const res = await fetch(
      `/api/projects/${selectedProjectId}/trend/apply`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          traits: config.traits ?? {},
          mode: config.mode ?? "full",
        }),
      }
    );
    if (res.ok) {
      setApplyRecipeId(null);
      setSelectedProjectId("");
      queryClient.invalidateQueries({ queryKey: ["project", selectedProjectId] });
      router.push(`/app/project/${selectedProjectId}`);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-4xl font-bold">Recipes</h1>
        <Link href="/app" className="font-mono text-xs uppercase tracking-widest text-slate-400 hover:text-primary">
          Back to Home
        </Link>
      </div>
      <p className="text-slate-400 mb-8">
        Saved style recipes you can apply to projects. Save recipes from the Trend Brain, then apply them here.
      </p>

      {recipes.length === 0 ? (
        <div className="p-8 rounded-2xl border border-border-muted bg-surface/50 text-center text-slate-500">
          <p className="mb-4">No recipes yet.</p>
          <Link href="/app" className="text-primary font-mono text-sm uppercase">
            Create a project
          </Link>
          <span className="text-slate-500"> then go to Trend Brain and save a style as a recipe.</span>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {recipes.map((r) => (
            <div
              key={r.id}
              className="p-6 rounded-2xl border border-border-muted bg-surface flex flex-col gap-3"
            >
              <h2 className="font-display font-bold text-lg">{r.name}</h2>
              {r.description && <p className="text-sm text-slate-500">{r.description}</p>}
              <div className="flex gap-2 mt-auto">
                <button
                  type="button"
                  onClick={() => { setApplyRecipeId(r.id); setSelectedProjectId(""); }}
                  className="px-4 py-2 bg-primary/20 text-primary rounded-lg font-mono text-xs uppercase tracking-wider hover:bg-primary/30"
                >
                  Apply to project
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {recipeToApply && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-white/10 rounded-2xl p-6 max-w-md w-full">
            <h3 className="font-display font-bold text-lg mb-2">Apply &quot;{recipeToApply.name}&quot;</h3>
            <p className="text-slate-500 text-sm mb-4">Choose a project to apply this recipe to.</p>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full bg-background-dark border border-white/10 rounded-lg px-4 py-2 font-mono text-sm mb-4"
            >
              <option value="">Select project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleApply}
                disabled={!selectedProjectId}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-mono text-xs uppercase disabled:opacity-50"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={() => { setApplyRecipeId(null); setSelectedProjectId(""); }}
                className="px-4 py-2 bg-surface border border-white/10 rounded-lg font-mono text-xs uppercase hover:bg-white/5"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
