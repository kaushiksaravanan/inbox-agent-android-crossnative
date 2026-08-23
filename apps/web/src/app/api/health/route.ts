import { NextResponse } from "next/server";
import { APP_VERSION } from "@inbox/shared";

export const dynamic = "force-dynamic";

/**
 * Liveness probe. Useful for:
 *
 *   - Uptime monitoring (returns 200 with a small JSON body)
 *   - Identifying which deploy is serving (BUILD_ID + version + commit SHA)
 *   - Confirming the server-side env wired up at all (Supabase keys present)
 *
 * No auth. No state. No PII. Anyone can hit it.
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    version: process.env.NEXT_PUBLIC_APP_VERSION || APP_VERSION,
    // Next.js generates a unique BUILD_ID per `next build` and exposes it
    // via this env at runtime. If two pods report different BUILD_IDs,
    // you're mid-rollout.
    buildId: process.env.NEXT_BUILD_ID ?? null,
    // Commit SHA, set by the deploy pipeline. Vercel sets VERCEL_GIT_COMMIT_SHA;
    // generic CI typically sets GIT_COMMIT_SHA or CI_COMMIT_SHA.
    commit:
      process.env.VERCEL_GIT_COMMIT_SHA ??
      process.env.GIT_COMMIT_SHA ??
      process.env.CI_COMMIT_SHA ??
      null,
    // Build-time deploy environment (Vercel: production / preview / development).
    env: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
    // Quick sanity check that env wiring landed at runtime. We DO NOT report
    // values, just whether the key is set — keeps the probe public-safe.
    envReady: {
      supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      googleOAuth: !!process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID,
    },
    time: new Date().toISOString(),
  });
}
