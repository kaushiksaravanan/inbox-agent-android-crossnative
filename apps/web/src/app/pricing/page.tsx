import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { RedeemCode } from "@/components/redeem-code";
import { InterestButton } from "@/components/interest-button";
import { APP_VERSION } from "@inbox/shared";
import { TWITTER_BASE } from "@/lib/metadata-base";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "One price. One time. Refundable. $49 for an Inbox Agent v1.x license — Android today, iOS on the roadmap, unlimited mailboxes, unlimited devices, 30-day refund.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    type: "website",
    url: "/pricing",
    title: "Pricing",
    description:
      "One price. One time. Refundable. $49 for an Inbox Agent v1.x license — Android today, iOS on the roadmap, unlimited mailboxes, unlimited devices, 30-day refund.",
  },
  twitter: {
    ...TWITTER_BASE,
    title: "Pricing",
    description:
      "One price. One time. Refundable. $49 for an Inbox Agent v1.x license — Android today, iOS on the roadmap, unlimited mailboxes, unlimited devices, 30-day refund.",
  },
};

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://inbox.agent";

// Schema.org SoftwareApplication anchored to /pricing. Mirrors the home page's
// softwareJsonLd shape so the two emissions reconcile as the same entity
// (sameAs back to SITE_URL, mainEntityOfPage to /pricing). Visible copy says
// "Public checkout opens soon", so availability is PreOrder for honesty — flip
// to InStock when checkout ships. No priceValidUntil: the offer is "yours
// forever" with no recurring charges, so a sunset date would contradict copy.
const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Inbox Agent",
  description:
    "Local-first email agent. Reads your inbox on your phone, extracts action verbs as tasks, rings you when something is due. Never sends email.",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web, Android",
  url: SITE_URL,
  mainEntityOfPage: `${SITE_URL}/pricing`,
  sameAs: [SITE_URL],
  softwareVersion: APP_VERSION,
  offers: {
    "@type": "Offer",
    name: "Inbox Agent license",
    price: "49",
    priceCurrency: "USD",
    description: "One-time payment for the v1.x line. 30-day refund.",
    availability: "https://schema.org/PreOrder",
    url: `${SITE_URL}/pricing`,
    hasMerchantReturnPolicy: {
      "@type": "MerchantReturnPolicy",
      applicableCountry: "US",
      returnPolicyCategory:
        "https://schema.org/MerchantReturnFiniteReturnWindow",
      merchantReturnDays: 30,
      returnMethod: "https://schema.org/ReturnByMail",
      returnFees: "https://schema.org/FreeReturn",
    },
  },
};

const INCLUDED: string[] = [
  "One-time payment for the v1.x line",
  "Android today, iOS on the roadmap",
  "Unlimited mailboxes",
  "Unlimited devices",
  "On-device extraction — your email never leaves your phone",
  "Explainable by design — every task shows the rule or pattern that produced it",
  "Read-only OAuth scope",
  "End-to-end encrypted sync between your devices",
  "30-day refund, no questions",
];

const NOT_INCLUDED: string[] = [
  "No recurring charges",
  "No team seats",
  "No usage limits",
  "No telemetry",
];

const FAQS = [
  {
    q: "Do you offer refunds?",
    a: "Yes. Email hi@inbox.agent within 30 days of paying and we refund the same day — no questions, no forms.",
  },
  {
    q: "What does \"v1.x line\" mean?",
    a: "You pay once and get every release in the v1.x line. This is a one-time payment for the v1.x line; we are not framing v1.x as a teaser for a paid v2 upgrade, and we are not promising features that don't exist yet.",
  },
  {
    q: "Is there really no subscription?",
    a: "No subscription. No monthly. No annual. You pay $49 once, the license is yours, and we never charge your card again. The whole point of the local-first architecture is that we don't have ongoing inference costs to pass on to you.",
  },
  {
    q: "Do you sell my data or use it to train models?",
    a: "No. We never see your email — the AI runs on your phone. There is nothing to sell and nothing to train on. Subpoena us and you get encrypted bytes whose key we don't hold. See SPEC.md on GitHub for the architectural details: https://github.com/inboxagent/inbox-agent/blob/main/SPEC.md",
  },
  {
    q: "Why one-time and not subscription?",
    a: "Because the AI runs on your device, not ours. There's no per-user inference bill we're paying every month, so there's no honest reason to charge you every month. One price, one time.",
  },
];

// FAQPage structured data is built from the same FAQS array the visible
// <details> elements render from, so the JSON-LD answer text can never
// drift from the DOM (Google requires verbatim match for rich-result
// eligibility). Edit FAQS above; the schema follows automatically.
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function PricingPage() {
  return (
    <main className="bg-white text-black">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {/* NAV */}
      <header className="border-b border-black/10">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="block w-2.5 h-2.5 bg-black" aria-hidden />
            <span className="font-medium tracking-tight">Inbox Agent</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <Link href="/#how" className="hover:opacity-60 transition-opacity">How it works</Link>
            <Link href="/#what" className="hover:opacity-60 transition-opacity">What it does</Link>
            <Link href="/pricing" className="hover:opacity-60 transition-opacity">Pricing</Link>
            <Link href="/#faq" className="hover:opacity-60 transition-opacity">FAQ</Link>
          </nav>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/login" className="hidden sm:inline hover:opacity-60 transition-opacity">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-[var(--accent)] text-white px-4 py-2 text-sm rounded-full hover:shadow-[var(--shadow-cta)] transition-shadow"
            >
              Get started
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="border-b border-black/10">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-24 lg:py-32 grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8">
            <p className="eyebrow mb-6">Pricing</p>
            <h1 className="display text-[64px] sm:text-[88px] lg:text-[120px] leading-[0.95]">
              One price.
              <br />
              One time.
              <br />
              <em className="italic">Refundable.</em>
            </h1>
            <p className="mt-8 max-w-xl text-[17px] leading-[1.55] text-black/70">
              Inbox Agent runs on your phone. We don&apos;t pay per-user inference,
              so we don&apos;t charge you every month. One license, $49, yours
              forever.
            </p>
          </div>
          <div className="lg:col-span-4 lg:pt-10 flex lg:justify-end">
            <div className="border border-black p-5 max-w-xs">
              <p className="mono text-xs mb-3">EVERY LICENSE INCLUDES</p>
              <ul className="text-sm leading-[1.6] text-black/80 space-y-1.5">
                <li>✓ On-device AI</li>
                <li>✓ Read-only OAuth</li>
                <li>✓ Encrypted device sync</li>
                <li>✓ 30-day refund</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SINGLE-PRICE CARD */}
      <section className="border-b border-black/10">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-24">
          <Reveal>
            <PriceCard />
          </Reveal>
          <p className="mt-10 text-xs mono text-black/60 text-center">
            Prices in USD. Public checkout opens soon — use an invite code for early access.
          </p>
        </div>
      </section>

      {/* WHAT'S INCLUDED / WHAT'S NOT */}
      <section className="border-b border-black/10">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-24">
          <div className="grid lg:grid-cols-12 gap-10 mb-12">
            <h2 className="lg:col-span-5 display text-[44px] lg:text-[64px]">
              In, and
              <br />
              <em className="italic">not in.</em>
            </h2>
            <p className="lg:col-span-6 lg:col-start-7 text-[17px] leading-[1.6] text-black/70 self-end">
              The whole product, with the lines drawn around it. If a feature
              isn&apos;t in the first list, it isn&apos;t gated behind a higher tier —
              it just doesn&apos;t exist yet.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            <Reveal>
              <div className="rounded-2xl border border-black/10 p-8 lg:p-10 h-full">
                <p className="mono text-xs mb-6 text-[var(--accent)]">
                  WHAT&apos;S INCLUDED
                </p>
                <ul className="space-y-3">
                  {INCLUDED.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-3 text-[15px] leading-[1.5]"
                    >
                      <span
                        className="mono shrink-0 pt-0.5 text-[var(--accent)]"
                        aria-hidden
                      >
                        ✓
                      </span>
                      <span className="text-black/80">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <Reveal>
              <div className="rounded-2xl border border-black/10 p-8 lg:p-10 h-full bg-black/[0.02]">
                <p className="mono text-xs mb-6 text-black/60">WHAT&apos;S NOT</p>
                <ul className="space-y-3">
                  {NOT_INCLUDED.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-3 text-[15px] leading-[1.5]"
                    >
                      <span
                        className="mono shrink-0 pt-0.5 text-black/55"
                        aria-hidden
                      >
                        —
                      </span>
                      <span className="text-black/80">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b border-black/10">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-24 grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4">
            <p className="eyebrow mb-6">Common questions about pricing</p>
            <h2 className="display text-[44px] lg:text-[56px]">
              Money,
              <br />
              <em className="italic">explained.</em>
            </h2>
          </div>
          <div className="lg:col-span-8 border-t border-black/10">
            {FAQS.map((f) => (
              <details key={f.q} className="group border-b border-black/10 py-6">
                <summary className="flex items-start justify-between gap-6 cursor-pointer">
                  <span className="text-[17px] font-medium">{f.q}</span>
                  <span className="chev mono text-xl shrink-0">+</span>
                </summary>
                <p className="mt-4 text-[15px] leading-[1.6] text-black/70 max-w-2xl">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="border-b border-black/10">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-32 text-center">
          <h2 className="display text-[64px] lg:text-[120px] leading-[0.95]">
            $49.
            <br />
            <em className="italic">Once.</em>
          </h2>
          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <Link
              href="/#redeem"
              className="inline-flex items-center gap-2 bg-[var(--accent)] text-white px-8 py-4 text-base rounded-full hover:shadow-[var(--shadow-cta)] transition-shadow"
            >
              Request an invite
              <span aria-hidden>→</span>
            </Link>
            <Link
              href="/#how"
              className="inline-flex items-center gap-2 px-8 py-4 text-base border border-black rounded-full hover:bg-black hover:text-white transition-colors"
            >
              See how it works
            </Link>
          </div>
          <p className="mt-6 text-xs mono text-black/60">
            Public sale opens soon · 30-day refund · No subscription · No telemetry
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex items-center gap-2">
            <span className="block w-2.5 h-2.5 bg-black" aria-hidden />
            <span className="font-medium tracking-tight">Inbox Agent</span>
          </div>
          <p className="mono text-xs text-black/60">
            Local-first · 30-day refund ·{" "}
            <a href="mailto:hi@inbox.agent" className="link">hi@inbox.agent</a>
          </p>
        </div>
      </footer>
    </main>
  );
}

function PriceCard() {
  return (
    <div className="max-w-2xl mx-auto rounded-2xl shadow-card bg-[var(--night)] text-white p-10 lg:p-14 card-hover">
      <div className="flex items-center justify-between mb-8">
        <h2 className="mono text-xs text-white/75 font-normal" aria-label="Inbox Agent License — $49 one-time">INBOX AGENT LICENSE</h2>
        <span className="mono text-[10px] border border-white px-2 py-0.5 rounded-full">
          ONE-TIME
        </span>
      </div>

      <p className="display text-[96px] lg:text-[140px] leading-[0.95] tabular-nums text-white">
        $49
      </p>
      <p className="mt-3 mono text-xs text-white/75">
        Paid once · v1.x line · + local tax where applicable
      </p>

      <p className="mt-6 text-[15px] leading-[1.5] text-white/80">
        One license. Android today, iOS on the roadmap. Unlimited mailboxes.
        Unlimited devices. 30-day no-questions refund.
      </p>
      <p className="mt-3 mono text-[11px] text-white/60 inline-flex items-center gap-2">
        Want iOS? <InterestButton feature="ios" source="pricing-card" label="+ I want iOS" className="text-white/90" />
      </p>

      <div className="my-10 h-px w-full bg-white/20" />

      <ul className="space-y-3 mb-10">
        {[
          "One-time payment for the v1.x line",
          "Android today, iOS on the roadmap (iOS not yet supported)",
          "Unlimited mailboxes + devices",
          "Android APK download — install outside the Play Store",
          "Source code access on GitHub (view-only, source-available license)",
          "Discord community invite (feedback, bugs, roadmap votes)",
          "30-day refund, no questions",
        ].map((f) => (
          <li key={f} className="flex items-start gap-3 text-[15px] leading-[1.5]">
            <span
              className="mono shrink-0 pt-0.5 text-[var(--accent)]"
              aria-hidden
            >
              ✓
            </span>
            <span className="text-white/90">{f}</span>
          </li>
        ))}
      </ul>

      {/* Primary action today: redeem an invite code. Public checkout is not wired yet. */}
      <div className="rounded-xl border border-white/20 p-5 mb-6">
        <p className="mono text-xs text-white/85 mb-2">
          Have an invite code? Get the APK now.
        </p>
        <p className="text-[13px] text-white/75 mb-4">
          Invite codes are the only way through today while public checkout is being wired up.
        </p>
        <RedeemCode />
      </div>

      <div className="rounded-xl border border-white/20 p-4">
        <p className="mono text-[11px] text-white/70 mb-3 text-center">
          Want to be notified when public sale opens?
        </p>
        <InterestButton feature="public-sale" source="pricing-card" variant="inline" label="Notify me" />
      </div>
      <p className="mt-4 mono text-[11px] text-white/85 text-center">
        Refundable for 30 days. No subscription. No card kept on file after purchase.
      </p>
    </div>
  );
}
