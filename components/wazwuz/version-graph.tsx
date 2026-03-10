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

function buildTree(versions: Version[]) {
  const children = new Map<string, Version[]>();
  const roots: Version[] = [];
  versions.forEach((v) => {
    if (v.parentId == null) {
      roots.push(v);
      return;
    }
    const list = children.get(v.parentId) ?? [];
    list.push(v);
    children.set(v.parentId, list);
  });
  return { roots, children };
}

export function VersionGraph({
  versions,
  projectId,
  activeVersionId,
}: {
  versions: Version[];
  projectId: string;
  activeVersionId: string | null;
}) {
  const router = useRouter();
  const { roots, children } = buildTree(versions);
  const firstRoot = roots[0] ?? null;

  async function handleRestore(versionId: string) {
    const res = await fetch(`/api/projects/${projectId}/version`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activeVersionId: versionId }),
    });
    if (res.ok) router.push(`/app/project/${projectId}`);
  }

  async function handleResetToRoot() {
    if (!firstRoot) return;
    const res = await fetch(`/api/projects/${projectId}/version`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activeVersionId: firstRoot.id }),
    });
    if (res.ok) router.push(`/app/project/${projectId}`);
  }

  function NodeCard({ v, depth }: { v: Version; depth: number }) {
    const isActive = activeVersionId === v.id;
    const kidList = children.get(v.id) ?? [];

    return (
      <div className="flex flex-col gap-2" style={{ marginLeft: depth * 24 }}>
        <div
          className={`flex items-center gap-3 p-3 rounded-xl border bg-surface min-w-[200px] ${
            isActive ? "border-primary ring-1 ring-primary/30" : "border-border-muted"
          }`}
        >
          <img
            src={`/api/projects/${projectId}/assets/signed?assetId=${v.imageAssetId}`}
            alt=""
            className="w-12 h-12 rounded-lg object-cover border border-white/10"
          />
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-sm truncate">{v.label}</p>
            <p className="font-mono text-[10px] text-slate-500">
              {new Date(v.createdAt).toLocaleString()}
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => handleRestore(v.id)}
              className="text-primary font-mono text-[10px] uppercase hover:underline text-left"
            >
              Restore
            </button>
            <Link
              href={`/app/project/${projectId}/compare?before=${v.id}`}
              className="font-mono text-[10px] uppercase text-slate-400 hover:text-primary"
            >
              Compare
            </Link>
            {v.parentId != null && (
              <Link
                href={`/app/project/${projectId}?branchFrom=${v.id}`}
                className="font-mono text-[10px] uppercase text-slate-400 hover:text-primary"
              >
                Branch
              </Link>
            )}
          </div>
        </div>
        {kidList.length > 0 && (
          <div className="flex flex-col gap-2 pl-2 border-l-2 border-white/10">
            {kidList.map((kid) => (
              <NodeCard key={kid.id} v={kid} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <p className="text-slate-500 font-mono text-sm">
        No versions yet. Edits in the studio will create version nodes here.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {firstRoot && (
        <>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[10px] uppercase text-slate-500">Graph</span>
            <button
              type="button"
              onClick={handleResetToRoot}
              className="px-3 py-1.5 rounded-lg font-mono text-xs uppercase border border-white/10 bg-surface hover:bg-white/5"
            >
              Reset to root
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {roots.map((root) => (
              <NodeCard key={root.id} v={root} depth={0} />
            ))}
          </div>
        </>
      )}
      {!firstRoot && versions.length > 0 && (
        <ul className="space-y-2">
          {versions.map((v) => (
            <NodeCard key={v.id} v={v} depth={0} />
          ))}
        </ul>
      )}
    </div>
  );
}
