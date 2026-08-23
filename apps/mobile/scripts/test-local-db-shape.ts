// Shape test for apps/mobile/src/lib/local-db.ts.
//
// We can't actually execute the mobile local-db from Node — it
// depends on expo-sqlite, which only loads inside a React Native
// runtime. But we CAN parse the source file and verify it exports
// the expected surface, so a refactor that removes or renames a
// function fails the test instead of crashing the app at runtime.
//
// Run: cd apps/web && npx tsx ../mobile/scripts/test-local-db-shape.ts

import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const REPO_ROOT = resolve(__dirname, "..", "..", "..");
const LOCAL_DB_PATH = join(REPO_ROOT, "apps/mobile/src/lib/local-db.ts");

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

const source = readFileSync(LOCAL_DB_PATH, "utf8");

// Functions the rest of the mobile app imports. If any of these
// disappear or get renamed, app code stops compiling — but the
// failure mode is downstream and hard to diagnose. This test
// surfaces it immediately and in one place.
const requiredExports: Array<{ name: string; signaturePattern: RegExp }> = [
  { name: "openLocalDb", signaturePattern: /export\s+function\s+openLocalDb\s*\(\s*\)/ },
  { name: "getAllTasks", signaturePattern: /export\s+async\s+function\s+getAllTasks/ },
  { name: "addTask", signaturePattern: /export\s+async\s+function\s+addTask\s*\(/ },
  { name: "updateTask", signaturePattern: /export\s+async\s+function\s+updateTask\s*\(/ },
  { name: "deleteTask", signaturePattern: /export\s+async\s+function\s+deleteTask\s*\(/ },
  { name: "markEmailSeen", signaturePattern: /export\s+async\s+function\s+markEmailSeen\s*\(/ },
  { name: "isEmailSeen", signaturePattern: /export\s+async\s+function\s+isEmailSeen\s*\(/ },
  { name: "getMeta", signaturePattern: /export\s+async\s+function\s+getMeta\s*</ },
  { name: "setMeta", signaturePattern: /export\s+async\s+function\s+setMeta\s*</ },
  { name: "clearAll", signaturePattern: /export\s+async\s+function\s+clearAll\s*\(/ },
  { name: "getTaskCount", signaturePattern: /export\s+async\s+function\s+getTaskCount\s*\(/ },
];

for (const exp of requiredExports) {
  check(
    `exports ${exp.name}() with expected signature`,
    exp.signaturePattern.test(source),
  );
}

// expo-sqlite must be the underlying storage. If someone swaps to
// AsyncStorage or another adapter, that's a meaningful change that
// should be discussed; this test surfaces it.
check(
  "module imports from 'expo-sqlite'",
  /from\s+['"]expo-sqlite['"]/.test(source),
);

// The schema must declare all the stores the web client also has
// (tasks, emails_seen, meta) for parity.
check("schema mentions 'tasks' table", /\btasks\b/.test(source));
check("schema mentions 'emails_seen' table", /\bemails_seen\b/.test(source));
check("schema mentions 'meta' table", /\bmeta\b/.test(source));

console.log();
console.log(`mobile local-db shape: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
