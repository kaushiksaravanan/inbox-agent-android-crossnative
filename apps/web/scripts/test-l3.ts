// L3 extractor smoke test.
//
// Verifies that:
//   1. HeuristicL3.isApplicable() short-circuits on obviously-irrelevant text.
//   2. HeuristicL3.extract() returns a structured L3Result for emails that
//      contain action verbs / amounts / deadlines.
//   3. The taskFromL3 wiring produces a Task with derivedFrom.source = "model".
//   4. The whole pipeline routes L1-miss + L2-miss + L3-hit emails correctly.
//
// Run: cd apps/web && npx tsx scripts/test-l3.ts

import { HeuristicL3, DEFAULT_L3 } from "../../../packages/shared/src/extractor-l3";
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

// ---------------------------------------------------------------------------
// 1. isApplicable short-circuits irrelevant text
// ---------------------------------------------------------------------------

const l3 = new HeuristicL3();

check(
  "isApplicable returns false on bland marketing copy",
  !l3.isApplicable({
    subject: "Weekly newsletter — top 5 reads",
    body: "Here are some links you might enjoy this week.",
    fromDomain: "newsletter.example.com",
    fromEmail: "news@example.com",
  }),
);

check(
  "isApplicable returns true on a cancel/renewal email",
  l3.isApplicable({
    subject: "Your subscription renews tomorrow",
    body: "Cancel before renewal to avoid the $14.99 charge.",
    fromDomain: "some-saas.com",
    fromEmail: "billing@some-saas.com",
  }),
);

// ---------------------------------------------------------------------------
// 2. extract returns structured spans
// ---------------------------------------------------------------------------

(async () => {
  const result = await l3.extract({
    subject: "Cancel your trial before tomorrow — $19.99",
    body: "Your trial expires tomorrow. Cancel from your account page to avoid the charge.",
    fromDomain: "unknownapp.io",
    fromEmail: "no-reply@unknownapp.io",
  });

  check("extract returns a result for a clear action email", result !== null, result);
  check(
    "result.modelId is heuristic-v0",
    result?.modelId === "heuristic-v0",
    result?.modelId,
  );
  check(
    "result has an ACTION_VERB span",
    !!result?.spans.find((s) => s.label === "ACTION_VERB"),
    result?.spans,
  );
  check(
    "result has an AMOUNT span",
    !!result?.spans.find((s) => s.label === "AMOUNT"),
    result?.spans,
  );
  check(
    "result has a DEADLINE span",
    !!result?.spans.find((s) => s.label === "DEADLINE"),
    result?.spans,
  );
  check(
    "overall confidence is between 0 and 1",
    (result?.overallConfidence ?? -1) > 0 && (result?.overallConfidence ?? 2) <= 1,
    result?.overallConfidence,
  );

  // ---------------------------------------------------------------------------
  // 3. extract returns null on insufficient signal
  // ---------------------------------------------------------------------------

  const bland = await l3.extract({
    subject: "Hi from us",
    body: "Just wanted to check in.",
    fromDomain: "friend.example.com",
    fromEmail: "friend@example.com",
  });

  check("extract returns null on bland text", bland === null, bland);

  // ---------------------------------------------------------------------------
  // 4. Pipeline: L1 miss + L2 miss + L3 hit → model-source task
  // ---------------------------------------------------------------------------

  const email = pe({
    gmailId: "test-pipeline-1",
    from: "Random SaaS <hello@random-saas-12345.io>",
    fromEmail: "hello@random-saas-12345.io",
    fromDomain: "random-saas-12345.io",
    subject: "Confirm your email to continue",
    body: "Please verify your email by tomorrow to keep your account active.",
  });

  const tasks = await extractTasks(email);
  check("pipeline produces exactly one task for L3-hit email", tasks.length === 1, tasks);
  check(
    "task derivedFrom.source is 'model'",
    tasks[0]?.derivedFrom.source === "model",
    tasks[0]?.derivedFrom,
  );
  if (tasks[0]?.derivedFrom.source === "model") {
    check(
      "task derivedFrom.modelId is 'heuristic-v0'",
      tasks[0].derivedFrom.modelId === "heuristic-v0",
      tasks[0].derivedFrom.modelId,
    );
    check(
      "task derivedFrom.confidence is a number",
      typeof tasks[0].derivedFrom.confidence === "number",
      tasks[0].derivedFrom.confidence,
    );
    check(
      "task derivedFrom carries at least one span",
      tasks[0].derivedFrom.matchedSpans.length > 0,
      tasks[0].derivedFrom.matchedSpans,
    );
  }

  // ---------------------------------------------------------------------------
  // 5. Pipeline: L1 hit still wins
  // ---------------------------------------------------------------------------

  const netflix = pe({
    gmailId: "test-pipeline-2",
    from: "Netflix <info@account.netflix.com>",
    fromEmail: "info@account.netflix.com",
    fromDomain: "netflix.com",
    subject: "Your Netflix membership will renew tomorrow",
    body: "Standard plan renews tomorrow for $15.99.",
  });

  const netflixTasks = await extractTasks(netflix);
  check(
    "Netflix email still routed to L1 (catalog), not L3",
    netflixTasks[0]?.derivedFrom.source === "rule",
    netflixTasks[0]?.derivedFrom,
  );

  // ---------------------------------------------------------------------------
  // 6. Pipeline: bland email produces nothing
  // ---------------------------------------------------------------------------

  const noise = pe({
    gmailId: "test-pipeline-3",
    subject: "Hello world",
    body: "Nothing important here.",
  });

  const noiseTasks = await extractTasks(noise);
  check("bland email produces no task", noiseTasks.length === 0, noiseTasks);

  // ---------------------------------------------------------------------------
  // DEFAULT_L3 sanity
  // ---------------------------------------------------------------------------

  check(
    "DEFAULT_L3 is a HeuristicL3 instance",
    DEFAULT_L3.id === "heuristic-v0",
  );

  console.log();
  console.log(`L3 smoke test: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
})();
