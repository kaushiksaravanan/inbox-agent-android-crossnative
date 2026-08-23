// /api/health response shape contract test.
//
// /status reads /api/health and expects a specific shape — primarily
// envReady.supabase and envReady.googleOAuth. If a future refactor
// renames or removes those fields, /status silently stops working.
// This test asserts the contract.
//
// Requires the server to be running. Skips when it's not, like the
// OG card test. The pre-push hook runs both via the integration
// runner so they're enforced before any push.
//
// Run: cd apps/web && npx tsx scripts/test-health-contract.ts

export {}; // module marker so top-level consts don't collide with sibling
           // test scripts that share the same tsc program scope.

const BASE = process.env.HEALTH_TEST_BASE ?? "http://localhost:3000";

let passed = 0;
let failed = 0;
function check(label: string, cond: boolean, detail?: unknown) {
  if (cond) {
    passed += 1;
    console.log(`✓ ${label}`);
  } else {
    failed += 1;
    console.log(`✗ ${label}`);
    if (detail !== undefined) console.log("  detail:", detail);
  }
}

(async () => {
  // Skip cleanly if no server.
  try {
    await fetch(`${BASE}/api/health`, { signal: AbortSignal.timeout(2000) });
  } catch (err) {
    console.log(
      `SKIP /api/health contract — no server at ${BASE} (${err instanceof Error ? err.message : err}).`,
    );
    process.exit(0);
  }

  const res = await fetch(`${BASE}/api/health`);
  check("status 200", res.status === 200, res.status);

  const body = (await res.json()) as Record<string, unknown>;

  // Top-level shape.
  check("body.ok is boolean", typeof body.ok === "boolean", typeof body.ok);
  check("body.version is string", typeof body.version === "string", body.version);
  check("body.time is ISO string", typeof body.time === "string" && /\d{4}-\d{2}-\d{2}T/.test(body.time as string), body.time);
  check("body.env is string", typeof body.env === "string", body.env);

  // envReady block — what /status depends on.
  check("body.envReady is an object", typeof body.envReady === "object" && body.envReady !== null, body.envReady);

  const envReady = body.envReady as Record<string, unknown> | undefined;
  check(
    "envReady.supabase is boolean",
    typeof envReady?.supabase === "boolean",
    envReady?.supabase,
  );
  check(
    "envReady.googleOAuth is boolean",
    typeof envReady?.googleOAuth === "boolean",
    envReady?.googleOAuth,
  );

  // buildId and commit may be null in dev — but the keys must exist.
  check("body.buildId key is present (may be null)", "buildId" in body, body.buildId);
  check("body.commit key is present (may be null)", "commit" in body, body.commit);

  // ok=true means we are happy.
  check("body.ok === true", body.ok === true);

  console.log();
  console.log(`/api/health contract: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
})();
