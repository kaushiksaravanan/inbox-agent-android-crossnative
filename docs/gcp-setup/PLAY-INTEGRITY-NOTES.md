# Play Integrity is for Play Store installs only

## Summary

We wired Google Play Integrity API into the Android app to optionally
attest that the running APK is a genuine, unmodified Play Store install.
This is a **best-effort signal, not a hard gate**.

## The trade-off

Play Integrity's `appIntegrity` verdict can only return `PLAY_RECOGNIZED`
for apps that were installed through the Google Play Store. When a user
sideloads our APK — which our $49 one-time-purchase model actively
encourages for users who don't want to go through Play — the verdict
will be one of:

- `UNRECOGNIZED_VERSION` — APK signature doesn't match what Play has on record
- `UNEVALUATED` — Play can't reach a verdict (no Play Services, no Play account, etc.)
- An outright error from `prepareIntegrityToken` / `request`

This is **expected and fine** for sideloaded users. It is not a security
failure on their part.

## How we use it

Play Integrity is a *trust booster*, not a gatekeeper:

- If `getIntegrityToken(nonce)` returns a token and the backend verifies
  `appIntegrity == PLAY_RECOGNIZED`, we know with high confidence the
  caller is a legitimate Play install. Great — extra trust.
- If `getIntegrityToken(nonce)` returns `null`, or the verdict is not
  `PLAY_RECOGNIZED`, we **still proceed with the Gmail API call as
  normal**. The SHA-1 certificate binding on the OAuth client is already
  sufficient to prove the APK was signed with our release key. Play
  Integrity adds defence in depth, not a new dependency.

Concretely, the helper at `apps/mobile/src/lib/integrity.ts`:

- Returns `null` on iOS and web.
- Returns `null` when the native module is missing.
- Returns `null` when `prepareIntegrityToken` / `request` throws (e.g.
  no Play Services, sideloaded device with no Play account, network
  failure).
- The caller never blocks on this — it's purely additive.

## Current state

The native plumbing is shipped:

- `android/app/build.gradle` — adds `com.google.android.play:integrity:1.4.0`
  and exposes `BuildConfig.GCP_PROJECT_NUMBER` (populated from the
  `gcp.projectNumber` Gradle property).
- `IntegrityModule.kt` / `IntegrityPackage.kt` — React Native native
  module `InboxIntegrity` with `requestIntegrityToken(nonce)`.
- `MainApplication.kt` — registers `IntegrityPackage()`.
- `apps/mobile/src/lib/integrity.ts` — TS wrapper with graceful
  fallbacks.

**Play Integrity is NOT yet wired into the Gmail API call path.** We
deliberately stopped at the plumbing layer because wiring it in today
would break sideloaded users (the very audience the pricing model is
designed for). We will revisit later and decide whether to require a
`PLAY_RECOGNIZED` verdict only for premium Play Store users, while
leaving sideloaded users on the SHA-1-only path.

## Status on the security page

Mark Play Integrity as **optional / best-effort** on the public
security page. Do not market it as a hard guarantee that every Gmail
call is from a Play Store install — that is not what it does for our
distribution model.
