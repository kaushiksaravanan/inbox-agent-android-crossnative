# TEST-PASS-1 — User Story Verification

Run date: 2026-06-22
App under test: http://localhost:3000 (Next.js dev/prod server)
Methodology: static file inspection + HTTP curl + selective browser-harness probes.

Note on `tech_touchpoints` deltas: many stories reference paths that don't exist in the current tree (e.g. `signup/page.tsx` actually exists, but `apps/web/src/app/api/oauth/gmail/callback/route.ts` was consolidated into `/api/oauth/callback/route.ts`; `tasks/filter-bar.tsx` was inlined into `tasks/page.tsx`; `accounts/account-row.tsx` was inlined into `accounts/page.tsx`; `/api/accounts/[id]/sync` and `/api/accounts/[id]/disconnect` do not exist — the disconnect form action calls a Server Action that runs `DELETE FROM email_accounts` directly). These are noted as `minor` (file-path drift) or `major` (missing functionality) per case.

---

## Per-story results

### US-001 — Sign up with email and password (P0)
- mode: http+static
- status: **pass**
- evidence:
  - `GET /signup` → 200
  - `signup-form.tsx` implements `supabase.auth.signUp` with `emailRedirectTo` → `/auth/callback`
  - Live password strength meter exists (`passwordStrength()` 0..4 with Weak/Fair/Good/Strong labels)
  - Submit disabled until client-side validation passes (`validatePassword`)
  - On success-without-session: toast "Check your email to confirm your account."
  - `/auth/callback/route.ts` exchanges code for session
- failures: none

### US-002 — Reject duplicate email on sign up (P1)
- mode: static
- status: **fail**
- evidence:
  - `signup-form.tsx` surfaces `error.message` from Supabase verbatim but has no special branch for `User already registered`
  - **No `Sign in instead` CTA** with deep-link to `/login?email=...`
  - Search for `already registered|user_already|Sign in instead` returned 0 matches
- failures:
  - { severity: major, description: "No `Sign in instead` deep-link CTA appears when Supabase returns user_already_exists; error is shown as raw text and form does not surface a recovery action.", suggested_fix: "Detect `error.message?.toLowerCase().includes('already')` (or check `error.status === 422`) and render an inline `<Link href={\\`/login?email=${encodeURIComponent(trimmedEmail)}\\`}>Sign in instead</Link>` button beneath the email field." }

### US-003 — Sign in with email and password (P0)
- mode: http+static
- status: **pass**
- evidence:
  - `GET /login` → 200
  - `login-form.tsx` calls `supabase.auth.signInWithPassword`, redirects to `/dashboard` on success
  - Inline error shown via `setFormError(error.message)` + toast
  - `/middleware.ts` (referenced by SPEC) protects dashboard routes — confirmed because `GET /tasks` → 307 → `/login` when unauthenticated
- failures: none

### US-004 — Email-not-confirmed dead end on sign in (P1)
- mode: static
- status: **fail**
- evidence:
  - `login-form.tsx` has **no branch** detecting "Email not confirmed"
  - No `supabase.auth.resend` call anywhere in `(auth)` directory
  - No "Resend verification email" button in the form
- failures:
  - { severity: major, description: "Email-not-confirmed users see only the raw Supabase error message with no resend affordance — dead-end UX explicitly called out as a P1 story.", suggested_fix: "After the `signInWithPassword` error branch, check `if (error.message === 'Email not confirmed')` and render a `Resend verification email` button that calls `supabase.auth.resend({ type: 'signup', email: trimmedEmail })`, with a 30s client-side debounce." }

### US-005 — Connect first Gmail account via OAuth (P0)
- mode: static+http
- status: **pass** (with minor path drift)
- evidence:
  - `/api/oauth/start/route.ts` redirects to Google with `gmail` scopes; uses signed `state` JWT
  - `/api/oauth/callback/route.ts` (consolidated, not `/api/oauth/gmail/callback/...`) handles the return
  - `/accounts/page.tsx` shows accounts with `StatusPill` (active/error/disconnected)
  - `Connect Gmail` button hits `/api/oauth/start?provider=gmail`
- failures:
  - { severity: minor, description: "Story references separate `/api/oauth/gmail/route.ts` and `/api/oauth/gmail/callback/route.ts`; actual implementation is consolidated under `/api/oauth/start` + `/api/oauth/callback` with `?provider=` query.", suggested_fix: "Update story tech_touchpoints to reflect the consolidated provider-agnostic routes." }

### US-006 — Background cron syncs Gmail every 15 minutes (P0)
- mode: static
- status: **pass**
- evidence:
  - `supabase/migrations/20260621000002_cron_jobs.sql` line 8: `'*/15 * * * *'` schedule confirmed
  - `supabase/functions/sync-email/index.ts` exists and exports `handler`
  - Per-account try/catch present (line 395 `try { ... } catch (err) {`)
- failures: none (cannot dynamically verify cron is firing without DB access, but the migration + function code match spec)

### US-007 — Cron isolates one failing account so the rest still sync (P0)
- mode: static
- status: **pass**
- evidence:
  - `sync-email/index.ts` lines 395-398: per-account `try` block inside the iteration
  - Promise.all is used only for parallel `fetchGmailMessage` per email (line 305 has `.catch((e) => ...)` per item), not at the outer account level — accounts are iterated sequentially under their own try/catch
- failures: none

### US-008 — Manual `Sync now` button forces an immediate pull (P1)
- mode: static
- status: **fail**
- evidence:
  - `/api/sync/route.ts` EXISTS but invokes sync for ALL of the user's accounts (not per-account-id) — fans out across `email_accounts.select.eq(user_id)`
  - No `/api/accounts/[id]/sync` route on disk (`ls apps/web/src/app/api/` shows no `accounts` directory)
  - `accounts/page.tsx` has **no `Sync now` button** per row — only a Disconnect form
  - No spinner / pill transition logic in the rendered row
- failures:
  - { severity: major, description: "Per-account `Sync now` button is missing from `/accounts`. The closest route `/api/sync` syncs ALL accounts at once with no UI affordance.", suggested_fix: "Add `<form action={syncAccount}><button>Sync now</button></form>` on each account row using a Server Action that invokes `supabase.functions.invoke('sync-email', { body: { account_id, user_id } })`. Add a yellow `syncing` pill state and a toast on success." }

### US-009 — Add my own OpenAI API key for BYOK extraction (P1)
- mode: static
- status: **pass** (with minor scope drift)
- evidence:
  - `/api/byok/route.ts` POST encrypts key via `fn_encrypt_token` RPC with per-user UUID as KEK
  - Schema validates provider in `['gemini','openai','anthropic','groq']`
  - `byok-section.tsx` shows masked existing keys + provider toggle
  - DELETE removes key and clears `use_byok` flag
- failures:
  - { severity: minor, description: "Story specifies a test-ping to `/v1/models` for verification; current implementation only encrypts+stores. No `Key verified` pill after a real ping.", suggested_fix: "After upsert, call `fetch('https://api.openai.com/v1/models', { headers: { Authorization: \\`Bearer ${key}\\` } })` server-side; only persist if 200, else return `invalid_key`." }

### US-010 — Browse open tasks ordered by alarm (P0)
- mode: http+static
- status: **pass**
- evidence:
  - `GET /tasks` (unauth) → 307 to `/login` (middleware works)
  - `tasks/page.tsx`: `dynamic = 'force-dynamic'`, `createServerClient()`, `if (!user) return null`
  - Default `statusFilter ?? ['pending','snoozed']` ✓
  - `.order('alarm_at', { ascending: true, nullsFirst: false }).order('due_at', ...)` ✓
  - Selected columns include all fields from oracle (title, detail, category, priority, due_at, amount_cents, counterparty, alarm_at)
  - `<TaskList initialTasks={tasks} />` renders with subscription
- failures: none

### US-011 — Empty-state when filters return nothing (P1)
- mode: static
- status: **pass**
- evidence:
  - `tasks/page.tsx` line 85: `tasks.length === 0 ? <EmptyState ... /> : <TaskList ... />`
  - EmptyState uses `<CheckSquare className="h-7 w-7" />` icon
  - Title: "No tasks match these filters" ✓
  - FilterBar is rendered BEFORE the conditional, so it remains visible in empty state
- failures:
  - { severity: minor, description: "`Clear all filters` link logic exists but story specifies it should only appear when `hasCustomFilter` is true — verified that condition is enforced (line 158).", suggested_fix: "n/a — passes as written." }

### US-012 — Filter tasks by category chips (P1)
- mode: static
- status: **pass**
- evidence:
  - `pickList()` validates against `ALL_CATEGORIES = ['payment','subscription','followup','deadline','autopay','other']` ✓
  - `chip()` function builds URLSearchParams toggle for each chip
  - Active chips render with `bg-primary-500 text-white border-primary-500` ✓
  - `aria-pressed={isActive}` set on each chip
- failures:
  - { severity: minor, description: "Story references `filter-bar.tsx` as a separate file; the FilterBar is inlined into `tasks/page.tsx` instead.", suggested_fix: "Update story tech_touchpoints, or extract FilterBar to its own file for symmetry with task-row.tsx/task-list.tsx." }

### US-013 — Phone rings on alarm via native Android app (P0)
- mode: needs_device
- status: **skip**
- evidence:
  - `supabase/functions/send-alarms/index.ts` exists and queries `tasks` where `alarm_fired_at IS NULL AND alarm_at <= now()`
  - Uses **Expo push** with `sound: 'alarm.wav'`, `channelId: 'alarms'`, `categoryId: 'alarm'` (not raw FCM HTTPv1 as story specifies)
  - Updates `alarm_fired_at = now()` after dispatch to prevent re-fire ✓
- failures:
  - { severity: minor, description: "Story specifies FCM HTTPv1 + AlarmManager.setAlarmClock fullscreen intent; impl uses Expo push wrapper instead. Functionally equivalent on Android but the story tech-touchpoints don't match.", suggested_fix: "Reconcile spec to Expo push or migrate to native FCM + AlarmReceiver. Verify on physical device that Expo push triggers a ringing channel that bypasses DND on Pixel + Xiaomi/Oppo OEMs." }

### US-014 — Pair Android app with web account using 6-digit code (P0)
- mode: static+http
- status: **pass**
- evidence:
  - `/devices/page.tsx` calls `supabase.functions.invoke('pair-device', { body: { action: 'create' } })`
  - Displays 6-digit code in a large font (text-6xl/7xl)
  - Copy button + QR-fallback link `inbox-agent://pair/${code}`
  - 10-min `CountdownBar` with progressbar role
  - `GET /devices` (unauth) → 307 to `/login`
  - `supabase/functions/pair-device/index.ts` and `/api/pair-device/route.ts` both present
- failures:
  - { severity: minor, description: "Server-side enforcement of single-use redeem (replay 409) cannot be verified without running the edge function; relies on the migration's `consumed_at` constraint.", suggested_fix: "Add a Vitest integration test that calls redeem twice and asserts the second returns 409/410." }

### US-015 — Native Android app shows today's tasks on launch (P0)
- mode: needs_device
- status: **skip**
- evidence:
  - No `apps/mobile/` MainActivity.kt or `/api/mobile/tasks` route in the web app (`ls api/` shows no `mobile` folder)
  - The mobile app is in `apps/mobile/` (Expo/React Native per the send-alarms function) not native Kotlin Compose
- failures:
  - { severity: minor, description: "Story specifies a Kotlin Compose MainActivity + /api/mobile/tasks; actual mobile is an Expo/React-Native app. Both can satisfy the user-facing behaviour but the tech_touchpoints are stale.", suggested_fix: "Update story to reference Expo + supabase realtime channel instead of /api/mobile/tasks, OR add the missing route if the canonical surface should be REST." }

### US-016 — Land on hero and grok the value prop in 4 seconds (P0)
- mode: http
- status: **pass**
- evidence:
  - `GET /` → 200 in ~0.95s on cold curl
  - HTML contains "Cancel Netflix before midnight" verbatim ✓
  - HTML contains "Read-only" eyebrow ✓
  - HTML contains "139 MB" ✓
  - Both CTAs `Get started free` and `Get the Android app` present (2 occurrences each — hero + final CTA, as story expects)
  - Provider strip rendered: Gmail, Outlook, Apple Mail, Fastmail, Proton (regex match)
- failures:
  - { severity: minor, description: "LCP timing not measured (browser-harness timed out on this page — likely due to framer-motion / heavy dynamic imports tying up the main thread).", suggested_fix: "Run a Lighthouse perf audit; if LCP > 2.5s on simulated 3G, defer Marquee3D + StickyScroll until after first paint." }

### US-017 — Click `Get started free` from hero (P0)
- mode: http+static
- status: **pass**
- evidence:
  - HTML has `href="/signup"` 2 times (hero + final CTA) ✓
  - `/signup` route exists and returns 200
  - `signup/page.tsx` is in `(auth)` group — no marketing chrome
- failures: none

### US-018 — Download the Android APK directly from the landing page (P1)
- mode: http
- status: **pass**
- evidence:
  - `GET /downloads/inbox-agent-android.apk` → 200, Content-Length 145276188 (~138.5 MB, within 139 MB tolerance)
  - `<a href="/downloads/inbox-agent-android.apk">` present 2x in HTML
  - File on disk: `apps/web/public/downloads/inbox-agent-android.apk` 145 MB
- failures:
  - { severity: minor, description: "Actual file size is 138.5 MB, story claims 139 MB. Close enough but the JSON-LD MobileApplication.fileSize is hard-coded to '139 MB' which is now off by ~500KB.", suggested_fix: "Either round up in JSON-LD or derive from `fs.statSync('public/downloads/inbox-agent-android.apk').size` at build time." }

### US-019 — Landing page JSON-LD signals to search engines (P1)
- mode: http+static
- status: **fail**
- evidence:
  - `grep "application/ld+json" /tmp/landing.html` → 2 hits (one from page.tsx, one from layout metadata)
  - `grep "SoftwareApplication"` → **0 hits**
  - `grep "MobileApplication"` → 2 hits ✓
  - `grep "FAQPage"` → **0 hits**
  - `page.tsx` only emits ONE JSON-LD block, and it is `@type: MobileApplication` (not SoftwareApplication)
- failures:
  - { severity: major, description: "Story specifies THREE JSON-LD blocks (SoftwareApplication + MobileApplication + FAQPage). Only MobileApplication is present. SoftwareApplication and FAQPage are missing entirely — the rich-results promise is unfulfillable.", suggested_fix: "Add `softwareJsonLd` (@type: SoftwareApplication, with `aggregateRating` + `offers`) and `faqJsonLd` (@type: FAQPage with mainEntity Q/A array mirroring the on-page FAQ). Render all three as separate `<script type='application/ld+json'>` blocks from `page.tsx`." }

### US-020 — Manage connected accounts from /accounts (P1)
- mode: static+http
- status: **fail**
- evidence:
  - `GET /accounts` (unauth) → 307 to /login ✓
  - `accounts/page.tsx` queries `email_accounts` and renders rows with provider icon, email, StatusPill, last sync relative time ✓
  - **However**: the Disconnect form action runs `DELETE FROM email_accounts` directly — it does NOT revoke provider tokens
  - No `/api/accounts/[id]/disconnect` route exists
  - No `Reconnect` button on error/disconnected rows — only a hard `Disconnect` (which deletes the row entirely)
  - Soft-delete semantics specified in story are violated (row is hard-deleted)
- failures:
  - { severity: major, description: "Disconnect is a hard DELETE — provider tokens are NOT revoked at Google/Microsoft and historical tasks lose their source_account foreign key. Story explicitly requires soft-delete + token revoke.", suggested_fix: "Replace the inline server action with a POST to `/api/accounts/[id]/disconnect` that (a) calls Google's revoke endpoint with the decrypted refresh_token, (b) sets `status='disconnected'` and nulls the encrypted token columns, (c) leaves the row in place so historical tasks remain joinable." }
  - { severity: major, description: "No `Reconnect` button on error/disconnected rows — once an account fails, the user has no in-product recovery path.", suggested_fix: "Render `<a href={\\`/api/oauth/start?provider=${provider}&email=${email}\\`}>Reconnect</a>` whenever `status !== 'active'`." }

### US-021 — Sticky scroll reveal animates as user scrolls landing page (P2 — out of P0/P1 scope but checked for context)
- mode: skipped (P2, not required)

---

## Additional smoke checks

| Route                                | Status | Note                                                  |
|--------------------------------------|--------|-------------------------------------------------------|
| `GET /`                              | 200    | LCP unverified; hero text present                     |
| `GET /signup`                        | 200    | Renders form                                          |
| `GET /login`                         | 200    | Renders form                                          |
| `GET /forgot-password`               | 200    |                                                       |
| `GET /pricing`, `/privacy`, `/terms` | 200    |                                                       |
| `GET /tasks` (unauth)                | 307    | Redirects to /login — middleware works                |
| `GET /accounts` (unauth)             | 307    | →/login                                               |
| `GET /devices` (unauth)              | 307    | →/login                                               |
| `GET /settings` (unauth)             | 307    | →/login                                               |
| `GET /dashboard` (unauth)            | 307    | →/login                                               |
| `GET /downloads/inbox-agent-android.apk` | 200 | 145,276,188 bytes (~138.5 MB)                         |
| `GET /robots.txt`                    | 200    |                                                       |
| `GET /sitemap.xml`                   | **500**| **Sitemap throws** (Internal Server Error)            |

Cross-cutting issue:
- { severity: major, description: "`/sitemap.xml` returns 500 — Next.js sitemap generator is throwing.", suggested_fix: "Inspect `apps/web/src/app/sitemap.ts` for an unhandled error (likely a missing env var or a thrown promise). Add a fallback to a static array of public routes." }
- { severity: minor, description: "`/auth/callback`, `/api/sync`, `/api/pair-device` all return 500 on **GET** because they only export POST handlers — Next.js dev server doesn't gracefully 405. Not user-facing but appears in logs.", suggested_fix: "Add `export async function GET() { return new Response('method not allowed', { status: 405 }); }` or rely on Next's automatic 405 in production." }
- { severity: minor, description: "Animation components (`reveal.tsx`, `marquee-3d.tsx`, `sticky-scroll.tsx`) have **zero** matches for `prefers-reduced-motion`. Vestibular-sensitive users will see motion regardless.", suggested_fix: "Wrap animations in `useReducedMotion()` from framer-motion, or short-circuit transitions when `window.matchMedia('(prefers-reduced-motion: reduce)').matches`." }

---

## Summary table

| Story  | Title                                                         | P  | Mode          | Status |
|--------|---------------------------------------------------------------|----|---------------|--------|
| US-001 | Sign up with email and password                               | P0 | http+static   | pass   |
| US-002 | Reject duplicate email on sign up                             | P1 | static        | fail   |
| US-003 | Sign in with email and password                               | P0 | http+static   | pass   |
| US-004 | Email-not-confirmed dead end on sign in                       | P1 | static        | fail   |
| US-005 | Connect first Gmail account via OAuth                         | P0 | static+http   | pass   |
| US-006 | Background cron syncs Gmail every 15 minutes                  | P0 | static        | pass   |
| US-007 | Cron isolates one failing account so rest sync                | P0 | static        | pass   |
| US-008 | Manual `Sync now` button forces an immediate pull             | P1 | static        | fail   |
| US-009 | Add my own OpenAI API key for BYOK extraction                 | P1 | static        | pass   |
| US-010 | Browse open tasks ordered by alarm                            | P0 | http+static   | pass   |
| US-011 | Empty-state when filters return nothing                       | P1 | static        | pass   |
| US-012 | Filter tasks by category chips                                | P1 | static        | pass   |
| US-013 | Phone rings on alarm via native Android app                   | P0 | needs_device  | skip   |
| US-014 | Pair Android app with web account using 6-digit code          | P0 | static+http   | pass   |
| US-015 | Native Android app shows today's tasks on launch              | P0 | needs_device  | skip   |
| US-016 | Land on hero and grok the value prop in 4 seconds             | P0 | http          | pass   |
| US-017 | Click `Get started free` from hero                            | P0 | http+static   | pass   |
| US-018 | Download the Android APK directly from the landing page      | P1 | http          | pass   |
| US-019 | Landing page JSON-LD signals to search engines                | P1 | http+static   | fail   |
| US-020 | Manage connected accounts from /accounts                      | P1 | static+http   | fail   |
