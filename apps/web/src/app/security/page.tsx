import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell, BackLink } from "@/components/marketing-shell";
import { Reveal, RevealStagger, RevealItem } from "@/components/reveal";
import { TWITTER_BASE } from "@/lib/metadata-base";

export const metadata: Metadata = {
  title: "Security",
  description:
    "The shortest honest threat model for Inbox Agent: where data lives, how OAuth is protected, how at-rest encryption works on your device, and what we can't fix.",
  alternates: { canonical: "/security" },
  openGraph: {
    type: "website",
    url: "/security",
    title: "Security",
    description:
      "The shortest honest threat model for Inbox Agent: where data lives, how OAuth is protected, how at-rest encryption works on your device, and what we can't fix.",
  },
  twitter: {
    ...TWITTER_BASE,
    title: "Security",
    description:
      "The shortest honest threat model for Inbox Agent: where data lives, how OAuth is protected, how at-rest encryption works on your device, and what we can't fix.",
  },
};

export default function SecurityPage() {
  return (
    <MarketingShell>
      {/* HERO */}
      <section className="border-b border-black/10">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-24 lg:py-32">
          <Reveal>
            <p className="eyebrow mb-6">Security model</p>
            <h1 className="display text-[56px] sm:text-[80px] lg:text-[104px] leading-[0.95]">
              Boring on
              <br />
              <em className="italic">purpose.</em>
            </h1>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mt-10 max-w-2xl text-[18px] leading-[1.6] text-black/70">
              The shortest threat model we could write that still tells the truth.
            </p>
          </Reveal>
        </div>
      </section>

      {/* WHERE DATA LIVES */}
      <section className="border-b border-black/10">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-24">
          <div className="grid lg:grid-cols-12 gap-10 mb-16">
            <h2 className="lg:col-span-5 display text-[40px] lg:text-[56px] leading-[1.0]">
              Where your
              <br />
              <em className="italic">data lives.</em>
            </h2>
            <p className="lg:col-span-6 lg:col-start-7 text-[17px] leading-[1.6] text-black/70 self-end">
              Three places. That&rsquo;s it.
            </p>
          </div>

          <RevealStagger className="grid md:grid-cols-3 gap-px bg-black/10 border-y border-black/10" staggerMs={70}>
            <RevealItem>
              <Item
                n="01"
                title="On your device."
                body="Tasks in IndexedDB (web) or SQLite (mobile). Tokens in your phone's keychain. We don't have a copy."
              />
            </RevealItem>
            <RevealItem>
              <Item
                n="02"
                title="On Google."
                body="Your email already lives on Gmail. We don't pull it through our server."
              />
            </RevealItem>
            <RevealItem>
              <div className="bg-white p-8 lg:p-10 card-hover h-full rounded-2xl">
                <p className="mono text-xs text-black/60 mb-6">03</p>
                <h3 className="display text-[24px] mb-3 leading-[1.1]">On our server.</h3>
                <p className="text-sm leading-[1.6] text-black/70">
                  Almost nothing. A hashed user ID,{" "}
                  <a
                    href="https://github.com/inboxagent/inbox-agent/tree/main/supabase/migrations"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-black/30 underline-offset-2 hover:decoration-black"
                  >
                    encrypted sync blobs
                  </a>{" "}
                  whose key we don&rsquo;t hold, a{" "}
                  <a
                    href="https://github.com/inboxagent/inbox-agent/blob/main/SPEC.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-black/30 underline-offset-2 hover:decoration-black"
                  >
                    license record
                  </a>
                  . Subpoena us and that&rsquo;s all we have.
                </p>
                <pre className="mt-4 text-[11px] leading-[1.5] bg-black/[0.04] text-black/80 rounded-md p-3 overflow-x-auto mono">
{`-- what a server-side row literally contains
-- (excerpt; see supabase/migrations/ for the source)
user_id_hash   text     -- sha256(email), not the email
sync_blob      bytea    -- AES-GCM ciphertext; key stays on device
license_tier   text     -- 'free' | 'pro'
updated_at     timestamptz`}
                </pre>
              </div>
            </RevealItem>
          </RevealStagger>
        </div>
      </section>

      {/* OAUTH */}
      <section className="border-b border-black/10">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-24">
          <div className="grid lg:grid-cols-12 gap-10 mb-16">
            <h2 className="lg:col-span-5 display text-[40px] lg:text-[56px] leading-[1.0]">
              How OAuth is
              <br />
              <em className="italic">protected.</em>
            </h2>
            <p className="lg:col-span-6 lg:col-start-7 text-[17px] leading-[1.6] text-black/70 self-end">
              No shared secrets in clients. No usable copy-paste of our client ID.
            </p>
          </div>

          <RevealStagger className="grid md:grid-cols-3 gap-px bg-black/10 border-y border-black/10" staggerMs={70}>
            <RevealItem>
              <Item
                n="01"
                title="PKCE, no shared secret."
                body="Web and Android both use PKCE. There is no client_secret in any of our binaries. The PKCE verifier lives in RAM for the duration of the OAuth handshake, then evaporates."
              />
            </RevealItem>
            <RevealItem>
              <Item
                n="02"
                title="Signature-bound on Android."
                body="Google won't issue tokens to an APK signature different from the one we registered. Re-signed cracked APKs are rejected at Google's end."
              />
            </RevealItem>
            <RevealItem>
              <Item
                n="03"
                title="Redirect URI lockdown on Web."
                body="Google only redirects auth codes to URIs on our domains. A phishing site that copies our client ID can't complete the flow."
              />
            </RevealItem>
          </RevealStagger>
        </div>
      </section>

      {/* ENCRYPTION AT REST */}
      <section className="border-b border-black/10">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-24">
          <div className="grid lg:grid-cols-12 gap-10 mb-16">
            <h2 className="lg:col-span-5 display text-[40px] lg:text-[56px] leading-[1.0]">
              Encryption at rest,
              <br />
              <em className="italic">on your device.</em>
            </h2>
            <p className="lg:col-span-6 lg:col-start-7 text-[17px] leading-[1.6] text-black/70 self-end">
              Your keys never leave the hardware they were born on.
            </p>
          </div>

          <RevealStagger className="grid md:grid-cols-2 gap-px bg-black/10 border-y border-black/10" staggerMs={70}>
            <RevealItem>
              <div className="bg-white p-8 lg:p-10 card-hover h-full rounded-2xl">
                <p className="mono text-xs text-black/60 mb-6">01</p>
                <h3 className="display text-[24px] mb-3 leading-[1.1]">Web.</h3>
                <p className="text-sm leading-[1.6] text-black/70">
                  OAuth tokens and BYOK API keys are encrypted with a non-extractable AES-GCM key generated once in your browser and stored in IndexedDB. The key never leaves your device.{" "}
                  <a
                    href="https://github.com/inboxagent/inbox-agent/blob/main/apps/web/src/lib/local-crypto.ts"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-black/30 underline-offset-2 hover:decoration-black"
                  >
                    See local-crypto.ts
                  </a>
                  .
                </p>
              </div>
            </RevealItem>
            <RevealItem>
              <Item
                n="02"
                title="Mobile."
                body="Tokens live in Android Keystore via expo-secure-store. Tasks live in expo-sqlite. Both stay on your phone."
              />
            </RevealItem>
          </RevealStagger>
        </div>
      </section>

      {/* WHAT WE CAN'T FIX */}
      <section className="border-b border-black/10">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-24">
          <div className="grid lg:grid-cols-12 gap-10 mb-16">
            <h2 className="lg:col-span-5 display text-[40px] lg:text-[56px] leading-[1.0]">
              What this
              <br />
              <em className="italic">doesn&rsquo;t fix.</em>
            </h2>
            <p className="lg:col-span-6 lg:col-start-7 text-[17px] leading-[1.6] text-black/70 self-end">
              Honest disclosure. Real gaps, not footnotes.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-px bg-black/10 border-y border-black/10">
            <Reveal>
              <div className="bg-white p-8 lg:p-10">
                <p className="mono text-xs text-black/60 mb-6">01</p>
                <h3 className="display text-[24px] mb-3 leading-[1.1]">Hostile forks.</h3>
                <p className="text-sm leading-[1.6] text-black/70">
                  A motivated attacker forks the project, rebrands it, ships their own build with their own OAuth client. That&rsquo;s their app, not ours.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="bg-white p-8 lg:p-10">
                <p className="mono text-xs text-black/60 mb-6">02</p>
                <h3 className="display text-[24px] mb-3 leading-[1.1]">Sideloaded lookalikes.</h3>
                <p className="text-sm leading-[1.6] text-black/70">
                  A user who installs a sideloaded malicious build that claims to be Inbox Agent. We can&rsquo;t stop that &mdash; install from the Play Store or our domain only.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.16}>
              <div className="bg-white p-8 lg:p-10">
                <p className="mono text-xs text-black/60 mb-6">03</p>
                <h3 className="display text-[24px] mb-3 leading-[1.1]">Google itself.</h3>
                <p className="text-sm leading-[1.6] text-black/70">
                  If Google&rsquo;s OAuth infrastructure is compromised, every app that uses it is compromised. This is not a vulnerability we can fix.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* DISCLOSURE */}
      <section className="border-b border-black/10 bg-black text-white">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-24 grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5">
            <p className="eyebrow eyebrow-on-night mb-6">Disclosure</p>
            <h2 className="display text-[40px] lg:text-[56px] leading-[1.0]">
              Found a hole?
              <br />
              <em className="italic">Tell us.</em>
            </h2>
          </div>
          <div className="lg:col-span-6 lg:col-start-7 space-y-6 text-[17px] leading-[1.65] text-white/75">
            <p>
              Email{" "}
              <a
                href="mailto:security@inbox.agent"
                className="underline decoration-white/40 underline-offset-4 hover:decoration-white"
              >
                security@inbox.agent
              </a>
              . 90-day coordinated disclosure timeline.
            </p>
            <p>
              We pay for serious bugs &mdash; eventually. Solo project, no bounty budget today; the promise upgrades to cash once revenue covers it. Until then: credit in the changelog and a heartfelt thank-you.
            </p>
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

function Item({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="bg-white p-8 lg:p-10 card-hover h-full rounded-2xl">
      <p className="mono text-xs text-black/60 mb-6">{n}</p>
      <h3 className="display text-[24px] mb-3 leading-[1.1]">{title}</h3>
      <p className="text-sm leading-[1.6] text-black/70">{body}</p>
    </div>
  );
}
