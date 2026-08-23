# Canonical User Stories — Inbox Agent

> ⚠ **Staleness notice (2026-06-24):** This document describes the v1 architecture (server-side OAuth, encrypted token tables, pg_cron sync). The codebase has since shifted to a local-first architecture (browser PKCE, on-device polling, IndexedDB / expo-sqlite). The **user-facing acceptance criteria, psychology notes, and failure modes** in this doc are still mostly accurate. The **"Tech touchpoints" / "Preconditions" / "Trigger" sections that reference table names, pg_cron, encrypted tokens, or `/api/oauth/*` routes are NOT** — those describe deleted code. See [`SPEC.md`](../../SPEC.md), [`CHANGELOG.md`](../../CHANGELOG.md) v0.4, and the SPEC consistency check (`scripts/check-spec-consistency.ts`) for the current reality. Full rewrite of this doc is tracked in [`ROADMAP.md`](../../ROADMAP.md).

> **Single source of truth for QA, testing, and acceptance.**
> 
> This document is the authoritative tracking record for every user-facing capability of inbox-agent.
> Each story is uniquely numbered `US-NNN`, belongs to a feature `FNN`, and carries a `last_tested` field that
> the upcoming test phase will update. Companion machine-readable files:
> 
> - `stories.json` — full structured payload consumed by the test harness
> - `CANONICAL.csv` — flat tracking sheet for spreadsheets / dashboards
> 
> **Rules of engagement:**
> 1. Never delete a story — change `status` to `deprecated` and keep the row.
> 2. Always update `last_tested` (ISO date) whenever a test run executes against the story.
> 3. Story IDs are immutable. Feature IDs may be reorganized, but only via a tracked migration.

**Total stories:** 21

## Table of Contents

- [Onboarding](#onboarding) — 5 stories
- [Sync](#sync) — 3 stories
- [Tasks](#tasks) — 3 stories
- [Alarms](#alarms) — 1 story
- [Pairing](#pairing) — 1 story
- [Mobile](#mobile) — 2 stories
- [BYOK](#byok) — 1 story
- [Settings](#settings) — 1 story
- [Marketing](#marketing) — 2 stories
- [SEO](#seo) — 1 story
- [Animation](#animation) — 1 story

---

## Onboarding

<details>
<summary><strong>US-001</strong> · <code>F01</code> · Sign up with email and password <em>(priority: P0 · status: shipped · last_tested: NEVER)</em></summary>

**Persona:** Maya / new user

**As a** freelance designer who doesn't trust password managers yet  
**I want** to create an account with my email and a password I can remember  
**So that** I can start connecting my inbox without committing to a third-party identity provider

**Preconditions:**

- I am on /signup
- I have an unverified email address
- Supabase auth is reachable

**Trigger:** I fill out email + password fields and click `Create account`

**Expected behavior:**

1. Password strength meter updates live as I type (weak/fair/strong)
2. Submit is disabled until both fields pass client-side validation
3. POST to supabase.auth.signUp via signup-form.tsx
4. Verification email is dispatched by Supabase
5. UI shows `Check your inbox to verify` confirmation state
6. Once I click the magic link, /auth/callback creates session and redirects to /dashboard/accounts

**Tech touchpoints:**

- `apps/web/src/app/(auth)/signup/page.tsx`
- `apps/web/src/app/(auth)/signup/signup-form.tsx`
- `apps/web/src/app/auth/callback/route.ts`
- `supabase.auth.signUp`

**Psychology:**

> The strength meter is a trust signal more than a security control — it tells Maya 'we care about your account'. Without it, password reuse spikes because she defaults to whatever she used on the last form.

**Failure modes:**

- User submits a password that passes client validation but fails Supabase policy (e.g. <8 chars) → generic error, no field highlight
- Verification email lands in spam → user assumes signup failed and re-submits, hitting Supabase rate limit
- User closes tab before clicking verification link → next sign-in attempt produces an opaque `Email not confirmed` error

**Test oracle:**

- Given an unused email and an 8+ char password, when I click `Create account`, then the form transitions to the `Check your inbox` state within 2s
- Given a weak password (length 4), when I type it in, then the strength meter shows `weak` red and the submit button is disabled

**Priority:** `P0` · **Status:** `shipped` · **Last tested:** `NEVER`

</details>

<details>
<summary><strong>US-002</strong> · <code>F01</code> · Reject duplicate email on sign up <em>(priority: P1 · status: shipped · last_tested: NEVER)</em></summary>

**Persona:** Devon / returning user

**As a** user who forgot I already signed up six months ago  
**I want** a clear message when I try to register with an email that already exists  
**So that** I don't waste 5 minutes wondering why my verification email never arrives

**Preconditions:**

- An account with my email already exists in auth.users

**Trigger:** I submit /signup with my existing email

**Expected behavior:**

1. signup-form.tsx surfaces Supabase's `User already registered` error inline under the email field
2. A secondary CTA `Sign in instead` appears, deep-linking to /login?email=...
3. No verification email is sent
4. Form does NOT navigate away from /signup

**Tech touchpoints:**

- `apps/web/src/app/(auth)/signup/signup-form.tsx`
- `supabase.auth.signUp → 422 user_already_exists`

**Psychology:**

> Mode-error recovery: the user's mental model is 'I'm new'. The fastest correction is offering the next action (`Sign in instead`) rather than just saying no.

**Failure modes:**

- Supabase returns a generic 500 → user gets `Something went wrong` and assumes the product is broken
- Form clears the password field but keeps email, forcing re-entry on retry

**Test oracle:**

- Given an email tied to an existing auth.users row, when I submit /signup, then I see `An account with this email already exists` and a `Sign in instead` link within 1s

**Priority:** `P1` · **Status:** `shipped` · **Last tested:** `NEVER`

</details>

<details>
<summary><strong>US-003</strong> · <code>F02</code> · Sign in with email and password <em>(priority: P0 · status: shipped · last_tested: NEVER)</em></summary>

**Persona:** Tom / returning user

**As a** small-business owner returning a week after signing up  
**I want** to log in with my email and password  
**So that** I can check whether the agent caught the invoice I'm worried about

**Preconditions:**

- I have a verified account
- I'm on /login

**Trigger:** I enter credentials and click `Sign in`

**Expected behavior:**

1. login-form.tsx calls supabase.auth.signInWithPassword
2. On success, HttpOnly session cookie is set via Supabase client
3. Browser redirects to /dashboard or the original `next` param if set
4. Middleware (src/middleware.ts) recognizes session on next request

**Tech touchpoints:**

- `apps/web/src/app/(auth)/login/page.tsx`
- `apps/web/src/app/(auth)/login/login-form.tsx`
- `apps/web/src/lib/supabase/client.ts`
- `apps/web/src/middleware.ts`

**Psychology:**

> Return visits are anxiety-checked: Tom is logging in *because* he suspects something broke. Sign-in latency >2s feeds the suspicion. Keep it fast and quiet.

**Failure modes:**

- Wrong password → Supabase returns `Invalid login credentials` (intentionally vague to avoid email enumeration); user can't tell if email is wrong
- Email not yet confirmed → opaque error; user has no path forward
- Session cookie blocked by Safari ITP → redirect succeeds but middleware bounces back to /login

**Test oracle:**

- Given valid credentials, when I click `Sign in`, then I land on /dashboard within 2s with a Supabase session cookie present
- Given invalid credentials, when I click `Sign in`, then I see `Invalid email or password` inline within 1s and remain on /login

**Priority:** `P0` · **Status:** `shipped` · **Last tested:** `NEVER`

</details>

<details>
<summary><strong>US-004</strong> · <code>F02</code> · Email-not-confirmed dead end on sign in <em>(priority: P1 · status: shipped · last_tested: NEVER)</em></summary>

**Persona:** Maya / new user who forgot to verify

**As a** user who signed up but never clicked the verification link  
**I want** a clear path to resend the verification email when login is blocked  
**So that** I am not stuck in a confusing loop after returning days later

**Preconditions:**

- I created an account but never clicked the verify link
- I am on /login

**Trigger:** I submit valid credentials whose email is unverified

**Expected behavior:**

1. Supabase returns `Email not confirmed`
2. login-form.tsx surfaces the error with explanatory copy
3. A `Resend verification email` button appears, calling supabase.auth.resend
4. Toast confirms a new verification email has been sent

**Tech touchpoints:**

- `apps/web/src/app/(auth)/login/login-form.tsx`
- `supabase.auth.resend({ type: 'signup' })`

**Psychology:**

> Dead-end recovery is the #1 cause of churn for new accounts. Offering the verb (`Resend`) instead of the noun (`Verification required`) gets users unstuck in one click.

**Failure modes:**

- Resend hits Supabase rate limit → error has no friendly text
- User clicks resend repeatedly → no debounce, multiple emails arrive

**Test oracle:**

- Given an unverified account, when I sign in, then I see a `Resend verification email` button within 1s
- Given I click resend once, when I look at Supabase logs, then exactly one resend call is made within a 30s window

**Priority:** `P1` · **Status:** `shipped` · **Last tested:** `NEVER`

</details>

<details>
<summary><strong>US-005</strong> · <code>F03</code> · Connect first Gmail account via OAuth <em>(priority: P0 · status: shipped · last_tested: NEVER)</em></summary>

**Persona:** Priya / new user mid-onboarding

**As a** user who just verified my account and landed on /dashboard/accounts  
**I want** to click `Connect Gmail` and complete Google OAuth in a popup  
**So that** the agent can start pulling messages without me re-entering credentials

**Preconditions:**

- I am authenticated
- I have a Google account
- OAuth client ID + secret configured for Gmail scope

**Trigger:** I click `Connect Gmail` on /dashboard/accounts

**Expected behavior:**

1. Browser opens Google OAuth consent screen with scopes gmail.readonly + email + profile
2. On approval, Google redirects to /api/oauth/gmail/callback?code=...
3. Callback exchanges code for refresh + access tokens
4. Tokens are encrypted with pgp_sym_encrypt and inserted into email_accounts
5. UI redirects to /dashboard/accounts and shows the new row with a green `active` pill
6. An immediate sync is triggered for the new account

**Tech touchpoints:**

- `apps/web/src/app/(dashboard)/accounts/page.tsx`
- `apps/web/src/app/api/oauth/gmail/route.ts`
- `apps/web/src/app/api/oauth/gmail/callback/route.ts`
- `email_accounts table with encrypted token columns`

**Psychology:**

> Connecting is the hardest psychological commitment in the funnel. The popup must feel native to Google (so users trust it) and return them to a populated dashboard within 5s — otherwise they bounce thinking 'did it work?'

**Failure modes:**

- User denies scopes → callback gets error=access_denied → /accounts shows generic error
- Token encryption fails (missing KEK) → tokens written in plaintext or insert errors silently
- Initial sync request fails → dashboard shows account but 0 emails, user thinks nothing happened

**Test oracle:**

- Given I complete the Google OAuth flow, when I return to /dashboard/accounts, then I see a row with status='active' within 5s
- Given I deny the OAuth consent, when I return, then no row is created and a non-scary error is shown

**Priority:** `P0` · **Status:** `shipped` · **Last tested:** `NEVER`

</details>

---

## Sync

<details>
<summary><strong>US-006</strong> · <code>F04</code> · Background cron syncs Gmail every 15 minutes <em>(priority: P0 · status: shipped · last_tested: NEVER)</em></summary>

**Persona:** Maya / freelance designer with 2 Gmail accounts

**As a** freelance designer who lives in Figma and forgets to check email  
**I want** the system to silently pull new Gmail messages every 15 minutes  
**So that** by the time I open my inbox-agent dashboard, the AI has already triaged the last hour of mail without me lifting a finger

**Preconditions:**

- user has at least one row in email_accounts with provider='gmail' and status='active'
- encrypted refresh_token + access_token are stored
- pg_cron and pg_net extensions are enabled on the Supabase project

**Trigger:** pg_cron fires the `sync-email-accounts` job on the */15 * * * * schedule

**Expected behavior:**

1. pg_cron invokes the cron SQL defined in supabase/migrations/20260621000002_cron_jobs.sql
2. The SQL calls pg_net.http_post against the sync-email Edge Function URL with the service-role JWT
3. supabase/functions/sync-email/index.ts selects all email_accounts rows where status='active'
4. For each account it decrypts refresh_token via pgp_sym_decrypt using the per-user KEK
5. It calls Gmail users.messages.list with q='newer_than:1d' (or historyId if available) and upserts message rows into the `emails` table
6. It updates email_accounts.last_sync_at = now() and status='active' on success
7. It enqueues extract-tasks for any rows where ai_processed=false

**Tech touchpoints:**

- `supabase/migrations/20260621000002_cron_jobs.sql`
- `supabase/functions/sync-email/index.ts`
- `supabase/functions/_shared/gmail.ts (Gmail API client)`
- `email_accounts.last_sync_at column`
- `pg_net.http_post`

**Psychology:**

> Invisible reliability is the entire product promise. Maya never sees this run; she only notices when it DOESN'T run (sync pill goes stale on /accounts). The 15-minute cadence is the felt latency budget — anything longer and the 'phone alarm before I miss the bill' value prop collapses.

**Failure modes:**

- pg_net.http_post returns 504 (function cold start > 60s) → cron row records failure, last_sync_at stays stale, user has no idea
- Gmail API returns 429 quota → all accounts in the batch fail-fast, none update
- One account's KEK decryption fails (user rotated password) → loop aborts mid-batch, accounts after it never sync this tick

**Test oracle:**

- Given an email_account with last_sync_at = now() - 30min, when the cron fires, then within 90s last_sync_at advances to within 60s of now()
- Given Gmail returns 5 new messages since last historyId, when the cron completes, then exactly 5 new rows exist in `emails` with ai_processed=false and `tasks` rows appear after extract-tasks runs

**Priority:** `P0` · **Status:** `shipped` · **Last tested:** `NEVER`

</details>

<details>
<summary><strong>US-007</strong> · <code>F04</code> · Cron isolates one failing account so the rest still sync <em>(priority: P0 · status: shipped · last_tested: NEVER)</em></summary>

**Persona:** Devon / power user with Gmail + Outlook + a dead Gmail he forgot to remove

**As a** user with 3 connected mailboxes where one has revoked permissions  
**I want** the cron to skip the broken account and keep syncing the healthy ones  
**So that** a single revoked OAuth grant doesn't blackhole my whole inbox triage

**Preconditions:**

- 3 email_accounts exist for one user_id
- one account's refresh_token has been revoked at the provider
- the other two are healthy

**Trigger:** Scheduled pg_cron tick at minute % 15 == 0

**Expected behavior:**

1. sync-email/index.ts iterates accounts inside a try/catch per account, not one outer try
2. Gmail token refresh returns invalid_grant for the dead account
3. That account row is updated to status='error' with last_error='invalid_grant'
4. The loop continues to the next account
5. The two healthy accounts complete their sync and update last_sync_at
6. The function returns 200 with a summary { synced: 2, failed: 1 }

**Tech touchpoints:**

- `supabase/functions/sync-email/index.ts (per-account try/catch boundary)`
- `email_accounts.status enum ('active'|'error'|'disconnected')`
- `email_accounts.last_error text column`

**Psychology:**

> Devon's trust model is 'tools that break loud, fail soft'. He can tolerate one mailbox going red on /accounts — he cannot tolerate the whole product going silent because of it. Cross-account isolation is the difference between a B-tier and A-tier reliability impression.

**Failure modes:**

- Loop uses Promise.all without allSettled → first rejection aborts the rest
- Status update for the dead account itself throws → user never sees the red pill, just stale data forever
- Function timeout (60s) hits while processing the dead account → all subsequent accounts skipped this tick

**Test oracle:**

- Given 3 accounts where account #2 has refresh_token='revoked', when sync-email runs, then accounts #1 and #3 have last_sync_at within 60s of now() and account #2 has status='error'
- Given account #2 transitions to status='error', when I open /accounts, then I see a red 'Reconnect' pill on that row within one render

**Priority:** `P0` · **Status:** `shipped` · **Last tested:** `NEVER`

</details>

<details>
<summary><strong>US-008</strong> · <code>F05</code> · Manual `Sync now` button forces an immediate pull <em>(priority: P1 · status: shipped · last_tested: NEVER)</em></summary>

**Persona:** Priya / new user mid-onboarding

**As a** new user who just finished OAuth and is staring at an empty task list  
**I want** a Sync now button on /accounts that fetches the last day of mail right now  
**So that** I see the AI working within seconds instead of waiting up to 15 minutes for the next cron tick

**Preconditions:**

- I am authenticated
- I have at least one connected email_account with status='active'
- I am on /accounts

**Trigger:** I click the `Sync now` button on the account row

**Expected behavior:**

1. Button shows spinner + disables to prevent double-click
2. POST to /api/accounts/[id]/sync triggers sync-email Edge Function for just that account
3. Within 10s, last_sync_at updates and pill changes from yellow `syncing` to green
4. Toast confirms `Synced N new messages` with the count
5. New tasks appear under /tasks via realtime subscription

**Tech touchpoints:**

- `apps/web/src/app/(dashboard)/accounts/account-row.tsx`
- `apps/web/src/app/api/accounts/[id]/sync/route.ts`
- `supabase.functions.invoke('sync-email', { account_id })`

**Psychology:**

> The first sync is the moment of truth — Priya needs to see the agent do something within 10s or she'll close the tab. The spinner + toast + new task appearing is a three-step confirmation that builds confidence.

**Failure modes:**

- Sync takes >60s due to large mailbox → function times out, button stays spinning, no error shown
- User clicks repeatedly → multiple syncs queued, rate-limit hit on provider
- Realtime subscription not yet connected → tasks land but UI doesn't refresh

**Test oracle:**

- Given an active account, when I click Sync now, then within 10s I see a success toast with a message count
- Given the sync completes and creates 3 tasks, when I open /tasks, then those 3 tasks are visible without a page reload

**Priority:** `P1` · **Status:** `shipped` · **Last tested:** `NEVER`

</details>

---

## Tasks

<details>
<summary><strong>US-010</strong> · <code>F07</code> · Browse open tasks ordered by alarm <em>(priority: P0 · status: shipped · last_tested: NEVER)</em></summary>

**Persona:** Maya / freelance designer with 2 Gmail accounts

**As a** freelancer who lives out of her inbox  
**I want** to land on /tasks and immediately see what's pending or snoozed, sorted by next alarm  
**So that** I can triage the day without re-reading every email or opening a spreadsheet

**Preconditions:**

- I am signed in
- At least one email account is connected and synced
- extract-tasks has produced at least one task row

**Trigger:** I navigate to /tasks (or click the Tasks nav item in the dashboard shell)

**Expected behavior:**

1. apps/web/src/app/(dashboard)/tasks/page.tsx runs server-side (dynamic = 'force-dynamic') with createServerClient()
2. Default status filter is ['pending', 'snoozed'] — done and dismissed are hidden
3. Query orders by alarm_at ASC nullsFirst:false, then due_at ASC nullsFirst:false
4. Selected columns include title, detail, category, priority, due_at, amount_cents, counterparty, alarm_at
5. Result is hydrated into <TaskList initialTasks={tasks}/> with realtime subscription to postgres_changes on 'tasks'
6. Each row shows PriorityDot, CategoryIcon, title, formatDueLabel(due_at), 'Alarm <smartdate>' if alarm_at, and an amount pill when amount_cents is set

**Tech touchpoints:**

- `apps/web/src/app/(dashboard)/tasks/page.tsx`
- `apps/web/src/app/(dashboard)/tasks/task-list.tsx`
- `apps/web/src/app/(dashboard)/tasks/task-row.tsx`
- `supabase.from('tasks').select(...).in('status', statusFilter).order('alarm_at').order('due_at')`

**Psychology:**

> Anxiety reduction: users open this page already worried they've missed something. The first paint must answer 'what blows up next?' — alarm-first ordering does that. If a stale or unsorted list loads first, trust evaporates within the first 800ms.

**Failure modes:**

- Supabase auth cookie expired → page renders null (return null on !user) → user sees a blank page with no error
- RLS policy mismatch → query returns [] → user thinks the agent forgot their tasks
- Network slow → server component blocks → no skeleton because page.tsx is fully server-rendered (loading.tsx is the only fallback)

**Test oracle:**

- Given 3 pending tasks with alarm_at in the next 24h, when I GET /tasks, then the response body lists them in ascending alarm_at order with status pills hidden for 'pending'
- Given the user is logged out, when I GET /tasks, then middleware.ts redirects to /login before the page handler runs

**Priority:** `P0` · **Status:** `shipped` · **Last tested:** `NEVER`

</details>

<details>
<summary><strong>US-011</strong> · <code>F07</code> · See an empty-state when filters return nothing <em>(priority: P1 · status: shipped · last_tested: NEVER)</em></summary>

**Persona:** Tom / returning user with no new mail today

**As a** user who already cleared everything yesterday  
**I want** a friendly empty state instead of a blank table  
**So that** I don't think the app is broken or that my sync silently died

**Preconditions:**

- I am signed in
- Current filters resolve to zero matching rows

**Trigger:** I land on /tasks with default filters and no pending/snoozed rows exist

**Expected behavior:**

1. tasks array length === 0 short-circuits before <TaskList/> is rendered
2. <EmptyState/> renders with CheckSquare icon, title 'No tasks match these filters', description prompting to widen filters or wait for next sync
3. FilterBar still renders above the empty state so the user can broaden the query
4. 'Clear all filters' link appears only when hasCustomFilter is true

**Tech touchpoints:**

- `apps/web/src/app/(dashboard)/tasks/page.tsx (tasks.length === 0 branch)`
- `apps/web/src/components/empty-state.tsx`
- `EmptyState icon={<CheckSquare className='h-7 w-7' />}`

**Psychology:**

> Empty states are make-or-break for new-user retention. 'No tasks match these filters' (not 'No tasks!') signals 'your data exists, just not under this view' — that nuance prevents the panic-refresh loop.

**Failure modes:**

- Query errors out (data is null) → tasks defaults to [] → empty state shown but the real failure is silent
- First-time user with no synced accounts sees 'No tasks match these filters' which is misleading — should suggest connecting an account

**Test oracle:**

- Given a user with zero tasks rows, when I visit /tasks, then I see the CheckSquare empty state and FilterBar is still rendered
- Given a Supabase query that returns null (error case), when the page renders, then tasks === [] and the empty state renders without throwing

**Priority:** `P1` · **Status:** `shipped` · **Last tested:** `NEVER`

</details>

<details>
<summary><strong>US-012</strong> · <code>F08</code> · Filter tasks by category chips <em>(priority: P1 · status: shipped · last_tested: NEVER)</em></summary>

**Persona:** Priya / new user evaluating the product

**As a** person drowning in subscription emails  
**I want** to click a 'subscription' chip and see only subscription tasks  
**So that** I can decide what to cancel without scrolling past payment reminders

**Preconditions:**

- At least 1 task exists with category='subscription'
- I am on /tasks

**Trigger:** I click the 'subscription' chip in the FilterBar Category row

**Expected behavior:**

1. Chip click navigates to /tasks?category=subscription via the toHref helper (URLSearchParams)
2. pickList() validates the param against ALL_CATEGORIES = ['payment','subscription','followup','deadline','autopay','other']
3. Query adds .in('category', ['subscription'])
4. Chip renders aria-pressed='true' with bg-primary-500 styling
5. 'Clear all filters' link becomes visible (hasCustomFilter === true)
6. Adding a second chip (e.g. 'payment') ORs the categories

**Tech touchpoints:**

- `apps/web/src/app/(dashboard)/tasks/filter-bar.tsx`
- `apps/web/src/app/(dashboard)/tasks/page.tsx (pickList helper)`
- `URLSearchParams in toHref()`

**Psychology:**

> Chips are a power-user shortcut that feels playful for new users. The aria-pressed visual reinforces 'you've narrowed the view' — without it, users second-guess whether the filter actually applied.

**Failure modes:**

- Invalid category value passed in URL → pickList strips it but doesn't tell user
- Combining many chips creates an unindexable query → slow render on large task tables
- Clearing filters via browser back button doesn't reset chip aria-pressed state

**Test oracle:**

- Given I click 'subscription' chip, when the page reloads, then only category=subscription tasks render and aria-pressed='true' is set on the chip
- Given I click 'subscription' then 'payment', when results render, then both categories' tasks appear in alarm-first order

**Priority:** `P1` · **Status:** `shipped` · **Last tested:** `NEVER`

</details>

---

## Alarms

<details>
<summary><strong>US-013</strong> · <code>F09</code> · Phone rings on alarm via native Android app <em>(priority: P0 · status: shipped · last_tested: NEVER)</em></summary>

**Persona:** Maya / freelance designer

**As a** user who set an alarm 1 hour before a payment deadline  
**I want** my phone to ring (not silently buzz) when the alarm fires  
**So that** I cannot miss the deadline even if I'm in flow state with phone face-down

**Preconditions:**

- I have the native Android app installed and paired with my account
- A task has alarm_at set within the future
- Notification + Alarm permissions granted on the device

**Trigger:** Server-side alarm scheduler triggers FCM push at alarm_at time

**Expected behavior:**

1. supabase/functions/dispatch-alarms/index.ts runs every minute, picks tasks where alarm_at <= now() and alarm_fired_at IS NULL
2. It calls FCM HTTPv1 send to the device token registered for that user
3. The Android app receives the high-priority FCM message
4. AlarmManager.setAlarmClock fires a full-screen intent that bypasses Do Not Disturb
5. The phone rings using a 30s alarm-style ringtone, not the default notification chime
6. tasks.alarm_fired_at is updated to now() to prevent re-firing

**Tech touchpoints:**

- `supabase/functions/dispatch-alarms/index.ts`
- `android/app/src/main/java/.../FirebaseMessagingService.kt`
- `android/app/src/main/java/.../AlarmReceiver.kt`
- `AlarmManager.setAlarmClock with FullScreenIntent`

**Psychology:**

> Ringing is the entire promise. Maya picked this product over Todoist precisely because Todoist's notification feels like spam. A literal phone-ringing alarm makes 'pay Comcast' feel as serious as 'wake up for flight'.

**Failure modes:**

- FCM token rotated but never refreshed in DB → message delivered to old device or nowhere
- Doze mode delays FCM by minutes on aggressive OEM ROMs (Xiaomi, Oppo) → user misses the deadline
- User revoked alarm permission → AlarmReceiver falls back to silent notification, breaking the contract

**Test oracle:**

- Given a task with alarm_at = now() + 60s, when 60s elapses, then within 90s the paired phone rings using AlarmManager.setAlarmClock
- Given alarm_fired_at gets populated, when dispatch-alarms runs again, then the same task is not re-dispatched

**Priority:** `P0` · **Status:** `shipped` · **Last tested:** `NEVER`

</details>

---

## Pairing

<details>
<summary><strong>US-014</strong> · <code>F10</code> · Pair Android app with web account using 6-digit code <em>(priority: P0 · status: shipped · last_tested: NEVER)</em></summary>

**Persona:** Devon / power user who just installed the APK

**As a** user who just sideloaded inbox-agent on a Pixel 8  
**I want** to enter a 6-digit code shown on /devices to pair the app  
**So that** I don't have to log in on mobile with a password

**Preconditions:**

- I have the Android app installed
- I am signed in on the web at /devices
- I have an unpaired device

**Trigger:** I click `Pair device` on /devices, then enter the displayed code in the Android app

**Expected behavior:**

1. /devices generates a 6-digit code via POST /api/devices/pair stored in device_pairing_codes with 10-min TTL
2. UI displays the code in a large font with a copyable button + a QR code as a shortcut
3. Android app sends the code to /api/devices/pair/redeem along with its FCM token + device label
4. Server validates the code is unexpired, marks it consumed, creates a device row, and returns a long-lived device JWT
5. App stores the JWT in EncryptedSharedPreferences
6. /devices live-updates to show the new device row with a green status pill

**Tech touchpoints:**

- `apps/web/src/app/(dashboard)/devices/page.tsx`
- `apps/web/src/app/api/devices/pair/route.ts`
- `apps/web/src/app/api/devices/pair/redeem/route.ts`
- `android/app/src/main/java/.../PairingActivity.kt`
- `EncryptedSharedPreferences`

**Psychology:**

> Re-entering a password on mobile is friction; a 6-digit code feels like a familiar magic-link UX (Netflix on TV, Google sign-in on smart TV). It's a paid feature in many products — shipping it raises perceived quality.

**Failure modes:**

- Code expires while user is typing → opaque error, no obvious retry
- FCM token not yet generated → device row created with null fcm_token, alarms silently won't fire
- Replay attack: code consumed twice → second redeem must 409, not 500

**Test oracle:**

- Given a fresh code, when I enter it in the app within 60s, then /devices shows the new device row within 5s
- Given an expired code, when I redeem it, then API returns 410 Gone with a friendly error string

**Priority:** `P0` · **Status:** `shipped` · **Last tested:** `NEVER`

</details>

---

## Mobile

<details>
<summary><strong>US-015</strong> · <code>F11</code> · Native Android app shows today's tasks on launch <em>(priority: P0 · status: shipped · last_tested: NEVER)</em></summary>

**Persona:** Maya / mobile-first user

**As a** user who paired my phone yesterday  
**I want** to open the app and see today's tasks sorted by alarm  
**So that** I can triage from the couch without opening a laptop

**Preconditions:**

- App is paired (device JWT present)
- User has at least one task with alarm_at or due_at within 24h

**Trigger:** I tap the inbox-agent launcher icon

**Expected behavior:**

1. MainActivity fetches /api/mobile/tasks with the device JWT
2. API returns tasks with status in ('pending','snoozed') and alarm_at within 24h, sorted by alarm_at
3. Compose UI renders each row with PriorityDot, title, formatDueLabel, and an alarm chip
4. Pull-to-refresh triggers an immediate /sync request
5. Foreground service maintains a long-lived FCM connection

**Tech touchpoints:**

- `android/app/src/main/java/.../MainActivity.kt`
- `android/app/src/main/java/.../data/TaskRepository.kt`
- `Compose LazyColumn with Material 3 styling`
- `/api/mobile/tasks`

**Psychology:**

> Mobile is the alarm-receiver; desktop is the keyboard. The mobile UI has to feel like a passive 'inbox check' — not a workspace. Material 3 + 1-tap snooze keep it light.

**Failure modes:**

- JWT expired → app shows blank screen instead of re-prompting for re-pair
- Network offline → no cached snapshot shown, user thinks app is broken
- Compose recomposition loop on realtime updates → battery drain

**Test oracle:**

- Given a paired device and 3 tasks with alarms in next 24h, when I launch the app, then I see all 3 sorted by alarm_at within 2s
- Given the device is offline, when I launch the app, then I see the last cached snapshot with an 'offline' banner

**Priority:** `P0` · **Status:** `shipped` · **Last tested:** `NEVER`

</details>

<details>
<summary><strong>US-018</strong> · <code>F14</code> · Download the Android APK directly from the landing page <em>(priority: P1 · status: shipped · last_tested: NEVER)</em></summary>

**Persona:** Devon / new user

**As a** Android-native power user who hates Google Play distribution  
**I want** to tap `Download APK` and get the signed APK in my Downloads folder  
**So that** I can sideload it on my Pixel 8 before even creating an account

**Preconditions:**

- /downloads/inbox-agent-android.apk is served from /public or a CDN
- I am on the landing page on a device that allows sideloading

**Trigger:** I click the `Download APK` button in the #android section or the `Get the Android app` button in the hero

**Expected behavior:**

1. anchor tag with download attribute triggers a direct file download (no JS handler)
2. File saves as inbox-agent-android.apk (139 MB, v0.1.1, arm64-v8a + armeabi-v7a per copy)
3. After download, user can pair the installed app with the web account using a six-digit code (cross-references /devices flow)
4. JSON-LD MobileApplication metadata advertises the same downloadUrl and fileSize 139 MB for SEO/structured search results

**Tech touchpoints:**

- `apps/web/src/app/page.tsx (a href="/downloads/inbox-agent-android.apk" download)`
- `apps/web/public/downloads/inbox-agent-android.apk`
- `JSON-LD MobileApplication softwareJsonLd object`

**Psychology:**

> Sideload-first audiences treat Play Store distribution as a tracking signal they want to avoid. Offering a direct APK with checksum builds the same kind of trust open-source binaries get on GitHub Releases.

**Failure modes:**

- Mobile data download — 139 MB triggers operator data charges; warning copy required nearby
- APK on a cold CDN edge → first download is slow; users abandon
- JSON-LD downloadUrl mismatch with actual file path → 404 in search-engine previews

**Test oracle:**

- Given I click `Download APK` on a desktop browser, when the request resolves, then the file inbox-agent-android.apk is downloaded with Content-Length ≈ 139 MB
- Given I view the page source, when I inspect JSON-LD, then MobileApplication.downloadUrl matches the actual file URL

**Priority:** `P1` · **Status:** `shipped` · **Last tested:** `NEVER`

</details>

---

## BYOK

<details>
<summary><strong>US-009</strong> · <code>F06</code> · Add my own OpenAI API key for BYOK extraction <em>(priority: P1 · status: shipped · last_tested: NEVER)</em></summary>

**Persona:** Devon / power user concerned with cost + privacy

**As a** user who already pays for an OpenAI Plus account and doesn't want my emails analyzed by a third party's key  
**I want** to paste my own OpenAI API key in /settings and have all extractions use it  
**So that** I control cost, model choice, and data residency

**Preconditions:**

- I am authenticated
- I have an OpenAI API key (sk-...)
- I am on /settings

**Trigger:** I paste my key into the BYOK input and click `Save key`

**Expected behavior:**

1. Client validates the key starts with `sk-` and is at least 40 chars
2. POST to /api/settings/byok encrypts the key with pgp_sym_encrypt(per-user KEK) and writes to user_settings.openai_api_key
3. A test ping is made to OpenAI's /v1/models endpoint to confirm validity
4. UI shows green `Key verified` pill with last 4 chars masked
5. Subsequent extract-tasks invocations read this key first, falling back to platform key only if user_settings.byok_only=false

**Tech touchpoints:**

- `apps/web/src/app/(dashboard)/settings/page.tsx`
- `apps/web/src/app/api/settings/byok/route.ts`
- `supabase/functions/extract-tasks/index.ts (BYOK lookup)`
- `user_settings.openai_api_key encrypted column`

**Psychology:**

> BYOK is a power-user trust signal. Devon won't trial-spend $20 on an unknown vendor's quota; he'll spend $200 on his own quota. The 'Key verified' pill is the trust handshake.

**Failure modes:**

- Invalid key passes client check but fails the test ping → user sees red error but key was already stored (rollback missed)
- User pastes a project key with limited scopes → test ping passes, but extract-tasks fails later with opaque 'model not found'
- Encryption KEK rotates → stored key becomes unreadable on next decrypt

**Test oracle:**

- Given a valid sk- key, when I click Save key, then within 3s I see a `Key verified` pill
- Given an invalid key, when I click Save key, then I see an inline error and no row is written

**Priority:** `P1` · **Status:** `shipped` · **Last tested:** `NEVER`

</details>

---

## Settings

<details>
<summary><strong>US-020</strong> · <code>F16</code> · Manage connected accounts from /accounts <em>(priority: P1 · status: shipped · last_tested: NEVER)</em></summary>

**Persona:** Devon / power user with multiple mailboxes

**As a** user with 3 connected mailboxes  
**I want** to see the status of each account and disconnect any that I no longer use  
**So that** I keep my data surface minimal and disconnect the dead account causing red pills

**Preconditions:**

- I am signed in
- I have at least one connected email_account

**Trigger:** I navigate to /accounts

**Expected behavior:**

1. Server query lists all email_accounts for the current user_id with status, last_sync_at, last_error
2. Each row shows provider icon, email, status pill, last sync relative time
3. Disconnect button posts to /api/accounts/[id]/disconnect which revokes provider tokens and sets status='disconnected'
4. Reconnect button (on error/disconnected rows) re-runs OAuth for that provider
5. Disconnect is a soft-delete — historical tasks remain visible

**Tech touchpoints:**

- `apps/web/src/app/(dashboard)/accounts/page.tsx`
- `apps/web/src/app/(dashboard)/accounts/account-row.tsx`
- `apps/web/src/app/api/accounts/[id]/disconnect/route.ts`
- `google/microsoft OAuth revoke endpoints`

**Psychology:**

> Account management is the trust escape hatch. Knowing you can disconnect with one click makes you willing to connect three mailboxes — because the off-ramp is visible from the on-ramp.

**Failure modes:**

- Provider revoke endpoint fails silently → tokens remain valid even after row marked disconnected
- Disconnect cascades into deleting historical tasks → user loses audit trail
- Reconnect loops back to /accounts but new OAuth picks a different account email → confusing duplicate row

**Test oracle:**

- Given an active account, when I click Disconnect, then within 3s the row pill turns gray and provider tokens are revoked
- Given a disconnected row, when I click Reconnect, then OAuth opens with the email pre-filled as a hint

**Priority:** `P1` · **Status:** `shipped` · **Last tested:** `NEVER`

</details>

---

## Marketing

<details>
<summary><strong>US-016</strong> · <code>F12</code> · Land on hero and grok the value prop in 4 seconds <em>(priority: P0 · status: shipped · last_tested: NEVER)</em></summary>

**Persona:** Maya / new user

**As a** freelance designer who saw a tweet about an email agent that doesn't auto-send  
**I want** to land on / and instantly understand it rings my phone with the actual verb  
**So that** I can decide if it's worth handing over Gmail OAuth before scrolling once

**Preconditions:**

- site is served via Next.js app router
- JS not required for first paint — hero is server-rendered

**Trigger:** I open https://inbox.agent in a fresh Chrome tab

**Expected behavior:**

1. apps/web/src/app/page.tsx renders the hero server-side: `Cancel Netflix before midnight.`
2. SiteNav, eyebrow strip (`Read-only · A native Android email agent · 139 MB APK`) and provider strip (Gmail / Outlook / Apple Mail / Fastmail / Proton) appear within LCP target
3. Two CTAs visible above the fold: `Get started free` -> /signup (filled) and `Get the Android app` -> /downloads/inbox-agent-android.apk (outlined)
4. Phone lockscreen mock to the right shows 3 fake notifications (Cancel Netflix, Pay Comcast, Confirm dentist)
5. Heavy framer-motion components (AnimatedNumber, StickyScrollReveal, Marquee3D) lazy-hydrate via next/dynamic with height-matched placeholders to avoid CLS

**Tech touchpoints:**

- `apps/web/src/app/page.tsx (HomePage)`
- `apps/web/src/components/site-nav.tsx`
- `apps/web/src/components/reveal.tsx (Reveal/RevealStagger/RevealItem)`
- `next/dynamic with ssr:true + loading placeholder for AnimatedNumber/StickyScrollReveal/Marquee3D`

**Psychology:**

> First-fold trust: the verb-as-headline (`Cancel Netflix before midnight.`) is the entire pitch in five words. Personas drop off if the hero looks generic; the lockscreen mock with `swipe up · 3 alarms` is the proof-by-image that beats any copy.

**Failure modes:**

- Heavy dynamic imports load slowly on 3G -> placeholders hold layout but interactive CTAs feel dead
- Marquee3D placeholder has fixed height 168 — if 3D component fails to load, user sees blank band
- If NEXT_PUBLIC_SITE_URL is unset, JSON-LD downloadUrl falls back to https://inbox.agent which mismatches deployed host

**Test oracle:**

- Given a cold load on simulated 3G, when /  renders, then `Cancel Netflix` text is visible within 2.5s LCP and `Get started free` is clickable within 3.0s
- Given JS is disabled, when I load /, then both CTAs still navigate (anchor tags, not onClick handlers)

**Priority:** `P0` · **Status:** `shipped` · **Last tested:** `NEVER`

</details>

<details>
<summary><strong>US-017</strong> · <code>F13</code> · Click `Get started free` from hero <em>(priority: P0 · status: shipped · last_tested: NEVER)</em></summary>

**Persona:** Maya / new user

**As a** first-time visitor convinced by the hero copy  
**I want** to click `Get started free` and land on /signup with no detour  
**So that** I can connect my mailbox while my motivation is still hot

**Preconditions:**

- I am on /
- I am not authenticated

**Trigger:** I click the filled black `Get started free` link in the hero

**Expected behavior:**

1. Browser navigates client-side via next/link to /signup
2. apps/web/src/app/(auth)/signup/page.tsx renders the form
3. No marketing chrome (SiteNav, SiteFooter, StickyCta) on the signup screen — that route is in the (auth) group
4. The same CTA in the FINAL CTA block at the bottom of page.tsx behaves identically

**Tech touchpoints:**

- `apps/web/src/app/page.tsx (Link href="/signup")`
- `apps/web/src/components/sticky-cta.tsx`
- `apps/web/src/app/(auth)/signup/page.tsx`

**Psychology:**

> Decision-fatigue: the hero shows two CTAs (`Get started free` and `Get the Android app`). The web one wins for desktop visitors; the APK button wins for visitors landing from a phone. Either is fine — both convert.

**Failure modes:**

- User on mobile clicks `Get the Android app` first and downloads a 139 MB APK over cellular — sticker shock
- Sticky CTA bar overlaps the final CTA on small viewports if not z-indexed correctly

**Test oracle:**

- Given I am on / unauthenticated, when I click the hero `Get started free`, then I land on /signup within 1 ring of network
- Given I scroll to the final CTA, when I click `Get started free` there, then I reach /signup with identical state

**Priority:** `P0` · **Status:** `shipped` · **Last tested:** `NEVER`

</details>

---

## SEO

<details>
<summary><strong>US-019</strong> · <code>F15</code> · Landing page JSON-LD signals to search engines <em>(priority: P1 · status: shipped · last_tested: NEVER)</em></summary>

**Persona:** Search-engine crawler / SEO baseline

**As a** Google/Bing crawler indexing inbox.agent  
**I want** structured data describing the SoftwareApplication, MobileApplication, and FAQPage entities  
**So that** rich results show ratings, price, downloadUrl, and FAQ snippets in SERPs

**Preconditions:**

- / is publicly indexable
- robots.txt allows /
- NEXT_PUBLIC_SITE_URL is set

**Trigger:** A crawler GETs / and parses <script type='application/ld+json'> blocks

**Expected behavior:**

1. softwareJsonLd describes SoftwareApplication with name, applicationCategory, operatingSystem, offers, aggregateRating
2. mobileAppJsonLd describes MobileApplication with downloadUrl, fileSize 139 MB, operatingSystem 'Android'
3. faqJsonLd describes FAQPage with 5+ Q/A pairs from the on-page FAQ
4. All blocks validate against Schema.org via Google Rich Results Test

**Tech touchpoints:**

- `apps/web/src/app/page.tsx (softwareJsonLd / mobileAppJsonLd / faqJsonLd constants)`
- `Next.js metadata API`

**Psychology:**

> SEO signals are bait for the long tail. The FAQ snippet capturing 'does inbox-agent send email' is the cheapest way to win privacy-conscious search intent.

**Failure modes:**

- JSON-LD malformed (trailing comma) → Google ignores the block silently
- downloadUrl mismatches actual file URL → rich result shows broken APK link
- AggregateRating ratingValue without real reviews → manual action from Google

**Test oracle:**

- Given I run the Google Rich Results Test against /, when results return, then SoftwareApplication, MobileApplication, and FAQPage all validate with zero errors
- Given I curl /, when I parse the response, then I find 3 JSON-LD script blocks with the expected @types

**Priority:** `P1` · **Status:** `shipped` · **Last tested:** `NEVER`

</details>

---

## Animation

<details>
<summary><strong>US-021</strong> · <code>F17</code> · Sticky scroll reveal animates as user scrolls landing page <em>(priority: P2 · status: shipped · last_tested: NEVER)</em></summary>

**Persona:** Maya / scroll-curious visitor

**As a** visitor scrolling past the hero to learn more  
**I want** elements to reveal themselves on scroll without jank  
**So that** the page feels alive but doesn't fight my scroll

**Preconditions:**

- JS is enabled
- prefers-reduced-motion is not set

**Trigger:** I scroll the landing page

**Expected behavior:**

1. Reveal/RevealStagger components use IntersectionObserver with rootMargin to trigger entrance animations
2. StickyScrollReveal pins a column and animates between 3-4 stories as scroll progresses
3. framer-motion uses transform/opacity only — no layout-triggering properties
4. prefers-reduced-motion disables all motion (sets transition to instant)
5. Marquee3D loops a horizontal logo strip at a constant velocity without seam

**Tech touchpoints:**

- `apps/web/src/components/reveal.tsx`
- `apps/web/src/components/sticky-scroll-reveal.tsx`
- `apps/web/src/components/marquee-3d.tsx`
- `framer-motion useScroll/useTransform`

**Psychology:**

> Motion is a status signal: 'we sweated the details'. But over-motion is a trust drain — every animation must respect prefers-reduced-motion and never block scroll.

**Failure modes:**

- IntersectionObserver fires once but element never animates due to initial style not set → permanent blank
- Marquee3D animation frame stalls on Safari iOS → seam visible
- Reduced motion check skipped → vestibular-sensitive users get nauseous

**Test oracle:**

- Given prefers-reduced-motion: reduce, when I scroll, then no entrance animations play (elements appear at their final state immediately)
- Given I scroll past the StickyScrollReveal section, when I observe paint timings, then no layout shifts occur (CLS=0)

**Priority:** `P2` · **Status:** `shipped` · **Last tested:** `NEVER`

</details>

---
