// Task extraction pipeline.
//
// Layer 1 — Sender catalog (matchEmail from @inbox/shared/sender-catalog).
//   Domain + subject/body regex rules. Highest precision; returns a fully
//   typed match with title, action, priority, and extracted fields.
//
// Layer 2 — Generic regex fallback for invoices/receipts.
//   Catches "Invoice #123" / "Receipt for ..." patterns from senders the
//   catalog does not know about. Lower precision; only fires when L1 misses.
//
// Layer 3 — Span-tagging "model" source (DEFAULT_L3 from @inbox/shared).
//   Today a HeuristicL3; tomorrow swappable for a quantized GLiNER ONNX
//   without touching this file. Emits derivedFrom.source = "model" with
//   per-span confidence scores.

import {
  matchEmail,
  SENDER_CATALOG,
  type MatchResult,
  type EmailCategory,
} from "@inbox/shared/sender-catalog";
import type {
  Task,
  TaskCategory,
  TaskPriority,
  TaskDerivation,
  L3Result,
  L3Span,
  Layer3Extractor,
} from "@inbox/shared";
import { DEFAULT_L3 } from "@inbox/shared";

import type { ParsedEmail } from "./gmail-client";

// Keep a reference so tree-shakers don't drop the catalog import; also lets
// downstream code (debug UI, tests) inspect what rules are loaded.
export { SENDER_CATALOG };

// ---------------------------------------------------------------------------
// Category mapping
// ---------------------------------------------------------------------------

const CATEGORY_MAP: Record<EmailCategory, TaskCategory> = {
  subscription: "subscription",
  payment: "payment",
  deadline: "deadline",
  autopay: "autopay",
  shipping: "other",
  verification: "other",
  calendar: "followup",
  other: "other",
};

function mapCategory(c: EmailCategory): TaskCategory {
  return CATEGORY_MAP[c] ?? "other";
}

// ---------------------------------------------------------------------------
// Amount / date helpers
// ---------------------------------------------------------------------------

function parseAmountCents(raw: string | undefined): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

function parseDueAt(raw: string | undefined): string | null {
  if (!raw) return null;
  // Append a year heuristic if missing — Gmail dates often omit it for
  // "renews on October 5".
  const text = /\d{4}/.test(raw) ? raw : `${raw} ${new Date().getFullYear()}`;
  const t = Date.parse(text);
  if (!Number.isFinite(t)) return null;
  return new Date(t).toISOString();
}

// ---------------------------------------------------------------------------
// Layer 1 — catalog
// ---------------------------------------------------------------------------

function taskFromCatalogMatch(email: ParsedEmail, match: MatchResult): Task {
  const derivedFrom: TaskDerivation = {
    source: "rule",
    ruleId: `${match.ruleId}:${match.action.toLowerCase().replace(/\s+/g, "_")}`,
    domain: email.fromDomain,
    matchedPattern: `domain=${email.fromDomain}; subject ~ catalog[${match.ruleId}]`,
    matchedSpans: [
      { field: "from", text: email.from },
      { field: "subject", text: email.subject },
    ],
  };

  return baseTask(email, {
    title: match.title,
    detail: match.action,
    category: mapCategory(match.category),
    priority: match.priority as TaskPriority,
    due_at: parseDueAt(match.extracted.date),
    amount_cents: parseAmountCents(match.extracted.amount),
    counterparty: match.extracted.counterparty ?? match.displayName,
    derivedFrom,
  });
}

// ---------------------------------------------------------------------------
// Layer 2 — generic invoice / receipt regex
// ---------------------------------------------------------------------------

interface RegexRule {
  id: string;
  test: (email: ParsedEmail) => RegExpMatchArray | null;
  build: (
    email: ParsedEmail,
    m: RegExpMatchArray
  ) => {
    title: string;
    category: TaskCategory;
    priority: TaskPriority;
    detail: string;
    field: "subject" | "body";
  };
}

const AMOUNT_RE = /\$\s?([\d,]+\.\d{2})/;

const L2_RULES: RegexRule[] = [
  {
    id: "invoice_subject",
    test: (e) =>
      e.subject.match(
        /\b(invoice|bill)\b.*?(?:#|number\s*:?\s*)?([A-Z0-9-]{3,})?/i
      ),
    build: (e) => {
      const amount = (e.body || e.subject).match(AMOUNT_RE);
      const amountStr = amount ? ` — $${amount[1]}` : "";
      return {
        title: `Pay invoice${amountStr}`,
        category: "payment",
        priority: "high",
        detail: e.subject,
        field: "subject",
      };
    },
  },
  {
    id: "receipt_subject",
    test: (e) =>
      e.subject.match(/\b(receipt|order confirmation)\b/i),
    build: (e) => {
      const amount = (e.body || e.subject).match(AMOUNT_RE);
      const amountStr = amount ? ` — $${amount[1]}` : "";
      return {
        title: `Review receipt${amountStr}`,
        category: "other",
        priority: "low",
        detail: e.subject,
        field: "subject",
      };
    },
  },
  {
    id: "payment_due_subject",
    test: (e) =>
      e.subject.match(/\b(payment\s+(due|reminder)|amount\s+due|due\s+date)\b/i),
    build: (e) => {
      const amount = (e.body || e.subject).match(AMOUNT_RE);
      const amountStr = amount ? ` — $${amount[1]}` : "";
      return {
        title: `Pay${amountStr}`,
        category: "payment",
        priority: "urgent",
        detail: e.subject,
        field: "subject",
      };
    },
  },
];

function taskFromRegex(email: ParsedEmail): Task | null {
  for (const rule of L2_RULES) {
    const m = rule.test(email);
    if (!m) continue;
    const built = rule.build(email, m);
    const derivedFrom: TaskDerivation = {
      source: "regex",
      patternId: rule.id,
      matchedSpans: [{ field: built.field, text: m[0] }],
    };
    const amount = (email.body || email.subject).match(AMOUNT_RE);
    return baseTask(email, {
      title: built.title,
      detail: built.detail,
      category: built.category,
      priority: built.priority,
      due_at: null,
      amount_cents: parseAmountCents(amount?.[1]),
      counterparty: email.fromDomain || email.fromEmail,
      derivedFrom,
    });
  }
  return null;
}

// ---------------------------------------------------------------------------
// Layer 3 — model-source (HeuristicL3 today, GLiNER later)
// ---------------------------------------------------------------------------

const ACTION_TITLE_PREFIX: Record<string, string> = {
  cancel: "Cancel",
  unsubscribe: "Unsubscribe",
  "opt-out": "Opt out of",
  "opt out": "Opt out of",
  confirm: "Confirm",
  verify: "Verify",
  approve: "Approve",
  pay: "Pay",
  settle: "Pay",
  "submit payment": "Pay",
  renew: "Review renewal —",
  renewal: "Review renewal —",
  "auto-renew": "Review auto-renewal —",
  "auto renew": "Review auto-renewal —",
  reply: "Reply to",
  respond: "Reply to",
  review: "Review",
  sign: "Sign",
  reschedule: "Reschedule",
  update: "Update",
  change: "Update",
};

function priorityFromL3(spans: L3Span[]): TaskPriority {
  const hint = spans.find((s) => s.label === "PRIORITY_HINT");
  if (!hint) return "low";
  if (hint.confidence >= 0.85) return "urgent";
  if (hint.confidence >= 0.7) return "high";
  return "medium";
}

function categoryFromL3(spans: L3Span[]): TaskCategory {
  const action = spans.find((s) => s.label === "ACTION_VERB")?.text.toLowerCase();
  if (!action) return "other";
  if (/pay|settle/.test(action)) return "payment";
  if (/cancel|unsubscribe|opt[- ]out|renew/.test(action)) return "subscription";
  if (/confirm|verify|approve/.test(action)) return "deadline";
  if (/reply|respond/.test(action)) return "followup";
  return "other";
}

function titleFromL3(email: ParsedEmail, spans: L3Span[]): string {
  const action = spans.find((s) => s.label === "ACTION_VERB");
  const counterparty =
    spans.find((s) => s.label === "COUNTERPARTY")?.text ??
    (email.fromDomain || email.fromEmail);
  const amount = spans.find((s) => s.label === "AMOUNT")?.text;

  if (!action) {
    // Fired the (deadline + amount) fallback. Use a generic "Review" verb.
    const amountStr = amount ? ` ${amount}` : "";
    return `Review charge from ${counterparty}${amountStr}`.trim();
  }

  const verb = action.text.toLowerCase().trim();
  const prefix = ACTION_TITLE_PREFIX[verb] ?? capitalize(verb);
  const amountStr = amount ? ` — ${amount}` : "";
  return `${prefix} ${counterparty}${amountStr}`.trim();
}

function capitalize(s: string): string {
  return s.length ? s[0]!.toUpperCase() + s.slice(1) : s;
}

function deadlineToIso(deadlineText: string): string | null {
  const lower = deadlineText.toLowerCase();
  const now = new Date();
  if (/\btoday\b|\btonight\b/.test(lower)) {
    const eod = new Date(now);
    eod.setHours(23, 59, 0, 0);
    return eod.toISOString();
  }
  if (/\btomorrow\b/.test(lower)) {
    const t = new Date(now);
    t.setDate(t.getDate() + 1);
    t.setHours(9, 0, 0, 0);
    return t.toISOString();
  }
  // Try absolute parsing — month name + day, or ISO.
  const parsed = Date.parse(deadlineText);
  if (Number.isFinite(parsed)) return new Date(parsed).toISOString();
  return null;
}

function amountCentsFromSpan(text: string | undefined): number | null {
  if (!text) return null;
  const m = text.match(/[\d,]+(?:\.\d{2})?/);
  if (!m) return null;
  const n = Number(m[0].replace(/,/g, ""));
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

function taskFromL3(email: ParsedEmail, result: L3Result): Task {
  const derivedFrom: TaskDerivation = {
    source: "model",
    modelId: result.modelId,
    confidence: result.overallConfidence,
    matchedSpans: result.spans.map((s) => ({
      field: s.field,
      text: s.text,
      label: s.label,
      confidence: s.confidence,
    })),
  };

  return baseTask(email, {
    title: titleFromL3(email, result.spans),
    detail: email.subject,
    category: categoryFromL3(result.spans),
    priority: priorityFromL3(result.spans),
    due_at: deadlineToIso(
      result.spans.find((s) => s.label === "DEADLINE")?.text ?? "",
    ),
    amount_cents: amountCentsFromSpan(
      result.spans.find((s) => s.label === "AMOUNT")?.text,
    ),
    counterparty:
      result.spans.find((s) => s.label === "COUNTERPARTY")?.text ??
      (email.fromDomain || email.fromEmail),
    derivedFrom,
  });
}

// ---------------------------------------------------------------------------
// Task assembly
// ---------------------------------------------------------------------------

interface TaskFields {
  title: string;
  detail: string | null;
  category: TaskCategory;
  priority: TaskPriority;
  due_at: string | null;
  amount_cents: number | null;
  counterparty: string | null;
  derivedFrom: TaskDerivation;
}

function baseTask(email: ParsedEmail, f: TaskFields): Task {
  return {
    id: crypto.randomUUID(),
    user_id: "",
    source_email_id: email.gmailId,
    title: f.title,
    detail: f.detail,
    category: f.category,
    priority: f.priority,
    due_at: f.due_at,
    amount_cents: f.amount_cents,
    counterparty: f.counterparty,
    status: "pending",
    alarm_at: null,
    alarm_fired_at: null,
    followup_count: 0,
    next_followup_at: null,
    derivedFrom: f.derivedFrom,
  };
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

/**
 * Run the layered extractor over a single parsed email and return zero or
 * more tasks. Carries the `createdAt`-equivalent via `id` (fresh UUID) and
 * `source_email_id` (gmailId), as the orchestrator caller expects.
 *
 * Layers are tried in order; the first that matches wins. We don't fan out
 * multiple tasks from one email at this stage — the catalog returns a single
 * MatchResult per email by design.
 */
export async function extractTasks(
  email: ParsedEmail,
  l3: Layer3Extractor = DEFAULT_L3,
): Promise<Task[]> {
  // Layer 1: sender catalog
  const m = matchEmail({
    from: email.from,
    subject: email.subject,
    body: email.body,
  });
  if (m) return [taskFromCatalogMatch(email, m)];

  // Layer 2: generic regex fallback
  const r = taskFromRegex(email);
  if (r) return [r];

  // Layer 3: model-source extractor (heuristic today, GLiNER drop-in later)
  const l3Result = await l3.extract({
    subject: email.subject,
    body: email.body,
    fromDomain: email.fromDomain,
    fromEmail: email.fromEmail,
  });
  if (l3Result) return [taskFromL3(email, l3Result)];

  return [];
}
