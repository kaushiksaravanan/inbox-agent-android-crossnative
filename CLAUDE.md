# CLAUDE.md — orientation for AI sessions in this repo

A project-local note for future AI sessions (and yourself, in a month) on how to land oriented quickly in this codebase.

## Read these in order

1. [README.md](README.md) — what the product is and how to run it
2. [SPEC.md](SPEC.md) — the locked architecture (~2600 words)
3. [CONTRIBUTING.md](CONTRIBUTING.md) — 6 non-negotiable design constraints
4. [ROADMAP.md](ROADMAP.md) — what's planned, what's ruled out, why
5. [CHANGELOG.md](CHANGELOG.md) — version history at the developer level

## Verify before touching anything

Run these four commands. If any fails, stop and investigate before adding new code:

```bash
pnpm verify      # one-liner: runs all four below in order
pnpm lint        # 4 packages, web is the only one with real ESLint
pnpm typecheck   # all 4 packages
pnpm test        # 246 unit/consistency assertions
pnpm build       # production Next.js build of the web app
```

For the full integration suite (boots a server, runs OG card pixel regression + /api/health contract test):

```bash
pnpm test:integration
```

For fast iteration on a single test script (re-runs on file save):

```bash
pnpm test:watch <substring>   # e.g. pnpm test:watch l3
pnpm test:watch               # interactive picker
```

This is what the pre-push hook runs. Bypass once: `SKIP_INTEGRATION=1 git push`.

## The architecture in one paragraph

Inbox Agent is **local-first**. The browser (and the Android app) does Gmail OAuth via PKCE, polls Gmail directly, runs a layered task extractor on-device, and stores everything in IndexedDB / expo-sqlite. The server is a thin Next.js host (6 API routes) plus a single Supabase edge function (`pair-device`). The server **never sees a user's email content, OAuth tokens, or extracted tasks** — by deliberate design, not accident.

## The architectural invariants

If you find yourself wanting to do any of these, stop:

- Add a server-side endpoint that reads, stores, or proxies email content
- Add a server-side cron job over user-content tables (we dropped pg_cron for a reason)
- Store an OAuth token in any of our tables
- Drop the `Task.derivedFrom` provenance field
- Embed `client_secret` in any client bundle
- Catch an error and swallow it without a comment explaining why

The CONTRIBUTING rule audit (`scripts/check-contributing-rules.ts`) enforces these structurally — if you violate one, `pnpm test` fails.

## How drift is prevented

Doc-vs-code drift is the #1 failure mode of this project. Three checks defend against it:

1. **`scripts/check-spec-consistency.ts`** — verifies SPEC.md's claims about routes, files, dropped tables, and alive tables. The dropped ones must stay dropped; the alive ones must exist.
2. **`scripts/check-readme-consistency.ts`** — verifies README's test-suite total equals the sum of its rows, every test script it references exists, every monorepo directory it claims exists, every pnpm command it mentions is in package.json.
3. **`scripts/check-contributing-rules.ts`** — each of the 6 non-negotiable design constraints in CONTRIBUTING.md is verified by grep/parse against the actual codebase.

Plus `scripts/test-check-spec-consistency.ts` meta-tests the SPEC checker itself against deliberately-broken fixtures, so if the checker silently breaks, this catches it.

## Where things live

```
inbox-agent/
├── apps/
│   ├── web/                       Next.js 14 (Pages Router off, App Router on)
│   │   ├── src/app/api/           6 API routes — see SPEC.md for the contract
│   │   ├── src/app/(dashboard)/   auth-gated routes
│   │   ├── src/app/(auth)/        login/signup/forgot-password
│   │   └── src/lib/               gmail-oauth, gmail-client, extractor, local-db, local-crypto, local-byok, poll-gmail
│   └── mobile/                    Expo / RN 0.76 / expo-router
│       └── src/lib/               mirror of web/src/lib — kept in parity
├── packages/
│   ├── shared/                    types, schemas, sender catalog, L3 extractor slot
│   └── ui/                        shared web React components
├── supabase/
│   ├── migrations/                Postgres schema (auth + pairing relay only)
│   └── functions/pair-device/     the only email-content-adjacent edge function
├── scripts/                       cross-package consistency checkers
├── docs/                          setup guides + audit history
└── .githooks/pre-push             gates push on lint+typecheck+test+integration
```

## When you need to add a new feature

1. Check whether [ROADMAP.md](ROADMAP.md) "Ruled out" mentions it. If yes, don't.
2. Check whether [CONTRIBUTING.md](CONTRIBUTING.md) non-negotiables conflict. If yes, don't.
3. Add an entry to [ROADMAP.md](ROADMAP.md) "In flight" or "Next up" so the work is tracked.
4. Write code. The `pnpm test` consistency checks will catch you if you drift docs from code.
5. Update SPEC.md if you're touching the architecture; update README.md if you're touching what the product does or how to run it.
6. Run `pnpm test` and `pnpm test:integration` before pushing.

## When you find a doc lie

This happens. The repo has a history of doc drift; the consistency scripts are how we prevent it from getting worse. If you find a stale claim:

- If the claim is in source files: fix the source to match reality, OR fix the doc to match the source. Don't add a "TODO" — fix it.
- If the doc describes an architecture that is no longer current (v1-era stuff): add a `> ⚠ **Staleness notice**` banner at the top and explicitly mark which sections are historical. See `docs/user-stories/CANONICAL.md` for an example.
- If you can't tell which side is right, ask before guessing.

## Useful one-liners

```bash
# Boot the dev server (web only, port 3000)
pnpm --filter @inbox/web dev

# Boot the mobile app (Expo Go on Android)
pnpm --filter @inbox/mobile dev

# Fresh production build of the web app
cd apps/web && rm -rf .next && npx next build && npx next start -p 3000

# Run a single test script directly (faster than full pnpm test for debug)
cd apps/web && npx tsx scripts/test-l3.ts

# Activate the pre-push hook (once, after git init)
git config core.hooksPath .githooks

# Lighthouse on a route (requires server running on :3000)
npx lighthouse http://localhost:3000/ --preset=desktop --quiet \
  --chrome-flags="--headless=new" --only-categories=performance,accessibility,best-practices,seo
```
