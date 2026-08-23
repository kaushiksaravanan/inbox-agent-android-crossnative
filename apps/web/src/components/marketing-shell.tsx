import Link from "next/link";
import type { ReactNode } from "react";

export function MarketingHeader() {
  return (
    <header className="border-b border-black/10">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="block w-2.5 h-2.5 bg-black" aria-hidden />
          <span className="font-medium tracking-tight">Inbox Agent</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm">
          <Link href="/about" className="hover:opacity-60 transition-opacity">About</Link>
          <Link href="/security" className="hover:opacity-60 transition-opacity">Security</Link>
          <Link href="/changelog" className="hover:opacity-60 transition-opacity">Changelog</Link>
          <Link href="/status" className="hover:opacity-60 transition-opacity">Status</Link>
          <Link href="/contact" className="hover:opacity-60 transition-opacity">Contact</Link>
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
  );
}

export function MarketingFooter() {
  return (
    <footer className="bg-white border-t border-black/10">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex items-center gap-2">
          <span className="block w-2.5 h-2.5 bg-black" aria-hidden />
          <span className="font-medium tracking-tight">Inbox Agent</span>
        </div>
        <div className="flex flex-wrap items-center gap-6 text-xs mono text-black/70">
          <Link href="/about" className="hover:text-black transition-colors">About</Link>
          <Link href="/security" className="hover:text-black transition-colors">Security</Link>
          <Link href="/changelog" className="hover:text-black transition-colors">Changelog</Link>
          <Link href="/status" className="hover:text-black transition-colors">Status</Link>
          <Link href="/contact" className="hover:text-black transition-colors">Contact</Link>
          <span>·</span>
          <a href="mailto:hi@inbox.agent" className="link">hi@inbox.agent</a>
        </div>
      </div>
    </footer>
  );
}

export function BackLink() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2 text-sm text-black/60 hover:text-black transition-colors"
    >
      <span aria-hidden>←</span>
      Back to Inbox Agent
    </Link>
  );
}

export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <main className="bg-[var(--paper)] text-black min-h-screen flex flex-col">
      <MarketingHeader />
      <div className="flex-1">{children}</div>
      <MarketingFooter />
    </main>
  );
}
