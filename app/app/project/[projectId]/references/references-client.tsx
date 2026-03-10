"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

interface Board {
  id: string;
  name: string;
  summary?: string;
  extractedTraits?: Record<string, unknown>;
}
interface Item {
  id: string;
  type: string;
  assetId?: string;
  sourceUrl?: string;
  note?: string;
  tags?: string[];
}

export function ReferencesPageClient() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const queryClient = useQueryClient();
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [newBoardName, setNewBoardName] = useState("");
  const [addUrl, setAddUrl] = useState("");
  const [addNote, setAddNote] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { data: boardsData } = useQuery({
    queryKey: ["references", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/references`);
      if (!res.ok) throw new Error("Failed to fetch boards");
      return res.json() as Promise<{ boards: Board[] }>;
    },
  });

  const { data: boardDetail, isLoading: boardLoading } = useQuery({
    queryKey: ["references", projectId, selectedBoardId],
    queryFn: async () => {
      if (!selectedBoardId) return null;
      const res = await fetch(`/api/projects/${projectId}/references/${selectedBoardId}`);
      if (!res.ok) throw new Error("Failed to fetch board");
      return res.json() as Promise<{ board: Board; items: Item[] }>;
    },
    enabled: !!selectedBoardId,
  });

  const boards = boardsData?.boards ?? [];
  const board = boardDetail?.board;
  const items = boardDetail?.items ?? [];

  const handleCreateBoard = async () => {
    const name = newBoardName.trim() || "Reference board";
    const res = await fetch(`/api/projects/${projectId}/references`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) return;
    const { board: created } = await res.json();
    setNewBoardName("");
    queryClient.invalidateQueries({ queryKey: ["references", projectId] });
    setSelectedBoardId(created.id);
  };

  const handleAddPastedUrl = async () => {
    if (!selectedBoardId || !addUrl.trim()) return;
    const res = await fetch(`/api/projects/${projectId}/references/${selectedBoardId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "pastedUrl",
        sourceUrl: addUrl.trim(),
        note: addNote.trim() || undefined,
      }),
    });
    if (!res.ok) return;
    setAddUrl("");
    setAddNote("");
    queryClient.invalidateQueries({ queryKey: ["references", projectId, selectedBoardId] });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedBoardId) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("note", addNote);
      const res = await fetch(
        `/api/projects/${projectId}/references/${selectedBoardId}/items`,
        { method: "POST", body: form }
      );
      if (res.ok) {
        setAddNote("");
        queryClient.invalidateQueries({ queryKey: ["references", projectId, selectedBoardId] });
      }
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleAnalyze = async () => {
    if (!selectedBoardId) return;
    setAnalyzing(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/references/${selectedBoardId}/analyze`,
        { method: "POST" }
      );
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["references", projectId, selectedBoardId] });
        queryClient.invalidateQueries({ queryKey: ["references", projectId] });
      }
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-4xl font-bold">Reference boards</h1>
        <Link
          href={`/app/project/${projectId}`}
          className="font-mono text-xs uppercase tracking-widest text-slate-400 hover:text-primary"
        >
          Back to studio
        </Link>
      </div>
      <p className="text-slate-500 mb-6">
        Add references (uploads, URLs, project frames) and analyze the board for style traits.
      </p>

      <div className="flex gap-4 mb-8 flex-wrap">
        <input
          type="text"
          placeholder="New board name"
          value={newBoardName}
          onChange={(e) => setNewBoardName(e.target.value)}
          className="bg-surface border border-white/10 rounded-lg px-4 py-2 font-mono text-sm min-w-[200px]"
        />
        <button
          type="button"
          onClick={handleCreateBoard}
          className="px-4 py-2 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-wider rounded-lg hover:opacity-90"
        >
          Create board
        </button>
      </div>

      {boards.length > 0 && (
        <div className="mb-8">
          <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500 mb-2">
            Boards
          </p>
          <div className="flex flex-wrap gap-2">
            {boards.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedBoardId(b.id)}
                className={`px-4 py-2 rounded-lg font-mono text-xs uppercase border ${
                  selectedBoardId === b.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-white/10 bg-surface hover:bg-white/5"
                }`}
              >
                {b.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedBoardId && (
        <div className="border border-border-muted rounded-2xl bg-surface/50 p-6">
          {boardLoading ? (
            <p className="text-slate-500">Loading…</p>
          ) : (
            <>
              <h2 className="font-display text-xl font-bold mb-4">{board?.name ?? "Board"}</h2>

              <div className="mb-6">
                <p className="font-mono text-[10px] uppercase text-slate-500 mb-2">
                  Add by URL
                </p>
                <div className="flex gap-2 flex-wrap">
                  <input
                    type="url"
                    placeholder="https://…"
                    value={addUrl}
                    onChange={(e) => setAddUrl(e.target.value)}
                    className="bg-background-dark border border-white/10 rounded-lg px-4 py-2 font-mono text-sm flex-1 min-w-[200px]"
                  />
                  <input
                    type="text"
                    placeholder="Note (optional)"
                    value={addNote}
                    onChange={(e) => setAddNote(e.target.value)}
                    className="bg-background-dark border border-white/10 rounded-lg px-4 py-2 font-mono text-sm w-40"
                  />
                  <button
                    type="button"
                    onClick={handleAddPastedUrl}
                    className="px-4 py-2 bg-surface border border-white/10 font-mono text-xs uppercase rounded-lg hover:bg-white/5"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <p className="font-mono text-[10px] uppercase text-slate-500 mb-2">
                  Upload image
                </p>
                <label className="inline-block px-4 py-2 bg-surface border border-white/10 rounded-lg font-mono text-xs uppercase cursor-pointer hover:bg-white/5">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    disabled={uploading}
                    onChange={handleUpload}
                  />
                  {uploading ? "Uploading…" : "Choose file"}
                </label>
              </div>

              <div className="mb-6">
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={analyzing || items.length === 0}
                  className="px-4 py-2 bg-primary/10 border border-primary/30 text-primary font-mono text-xs uppercase rounded-lg hover:bg-primary/20 disabled:opacity-50"
                >
                  {analyzing ? "Analyzing…" : "Analyze board"}
                </button>
              </div>

              {board?.extractedTraits && Object.keys(board.extractedTraits).length > 0 && (
                <div className="mb-6 p-4 rounded-xl bg-background-dark border border-white/5">
                  <p className="font-mono text-[10px] uppercase text-slate-500 mb-2">
                    Extracted traits
                  </p>
                  <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap">
                    {JSON.stringify(board.extractedTraits, null, 2)}
                  </pre>
                </div>
              )}

              <p className="font-mono text-[10px] uppercase text-slate-500 mb-2">Items</p>
              {items.length === 0 ? (
                <p className="text-slate-500">No items yet. Add URLs above or upload images.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-white/10 bg-background-dark overflow-hidden"
                    >
                      {item.assetId ? (
                        <img
                          src={`/api/projects/${projectId}/assets/signed?assetId=${item.assetId}`}
                          alt=""
                          className="w-full aspect-square object-cover"
                        />
                      ) : (
                        <div className="w-full aspect-square bg-white/5 flex items-center justify-center">
                          <span className="font-mono text-[10px] text-slate-500">
                            {item.sourceUrl ? "URL" : item.type}
                          </span>
                        </div>
                      )}
                      {(item.note || (item.tags && item.tags.length > 0)) && (
                        <div className="p-2">
                          {item.note && (
                            <p className="text-xs text-slate-400 line-clamp-2">{item.note}</p>
                          )}
                          {item.tags && item.tags.length > 0 && (
                            <p className="text-[10px] text-slate-500 mt-1">
                              {item.tags.join(", ")}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {!selectedBoardId && boards.length === 0 && (
        <div className="p-8 rounded-2xl border border-border-muted bg-surface/50 text-center text-slate-500">
          Create a board above to add references and analyze style traits.
        </div>
      )}
    </div>
  );
}
