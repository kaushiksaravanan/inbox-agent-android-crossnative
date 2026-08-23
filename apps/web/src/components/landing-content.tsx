"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { Reveal, RevealStagger, RevealItem } from "@/components/reveal";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { StickyCta } from "@/components/sticky-cta";
import { InterestButton } from "@/components/interest-button";
import { PixelPhone } from "@/components/pixel-phone";
import { COPY } from "@/lib/copy";
import { EXTRA_HOME_FAQS } from "@/lib/home-faq";
import { useCopyMode } from "@/components/copy-context";

// Heavy framer-motion components — hydrate after first paint.
const Marquee3D = dynamic(
  () => import("@/components/marquee-3d").then((m) => m.Marquee3D),
  { ssr: false, loading: () => <div style={{ height: 168 }} /> },
);

export function LandingContent() {
  const mode = useCopyMode();
  const c = COPY;

  return (
    <main className="bg-[var(--paper)] text-[var(--ink)] overflow-x-hidden">
      <SiteNav />

      {/* HERO */}
      <section className="relative canvas-fade">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 pt-8 lg:pt-24 pb-12 lg:pb-24 grid lg:grid-cols-12 gap-6 lg:gap-10">
          <div className="lg:col-span-7">
            <p className="eyebrow mb-3 lg:mb-6">{c.hero_eyebrow[mode]}</p>
            <h1 className="display text-[36px] sm:text-[64px] lg:text-[96px] leading-[1.0] lg:leading-[0.98] tracking-[-0.03em] lg:tracking-[-0.04em] break-words">
              {c.hero_headline[mode]}
            </h1>
            <p className="mt-4 lg:mt-8 max-w-xl text-[15px] lg:text-[17px] leading-[1.5] lg:leading-[1.55] text-[var(--ink-soft)]">
              {c.hero_body_simple}
            </p>

            <div className="mt-4 lg:mt-6">
              <span
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1 mono text-xs text-[var(--ink-mid)]"
                style={{ borderColor: "color-mix(in srgb, var(--ink) 15%, transparent)" }}
              >
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full"
                  style={{ background: "var(--accent)" }}
                  aria-hidden
                />
                Read-only &middot; your phone reads Gmail, not us
              </span>
            </div>

            <div className="mt-5 lg:mt-8 flex flex-wrap items-center gap-3 lg:gap-4">
              <Link
                href="/signup"
                data-cta-anchor
                className="inline-flex items-center gap-2 bg-[var(--accent)] text-white rounded-full px-6 py-3 lg:px-8 lg:py-4 font-semibold shadow-[var(--shadow-cta)] hover:scale-[1.03] hover:shadow-[var(--shadow-cta-hover)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--accent-ring)] transition"
              >
                {c.hero_cta_primary[mode]}
                <span aria-hidden>&rarr;</span>
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-7 py-3 font-semibold hover:bg-ink hover:text-white transition-colors"
                style={{ borderColor: "color-mix(in srgb, var(--ink) 15%, transparent)" }}
              >
                See pricing
                <span aria-hidden>&rarr;</span>
              </Link>
              <a
                href="#how"
                className="inline-flex items-center gap-1 text-sm text-[var(--ink-mid)] hover:text-[var(--accent)] transition-colors"
              >
                See the steps
                <span aria-hidden>&rarr;</span>
              </a>
            </div>

            <p className="mt-6 text-xs text-[var(--ink-muted)]">
              {c.hero_finepoint[mode]} &middot;{" "}
              <a href="#how" className="text-[var(--accent)] hover:opacity-70 underline">
                See how it works
              </a>
            </p>
            <p className="mt-2 text-xs text-[var(--ink-muted)]">
              After signup: redeem a code or buy on{" "}
              <Link href="/pricing" className="underline hover:text-[var(--accent)]">
                /pricing
              </Link>
              , download the APK, then pair your phone with a six-digit code.
            </p>

            {/* Provider strip */}
            <div className="mt-12 pt-8" style={{ borderTop: "1px solid var(--hairline)" }}>
              <p className="mono text-[10px] tracking-[0.16em] uppercase text-[var(--ink-muted)] mb-4">
                Works with the email you already use
              </p>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mono text-xs uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                <span>Gmail <span className="text-[var(--accent)] normal-case tracking-normal">(live)</span></span>
                <span aria-hidden className="text-[var(--ink-faint)]">/</span>
                <span className="inline-flex items-center gap-2">
                  Outlook <span className="text-[var(--ink-muted)] normal-case tracking-normal">(soon)</span>
                  <InterestButton feature="outlook" source="hero-provider-strip" />
                </span>
                <span aria-hidden className="text-[var(--ink-faint)]">/</span>
                <span className="inline-flex items-center gap-2">
                  Apple Mail <span className="text-[var(--ink-muted)] normal-case tracking-normal">(soon)</span>
                  <InterestButton feature="apple-mail" source="hero-provider-strip" />
                </span>
                <span aria-hidden className="text-[var(--ink-faint)]">/</span>
                <span className="inline-flex items-center gap-2">
                  Fastmail <span className="text-[var(--ink-muted)] normal-case tracking-normal">(soon)</span>
                  <InterestButton feature="fastmail" source="hero-provider-strip" />
                </span>
                <span aria-hidden className="text-[var(--ink-faint)]">/</span>
                <span className="inline-flex items-center gap-2">
                  Proton <span className="text-[var(--ink-muted)] normal-case tracking-normal">(soon)</span>
                  <InterestButton feature="proton" source="hero-provider-strip" />
                </span>
              </div>
              <p className="mono text-[10px] text-[var(--ink-muted)] mt-3">
                Tap &ldquo;+ I want this&rdquo; — we&apos;ll prioritize by demand.
              </p>
            </div>
          </div>

          {/* PHONE LOCKSCREEN — real Pixel 8 frame from Android Studio's
              device-art set, with our content drawn live (no screenshot,
              so no risk of localhost chrome leakage like the previous
              /screens/phone-hero.png). On mobile the phone shrinks to keep
              the hero CTA above the fold. */}
          <div className="lg:col-span-5 lg:pt-6 order-last lg:order-none">
            <Reveal>
              <div className="flex justify-center">
                {/* Mobile: small (200px) so it fits next to the CTA above the fold */}
                <div className="block md:hidden">
                  <PixelPhone variant="lockscreen" width={200} priority />
                </div>
                {/* Tablet+: larger but still capped */}
                <div className="hidden md:block">
                  <PixelPhone variant="lockscreen" width={300} priority />
                </div>
              </div>
              <p className="mt-4 mono text-[10px] text-center text-[var(--ink-muted)] uppercase tracking-[0.16em]">
                Illustration. Example notifications on a Pixel lockscreen.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* TICKER */}
      <Marquee3D />

      {/* THE ANDROID APP */}
      <section id="android" className="section-night-grad">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-20 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7">
            <p className="eyebrow mb-6" style={{ color: "rgba(255,255,255,0.6)" }}>{c.android_eyebrow[mode]}</p>
            <h2 className="display text-[44px] lg:text-[72px] tracking-[-0.04em]">
              {c.android_headline[mode]}
            </h2>
            <p className="mt-6 max-w-xl text-[17px] leading-[1.6] text-white/75">
              {c.android_body_simple}
            </p>
            <ul className="mt-8 space-y-3 mono text-sm text-white/80">
              <li>&middot; Tasks appear on the lockscreen with the action verb</li>
              <li>&middot; Home-screen widget shows today&rsquo;s 3 priority tasks</li>
              <li>&middot; Bring your own Gemini/OpenAI/Anthropic key</li>
              <li>&middot; iOS via TestFlight when 200 mailbox cap is reached</li>
            </ul>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 bg-[var(--accent)] text-white rounded-full px-7 py-3 font-semibold shadow-[var(--shadow-cta)] hover:scale-[1.02] transition"
              >
                Buy &amp; download &mdash; see pricing
                <span aria-hidden>&rarr;</span>
              </Link>
              <Link href="/security" className="btn-dark">
                Permissions explained
              </Link>
            </div>
            <p className="mt-4 text-xs text-white/75 mono">
              Android 9.0+ &middot; ~49 MB &middot; v0.1.1 &middot; arm64-v8a + armeabi-v7a
            </p>
            <p className="mt-2 text-[10px] text-white/55 mono break-all max-w-xl">
              APK SHA-256: published on{" "}
              <Link href="/security" className="underline hover:text-white">
                /security
              </Link>{" "}
              alongside signing-cert fingerprint &mdash; verify before install.
            </p>
          </div>
          <div className="lg:col-span-5 flex justify-center">
            <PixelPhone variant="task-list" width={280} priority />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS — 1 user step + 3 agent steps with different visual weight */}
      <section id="how" className="border-b border-black/5 py-16 lg:py-20 bg-[var(--paper)]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <p className="eyebrow mb-4">{c.how_eyebrow_simple}</p>
          <h2 className="display text-[44px] lg:text-[64px] mb-4 tracking-[-0.04em]">
            {c.how_headline_simple}
          </h2>
          <p className="text-lg text-[var(--ink-mid)] mb-10">
            {c.how_subline_simple}
          </p>

          <RevealStagger className="grid lg:grid-cols-12 gap-6" staggerMs={120}>
            {/* THE USER'S STEP — full row, accent background */}
            <RevealItem className="lg:col-span-12">
              <div
                className="rounded-2xl p-8 lg:p-12 text-white"
                style={{
                  background: "var(--accent)",
                  boxShadow: "var(--shadow-card)",
                }}
              >
                <p className="mono text-xs tracking-[0.18em] uppercase mb-4 text-white/95">
                  YOUR JOB &middot; {c.step_user.number}
                </p>
                <h3 className="display text-[40px] lg:text-[56px] mb-4 tracking-[-0.03em]">
                  {c.step_user.title}
                </h3>
                <p className="text-lg">{c.step_user.body}</p>
              </div>
            </RevealItem>

            {/* AGENT'S 3 STEPS — smaller grid, muted */}
            {c.steps_agent.map((s) => (
              <RevealItem key={s.number} className="lg:col-span-4">
                <div
                  className="card-rest rounded-2xl p-6 lg:p-8 bg-white h-full"
                  style={{ boxShadow: "var(--shadow-card-sm)" }}
                >
                  <p className="mono text-xs tracking-[0.18em] uppercase text-[var(--ink-mid)] mb-4">
                    AGENT &middot; {s.number}
                  </p>
                  <h3 className="display text-[28px] mb-2 tracking-[-0.03em]">{s.title}</h3>
                  <p className="text-sm text-[var(--ink-soft)]">{s.body}</p>
                </div>
              </RevealItem>
            ))}
          </RevealStagger>

          <p className="mt-12 text-sm text-[var(--ink-mid)]">
            You sign in. The agent does the rest.
          </p>
        </div>
      </section>


      {/* WHAT IT DOES */}
      <section id="what" className="bg-[var(--paper-warm)]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-16">
          <p className="eyebrow mb-6">{c.what_eyebrow[mode]}</p>
          <h2 className="display text-[44px] lg:text-[72px] max-w-3xl tracking-[-0.04em]">
            {c.what_headline[mode]}
          </h2>

          <p className="mt-6 max-w-2xl text-[15px] text-[var(--ink-soft)]">
            {c.what_body_simple}
          </p>

          {/* Concrete example task titles — show the product, don't describe it */}
          <div className="mt-10 grid md:grid-cols-3 gap-4">
            <TaskExample
              dotColor="var(--accent)"
              category="SUBSCRIPTION"
              title="Cancel Lovable &mdash; $50 autopay, forgot the coupon."
            />
            <TaskExample
              dotColor="#3b82f6"
              category="PAYMENT"
              title="Pay Comcast &mdash; $84.21 by Friday."
            />
            <TaskExample
              dotColor="#10b981"
              category="DEADLINE"
              title="Confirm dentist &mdash; Thursday 3 PM."
            />
          </div>

          <p className="mt-8 mono text-xs text-[var(--ink-muted)] max-w-2xl">
            We can&rsquo;t send or draft email. The OAuth scope is read-only.
          </p>
        </div>
      </section>

      {/* BUILT IN PUBLIC — honest signals in lieu of fabricated social proof */}
      <section className="bg-[var(--paper)] border-b border-black/5">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-12">
          <p className="mono text-[10px] tracking-[0.16em] uppercase text-[var(--ink-muted)] mb-4">
            Built in public
          </p>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 mono text-sm text-[var(--ink-soft)]">
            <a
              href="https://github.com/inbox-agent/inbox-agent"
              className="underline hover:text-[var(--accent)]"
              rel="noopener noreferrer"
              target="_blank"
            >
              Source on GitHub
            </a>
            <span aria-hidden className="text-[var(--ink-faint)]">/</span>
            <a
              href="https://github.com/inbox-agent/inbox-agent/blob/main/ROADMAP.md"
              className="underline hover:text-[var(--accent)]"
              rel="noopener noreferrer"
              target="_blank"
            >
              Public roadmap
            </a>
            <span aria-hidden className="text-[var(--ink-faint)]">/</span>
            <a
              href="https://github.com/inbox-agent/inbox-agent/blob/main/CHANGELOG.md"
              className="underline hover:text-[var(--accent)]"
              rel="noopener noreferrer"
              target="_blank"
            >
              Changelog
            </a>
            <span aria-hidden className="text-[var(--ink-faint)]">/</span>
            <span>v0.1.1 &middot; early access</span>
          </div>
          <p className="mt-3 text-xs text-[var(--ink-muted)] max-w-2xl">
            No customer logos or testimonials yet &mdash; we&rsquo;d rather show the
            real code than invent quotes.
          </p>
        </div>
      </section>

      {/* SAFETY — pulled from COPY tiles */}
      <section id="safety" className="section-night-grad">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-16">
          <div className="grid lg:grid-cols-12 gap-10 mb-10">
            <div className="lg:col-span-5">
              <p className="eyebrow eyebrow-on-night mb-6">{c.safety_eyebrow[mode]}</p>
              <h2 className="display text-[44px] lg:text-[64px] tracking-[-0.04em]">
                {c.safety_headline[mode]}
              </h2>
            </div>
            <p className="lg:col-span-6 lg:col-start-7 text-[17px] leading-[1.6] text-white/75 self-end">
              {c.safety_body_simple}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {c.safety_tiles.map((tile, i) => (
              <SafetyDark
                key={tile.simple_title}
                n={`0${i + 1}`}
                title={mode === "simple" ? tile.simple_title : tile.buzzword_title}
                body={mode === "simple" ? tile.simple_body : tile.buzzword_body}
              />
            ))}
          </div>

          <p className="mt-10 mono text-xs text-white/55 max-w-2xl">
            We filter 2FA codes, passwords, and one-time tokens out before the
            on-device extractor sees them &mdash; they never become tasks.
          </p>
        </div>
      </section>


      {/* FAQ — first 4 from COPY, rest hardcoded */}
      <section id="faq" className="bg-[var(--paper)]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-20 grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4">
            <p className="eyebrow mb-6">Common questions</p>
            <h2 className="display text-[44px] lg:text-[56px] tracking-[-0.04em]">
              Asked
              <br />
              <em>often.</em>
            </h2>
          </div>
          <div className="lg:col-span-8">
            {c.faq.map((item) => (
              <Faq
                key={item.q.simple}
                q={item.q[mode]}
                a={item.a[mode]}
              />
            ))}
            {/* Extras live in lib/home-faq.ts so the FAQPage JSON-LD in
                app/page.tsx renders the exact same answer text. Edit there. */}
            {EXTRA_HOME_FAQS.map((item) => (
              <Faq key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-[var(--paper)]">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-16 lg:py-40 text-center">
          <h2 className="display text-[44px] sm:text-[72px] lg:text-[104px] leading-[0.98] tracking-[-0.04em]">
            {c.final_section[mode].headline}
          </h2>
          <p className="mt-8 max-w-[720px] mx-auto text-lg lg:text-xl text-[var(--ink-soft)] leading-[1.5]">
            {c.final_section[mode].body}
          </p>
          <p className="mt-6 mono text-sm text-[var(--ink-muted)]">
            {c.final_section[mode].signature}
          </p>
          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-[var(--accent)] text-white rounded-full px-8 py-4 font-semibold shadow-[var(--shadow-cta)] hover:scale-[1.03] hover:shadow-[var(--shadow-cta-hover)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--accent-ring)] transition"
            >
              {c.final_section[mode].cta}
              <span aria-hidden>&rarr;</span>
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-full border px-8 py-4 font-semibold hover:bg-ink hover:text-white transition-colors"
              style={{ borderColor: "color-mix(in srgb, var(--ink) 15%, transparent)" }}
            >
              {c.hero_cta_secondary[mode]}
              <span aria-hidden>&rarr;</span>
            </Link>
          </div>
          <p className="mt-6 text-xs mono text-[var(--ink-muted)]">
            <Link href="/login" className="text-[var(--accent)] underline hover:opacity-70">I already have an account</Link>
          </p>
        </div>
      </section>

      <SiteFooter />
      <StickyCta />
    </main>
  );
}


function TaskExample({
  dotColor,
  category,
  title,
}: {
  dotColor: string;
  category: string;
  title: string;
}) {
  return (
    <div
      className="rounded-2xl bg-white p-5"
      style={{ boxShadow: "var(--shadow-card-sm)" }}
    >
      <p className="mono text-[10px] tracking-[0.16em] uppercase mb-3 flex items-center gap-2 text-[var(--ink-muted)]">
        <span
          className="inline-block w-2 h-2 rounded-full"
          style={{ background: dotColor }}
          aria-hidden
        />
        {category}
      </p>
      <p
        className="display text-[20px] leading-[1.15] tracking-[-0.02em]"
        dangerouslySetInnerHTML={{ __html: title }}
      />
    </div>
  );
}

function Stat({ big, label }: { big: React.ReactNode; label: string }) {
  return (
    <div>
      <p
        className="display tick tabular-nums text-[88px] lg:text-[140px] leading-none min-w-[3ch] inline-block tracking-[-0.04em]"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {big}
      </p>
      <p className="mt-4 text-sm text-[var(--ink-soft)] max-w-xs leading-[1.5]">{label}</p>
    </div>
  );
}

function SafetyDark({
  n,
  title,
  body,
}: {
  n: string;
  title: string;
  body: string;
}) {
  return (
    <div
      className="p-8 lg:p-10 rounded-2xl"
      style={{
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "var(--shadow-card-sm)",
      }}
    >
      <p className="mono text-xs mb-6" style={{ color: "var(--accent-soft)" }}>{n}</p>
      <h3 className="display text-[28px] mb-3 tracking-[-0.03em]">{title}</h3>
      <p className="text-sm leading-[1.6] text-white/75">{body}</p>
    </div>
  );
}

function Plan({
  name,
  price,
  tag,
  lines,
  highlight,
}: {
  name: string;
  price: string;
  tag: string;
  lines: string[];
  highlight?: boolean;
}) {
  return (
    <div
      className="p-8 lg:p-10 rounded-2xl card-hover"
      style={{
        background: highlight ? "var(--night-grad)" : "#fff",
        color: highlight ? "#fff" : "var(--ink)",
        boxShadow: highlight ? "var(--shadow-float)" : "var(--shadow-card-sm)",
      }}
    >
      <p
        className="mono text-xs mb-6"
        style={{ color: highlight ? "var(--accent-soft)" : "var(--accent)" }}
      >
        {tag}
      </p>
      <h3 className="display text-[32px] mb-2 tracking-[-0.03em]">{name}</h3>
      <p className="display text-[44px] leading-none mb-6 tracking-[-0.04em]">{price}</p>
      <ul className="space-y-2 text-sm">
        {lines.map((l) => (
          <li
            key={l}
            style={{ color: highlight ? "rgba(255,255,255,0.82)" : "var(--ink-soft)" }}
          >
            &middot; {l}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className="group card-rest rounded-2xl px-6 py-5 mb-3 transition hover:card-elev" style={{ boxShadow: "var(--shadow-card-sm)" }}>
      <summary className="flex items-start justify-between gap-6 cursor-pointer">
        <span className="text-[17px] font-medium">{q}</span>
        <span className="chev mono text-xl shrink-0 text-[var(--ink-muted)]">+</span>
      </summary>
      <p className="mt-4 text-[15px] leading-[1.6] text-[var(--ink-soft)] max-w-2xl">
        {a}
      </p>
    </details>
  );
}
