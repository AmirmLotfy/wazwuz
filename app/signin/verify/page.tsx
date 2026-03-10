"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function VerifyMagicLinkContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const callbackUrl = searchParams.get("callbackUrl") ?? "/app";
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    if (!token) {
      return;
    }
    signIn("magic-link", {
      token,
      redirect: false,
      callbackUrl,
    })
      .then((res) => {
      if (res?.ok && res.url) {
        setStatus("ok");
        router.push(res.url);
      } else {
        setStatus("error");
      }
    })
      .catch(() => setStatus("error"));
  }, [token, router, callbackUrl]);

  if (!token || status === "error") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-accent-coral">Invalid or expired link.</p>
        <Link href="/signin" className="text-primary font-mono text-sm uppercase">
          Back to sign in
        </Link>
      </div>
    );
  }
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-mono text-slate-500">Verifying link…</p>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="font-mono text-slate-500">Redirecting…</p>
    </div>
  );
}

export default function VerifyMagicLinkPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Verifying link…</div>}>
      <VerifyMagicLinkContent />
    </Suspense>
  );
}
