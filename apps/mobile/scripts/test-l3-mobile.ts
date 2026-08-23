// Mobile L3 parity test — mirrors apps/web/scripts/test-l3.ts but
// exercises apps/mobile/src/lib/extractor.ts.
//
// Why a separate test: mobile uses a different ID generator
// (`${Date.now()}-${Math.random().toString(36).slice(2,10)}` instead of
// `crypto.randomUUID()`), and the test catches any drift between the
// two app's pipelines as the codebases evolve.
//
// Run: cd apps/web && npx tsx ../mobile/scripts/test-l3-mobile.ts
// (web has tsx installed; the test only needs pure JS reachability).

import { extractTasks } from "../src/lib/extractor";
import type { ParsedEmail } from "../src/lib/gmail-client";

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

function pe(over: Partial<ParsedEmail>): ParsedEmail {
  return {
    gmailId: "test-1",
    from: "Test <test@example.com>",
    fromEmail: "test@example.com",
    fromDomain: "example.com",
    subject: "",
    snippet: "",
    body: "",
    receivedAt: new Date().toISOString(),
    ...over,
  };
}

(async () => {
  // ---------------------------------------------------------------------------
  // 1. L1 (catalog) still wins on Netflix
  // ---------------------------------------------------------------------------
  const netflix = pe({
    gmailId: "test-netflix",
    from: "Netflix <info@account.netflix.com>",
    fromEmail: "info@account.netflix.com",
    fromDomain: "netflix.com",
    subject: "Your Netflix membership will renew tomorrow",
    body: "Standard plan renews tomorrow for $15.99.",
  });
  const netflixTasks = await extractTasks(netflix);
  check("Netflix email routes to L1 catalog", netflixTasks.length === 1);
  check(
    "Netflix task.derivedFrom.source is 'rule'",
    netflixTasks[0]?.derivedFrom.source === "rule",
    netflixTasks[0]?.derivedFrom,
  );

  // ---------------------------------------------------------------------------
  // 2. L2 (regex) fires on a generic invoice
  // ---------------------------------------------------------------------------
  const invoice = pe({
    gmailId: "test-invoice",
    from: "Random Vendor <billing@randomvendor-12345.io>",
    fromEmail: "billing@randomvendor-12345.io",
    fromDomain: "randomvendor-12345.io",
    subject: "Invoice #4421 — $128.50",
    body: "Your invoice for last month is attached.",
  });
  const invoiceTasks = await extractTasks(invoice);
  check("Invoice email produces a task", invoiceTasks.length === 1);
  check(
    "Invoice task.derivedFrom.source is 'regex' or 'rule'",
    invoiceTasks[0]?.derivedFrom.source === "regex" ||
      invoiceTasks[0]?.derivedFrom.source === "rule",
    invoiceTasks[0]?.derivedFrom.source,
  );

  // ---------------------------------------------------------------------------
  // 3. L3 (model) fires on a clear action email that L1 + L2 miss
  // ---------------------------------------------------------------------------
  const action = pe({
    gmailId: "test-action",
    from: "Random SaaS <hello@random-saas-67890.io>",
    fromEmail: "hello@random-saas-67890.io",
    fromDomain: "random-saas-67890.io",
    subject: "Confirm your email to continue",
    body: "Please verify your email by tomorrow to keep your account active.",
  });
  const actionTasks = await extractTasks(action);
  check("L3-hit email produces exactly one task", actionTasks.length === 1);
  check(
    "L3 task.derivedFrom.source is 'model'",
    actionTasks[0]?.derivedFrom.source === "model",
    actionTasks[0]?.derivedFrom,
  );
  if (actionTasks[0]?.derivedFrom.source === "model") {
    check(
      "L3 task uses heuristic-v0 model id",
      actionTasks[0].derivedFrom.modelId === "heuristic-v0",
    );
    check(
      "L3 task carries a confidence score",
      typeof actionTasks[0].derivedFrom.confidence === "number",
    );
    check(
      "L3 task has at least one matched span",
      actionTasks[0].derivedFrom.matchedSpans.length > 0,
    );
  }

  // ---------------------------------------------------------------------------
  // 4. Bland email produces no task
  // ---------------------------------------------------------------------------
  const bland = pe({
    gmailId: "test-bland",
    subject: "Hello world",
    body: "Nothing important here.",
  });
  const blandTasks = await extractTasks(bland);
  check("Bland email produces zero tasks", blandTasks.length === 0);

  // ---------------------------------------------------------------------------
  // 5. Mobile-specific ID format check
  // ---------------------------------------------------------------------------
  const sample = await extractTasks(netflix);
  check(
    "Mobile task ID matches mobile pattern (timestamp-random, not UUID)",
    !!sample[0]?.id && /^\d{13,}-[a-z0-9]+$/.test(sample[0].id),
    sample[0]?.id,
  );

  // ---------------------------------------------------------------------------
  // 6. extractTasks is async (mobile parity with web after the L3 wiring)
  // ---------------------------------------------------------------------------
  const promise = extractTasks(netflix);
  check(
    "extractTasks returns a Promise (await-able)",
    typeof (promise as unknown as { then?: unknown }).then === "function",
  );
  await promise;

  console.log();
  console.log(`mobile L3 parity: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
})();
