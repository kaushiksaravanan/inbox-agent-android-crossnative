// Smoke test for the new gated/welcome flow.
//
// Asserts that:
//   - GET /welcome unauthenticated returns 307 (redirect to /login)
//   - POST /api/interest accepts a valid allowlisted feature
//   - POST /api/interest rejects an unknown feature
//   - GET /api/interest?feature=X returns a count
//   - POST /api/redeem with a valid code returns a token
//   - GET /api/download/apk?token=<canonical> returns 200 (or 404 if APK missing)
//   - GET /api/download/apk without token returns 403
//
// Skipped silently when no server is reachable.

export {}; // mark this file as a module so top-level consts don't collide
           // with other globally-scoped test scripts in the same tsc program.

const BASE = process.env.BU_TEST_URL ?? "http://localhost:3000";

interface CheckResult {
  name: string;
  pass: boolean;
  detail: string;
}

const results: CheckResult[] = [];

function record(name: string, pass: boolean, detail = "") {
  results.push({ name, pass, detail });
  // eslint-disable-next-line no-console
  console.log(
    pass ? `  ✓ ${name}` : `  ✗ ${name}${detail ? " — " + detail : ""}`,
  );
}

async function main() {
  // Probe to see if a server is reachable.
  try {
    await fetch(`${BASE}/api/health`, {
      method: "GET",
      signal: AbortSignal.timeout(2000),
    });
  } catch {
    // eslint-disable-next-line no-console
    console.log(`SKIP welcome/interest smoke — no server at ${BASE}`);
    return;
  }

  // /welcome unauth → 307
  {
    const r = await fetch(`${BASE}/welcome`, { redirect: "manual" });
    record(
      "/welcome unauth redirects",
      r.status === 307 || r.status === 302,
      `got ${r.status}`,
    );
  }

  // POST /api/interest valid
  {
    const r = await fetch(`${BASE}/api/interest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "smoke@test.local",
        feature: "outlook",
        source: "smoke-test",
      }),
    });
    const data = (await r.json()) as { ok: boolean; count?: number };
    record(
      "POST /api/interest valid feature",
      r.status === 200 && data.ok === true,
      `status=${r.status} body=${JSON.stringify(data)}`,
    );
  }

  // POST /api/interest unknown feature
  {
    const r = await fetch(`${BASE}/api/interest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "smoke@test.local",
        feature: "definitely-not-allowed",
      }),
    });
    record(
      "POST /api/interest unknown feature → 400",
      r.status === 400,
      `got ${r.status}`,
    );
  }

  // GET /api/interest?feature=outlook
  {
    const r = await fetch(`${BASE}/api/interest?feature=outlook`);
    const data = (await r.json()) as { ok: boolean; count?: number };
    record(
      "GET /api/interest count",
      r.status === 200 && data.ok === true && typeof data.count === "number",
      `body=${JSON.stringify(data)}`,
    );
  }

  // POST /api/redeem with valid code → returns token
  let redeemToken: string | undefined;
  {
    const r = await fetch(`${BASE}/api/redeem`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: "hacker news",
      }),
    });
    const data = (await r.json()) as {
      ok: boolean;
      access?: { token?: string };
    };
    redeemToken = data.access?.token;
    record(
      "POST /api/redeem 'hacker news' → token HACKERNEWS",
      r.status === 200 && data.ok === true && redeemToken === "HACKERNEWS",
      `token=${redeemToken}`,
    );
  }

  // GET /api/download/apk without token → 403
  {
    const r = await fetch(`${BASE}/api/download/apk`);
    record(
      "GET /api/download/apk no token → 403",
      r.status === 403,
      `got ${r.status}`,
    );
  }

  // GET /api/download/apk with garbage token → 403
  {
    const r = await fetch(`${BASE}/api/download/apk?token=ABCDEFGH`);
    record(
      "GET /api/download/apk garbage token → 403",
      r.status === 403,
      `got ${r.status}`,
    );
  }

  // GET /api/download/apk with valid token → 200 (or 404 if APK missing)
  if (redeemToken) {
    const r = await fetch(`${BASE}/api/download/apk?token=${redeemToken}`, {
      method: "HEAD",
    });
    record(
      "GET /api/download/apk valid token → 200/404",
      r.status === 200 || r.status === 404,
      `got ${r.status}`,
    );
  }

  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass).length;
  // eslint-disable-next-line no-console
  console.log(`welcome+interest smoke: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("smoke harness error:", err);
  process.exit(1);
});
