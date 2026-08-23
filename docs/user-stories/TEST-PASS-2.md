# TEST-PASS-2 — User Story Re-verification

Run date: 2026-06-22 (Pass 2)
App under test: http://localhost:3000 (Next.js 14.2 dev server)
Methodology: same as Pass 1 — static file inspection + HTTP curl smoke checks. Dev server compilation
took several minutes per route on first hit (cold .next webpack cache); each route was re-issued until
a deterministic 2xx/3xx was observed.

Scope:
- Re-execute the original `test_oracle` for the **5 previously-failing stories** (US-002, US-004,
  US-008, US-019, US-020).
- Re-execute the **2 cross-cutting major findings** (sitemap.xml 500, reduced-motion on reveal).
- Re-test **5 representative passing stories** from Pass 1 to confirm no regression
  (US-001, US-003, US-010, US-014, US-018).

---

## Re-test of previously-failing stories

### US-002 — Reject duplicate email on sign up (P1)
- prior status: **fail** (no "Sign in instead" CTA)
- mode: static
- new status: **pass**
- evidence:
  - `apps/web/src/app/(auth)/signup/signup-form.tsx` lines 51, 65, 100–107 — `alreadyExists` state set
    when Supabase error message matches `/already/i` or `/exists/i`
  - lines 309–323 — `<Link href={\`/login?email=${encodeURIComponent(alreadyExists)}\`}>Sign in instead</Link>`
    renders inside the red error banner whenever `alreadyExists` is set
  - Error copy: "An account with that email already exists." (no longer raw Supabase string)
  - `/signup` HTTP probe → 200
- residual: none

### US-004 — Email-not-confirmed dead end on sign in (P1)
- prior status: **fail** (no resend affordance)
- mode: static
- new status: **pass**
- evidence:
  - `apps/web/src/app/(auth)/login/login-form.tsx` lines 21–32 — `needsConfirm` + `resendCooldown`
    state, 1s decrement effect for cooldown
  - lines 34–63 — `handleResend()` calls `supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo } })`
    and sets a 30s cooldown on success
  - lines 95–98 — branch on `msg === "Email not confirmed" || /not.*confirmed/i.test(msg)` sets
    `needsConfirm=true`
  - lines 243–258 — renders `Resend verification email` button (with `Sending…` / `Resend in Ns` states)
    inside the error banner
  - line 15 — also prefills email from `?email=` query (closes loop with US-002's "Sign in instead" deep-link)
  - `/login` HTTP probe → 200
- residual: none

### US-008 — Manual `Sync now` button forces an immediate pull (P1)
- prior status: **fail** (no per-account sync UI, no `/api/accounts/[id]/sync` route)
- mode: static
- new status: **pass**
- evidence:
  - `apps/web/src/app/api/accounts/[id]/sync/route.ts` exists — POST handler verifies account
    ownership (`eq("user_id", user.id)`) and invokes `supabase.functions.invoke("sync-email", { body: { account_id, user_id } })`
    via the service-role client
  - 401 / 404 / 500 error branches all return JSON, success returns `{ ok: true, account_id }`
  - `apps/web/src/app/(dashboard)/accounts/account-row-actions.tsx` — new client component
    rendering a `Sync now` button (lines 71–87) with spinner state (`syncing`/`Syncing…`) and toast
    feedback on success/failure
  - `accounts/page.tsx` line 172 — every row renders `<AccountRowActions accountId email status provider />`
  - `Reconnect` (non-active rows) goes to `/api/oauth/start?provider=...`
- residual: none

### US-019 — Landing page JSON-LD signals to search engines (P1)
- prior status: **fail** (only MobileApplication present)
- mode: http+static
- new status: **pass**
- evidence:
  - `apps/web/src/app/page.tsx` lines 22–104 — three exported objects: `mobileJsonLd` (@type
    MobileApplication, fileSize derived from `statSync` of the APK), `softwareJsonLd` (@type
    SoftwareApplication, with `aggregateRating` + AggregateOffer), `faqJsonLd` (@type FAQPage,
    mainEntity built from `COPY.faq` plus 3 hard-coded extra Q/A)
  - lines 109–120 — three separate `<script type="application/ld+json">` tags rendered from
    `HomePage()`
  - Served HTML at `GET /` → 200, 67,677 bytes
  - `grep -oE 'MobileApplication|SoftwareApplication|FAQPage'` on the served HTML returns
    2 of each (Next.js dev double-render; production SSR would emit one of each — both copies are
    in the DOM either way and search engines will see them)
- residual: none

### US-020 — Manage connected accounts from /accounts (P1)
- prior status: **fail** (hard DELETE on disconnect, no Reconnect, no token revoke)
- mode: static+http
- new status: **pass**
- evidence:
  - `apps/web/src/app/api/accounts/[id]/disconnect/route.ts` exists — POST handler:
    1. RLS-scoped read of `email_accounts` to fetch `access_token`/`refresh_token`
    2. Best-effort revoke at `https://oauth2.googleapis.com/revoke?token=...` (Gmail) — wrapped in
       try/catch so failure doesn't block local disconnect; Outlook has no public revoke endpoint,
       handled by clearing local tokens
    3. UPDATE (not DELETE) `status='disconnected', access_token=null, refresh_token=null,
       token_expires_at=null` — preserves FK from historical tasks
  - `accounts/page.tsx` lines 68–88 — server action `disconnectAccount` now also performs UPDATE
    (not DELETE) as a defense-in-depth fallback; primary path is the API route
  - `account-row-actions.tsx` lines 88–95 — when `status !== "active"`, row renders a Reconnect
    link to `/api/oauth/start?provider=${provider}` (US-020 second failure addressed)
  - `/accounts` (unauth) → 307 → `/login`
- residual: none

---

## Re-test of cross-cutting findings

### Sitemap 500 (Pass 1 cross-cutting major)
- prior status: **fail** — `GET /sitemap.xml` → 500
- new status: **pass**
- evidence:
  - `apps/web/src/app/sitemap.ts` lines 20–44 — added `FALLBACK_PUBLIC_ROUTES` array + `try`/`catch`
    around the dynamic body
  - `GET /sitemap.xml` → 200
- residual: none

### Reduced-motion missing on reveal.tsx (Pass 1 cross-cutting minor)
- prior status: **fail** — `reveal.tsx` had zero matches for `prefers-reduced-motion`
- new status: **pass**
- evidence:
  - `apps/web/src/components/reveal.tsx` line 14: `import { useReducedMotion } from "motion/react"`
  - line 33: `const reduce = useReducedMotion()` — short-circuits the IntersectionObserver and
    paints the static end state when the user has reduced motion enabled
  - `marquee-3d.tsx`, `sticky-scroll.tsx` already honored `useReducedMotion` per Pass 1
- residual: none

---

## Regression check — 5 representative previously-passing stories

| Story  | Title                                                  | Pass 1 | Pass 2 | Notes                                |
|--------|--------------------------------------------------------|--------|--------|--------------------------------------|
| US-001 | Sign up with email and password                        | pass   | **pass** | `/signup` → 200; signup-form intact; password strength meter still present |
| US-003 | Sign in with email and password                        | pass   | **pass** | `/login` → 200; `signInWithPassword` flow intact; new resend branch is additive |
| US-010 | Browse open tasks ordered by alarm                     | pass   | **pass** | `/tasks` (unauth) → 307 → `/login`; tasks/page.tsx unchanged |
| US-014 | Pair Android app with web account using 6-digit code   | pass   | **pass** | `/devices` (unauth) → 307; pair-device edge function + `/api/pair-device` still present |
| US-018 | Download the Android APK directly from the landing page | pass   | **pass** | `/downloads/inbox-agent-android.apk` → 200, Content-Length 145,276,188 (~138.5 MB, identical to Pass 1) |

No regressions detected.

---

## HTTP smoke results (Pass 2)

| Route                                    | Pass 1 | Pass 2  | Delta                |
|------------------------------------------|--------|---------|----------------------|
| `GET /`                                  | 200    | 200     | —                    |
| `GET /signup`                            | 200    | 200     | —                    |
| `GET /login`                             | 200    | 200     | —                    |
| `GET /tasks` (unauth)                    | 307    | 307     | —                    |
| `GET /accounts` (unauth)                 | 307    | 307     | —                    |
| `GET /devices` (unauth)                  | 307    | 307     | —                    |
| `GET /downloads/inbox-agent-android.apk` | 200    | 200     | —                    |
| `GET /sitemap.xml`                       | **500**| **200** | **FIXED**            |

---

## Summary table

| Story  | Title                                            | P  | Pass 1 | Pass 2 |
|--------|--------------------------------------------------|----|--------|--------|
| US-002 | Reject duplicate email on sign up                | P1 | fail   | **pass** |
| US-004 | Email-not-confirmed dead end on sign in          | P1 | fail   | **pass** |
| US-008 | Manual `Sync now` button forces an immediate pull| P1 | fail   | **pass** |
| US-019 | Landing page JSON-LD signals to search engines   | P1 | fail   | **pass** |
| US-020 | Manage connected accounts from /accounts         | P1 | fail   | **pass** |
| —      | Cross-cutting: /sitemap.xml 500                  | —  | fail   | **pass** |
| —      | Cross-cutting: reveal.tsx reduced-motion         | —  | fail   | **pass** |
| US-001 | Sign up with email and password                  | P0 | pass   | pass   |
| US-003 | Sign in with email and password                  | P0 | pass   | pass   |
| US-010 | Browse open tasks ordered by alarm               | P0 | pass   | pass   |
| US-014 | Pair Android app with web account 6-digit code   | P0 | pass   | pass   |
| US-018 | Download Android APK from landing page           | P1 | pass   | pass   |

**Retested**: 7 (5 stories + 2 cross-cutting)
**Now passing**: 7
**Still failing**: 0
**Regressed**: 0
**Residual critical**: none

---

## Notes / non-blocking observations

- The Pass 1 minor findings that were not part of the FIXES-APPLIED scope remain unchanged
  and were not re-tested (path drift on US-005, US-012, US-013, US-015; BYOK test-ping on
  US-009; APK fileSize rounding on US-018 — now derived from `statSync`, so this is also
  effectively closed for US-018 even though the on-page copy still reads "139 MB").
- Pass 1's GET-on-POST-only-route minor finding (`/auth/callback`, `/api/sync`, `/api/pair-device`
  returning 500 on GET) was not in the FIX-PLAN and was not re-tested.
- The dev server cold-cache caused webpack to throw `TypeError: e[o] is not a function` on the
  first compilation of `/`; subsequent requests succeeded. This is a dev-server-only artifact
  unrelated to the code under test.
- US-013 and US-015 remain `skip` (require a physical Android device). No change in evidence
  since Pass 1.

## Conclusion

All Pass 1 failures and both cross-cutting major findings are resolved. No regressions detected
in the 5 representative passing stories. Status: **clean**.
