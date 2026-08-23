# Zoho Mail

> **Status: not implemented.** This doc captures the intended OAuth/IMAP design for zoho support. The code path that would consume it does not exist yet — Gmail is the only provider wired today. References to endpoints like `/api/imap/connect` or env vars like `TOKEN_ENCRYPTION_KEY` reflect the v1 server-side architecture, which has been replaced by the local-first design (see [README.md](./README.md)). When this provider lands, the implementation will follow the [Gmail PKCE pattern](./gmail.md) — not the server-side IMAP path described below.


<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><rect width="40" height="32" x="4" y="8" fill="#c8202f" rx="4"/><path fill="#fff" d="M14 14h20l-10 10z"/><path fill="#fff" opacity=".9" d="M4 12v22a4 4 0 004 4h32a4 4 0 004-4V12L24 26z"/></svg>

## At a glance

| Field            | Value                                                              |
|------------------|--------------------------------------------------------------------|
| Auth model       | OAuth 2.0 (Zoho Accounts)                                          |
| Scopes (READ-ONLY) | `ZohoMail.messages.READ`, `ZohoMail.folders.READ`, `ZohoMail.accounts.READ` |
| Authorize URL    | `https://accounts.zoho.{region}/oauth/v2/auth`                     |
| Token URL        | `https://accounts.zoho.{region}/oauth/v2/token`                    |
| Refresh tokens   | Yes (non-expiring as long as used periodically)                    |
| Access token TTL | 1 hour                                                             |
| Review timeline  | **Instant** — no review                                            |
| Env vars         | `ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`, `ZOHO_REGION`              |

`{region}` is one of `com`, `eu`, `in`, `com.au`, `jp`. The region must match the user's Zoho data residency — we detect at connect time and re-route.

## Required scopes (read-only)

- `ZohoMail.messages.READ` — read mail content.
- `ZohoMail.folders.READ` — list folders.
- `ZohoMail.accounts.READ` — list the user's Zoho Mail accounts (for users with multiple).

Comma-separated in the `scope` parameter, e.g. `scope=ZohoMail.messages.READ,ZohoMail.folders.READ,ZohoMail.accounts.READ`.

## Setup checklist

1. Go to [Zoho API Console](https://api-console.zoho.com/) for each region you support (start with `.com`).
2. **Add Client** → **Server-based Applications**.
3. Fill in:
   - Client Name: `Inbox Agent`
   - Homepage URL: `https://inbox.agent`
   - Authorized Redirect URIs:
     - `http://localhost:3000/api/oauth/callback`
     - `https://inbox.agent/api/oauth/callback`
4. Click **Create**. Copy:
   - Client ID → `ZOHO_CLIENT_ID`
   - Client Secret → `ZOHO_CLIENT_SECRET`
5. Repeat for each region you intend to support (`accounts.zoho.eu`, `accounts.zoho.in`, etc.). Zoho will issue **different** client IDs per region — store them as `ZOHO_CLIENT_ID_EU`, etc., and pick one based on the user's chosen region.

## Authorize URL params

```
client_id={ZOHO_CLIENT_ID}
scope=ZohoMail.messages.READ,ZohoMail.folders.READ,ZohoMail.accounts.READ
redirect_uri={OAUTH_REDIRECT_URI}
response_type=code
access_type=offline           # required for refresh_token
prompt=consent
state={signed_state}
```

Zoho does not (yet) require PKCE for confidential clients but it's supported — include it.

## Token refresh

- `POST https://accounts.zoho.{region}/oauth/v2/token` with `grant_type=refresh_token`.
- Refresh tokens **do not expire** as long as they're used at least once every 60 days.
- If the user revokes from [accounts.zoho.com/u/h#sessions/userauthtoken](https://accounts.zoho.com/u/h#sessions/userauthtoken), refresh returns `invalid_code`.

## Reading mail

Zoho Mail offers a [Mail API](https://www.zoho.com/mail/help/api/) — use it instead of IMAP for richer features.

- Base: `https://mail.zoho.{region}/api/`
- List accounts: `GET /accounts`
- List messages in a folder: `GET /accounts/{accountId}/messages/view`
- Fetch a message: `GET /accounts/{accountId}/folders/{folderId}/messages/{messageId}`

Auth header: `Authorization: Zoho-oauthtoken {access_token}` (note: it's `Zoho-oauthtoken`, not `Bearer`).

IMAP is also available at `imap.zoho.{region}:993` with XOAUTH2 if you prefer compatibility.

## Known gotchas

- **Region routing**: a `.com` token will not work against `.eu`. Always store the region with the token. If unknown, hit `accounts.zoho.com` first; if the user is on a different DC, Zoho returns a redirect with the correct host.
- **`Zoho-oauthtoken` header**: not `Bearer`. Easy to miss.
- **Free tier**: Zoho Mail's free plan does not include API access. Users must be on a paid plan or have a TrueMail trial — surface a helpful error if the API returns "API access denied".
- **Throttling**: 200 API calls per user per day on the lowest paid tier. Use IMAP IDLE for ongoing sync.
- **Custom domain users**: Zoho-hosted custom domains work the same way; the account email is the custom-domain address.
- **Two redirect URIs at once**: Zoho allows multiple, but they must each be added explicitly. Wildcards are not supported.

## References

- [Zoho OAuth 2.0 overview](https://www.zoho.com/accounts/protocol/oauth.html)
- [Zoho Mail API](https://www.zoho.com/mail/help/api/)
