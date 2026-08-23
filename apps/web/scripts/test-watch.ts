// Watch-mode test runner.
//
// `pnpm test` runs the full suite, which is great for CI but slow for
// iteration. This script lets you focus on a single test (or pattern)
// and re-runs it whenever the test or its imports change.
//
// Usage:
//   pnpm test:watch                       # interactive picker (lists scripts)
//   pnpm test:watch l3                    # runs scripts/test-l3.ts on change
//   pnpm test:watch barrel                # runs the @inbox/shared barrel test
//   pnpm test:watch check-spec            # runs the SPEC consistency check
//
// The match is a substring against the script filename. We use tsx's
// built-in --watch so file-change detection comes for free.

import { spawn } from "node:child_process";
import { readdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import * as readline from "node:readline";

const REPO_ROOT = resolve(__dirname, "..", "..", "..");

interface TestScript {
  name: string;
  path: string; // absolute
}

function discoverTests(): TestScript[] {
  const dirs = [
    "apps/web/scripts",
    "apps/mobile/scripts",
    "packages/shared/scripts",
    "scripts",
  ];

  const out: TestScript[] = [];
  for (const d of dirs) {
    const abs = join(REPO_ROOT, d);
    if (!existsSync(abs)) continue;
    for (const entry of readdirSync(abs)) {
      if (
        entry.endsWith(".ts") &&
        (entry.startsWith("test-") || entry.startsWith("check-"))
      ) {
        out.push({ name: entry.replace(/\.ts$/, ""), path: join(abs, entry) });
      }
    }
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

async function pickInteractively(scripts: TestScript[]): Promise<TestScript> {
  console.log("\nAvailable test scripts:");
  scripts.forEach((s, i) => {
    console.log(`  ${(i + 1).toString().padStart(2)}. ${s.name}`);
  });

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve, reject) => {
    rl.question("\nPick a number (or substring): ", (answer) => {
      rl.close();
      const trimmed = answer.trim();

      const asNum = parseInt(trimmed, 10);
      if (!Number.isNaN(asNum) && asNum >= 1 && asNum <= scripts.length) {
        resolve(scripts[asNum - 1]!);
        return;
      }

      const match = scripts.find((s) => s.name.includes(trimmed));
      if (match) {
        resolve(match);
      } else {
        reject(new Error(`No test script matches "${trimmed}"`));
      }
    });
  });
}

(async () => {
  const scripts = discoverTests();
  if (scripts.length === 0) {
    console.error("No test scripts discovered.");
    process.exit(1);
  }

  const arg = process.argv[2]?.trim();
  let target: TestScript;

  if (arg) {
    const match = scripts.find((s) => s.name.includes(arg));
    if (!match) {
      console.error(`No test script matches "${arg}". Available:`);
      for (const s of scripts) console.error(`  - ${s.name}`);
      process.exit(1);
    }
    target = match;
  } else {
    try {
      target = await pickInteractively(scripts);
    } catch (err) {
      console.error(err instanceof Error ? err.message : err);
      process.exit(1);
    }
  }

  console.log(`\n[watch] Watching ${target.name}.ts. Ctrl-C to exit.\n`);

  const child = spawn(
    "npx",
    ["tsx", "--watch", target.path],
    { stdio: "inherit", shell: true },
  );

  process.on("SIGINT", () => {
    child.kill("SIGINT");
    process.exit(0);
  });

  child.on("exit", (code) => process.exit(code ?? 0));
})();
