# Fastmail

> **Status: not implemented.** This doc captures the intended OAuth/IMAP design for fastmail support. The code path that would consume it does not exist yet — Gmail is the only provider wired today. References to endpoints like `/api/imap/connect` or env vars like `TOKEN_ENCRYPTION_KEY` reflect the v1 server-side architecture, which has been replaced by the local-first design (see [README.md](./README.md)). When this provider lands, the implementation will follow the [Gmail PKCE pattern](./gmail.md) — not the server-side IMAP path described below.


<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><rect width="40" height="32" x="4" y="8" fill="#2c6cd1" rx="4"/><path fill="#fff" d="M14 18l10 7 10-7v-2H14z"/><path fill="#fff" d="M14 18v14h20V18l-10 7z" opacity=".85"/></svg>

## At a glance

| Field            | Value                                                              |
|------------------|--------------------------------------------------------------------|
| Auth model       | OAuth 2.0 (Bearer) over JMAP, or XOAUTH2 over IMAP                 |
| Scopes (READ-ONLY) | `urn:ietf:params:jmap:mail` (read-only via API token restrictions) |
| Authorize URL    | `https://api.fastmail.com/oauth/authorize`                         |
| Token URL        | `https://api.fastmail.com/oauth/refresh`                           |
| Refresh tokens   | Yes                                                                |
| Access token TTL | ~30 days                                                           |
| Review timeline  | **Instant** — self-service developer registration                  |
| Env vars         | `FASTMAIL_CLIENT_ID`, `FASTMAIL_CLIENT_SECRET`                     |

## Required scopes (read-only)

Fastmail uses the JMAP capability URI scheme. We request:

- `https://www.fastmail.com/dev/protocol-imap` — IMAP access (XOAUTH2).
- `urn:ietf:params:jmap:mail` — JMAP mail read.

When configuring the OAuth client, restrict the API token type to **Read-only**. Fastmail's authorize UI shows users a clear "Inbox Agent will be able to read your mail" string.

## Setup checklist

1. Sign in to Fastmail.
2. Go to **Settings → Privacy & Security → Connected apps & API tokens → Developer apps**.
3. Click **New app**:
   - Name: `Inbox Agent`
   - Description: `Read-only inbox triage assistant.`
   - Homepage: `https://inbox.agent`
   - Redirect URIs:
     - `http://localhost:3000/api/oauth/callback`
     - `https://inbox.agent/api/oauth/callback`
4. Choose **Confidential client** (we have a backend that can hold a secret).
5. Select required capabilities: `urn:ietf:params:jmap:mail`, `https://www.fastmail.com/dev/protocol-imap`.
6. Copy the generated **Client ID** and **Client Secret** into `.env.local`.

## Authorize URL params

```
client_id={FASTMAIL_CLIENT_ID}
redirect_uri={OAUTH_REDIRECT_URI}
response_type=code
scope=urn:ietf:params:jmap:mail https://www.fastmail.com/dev/protocol-imap
state={signed_state}
code_challenge={pkce_S256}
code_challenge_method=S256
```

## Two paths after the token exchange

1. **JMAP** (preferred long-term): use the `Authorization: Bearer {access_token}` header against `https://api.fastmail.com/jmap/api/`. JMAP gives us proper deltas via `Email/changes`.
2. **IMAP via XOAUTH2** (compatibility): connect to `imap.fastmail.com:993`, authenticate with SASL `XOAUTH2` mechanism using the access token. This is how we cover users whose Fastmail account predates JMAP everywhere.

```
Host:     imap.fastmail.com
Port:     993
Security: SSL/TLS
Auth:     XOAUTH2 with bearer token
```

## Token refresh

- Access tokens last ~30 days but Fastmail recommends refreshing daily.
- `POST https://api.fastmail.com/oauth/refresh` with `grant_type=refresh_token`, `client_id`, `client_secret`, `refresh_token`.
- Refresh tokens are rotated on every refresh — store the new one immediately.

## "JWT app password" mode

Fastmail also supports a hybrid where the user generates an **app password** that is technically a JWT scoped to specific capabilities. This is a manual fallback for users who can't or won't run the OAuth dance:

1. User visits **Settings → Privacy & Security → App passwords → New app password**.
2. Restricts scope to **IMAP, read-only**.
3. Pastes the resulting password into Inbox Agent's "Fastmail manual" form.
4. We use it as the IMAP password (no XOAUTH2 needed).

Use this only as a last resort — OAuth is the supported path.

## Known gotchas

- **Token rotation**: Fastmail invalidates the old refresh token immediately on refresh. If your DB write fails after a successful refresh, the user is locked out and must re-connect. Use a transactional pattern: persist *then* return.
- **Scope strings must match exactly** between authorize and token exchange. Even ordering matters in some Fastmail SDK versions.
- **Custom domains**: Fastmail-hosted custom domains work transparently — same `imap.fastmail.com` host.
- **EU residency**: tokens issued by the EU region (`api.eu.fastmail.com`) cannot be used against the global endpoint. Detect via the `aud` claim in the token.
- **Rate limits**: 100 JMAP requests per minute per token; IMAP is unmetered but ~30 concurrent connections per account.

## References

- [Fastmail JMAP](https://www.fastmail.com/for-developers/integrating-with-fastmail/)
- [Fastmail OAuth blog post](https://www.fastmail.com/blog/oauth-jmap/)
- [JMAP spec — RFC 8620 / 8621](https://datatracker.ietf.org/doc/html/rfc8621)
