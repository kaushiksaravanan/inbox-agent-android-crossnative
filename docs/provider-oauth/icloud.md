# Apple iCloud Mail

> **Status: not implemented.** This doc captures the intended OAuth/IMAP design for icloud support. The code path that would consume it does not exist yet — Gmail is the only provider wired today. References to endpoints like `/api/imap/connect` or env vars like `TOKEN_ENCRYPTION_KEY` reflect the v1 server-side architecture, which has been replaced by the local-first design (see [README.md](./README.md)). When this provider lands, the implementation will follow the [Gmail PKCE pattern](./gmail.md) — not the server-side IMAP path described below.


<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path fill="#90caf9" d="M37.5,38h-26C5.71,38,1,33.29,1,27.5c0-5.018,3.541-9.224,8.256-10.247C10.149,9.939,16.418,4,24,4c7.054,0,12.997,5.146,14.153,11.969C43.094,16.846,47,21.213,47,26.5C47,32.842,41.842,38,37.5,38z"/></svg>

## At a glance

| Field            | Value                                                              |
|------------------|--------------------------------------------------------------------|
| Auth model       | **App-specific password + IMAP** (no OAuth available)              |
| Required perms   | Read access to IMAP folders (selected at connect time)             |
| IMAP host        | `imap.mail.me.com`                                                 |
| IMAP port        | `993` (TLS / implicit SSL)                                         |
| Username         | Full iCloud email (`name@icloud.com`, `@me.com`, or `@mac.com`)    |
| Password         | App-specific password (16 chars, dash-separated)                   |
| Refresh tokens   | N/A — app password is reusable until user revokes it               |
| Review timeline  | **Instant** — no Apple review                                      |
| Env vars         | None (credentials are user-supplied)                               |

## Why no OAuth?

Apple does not publish a public OAuth 2.0 endpoint for iCloud Mail. "Sign in with Apple" is only for app login, not for granting mailbox access to third parties. IMAP + app-specific password is the only supported path.

## Setup checklist (end-user flow)

This is what the user does, not what we do as developers. The Inbox Agent `/connect/icloud` page walks them through it.

1. **Enable two-factor authentication** on their Apple ID. App-specific passwords are only available with 2FA. (https://account.apple.com → Sign-In and Security)
2. Sign in at [account.apple.com](https://account.apple.com).
3. Under **Sign-In and Security** → **App-Specific Passwords** → **+ Generate an app-specific password**.
4. Label it `Inbox Agent`.
5. Apple displays a password like `abcd-efgh-ijkl-mnop`. **Copy it now** — Apple does not show it again.
6. In Inbox Agent, enter:
   - Email: `name@icloud.com`
   - App password: `abcd-efgh-ijkl-mnop`
7. We POST these to `/api/imap/connect`, attempt an IMAP login against `imap.mail.me.com:993`, and on success store the credentials encrypted with `TOKEN_ENCRYPTION_KEY`.

## Security warning shown to users

> **Heads up — iCloud Mail does not support OAuth.** To connect your iCloud account, Apple requires you to create an *app-specific password*. This is a one-time password that only works with Inbox Agent and can be revoked anytime from your Apple ID account page. Inbox Agent stores this password encrypted at rest. It is never displayed back to you and is only used to read your mail over IMAP.

We surface a link to the Apple support article and a "Revoke this password" link to `appleid.apple.com`.

## IMAP details

```
Host:     imap.mail.me.com
Port:     993
Security: SSL/TLS (implicit)
Auth:     LOGIN
Username: full email address (case-insensitive)
Password: 16-char app-specific password (dashes optional — strip them before sending)
```

iCloud's IMAP folder structure:

- `INBOX`
- `Sent Messages`
- `Drafts`
- `Deleted Messages`
- `Archive`
- `Junk` (spam)
- Custom user folders

We only **read** from `INBOX` (and optionally `Archive`) — never set `\Deleted`, never `APPEND`, never `EXPUNGE`.

## Known gotchas

- **`AUTHENTICATIONFAILED`**: usually means the user pasted their iCloud password instead of the app-specific password. Detect this and re-show the app-password instructions.
- **2FA not enabled**: Apple silently rejects logins without showing a useful error. Pre-check by hitting `https://idmsa.apple.com/appleauth/auth/signin` is over-engineering; better to show a checklist UI.
- **`@me.com` / `@mac.com` aliases**: these all work with `imap.mail.me.com`. The username sent over IMAP should be the alias the user typed, not the canonical `@icloud.com` address.
- **Hide My Email aliases**: forwarded into the same iCloud mailbox; nothing special required.
- **Rate limits**: Apple does not publish them. In practice ~20 concurrent connections per account; back off on `[INUSE]` responses.
- **iCloud+ Custom Domain**: same IMAP host, same flow. The username is the custom-domain address (e.g. `you@yourdomain.com`).
- **IDLE support**: yes — use it for push-style sync; fall back to 5-minute polling on connection drop.

## References

- [Apple — Sign in to your email app with iCloud Mail](https://support.apple.com/en-us/HT202304)
- [Apple — App-specific passwords](https://support.apple.com/en-us/HT204397)
