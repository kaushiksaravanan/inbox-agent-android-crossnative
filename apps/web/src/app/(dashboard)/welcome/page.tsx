// Post-signup landing — surfaces the three things a brand-new user needs
// immediately after creating an account but before they have anything to
// look at in the dashboard:
//
//   1. APK download (via redeem code) so they can install the agent on phone
//   2. Pair their phone to this web account
//   3. Connect Gmail so the agent has something to read
//
// Signup form redirects here instead of /dashboard so users don't get
// stranded on an empty dashboard wondering "how do I actually use this?".
// Existing users can still reach /welcome from a "Set up your phone" CTA
// in the dashboard empty state — see /dashboard/page.tsx.

import Link from "next/link";
import { Smartphone, Mail, Github, MessagesSquare } from "lucide-react";
import { RedeemCode } from "@/components/redeem-code";

export const metadata = {
  title: "Welcome",
};

export default function WelcomePage() {
  return (
    <div className="space-y-10 max-w-3xl">
      <header className="space-y-3">
        <p className="mono text-xs text-black/60">YOU&apos;RE IN</p>
        <h1 className="font-display text-4xl sm:text-5xl tracking-tight">
          Three steps to your first alarm.
        </h1>
        <p className="text-[15px] leading-[1.6] text-black/70 max-w-xl">
          The agent runs on your phone. To get it there, install the Android
          APK, pair this account, then connect Gmail. We&apos;ll show you
          how — all three live on this page.
        </p>
      </header>

      <section className="rounded-2xl border border-black/10 p-6 sm:p-8 bg-white">
        <div className="flex items-start gap-3 mb-5">
          <span className="mono text-xs bg-black text-white rounded-full px-2 py-1 shrink-0">01</span>
          <div>
            <h2 className="font-display text-xl">Install the Android app</h2>
            <p className="text-sm text-black/60 mt-1">
              Enter your invite code below to download the APK and join the
              Discord. Codes come from Product Hunt, Hacker News, Reddit
              threads, or directly from us.
            </p>
          </div>
        </div>
        <div className="bg-[var(--night)] rounded-2xl p-6 text-white">
          <RedeemCode />
        </div>
      </section>

      <section className="rounded-2xl border border-black/10 p-6 sm:p-8 bg-white">
        <div className="flex items-start gap-3 mb-5">
          <span className="mono text-xs bg-black text-white rounded-full px-2 py-1 shrink-0">02</span>
          <div>
            <h2 className="font-display text-xl">Pair your phone</h2>
            <p className="text-sm text-black/60 mt-1">
              After you install the APK and open it, you&apos;ll see a 6-digit
              code. Enter it on the Devices page to link your phone to this
              account.
            </p>
          </div>
        </div>
        <Link
          href="/devices"
          className="inline-flex items-center gap-2 bg-black text-white rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-black/85 transition"
        >
          <Smartphone className="h-4 w-4" />
          Open device pairing
        </Link>
      </section>

      <section className="rounded-2xl border border-black/10 p-6 sm:p-8 bg-white">
        <div className="flex items-start gap-3 mb-5">
          <span className="mono text-xs bg-black text-white rounded-full px-2 py-1 shrink-0">03</span>
          <div>
            <h2 className="font-display text-xl">Connect Gmail</h2>
            <p className="text-sm text-black/60 mt-1">
              One read-only OAuth handshake. Your phone polls Gmail directly
              — our server never sees the email body.
            </p>
          </div>
        </div>
        <Link
          href="/accounts"
          className="inline-flex items-center gap-2 bg-[var(--accent)] text-white rounded-full px-5 py-2.5 text-sm font-semibold hover:scale-[1.02] transition"
        >
          <Mail className="h-4 w-4" />
          Connect Gmail
        </Link>
      </section>

      <footer className="border-t border-black/10 pt-6 text-sm text-black/60 space-y-2">
        <p className="font-semibold text-black/80">After you finish step 1:</p>
        <ul className="space-y-1.5">
          <li className="flex items-center gap-2">
            <Github className="h-4 w-4" />
            <span>The source code lives on GitHub (view-only license).</span>
          </li>
          <li className="flex items-center gap-2">
            <MessagesSquare className="h-4 w-4" />
            <span>Discord is where we coordinate bugs and feature votes.</span>
          </li>
        </ul>
        <p className="pt-3">
          Skip ahead anytime → <Link href="/dashboard" className="underline">go to dashboard</Link>
        </p>
      </footer>
    </div>
  );
}
