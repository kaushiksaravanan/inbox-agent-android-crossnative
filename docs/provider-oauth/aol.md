# AOL Mail

> **Status: not implemented.** This doc captures the intended OAuth/IMAP design for aol support. The code path that would consume it does not exist yet — Gmail is the only provider wired today. References to endpoints like `/api/imap/connect` or env vars like `TOKEN_ENCRYPTION_KEY` reflect the v1 server-side architecture, which has been replaced by the local-first design (see [README.md](./README.md)). When this provider lands, the implementation will follow the [Gmail PKCE pattern](./gmail.md) — not the server-side IMAP path described below.


<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><rect width="40" height="32" x="4" y="8" fill="#000" rx="4"/><path fill="#1aa3ff" d="M10 30l5-12 5 12-2-4h-6zM24 18a6 6 0 100 12 6 6 0 000-12zm0 9a3 3 0 110-6 3 3 0 010 6zM34 18h3v12h-3zM39 18h3v12h-3z"/></svg>

## At a glance

| Field            | Value                                                              |
|------------------|--------------------------------------------------------------------|
| Auth model       | **App password + IMAP** (Yahoo OAuth doesn't cover AOL)            |
| IMAP host        | `imap.aol.com`                                                     |
| IMAP port        | `993` (TLS / implicit SSL)                                         |
| Username         | Full AOL email (`name@aol.com`, `@aim.com`, `@love.com`, etc.)     |
| Password         | App password (16 chars)                                            |
| Refresh tokens   | N/A                                                                |
| Review timeline  | **Instant** — no review                                            |
| Env vars         | None                                                               |

## Why no OAuth?

AOL is owned by Yahoo (now Apollo / Yahoo Inc.), but the [Yahoo OAuth Developer Console](https://developer.yahoo.com/apps/) does not expose AOL Mail scopes. The only supported third-party access path is IMAP with an app password.

## Setup checklist (end-user flow)

1. Sign in at [login.aol.com](https://login.aol.com).
2. Account Info → **Account Security**.
3. Under **App passwords** click **Generate app password** (or **Manage app passwords**).
4. Pick **Other app**, name it `Inbox Agent`, click **Generate**.
5. AOL shows a 16-character password. Copy it — it's not shown again.
6. In Inbox Agent → Connect → AOL, paste:
   - Email
   - App password
7. We attempt an IMAP login against `imap.aol.com:993` and on success store the credentials encrypted.

## Security warning shown to users

> **AOL Mail doesn't support OAuth.** To connect, AOL requires you to generate an *app password*. This password is specific to Inbox Agent — you can revoke it anytime from your AOL Account Security page. We store it encrypted at rest and use it only to read your mail over IMAP.

## IMAP details

```
Host:     imap.aol.com
Port:     993
Security: SSL/TLS (implicit)
Auth:     LOGIN
Username: full email
Password: app password (no dashes; AOL displays it without separators)
```

Common AOL domains: `@aol.com`, `@aim.com`, `@love.com`, `@games.com`, `@ygm.com`, `@wow.com`, `@netscape.net`, `@cs.com`, `@compuserve.com`. All route to `imap.aol.com`.

## Known gotchas

- **2FA required for app passwords**: same as iCloud/Yahoo. If the user doesn't have 2FA, the "Generate app password" option is hidden.
- **Plain password rejected**: AOL silently rejects regular passwords over IMAP (`[AUTHENTICATIONFAILED] AUTHENTICATE`). Show app-password instructions on first failure.
- **Verizon.net / sbcglobal.net carryover**: some legacy Verizon and ATT users were migrated to AOL infra. They still use `imap.aol.com` but their username is the legacy address.
- **IDLE support**: yes — works reliably.
- **Folder names**: `Inbox`, `Sent`, `Drafts`, `Spam`, `Trash`, `Archive` plus user folders. All read-only on our side.
- **Rate limit**: ~15 concurrent connections per account; not officially published.

## References

- [AOL — Use app passwords](https://help.aol.com/articles/Create-and-manage-app-password)
- [AOL Mail IMAP settings](https://help.aol.com/articles/how-do-i-use-other-email-applications-such-as-thunderbird-outlook-or-mac-mail-to-send-and-receive-my-aol-mail)
