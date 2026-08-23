import type { Metadata } from "next";
import { MarketingShell, BackLink } from "@/components/marketing-shell";
import { Reveal } from "@/components/reveal";
import { TWITTER_BASE } from "@/lib/metadata-base";

export const metadata: Metadata = {
  title: "Changelog",
  description:
    "What shipped, when. Hand-written release notes for Inbox Agent.",
  alternates: { canonical: "/changelog" },
  openGraph: {
    type: "website",
    url: "/changelog",
    title: "Changelog",
    description:
      "What shipped, when. Hand-written release notes for Inbox Agent.",
  },
  twitter: {
    ...TWITTER_BASE,
    title: "Changelog",
    description:
      "What shipped, when. Hand-written release notes for Inbox Agent.",
  },
};

type Entry = {
  date: string;
  version: string;
  title: string;
  bullets: string[];
  /** Flag entries whose described behavior no longer reflects how the
   *  product works. The entry still appears (history is history) but
   *  is visually de-emphasized and tagged with a "SUPERSEDED" pill. */
  superseded?: boolean;
};

const ENTRIES: Entry[] = [
  {
    date: "2026-06-24",
    version: "v0.4.1",
    title: "Self-protective infrastructure.",
    bullets: [
      "236 unit tests + 22 integration tests, all enforced on every push.",
      "6 cross-doc consistency checks make doc-vs-code drift a CI failure.",
      "Pre-push git hook runs lint + typecheck + tests + integration before any push.",
      "Lighthouse desktop 99/100/100/100, mobile 93/100/100/100, axe-core 0 violations across 11 pages.",
      "Repo is now structurally defensive against the failure modes that caused drift in the first place.",
    ],
  },
  {
    date: "2026-06-24",
    version: "v0.4",
    title: "Local-first.",
    bullets: [
      "Email reading moved from server to client. The server no longer touches email content.",
      "Server-side OAuth flow retired in favor of browser PKCE. /api/oauth/* deleted.",
      "BYOK keys now live in IndexedDB encrypted with the install key. /api/byok deleted.",
      "Mobile parity: same pipeline on Android via expo-sqlite + expo-secure-store.",
      "Tables dropped: email_accounts, emails, user_api_keys, followups, style_profiles, response_drafts.",
      "Inbox tab renamed to History (we don’t store mail, just the audit trail).",
    ],
  },
  {
    date: "2026-06-22",
    version: "v0.3",
    title: "Ephemeral bodies.",
    bullets: [
      "Email bodies purged within 90 seconds of task extraction.",
      "Retention picker removed from Settings.",
      "Superseded in v0.4: bodies never leave the device now, so there is nothing to purge.",
    ],
    superseded: true,
  },
  {
    date: "2026-06-21",
    version: "v0.2",
    title: "Read-only mode.",
    bullets: [
      "Removed reply drafts and style learning.",
      "OAuth scopes downgraded to gmail.readonly / gmail.metadata / Mail.Read.",
      "Drafts dashboard and send/draft APIs removed.",
    ],
  },
  {
    date: "2026-06-21",
    version: "v0.1.1",
    title: "Bring your own key.",
    bullets: [
      "BYOK for Gemini, OpenAI, Anthropic, Groq.",
      "Android home-screen widget shows the next two tasks.",
      "Sync indicator pulses while we are reading mail.",
    ],
  },
  {
    date: "2026-06-21",
    version: "v0.1",
    title: "Initial public beta.",
    bullets: [
      "Gmail and Outlook via OAuth (no IMAP).",
      "Web dashboard + Android pairing flow.",
      "Six-digit pairing codes, single-use, five-minute expiry.",
    ],
  },
];

export default function ChangelogPage() {
  return (
    <MarketingShell>
      {/* HERO */}
      <section className="border-b border-black/10">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-24 lg:py-32">
          <Reveal>
            <p className="eyebrow mb-6">Changelog</p>
            <h1 className="display text-[56px] sm:text-[80px] lg:text-[104px] leading-[0.95]">
              What shipped,
              <br />
              <em className="italic">when.</em>
            </h1>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mt-10 max-w-2xl text-[18px] leading-[1.6] text-black/70">
              Hand-written. If it&rsquo;s here, a user will notice it.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ENTRIES */}
      <section className="border-b border-black/10">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-16">
          <ol className="space-y-16">
            {ENTRIES.map((entry, i) => (
              <EntryRow
                key={`${entry.date}-${entry.version}`}
                entry={entry}
                delay={i * 0.05}
              />
            ))}
          </ol>
        </div>
      </section>

      {/* CLOSER */}
      <section>
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-24">
          <BackLink />
        </div>
      </section>
    </MarketingShell>
  );
}

function EntryRow({ entry, delay = 0 }: { entry: Entry; delay?: number }) {
  const dimClass = entry.superseded ? "opacity-60" : "";
  return (
    <li className={`grid lg:grid-cols-12 gap-8 lg:gap-10 ${dimClass}`}>
      <div className="lg:col-span-3 flex lg:flex-col gap-4 lg:gap-3 items-baseline lg:items-start">
        <time className="mono text-xs text-black/60 tabular-nums">{entry.date}</time>
        <span className="mono inline-flex items-center text-[11px] px-2 py-0.5 border border-black uppercase tracking-wider">
          {entry.version}
        </span>
        {entry.superseded ? (
          <span
            className="mono inline-flex items-center text-[10px] px-2 py-0.5 border border-[var(--accent)] text-[var(--accent)] uppercase tracking-wider"
            title="Superseded by a later release — the behavior below no longer reflects how the product works."
          >
            Superseded
          </span>
        ) : null}
      </div>
      <div className="lg:col-span-9 border-l border-black/10 pl-8 lg:pl-10">
        <h2
          className={`display text-[32px] lg:text-[44px] leading-[1.0] mb-6 ${
            entry.superseded ? "line-through decoration-2 decoration-black/30" : ""
          }`}
        >
          {entry.title}
        </h2>
        <ul className="space-y-3 text-[16px] leading-[1.65] text-black/75">
          {entry.bullets.map((b, i) => (
            <li key={i} className="flex gap-3">
              <span aria-hidden className="mono text-xs text-black/55 pt-1.5 shrink-0">
                —
              </span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}
