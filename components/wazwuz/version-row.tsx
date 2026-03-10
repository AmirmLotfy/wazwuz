"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

interface Version {
  id: string;
  parentId: string | null;
  label: string;
  summary?: string;
  imageAssetId: string;
  createdAt: string;
}

export function VersionRow({
  version,
  projectId,
  isActive,
}: {
  version: Version;
  projectId: string;
  isActive: boolean;
}) {
  const router = useRouter();

  async function handleRestore() {
    const res = await fetch(`/api/projects/${projectId}/version`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activeVersionId: version.id }),
    });
    if (res.ok) router.push(`/app/project/${projectId}`);
  }

  return (
    <li
      className={`p-4 rounded-xl border bg-surface flex items-center justify-between ${
        isActive ? "border-primary ring-1 ring-primary/30" : "border-border-muted"
      }`}
    >
      <div>
        <span className="font-display font-bold">{version.label}</span>
        {version.summary && (
          <p className="text-sm text-slate-500 mt-1">{version.summary}</p>
        )}
        <p className="font-mono text-[10px] text-slate-600 mt-1">
          {new Date(version.createdAt).toLocaleString()}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleRestore}
          className="text-primary font-mono text-xs uppercase hover:underline"
        >
          Restore
        </button>
        <Link
          href={`/app/project/${projectId}/compare?before=${version.id}`}
          className="font-mono text-xs uppercase text-slate-400 hover:text-primary"
        >
          Compare
        </Link>
      </div>
    </li>
  );
}
