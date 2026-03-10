import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import * as usersRepo from "@/server/repositories/users";
import { useVerificationToken as consumeVerificationToken } from "@/lib/auth/verification-tokens";

function normalizeEmail(email?: string | null): string | undefined {
  return email?.trim().toLowerCase();
}

async function refreshGoogleAccessToken(token: Record<string, unknown>) {
  const refreshToken = token.refresh_token as string | undefined;
  if (!refreshToken) return { ...token, token_error: "missing_refresh_token" };

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    });
    const refreshed = (await res.json()) as {
      access_token?: string;
      expires_in?: number;
      refresh_token?: string;
      error?: string;
    };
    if (!res.ok || !refreshed.access_token) {
      return { ...token, token_error: refreshed.error ?? "refresh_failed" };
    }
    return {
      ...token,
      access_token: refreshed.access_token,
      expires_at: Math.floor(Date.now() / 1000 + (refreshed.expires_in ?? 3600)),
      refresh_token: refreshed.refresh_token ?? refreshToken,
      token_error: undefined,
    };
  } catch {
    return { ...token, token_error: "refresh_failed" };
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile https://www.googleapis.com/auth/drive.file",
        },
      },
    }),
    Credentials({
      id: "magic-link",
      name: "Magic Link",
      credentials: { token: { label: "Token", type: "text" } },
      async authorize(credentials) {
        const token = credentials?.token as string | undefined;
        if (!token) return null;
        const identifier = await consumeVerificationToken(token);
        if (!identifier) return null;
        await usersRepo.createOrUpdateUser(identifier, {
          email: identifier,
          name: null,
          avatarUrl: null,
        });
        return { id: identifier, email: identifier, name: null, image: null };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const canonicalEmail = normalizeEmail(user.email);
        const id = canonicalEmail ?? account.providerAccountId ?? "unknown";
        await usersRepo.createOrUpdateUser(id, {
          email: canonicalEmail ?? null,
          name: user.name ?? null,
          avatarUrl: user.image ?? null,
        });
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id =
          (token.uid as string | undefined) ?? (token.sub as string | undefined);
      }
      (session as { driveConnected?: boolean }).driveConnected = Boolean(
        token.access_token
      );
      return session;
    },
    async jwt({ token, user, account }) {
      const mutable = token as Record<string, unknown>;
      const emailFromUser = normalizeEmail((user as { email?: string | null } | undefined)?.email);
      if (user) {
        mutable.uid = emailFromUser ?? (user as { id?: string }).id ?? mutable.uid ?? mutable.sub;
      }

      if (account?.provider === "google") {
        if (account.access_token) mutable.access_token = account.access_token;
        if (account.refresh_token) mutable.refresh_token = account.refresh_token;
        if (account.expires_at) mutable.expires_at = account.expires_at;
      }

      const expiresAt = mutable.expires_at as number | undefined;
      if (expiresAt && Date.now() / 1000 > expiresAt - 60) {
        return refreshGoogleAccessToken(mutable);
      }
      return mutable;
    },
  },
  pages: {
    signIn: "/signin",
  },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  trustHost: true,
});
