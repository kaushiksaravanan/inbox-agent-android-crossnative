import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { appendFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

export const dynamic = "force-dynamic";

const ContactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Invalid email").max(200),
  message: z.string().trim().min(5, "Message is too short").max(5000),
});

// 5 contact form submissions per IP per minute. Above this, a single client
// is either malfunctioning or being malicious.
const limit = rateLimit({ bucket: "contact", max: 5, windowMs: 60_000 });

const TO_EMAIL = process.env.CONTACT_TO_EMAIL ?? "hi@inbox.agent";
const FROM_EMAIL = process.env.CONTACT_FROM_EMAIL ?? "contact@inbox.agent";
const RESEND_KEY = process.env.RESEND_API_KEY;

async function sendViaResend(opts: {
  name: string;
  email: string;
  message: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!RESEND_KEY) return { ok: false, error: "no_api_key" };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Inbox Agent <${FROM_EMAIL}>`,
        to: TO_EMAIL,
        reply_to: opts.email,
        subject: `New contact: ${opts.name}`,
        text: `From: ${opts.name} <${opts.email}>\n\n${opts.message}`,
      }),
    });
    if (!res.ok) return { ok: false, error: `resend_${res.status}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "fetch_failed" };
  }
}

function appendToDisk(entry: object) {
  const dir = join(process.cwd(), ".data", "contact");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  appendFileSync(join(dir, "messages.jsonl"), JSON.stringify(entry) + "\n", "utf8");
}

export async function POST(request: Request) {
  const rate = limit(request);
  if (!rate.ok) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rate.retryAfter) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const parsed = ContactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { name, email, message } = parsed.data;
  const entry = { receivedAt: new Date().toISOString(), name, email, message };

  // Always persist to disk so messages survive a Resend outage. Then try to
  // forward via email; failure is logged but the user still gets a success
  // response (their message IS stored).
  try {
    appendToDisk(entry);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[contact] disk persist failed:", err);
  }

  const send = await sendViaResend({ name, email, message });
  if (!send.ok) {
    // eslint-disable-next-line no-console
    console.warn(`[contact] email delivery failed (${send.error}) — message persisted to disk only`);
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json(
    { ok: false, error: "Method Not Allowed" },
    { status: 405, headers: { Allow: "POST" } },
  );
}
