# Changelog

All notable changes to Inbox Agent. The user-facing version of this lives at [`/changelog`](apps/web/src/app/changelog/page.tsx); this file is the contributor-facing version (links to internal files, mentions infra changes, etc.).

Format roughly follows [Keep a Changelog](https://keepachangelog.com/). The architecture has shifted significantly between major versions — entries describe what changed, not how to migrate.

## [v0.4.1] — 2026-06-24 — Self-protective infrastructure

**Theme:** durable defenses against doc drift, schema drift, and design-rule violations.

- **236 unit assertions** across 13 test scripts, all wired into `pnpm test`.
- **22 integration assertions** (OG card pixel regression + `/api/health` shape contract), gated by `pnpm test:integration`.
- **6 cross-doc consistency checks:**
  - `scripts/check-spec-consistency.ts` — SPEC.md routes/files/tables match codebase
  - `scripts/test-check-spec-consistency.ts` — meta-tests the SPEC checker
  - `scripts/check-readme-consistency.ts` — README claims match codebase + per-app scripts/README.md files in sync
  - `scripts/check-contributing-rules.ts` — 7 design constraints structurally enforced (incl. server-never-touches-Gmail, Task.derivedFrom required, no client_secret in browser, gmail.readonly only)
  - `scripts/check-changelog-consistency.ts` — CHANGELOG.md and /changelog list the same versions
  - `scripts/run-integration-tests.ts` — boots server, runs integration tests, kills cleanly
- **Pre-push hook** at `.githooks/pre-push` running lint + typecheck + tests + integration. `SKIP_INTEGRATION=1` and `FULL=1` escape hatches.
- **Turbo cache fingerprints** tuned per task. `pnpm test` warm runs hit FULL TURBO at ~500ms.
- **All docs reconciled** with current architecture. 8 root markdown files, 8 per-provider docs (banner-flagged where stale), 4 script directories with their own READMEs.
- **Lighthouse desktop avg 99/100/100/100**, mobile (warm) avg 93/100/100/100, **axe-core 0 violations / 231 checks** across 11 public pages.
- **Tooling fixes:** ESLint v8 + Next 14 compatibility restored; `.nvmrc` pinned to Node 22; `.gitignore` hardened with `*.tsbuildinfo`, `.vscode`, `.idea`, secrets patterns; env files in lockstep across web + mobile + their examples.

## [v0.4] — 2026-06-24 — Local-first

**Theme:** the server stops touching email entirely.

- Email reading moved from server to client. Gmail polling now happens in the browser/RN; our server is never on the path.
- Server-side OAuth flow retired in favor of browser PKCE. `/api/oauth/start` and `/api/oauth/callback` deleted (RFC 7636).
- BYOK keys now live in IndexedDB encrypted with a non-extractable Web Crypto AES-GCM install key. `/api/byok` deleted.
- Mobile parity: same on-device pipeline via `expo-sqlite` + `expo-secure-store`. See `apps/mobile/src/lib/`.
- Background polling on Android via `expo-task-manager` + `expo-background-fetch` (~15-min OS-scheduled wake).
- Layered extractor pipeline (`packages/shared/src/extractor-l3.ts`):
  - L1: sender catalog (35+ rules, ~70% coverage)
  - L2: generic regex fallback (~15%)
  - L3: heuristic span tagger today, GLiNER drop-in slot ready
- Tables dropped: `email_accounts`, `emails`, `user_api_keys`, `followups`, `style_profiles`, `response_drafts`. The `tasks` server table is kept but now holds only share-link metadata, never task content.
- Edge functions touching email deleted: `sync-email`, `extract-tasks`, `send-alarms`, `send-followups`, `draft-response`, `learn-style`, `seed-style-profile`, `oauth-callback`. Only `pair-device` remains.
- Inbox dashboard tab renamed to History (we don't store mail; we show the audit trail).
- Quality bars locked in: 103 unit tests (`pnpm test`), Lighthouse desktop avg 99/100/100/100, mobile (warm) avg 93/100/100/100, axe-core WCAG 2.1 AA 0 violations across 11 pages.

**Supersedes** v0.3's 90-second body purge: bodies never reach the server in the first place now, so there's nothing to purge.

## [v0.3] — 2026-06-22 — Ephemeral bodies *(superseded by v0.4)*

- Email bodies purged within 90 seconds of task extraction.
- Retention picker removed from Settings.

> ⚠ **Superseded:** as of v0.4, email bodies never leave the device. There is no server-side body to purge.

## [v0.2] — 2026-06-21 — Read-only mode

- Removed reply drafts and style learning.
- OAuth scopes downgraded to `gmail.readonly` / `gmail.metadata` / `Mail.Read`.
- Drafts dashboard and send/draft APIs removed.

## [v0.1.1] — 2026-06-21 — Bring your own key

- BYOK for Gemini, OpenAI, Anthropic, Groq.
- Android home-screen widget shows the next two tasks.
- Sync indicator pulses while reading mail.

## [v0.1] — 2026-06-21 — Initial public beta

- Gmail and Outlook via OAuth (no IMAP).
- Web dashboard + Android pairing flow.
- Six-digit pairing codes, single-use, 5-minute expiry.

---

For the user-facing version (marketing copy, hand-written prose), see [`/changelog`](https://inbox.agent/changelog) on the live site.
