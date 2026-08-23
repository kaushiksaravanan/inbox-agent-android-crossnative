# Inbox Agent — Master Spec v2 (local-first)

> Generated 2026-06-21. Pivoted 2026-06-23 to local-first architecture. Mobile parity shipped 2026-06-24. Lock-in spec. No do-overs.

## Trust posture

Inbox Agent is local-first. The OAuth handshake happens in your browser or phone; the extractor runs on your device; tasks live in your phone and your browser. Our server never sees an email and never sees a task. Subpoena us and you get a hashed user id, expired pairing codes, and a license receipt.

## Product mission (locked)

Reads your emails (Gmail OAuth, Outlook later) **on your device**, runs an **on-device extractor** to surface pending action items, schedules native alarms with **specific verbs** ("Cancel Netflix subscription before Jun 28", not "you have an email"), and syncs task state between your paired devices via end-to-end encrypted blobs that the server cannot read.

## Hard requirements

1. Multi-account email reading via OAuth (Gmail first, Outlook later), **polled directly from the client**.
2. **On-device** extraction categorizes emails into actionable tasks: payment reminders, autopay mandates, follow-ups, subscriptions, deadlines.
3. **Specific alarms** with action verbs — "Cancel subscription", "Pay $43 to Comcast", "Reply to Sarah about Q3 plan".
4. Web + mobile pair via 6-digit 2FA-style code; subsequent sync is E2E-encrypted.
5. Daily on-device digest of pending tasks. Read-only — never sends, never drafts.
6. Email bodies and tasks live on the device only. The server never holds them, encrypted or otherwise.
7. One-time $49 license. No subscription, ever.

## Architecture (the actual one)

```
   ┌──────────────────┐                     ┌──────────────────┐
   │  Web (Next.js)   │                     │  Mobile (Expo)   │
   │                  │                     │                  │
   │  Gmail OAuth     │  ──── Gmail API ───→│  Gmail OAuth     │
   │  (PKCE, client)  │←─── messages.list ──│  (PKCE, client)  │
   │                  │                     │                  │
   │  sender-catalog  │                     │  sender-catalog  │
   │  matcher (local) │                     │  matcher (local) │
   │                  │                     │                  │
   │  IndexedDB       │                     │  expo-sqlite     │
   │  + Web Crypto    │                     │  + secure-store  │
   └────────┬─────────┘                     └────────┬─────────┘
            │                                        │
            │   pairing-code rendezvous (6 digits)   │
            │   license verification (one-time)      │
            │                                        │
            └──────────────┬─────────────────────────┘
                           ▼
                  ┌────────────────┐
                  │  Server (tiny) │
                  │  - static site │
                  │  - pair-device │
                  │  - license     │
                  └────────────────┘
```

**The actual flow:**

1. Browser or phone runs Gmail OAuth with **PKCE**. The auth code is exchanged for tokens **on the device**. Tokens never leave the device.
2. Device polls the Gmail API directly (`users.messages.list` + `users.history.list` for incremental sync).
3. Each new message header/snippet is fed through the **local sender-catalog matcher** — a deterministic rule engine that recognizes ~hundreds of known senders (Stripe, Comcast, Netflix, Apple, etc.) and extracts a verb-first task.
4. Tasks are written to **IndexedDB (web)** or **expo-sqlite (mobile)**.
5. Native alarms are scheduled locally (`expo-notifications` on mobile, `Notification` API on web).
6. Devices belonging to the same human are paired through a 6-digit code; afterwards they exchange task diffs as opaque sealed-box blobs through a tiny relay endpoint. The relay sees ciphertext only.

**The server does exactly this and nothing else:**

- **Marketing site** — static Next.js pages explaining the product and selling the license.
- **Pairing relay** — `pair-device` endpoint mints a 6-digit code (5-minute TTL, single-use) and lets the second device redeem it to learn the first device's public key.
- **License verification** (future) — endpoint accepts a Stripe / App Store / Play Store receipt for the one-time $49 purchase and returns an entitlement.

That is the whole server surface. No Gmail polling on the server. No email content. No tasks. No OAuth tokens. No LLM calls. No cron jobs against user data.

## Stack (locked, v2)

- **Monorepo**: Turborepo + pnpm workspaces.
- **Web**: Next.js 15 App Router + Tailwind v4 + shadcn/ui (amber theme).
  - Gmail OAuth via PKCE entirely in the browser.
  - Sender-catalog matcher runs locally in TypeScript.
  - Task storage: **IndexedDB**, encrypted at rest with a **Web Crypto AES-GCM** key derived from the user's passphrase (PBKDF2 / Argon2id).
  - OAuth token storage: IndexedDB, wrapped with the same passphrase-derived KEK.
- **Mobile**: Expo SDK 52 + expo-router + expo-notifications + expo-secure-store + expo-sqlite.
  - Gmail OAuth via `expo-auth-session` (PKCE). Tokens land in `expo-secure-store` (iOS Keychain / Android Keystore).
  - Sender-catalog matcher runs locally in TypeScript (shared package with web).
  - Task storage: **expo-sqlite**.
  - Native alarms via `expo-notifications` with HIGH importance + sound.
- **Server (minimal)**: a Next.js host for the marketing site plus a tiny edge function for pairing (and later, license verification). No Postgres tables for user content. No realtime. No cron against user data.
- **Crypto**: per-device keypair generated on first launch, private key in OS keychain (mobile) or wrapped in IndexedDB (web). Sealed-box encryption between paired devices.

There is no Supabase RLS web of policies governing email or task tables, because those tables do not exist. The earlier "pgcrypto-encrypted tokens with 39 RLS policies and 90-second body purge" plan is gone — we don't store the content at all.

## Server-side schema (tiny)

The only persistent state on the server is what is required to mint pairing codes, route encrypted sync blobs between paired devices of the same user, and record license purchases.

```sql
-- users (managed by auth provider — hashed identifier only, email used for receipt delivery)

create table devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  platform text check (platform in ('android','ios','web')),
  device_name text,
  public_key bytea not null,            -- device public key for sealed-box routing
  push_token text,                      -- optional, for "you have a blob" wakeup
  paired_at timestamptz default now(),
  last_seen_at timestamptz default now()
);

create table pairing_codes (
  code text primary key,                -- 6 digits
  user_id uuid not null,
  initiator_device_id uuid references devices(id),
  expires_at timestamptz not null,      -- now() + 5 min, single-use
  used_at timestamptz
);

create table user_settings (
  user_id uuid primary key,
  license_status text check (license_status in ('beta','licensed','refunded')) default 'beta',
  display_prefs_blob bytea,             -- optional encrypted blob; server cannot read
  updated_at timestamptz default now()
);

create table licenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  purchase_token text not null unique,
  plan text not null check (plan in ('beta','license')),
  purchased_at timestamptz default now(),
  refund_eligible_until timestamptz,
  refunded_at timestamptz
);
```

Tables explicitly dropped from v1 and **not coming back**: `email_accounts`, `emails`, `user_api_keys`, `response_drafts`, `style_profiles`, `followups`. Email and task data live on the device only.

The `tasks` table is kept on the server but holds only **share-link metadata** (encrypted blob id, expiry, who can read it) — never the task content itself. Task content (title, action verb, deadline, etc.) lives exclusively in the device's IndexedDB / SQLite.

## Server endpoints (v2)

**Alive (smoke-tested 2026-06-23, all return expected codes):**

- `GET /api/health` — liveness probe. Returns `{ ok, version, buildId, commit, env, envReady, time }`. `envReady.supabase` and `envReady.googleOAuth` are booleans the `/status` page reads to flag degraded deploys. No state, no auth, no PII.
- `POST /api/contact` — accepts `{ name, email, message }` (Zod-validated). Stores nothing user-identifying beyond what the user wrote. Used by the "got feedback?" footer link.
- `POST /api/subscribe` — accepts `{ email }`. Marketing list signup. Email lives in our list provider, not Postgres.
- `POST /api/pair-device` — mints a 6-digit code on request from device A (5-minute TTL, single-use), redeems it on device B, returns the set of paired device public keys to both sides so they can begin exchanging sealed-box blobs. Requires a Supabase session cookie.
- `PATCH /api/settings` — writes a handful of display preferences (theme, timezone) keyed by user id. No user content. Requires a Supabase session cookie.
- `PATCH /api/tasks/[id]` / `DELETE /api/tasks/[id]` — share-link metadata only (the encrypted blob ID, expiry, who can read it). The task content itself is in the device's IndexedDB / SQLite. Requires a Supabase session cookie.
- `POST /api/redeem` — accepts `{ code }`. Validates an invite/coupon code and returns the access bundle: APK download URL, Discord invite link, GitHub repo link. Rate-limited (10/min/IP). Codes live in `apps/web/src/lib/invite-codes.ts`.
- `GET /api/download/apk` — streams the Android APK binary. Gated: requires `?token=` matching a canonical invite code (same `VALID_CODES` set as `/api/redeem`). Returns 403 without it.
- `POST /api/interest` — captures user interest in a not-yet-shipped feature (Outlook, iOS, Fastmail, Proton, Apple Mail, BYOK, team-plan, public-sale). Body `{ email, feature, source? }`. Feature keys allowlisted in `apps/web/src/lib/interest-store.ts`. Rate-limited (5/min/IP). The same route also accepts a GET with a `feature` query param and returns the dedupe-by-email count for social-proof display.
- `license-verify` (future) — accepts a Stripe / App Store / Play Store receipt, writes the `licenses` row, returns the entitlement.

**Edge functions (Supabase):** only `pair-device` remains. Everything that handled email content (`sync-email`, `extract-tasks`, `send-alarms`, `send-followups`, `draft-response`, `learn-style`, `seed-style-profile`, `oauth-callback`) is deleted and not coming back.

**What Supabase is still used for:** authentication (the sign-in session), the `pair-device` edge function, and a handful of minimal non-content tables (`devices`, `pairing_codes`, `user_settings`, `tasks`). It is NOT used for email storage, OAuth token storage, BYOK key storage, or any cron against user content. Those all live on the device. The `tasks` table is kept but only holds share-link metadata (see above), never task content. The `licenses` table is planned (see [ROADMAP.md](ROADMAP.md)) but does not yet exist in any migration.

## Trust model (concrete)

**Our server sees:** a hashed user id, a 6-digit pairing code that expires in 5 minutes, optional encrypted sync blobs whose key we do not hold, a license purchase record.

**Our server does not see:** your email, your OAuth token, your tasks, your decryption keys, your inbox metadata, your sender list, your extracted verbs, your alarms.

If we are compelled to hand everything over, the recipient gets: a list of opaque user ids, a few expired pairing codes, encrypted bytes they cannot decrypt without a device private key we never have, and license purchase records. They do not get a single email subject line.

## On-device extraction (locked)

Extraction is a **deterministic sender-catalog matcher**, not an LLM. The catalog recognizes hundreds of common senders (billing, autopay, subscription, delivery, calendar, etc.) and emits verb-first tasks with the original message id attached for "Why?" auditing.

- No default LLM call.
- No hallucinated tasks.
- Every task carries the rule id that produced it and the exact email span it matched.
- Future work may add a small on-device classifier for the long tail and opt-in BYOK (OpenAI / Anthropic) for users who want more recall — both go device-only, never through our server.

## Pairing flow

1. User signs in on web. The web app generates a device keypair, stores the private key in IndexedDB under a passphrase-derived KEK, and registers the public key as a `devices` row.
2. Web calls `pair-device` → server returns a 6-digit code with a 5-minute TTL.
3. Mobile app signs in with the same account, generates its own keypair (private key into `expo-secure-store`), registers its public key as a second `devices` row.
4. Mobile prompts "Enter pairing code from web." User types the code. Mobile calls `pair-device` → server validates code, returns the set of paired device public keys.
5. Both devices now know each other's public keys. All subsequent task sync travels as sealed-box blobs through the relay. The server cannot decrypt.

## OAuth flow

**Web (Gmail):**
- User clicks "Connect Gmail" → redirected to Google OAuth consent (PKCE, public client id).
- Google redirects to `/oauth/gmail/callback`, a static page in the Next.js app.
- The callback page exchanges the code for tokens **client-side** using the PKCE verifier — no server hop.
- Access + refresh tokens are encrypted with the passphrase-derived KEK and stored in IndexedDB.

**Mobile (Gmail):**
- `expo-auth-session` runs the PKCE flow in-app. Tokens land in `expo-secure-store` (iOS Keychain / Android Keystore).

**Outlook:** analogous via Microsoft Graph + MSAL when shipped.

Our server never sees an OAuth token.

## Sync flow

- Each device polls Gmail directly using its locally-stored OAuth token (incremental sync via `historyId`).
- For each new message, the device runs the sender-catalog matcher and writes 0+ tasks to local storage.
- For each new/changed task, the device encrypts a diff blob with each paired device's public key and uploads it to the relay.
- Other devices poll the relay (and/or receive an empty push notification — "blob waiting") and merge incoming diffs. Last-write-wins per task id is fine; tasks are not collaborative.
- Sync blobs expire after 7 days regardless of delivery, and are deleted shortly after pickup.

## Alarm flow

- Tasks have `due_at` and optional `alarm_at`.
- On task insert/update, the mobile app schedules a native notification via `expo-notifications.scheduleNotificationAsync` with HIGH importance + sound.
- Title = the task's specific verb. Channel = task category.
- No server involvement. Phone fires alarms even fully offline.
- Web shows browser notifications via the `Notification` API when the tab is open; otherwise the History view surfaces them on next visit.

## Mobile parity (shipped)

Mobile reached parity with web on 2026-06-24. The Expo app now contains:

- `gmail-oauth.ts` — PKCE flow via `expo-auth-session`, tokens written to `expo-secure-store`.
- `gmail-client.ts` — fetch wrapper for the Gmail REST API (list, get, history).
- `extractor.ts` — the shared sender-catalog matcher running locally. Layered: L1 catalog → L2 generic regex → L3 model-source slot (today a heuristic span-tagger, swappable for a quantized GLiNER ONNX without touching call sites).
- `poll-gmail.ts` — incremental sync loop driven by `historyId`.
- `background-poll.ts` — registers an `expo-task-manager` task with `expo-background-fetch` so the OS wakes us roughly every 15 minutes to run one pass. Auto-registered after Gmail OAuth, auto-unregistered on revoke. The Settings screen surfaces `Background sync: On · ~every 15m / Off / Restricted by OS / Disabled by user` from `getBackgroundPollStatus()`.
- `local-db.ts` — `expo-sqlite` schema and CRUD for tasks/messages.
- `demo-emails.ts` — fixture set used in onboarding and offline demo.

The History tab replaced the old Inbox tab. The app no longer shows raw email; it shows the verb-first task derived from the email, with a "Why?" affordance that reveals the matched sender and span (and, for L3-source tasks, the per-span confidence scores).

## Visual design (locked, unchanged from v1)

Match interndock.com aesthetic with navy swapped for warm amber:

- Primary: `#ea7c1c`
- Primary-dark: `#c25f0c`
- Primary-light: `#fbb572`
- Accent (urgent alarms): `#dc2626`
- Background: `#ffffff` / `#fef9f3`
- Foreground: `#1a1411`
- Muted: `#78716c`
- Border: `#e7e5e4`
- Font display: DM Serif Display
- Font sans: DM Sans
- Radii: sm 4 / md 8 / lg 16 / full 30
- Shadow: soft skeuomorphic, cards lift on hover

## Pricing

- **Beta** — free during open beta. All features. No card on file.
- **License** — **$49 one-time**. All features, all platforms, all future updates within v1.x. One license = one human (any number of mailboxes, any number of paired devices).
- **30-day money-back guarantee** — refund button in Settings for 30 days post-purchase. Self-service, one click, no questions.

No subscription. No per-seat. No per-mailbox limit. No team or enterprise tier.

## Privacy indicators (Android — unchanged from v1)

- Foreground service `com.inbox.agent.privacy.SyncForegroundService` starts whenever the agent actively polls email.
- Registered with `foregroundServiceType="dataSync"`; on Android 14+ calls `startForeground(...)` with `FOREGROUND_SERVICE_TYPE_DATA_SYNC` so access shows in the Privacy Dashboard and lights the status-bar privacy dot.
- `IMPORTANCE_MIN` ongoing notification on the `inbox-agent-sync` channel, badge disabled, `FOREGROUND_SERVICE_DEFERRED` for fast syncs.
- `DataAccessAuditor` installs an `AppOpsManager.OnOpNotedCallback` and logs `synced/self/async` ops under tag `InboxAgentPrivacy`.
- JS surface: `withSyncIndicator(fn)` / `startSyncIndicator()` / `stopSyncIndicator()` in `apps/mobile/src/lib/privacy.ts`.
- iOS: `PrivacyInfo.xcprivacy` declares `NSPrivacyTracking=false`, no tracking domains, and required-reason API usage for UserDefaults (CA92.1) and FileTimestamp (C617.1).

## What this product is NOT

Explicitly cut, and staying cut:

- **No reply drafting.** Read-only against your inbox. Never sends, drafts, or auto-replies.
- **No follow-up emails.** The task gives you a verb and a name — you do the nudging.
- **No analytics tracking** beyond a single anonymous "license activated" count.
- **No telemetry, no error reporting.** Crashes stay on your device.
- **No default LLM calls.** The local sender-catalog matcher is the default path. BYOK is opt-in and goes device-direct.
- **No "team" or "enterprise" tier.** One license, one human, one price.
- **No subscription.** Ever.
- **No server-side copy of your email or your tasks.** Not encrypted, not transient, not anywhere. The server cannot lose what it never has.

## Appendix A — v1 spec (superseded)

The v1 spec called for server-side Gmail polling, server-side Gemini extraction via vended keys, server-side OAuth token storage with `pgp_sym_encrypt`, server-side reply drafting with a per-user style profile, server-side follow-up dispatch via pg_cron, a 90-second email body purge, and a Free/$9/$19 subscription model. All of that is superseded by v2 above. The v1 database tables (`email_accounts`, `emails`, `tasks`, `followups`, `response_drafts`, `style_profiles`, `user_api_keys`) and v1 edge functions (`oauth-callback`, `sync-email`, `extract-tasks`, `send-alarms`, `send-followups`, `draft-response`, `learn-style`, `seed-style-profile`) are dropped. The amber visual design and the Android privacy-dot implementation carry over unchanged.
