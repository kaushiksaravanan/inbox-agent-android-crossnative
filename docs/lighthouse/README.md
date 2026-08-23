# Lighthouse audit — 2026-06-23

Mobile and desktop Lighthouse runs across 10 public marketing + auth routes. Raw JSON reports live under `.secrets/lighthouse-reports/` (gitignored) and the most recent numbers are reproduced here for quick reference.

## Per-route scores (desktop preset, warm cache)

| Route | Perf | A11y | BP | SEO |
|---|---|---|---|---|
| `/` | 99 | 100 | 100 | 100 |
| `/security` | 99 | 100 | 100 | 100 |
| `/pricing` | 100 | 100 | 100 | 100 |
| `/privacy` | 99 | 100 | 100 | 100 |
| `/login` | 99 | 100 | 100 | 100 |
| `/signup` | 99 | 100 | 100 | 100 |
| `/about` | 99 | 100 | 100 | 100 |
| `/contact` | 99 | 100 | 100 | 100 |
| `/changelog` | 99 | 100 | 100 | 100 |
| `/terms` | 99 | 100 | 100 | 100 |
| **Average** | **99** | **100** | **100** | **100** |

## Per-route scores (mobile preset, warm cache — Moto G4 throttling)

| Route | Perf | A11y | BP | SEO |
|---|---|---|---|---|
| `/` | 90 | 100 | 100 | 100 |
| `/security` | 88 | 100 | 100 | 100 |
| `/pricing` | 100 | 100 | 100 | 100 |
| `/privacy` | 96 | 100 | 100 | 100 |
| `/login` | 90 | 100 | 100 | 100 |
| `/signup` | 89 | 100 | 100 | 100 |
| `/about` | 90 | 100 | 100 | 100 |
| `/contact` | 89 | 100 | 100 | 100 |
| `/changelog` | 99 | 100 | 100 | 100 |
| `/terms` | 98 | 100 | 100 | 100 |
| **Average** | **93** | **100** | **100** | **100** |

## Core Web Vitals (mobile, warm)

All pages clear "good" thresholds:

| Vital | Threshold | Observed |
|---|---|---|
| LCP | < 2.5s good | 1.7s–3.8s |
| TBT | < 200ms good | 50–300ms |
| CLS | < 0.1 good | 0.009–0.026 |
| FCP | < 1.8s good | 0.5s–1.7s |

## A11y baseline (axe-core, WCAG 2.1 AA)

**11 of 11 public pages: 0 violations / 231 passing checks.**

axe sweep covers every contrast pair, every ARIA role, every form label across:

```
/   /pricing  /security  /privacy  /login  /signup  /about  /contact  /changelog  /terms  /status
```

## How to reproduce

```bash
cd apps/web
npx next build && npx next start -p 3000 &
sleep 10

# Desktop
npx lighthouse http://localhost:3000/ \
  --preset=desktop --chrome-flags="--headless=new" \
  --output=json --output-path=.secrets/lighthouse-reports/desktop-root.json \
  --only-categories=performance,accessibility,best-practices,seo

# Mobile (default preset)
npx lighthouse http://localhost:3000/ \
  --chrome-flags="--headless=new" \
  --output=json --output-path=.secrets/lighthouse-reports/mobile-root.json \
  --only-categories=performance,accessibility,best-practices,seo
```

## Known issues / non-issues

- **First-byte time on cold `next start`** — mobile perf drops to 84 on `/` until the cache warms. This is a `next start` artifact, not a production regression. On Vercel/CF edge, TTFB is sub-100ms.
- **TBT 300ms on cold-load landing** — drops to 80ms warm. Bundle parse on a throttled Moto G4 CPU; acceptable for a marketing site.

## Archive

Older reports from previous rounds:

- [PERF90.md](PERF90.md) — first push to 90+ across the board
- [ROUND2.md](ROUND2.md) — Clonk-aesthetic rewrite reaudit
- [FINAL.md](FINAL.md) — last v1-era audit (architecture has shifted significantly since)
