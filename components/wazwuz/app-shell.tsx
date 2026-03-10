"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { signOut } from "next-auth/react";
import type { User } from "next-auth";
import { useState } from "react";

const nav = [
  { href: "/app", label: "Home" },
  { href: "/app/library", label: "Library" },
  { href: "/app/camera", label: "Camera" },
  { href: "/app/studio", label: "Studio" },
  { href: "/app/recipes", label: "Recipes" },
  { href: "/app/settings", label: "Settings" },
  { href: "/app/help", label: "Help" },
];

function isNavActive(pathname: string, href: string): boolean {
  if (href === "/app") return pathname === "/app";
  if (href === "/app/studio") {
    return pathname.startsWith("/app/studio") || pathname.startsWith("/app/project/");
  }
  return pathname.startsWith(href);
}

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: User;
}) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  return (
    <>
      <header className="flex items-center justify-between border-b border-white/5 px-6 py-3 bg-background-dark/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <Link href="/app" className="flex items-center gap-3">
            <div className="size-8 bg-primary rounded flex items-center justify-center text-background-dark">
              <Image src="/logo-icon.png" alt="" width={20} height={20} />
            </div>
            <span className="text-lg font-bold tracking-tight font-display uppercase italic">
              Wazwuz <span className="text-primary/80">Live</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            {nav.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`text-xs uppercase tracking-widest font-medium transition-opacity ${
                  isNavActive(pathname, href)
                    ? "text-primary opacity-100"
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setMobileNavOpen((v) => !v)}
            className="md:hidden text-xs font-mono uppercase tracking-widest text-slate-400 hover:text-primary"
          >
            Menu
          </button>
          <div className="flex items-center bg-surface border border-white/10 rounded-lg px-3 py-1.5 gap-2">
            <span className="size-2 rounded-full bg-primary animate-pulse" />
            <span className="font-mono text-[10px] uppercase tracking-tighter opacity-70">
              Sync
            </span>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-xs font-mono uppercase tracking-widest text-slate-400 hover:text-primary transition-colors"
          >
            Sign out
          </button>
          {user.image ? (
            <img
              src={user.image}
              alt=""
              className="size-8 rounded-full border border-primary/30 object-cover"
            />
          ) : (
            <div className="size-8 rounded-full border border-primary/30 bg-surface flex items-center justify-center font-mono text-xs text-primary">
              {user.email?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
        </div>
      </header>
      {mobileNavOpen && (
        <nav className="md:hidden border-b border-white/5 px-6 py-3 bg-surface/70 backdrop-blur-md flex flex-wrap gap-3">
          {nav.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileNavOpen(false)}
              className={`text-xs uppercase tracking-widest font-medium ${
                isNavActive(pathname, href) ? "text-primary" : "text-slate-400 hover:text-primary"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      )}
      <main className="flex-1 overflow-auto">{children}</main>
    </>
  );
}
