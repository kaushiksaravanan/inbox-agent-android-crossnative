# Yahoo Mail

> **Status: not implemented.** This doc captures the intended OAuth/IMAP design for yahoo support. The code path that would consume it does not exist yet — Gmail is the only provider wired today. References to endpoints like `/api/imap/connect` or env vars like `TOKEN_ENCRYPTION_KEY` reflect the v1 server-side architecture, which has been replaced by the local-first design (see [README.md](./README.md)). When this provider lands, the implementation will follow the [Gmail PKCE pattern](./gmail.md) — not the server-side IMAP path described below.


<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path fill="#6001d2" d="M24 4C12.954 4 4 12.954 4 24s8.954 20 20 20 20-8.954 20-20S35.046 4 24 4z"/><path fill="#fff" d="M22.2 30.5h3.6V34h-3.6zM12 14h4.8l4.5 11 4.5-11h4.5l-7.5 17.5h-3.6L19.4 27z"/></svg>

## At a glance

| Field            | Value                                                              |
|------------------|--------------------------------------------------------------------|
| Auth model       | OAuth 2.0 (Yahoo Developer Network)                                |
| Scopes (READ-ONLY) | `mail-r` (read mail) + `openid` + `profile`                      |
| Authorize URL    | `https://api.login.yahoo.com/oauth2/request_auth`                  |
| Token URL        | `https://api.login.yahoo.com/oauth2/get_token`                     |
| Refresh tokens   | Yes                                                                |
| Access token TTL | 1 hour                                                             |
| Review timeline  | **~48 hours** for production approval                              |
| Env vars         | `YAHOO_CLIENT_ID`, `YAHOO_CLIENT_SECRET`                           |

## Required scopes (read-only)

- `mail-r` — read access to mail. There is no `mail-w` / `mail-rw` split in our request — we don't ask for write.
- `openid` + `profile` — identify the user, fetch display name/email.

## Setup checklist

1. Go to [Yahoo Developer Network](https://developer.yahoo.com/apps/).
2. Sign in with the Yahoo account you want to own the app.
3. **Create an App**:
   - Application Name: `Inbox Agent`
   - Description: `Read-only inbox triage assistant.`
   - Homepage URL: `https://inbox.agent`
   - Redirect URI(s):
     - `http://localhost:3000/api/oauth/callback`
     - `https://inbox.agent/api/oauth/callback`
   - Application Type: **Web Application** → **Confidential Client**.
   - API Permissions: check **Mail → Read**.
4. Click **Create App**. Copy:
   - Client ID (Consumer Key) → `YAHOO_CLIENT_ID`
   - Client Secret (Consumer Secret) → `YAHOO_CLIENT_SECRET`
5. Submit for review when ready to go beyond the 100-test-user cap:
   - Provide a screencast of the OAuth flow.
   - Provide privacy + terms URLs.
   - Yahoo's review team takes **~48 hours** in our experience.

## Authorize URL params

```
client_id={YAHOO_CLIENT_ID}
redirect_uri={OAUTH_REDIRECT_URI}
response_type=code
scope=openid profile mail-r
state={signed_state}
code_challenge={pkce_S256}
code_challenge_method=S256
nonce={random_nonce}
```

## Token refresh

- `POST https://api.login.yahoo.com/oauth2/get_token`
- `grant_type=refresh_token`, `refresh_token=...`, plus `client_id` + `client_secret` (or HTTP Basic auth).
- Refresh tokens don't expire by time but are revoked when the user changes password or revokes the app at [yahoo.com/account/permissions](https://login.yahoo.com/account/permissions).

## Reading mail

Yahoo deprecated their custom Mail API in 2017. The supported path now is **IMAP over XOAUTH2**:

```
Host:     imap.mail.yahoo.com
Port:     993
Security: SSL/TLS
Auth:     XOAUTH2 with bearer access token
Username: full Yahoo email
```

So the flow is: OAuth → access token → use as XOAUTH2 IMAP password → refresh hourly.

## Known gotchas

- **No JMAP, no REST mail API**. IMAP is the only read path.
- **Sub-accounts**: Yahoo accounts can have multiple "From" identities; IMAP exposes them all under one INBOX.
- **AT&T / SBCGlobal / BellSouth / Ameritech** accounts: same `imap.mail.yahoo.com` host but the username is the full legacy address (`name@att.net`, `name@sbcglobal.net`).
- **Rocketmail / Ymail**: same as above, same host.
- **Display of `state`**: Yahoo's authorize page sometimes URL-decodes `state` weirdly. Stick to URL-safe base64 — no `=`, `+`, `/`.
- **Verification turnaround**: Yahoo emails the app owner; check spam. Approvals come from `noreply@yahoo-inc.com`.
- **Production vs Sandbox**: there is no formal sandbox. The 100-test-user limit applies until approved.

## References

- [Yahoo OAuth 2.0 guide](https://developer.yahoo.com/oauth2/guide/)
- [Yahoo Mail IMAP settings](https://help.yahoo.com/kb/SLN4075.html)
