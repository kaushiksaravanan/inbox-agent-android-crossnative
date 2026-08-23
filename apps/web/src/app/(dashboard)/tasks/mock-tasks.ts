import type { Task } from "@inbox/shared";

/**
 * Sample tasks demonstrating the three derivedFrom provenance shapes.
 * Used as a fallback when no real tasks exist (pre-backend / demo mode)
 * so the "Why is this here?" UI affordance is testable.
 */
export const MOCK_TASKS: Task[] = [
  {
    id: "mock-1",
    user_id: "demo",
    source_email_id: null,
    title: "Netflix renews tomorrow for $15.99",
    detail: "Your monthly Netflix membership auto-renews on the 24th.",
    category: "subscription",
    priority: "medium",
    due_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    amount_cents: 1599,
    counterparty: "Netflix",
    status: "pending",
    alarm_at: null,
    alarm_fired_at: null,
    followup_count: 0,
    next_followup_at: null,
    derivedFrom: {
      source: "rule",
      ruleId: "netflix:renews",
      domain: "netflix.com",
      matchedPattern: 'subject contains "renews"',
      matchedSpans: [
        {
          field: "subject",
          text: "Your Netflix membership will renew tomorrow for $15.99",
        },
      ],
    },
  },
  {
    id: "mock-2",
    user_id: "demo",
    source_email_id: null,
    title: "Invoice #INV-2026-0421 due in 7 days",
    detail: "Acme Corp invoice for $1,240.00 — net 7.",
    category: "payment",
    priority: "high",
    due_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    amount_cents: 124000,
    counterparty: "Acme Corp",
    status: "pending",
    alarm_at: null,
    alarm_fired_at: null,
    followup_count: 0,
    next_followup_at: null,
    derivedFrom: {
      source: "regex",
      patternId: "invoice_pattern",
      matchedSpans: [
        {
          field: "body",
          text: "Invoice #INV-2026-0421 — amount due: $1,240.00 by 2026-06-30",
        },
      ],
    },
  },
  {
    id: "mock-3",
    user_id: "demo",
    source_email_id: null,
    title: "Reply to landlord about lease renewal",
    detail: "Janet asked for a decision on the lease renewal by Friday.",
    category: "followup",
    priority: "urgent",
    due_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    amount_cents: null,
    counterparty: "Janet Walker",
    status: "pending",
    alarm_at: null,
    alarm_fired_at: null,
    followup_count: 0,
    next_followup_at: null,
    derivedFrom: {
      source: "model",
      modelId: "gliner-email-v1",
      confidence: 0.87,
      matchedSpans: [
        {
          field: "body",
          text: "Friday",
          label: "DEADLINE",
          confidence: 0.91,
        },
        {
          field: "from",
          text: "Janet Walker",
          label: "COUNTERPARTY",
          confidence: 0.94,
        },
        {
          field: "body",
          text: "decide",
          label: "ACTION_VERB",
          confidence: 0.82,
        },
      ],
    },
  },
];
