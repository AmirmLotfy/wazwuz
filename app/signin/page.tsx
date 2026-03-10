"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function SignInForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/app";
  const [email, setEmail] = useState("");
  const [magicSent, setMagicSent] = useState(false);
  const [magicError, setMagicError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setMagicError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, callbackUrl }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMagicError(data.error ?? "Failed to send link");
        return;
      }
      setMagicSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="font-display text-4xl font-bold text-foreground mb-2">
            Step into the lab
          </h1>
          <p className="font-mono text-xs text-slate-500 uppercase tracking-widest">
            Sign in to start creating
          </p>
        </div>
        <div className="space-y-4">
          <form
            action={async () => {
              await signIn("google", { callbackUrl });
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 px-6 h-14 bg-surface border border-border-muted hover:border-primary/50 rounded-xl text-slate-200 font-medium transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </button>
          </form>
          <div className="flex items-center gap-4 py-2">
            <div className="h-px grow bg-border-muted/50" />
            <span className="font-mono text-[10px] text-slate-600 uppercase tracking-widest">
              Or sign in with email
            </span>
            <div className="h-px grow bg-border-muted/50" />
          </div>
          {magicSent ? (
            <p className="text-center text-sm text-accent-pistachio">
              Check your inbox for the sign-in link.
            </p>
          ) : (
            <form onSubmit={handleMagicLink} className="space-y-3">
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface border border-border-muted rounded-xl h-12 px-4 text-foreground placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
              {magicError && (
                <p className="text-sm text-accent-coral">{magicError}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary text-background-dark font-display font-bold rounded-xl hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Sending…" : "Send magic link"}
              </button>
            </form>
          )}
        </div>
        <p className="text-center text-sm text-slate-500">
          <Link href="/" className="text-primary hover:underline">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Loading…</div>}>
      <SignInForm />
    </Suspense>
  );
}
