import type { Metadata } from "next";
import { MarketingShell, BackLink } from "@/components/marketing-shell";
import { Reveal, RevealStagger, RevealItem } from "@/components/reveal";
import { TWITTER_BASE } from "@/lib/metadata-base";

export const metadata: Metadata = {
  title: "About",
  description:
    "Built by one founder after a nine-hour week digging out unread email. Inbox Agent writes the verb, not the noun.",
  alternates: { canonical: "/about" },
  openGraph: {
    type: "website",
    url: "/about",
    title: "About",
    description:
      "Built by one founder after a nine-hour week digging out unread email. Inbox Agent writes the verb, not the noun.",
  },
  twitter: {
    ...TWITTER_BASE,
    title: "About",
    description:
      "Built by one founder after a nine-hour week digging out unread email. Inbox Agent writes the verb, not the noun.",
  },
};

export default function AboutPage() {
  return (
    <MarketingShell>
      {/* HERO */}
      <section className="border-b border-black/10">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-24 lg:py-32">
          <Reveal>
            <p className="eyebrow mb-6">About</p>
            <h1 className="display text-[56px] sm:text-[80px] lg:text-[104px] leading-[0.95]">
              We built this
              <br />
              <em className="italic">out of spite.</em>
            </h1>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mt-10 max-w-2xl text-[18px] leading-[1.6] text-black/70">
              Inbox Agent is a small project with one rule: the agent writes the
              verb, not the noun. Everything else flows from that.
            </p>
          </Reveal>
        </div>
      </section>

      {/* THE STORY */}
      <section className="border-b border-black/10">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-24 grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4">
            <p className="eyebrow mb-6">Origin</p>
            <h2 className="display text-[40px] lg:text-[56px] leading-[1.0]">
              Nine hours.
              <br />
              <em className="italic">One week.</em>
            </h2>
          </div>
          <div className="lg:col-span-7 lg:col-start-6 space-y-6 text-[17px] leading-[1.65] text-black/75">
            <Reveal>
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="w-16 h-16 rounded-full border border-black/10 inline-flex items-center justify-center font-display text-xl font-semibold bg-[var(--accent)] text-white shrink-0"
                  aria-label="Kaushik Chakraborty"
                  role="img"
                >
                  KC
                </div>
                <div>
                  <p className="text-[15px] font-medium text-black">
                    Kaushik Chakraborty
                  </p>
                  <p className="text-[13px] text-black/60">
                    Solo founder. Builds local-first software in Berlin.
                  </p>
                  <p className="text-[13px] mt-1 space-x-3">
                    <a
                      href="https://github.com/kaushikcv"
                      className="underline hover:no-underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      GitHub
                    </a>
                    <a
                      href="https://x.com/kaushikcv"
                      className="underline hover:no-underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      X
                    </a>
                    <a
                      href="https://www.linkedin.com/in/kaushikcv"
                      className="underline hover:no-underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      LinkedIn
                    </a>
                    <a
                      href="https://kaushik.cv"
                      className="underline hover:no-underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      kaushik.cv
                    </a>
                  </p>
                </div>
              </div>
              <p>
                One week last spring, Kaushik tracked his time inside email.
                Nine hours. Scrolling, marking-as-read, feeling behind.
              </p>
            </Reveal>
            <Reveal delay={0.05}>
              <p>
                That same week he missed an autopay notice, buried under
                newsletters. Forty-two dollar fee. Worse feeling.
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <p>
                Every tool he tried wanted to help him read faster. He wanted
                to read less &mdash; to be told, out loud, when something
                needed him. So he built it.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* WHAT WE WON'T DO */}
      <section className="border-b border-black/10">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-24">
          <div className="grid lg:grid-cols-12 gap-10 mb-16">
            <h2 className="lg:col-span-5 display text-[40px] lg:text-[56px] leading-[1.0]">
              What we
              <br />
              <em className="italic">won&rsquo;t do.</em>
            </h2>
            <p className="lg:col-span-6 lg:col-start-7 text-[17px] leading-[1.6] text-black/70 self-end">
              A short list. We&rsquo;d rather lose the customer than break it.
            </p>
          </div>
          <RevealStagger className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-black/10 border-y border-black/10" staggerMs={80}>
            <RevealItem>
              <Wont
                n="01"
                title="No growth hacks."
                body="No streaks, no nudges to upgrade, no fake urgency. The product alarms you only when your email does."
              />
            </RevealItem>
            <RevealItem>
              <Wont
                n="02"
                title="No dark patterns."
                body="Unsubscribe is one click. Delete-my-account is one click. We email you a confirmation, not a save-offer."
              />
            </RevealItem>
            <RevealItem>
              <Wont
                n="03"
                title="No selling data."
                body="Your email isn't a marketing dataset. We don't sell it, share it, or train external models on it. Ever."
              />
            </RevealItem>
            <RevealItem>
              <Wont
                n="04"
                title="No silent changes."
                body="If we ever change what we do with your data, you'll see it in the changelog before it ships, not after."
              />
            </RevealItem>
          </RevealStagger>
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

function Wont({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="bg-white p-8 lg:p-10 card-hover">
      <p className="mono text-xs text-black/60 mb-6">{n}</p>
      <h3 className="display text-[26px] mb-3 leading-[1.05]">{title}</h3>
      <p className="text-sm leading-[1.6] text-black/70">{body}</p>
    </div>
  );
}
