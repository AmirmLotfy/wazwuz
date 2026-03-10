import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AppHomePage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="font-display text-4xl font-bold mb-2">Welcome back</h1>
      <p className="text-slate-400 mb-8">
        Create a project from uploads or open the camera to get started.
      </p>
      <div className="grid sm:grid-cols-2 gap-6">
        <Link
          href="/app/library"
          className="p-8 rounded-2xl border border-border-muted bg-surface hover:border-primary/30 transition-colors"
        >
          <span className="font-display text-xl font-bold block mb-2">
            Library
          </span>
          <p className="text-sm text-slate-500">
            Open or create projects from your uploads.
          </p>
        </Link>
        <Link
          href="/app/camera"
          className="p-8 rounded-2xl border border-border-muted bg-surface hover:border-primary/30 transition-colors"
        >
          <span className="font-display text-xl font-bold block mb-2">
            Camera
          </span>
          <p className="text-sm text-slate-500">
            Capture a frame and start editing with live guidance.
          </p>
        </Link>
      </div>
    </div>
  );
}
