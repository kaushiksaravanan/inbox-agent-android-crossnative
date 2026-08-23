// Integration test runner.
//
// Some tests need a live web server (the OG card pixel regression, eventually
// any future end-to-end UI test). Booting next start manually each time is
// friction; this runner does it for you:
//
//   1. Build if .next doesn't exist or is stale.
//   2. Boot `next start` on port 3000 in the background.
//   3. Wait for /api/health to respond 200.
//   4. Run the OG card test (and any other integration test we add).
//   5. Kill the server cleanly regardless of test outcome.
//   6. Exit with the worst-case exit code.
//
// Run: cd apps/web && npx tsx scripts/run-integration-tests.ts

import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const PORT = 3000;
const URL = `http://localhost:${PORT}`;
const HEALTH_TIMEOUT_MS = 30_000;
const STARTUP_POLL_INTERVAL_MS = 500;

let serverProc: ReturnType<typeof spawn> | null = null;

async function probeHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${URL}/api/health`, {
      signal: AbortSignal.timeout(2000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function waitForServer(): Promise<void> {
  const deadline = Date.now() + HEALTH_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (await probeHealth()) return;
    await sleep(STARTUP_POLL_INTERVAL_MS);
  }
  throw new Error(`server did not respond at ${URL} within ${HEALTH_TIMEOUT_MS}ms`);
}

function killServer() {
  if (serverProc && !serverProc.killed) {
    // SIGTERM on Unix, terminate on Windows
    try {
      serverProc.kill("SIGTERM");
    } catch {
      // ignore — process may already be gone
    }
  }
}

process.on("exit", killServer);
process.on("SIGINT", () => {
  killServer();
  process.exit(130);
});
process.on("SIGTERM", () => {
  killServer();
  process.exit(143);
});

(async () => {
  const cwd = process.cwd();

  // ---------------------------------------------------------------------------
  // 1. Build if needed
  // ---------------------------------------------------------------------------

  const buildIdPath = join(cwd, ".next", "BUILD_ID");
  if (!existsSync(buildIdPath)) {
    console.log("[integration] no .next/BUILD_ID — running next build first");
    const build = spawnSync("npx", ["next", "build"], {
      stdio: "inherit",
      shell: true,
    });
    if (build.status !== 0) {
      console.error("[integration] build failed; aborting");
      process.exit(build.status ?? 1);
    }
  }

  // ---------------------------------------------------------------------------
  // 2. Boot server
  // ---------------------------------------------------------------------------

  console.log(`[integration] booting next start on port ${PORT}…`);
  serverProc = spawn("npx", ["next", "start", "-p", String(PORT)], {
    cwd,
    stdio: ["ignore", "pipe", "pipe"],
    shell: true,
  });

  // Pipe server logs to stderr (debugging) but keep them out of test output.
  serverProc.stderr?.on("data", (chunk: Buffer) => {
    process.stderr.write(`[server] ${chunk.toString()}`);
  });

  try {
    await waitForServer();
    console.log("[integration] server is up");
  } catch (err) {
    console.error(
      `[integration] ${err instanceof Error ? err.message : err}`,
    );
    killServer();
    process.exit(1);
  }

  // ---------------------------------------------------------------------------
  // 3. Run integration tests
  // ---------------------------------------------------------------------------

  let overallExit = 0;
  const tests = [
    { name: "og-card", script: "scripts/test-og-card.ts" },
    { name: "health-contract", script: "scripts/test-health-contract.ts" },
    { name: "welcome-interest", script: "scripts/test-welcome-interest.ts" },
  ];

  for (const t of tests) {
    console.log(`\n[integration] running ${t.name}…`);
    const r = spawnSync("npx", ["tsx", t.script], {
      cwd,
      stdio: "inherit",
      shell: true,
      env: { ...process.env, OG_TEST_BASE: URL },
    });
    if (r.status !== 0) {
      console.error(`[integration] ${t.name} failed (exit ${r.status})`);
      overallExit = r.status ?? 1;
    }
  }

  // ---------------------------------------------------------------------------
  // 4. Cleanup + exit
  // ---------------------------------------------------------------------------

  killServer();
  // Brief moment for the server to actually go down.
  await sleep(500);
  process.exit(overallExit);
})();
