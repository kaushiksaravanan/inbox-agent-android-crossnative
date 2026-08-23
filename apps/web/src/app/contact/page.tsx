import type { Metadata } from "next";
import { MarketingShell, BackLink } from "@/components/marketing-shell";
import { ContactForm } from "@/components/contact-form";
import { Reveal, RevealStagger, RevealItem } from "@/components/reveal";
import { TWITTER_BASE } from "@/lib/metadata-base";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Email us, report a vulnerability, or send a note through the contact form.",
  alternates: { canonical: "/contact" },
  openGraph: {
    type: "website",
    url: "/contact",
    title: "Contact",
    description:
      "Email us, report a vulnerability, or send a note through the contact form.",
  },
  twitter: {
    ...TWITTER_BASE,
    title: "Contact",
    description:
      "Email us, report a vulnerability, or send a note through the contact form.",
  },
};

export default function ContactPage() {
  return (
    <MarketingShell>
      {/* HERO */}
      <section className="border-b border-black/10">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-24 lg:py-32">
          <Reveal>
            <p className="eyebrow mb-6">Contact</p>
            <h1 className="display text-[56px] sm:text-[80px] lg:text-[104px] leading-[0.95]">
              Three ways
              <br />
              <em className="italic">to reach us.</em>
            </h1>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mt-10 max-w-2xl text-[18px] leading-[1.6] text-black/70">
              Human reply within one business day.
            </p>
          </Reveal>
        </div>
      </section>

      {/* EMAILS */}
      <section className="border-b border-black/10">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-20">
          <p className="eyebrow mb-10">By email</p>
          <RevealStagger className="grid md:grid-cols-3 gap-px bg-black/10 border-y border-black/10" staggerMs={80}>
            <RevealItem>
              <Card
                n="01"
                label="General"
                email="hi@inbox.agent"
                body="Anything that doesn't fit the other two."
              />
            </RevealItem>
            <RevealItem>
              <Card
                n="02"
                label="Vulnerabilities"
                email="security@inbox.agent"
                body="First-priority routing; PGP on request."
              />
            </RevealItem>
            <RevealItem>
              <Card
                n="03"
                label="Help"
                email="support@inbox.agent"
                body="Pairing, missing tasks, account access."
              />
            </RevealItem>
          </RevealStagger>
        </div>
      </section>

      {/* FORM */}
      <section className="border-b border-black/10">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-20 grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5">
            <p className="eyebrow mb-6">Or write here</p>
            <h2 className="display text-[40px] lg:text-[56px] leading-[1.0]">
              Send a note
              <br />
              <em className="italic">directly.</em>
            </h2>
            <p className="mt-6 text-[15px] leading-[1.6] text-black/70 max-w-md">
              Lands in the same inbox.
            </p>
          </div>
          <div className="lg:col-span-7">
            <ContactForm />
          </div>
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

function Card({
  n,
  label,
  email,
  body,
}: {
  n: string;
  label: string;
  email: string;
  body: string;
}) {
  return (
    <div className="bg-white p-8 lg:p-10 card-hover h-full flex flex-col">
      <p className="mono text-xs text-black/60 mb-6">{n}</p>
      <p className="mono text-[11px] uppercase tracking-wider text-black/55 mb-3">
        {label}
      </p>
      <a
        href={`mailto:${email}`}
        className="display text-[24px] leading-[1.1] underline decoration-black/20 underline-offset-4 hover:decoration-black break-all"
      >
        {email}
      </a>
      <p className="mt-4 text-sm leading-[1.6] text-black/70">{body}</p>
    </div>
  );
}
