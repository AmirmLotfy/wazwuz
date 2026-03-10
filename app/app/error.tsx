"use client";

import Link from "next/link";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
      <h1 className="font-display text-2xl font-bold mb-2">App error</h1>
      <p className="text-slate-500 text-sm mb-6 max-w-md text-center">
        {error.message || "Something went wrong in the app."}
      </p>
      <div className="flex gap-4">
        <button
          type="button"
          onClick={reset}
          className="px-4 py-2 bg-primary text-background-dark font-mono text-xs uppercase rounded-lg hover:opacity-90"
        >
          Try again
        </button>
        <Link
          href="/app"
          className="px-4 py-2 bg-surface border border-white/10 font-mono text-xs uppercase rounded-lg hover:bg-white/5"
        >
          Back to app
        </Link>
      </div>
    </div>
  );
}
