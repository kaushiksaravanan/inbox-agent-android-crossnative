// POST /api/interest — record a user's interest in a not-yet-shipped feature.
//
// Powers all the "(soon)" / "notify me" / "express interest" CTAs across the
// site. Each request is rate-limited and the feature key is allowlisted so
// arbitrary writes are impossible.

import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { recordInterest, countInterest, VALID_FEATURES } from "@/lib/interest-store";

export const dynamic = "force-dynamic";

const limit = rateLimit({ bucket: "interest", max: 5, windowMs: 60_000 });

const InterestSchema = z.object({
  email: z.string().email(),
  feature: z.string().min(2).max(40),
  source: z.string().max(80).optional(),
});

function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(request: Request) {
  const rate = limit(request);
  if (!rate.ok) {
    return NextResponse.json(
      { ok: false, error: "rate_limited", retryAfter: rate.retryAfter },
      { status: 429, headers: { "Retry-After": String(rate.retryAfter) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json" },
      { status: 400 },
    );
  }

  const parsed = InterestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "invalid_input" },
      { status: 400 },
    );
  }

  const { email, feature, source } = parsed.data;
  if (!VALID_FEATURES.has(feature)) {
    return NextResponse.json(
      { ok: false, error: "unknown_feature" },
      { status: 400 },
    );
  }

  recordInterest({
    email,
    feature,
    source,
    ip: clientIp(request),
    ua: request.headers.get("user-agent") ?? undefined,
  });

  return NextResponse.json({
    ok: true,
    count: countInterest(feature),
    message: `You're on the list. We'll email ${email} the moment ${feature} ships.`,
  });
}

export async function GET(request: Request) {
  // Public count endpoint — lets us show "423 people waiting for Outlook"
  // social-proof numbers on the landing page without exposing emails.
  const feature = new URL(request.url).searchParams.get("feature");
  if (!feature || !VALID_FEATURES.has(feature)) {
    return NextResponse.json(
      { ok: false, error: "unknown_feature" },
      { status: 400 },
    );
  }
  return NextResponse.json({
    ok: true,
    feature,
    count: countInterest(feature),
  });
}
