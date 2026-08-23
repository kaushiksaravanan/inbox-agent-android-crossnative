// License + invite code verification.
//
// On a valid code, returns the access bundle: APK download URL, GitHub repo
// link, Discord invite. Payment integration (Stripe/Polar/Lemon) plugs in
// later — for now codes are the only way through.

import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { canon, VALID_CODES } from "@/lib/invite-codes";

export const dynamic = "force-dynamic";

const limit = rateLimit({ bucket: "redeem", max: 10, windowMs: 60_000 });

const RedeemSchema = z.object({
  code: z.string().trim().min(3).max(50),
});

const DISCORD_INVITE = "https://discord.gg/inbox-agent";
const GITHUB_REPO = "https://github.com/inboxagent/inbox-agent";

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

  const parsed = RedeemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "invalid_input" },
      { status: 400 },
    );
  }

  const { code } = parsed.data;
  const normalizedCode = canon(code);

  if (!VALID_CODES.has(normalizedCode)) {
    return NextResponse.json(
      { ok: false, error: "invalid_code" },
      { status: 403 },
    );
  }

  return NextResponse.json({
    ok: true,
    access: {
      apk_url: "/api/download/apk",
      // Token = the canonicalized code; the download endpoint validates it
      // against the same VALID_CODES set, so only redeemed codes pass.
      token: normalizedCode,
      discord_invite: DISCORD_INVITE,
      github_repo: GITHUB_REPO,
      message: `Welcome! Your code "${normalizedCode}" has been accepted. You now have access to the APK, the source code repo (view-only license), and the Discord community.`,
    },
  });
}
