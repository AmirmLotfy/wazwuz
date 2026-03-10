import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createVerificationToken,
  createToken,
} from "@/lib/auth/verification-tokens";

const schema = z.object({
  email: z.string().email(),
  callbackUrl: z.string().optional(),
});
const RATE_LIMIT_MS = 60_000;
const rateLimitStore = new Map<string, number>();

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid email", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { email } = parsed.data;
  const callbackUrl = parsed.data.callbackUrl;
  const forwardedFor = req.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() ?? "unknown";
  const rateKey = `${ip}:${email.toLowerCase()}`;
  const lastSentAt = rateLimitStore.get(rateKey);
  if (lastSentAt && Date.now() - lastSentAt < RATE_LIMIT_MS) {
    return NextResponse.json(
      { error: "Please wait before requesting another link." },
      { status: 429 }
    );
  }
  rateLimitStore.set(rateKey, Date.now());

  const token = createToken();
  await createVerificationToken(email, token);
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const verifiedCallback =
    callbackUrl && callbackUrl.startsWith("/")
      ? callbackUrl
      : "/app";
  const url = `${baseUrl}/signin/verify?token=${encodeURIComponent(token)}&callbackUrl=${encodeURIComponent(verifiedCallback)}`;
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM ?? "Wazwuz <onboarding@resend.dev>",
          to: email,
          subject: "Sign in to Wazwuz",
          html: `Click to sign in: <a href="${url}">${url}</a> (expires in 24 hours).`,
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        console.error("Resend error:", err);
        return NextResponse.json(
          { error: "Failed to send email" },
          { status: 500 }
        );
      }
    } catch (e) {
      console.error(e);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }
  } else if (process.env.NODE_ENV !== "production") {
    console.log("[Magic link] Email provider not configured; delivery skipped.");
  }
  return NextResponse.json({ ok: true, message: "Check your email" });
}
