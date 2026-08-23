"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * StickyCta — guarantees a buy CTA is on screen at any zoom level and any
 * viewport size.
 *
 * Behavior:
 *   - We expose a global `data-cta-anchor` attribute on the hero's primary
 *     CTA (see landing-content.tsx). An IntersectionObserver watches it.
 *   - When the anchor is OUT of viewport (scrolled past, zoomed past, or
 *     never fit in the first place — e.g. browser zoom ≥ 200% on a small
 *     window), the sticky bar slides up.
 *   - When the anchor comes back into view, the bar slides away.
 *
 * Falls back to a 600px scroll threshold if no anchor is found (defensive —
 * the anchor is always rendered on the landing page).
 */
export function StickyCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const anchor = document.querySelector<HTMLElement>("[data-cta-anchor]");

    if (anchor && "IntersectionObserver" in window) {
      // Initial sync check — IO's first callback may be 1 frame late, so
      // compute visibility from getBoundingClientRect right now. This
      // matters at high zoom on small viewports where the CTA was never
      // visible to begin with.
      const r = anchor.getBoundingClientRect();
      const vw = window.innerWidth || document.documentElement.clientWidth;
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const offscreen =
        r.bottom <= 0 || r.right <= 0 || r.top >= vh || r.left >= vw;
      setVisible(offscreen);

      const io = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (!entry) return;
          setVisible(!entry.isIntersecting);
        },
        {
          threshold: 0,
          rootMargin: "0px 0px -20px 0px",
        },
      );
      io.observe(anchor);
      return () => io.disconnect();
    }

    // Fallback for browsers without IntersectionObserver or pages without
    // the anchor.
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`fixed bottom-0 inset-x-0 z-40 transition-transform duration-300 ${
        visible ? "translate-y-0" : "translate-y-full pointer-events-none"
      }`}
      // Hide from a11y tree + tab order when offscreen so focus can't be
      // trapped in an invisible bar. Lighthouse's aria-hidden-focus audit
      // requires this, not aria-hidden alone.
      {...(!visible ? { inert: "" as unknown as undefined } : {})}
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="px-3 pb-3 sm:px-4 sm:pb-4">
        <div
          className="max-w-[1280px] mx-auto min-h-14 flex flex-wrap items-center justify-between gap-2 sm:gap-4 px-4 sm:px-5 py-2 rounded-[var(--radius-pill)]"
          style={{
            background: "var(--night-grad)",
            color: "#fff",
            boxShadow: "var(--shadow-float)",
          }}
        >
          <p className="mono text-[10px] sm:text-[11px] text-white/75 truncate">
            $49 one-time &middot; 30-day refund &middot; Gmail today
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1.5 sm:gap-2 bg-[var(--accent)] text-white rounded-full px-4 py-2 sm:px-5 text-xs sm:text-sm font-semibold whitespace-nowrap shadow-[var(--shadow-cta)] hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 transition"
          >
            Get it — $49
            <span aria-hidden>&rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
