import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import * as projectsRepo from "@/server/repositories/projects";
import * as versionsRepo from "@/server/repositories/versions";
import { VersionRow } from "@/components/wazwuz/version-row";
import { VersionGraph } from "@/components/wazwuz/version-graph";

export default async function VersionsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.email) redirect("/signin");
  const userId = (session.user as { id?: string }).id ?? session.user.email;
  const { projectId } = await params;
  const project = await projectsRepo.getProjectById(projectId, userId);
  if (!project) redirect("/app/library");
  const versions = await versionsRepo.getVersionNodesByProjectId(projectId, userId);
  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-4xl font-bold">Version history</h1>
        <Link
          href={`/app/project/${projectId}`}
          className="font-mono text-xs uppercase tracking-widest text-slate-400 hover:text-primary"
        >
          Back to studio
        </Link>
      </div>
      {versions.length === 0 ? (
        <p className="text-slate-500">
          No versions yet. Edits in the studio will create version nodes here.
        </p>
      ) : (
        <>
          <div className="mb-8">
            <h2 className="font-display text-lg font-bold mb-4">Version graph</h2>
            <VersionGraph
              versions={versions}
              projectId={projectId}
              activeVersionId={project.activeVersionId}
            />
          </div>
          <h2 className="font-display text-lg font-bold mb-4">List</h2>
          <ul className="space-y-4">
          {versions.map((v) => (
            <VersionRow
              key={v.id}
              version={v}
              projectId={projectId}
              isActive={project.activeVersionId === v.id}
            />
          ))}
        </ul>
        </>
      )}
    </div>
  );
}
