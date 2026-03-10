import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DriveSettingsBlock } from "./drive-settings-block";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/signin");
  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="font-display text-4xl font-bold mb-2">Settings</h1>
      <p className="text-slate-400 mb-8">
        Profile, voice preferences, export defaults, and Drive connection.
      </p>
      <div className="space-y-6">
        <section className="p-6 rounded-2xl border border-border-muted bg-surface">
          <h2 className="font-display font-bold text-lg mb-2">Profile</h2>
          <p className="text-sm text-slate-500">
            {session.user.name ?? session.user.email} · Name and avatar from your sign-in account. Sign in with Google or use the magic link (email) to access the app.
          </p>
        </section>
        <section className="p-6 rounded-2xl border border-border-muted bg-surface">
          <h2 className="font-display font-bold text-lg mb-2">Export defaults</h2>
          <p className="text-sm text-slate-500">
            Default export preset and quality are applied when you export from a project. Use the Export page to choose preset (1:1, 4:5, 9:16, etc.) per export.
          </p>
        </section>
        <DriveSettingsBlock />
        <section className="p-6 rounded-2xl border border-border-muted bg-surface">
          <h2 className="font-display font-bold text-lg mb-2">Privacy & uploads</h2>
          <p className="text-sm text-slate-500">
            Projects and assets are stored in your account. Only you can access them. Export to download keeps files on your device; Drive export uses your Google Drive. See <Link href="/privacy" className="text-primary underline">Privacy</Link> and <Link href="/terms" className="text-primary underline">Terms</Link> for more.
          </p>
        </section>
      </div>
      <Link href="/app" className="mt-6 inline-block text-primary font-mono text-sm uppercase">
        Back to app
      </Link>
    </div>
  );
}
