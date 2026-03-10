import { auth } from "@/auth";
import { redirect } from "next/navigation";
import * as projectsRepo from "@/server/repositories/projects";
import { ComposePageClient } from "./compose-client";

export default async function ComposePage({
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
  return <ComposePageClient />;
}
