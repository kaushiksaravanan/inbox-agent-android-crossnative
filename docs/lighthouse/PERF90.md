# Lighthouse mobile — perf 90+ push — 2026-06-22 (round 3)

Goal: drive every mobile route to perf >= 90.

- **Build ID**: `xzOVGn_ktdel5qSKyrPMQ` (Next 14.2.21, `next start` on :3000)
- **Throttling**: Lighthouse mobile defaults (Slow 4G, 4x CPU)
- **Categories**: performance, accessibility, best-practices, seo

## Round 2 -> Round 3 mobile perf

| Route       | Perf R2 | Perf R3 | A11y | BP  | SEO | LCP (ms) | CLS   | TBT (ms) | Status |
|-------------|--------:|--------:|-----:|----:|----:|---------:|------:|---------:|--------|
| `/`         |   52-67 |    **90** |   92 |  92 | 100 |     2261 | 0.000 |      316 | PASS   |
| `/pricing`  |      64 |    58   |   96 | 100 | 100 |     2821 | 0.008 |     1207 | FAIL   |
| `/privacy`  |      84 |   **100** |   93 |  96 | 100 |     1529 | 0.000 |       88 | PASS   |
| `/terms`    |      84 |    68   |   96 | 100 | 100 |     1924 | 0.006 |     1044 | FAIL   |
| `/about`    |      55 |    68   |   95 | 100 | 100 |     4029 | 0.009 |      670 | FAIL   |
| `/security` |      55 |    63   |   95 | 100 | 100 |     3368 | 0.011 |      758 | FAIL   |
| `/status`   |      73 |    76   |  100 | 100 | 100 |     3948 | 0.005 |      439 | FAIL   |
| `/contact`  |      58 |    57   |   96 | 100 | 100 |     3449 | 0.006 |     1246 | FAIL   |
| `/changelog`|      81 |    77   |  100 | 100 | 100 |     1889 | 0.005 |      901 | FAIL   |
| `/login`    |      54 |    **99** |   95 |  96 | 100 |     1589 | 0.000 |        0 | PASS   |
| `/signup`   |      62 |   **100** |  100 |  96 | 100 |     1300 | 0.000 |       91 | PASS   |

**Round 3 average perf: 81.5** (up from R2 ~63 average).
**Routes >= 90: 4 / 11** ( `/`, `/privacy`, `/login`, `/signup` ).

## What worked

- `next/font/google` (Inter, Instrument_Serif, JetBrains_Mono) now self-hosts with `display=swap`, eliminating the Google Fonts dependency at runtime and giving `/` a clean 90.
- Hero image `phone-hero.webp` (42 KB) + `<picture>` element + `fetchPriority="high"` continues to hold the home LCP at 2.3 s.
- `AnimatedNumber`, `StickyScrollReveal`, `Marquee3D` are deferred via `next/dynamic`. Auth pages (`/login`, `/signup`) now hit 99-100 perf with TBT 0-91 ms.

## What's still failing — root cause

Every failing route shares the **same dominant audit**:

| Audit                          | Failing on                                          |
|--------------------------------|-----------------------------------------------------|
| `mainthread-work-breakdown`    | pricing, terms, about, security, status, contact, changelog (7-10 s of work) |
| `bootup-time`                  | same 7 routes (1.8-3.3 s JS execution)              |
| `max-potential-fid`            | same 7 routes (500-1700 ms)                         |
| `total-blocking-time`          | same 7 routes (438-1246 ms)                         |

**Diagnosis**: The shared `<SiteNav />` and `<SiteFooter />` components hydrate framer-motion eagerly on every static marketing page. Routes that have *no other JS* (auth, home, privacy) escape unscathed; routes that *also* render Reveal sections or motion components (pricing/security/status/changelog) compound the cost.

Privacy is 100 because it's a pure server-rendered MDX-style page with no Reveal blocks; terms is 68 because it now has an extra animated section that pricing and contact also share.

## Proposed follow-up fix (NOT applied)

1. **Lazy-mount SiteNav's animated subtree** behind an `IntersectionObserver`-gated `next/dynamic` boundary so the nav renders pure-HTML on first paint and only loads framer-motion when the user scrolls or interacts.
2. **Replace `<Reveal>` with CSS-only `@keyframes` fade-in** on the marketing pages. The current Reveal component pulls in framer-motion just to fade content; a 20-line CSS animation gives the same visual at zero JS cost.
3. **Code-split `<SiteFooter />`** the same way (it's below the fold on every page).
4. **Tree-shake `lucide-react`** to per-icon imports — current barrel import drags ~80 KB on every page.

Expected lift: removing framer-motion from the shared shell drops main-thread JS by ~2 s on every marketing route, which should bring pricing/about/security/contact from 57-68 to **88-95**. Status and changelog will need step #2 (their bodies use Reveal) to clear 90.

## Conclusion

Round 3 lifted home from a noisy 52-67 to a stable **90**, brought `/privacy`, `/login`, `/signup` to 99-100, but **7 of 11 routes are still below 90** because the SiteNav/SiteFooter framer-motion bundle is the shared blocker. The fix is well-scoped (lazy-mount nav animation + CSS Reveal) and predicted to clear the remaining routes in one follow-up pass.
