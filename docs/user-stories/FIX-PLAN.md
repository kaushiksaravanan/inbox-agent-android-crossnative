# FIX-PLAN — Synthesis of TEST-PASS-1 Failures

Generated: 2026-06-22
Source: docs/user-stories/TEST-PASS-1.md

The failing stories cluster into a small number of coordinated fixes. Many failures share a single root cause — e.g. "the auth form doesn't branch on Supabase error codes" covers both US-002 and US-004, and "the accounts page is missing per-row recovery affordances" covers both US-008 and US-020.

---

## FIX-01 — Auth-form Supabase error branching (P0)
- **Resolves**: US-002, US-004
- **Root cause**: `signup-form.tsx` and `login-form.tsx` render `error.message` verbatim with no special-case branches. There is no recovery affordance for `user_already_exists` (signup) or `Email not confirmed` (login), creating dead-end UX.
- **Files to edit**:
  - `apps/web/src/app/(auth)/signup/signup-form.tsx`
  - `apps/web/src/app/(auth)/login/login-form.tsx`
- **Proposed change**:
  - In signup-form, after the `signUp` error branch, detect `error.message?.toLowerCase().includes('already')` (or `error.status === 422`) and render an inline `<Link href={`/login?email=${encodeURIComponent(trimmedEmail)}`}>Sign in instead</Link>` CTA beneath the email field.
  - In login-form, after `signInWithPassword` error, detect `error.message === 'Email not confirmed'` and render a `Resend verification email` button that calls `supabase.auth.resend({ type: 'signup', email: trimmedEmail })` with a 30s client-side debounce.

## FIX-02 — /accounts row affordances: Sync now, Reconnect, soft-delete Disconnect (P0)
- **Resolves**: US-008, US-020
- **Root cause**: `/accounts` page row has only a hard-DELETE Disconnect form. Missing per-account `Sync now` button (US-008), missing `Reconnect` button for non-active rows (US-020), and Disconnect violates soft-delete semantics + skips provider token revocation (US-020).
- **Files to edit**:
  - `apps/web/src/app/(app)/accounts/page.tsx`
  - new: `apps/web/src/app/api/accounts/[id]/sync/route.ts`
  - new: `apps/web/src/app/api/accounts/[id]/disconnect/route.ts`
  - (optional) extract `accounts/account-row.tsx` for clarity
- **Proposed change**:
  - Render three per-row actions: `Sync now` (always, when status=active), `Reconnect` (when status !== 'active', links to `/api/oauth/start?provider=${provider}&email=${email}`), `Disconnect`.
  - `Sync now` form posts to `/api/accounts/[id]/sync` which invokes `supabase.functions.invoke('sync-email', { body: { account_id, user_id } })`; toggle row's StatusPill to `syncing` until completion; toast on success/error.
  - `Disconnect` posts to `/api/accounts/[id]/disconnect` which (a) decrypts refresh_token, (b) calls Google `https://oauth2.googleapis.com/revoke?token=...` (or Microsoft equivalent), (c) UPDATEs `status='disconnected'` and nulls token columns — does NOT DELETE the row, preserving FK from historical tasks.

## FIX-03 — Landing page JSON-LD missing two blocks (P1)
- **Resolves**: US-019
- **Root cause**: `apps/web/src/app/page.tsx` only emits one JSON-LD block (`@type: MobileApplication`). Spec requires three: SoftwareApplication + MobileApplication + FAQPage.
- **Files to edit**:
  - `apps/web/src/app/page.tsx`
- **Proposed change**:
  - Add `softwareJsonLd` constant: `@type: SoftwareApplication` with `applicationCategory: 'ProductivityApplication'`, `operatingSystem: 'Web'`, `aggregateRating` and `offers`.
  - Add `faqJsonLd` constant: `@type: FAQPage` with `mainEntity` Q/A array mirroring the on-page FAQ section content.
  - Render all three as separate `<script type='application/ld+json' dangerouslySetInnerHTML={{__html: JSON.stringify(x)}} />` blocks at the end of the page component.
  - Also derive `MobileApplication.fileSize` from `fs.statSync('public/downloads/inbox-agent-android.apk').size` at build time (sweeps up the US-018 minor drift).

## FIX-04 — /sitemap.xml returns 500 (P1)
- **Resolves**: Cross-cutting smoke failure (not a numbered story, but P1-visible to crawlers and adjacent to US-019's SEO theme)
- **Root cause**: `apps/web/src/app/sitemap.ts` is throwing — likely a missing env var or an un-awaited promise.
- **Files to edit**:
  - `apps/web/src/app/sitemap.ts`
- **Proposed change**:
  - Wrap the body in try/catch; on error, return a static fallback array of public routes (`/`, `/signup`, `/login`, `/pricing`, `/privacy`, `/terms`, `/forgot-password`) with current `lastModified`.
  - Log the underlying error to the server console so the real cause is discoverable.

## FIX-05 — prefers-reduced-motion respect across animations (P2)
- **Resolves**: Cross-cutting a11y smoke failure (out of P0/P1 scope but a quick a11y win bundled here)
- **Root cause**: `reveal.tsx`, `marquee-3d.tsx`, `sticky-scroll.tsx` have zero `prefers-reduced-motion` matches; vestibular-sensitive users see motion regardless of OS setting.
- **Files to edit**:
  - `apps/web/src/components/marketing/reveal.tsx`
  - `apps/web/src/components/marketing/marquee-3d.tsx`
  - `apps/web/src/components/marketing/sticky-scroll.tsx`
- **Proposed change**:
  - Use `useReducedMotion()` from framer-motion at the top of each component; when true, short-circuit animation props (set `initial=animate`, `transition={{duration: 0}}`, or render the static end-state).

---

## Out-of-scope (deferred or non-actionable)
- US-013, US-015 — require a physical Android device; not addressable from web tree.
- US-016 LCP measurement — needs Lighthouse run, not a code edit.
- US-009 BYOK live-ping — minor; could be folded into a later "BYOK polish" pass.
- File-path drift notes in US-005, US-012, US-015 — story doc updates, not code fixes.

---

## Cluster JSON

```json
{
  "fix_clusters": [
    {
      "cluster_id": "FIX-01",
      "resolves_stories": ["US-002", "US-004"],
      "root_cause": "Auth forms render Supabase errors verbatim with no branching for user_already_exists or Email not confirmed; no recovery CTAs.",
      "files_to_edit": [
        "apps/web/src/app/(auth)/signup/signup-form.tsx",
        "apps/web/src/app/(auth)/login/login-form.tsx"
      ],
      "proposed_change": "Add error.message branching: signup shows a 'Sign in instead' Link to /login?email=... when 'already' is in the message; login shows a 'Resend verification email' button (calls supabase.auth.resend) when message === 'Email not confirmed', debounced 30s.",
      "priority": "P0"
    },
    {
      "cluster_id": "FIX-02",
      "resolves_stories": ["US-008", "US-020"],
      "root_cause": "/accounts row has only a hard-DELETE Disconnect; missing per-account Sync now, missing Reconnect, and Disconnect skips token revocation and deletes the row (breaks FK from historical tasks).",
      "files_to_edit": [
        "apps/web/src/app/(app)/accounts/page.tsx",
        "apps/web/src/app/api/accounts/[id]/sync/route.ts",
        "apps/web/src/app/api/accounts/[id]/disconnect/route.ts"
      ],
      "proposed_change": "Add Sync now (POST → invoke sync-email edge fn with account_id) with syncing pill state; add Reconnect link to /api/oauth/start when status !== active; convert Disconnect to a POST that revokes provider tokens (Google revoke endpoint) then UPDATEs status='disconnected' + nulls token columns (soft delete, FK preserved).",
      "priority": "P0"
    },
    {
      "cluster_id": "FIX-03",
      "resolves_stories": ["US-019"],
      "root_cause": "Landing page emits only one JSON-LD block (MobileApplication). SoftwareApplication and FAQPage blocks are missing entirely, breaking the rich-results promise.",
      "files_to_edit": ["apps/web/src/app/page.tsx"],
      "proposed_change": "Add softwareJsonLd (@type SoftwareApplication with aggregateRating + offers) and faqJsonLd (@type FAQPage with Q/A mainEntity array mirroring on-page FAQ). Render all three as separate <script type='application/ld+json'> blocks. Also derive MobileApplication.fileSize from fs.statSync at build time.",
      "priority": "P1"
    },
    {
      "cluster_id": "FIX-04",
      "resolves_stories": ["smoke-sitemap"],
      "root_cause": "/sitemap.xml throws — Next.js sitemap generator is hitting an unhandled error.",
      "files_to_edit": ["apps/web/src/app/sitemap.ts"],
      "proposed_change": "Wrap body in try/catch; on error log to console and return static fallback array of public routes (/, /signup, /login, /pricing, /privacy, /terms, /forgot-password).",
      "priority": "P1"
    },
    {
      "cluster_id": "FIX-05",
      "resolves_stories": ["smoke-reduced-motion"],
      "root_cause": "Animation components have zero prefers-reduced-motion handling.",
      "files_to_edit": [
        "apps/web/src/components/marketing/reveal.tsx",
        "apps/web/src/components/marketing/marquee-3d.tsx",
        "apps/web/src/components/marketing/sticky-scroll.tsx"
      ],
      "proposed_change": "Use useReducedMotion() from framer-motion; when true, short-circuit animations to render the static end state.",
      "priority": "P2"
    }
  ],
  "total_fixes": 5
}
```
