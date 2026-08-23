# inbox-agent

A local-first email agent. Reads your inbox **on your phone or in your browser**, extracts action items as named tasks ("Cancel Netflix before midnight" — not "1 new message"), and rings your phone when something is due. Email content never reaches our server.

## What it does

- Connects to Gmail via OAuth (PKCE in the browser; signature-bound on Android).
- Polls Gmail directly **from your device**. Our server never sees your mail.
- Runs a layered extractor locally: sender catalog (35+ rules) → generic regex → heuristic span tagger. Every task is explainable — tap "Why?" and you see the rule that fired and the matched line.
- Stores tasks in IndexedDB (web) or expo-sqlite (mobile). Tokens live in the browser's encrypted IndexedDB or the phone's keychain.
- Rings your phone as a notification with the action verb when a task comes due.
- Pairs web and mobile via a 6-digit code (5-min TTL) so both devices share the same task list.

What it does **not** do: send email, draft replies, mirror inboxes, route email content through any LLM by default, or store anything user-identifying on our server.

## Architecture

```
                          ┌─────────────────────────┐
   Gmail API ◄────────────┤    Your device only     │
   (over PKCE)            │  (browser + Android)    │
                          │                         │
                          │  - Local OAuth          │
                          │  - Local polling        │
                          │  - Local extraction     │
                          │  - Local storage        │
                          └────┬────────────────────┘
                               │
                               │ tiny pairing relay
                               │ (encrypted blobs)
                               ▼
                       Our server (≈9 routes)
                       - /api/health
                       - /api/contact
                       - /api/subscribe
                       - /api/pair-device
                       - /api/settings (display prefs)
                       - /api/tasks/[id] (share-link metadata)
```

The server holds: a hashed user ID, a 6-digit pairing code (5 min TTL), a license purchase record. Nothing else.

See [`SPEC.md`](SPEC.md) for the full architecture and [`apps/web/src/app/security/page.tsx`](apps/web/src/app/security/page.tsx) for the user-facing trust model.

## Monorepo layout

```
inbox-agent/
├── apps/
│   ├── web/                       Next.js 14 dashboard + marketing
│   └── mobile/                    Expo / React Native Android app
├── packages/
│   ├── shared/                    Shared types, Zod schemas, sender catalog, L3 extractor
│   └── ui/                        Shared React components (web-only)
├── supabase/
│   ├── migrations/                Postgres schema (auth + pairing-relay only)
│   └── functions/pair-device/     The only email-touching edge function
├── docs/
│   ├── gcp-setup/                 OAuth + Play Integrity setup
│   ├── lighthouse/                Perf budgets
│   └── local-llm/                 The hybrid extractor plan
├── scripts/
│   └── check-spec-consistency.ts  Catches SPEC.md ↔ codebase drift
├── SPEC.md
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

## Prerequisites

- **Node.js 20 LTS or newer** (22 recommended — pinned in `.nvmrc`)
- **pnpm 9.12+** — `npm install -g pnpm`
- **Expo Go** on an Android phone (for the mobile app)
- **Supabase CLI** — only if you want the local relay running; otherwise skip

Docker is **not** required for normal dev work — the app runs against Supabase Cloud or a hosted instance. Docker is only needed if you want a local Supabase stack.

## Environment variables

Copy the example env file to a real env file in each app:

- Web: `cp apps/web/.env.local.example apps/web/.env.local`
- Mobile: `cp apps/mobile/.env.example apps/mobile/.env`

### Web (`apps/web/.env.local`)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL (for auth + pair-device only — no user data) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Service-role key — server-side only, never ships to client |
| `NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID` | yes | Google OAuth client_id (Web type, PKCE). No client_secret needed in the browser. |
| `CIPHERSTACK_TOKEN` | optional | Used by BYOK fallback if you want rotating provider keys |

### Mobile (`apps/mobile/.env`)

| Variable | Required | Description |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | yes | Same Supabase URL (relay-only) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | yes | Anon key |
| `GOOGLE_ANDROID_CLIENT_ID` | yes | Google OAuth client_id (Android type, signature-bound to APK) |

See [`docs/gcp-setup/OAUTH-VERIFICATION-CHECKLIST.md`](docs/gcp-setup/OAUTH-VERIFICATION-CHECKLIST.md) for how to set up the two OAuth clients.

## Dev quickstart

```bash
pnpm install
pnpm dev          # runs web + mobile in parallel via Turbo
```

Or per-app:

```bash
# Web on http://localhost:3000
pnpm --filter @inbox/web dev

# Mobile — scan the QR with Expo Go (or press a for an Android emulator)
pnpm --filter @inbox/mobile dev
```

When testing the mobile app against a local web server, use your machine's LAN IP (e.g. `http://192.168.1.42:3000`) in the mobile env, not `127.0.0.1` or `localhost`.

## Other useful scripts

```bash
pnpm verify      # one-liner: lint + typecheck + test + build (the full quality bar)
pnpm build       # build every package + app
pnpm lint        # lint everything
pnpm typecheck   # tsc --noEmit across the workspace
pnpm test        # run all test suites + SPEC.md consistency check (Turbo-cached)
```

`pnpm test` runs:

| Suite | What it covers |
|---|---|
| L3 extractor (web) | 17 assertions — pipeline layers, span shape, confidence |
| L3 extractor (mobile parity) | 12 — same pipeline through mobile's ID generator |
| Background-poll formatter | 8 — Settings UI status string per BackgroundFetchStatus |
| Mobile local-db shape | 15 — mobile expo-sqlite wrapper exports the expected surface (RN-only logic, parse-tested) |
| Mobile module shape | 27 — every other mobile lib module exports the functions consumers import |
| `@inbox/shared` barrel | 42 — every export present + every deleted export absent + value-export shape |
| Rate limiter | 16 — in-memory per-IP per-bucket counter with window expiry |
| SPEC.md consistency | 33 — every claim in SPEC.md verified against real codebase (dropped tables stay dropped, alive tables exist, mobile files exist, routes exist, edge functions list matches, numeric constants match SPEC text) |
| spec-checker meta-test | 6 — the consistency checker itself is tested against deliberately-broken SPEC fixtures |
| OG card pixel regression | 11 — brand colors at expected coords on /opengraph-image + /twitter-image (skips cleanly when no server is reachable) |
| README consistency | 40 — every README claim verified against codebase (the doc you are reading right now is tested); also asserts each scripts/README.md is in sync, CONTRIBUTING.md test count matches, "9 API routes" claim matches the filesystem, and no source file links to a missing /downloads/* asset |
| CONTRIBUTING rule audit | 9 — every non-negotiable rule in CONTRIBUTING.md is structurally enforced (incl. Gmail scope stays read-only) |
| Changelog consistency | 16 — CHANGELOG.md and /changelog page list the same versions; APP_VERSION matches the latest CHANGELOG entry |
| /api/health contract | 11 — /status reads /api/health; this asserts the shape /status depends on |

Total: 263 tests, all required to pass.

## Test workflow

```bash
pnpm test                  # full suite (Turbo-cached, ~500ms when warm)
pnpm test:integration      # spins up next start, runs OG card + health contract tests, kills server
pnpm test:watch <name>     # watch one script: pnpm test:watch l3 or pnpm test:watch barrel
pnpm test:watch            # interactive picker (lists all test scripts)
```

`pnpm test:watch` uses `tsx --watch` so a single script reruns on every file save — fast iteration on a single test without running the whole suite.

## Integration tests

The OG card pixel regression test needs a live server. `pnpm test` skips it when nothing is listening on port 3000. To run the full integration suite (server boots automatically, test runs, server is killed):

```bash
pnpm test:integration
```

The pre-push hook runs this automatically. Use `SKIP_INTEGRATION=1 git push` to skip it for WIP branches.

## Git hooks (pre-push enforcement)

A `pre-push` hook lives in `.githooks/`. It runs `pnpm typecheck` + `pnpm test` before allowing any push, so broken code can't leave your machine.

To enable it (one-time, after `git init`):

```bash
git config core.hooksPath .githooks
```

To bypass it once (e.g. work-in-progress branch):

```bash
git push --no-verify
```

## How pairing works (user-facing)

1. Sign in to the web app and connect Gmail.
2. Open **Devices → Pair a phone**. The dashboard mints a 6-digit code (5-min TTL, single-use).
3. Install the mobile app, tap **Pair**, and type the code.
4. The two devices exchange public keys and can now sync small encrypted blobs through our relay — we never see the plaintext.
5. Revoke a device any time on **Devices**. The pairing token is invalidated immediately.

## Security model (short version)

- **Server attack surface is minimal.** 9 API routes, 1 edge function, 0 user-data tables for email content. See [`/security`](apps/web/src/app/security/page.tsx) for the full disclosure.
- **OAuth tokens never reach the server.** Web stores them encrypted in IndexedDB with a non-extractable Web Crypto AES-GCM key. Mobile stores them in Android Keystore via `expo-secure-store`.
- **PKCE replaces the client_secret.** The Web Application OAuth client's `client_secret` exists in Google Cloud Console for completeness but is never used by the browser flow.
- **Android tokens are signature-bound.** Google rejects token requests from APKs signed with a different key than the one we registered. Re-signed cracked APKs are denied at Google's end.
- **Service-role key is server-only.** It never ships to a client bundle. It is used inside Next.js API routes only.
- **`.env*` is gitignored, plus `.secrets/`, `client_secret*.json`, `*-credentials.json`, and `google-services.json`.**

## Pricing

One-time $49 license. 30-day refund, no questions. No subscription, no upsell, no usage cap on emails-per-day. Self-hosted edition is on the roadmap — see [ROADMAP.md](ROADMAP.md).

## License

Source-available, not open-source. See [`LICENSE`](LICENSE) for the full terms.
