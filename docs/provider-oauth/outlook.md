# Outlook / Microsoft 365

> **Status: not implemented.** This doc captures the intended OAuth/IMAP design for outlook support. The code path that would consume it does not exist yet — Gmail is the only provider wired today. References to endpoints like `/api/imap/connect` or env vars like `TOKEN_ENCRYPTION_KEY` reflect the v1 server-side architecture, which has been replaced by the local-first design (see [README.md](./README.md)). When this provider lands, the implementation will follow the [Gmail PKCE pattern](./gmail.md) — not the server-side IMAP path described below.


<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path fill="#1976d2" d="M28,13h14.533C43.343,13,44,13.657,44,14.467v19.066C44,34.343,43.343,35,42.533,35H28V13z"/><polygon fill="#1976d2" points="27,44 4,39.5 4,8.5 27,4"/><path fill="#fff" d="M15.25,16.5c-3.418,0-5.75,2.989-5.75,7.5c0,4.486,2.332,7.5,5.75,7.5C18.668,31.5,21,28.486,21,24C21,19.489,18.668,16.5,15.25,16.5z M15.25,28.5c-1.875,0-3-1.717-3-4.5c0-2.81,1.125-4.5,3-4.5c1.875,0,3,1.69,3,4.5C18.25,26.783,17.125,28.5,15.25,28.5z"/><path fill="#1976d2" d="M28 17.5H42V20.5H28zM28 22.5H42V25.5H28zM28 27.5H42V30.5H28z"/><path fill="#fff" d="M34.999,14h-7v22h7c0.55,0,1-0.45,1-1V15C35.999,14.45,35.549,14,34.999,14z M33.999,32h-4V18h4V32z"/></svg>

## At a glance

| Field            | Value                                                              |
|------------------|--------------------------------------------------------------------|
| Auth model       | OAuth 2.0 + PKCE (Microsoft identity platform / v2.0)              |
| Scopes (READ-ONLY) | `Mail.Read`, `offline_access`, `User.Read`                       |
| Authorize URL    | `https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize` |
| Token URL        | `https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token`     |
| Refresh tokens   | Yes (90-day sliding window)                                        |
| Access token TTL | 1 hour                                                             |
| Review timeline  | **~24 hours** for publisher verification; admin consent instant     |
| Env vars         | `OUTLOOK_CLIENT_ID`, `OUTLOOK_CLIENT_SECRET`, `OUTLOOK_TENANT_ID`  |

`{tenant}` is `common` for "any work, school, or personal account", `consumers` for personal-only, or a specific tenant GUID for single-tenant.

## Required scopes (read-only)

- `Mail.Read` — read user mail in all folders.
- `offline_access` — issue a refresh token.
- `User.Read` — read basic profile (display name, email) to show in our UI.

We do **not** request `Mail.ReadWrite`, `Mail.Send`, `Mail.ReadWrite.Shared`, or any application-level (`Mail.Read.All`) permission.

## Setup checklist

1. Go to the [Azure portal](https://portal.azure.com/) → **Microsoft Entra ID** (formerly Azure Active Directory) → **App registrations** → **New registration**.
2. Name: `Inbox Agent`.
3. Supported account types: **Accounts in any organizational directory (any Microsoft Entra ID tenant — Multitenant) and personal Microsoft accounts (e.g. Skype, Xbox)**.
4. Redirect URI: select **Web**, then add:
   - `http://localhost:3000/api/oauth/callback`
   - `https://inbox.agent/api/oauth/callback`
5. Click **Register**. Copy the **Application (client) ID** → `OUTLOOK_CLIENT_ID`.
6. Go to **Certificates & secrets** → **Client secrets** → **New client secret**. Choose 24-month expiry. Copy the **Value** (not the Secret ID) → `OUTLOOK_CLIENT_SECRET`. **Note the calendar reminder to rotate.**
7. Go to **API permissions** → **Add a permission** → **Microsoft Graph** → **Delegated permissions**:
   - `Mail.Read`
   - `offline_access`
   - `User.Read`
   Click **Add permissions**.
   You do **not** need admin consent for delegated `Mail.Read` for a user's own mailbox — the user can consent for themselves.
8. Go to **Branding & properties**:
   - Logo: 240x240 PNG.
   - Home page: `https://inbox.agent`
   - Terms of service: `https://inbox.agent/terms`
   - Privacy statement: `https://inbox.agent/privacy`
9. (Optional but recommended) **Publisher verification**: complete the [Microsoft Partner Network](https://learn.microsoft.com/azure/active-directory/develop/publisher-verification-overview) verification so the consent screen shows a "Verified Publisher" badge. Takes ~24 hours after MPN ID is associated.
10. Set `OUTLOOK_TENANT_ID=common` in `.env.local`.

## Authorize URL params

```
client_id={OUTLOOK_CLIENT_ID}
response_type=code
redirect_uri={OAUTH_REDIRECT_URI}
response_mode=query
scope=offline_access Mail.Read User.Read
state={signed_state}
code_challenge={pkce_S256}
code_challenge_method=S256
prompt=select_account
```

## Token refresh

- Refresh tokens are valid for **90 days** but slide forward each time they're used. As long as the user logs in or we refresh within 90 days, they remain valid.
- Conditional Access policies in the user's tenant can shorten this. Handle `AADSTS70008` (refresh token expired) and `AADSTS50173` (user changed password) by deleting the stored token and prompting re-connect.
- Use `grant_type=refresh_token` against the token endpoint. **You must include the same scope set** as the original request.

## Admin consent for tenants

For Microsoft 365 organizations with "user consent disabled" policy, an admin must grant consent for the whole tenant:

`https://login.microsoftonline.com/{tenantId}/adminconsent?client_id={OUTLOOK_CLIENT_ID}&redirect_uri={OAUTH_REDIRECT_URI}&state={state}`

Document this in our Help Center under "I'm getting AADSTS65001: user or admin has not consented".

## Known gotchas

- **`AADSTS65001`**: User/admin has not consented. Either the user needs to grant consent themselves (delegated scopes don't normally require admin), or the org has blocked user consent. Direct the user to the `/adminconsent` URL above.
- **`AADSTS50011`**: The redirect URI does not match. Microsoft is strict about exact match — `http` vs `https`, trailing slash, casing all matter.
- **Personal accounts vs work accounts**: Some scopes work for one and not the other. `Mail.Read` works for both. Test with both a `@outlook.com` and a `@yourcorp.onmicrosoft.com` account.
- **Throttling**: Microsoft Graph throttles aggressively. Respect `Retry-After`. Default ceiling is 10,000 requests per 10 minutes per app per tenant.
- **Delta queries**: use `/me/mailFolders('Inbox')/messages/delta` for incremental sync. The `@odata.deltaLink` survives across sync runs.
- **Shared mailboxes** require an additional scope (`Mail.Read.Shared`) — out of scope for v1.
- **GCC High / DoD tenants** use different endpoints (`login.microsoftonline.us`). Not supported in v1.
- **Sovereign clouds** (China — 21Vianet): different endpoints again. Not supported.

## References

- [Microsoft identity platform OAuth 2.0 auth code flow](https://learn.microsoft.com/azure/active-directory/develop/v2-oauth2-auth-code-flow)
- [Microsoft Graph Mail permissions](https://learn.microsoft.com/graph/permissions-reference#mail-permissions)
- [Publisher verification](https://learn.microsoft.com/azure/active-directory/develop/publisher-verification-overview)
