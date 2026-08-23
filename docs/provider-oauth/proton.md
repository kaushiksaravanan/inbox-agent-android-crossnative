# Proton Mail

> **Status: not implemented.** This doc captures the intended OAuth/IMAP design for proton support. The code path that would consume it does not exist yet — Gmail is the only provider wired today. References to endpoints like `/api/imap/connect` or env vars like `TOKEN_ENCRYPTION_KEY` reflect the v1 server-side architecture, which has been replaced by the local-first design (see [README.md](./README.md)). When this provider lands, the implementation will follow the [Gmail PKCE pattern](./gmail.md) — not the server-side IMAP path described below.


<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path fill="#6d4aff" d="M8 12l16 12 16-12v22a4 4 0 01-4 4H12a4 4 0 01-4-4V12z"/><path fill="#fff" opacity=".9" d="M8 12h32L24 24z"/></svg>

## At a glance

| Field            | Value                                                              |
|------------------|--------------------------------------------------------------------|
| Auth model       | **Proton Mail Bridge (local IMAP)** — no public OAuth or web IMAP  |
| IMAP host        | `127.0.0.1` (the user's own machine — Bridge runs locally)         |
| IMAP port        | `1143` (Bridge default)                                            |
| Security         | STARTTLS (Bridge uses a self-signed cert)                          |
| Username         | Full Proton address (`name@proton.me`)                             |
| Password         | Bridge-generated password (shown in the Bridge UI)                 |
| Refresh tokens   | N/A                                                                |
| Review timeline  | **Instant** — no Proton review (Bridge is a paid feature though)   |
| Env vars         | None                                                               |

## Why no OAuth, no remote IMAP?

Proton Mail is end-to-end encrypted. Their servers never see plaintext, so there is no way for a third-party server (like ours, running in a data center) to decrypt mail. **Proton Mail Bridge** is a desktop app that runs on the user's machine, holds their decryption keys locally, and exposes a localhost IMAP server. Any IMAP-aware client (including Inbox Agent — see below) can connect *only from that machine*.

**This means Inbox Agent cannot offer cloud-hosted Proton support.** A Proton user can only use Inbox Agent if:
- They run Inbox Agent locally (self-hosted / desktop app), **or**
- They tunnel Bridge to our infrastructure (we won't support this — it defeats Proton's threat model).

## Setup checklist (end-user flow)

1. User has a **paid Proton Mail** plan (Bridge is not available on the free tier).
2. Download [Proton Mail Bridge](https://proton.me/mail/bridge) for their OS.
3. Sign in to Bridge with their Proton credentials. Bridge fetches and decrypts their mailbox keys.
4. Bridge displays IMAP/SMTP credentials. They look like:
   ```
   Host:     127.0.0.1
   Port:     1143
   Username: name@proton.me
   Password: AbCdEf-GhIjKl-MnOpQr  (Bridge-generated; rotate from the UI)
   ```
5. The user installs Inbox Agent **on the same machine** as Bridge.
6. In Inbox Agent → Connect → Proton, the user pastes:
   - Email
   - Bridge password
7. Inbox Agent connects to `127.0.0.1:1143` and IMAP-syncs locally.

## Security warning shown to users

> **Proton Mail requires Proton Bridge.** Because Proton encrypts your mail end-to-end, only your own computer can decrypt it. Inbox Agent must be installed on the same machine as Proton Bridge — we cannot run this connection in the cloud. If you are using the hosted version of Inbox Agent at `inbox.agent`, Proton is not supported. Use the desktop or self-hosted version instead.

## v1 stance

For the cloud-hosted product, **Proton is not in scope for v1**. We display a "Coming with desktop app" note on the connect page. Document the constraint clearly so we don't field repeated support requests.

## IMAP folder mapping

When Bridge is reachable, Proton's IMAP exposes:

- `INBOX`
- `Sent`
- `Drafts`
- `Trash`
- `Spam`
- `Archive`
- `All Mail`
- `Folders/<custom>`
- `Labels/<custom>` (labels appear as folders containing copies)

Read-only access only. Bridge enforces user-side, but we should not issue STORE on `\Deleted` regardless.

## Known gotchas

- **Bridge self-signed cert**: clients must trust Bridge's local CA. Bridge installs it into the system trust store on install. Headless servers won't have a UI to accept the cert.
- **Port collisions**: Bridge defaults to 1143 (IMAP) and 1025 (SMTP) but lets users change them. Make our connect form ask for the port.
- **Multiple addresses**: a single Proton account can have many addresses (`@proton.me`, `@protonmail.com`, custom domains). Bridge exposes them as separate IMAP accounts with distinct usernames.
- **Account locked**: if the user's Proton password is reset, Bridge logs them out and rotates the Bridge password. Our cached creds become invalid; show a clear re-connect path.
- **Performance**: Bridge decrypts on the fly. Large message bodies are slow. Use BODYSTRUCTURE + BODY.PEEK[HEADER] for metadata-only sync.

## References

- [Proton Mail Bridge documentation](https://proton.me/support/protonmail-bridge-install)
- [Bridge IMAP/SMTP settings](https://proton.me/support/bridge-imap-smtp-settings)
