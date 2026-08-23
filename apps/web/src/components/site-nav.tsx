"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CopyToggle } from "@/components/copy-toggle";

export function SiteNav() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  // Keep the drawer mounted briefly after close so the slide-out transition runs.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when mobile panel is open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  // Mount / unmount the drawer around the CSS slide transition (280ms).
  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    if (!mounted) return;
    const t = setTimeout(() => setMounted(false), 320);
    return () => clearTimeout(t);
  }, [open, mounted]);

  const hashHref = (hash: string) => (isHome ? `#${hash}` : `/#${hash}`);

  const links = [
    { label: "Android app", href: hashHref("android") },
    { label: "How it works", href: hashHref("how") },
    { label: "What it does", href: hashHref("what") },
    { label: "Pricing", href: "/pricing" },
    { label: "Changelog", href: "/changelog" },
  ];

  return (
    <>
      <header
        className={`sticky top-0 z-40 transition-all ${
          scrolled
            ? "bg-[var(--paper)]/85 backdrop-blur-md shadow-[0_1px_0_var(--hairline)]"
            : "bg-[var(--paper)]/75 backdrop-blur-md"
        }`}
      >
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
              <span
                className="block w-3 h-3 rounded-[3px]"
                style={{ background: "var(--accent)" }}
                aria-hidden
              />
              <span className="font-semibold tracking-tight text-[15px]">Inbox Agent</span>
            </Link>
            <div className="hidden md:block">
              <CopyToggle />
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm">
            {links.map((l) => (
              <NavLink key={l.label} href={l.href}>
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3 text-sm">
            <Link
              href="/login"
              className="px-3 py-1.5 rounded-[var(--radius-pill)] hover:bg-black/5 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-[var(--accent)] text-white rounded-full px-5 py-2 text-sm font-semibold transition-shadow hover:shadow-[var(--shadow-cta)]"
            >
              Get started
              <span aria-hidden>→</span>
            </Link>
          </div>

          {/* mobile hamburger + sticky CTA */}
          <div className="md:hidden flex items-center gap-2">
            <Link
              href="/signup"
              className="inline-flex items-center gap-1 bg-[var(--accent)] text-white rounded-full px-3.5 py-1.5 text-xs font-semibold"
            >
              Get started
              <span aria-hidden>&rarr;</span>
            </Link>
            <button
              type="button"
              className="flex flex-col items-end gap-1.5 p-2 -mr-2"
              aria-label="Open menu"
              aria-expanded={open}
              onClick={() => setOpen(true)}
            >
              <span className="block w-6 h-px bg-[var(--ink)]" />
              <span className="block w-4 h-px bg-[var(--ink)]" />
            </button>
          </div>
        </div>
      </header>

      {mounted && (
        <div
          key="mobile-panel"
          className="mobile-drawer fixed inset-0 z-50 bg-[var(--paper)] md:hidden flex flex-col"
          data-open={open ? "true" : "false"}
          {...(!open ? { inert: "" as unknown as undefined } : {})}
        >
          <div className="h-16 px-6 flex items-center justify-between" style={{ borderBottom: "1px solid var(--hairline)" }}>
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2"
            >
              <span
                className="block w-3 h-3 rounded-[3px]"
                style={{ background: "var(--accent)" }}
                aria-hidden
              />
              <span className="font-semibold tracking-tight">Inbox Agent</span>
            </Link>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="p-2 -mr-2 mono text-xl leading-none"
            >
              ×
            </button>
          </div>

          <nav className="flex-1 flex flex-col px-6 py-10 gap-2">
            {links.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                className="display text-[36px] leading-none min-h-[44px] py-3 flex items-center hover:text-[var(--accent)] transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="px-6 py-6 flex flex-col gap-3" style={{ borderTop: "1px solid var(--hairline)" }}>
            <div className="flex justify-center pb-2">
              <CopyToggle />
            </div>
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="btn-ghost justify-center w-full"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              onClick={() => setOpen(false)}
              className="btn-primary justify-center w-full"
            >
              Get started
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const isInternal = href.startsWith("/") && !href.startsWith("/#");
  if (isInternal) {
    return (
      <Link href={href} className="hover:text-[var(--accent)] transition-colors text-[var(--ink-soft)]">
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className="hover:text-[var(--accent)] transition-colors text-[var(--ink-soft)]">
      {children}
    </a>
  );
}
