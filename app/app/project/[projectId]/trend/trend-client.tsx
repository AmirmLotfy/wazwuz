"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

interface ResolvedTraits {
  traits: Record<string, unknown>;
  confidence?: number;
  freshness?: string;
  interpretations?: string[];
  groundingSnippets?: Array<{ title: string; snippet: string; url: string }>;
}

export function TrendPageClient() {
  const params = useParams();
  const projectId = params.projectId as string;
  const queryClient = useQueryClient();
  const [styleTerm, setStyleTerm] = useState("");
  const [resolved, setResolved] = useState<ResolvedTraits | null>(null);
  const [resolving, setResolving] = useState(false);
  const [applying, setApplying] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveRecipeOpen, setSaveRecipeOpen] = useState(false);
  const [recipeName, setRecipeName] = useState("");
  const [recipeDescription, setRecipeDescription] = useState("");
  const [savingRecipe, setSavingRecipe] = useState(false);

  const handleResolve = async () => {
    if (!styleTerm.trim()) return;
    setResolving(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/trend/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ styleTerm: styleTerm.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Resolve failed");
        setResolved(null);
        return;
      }
      setResolved(data.traits);
    } finally {
      setResolving(false);
    }
  };

  const handleApply = async (mode: "lighting" | "color" | "composition" | "full") => {
    if (!resolved?.traits) return;
    setApplying(mode);
    try {
      const res = await fetch(`/api/projects/${projectId}/trend/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ traits: resolved.traits, mode }),
      });
      const data = await res.json();
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["project-full", projectId] });
      } else {
        setError(data.error ?? "Apply failed");
      }
    } finally {
      setApplying(null);
    }
  };

  const handleSaveRecipe = async () => {
    if (!resolved?.traits || !recipeName.trim()) return;
    setSavingRecipe(true);
    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: recipeName.trim(),
          description: recipeDescription.trim() || undefined,
          config: { traits: resolved.traits, mode: "full" },
        }),
      });
      if (res.ok) {
        setSaveRecipeOpen(false);
        setRecipeName("");
        setRecipeDescription("");
      }
    } finally {
      setSavingRecipe(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-4xl font-bold">
          Trend <span className="text-primary">Brain</span>
        </h1>
        <Link
          href={`/app/project/${projectId}`}
          className="font-mono text-xs uppercase tracking-widest text-slate-400 hover:text-primary"
        >
          Back to studio
        </Link>
      </div>
      <p className="text-slate-500 mb-6">
        Search style terms and apply lighting, color, composition, or full vibe to the project.
      </p>

      <div className="flex gap-2 mb-8">
        <input
          type="text"
          placeholder="e.g. dark academia, soft minimal, neon noir"
          value={styleTerm}
          onChange={(e) => setStyleTerm(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleResolve()}
          className="flex-1 bg-surface border border-white/10 rounded-lg px-4 py-3 font-mono text-sm"
        />
        <button
          type="button"
          onClick={handleResolve}
          disabled={resolving || !styleTerm.trim()}
          className="px-6 py-3 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-wider rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          {resolving ? "Resolving…" : "Resolve"}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          {error}
        </div>
      )}

      {resolved && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-border-muted bg-surface/50">
            <h2 className="font-display text-lg font-bold mb-2">Resolved traits</h2>
            {resolved.confidence != null && (
              <p className="font-mono text-[10px] text-slate-500 mb-2">
                Confidence: {Math.round(resolved.confidence * 100)}%
                {resolved.freshness && ` · ${resolved.freshness}`}
              </p>
            )}
            {resolved.interpretations && resolved.interpretations.length > 0 && (
              <p className="text-sm text-slate-400 mb-2">
                {resolved.interpretations.join(" · ")}
              </p>
            )}
            <pre className="font-mono text-xs text-slate-300 bg-background-dark p-4 rounded-lg overflow-x-auto">
              {JSON.stringify(resolved.traits, null, 2)}
            </pre>
            {(resolved.groundingSnippets?.length ?? 0) > 0 && (
              <div className="mt-4 space-y-2">
                <p className="font-mono text-[10px] uppercase text-slate-500">
                  Grounding snippets
                </p>
                <div className="space-y-2">
                  {resolved.groundingSnippets!.map((snippet) => (
                    <a
                      key={`${snippet.url}-${snippet.title}`}
                      href={snippet.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block p-3 rounded-lg border border-white/10 hover:border-primary/40 transition-colors"
                    >
                      <p className="text-xs font-semibold text-slate-200">{snippet.title}</p>
                      <p className="text-xs text-slate-400 mt-1">{snippet.snippet}</p>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase text-slate-500 mb-2">Apply to current image</p>
            <div className="flex flex-wrap gap-2">
              {(["lighting", "color", "composition", "full"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleApply(mode)}
                  disabled={!!applying}
                  className="px-4 py-2 bg-surface border border-white/10 font-mono text-xs uppercase rounded-lg hover:bg-white/5 disabled:opacity-50"
                >
                  {applying === mode ? "Applying…" : mode === "full" ? "Full vibe" : mode}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSaveRecipeOpen(true)}
                className="px-4 py-2 bg-primary/20 text-primary font-mono text-xs uppercase rounded-lg hover:bg-primary/30"
              >
                Save as recipe
              </button>
            </div>
          </div>
        </div>
      )}

      {saveRecipeOpen && resolved && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-white/10 rounded-2xl p-6 max-w-md w-full">
            <h3 className="font-display font-bold text-lg mb-4">Save as recipe</h3>
            <input
              type="text"
              placeholder="Recipe name"
              value={recipeName}
              onChange={(e) => setRecipeName(e.target.value)}
              className="w-full bg-background-dark border border-white/10 rounded-lg px-4 py-2 font-mono text-sm mb-3"
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={recipeDescription}
              onChange={(e) => setRecipeDescription(e.target.value)}
              className="w-full bg-background-dark border border-white/10 rounded-lg px-4 py-2 font-mono text-sm mb-4"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveRecipe}
                disabled={savingRecipe || !recipeName.trim()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-mono text-xs uppercase disabled:opacity-50"
              >
                {savingRecipe ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => { setSaveRecipeOpen(false); setRecipeName(""); setRecipeDescription(""); }}
                className="px-4 py-2 bg-surface border border-white/10 rounded-lg font-mono text-xs uppercase hover:bg-white/5"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {!resolved && !resolving && !error && (
        <div className="p-8 rounded-2xl border border-border-muted bg-surface/50 text-center text-slate-500">
          Enter a style term above and click Resolve to get structured traits, then apply to your project.
        </div>
      )}
    </div>
  );
}
