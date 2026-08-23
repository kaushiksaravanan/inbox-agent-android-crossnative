# Generic IMAP

> **Status: not implemented.** This doc captures the intended OAuth/IMAP design for generic-imap support. The code path that would consume it does not exist yet — Gmail is the only provider wired today. References to endpoints like `/api/imap/connect` or env vars like `TOKEN_ENCRYPTION_KEY` reflect the v1 server-side architecture, which has been replaced by the local-first design (see [README.md](./README.md)). When this provider lands, the implementation will follow the [Gmail PKCE pattern](./gmail.md) — not the server-side IMAP path described below.


<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><rect width="40" height="28" x="4" y="10" fill="#546e7a" rx="3"/><path fill="#fff" d="M8 14h32v4H8zM8 22h24v2H8zM8 26h20v2H8zM8 30h28v2H8z"/></svg>

## At a glance

| Field            | Value                                                              |
|------------------|--------------------------------------------------------------------|
| Auth model       | IMAP with user-supplied host/port/credentials                      |
| Required perms   | Read folders (we never STORE / EXPUNGE)                            |
| IMAP host        | User-supplied                                                      |
| IMAP port        | User-supplied (default 993)                                        |
| Security         | User-supplied (TLS / STARTTLS / plain — plain only over localhost) |
| Username         | User-supplied                                                      |
| Password         | User-supplied (regular password or app password)                   |
| Refresh tokens   | N/A                                                                |
| Review timeline  | N/A                                                                |
| Env vars         | None                                                               |

## When to use

Generic IMAP is the **fallback** for any provider not in the supported list — corporate Exchange behind on-prem IMAP, Mailbox.org, Tutanota (when bridged), Posteo, Migadu, Rackspace, Soverin, Runbox, Mail.ru, GMX, Web.de, T-Online, Mailfence, StartMail, hosting-provider mailboxes (cPanel/Plesk), etc.

We make no claim about deliverability quirks. The user is responsible for finding their provider's IMAP settings.

## Connect form fields

```
Display name      (optional, for the UI)        e.g. "Work email"
Email address     (required)                    e.g. "user@example.com"
IMAP server       (required)                    e.g. "imap.example.com"
IMAP port         (default 993)                 993 | 143 | other
Security          (TLS | STARTTLS | None)       default TLS
Username          (defaults to email)
Password          (required)
```

We probe the connection before saving:
1. Open TCP to `{host}:{port}`.
2. Negotiate TLS/STARTTLS per choice.
3. `LOGIN {user} {pass}` (or `AUTHENTICATE PLAIN` if the server advertises it).
4. `LIST "" "*"` — verify at least `INBOX` exists.
5. On any failure show a precise message (which step failed).

## Auto-discovery (nice-to-have, post-v1)

Many providers publish [Autoconfig](https://wiki.mozilla.org/Thunderbird:Autoconfiguration) XML at `https://autoconfig.{domain}/mail/config-v1.1.xml` or have records at `https://autoconfig.thunderbird.net/v1.1/{domain}`. We can prefill the form by querying these. Also try SRV records: `_imaps._tcp.{domain}`.

## Common provider presets (preload as suggestions)

| Provider     | Host                          | Port | Sec    |
|--------------|-------------------------------|------|--------|
| Mailbox.org  | `imap.mailbox.org`            | 993  | TLS    |
| Posteo       | `posteo.de`                   | 993  | TLS    |
| Migadu       | `imap.migadu.com`             | 993  | TLS    |
| Mail.ru      | `imap.mail.ru`                | 993  | TLS    |
| GMX          | `imap.gmx.com`                | 993  | TLS    |
| Web.de       | `imap.web.de`                 | 993  | TLS    |
| T-Online     | `secureimap.t-online.de`      | 993  | TLS    |
| Mailfence    | `imap.mailfence.com`          | 993  | TLS    |
| StartMail    | `imap.startmail.com`          | 993  | TLS    |
| Rackspace    | `secure.emailsrvr.com`        | 993  | TLS    |
| Runbox       | `mail.runbox.com`             | 993  | TLS    |
| Soverin      | `mail.soverin.net`            | 993  | TLS    |
| cPanel host  | `mail.{domain}`               | 993  | TLS    |

(These are convenience hints. Always let the user override.)

## Security notes

- We store the password encrypted with `TOKEN_ENCRYPTION_KEY` (AES-GCM, 32-byte key).
- We never log the password — redact in error reporting.
- We surface a strong warning if the user picks **No encryption** (`PLAINTEXT`): only allowed if host is `127.0.0.1` or `localhost`, with a checkbox confirming "I understand this connection is unencrypted".
- Self-signed certs: user can opt in via an explicit "Trust self-signed certificate" toggle. We pin the fingerprint after first use; further mismatches require explicit re-approval.

## Known gotchas

- **`AUTHENTICATIONFAILED`** vs **`AUTHENTICATIONFAILED [WEBALERT]`**: some providers (notably Google, Yahoo) return this when a plain IMAP login is attempted against an account that requires app-password. Detect and link to our provider-specific docs.
- **NTLM / GSSAPI**: some Exchange-on-prem servers require NTLM. Not supported in v1.
- **STARTTLS downgrade attacks**: enforce `STARTTLS` capability before sending credentials. Fail-closed.
- **Folder delimiters**: `/` is most common; `.` (cyrus) and `^` (older Courier) also exist. We canonicalize.
- **Quotas**: Some IMAP servers return `[OVERQUOTA]`. Surface this clearly so the user knows it's not us.
- **Encoding**: modified UTF-7 for folder names per RFC 3501. Decode before display.

## References

- [RFC 3501 — IMAP4rev1](https://datatracker.ietf.org/doc/html/rfc3501)
- [RFC 9051 — IMAP4rev2](https://datatracker.ietf.org/doc/html/rfc9051)
- [Mozilla Autoconfig](https://wiki.mozilla.org/Thunderbird:Autoconfiguration)
