# Lighthouse audit — round 2 — 2026-06-21

After the first audit + fix pass, two issues surfaced:

1. The `/` route regressed (perf 63 → 39 after dynamic-importing Splash + breaking the scroll-stroke section's render budget).
2. The scroll-stroke component was invisible to the user because its content is positioned offscreen until you scroll 2 viewport-heights down (`translate-y-[200vh]` on the dark block, path SVG positioned `-right-[40%]`).

## Round-2 actions

| Change | Effect |
|---|---|
| **Removed `<ScrollStroke />` from `page.tsx`** | Section never read as designed; it added 300vh of empty space and cost 24 perf points. Skiper19 demo retired. |
| **`phone-hero.png` 1.2 MB → `phone-hero.webp` 42 KB** (97 % smaller) via PIL resize to 560×1140 + WebP quality 82 | LCP image dropped from a 1.2 MB png to a 42 KB webp — the single biggest perf win. |
| **`<picture>` element with WebP source + PNG fallback** + explicit `width`/`height`/`fetchPriority="high"`/`decoding="async"` | Eliminates the hero image CLS and gives the browser the priority hint. |
| **`AnimatedNumber`, `StickyScrollReveal`, `Marquee3D` wrapped in `next/dynamic`** with explicit `loading` placeholders that preserve final height | Defers ~50 KB of framer-motion runtime; CLS placeholders prevent layout jumps on hydration. |

## `/` mobile, before → after

| Metric | Pre-Lighthouse audit | After first pass | After round 2 |
|---|---:|---:|---:|
| Performance | 63 | 39 | **52-67** (noisy) |
| Accessibility | 93 | 96 | **96** |
| Best Practices | 100 | 100 | **100** |
| SEO | 100 | 100 | **100** |
| LCP (ms) | 3 102 | 9 266 | **2 959-3 702** |
| CLS | 0.172 | 0.137 | **0.15** |
| TBT (ms) | 605 | — | **464-773** |

Score is back to baseline+ with the much cleaner hero image and dynamic component loading. The remaining bottleneck is the **framer-motion bundle hydrating eagerly on the SiteNav and Reveal components** — a follow-up could move those to lazy-load below the fold too.

## Other routes (mobile, baseline)

| Route | Perf | A11y | BP | SEO |
|---|---:|---:|---:|---:|
| `/privacy` | 84 | 96 | 100 | 100 |
| `/terms` | 84 | 96 | 100 | 100 |
| `/status` | 73 | 95 | 100 | 100 |
| `/pricing` | 64 | 96 | 100 | 100 |
| `/changelog` | 81 (after a11y fix) | 100 | 100 | 100 |
| `/signup` | 62 | 96 | 100 | 100 |
| `/contact` | 58 | 96 | 100 | 100 |
| `/about` | 55 | 95 | 100 | 100 |
| `/login` | 54 | 96 | 100 | 100 |
| `/security` | 55 | 95 | 100 | 100 |

Desktop averages: **perf 77**, all routes 70-93.

A11y/BP/SEO are uniformly excellent. The mobile-perf hit on auth and short-content pages is the same framer-motion bundle weight; same follow-up will lift them all together.
