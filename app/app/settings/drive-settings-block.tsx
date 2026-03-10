"use client";

import { useQuery } from "@tanstack/react-query";
import { signIn } from "next-auth/react";

export function DriveSettingsBlock() {
  const { data } = useQuery({
    queryKey: ["drive-status"],
    queryFn: async () => {
      const res = await fetch("/api/drive/status");
      if (!res.ok) return { connected: false };
      return res.json() as Promise<{ connected: boolean }>;
    },
  });

  const connected = data?.connected ?? false;

  return (
    <section className="p-6 rounded-2xl border border-border-muted bg-surface">
      <h2 className="font-display font-bold text-lg mb-2">Google Drive</h2>
      {connected ? (
        <p className="text-sm text-slate-300">
          Drive connected. Export to Drive from any project&apos;s Export page.
        </p>
      ) : (
        <p className="text-sm text-slate-500 mb-2">
          Sign in with Google to enable export to Drive.
        </p>
      )}
      {!connected && (
        <button
          type="button"
          onClick={() =>
            signIn("google", {
              callbackUrl: "/app/settings",
            })
          }
          className="inline-block mt-2 px-4 py-2 bg-surface border border-white/10 font-mono text-xs uppercase rounded-lg hover:bg-white/5"
        >
          Connect Drive (Sign in with Google)
        </button>
      )}
    </section>
  );
}
