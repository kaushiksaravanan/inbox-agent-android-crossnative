# OAuth verification submission checklist

The Gmail `readonly` scope is **sensitive**. Without verification, Google
caps the OAuth client at 100 users and shows the "Google hasn't verified
this app" warning during consent. To remove both, submit the app for
verification. This doc is the checklist of decisions and assets you need
in hand before opening Cloud Console.

Owner: you (the human). Claude can prep the assets, but the submission
requires your Google account in the GCP UI.

---

## 0. Decide the app name

The Cloud Console "OAuth consent screen" → "App name" field is what users
see during consent. Right now it says **"Jot"**. The codebase says
**"Inbox Agent"**. Pick one:

- **Keep "Inbox Agent"** — change Cloud Console app name in 1 minute.
  Zero code changes. Pro: matches everything we've shipped. Con: generic;
  competitors all use "Agent" in their names.
- **Pivot to "Jot"** — keep Cloud Console as-is, rename the codebase via
  `grep -rl "Inbox Agent" | xargs sed -i 's/Inbox Agent/Jot/g'` (~12 files).
  Pro: short, memorable, on-message. Con: domain availability unknown,
  brand is generic-sounding too.
- **Pick a new name entirely** — both Cloud Console + codebase. Most work.

Cost of pivot ranking: cheapest to most expensive is **Keep > Jot > New**.
**Recommendation:** keep "Inbox Agent" unless you have a strong reason to
pivot. Rename costs ~30 min anytime.

After deciding, before the verification submission below:
- Cloud Console → APIs & Services → OAuth consent screen → Edit
- Set "App name" to your chosen name and Save.

---

## 1. Logo / icon assets

Google requires a logo on the consent screen and rejects pixelated or
generic placeholders during review.

| Asset | Spec | Where it appears |
|---|---|---|
| App logo | **120×120 PNG**, transparent background, **<1MB** | OAuth consent screen header |
| Favicon | 32×32 PNG | Already done (in `apps/web/public/favicon.ico`) |
| Site logo (web) | SVG, scales freely | Already done (mark on site nav) |

The current site mark is the small black square in the top-left of the
nav. To convert it to a 120×120 PNG for upload:

Three placeholder variants are already rendered at exact 120×120 PNG in
`.secrets/oauth-assets/` (gitignored):

- `logo-120.png` — orange square with white **"I"** (1.7KB)
- `logo-ia-120.png` — orange square with white **"IA"** monogram
- `logo-mark-120.png` — black square on cream paper, matches the site
  nav mark exactly (most brand-consistent)

To regenerate or tweak any of them, edit the matching `logo-*.html` in
the same directory and re-run the browser-harness capture script.

If you commission a real logo, replace any of the above with the new
PNG and verify it's exactly 120×120 (Google rejects non-square at this
endpoint) and under 1MB.

---

## 2. Domain ownership verification

For the consent screen to show your domain as the app's homepage, you
need to verify ownership of every domain referenced.

- Open Google Search Console: <https://search.google.com/search-console>
- Add property for your homepage domain
- Verify via one of the supported methods (TXT record on DNS is easiest)
- Repeat for any additional domains listed in the OAuth consent screen

If you don't have a custom domain yet, the verification submission can
still go through with a `localhost` redirect URI — the unverified-app
warning will persist until production. We can ship with the warning; many
indie apps do.

---

## 3. Scope justification

Google asks: "Why does your app need this scope?" Have this paragraph
ready to paste, customized for the chosen app name:

> Inbox Agent reads the user's Gmail messages locally on their device
> to extract action items (renewals, payments, replies owed, etc.) and
> present them as a verb-first task list. The `gmail.readonly` scope is
> required to fetch message metadata and bodies for on-device extraction.
> We do not send, modify, or delete email. All extracted data lives on
> the user's device — our server never sees a user's email content,
> OAuth tokens, or extracted tasks. See our privacy policy at
> <homepage>/privacy and security model at <homepage>/security for the
> full data-handling story.

Edit the URLs once you have a live domain.

---

## 4. Demo video

Google requires a **30-90 second screencast** showing:
1. The user signing in with Google
2. The consent screen with the scope grant
3. The app actually using the granted data (i.e., showing extracted tasks
   from the user's real inbox)

Notes on what passes review:
- Show real Gmail in real Chrome, not a mockup
- The OAuth consent screen must appear on-camera (not skipped/cached)
- Show at least one task that visibly came from a real email

We can produce this with browser-harness once the live site is up. Save
the resulting MP4 to `.secrets/oauth-demo-video.mp4` and upload during
submission.

---

## 5. Privacy policy + security URLs

Both already exist:
- `<homepage>/privacy` — current word count 897, reconciled 2026-06-24
- `<homepage>/security` — current word count 435, reconciled 2026-06-24

Once the domain is live, both pages must be reachable at HTTPS URLs.

---

## 6. Submission flow (Cloud Console)

1. `console.cloud.google.com` → select project `gen-lang-client-0376606873`
2. APIs & Services → OAuth consent screen → **Edit App**
3. Set:
   - App name = your chosen name (from §0)
   - User support email = your email
   - App logo = 120×120 PNG (from §1)
   - Application home page = `https://<your-domain>`
   - Application privacy policy = `https://<your-domain>/privacy`
   - Application terms of service = `https://<your-domain>/terms`
4. Save and continue → Scopes → Add or remove scopes:
   - Confirm only `gmail.readonly` is selected
   - In "Why your app needs this scope", paste §3 text
5. Save and continue → Test users → Add your own email
6. Back to summary → click **Publish app** → choose "External" and
   **Submit for verification**
7. Upload the demo video from §4 when prompted

Review takes **3–6 weeks**. During review, the app stays in test mode
(100-user cap, unverified-app warning). After approval, both restrictions lift.

---

## 7. Android client (separate)

The web OAuth client we already configured cannot be used by the
Android app. You need a **second** OAuth client of type **Android**:

1. Cloud Console → Credentials → Create credentials → OAuth client ID
2. Application type = **Android**
3. Package name = `com.inbox.agent` (matches `app.config.ts`)
4. SHA-1 certificate fingerprint = paste output of:
   ```
   keytool -keystore <your-keystore.jks> -list -v
   ```
   Add **both** the debug keystore and the release keystore SHA-1.

Save. Android clients have **no client_secret** — Google binds the
client to the APK signature instead. Re-signed cracked APKs are
rejected at Google's end.

Set the result as `GOOGLE_ANDROID_CLIENT_ID` in `apps/mobile/.env.local`
(already wired in `app.config.ts:52`).

---

## Status

- [ ] App name decided (§0)
- [ ] 120×120 logo created (§1)
- [ ] Domain ownership verified (§2)
- [ ] Demo video recorded (§4)
- [ ] Submission filed (§6)
- [ ] Android OAuth client created (§7)
- [ ] Review approved (3–6 weeks after §6)
