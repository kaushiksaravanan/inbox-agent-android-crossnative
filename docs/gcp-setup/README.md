# Google Cloud Setup for Inbox Agent

## Status: web client configured ✓

The Web OAuth client is configured and the credential JSON lives at `.secrets/web-client.json` (gitignored). The `client_id` is wired into `apps/web/.env.local` as `NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID`.

End-to-end smoke verification done 2026-06-23: real PKCE flow round-trips through Google's consent screen (see `.secrets/oauth-smoke-google-signin.png`).

## What's done

- [x] GCP project created (`gen-lang-client-0376606873`)
- [x] OAuth consent screen partially configured
- [x] Web OAuth client (PKCE) — `889904689860-eat54ps895c66ro32f5qo3jb86sjj4na.apps.googleusercontent.com`
- [x] `client_id` wired into `apps/web/.env.local`
- [x] PKCE flow verified end-to-end against Google

## What's still required

- [ ] OAuth consent screen "App name" — currently says "Jot", should match the codebase (probably "Inbox Agent" — see [OAUTH-VERIFICATION-CHECKLIST.md](OAUTH-VERIFICATION-CHECKLIST.md) §0)
- [ ] Logo upload (120×120 PNG — three variants ready in `.secrets/oauth-assets/`)
- [ ] Domain verification once a live domain is registered
- [ ] **Android OAuth client** — different type than web, signature-bound. See [ANDROID-OAUTH.md](ANDROID-OAUTH.md)
- [ ] Production redirect URI added (currently only `localhost:3000` is whitelisted)
- [ ] Verification submission once the above are done (3–6 weeks review)

See [OAUTH-VERIFICATION-CHECKLIST.md](OAUTH-VERIFICATION-CHECKLIST.md) for the full submission flow.

## Scopes

The app requests exactly **one sensitive scope:**

- `https://www.googleapis.com/auth/gmail.readonly`

That's it. No `gmail.modify`, no `gmail.send`, no `gmail.compose`. The app physically cannot send, delete, or modify email — Google's API server enforces the scope at request time.

## Why no `client_secret` in the browser

The downloaded JSON file at `.secrets/web-client.json` includes a `client_secret` because Google generates one for every "Web application" client type. **The browser flow does not use it.** Instead:

1. The browser generates a 32-byte random `code_verifier` per OAuth attempt.
2. The SHA-256 hash (`code_challenge`) is sent with the authorization request.
3. After Google redirects back with an auth code, the original `code_verifier` is sent to the token endpoint.
4. Google verifies that `SHA-256(verifier) === challenge` and that the redirect URI is on the registered list.

This is PKCE (RFC 7636). It replaces the shared-secret model with a per-request proof-of-possession check. Anyone who decompiles our browser bundle gets only the `client_id` (public) and our redirect URI whitelist (public) — neither is usable from a different domain.

## Billing

Gmail API is **free** for normal usage:
- 1B quota units / day (account-wide)
- ~250 units / user / second
- `gmail.readonly` is rate-limit category B (cheaper than restricted scopes)

For the read-only path we ship, billing is not required and a credit card should **not** be attached to the project.

## File inventory

| File | Purpose |
|---|---|
| [ANDROID-OAUTH.md](ANDROID-OAUTH.md) | SHA-1 fingerprint binding setup for the second (Android) OAuth client |
| [OAUTH-VERIFICATION-CHECKLIST.md](OAUTH-VERIFICATION-CHECKLIST.md) | Step-by-step submission flow + asset prep |
| [PLAY-INTEGRITY-NOTES.md](PLAY-INTEGRITY-NOTES.md) | Play Integrity attestation for the Android client |
| `step-01-console.png` | Historical screenshot — Cloud Console sign-in (now superseded; kept for archive) |
