# Inbox Agent — Provider OAuth Setup

This directory documents how email providers integrate with Inbox Agent. **All integrations are READ-ONLY.** We never request write/send/delete scopes; the OAuth scope itself rejects mutations at Google's end.

## Status — actually shipped vs planned

| Provider | Status | Doc | Notes |
|---|---|---|---|
| Gmail | **shipped** | [gmail.md](./gmail.md) | PKCE in browser + signature-bound Android client |
| Outlook / Microsoft 365 | planned | [outlook.md](./outlook.md) | Same browser PKCE pattern, different client_id |
| iCloud | not started | [icloud.md](./icloud.md) | App-password + IMAP path, no native OAuth |
| Fastmail | not started | [fastmail.md](./fastmail.md) | XOAUTH2 / JMAP path |
| Yahoo Mail | not started | [yahoo.md](./yahoo.md) | OAuth2 |
| Proton Mail | not started | [proton.md](./proton.md) | Bridge IMAP only — Proton has no public mail API |
| Zoho Mail | not started | [zoho.md](./zoho.md) | OAuth2 |
| AOL | not started | [aol.md](./aol.md) | App-password + IMAP |
| Generic IMAP | not started | [generic-imap.md](./generic-imap.md) | User-supplied server config |

Each per-provider doc documents intended scopes and redirect URI conventions; the actual provider-side wiring still needs to land for everything except Gmail.

## How the Gmail flow actually works today

The flow is **local-first** — no server-side OAuth code path exists:

1. The browser (or Android app) builds a PKCE authorization URL with our public `client_id`.
2. User is redirected to Google's consent screen.
3. Google redirects back to `/oauth/google/callback` (web) or our app scheme (Android) with an authorization code.
4. The client exchanges the code for an access + refresh token by sending the PKCE `code_verifier`.
5. Tokens are stored encrypted on the device:
   - **Web:** AES-GCM ciphertext in IndexedDB, key is a non-extractable Web Crypto key.
   - **Mobile:** Android Keystore via `expo-secure-store`.
6. Subsequent Gmail API calls go from the device directly to `gmail.googleapis.com`. Our server never sees a token.

The `redirect_uri` whitelist is enforced by Google. A phishing site that copies our `client_id` cannot complete the flow because Google refuses to send the auth code to any URI not on our list.

## Required environment variables (current reality)

Old `.env` keys like `OAUTH_REDIRECT_URI_LOCAL`, `OAUTH_REDIRECT_URI_PROD`, `TOKEN_ENCRYPTION_KEY` are gone — they were used by the v1 server-side OAuth path which has been deleted. Today:

### Web (`apps/web/.env.local`)
```env
NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID=<your web client id>.apps.googleusercontent.com
```
That's it. No client_secret in the browser; PKCE replaces it on the wire.

### Mobile (`apps/mobile/.env.local`)
```env
GOOGLE_ANDROID_CLIENT_ID=<your android client id>.apps.googleusercontent.com
```
Android clients have no client_secret — Google binds the client to the APK SHA-1 signature.

## Adding a new provider

1. Get the provider's OAuth client credentials (Web or platform-native).
2. Add the provider's auth URL, token URL, and scopes to `apps/web/src/lib/gmail-oauth.ts` (or generalize that file — currently Gmail-specific).
3. Add a sender catalog entry for the provider's typical email shapes in `packages/shared/src/sender-catalog.ts` if relevant.
4. Update the supported-providers list on `/accounts`.
5. Update this table.

See [gmail.md](./gmail.md) for the reference implementation. The next provider to land is most likely Outlook — same browser PKCE pattern, different endpoints.
