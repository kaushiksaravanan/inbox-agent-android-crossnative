# Final Lighthouse — Clonk Theme Applied

**Build ID:** `4OUkChJ3JKdTme2-MtDi6` (initial: `HsqlUMS2hLycXZ6K8WJnJ`)
**Date:** 2026-06-22
**Throttle profile:** mobile, simulated 3G, 4x CPU slowdown (Lighthouse default)

## Per-route scores (Performance only)

| Route | Round 2 (before) | Final (after clonk) | Δ |
|---|---:|---:|---:|
| /          | 90  | 72  | **-18** |
| /pricing   | 58  | 87  | **+29** |
| /privacy   | 100 | 84  | **-16** |
| /terms     | 68  | 62  | -6      |
| /about     | 68  | err* | n/a    |
| /security  | 63  | 27  | **-36** |
| /status    | 76  | err* | n/a    |
| /contact   | 57  | 77  | **+20** |
| /changelog | 77  | 79  | +2      |
| /login     | 99  | err* | n/a    |
| /signup    | 100 | err* | n/a    |

`*err` = Lighthouse infra failure during final pass (PROTOCOL_TIMEOUT / CHROME_INTERSTITIAL_ERROR / NO_FCP), not a real page failure. All 11 routes return HTTP 200.

## Aggregate (final pass, 7 valid runs)

| Metric | Avg |
|---|---:|
| Performance       | 69.7 |
| Accessibility     | 94.9 |
| Best Practices    | 98.3 |
| SEO               | 98.9 |
| Routes ≥ 90 perf  | **0 / 7** |

## Honest read

The clonk redesign **regressed performance** on most routes — splash loader, additional CSS variables, larger hero with image and gradients, and the home page in particular shifted from 90 → 72. Pricing and contact got faster (likely from layout simplification), but security and terms got slower because both grew long-form content with the new typography.

**Routes still below 90 perf (mobile):** home (72), pricing (87), privacy (84), terms (62), security (27), contact (77), changelog (79). All 7 valid runs are below 90.

The four "errored" routes (about, status, login, signup) need a clean rerun — server/Chrome went unstable during the long sweep and the `.next/BUILD_ID` got wiped twice mid-run, forcing rebuilds. Their round-2 numbers (68, 76, 99, 100) suggest they're not the bottleneck once re-measured.

## What likely caused the perf drop

1. Splash loader (`SplashLoader` in root layout) adds hydration cost; defers FCP/LCP.
2. Heavier hero CSS (multiple radial gradients, `bg-[var(--lime)]`, blur backdrops) increases paint work.
3. Embedded SVG-flame icons inline instead of an SVG sprite.
4. Some routes pulled in a second client chunk (`75504863-*.js`) that wasn't on round 2.

## Aesthetic — screenshots

| Shot | Size |
|---|---:|
| `docs/ship/clonk-final-hero.png`    | 162 KB |
| `docs/ship/clonk-final-pricing.png` |  47 KB |
| `docs/ship/clonk-final-login.png`   |  48 KB |
| `docs/ship/clonk-final-android.png` | 249 KB |

Aesthetic shipped (paper + lime + accent palette, display tracking-[-0.03em], flame icon, soft shadows, accent ring). Performance regressed.

## Verdict

**Still below 90 across the board.** The clonk theme is on; perf budget is not. Need a follow-up pass to: defer splash loader, inline-critical-CSS the hero gradient, lazy-mount below-the-fold sections, and drop unused client chunks on auth pages.
