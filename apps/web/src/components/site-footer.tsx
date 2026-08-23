"use client";

import Link from "next/link";
import { useState, FormEvent } from "react";

export function SiteFooter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("fail");
      setStatus("ok");
      setEmail("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <footer className="bg-[var(--paper)]" style={{ borderTop: "1px solid var(--hairline)" }}>
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-16">
        {/* TOP: 4 columns + signup */}
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <FooterCol title="Product">
            <FooterLink href="/#android">Android app</FooterLink>
            <FooterLink href="/pricing">Get the APK (license required)</FooterLink>
            <FooterLink href="/#how">How it works</FooterLink>
            <FooterLink href="/#what">What it does</FooterLink>
            <FooterLink href="/pricing">$49 · one-time</FooterLink>
            <FooterLink href="/changelog">Changelog</FooterLink>
            <FooterLink href="/status">Status</FooterLink>
          </FooterCol>

          <FooterCol title="Company">
            <FooterLink href="/about">About</FooterLink>
            <FooterLink href="/contact">Contact</FooterLink>
            <FooterLink href="/security">Security</FooterLink>
          </FooterCol>

          <FooterCol title="Legal">
            <FooterLink href="/privacy">Privacy</FooterLink>
            <FooterLink href="/terms">Terms</FooterLink>
          </FooterCol>

          <FooterCol title="Connect">
            <FooterLink href="mailto:hello@inbox.agent">Email</FooterLink>
            <FooterLink href="https://github.com/inboxagent/inbox-agent" external>GitHub</FooterLink>
          </FooterCol>

          <div className="lg:col-span-1">
            <h3 className="mono text-xs uppercase tracking-[0.16em] text-[var(--ink-muted)] mb-4">
              Get product updates
            </h3>
            <form
              onSubmit={handleSubmit}
              className="flex rounded-[var(--radius-pill)] overflow-hidden p-1"
              style={{ background: "#fff", boxShadow: "var(--shadow-card-sm)" }}
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="flex-1 px-4 py-2 text-sm bg-transparent outline-none placeholder:text-[var(--ink-muted)]"
                aria-label="Email address"
                disabled={status === "loading"}
              />
              <button
                type="submit"
                className="px-4 rounded-[var(--radius-pill)] text-white transition-transform hover:scale-[1.03] disabled:opacity-50"
                style={{ background: "var(--accent)" }}
                disabled={status === "loading"}
                aria-label="Subscribe"
              >
                <span aria-hidden>→</span>
              </button>
            </form>
            {status === "ok" && (
              <p className="mt-2 mono text-xs text-[var(--ink-muted)]">Thanks — you&rsquo;re on the list.</p>
            )}
            {status === "error" && (
              <p className="mt-2 mono text-xs text-red-600">Something went wrong.</p>
            )}
          </div>
        </div>

        {/* BOTTOM */}
        <div className="mt-12 pt-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between" style={{ borderTop: "1px solid var(--hairline)" }}>
          <div className="flex flex-col gap-2">
            <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
              <span
                className="block w-3 h-3 rounded-[3px]"
                style={{ background: "var(--accent)" }}
                aria-hidden
              />
              <span className="font-semibold tracking-tight">Inbox Agent</span>
            </Link>
            <p className="mono text-[11px] text-[var(--ink-muted)]">
              Made in Berlin · Hosted in Frankfurt
            </p>
          </div>
          <p className="mono text-xs text-[var(--ink-muted)]">
            © 2026 Inbox Agent. v0.1.1.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mono text-xs uppercase tracking-[0.16em] text-[var(--ink-muted)] mb-4">{title}</h3>
      <ul className="flex flex-col gap-2.5 text-sm text-[var(--ink-soft)]">{children}</ul>
    </div>
  );
}

function FooterLink({
  href,
  children,
  external,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  if (external || href.startsWith("mailto:") || href.startsWith("http")) {
    return (
      <li>
        <a
          href={href}
          className="hover:text-[var(--accent)] transition-colors"
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {children}
        </a>
      </li>
    );
  }
  return (
    <li>
      <Link href={href} className="hover:text-[var(--accent)] transition-colors">
        {children}
      </Link>
    </li>
  );
}
