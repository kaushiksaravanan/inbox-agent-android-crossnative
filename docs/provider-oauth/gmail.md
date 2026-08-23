# Gmail / Google Workspace

<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path fill="#4caf50" d="M45,16.2l-5,2.75l-5,4.75L35,40h7c1.657,0,3-1.343,3-3V16.2z"/><path fill="#1e88e5" d="M3,16.2l3.614,1.71L13,23.7V40H6c-1.657,0-3-1.343-3-3V16.2z"/><polygon fill="#e53935" points="35,11.2 24,19.45 13,11.2 12,17 13,23.7 24,31.95 35,23.7 36,17"/><path fill="#c62828" d="M3,12.298V16.2l10,7.5V11.2L9.876,8.859C9.132,8.301,8.228,8,7.298,8h0C4.924,8,3,9.924,3,12.298z"/><path fill="#fbc02d" d="M45,12.298V16.2l-10,7.5V11.2l3.124-2.341C38.868,8.301,39.772,8,40.702,8h0 C43.076,8,45,9.924,45,12.298z"/></svg>

## At a glance

| Field            | Value                                                              |
|------------------|--------------------------------------------------------------------|
| Auth model       | OAuth 2.0 + PKCE                                                   |
| Scopes (READ-ONLY) | `https://www.googleapis.com/auth/gmail.readonly`<br>`https://www.googleapis.com/auth/gmail.metadata` |
| Authorize URL    | `https://accounts.google.com/o/oauth2/v2/auth`                     |
| Token URL        | `https://oauth2.googleapis.com/token`                              |
| Refresh tokens   | Yes (long-lived; revoked when user changes password or revokes)    |
| Access token TTL | 1 hour                                                             |
| Review timeline  | **3-7 business days** for verified app status                      |
| Env vars         | `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`                           |

## Required scopes (read-only)

- `gmail.readonly` — full read of messages, threads, labels, history.
- `gmail.metadata` — headers + label IDs only, no body. Lower-risk for unverified-app screens. We request both and let Google's consent UI explain to the user.

We do **not** request `gmail.modify`, `gmail.send`, `gmail.compose`, or any full-mailbox scope.

## Setup checklist

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project named `inbox-agent` (or use existing).
3. Enable the **Gmail API**:
   APIs & Services → Library → Gmail API → Enable.
4. Configure the **OAuth consent screen**:
   APIs & Services → OAuth consent screen.
   - User type: **External** (so any Google account can connect).
   - App name: `Inbox Agent`
   - User support email: `support@inbox.agent`
   - App logo: 120x120 PNG, hosted on inbox.agent.
   - Application home page: `https://inbox.agent`
   - Application privacy policy: `https://inbox.agent/privacy`
   - Application terms of service: `https://inbox.agent/terms`
   - Authorized domains: `inbox.agent`
   - Developer contact: `dev@inbox.agent`
5. Add scopes on the next page:
   - `.../auth/gmail.readonly`
   - `.../auth/gmail.metadata`
6. Add test users while in "Testing" status (up to 100). Add yourself + early-access testers.
7. Create OAuth client ID:
   APIs & Services → Credentials → Create Credentials → OAuth client ID.
   - Application type: **Web application**.
   - Name: `Inbox Agent Web`.
   - Authorized redirect URIs:
     - `http://localhost:3000/api/oauth/callback`
     - `https://inbox.agent/api/oauth/callback`
8. Copy **Client ID** and **Client secret** into `.env.local`:
   ```
   GMAIL_CLIENT_ID=...apps.googleusercontent.com
   GMAIL_CLIENT_SECRET=GOCSPX-...
   ```
9. Submit for **verification** when ready for public release:
   OAuth consent screen → Publish app → Prepare for verification.
   You will need a [security assessment](https://support.google.com/cloud/answer/13465431) (CASA Tier 2) because `gmail.readonly` is a restricted scope. Budget **3-7 business days** for Google review *after* the security assessment passes, which itself takes 4-6 weeks the first time.

## Authorize URL params

```
client_id={GMAIL_CLIENT_ID}
redirect_uri={OAUTH_REDIRECT_URI}
response_type=code
scope=https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.metadata
access_type=offline           # required to receive a refresh_token
prompt=consent                # forces refresh_token even on re-auth
state={signed_state}
code_challenge={pkce_S256}
code_challenge_method=S256
include_granted_scopes=true
```

## Token refresh

- Refresh tokens never expire by time, but are revoked when:
  - User revokes access at [myaccount.google.com/permissions](https://myaccount.google.com/permissions).
  - User changes password (only for some account types).
  - Six months of inactivity.
  - App is in Testing mode (refresh tokens expire after **7 days** — push to Production before launch).
- Exchange `refresh_token` for a new `access_token` via `POST https://oauth2.googleapis.com/token` with `grant_type=refresh_token`.
- Handle `invalid_grant` by deleting the stored token and prompting the user to re-connect.

## Known gotchas

- **"Google hasn't verified this app" screen**: shown to every user until verification completes. Test users on the consent screen bypass it. For private beta we can rely on test users (100 cap) and link a [help doc](https://support.google.com/cloud/answer/7454865).
- **Restricted scope security assessment**: `gmail.readonly` is *restricted*, not just sensitive. Google requires an independent CASA Tier 2 audit (~$4k via Leviathan / Bishop Fox) before public launch. Plan for this 6-8 weeks before GA.
- **Refresh tokens in Testing mode** expire in 7 days — see above.
- **Quota**: 1,000,000,000 quota units per day per project. `messages.list` = 5 units, `messages.get` (metadata) = 5 units, `messages.get` (full) = 5 units. With backoff this is plenty for our use case.
- **`prompt=consent`** is required on first auth to guarantee a refresh token. Skip it on subsequent re-auth or you'll annoy users.
- **History API**: use `users.history.list` for delta sync after the initial backfill. Don't poll `messages.list` repeatedly.
- **Google Workspace tenants**: an admin can pre-approve the app for the entire org via Marketplace. Document this for enterprise users.

## References

- [Gmail API OAuth 2.0 scopes](https://developers.google.com/gmail/api/auth/scopes)
- [OAuth verification FAQ](https://support.google.com/cloud/answer/13463073)
- [Restricted scope policy](https://developers.google.com/terms/api-services-user-data-policy)
