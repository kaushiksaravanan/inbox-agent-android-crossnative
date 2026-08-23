# Local-First Migration — Deletion Inventory

Plan document. **Nothing is deleted yet** — this is a forward-looking checklist for the next sprint. Each item is verified to exist in the current tree as of 2026-06-23.

Conventions:
- `[ ]` = pending action (delete / drop / move / create)
- "Delete-blocked-by" = work that must ship before the file can be removed safely
- Paths are repo-relative from `C:/Users/I587436/inbox-agent/`

---

## 1. Edge functions to delete

These Supabase edge functions move client-side. Delete the directory **only after** the corresponding client module (see §5) is shipped and the old function has been unreferenced for one release.

- [ ] `supabase/functions/sync-email/`
  - Role today: pulls Gmail messages server-side using stored OAuth tokens.
  - Replaced by: `apps/web/src/lib/gmail-client.ts` + `apps/mobile/src/lib/gmail-client.ts` (browser/device calls Gmail directly).
  - Delete-blocked-by: §5 gmail-client modules; client-side OAuth token storage; mobile background sync.

- [ ] `supabase/functions/extract-tasks/`
  - Role today: server-side LLM extraction (calls hosted model, consumes BYOK).
  - Replaced by: on-device LLM via `apps/web/src/lib/local-llm.ts` (WebLLM) and `apps/mobile/src/lib/local-llm.ts` (MLC).
  - Delete-blocked-by: §5 local-llm modules; prompt parity checks; perf budget on mid-tier devices.

- [ ] `supabase/functions/oauth-callback/`
  - Role today: completes Google OAuth code → token exchange on the server.
  - Replaced by: browser-side token exchange — the SPA handles the redirect, exchanges the code, and stores tokens locally.
  - Delete-blocked-by: client-side OAuth flow shipped (see §3 routes); migration path for existing users whose refresh tokens currently live server-side.

- [ ] `supabase/functions/send-alarms/`
  - Role today: cron-driven push notifications for due tasks.
  - Replaced by: `expo-notifications` local scheduling on mobile + `Notification` API / service worker on web.
  - Delete-blocked-by: local scheduler in mobile app; web notification opt-in flow; backfill of existing scheduled alarms onto each device.

- [ ] (also drop the corresponding cron entries) `supabase/migrations/20260621000002_cron_jobs.sql` — needs a follow-up migration to unschedule `send-alarms` and any `sync-email` schedules.

Keep for now:
- `supabase/functions/_shared/` — review at the end; some helpers may be re-used by `pair-device`.
- `supabase/functions/pair-device/` — still needed (server is the only entity that can hand devices a sync-relay handshake).

---

## 2. Tables to drop (future migration)

Write a new migration `supabase/migrations/<date>_local_first_cleanup.sql` that drops these in order. **Do not** squash with the existing migrations — keep the history honest.

- [ ] `emails`
  - Defined in: `supabase/migrations/20260621000001_initial_schema.sql` (line 31).
  - Already ephemeral (see `20260622000001_ephemeral_bodies.sql`); local-first removes server-side email storage entirely.
  - Drop-blocked-by: confirming no edge function or RPC still selects from it; backup of any in-flight rows for users mid-onboarding.

- [ ] `user_api_keys`
  - Defined in: `supabase/migrations/20260621000004_byok.sql` (line 7).
  - BYOK becomes a local-only setting; key never leaves the device.
  - Drop-blocked-by: client-side key vault on web (IndexedDB, AES-GCM under a passphrase) and mobile (secure store); export tool so existing BYOK users can copy their key down before the table is dropped.

- [ ] `email_accounts`
  - Defined in: `supabase/migrations/20260621000001_initial_schema.sql` (line 14).
  - Account info lives on device. Server only knows "this user has a device" (already covered by `devices` + `pairing_codes`).
  - Drop-blocked-by: client-side account list shipped; one-shot migration that pushes `email_accounts` rows down to each paired device on first launch post-upgrade.

Keep:
- `tasks` — still server-replicated, but **content is E2E-encrypted** by sync-relay (see §5). Schema change later: collapse most columns into a single `ciphertext` blob + minimal metadata.
- `devices`, `pairing_codes` — required by the new sync-relay handshake.
- `response_drafts`, `style_profiles`, `followups` — re-evaluate per-feature; out of scope for this inventory.
- `user_settings` (from `20260621000004_byok.sql`) — keep, but prune BYOK-specific columns when `user_api_keys` is dropped.

---

## 3. Web routes that become unnecessary

All four exist as `route.ts` files today. They move client-side; the routes themselves get deleted.

- [ ] `apps/web/src/app/api/oauth/start/route.ts` — replaced by client-side `window.location = <google authorize url>` built in `gmail-client.ts`.
- [ ] `apps/web/src/app/api/oauth/callback/route.ts` — replaced by a client-only page that reads the `?code=` param and exchanges in-browser.
- [ ] `apps/web/src/app/api/sync/route.ts` — replaced by direct Gmail polling from the client (`gmail-client.ts`) plus the sync-relay for cross-device.
- [ ] `apps/web/src/app/api/byok/route.ts` — replaced by local key storage; settings page writes to `local-db.ts`, never POSTs the key.

Delete-blocked-by: each route's replacement (§5) shipped behind a flag; one release cycle of dual-write/dual-read to catch regressions.

Likely-also-affected (audit before deleting):
- `apps/web/src/lib/oauth/providers.ts`, `apps/web/src/lib/oauth/state.ts` — currently feed the server-side OAuth routes. Either move to the client or delete with the routes.

Keep:
- `apps/web/src/app/api/pair-device/*` — still needed (talks to `supabase/functions/pair-device`).
- `apps/web/src/app/api/contact`, `health`, `subscribe`, `settings`, `accounts`, `tasks` — re-audit per route in a follow-up; out of scope here.

---

## 4. Dashboard pages — role changes

All four exist under `apps/web/src/app/(dashboard)/`. None get deleted, but their data source flips from Supabase RPC to local IndexedDB.

- [ ] `(dashboard)/accounts` — **kept, rewritten.** Renders from local IndexedDB (`local-db.ts`), not from `email_accounts` over the network. Add a "no devices paired yet" empty state.
- [ ] `(dashboard)/tasks` — **kept, rewritten.** Renders from local IndexedDB. Realtime updates come from `sync-relay.ts` push events instead of Supabase realtime subscriptions.
- [ ] `(dashboard)/inbox` — **conditional.** Keep only if we want a viewer of summarised messages. The local DB stores summaries (not full bodies) per the spec. If we keep it, source becomes `local-db.ts`; if not, delete the route.
- [ ] `(dashboard)/settings` — **kept.** Still needed for refund flow, license management, opt-in BYOK toggle. BYOK toggle writes to local key vault, not to `user_api_keys`.

Also under dashboard today (audit but not in scope for this inventory): `(dashboard)/devices`, `(dashboard)/dashboard`, `(dashboard)/layout.tsx`.

---

## 5. New code needed

None of these exist yet. Create as part of the local-first sprint **before** deleting anything from §1–§3.

Web (`apps/web/src/lib/`):
- [ ] `gmail-client.ts` — browser Gmail API caller. Handles OAuth redirect flow, token refresh, message list/get/modify. Replaces `api/oauth/*` and `api/sync` server routes.
- [ ] `local-llm.ts` — WebLLM wrapper. Loads a quantised model into the browser, exposes `extractTasks(emailText)` and `summarise(emailText)`. Replaces `supabase/functions/extract-tasks`.
- [ ] `local-db.ts` — IndexedDB tasks/accounts/summaries store. The single source of truth on web. Schema mirrors the trimmed Supabase tables.
- [ ] `sync-relay.ts` — E2E-encrypted sync via libsodium. Pulls/pushes ciphertext blobs through the existing relay (or a new minimal one); server never sees plaintext. Keys derived per-device, exchanged during `pair-device`.

Mobile (`apps/mobile/src/lib/`):
- [ ] `gmail-client.ts` — mobile Gmail caller. Uses `expo-auth-session` for OAuth; otherwise same surface as the web version.
- [ ] `local-llm.ts` — MLC (Machine Learning Compilation) wrapper. iOS/Android on-device inference. Same `extractTasks` / `summarise` surface as web for parity.
- [ ] `local-db.ts` — `expo-sqlite` tasks store. Mirrors the web IndexedDB schema; one source of truth on device.

Cross-cutting (not files, but tracked work):
- [ ] Local notification scheduler for mobile (`expo-notifications`) — replaces `send-alarms`.
- [ ] Web notification scheduler (service worker + `Notification` API) — replaces `send-alarms` for the PWA path.
- [ ] Migration helper that, on first launch post-upgrade, pulls `email_accounts` / `user_api_keys` / `emails` rows from Supabase down to local stores, then no-ops thereafter.

---

## Sequencing (suggested)

1. Land §5 new modules behind a feature flag; dual-run with existing server paths.
2. Ship the migration helper; verify on a staging account that all data lands client-side.
3. Flip the flag to client-only for a cohort; observe one release.
4. Delete §1 edge functions and §3 web routes in a single PR.
5. Write the §2 drop-tables migration as the **next** PR (so any rollback is one revert away).
6. Drop dormant cron jobs and clean `user_settings` BYOK columns.

---

Verified against repo state on 2026-06-23. Re-check before each step in the sequence above — file paths may move.
