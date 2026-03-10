import { auth } from "@/auth";
import { redirect } from "next/navigation";
import * as projectsRepo from "@/server/repositories/projects";
import * as versionsRepo from "@/server/repositories/versions";
import { CompareView } from "@/components/wazwuz/compare-view";

export default async function ComparePage({
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
    <CompareView
      projectId={projectId}
      versions={versions}
      activeVersionId={project.activeVersionId}
    />
  );
}
