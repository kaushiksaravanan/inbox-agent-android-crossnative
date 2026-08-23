import Link from "next/link";
import type { Metadata } from "next";
import { TWITTER_BASE } from "@/lib/metadata-base";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The agreement between you and Inbox Agent. Plain language, minimal lawyering — what you can do, what we do, and what happens if something goes wrong.",
  alternates: { canonical: "/terms" },
  openGraph: {
    type: "website",
    url: "/terms",
    title: "Terms of Service",
    description:
      "The agreement between you and Inbox Agent. Plain language, minimal lawyering — what you can do, what we do, and what happens if something goes wrong.",
  },
  twitter: {
    ...TWITTER_BASE,
    title: "Terms of Service",
    description:
      "The agreement between you and Inbox Agent. Plain language, minimal lawyering — what you can do, what we do, and what happens if something goes wrong.",
  },
};

export default function TermsPage() {
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
              Terms of
              <br />
              <em className="italic">Service.</em>
            </h1>
            <p className="mt-8 text-[15px] leading-[1.6] text-black/60">
              Last updated June 21, 2026. Plain language summary first, then the
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
                    We connect to your email when you tell us to. You own your
                    content; we just process it.
                  </span>
                </li>
                <li className="flex gap-4">
                  <span className="mono text-black/55 shrink-0">02</span>
                  <span>
                    Do not use the service for spam, harassment, illegal
                    activity, or to abuse other people&apos;s accounts.
                  </span>
                </li>
                <li className="flex gap-4">
                  <span className="mono text-black/55 shrink-0">03</span>
                  <span>
                    You can cancel anytime. We can suspend an account that
                    breaches these terms with 30 days notice.
                  </span>
                </li>
                <li className="flex gap-4">
                  <span className="mono text-black/55 shrink-0">04</span>
                  <span>
                    99.5% uptime target once out of beta. Liability is capped at
                    fees you have paid us in the past 12 months.
                  </span>
                </li>
                <li className="flex gap-4">
                  <span className="mono text-black/55 shrink-0">05</span>
                  <span>
                    Disputes go through individual arbitration. Delaware law
                    governs.
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
                The agreement.
              </h2>
              <div className="space-y-5 text-[16px] leading-[1.7] text-black/80">
                <p>
                  These Terms of Service (the &ldquo;Terms&rdquo;) form the
                  agreement between you and Inbox Agent (&ldquo;we&rdquo;,
                  &ldquo;us&rdquo;) for use of our website, apps, and APIs (the
                  &ldquo;Service&rdquo;). By creating an account or using the
                  Service, you agree to these Terms. If you do not agree, do not
                  use the Service.
                </p>
                <p>
                  You must be at least 13 years old to use the Service, and old
                  enough to form a binding contract under the laws of your
                  jurisdiction. If you are using the Service on behalf of an
                  organization, you confirm that you are authorized to bind that
                  organization to these Terms.
                </p>
              </div>
            </section>

            {/* 2 */}
            <section>
              <p className="eyebrow mb-4">Section 02</p>
              <h2 className="display text-[36px] lg:text-[44px] mb-6">
                What the Service does.
              </h2>
              <div className="space-y-5 text-[16px] leading-[1.7] text-black/80">
                <p>
                  Inbox Agent connects to your email mailbox at your direction
                  and on the basis of OAuth scopes you approve. It reads messages
                  that match the rules you set up, turns them into tasks on your
                  phone, and — if you opt in — drafts replies in your voice.
                </p>
                <p>
                  We connect to your email <em className="italic">because</em>{" "}
                  you tell us to. You can disconnect any mailbox at any time, and
                  the Service will stop reading from it within minutes.
                </p>
                <p>
                  We are not your email provider. Google, Microsoft, or whoever
                  else hosts your mailbox remains your email provider. The terms
                  of those providers continue to apply between you and them.
                </p>
              </div>
            </section>

            {/* 3 */}
            <section>
              <p className="eyebrow mb-4">Section 03</p>
              <h2 className="display text-[36px] lg:text-[44px] mb-6">
                Your content.
              </h2>
              <div className="space-y-5 text-[16px] leading-[1.7] text-black/80">
                <p>
                  You retain ownership of all your content — your emails, the
                  tasks we generate from them, drafts you accept or edit, and
                  everything else in your account.
                </p>
                <p>
                  You grant us a limited, non-exclusive license to host, process,
                  display, and transmit your content solely to operate and
                  improve the Service for you. This license is the minimum we
                  need to provide the product. It is not a license to sell,
                  publicly distribute, or train AI models on your content. The{" "}
                  <Link
                    href="/privacy"
                    className="underline decoration-black/30 hover:decoration-black underline-offset-4"
                  >
                    Privacy Policy
                  </Link>{" "}
                  is part of these Terms by reference.
                </p>
                <p>
                  You are responsible for your content. Do not put anything into
                  the Service that you do not have the right to put there.
                </p>
              </div>
            </section>

            {/* 4 */}
            <section>
              <p className="eyebrow mb-4">Section 04</p>
              <h2 className="display text-[36px] lg:text-[44px] mb-6">
                Acceptable use.
              </h2>
              <div className="space-y-5 text-[16px] leading-[1.7] text-black/80">
                <p>Do not use the Service to:</p>
                <ul className="space-y-3 border-l border-black/10 pl-6">
                  <li>Send spam or bulk unsolicited messages.</li>
                  <li>
                    Harass, threaten, defame, or impersonate any person or
                    organization.
                  </li>
                  <li>
                    Do anything illegal, or anything that helps someone else do
                    something illegal.
                  </li>
                  <li>
                    Access, scrape, or process mailboxes you do not own or have
                    explicit permission to manage.
                  </li>
                  <li>
                    Operate mass accounts (account farms, throwaways at scale)
                    or evade rate limits.
                  </li>
                  <li>
                    Reverse engineer, decompile, or attempt to extract our
                    source code, except as permitted by applicable law.
                  </li>
                  <li>
                    Interfere with the Service — denial of service, malware,
                    probing for vulnerabilities outside an authorized
                    disclosure program.
                  </li>
                </ul>
                <p>
                  If we believe you are doing any of the above, we may suspend
                  the affected account immediately. Otherwise, we follow the
                  process in Section 06.
                </p>
              </div>
            </section>

            {/* 5 */}
            <section>
              <p className="eyebrow mb-4">Section 05</p>
              <h2 className="display text-[36px] lg:text-[44px] mb-6">
                Plans and payment.
              </h2>
              <div className="space-y-5 text-[16px] leading-[1.7] text-black/80">
                <p>
                  Some features are paid. Prices, billing cycles, and what is
                  included are listed on the pricing page and inside the app
                  during checkout. Fees are charged in advance, are
                  non-refundable except where required by law, and exclude taxes
                  unless we explicitly state otherwise.
                </p>
                <p>
                  If we change our pricing, we will give you at least 30 days
                  notice before the change applies to your account. You can
                  cancel before the new price takes effect.
                </p>
              </div>
            </section>

            {/* 6 */}
            <section>
              <p className="eyebrow mb-4">Section 06</p>
              <h2 className="display text-[36px] lg:text-[44px] mb-6">
                Suspension and cancellation.
              </h2>
              <div className="space-y-5 text-[16px] leading-[1.7] text-black/80">
                <p>
                  <strong className="font-medium">You can cancel anytime.</strong>{" "}
                  Delete your account from settings. We stop billing from the end
                  of the current period and delete your data per the schedule in
                  the Privacy Policy.
                </p>
                <p>
                  <strong className="font-medium">
                    We can suspend with 30 days notice
                  </strong>{" "}
                  if you materially breach these Terms and have not fixed the
                  problem after we asked you to. Severe breaches — anything that
                  endangers other users, the Service, or third parties — can
                  result in immediate suspension.
                </p>
                <p>
                  We may also discontinue the Service in whole or in part. If we
                  do, we will give reasonable notice and a way to export your
                  data.
                </p>
              </div>
            </section>

            {/* 7 */}
            <section>
              <p className="eyebrow mb-4">Section 07</p>
              <h2 className="display text-[36px] lg:text-[44px] mb-6">
                Uptime and availability.
              </h2>
              <div className="space-y-5 text-[16px] leading-[1.7] text-black/80">
                <p>
                  During beta, the Service is offered as-is. Once we exit beta we
                  target 99.5% monthly uptime, measured against the public status
                  page, excluding scheduled maintenance and incidents caused by
                  upstream providers (e.g., Google or Microsoft outages).
                </p>
                <p>
                  We do not guarantee that the Service will be uninterrupted,
                  bug-free, or fit for any particular purpose. Use it for what it
                  does, not for what you wish it did.
                </p>
              </div>
            </section>

            {/* 8 */}
            <section>
              <p className="eyebrow mb-4">Section 08</p>
              <h2 className="display text-[36px] lg:text-[44px] mb-6">
                Disclaimers and liability.
              </h2>
              <div className="space-y-5 text-[16px] leading-[1.7] text-black/80">
                <p>
                  The Service is provided &ldquo;as is&rdquo; and &ldquo;as
                  available&rdquo;. To the maximum extent permitted by law, we
                  disclaim all warranties — express, implied, or statutory —
                  including merchantability, fitness for a particular purpose,
                  non-infringement, and accuracy of AI-generated content.
                </p>
                <p>
                  AI features can be wrong. Drafts can misread a thread. Tasks
                  can mis-summarize. You are responsible for reviewing anything
                  the Service produces before acting on it.
                </p>
                <p>
                  To the maximum extent permitted by law, our total liability for
                  any claim arising out of or relating to the Service is capped
                  at the fees you paid us in the 12 months immediately before the
                  event that gave rise to the claim. We are not liable for
                  indirect, incidental, consequential, special, or punitive
                  damages, including lost profits, lost data, or lost
                  opportunities.
                </p>
                <p>
                  Nothing in these Terms excludes liability that cannot be
                  excluded under applicable law.
                </p>
              </div>
            </section>

            {/* 9 */}
            <section>
              <p className="eyebrow mb-4">Section 09</p>
              <h2 className="display text-[36px] lg:text-[44px] mb-6">
                Indemnification.
              </h2>
              <div className="space-y-5 text-[16px] leading-[1.7] text-black/80">
                <p>
                  You agree to defend and indemnify us against any claims, costs,
                  and damages arising out of your content, your use of the
                  Service, or your violation of these Terms or applicable law.
                  This obligation survives termination.
                </p>
              </div>
            </section>

            {/* 10 */}
            <section>
              <p className="eyebrow mb-4">Section 10</p>
              <h2 className="display text-[36px] lg:text-[44px] mb-6">
                Disputes and governing law.
              </h2>
              <div className="space-y-5 text-[16px] leading-[1.7] text-black/80">
                <p>
                  These Terms are governed by the laws of the State of Delaware,
                  United States, without regard to conflict of laws rules.
                </p>
                <p>
                  Any dispute between you and us that cannot be resolved
                  informally will be settled by binding individual arbitration
                  administered under the rules of the American Arbitration
                  Association. You and we both waive the right to a jury trial
                  and to participate in class actions, to the extent permitted by
                  law. If arbitration is not enforceable in your jurisdiction,
                  the dispute will proceed in the state or federal courts located
                  in Delaware, and you and we consent to the jurisdiction of
                  those courts.
                </p>
                <p>
                  Either of us may seek injunctive relief in court for misuse of
                  intellectual property or breach of confidentiality.
                </p>
              </div>
            </section>

            {/* 11 */}
            <section>
              <p className="eyebrow mb-4">Section 11</p>
              <h2 className="display text-[36px] lg:text-[44px] mb-6">
                Changes and contact.
              </h2>
              <div className="space-y-5 text-[16px] leading-[1.7] text-black/80">
                <p>
                  We may update these Terms from time to time. If we make a
                  material change, we will notify you by email or in the app at
                  least 30 days before it takes effect. Your continued use of the
                  Service after the effective date means you accept the updated
                  Terms.
                </p>
                <p>
                  If any provision of these Terms is found unenforceable, the
                  rest stays in effect. Our failure to enforce a provision is not
                  a waiver of our right to do so later. You may not assign these
                  Terms; we may assign them to a successor in a merger,
                  acquisition, or sale of assets.
                </p>
                <p>
                  Questions:{" "}
                  <a
                    href="mailto:legal@inbox.agent"
                    className="underline decoration-black/30 hover:decoration-black underline-offset-4"
                  >
                    legal@inbox.agent
                  </a>
                  .
                </p>
                <p className="mono text-[13px] text-black/55 pt-4">
                  Effective date: 2026-06-21
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
