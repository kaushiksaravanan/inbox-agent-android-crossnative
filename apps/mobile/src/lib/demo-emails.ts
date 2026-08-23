// Demo email fixture + onboarding helpers (mobile).
//
// Mirrors apps/web/src/lib/demo-emails.ts:
//   - Same 10-entry DEMO_EMAILS fixture (exercises every catalog category
//     plus the verification + newsletter filter cases).
//   - loadDemoTasks() runs the extractor across the fixture and persists
//     any tasks via the mobile local-db.
//   - clearDemoTasks() removes every task whose source_email_id starts
//     with "demo-".
//
// All gmailIds are prefixed with `demo-` so clearDemoTasks() can wipe them
// without touching tasks derived from real Gmail messages.

import type { ParsedEmail } from "./gmail-client";
import { extractTasks } from "./extractor";
import {
  addTask,
  isEmailSeen,
  markEmailSeen,
  getAllTasks,
  deleteTask,
} from "./local-db";

// ---------------------------------------------------------------------------
// Timestamps — varied over the last 3 days for realism
// ---------------------------------------------------------------------------

const NOW = Date.now();
const HOUR = 60 * 60 * 1000;

function hoursAgo(h: number): string {
  return new Date(NOW - h * HOUR).toISOString();
}

// ---------------------------------------------------------------------------
// Fixture
// ---------------------------------------------------------------------------

export const DEMO_EMAILS: ParsedEmail[] = [
  // a. Netflix renewal
  {
    gmailId: "demo-1",
    from: "Netflix <info@account.netflix.com>",
    fromEmail: "info@account.netflix.com",
    fromDomain: "netflix.com",
    subject: "Your Netflix membership will renew tomorrow",
    snippet:
      "Your Netflix Standard plan will renew tomorrow for $15.99. No action needed.",
    body: [
      "Hi there,",
      "",
      "Your Netflix Standard plan will renew tomorrow.",
      "Amount: $15.99",
      "Payment method: Visa ending in 4242",
      "",
      "If you'd like to change your plan or cancel, visit Account settings.",
      "",
      "— The Netflix team",
    ].join("\n"),
    receivedAt: hoursAgo(4),
  },

  // b. Comcast / Xfinity bill
  {
    gmailId: "demo-2",
    from: "Xfinity <billing@xfinity.com>",
    fromEmail: "billing@xfinity.com",
    fromDomain: "xfinity.com",
    subject: "Your Xfinity bill is ready",
    snippet:
      "Your Xfinity bill of $84.21 is due Friday. Autopay is currently off.",
    body: [
      "Your latest Xfinity bill is ready.",
      "",
      "Amount due: $84.21",
      "Due date: Friday",
      "",
      "Pay now or enroll in Autopay to avoid late fees.",
      "",
      "— Comcast / Xfinity Billing",
    ].join("\n"),
    receivedAt: hoursAgo(9),
  },

  // c. Lovable autopay
  {
    gmailId: "demo-3",
    from: "Lovable <billing@lovable.dev>",
    fromEmail: "billing@lovable.dev",
    fromDomain: "lovable.dev",
    subject: "Your subscription was renewed",
    snippet:
      "We've successfully renewed your Lovable Pro subscription for $50.00.",
    body: [
      "Thanks for being a Lovable Pro subscriber.",
      "",
      "We've charged your card on file for $50.00 and renewed your plan for another month.",
      "Receipt #LOV-20260621",
      "",
      "Manage subscription: https://lovable.dev/account",
    ].join("\n"),
    receivedAt: hoursAgo(14),
  },

  // d. FedEx signature exception
  {
    gmailId: "demo-4",
    from: "FedEx <noreply@fedex.com>",
    fromEmail: "noreply@fedex.com",
    fromDomain: "fedex.com",
    subject: "Delivery exception: signature required",
    snippet:
      "We attempted to deliver your package but a signature was required.",
    body: [
      "Tracking number: 7712 4488 0091",
      "",
      "We attempted to deliver your package today but a signature was required and no one was available.",
      "",
      "Action needed: schedule a redelivery or sign for the package online.",
      "",
      "— FedEx",
    ].join("\n"),
    receivedAt: hoursAgo(20),
  },

  // e. Google Calendar invite
  {
    gmailId: "demo-5",
    from: "Google Calendar <calendar-notification@google.com>",
    fromEmail: "calendar-notification@google.com",
    fromDomain: "google.com",
    subject: "Invitation: Q3 sync @ Thu Jun 25 3pm",
    snippet:
      "You have been invited to Q3 sync on Thursday, Jun 25 at 3:00 PM.",
    body: [
      "You have been invited to the following event.",
      "",
      "Q3 sync",
      "When: Thu Jun 25, 2026 3:00 PM – 4:00 PM (PT)",
      "Where: Google Meet",
      "Organizer: alex@example.com",
      "",
      "Going? Yes / Maybe / No",
    ].join("\n"),
    receivedAt: hoursAgo(28),
  },

  // f. IRS deadline
  {
    gmailId: "demo-6",
    from: "IRS <noreply@irs.gov>",
    fromEmail: "noreply@irs.gov",
    fromDomain: "irs.gov",
    subject: "Quarterly estimated tax payment due",
    snippet:
      "Reminder: your Q2 estimated tax payment is due on June 15.",
    body: [
      "This is a reminder from the Internal Revenue Service.",
      "",
      "Your Q2 2026 estimated tax payment is due by June 15, 2026.",
      "Form: 1040-ES",
      "",
      "Pay online at https://irs.gov/payments to avoid penalties.",
    ].join("\n"),
    receivedAt: hoursAgo(36),
  },

  // g. 2FA verification code — should be FILTERED (no task)
  {
    gmailId: "demo-7",
    from: "Google <no-reply@accounts.google.com>",
    fromEmail: "no-reply@accounts.google.com",
    fromDomain: "accounts.google.com",
    subject: "Your verification code",
    snippet: "Your Google verification code is 482931.",
    body: [
      "Your Google verification code is:",
      "",
      "482931",
      "",
      "This code will expire in 10 minutes. If you didn't request it, you can ignore this email.",
    ].join("\n"),
    receivedAt: hoursAgo(42),
  },

  // h. Substack newsletter — should be FILTERED
  {
    gmailId: "demo-8",
    from: "Stratechery by Ben Thompson <newsletter@substack.com>",
    fromEmail: "newsletter@substack.com",
    fromDomain: "substack.com",
    subject: "The aggregator's dilemma, revisited",
    snippet:
      "This week: why the aggregator playbook is harder than it looks in 2026.",
    body: [
      "Welcome to this week's edition of Stratechery.",
      "",
      "This week we're revisiting the aggregator's dilemma and what it means for the new wave of AI-native products...",
      "",
      "[Read on the web]  [Unsubscribe]",
    ].join("\n"),
    receivedAt: hoursAgo(50),
  },

  // i. Adobe renewal
  {
    gmailId: "demo-9",
    from: "Adobe <message@adobe.com>",
    fromEmail: "message@adobe.com",
    fromDomain: "adobe.com",
    subject: "Your Creative Cloud subscription will renew soon",
    snippet:
      "Your Adobe Creative Cloud All Apps plan will renew for $59.99.",
    body: [
      "Your Creative Cloud All Apps plan is set to renew.",
      "",
      "Amount: $59.99 / month",
      "Renewal date: next week",
      "",
      "Manage your plan at https://account.adobe.com",
    ].join("\n"),
    receivedAt: hoursAgo(58),
  },

  // j. Stripe invoice (net-30)
  {
    gmailId: "demo-10",
    from: "Stripe <invoice+stmt@stripe.com>",
    fromEmail: "invoice+stmt@stripe.com",
    fromDomain: "stripe.com",
    subject: "Invoice #INV-00482 from Acme Co — $1,240.00 due net 30",
    snippet:
      "Invoice #INV-00482 for $1,240.00 has been issued. Payment terms: net 30.",
    body: [
      "An invoice has been issued.",
      "",
      "Invoice number: INV-00482",
      "From: Acme Co",
      "Amount due: $1,240.00",
      "Terms: Net 30",
      "",
      "Pay online: https://invoice.stripe.com/i/inv_00482",
    ].join("\n"),
    receivedAt: hoursAgo(66),
  },
];

// ---------------------------------------------------------------------------
// Onboarding helpers
// ---------------------------------------------------------------------------

/**
 * Run the extractor across every DEMO_EMAILS entry and persist any tasks it
 * produces to the mobile local-db (expo-sqlite). Marks each demo email as
 * seen, even when the extractor returns no tasks (the 2FA + newsletter
 * cases) so re-running the helper is idempotent.
 *
 * Returns the number of tasks actually added on this call. Already-seen
 * emails are skipped so calling this multiple times never duplicates tasks.
 */
export async function loadDemoTasks(): Promise<number> {
  let added = 0;
  for (const email of DEMO_EMAILS) {
    if (await isEmailSeen(email.gmailId)) continue;
    const tasks = await extractTasks(email);
    for (const t of tasks) {
      await addTask(t);
      added += 1;
    }
    await markEmailSeen(email.gmailId);
  }
  return added;
}

/**
 * Remove every task whose source_email_id starts with "demo-". Used by the
 * "exit demo mode" / "clear demo data" affordances in onboarding so the user
 * can return to a clean slate before connecting real Gmail.
 *
 * Does not touch the emails_seen entries — those are harmless and prevent
 * accidental re-seeding if the user toggles demo mode rapidly.
 */
export async function clearDemoTasks(): Promise<void> {
  const all = await getAllTasks();
  const demoIds = all
    .filter((t) => t.source_email_id?.startsWith("demo-"))
    .map((t) => t.id);
  for (const id of demoIds) {
    await deleteTask(id);
  }
}
