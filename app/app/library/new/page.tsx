"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NewProjectPage() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const list = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/")
    );
    setFiles((prev) => [...prev, ...list]);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDrag(true);
  }, []);

  const onDragLeave = useCallback(() => setDrag(false), []);

  const onFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []);
    setFiles((prev) => [...prev, ...list]);
  }, []);

  const removeFile = useCallback((i: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
  }, []);

  const startUpload = useCallback(async () => {
    if (files.length === 0) return;
    setError(null);
    setUploading(true);
    let projectId: string | null = null;
    try {
      for (let i = 0; i < files.length; i++) {
        const form = new FormData();
        if (projectId) form.set("projectId", projectId);
        form.set("file", files[i]);
        const res = await fetch("/api/uploads", {
          method: "POST",
          body: form,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? res.statusText);
        }
        const data = await res.json();
        projectId = data.projectId;
      }
      if (projectId) router.push(`/app/project/${projectId}`);
      else router.push("/app/library");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }, [files, router]);

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-4xl font-bold">New project</h1>
        <Link
          href="/app/library"
          className="font-mono text-xs uppercase tracking-widest text-slate-400 hover:text-primary"
        >
          Back to Library
        </Link>
      </div>
      <p className="text-slate-400 mb-8">
        Upload one or more images to create a project. JPG, PNG, WebP, GIF up to 50MB.
      </p>
      {error && (
        <div className="mb-4 p-4 rounded-xl bg-accent-coral/10 border border-accent-coral/30 text-accent-coral">
          {error}
        </div>
      )}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`rounded-2xl border-2 border-dashed p-12 text-center transition-colors ${
          drag ? "border-primary bg-primary/5" : "border-border-muted bg-surface/50"
        }`}
      >
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onChange={onFileInput}
          className="hidden"
          id="file-input"
        />
        <label
          htmlFor="file-input"
          className="cursor-pointer flex flex-col items-center gap-4"
        >
          <span className="text-slate-400">Drop images here or click to browse</span>
          <span className="px-4 py-2 bg-primary/20 text-primary rounded-xl text-sm font-medium">
            Browse files
          </span>
        </label>
      </div>
      {files.length > 0 && (
        <div className="mt-8 space-y-4">
          <p className="font-mono text-xs uppercase text-slate-500">
            {files.length} file(s) selected
          </p>
          <ul className="space-y-2">
            {files.map((f, i) => (
              <li
                key={`${f.name}-${i}`}
                className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border-muted"
              >
                <span className="text-sm truncate max-w-[200px]">{f.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="text-slate-500 hover:text-accent-coral text-xs"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={startUpload}
            disabled={uploading}
            className="w-full py-4 bg-primary text-background-dark font-display font-bold rounded-xl hover:opacity-90 disabled:opacity-50"
          >
            {uploading ? "Uploading…" : "Create project"}
          </button>
        </div>
      )}
    </div>
  );
}
