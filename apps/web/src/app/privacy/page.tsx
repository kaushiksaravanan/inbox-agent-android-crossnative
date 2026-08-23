import Link from "next/link";
import type { Metadata } from "next";
import { TWITTER_BASE } from "@/lib/metadata-base";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Inbox Agent collects, uses, and protects your email data. We do not train models on your content, sell your data, or share it with advertisers.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    type: "website",
    url: "/privacy",
    title: "Privacy Policy",
    description:
      "How Inbox Agent collects, uses, and protects your email data. We do not train models on your content, sell your data, or share it with advertisers.",
  },
  twitter: {
    ...TWITTER_BASE,
    title: "Privacy Policy",
    description:
      "How Inbox Agent collects, uses, and protects your email data. We do not train models on your content, sell your data, or share it with advertisers.",
  },
};

export default function PrivacyPage() {
  return (
    <main className="bg-[var(--paper)] text-black">
      {/* NAV */}
      <header className="border-b border-black/10">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="block w-2.5 h-2.5 bg-black" aria-hidden />
            <span className="font-medium tracking-tight">Inbox Agent</span>
          </Link>
          <Link
            href="/"
            className="text-sm hover:opacity-60 transition-opacity inline-flex items-center gap-2"
          >
            <span aria-hidden>←</span> Back to home
          </Link>
        </div>
      </header>

      {/* HEADER */}
      <section className="border-b border-black/10">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-20 lg:py-28">
          <div className="max-w-3xl mx-auto">
            <p className="eyebrow mb-6">Legal</p>
            <h1 className="display text-[56px] sm:text-[72px] lg:text-[96px]">
              Privacy
              <br />
              <em className="italic">Policy.</em>
            </h1>
            <p className="mt-8 text-[15px] leading-[1.6] text-black/60">
              Last updated June 24, 2026. Plain language summary first, then the
              long version.
            </p>
          </div>
        </div>
      </section>

      {/* TL;DR */}
      <section className="border-b border-black/10">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-16">
          <div className="max-w-3xl mx-auto">
            <div className="border border-black/15 p-8 lg:p-10">
              <p className="eyebrow mb-5">The short version</p>
              <ul className="space-y-4 text-[16px] leading-[1.6]">
                <li className="flex gap-4">
                  <span className="mono text-black/55 shrink-0">01</span>
                  <span>
                    We read your email <em className="italic">only</em> to turn it
                    into tasks for you. That is the entire job. Our OAuth scope
                    is read-only.
                  </span>
                </li>
                <li className="flex gap-4">
                  <span className="mono text-black/55 shrink-0">02</span>
                  <span>
                    We do not train AI models on your email content. Ever.
                  </span>
                </li>
                <li className="flex gap-4">
                  <span className="mono text-black/55 shrink-0">03</span>
                  <span>
                    We do not sell your data and do not share it with advertisers.
                  </span>
                </li>
                <li className="flex gap-4">
                  <span className="mono text-black/55 shrink-0">04</span>
                  <span>
                    Email content never leaves your device.
                  </span>
                </li>
                <li className="flex gap-4">
                  <span className="mono text-black/55 shrink-0">05</span>
                  <span>
                    AI inference is bring-your-own-key (BYOK) only. Model
                    traffic flows from your device to your chosen provider —
                    it never passes through our servers.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* LONG FORM */}
      <section>
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-20 lg:py-28">
          <article className="max-w-3xl mx-auto space-y-16">
            {/* 1 */}
            <section>
              <p className="eyebrow mb-4">Section 01</p>
              <h2 className="display text-[36px] lg:text-[44px] mb-6">
                What we collect.
              </h2>
              <div className="space-y-5 text-[16px] leading-[1.7] text-black/80">
                <p>
                  We collect only what we need to run the service. There are four
                  categories:
                </p>
                <p>
                  <strong className="font-medium">Account information.</strong>{" "}
                  Your email address, name, and authentication credentials when
                  you sign up. If you sign in with Google or Microsoft, we receive
                  the basic profile information those providers return.
                </p>
                <p>
                  <strong className="font-medium">
                    Email account OAuth tokens.
                  </strong>{" "}
                  When you connect a mailbox, your provider (Google or Microsoft)
                  issues a token that grants the scopes you approved. Your device
                  encrypts these tokens in its keychain (iOS/macOS Keychain,
                  Android Keystore, or the OS credential store on desktop). The
                  tokens never reach our servers, and never appear in logs,
                  exports, or analytics.
                </p>
                <p>
                  <strong className="font-medium">Email metadata and content.</strong>{" "}
                  To generate a task, your device reads the messages your filters
                  surface — this includes the from/to addresses, subject, snippet,
                  and body of those messages. Attachments are not downloaded or
                  scanned. Messages that do not match your filters are not
                  retrieved. Email content never leaves your device.
                </p>
              </div>
            </section>

            {/* 2 */}
            <section>
              <p className="eyebrow mb-4">Section 02</p>
              <h2 className="display text-[36px] lg:text-[44px] mb-6">
                What we do not do.
              </h2>
              <div className="space-y-5 text-[16px] leading-[1.7] text-black/80">
                <p>
                  We do not train, fine-tune, or otherwise use your email content
                  to improve any AI model — ours or anyone else&apos;s. Inference
                  is the only use.
                </p>
                <p>
                  We do not share your data with advertisers. We do not sell your
                  data. We do not run ad networks, behavioral targeting, or
                  third-party analytics that profile you.
                </p>
                <p>
                  We do not scan or process attachments. We do not read messages
                  outside the scope of the filters you have configured. We do not
                  send your data to data brokers.
                </p>
                <p>
                  <strong className="font-medium">
                    We never send email on your behalf.
                  </strong>{" "}
                  Our OAuth scope is read-only on Gmail and Outlook. We do not
                  request the send scope, and the consent screen you see at
                  sign-in will reflect that.
                </p>
              </div>
            </section>

            {/* 3 */}
            <section>
              <p className="eyebrow mb-4">Section 03</p>
              <h2 className="display text-[36px] lg:text-[44px] mb-6">
                How long we keep it.
              </h2>
              <div className="space-y-5 text-[16px] leading-[1.7] text-black/80">
                <p>
                  <strong className="font-medium">Email content.</strong> Email
                  content never leaves your device.
                </p>
                <p>
                  <strong className="font-medium">Task data.</strong> Your device
                  stores tasks until you delete them or uninstall the app.
                </p>
                <p>
                  <strong className="font-medium">OAuth tokens.</strong> Your
                  device stores tokens in its keychain while the connection is
                  active. When you disconnect a mailbox, the device revokes the
                  token at the upstream provider and wipes it from the keychain.
                </p>
                <p>
                  <strong className="font-medium">Backups.</strong> Encrypted
                  backups of server-side account metadata are retained for 30
                  days for disaster recovery, then deleted on a rolling basis.
                  No email content is in these backups.
                </p>
              </div>
            </section>

            {/* 4 */}
            <section>
              <p className="eyebrow mb-4">Section 04</p>
              <h2 className="display text-[36px] lg:text-[44px] mb-6">
                Subprocessors.
              </h2>
              <div className="space-y-5 text-[16px] leading-[1.7] text-black/80">
                <p>
                  We use a small number of vendors to run the service. Each one
                  is bound by a data processing agreement.
                </p>
                <ul className="space-y-4 border-l border-black/10 pl-6">
                  <li>
                    <strong className="font-medium">Supabase</strong> — hosts our
                    PostgreSQL database and authentication. Located in the US.
                  </li>
                  <li>
                    <strong className="font-medium">Google / Microsoft</strong> —
                    your own email APIs. We talk to them on your behalf using the
                    OAuth tokens you granted.
                  </li>
                </ul>
                <p>
                  AI inference is BYOK-only: model traffic flows from your
                  device directly to your chosen provider (Anthropic, Google
                  AI, or another supported vendor). Those providers are not
                  our subprocessors — they are your subprocessors, under the
                  account and key you control.
                </p>
              </div>
            </section>

            {/* 5 */}
            <section>
              <p className="eyebrow mb-4">Section 05</p>
              <h2 className="display text-[36px] lg:text-[44px] mb-6">
                Your rights.
              </h2>
              <div className="space-y-5 text-[16px] leading-[1.7] text-black/80">
                <p>
                  <strong className="font-medium">Export.</strong> You can export
                  all of your tasks as JSON from the settings page at any time.
                </p>
                <p>
                  <strong className="font-medium">Delete.</strong> You can delete
                  individual tasks, disconnect mailboxes, or delete your account
                  outright. Account deletion revokes OAuth tokens, removes all
                  stored email content within 24 hours, and removes everything
                  else within 30 days (the backup window).
                </p>
                <p>
                  <strong className="font-medium">Opt out of AI analysis.</strong>{" "}
                  You can turn off AI features entirely. The app will still
                  surface raw email, but no model inference will run against your
                  account.
                </p>
                <p>
                  <strong className="font-medium">BYOK.</strong> Provide your own
                  Anthropic or Google AI key in settings. We will route all of
                  your inference through that key, which means the model provider
                  bills you directly and the traffic does not pass through our
                  shared infrastructure.
                </p>
                <p>
                  If you are in the EEA, UK, or California, you have additional
                  rights under GDPR / UK GDPR / CCPA — including the right to
                  access, correct, port, restrict processing, and object. Email
                  us to exercise any of these.
                </p>
              </div>
            </section>

            {/* 6 */}
            <section>
              <p className="eyebrow mb-4">Section 06</p>
              <h2 className="display text-[36px] lg:text-[44px] mb-6">
                Security.
              </h2>
              <div className="space-y-5 text-[16px] leading-[1.7] text-black/80">
                <p>
                  Data is encrypted in transit (TLS 1.2+) and at rest. Your
                  device encrypts OAuth tokens in its keychain, so they never
                  reach our servers in the first place. I am the only person
                  with production access. It requires a hardware security key.
                  Access is logged and reviewed.
                </p>
                <p>
                  If we ever experience a breach that affects your data, we will notify
                  you without undue delay and in line with the timelines required
                  by applicable law.
                </p>
              </div>
            </section>

            {/* 7 */}
            <section>
              <p className="eyebrow mb-4">Section 07</p>
              <h2 className="display text-[36px] lg:text-[44px] mb-6">
                Changes and contact.
              </h2>
              <div className="space-y-5 text-[16px] leading-[1.7] text-black/80">
                <p>
                  If we change this policy in a way that meaningfully affects how
                  we handle your data, we will email you at least 30 days before
                  the change takes effect. Minor edits — typos, clarifications —
                  will be published with a new effective date.
                </p>
                <p>
                  Questions, requests, or data-subject inquiries:{" "}
                  <a
                    href="mailto:privacy@inbox.agent"
                    className="underline decoration-black/30 hover:decoration-black underline-offset-4"
                  >
                    privacy@inbox.agent
                  </a>
                  .
                </p>
                <p className="mono text-[13px] text-black/55 pt-4">
                  Effective date: 2026-06-24
                </p>
              </div>
            </section>
          </article>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-black/10">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm text-black/60">
          <div className="flex items-center gap-2">
            <span className="block w-2 h-2 bg-black" aria-hidden />
            <span>Inbox Agent</span>
          </div>
          <div className="flex items-center gap-8">
            <Link href="/privacy" className="hover:text-black transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-black transition-colors">
              Terms
            </Link>
            <Link href="/" className="hover:text-black transition-colors">
              Home
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
