// Shared source of truth for the extra FAQ entries that the homepage
// renders in addition to COPY.faq. The visible DOM (landing-content.tsx)
// and the FAQPage JSON-LD (page.tsx) BOTH import this so the answer text
// can never drift between the two — Google requires the JSON-LD answer
// to match the visible page verbatim, and our consistency tests assert it.
//
// Do not inline these strings in landing-content.tsx or page.tsx. Edit here.

export type HomeFaqEntry = { q: string; a: string };

export const EXTRA_HOME_FAQS: readonly HomeFaqEntry[] = [
  {
    q: "Will it ever send email?",
    a: "No. We don't request the send scope. The OAuth screen shows read-only. Any change requires a fresh consent screen — never silent.",
  },
  {
    q: "Which email providers work today?",
    a: "Gmail (Workspace and consumer) today. Outlook (personal and Microsoft 365) is queued, followed by Apple Mail, Fastmail, and Proton via IMAP.",
  },
  {
    q: "What does the alarm actually do?",
    a: "A high-priority notification with the action verb. Tap to open the email and suggested action. Snooze one hour or until tomorrow.",
  },
];
