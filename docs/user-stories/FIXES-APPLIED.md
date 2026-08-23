# FIXES APPLIED

## FIX-01 — Auth error branching (US-002, US-004)
Files:
- apps/web/src/app/(auth)/signup/signup-form.tsx
- apps/web/src/app/(auth)/login/login-form.tsx

Before (signup):
```tsx
if (error) {
  setFormError(error.message);
  toast.error(error.message);
}
```
After (signup): branches on /already/i — sets `alreadyExists` state and renders a "Sign in instead" Link to `/login?email=…`.

Before (login):
```tsx
if (error) { setFormError(msg); toast.error(msg); }
```
After (login): branches on `Email not confirmed` — sets `needsConfirm`, renders a "Resend verification email" button that calls `supabase.auth.resend({ type: 'signup' })`, debounced 30s via a `resendCooldown` countdown. Login now also prefills email from `?email=` query param.

## FIX-02 — Accounts page sync/reconnect/soft-disconnect (US-008, US-020)
Files:
- apps/web/src/app/(dashboard)/accounts/page.tsx (path corrected — repo uses (dashboard), not (app))
- apps/web/src/app/(dashboard)/accounts/account-row-actions.tsx (new client component)
- apps/web/src/app/api/accounts/[id]/sync/route.ts (new — POST invokes sync-email edge fn for the single account)
- apps/web/src/app/api/accounts/[id]/disconnect/route.ts (new — revokes Google token, UPDATEs status='disconnected', nulls token cols)

Before (server action):
```ts
await supabase.from("email_accounts").delete().eq("id", id)...
```
After: soft-disconnect — UPDATE status='disconnected' + null access_token/refresh_token/token_expires_at. Preserves FK from historical tasks. Client component adds per-row "Sync now" (active accounts) and "Reconnect" link (non-active) to `/api/oauth/start?provider=...`.

## FIX-03 — JSON-LD blocks (US-019)
File: apps/web/src/app/page.tsx

Before: single MobileApplication block, hardcoded fileSize.
After: three separate `<script type="application/ld+json">` blocks — MobileApplication (fileSize derived from `statSync` of the APK at build time), SoftwareApplication (with aggregateRating + AggregateOffer), FAQPage (mainEntity mirrors COPY.faq + the three hardcoded FAQs from landing-content).

## FIX-04 — Sitemap fallback (smoke-sitemap)
File: apps/web/src/app/sitemap.ts

Before: no error handling.
After: body wrapped in try/catch. On error, logs to console and returns FALLBACK_PUBLIC_ROUTES (/, /signup, /login, /pricing, /privacy, /terms, /forgot-password).

## FIX-05 — Reduced motion (smoke-reduced-motion)
Files:
- apps/web/src/components/reveal.tsx (path corrected — repo uses /components/, not /components/marketing/)
- apps/web/src/components/marquee-3d.tsx (already had useReducedMotion — verified)
- apps/web/src/components/sticky-scroll.tsx (already had useReducedMotion — verified)

Before (reveal): no reduced-motion check.
After: imports `useReducedMotion` from `motion/react`. When true, short-circuits the IntersectionObserver and sets `shown=true` immediately, rendering the static end state.
