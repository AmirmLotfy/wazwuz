"use client";

import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-8 font-sans">
        <h1 className="font-display text-2xl font-bold mb-2">Something went wrong</h1>
        <p className="text-slate-500 text-sm mb-6 max-w-md text-center">
          {error.message || "An unexpected error occurred."}
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
            href="/"
            className="px-4 py-2 bg-surface border border-white/10 font-mono text-xs uppercase rounded-lg hover:bg-white/5"
          >
            Go home
          </Link>
        </div>
      </body>
    </html>
  );
}
