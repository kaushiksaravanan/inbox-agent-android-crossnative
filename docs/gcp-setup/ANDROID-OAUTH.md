# Android OAuth Client Setup

Step-by-step guide for creating the **Android** OAuth client. This is separate from the **Web** OAuth client (documented elsewhere) — both are required, they bind to different signatures, and they cannot substitute for each other.

---

## 1. Why a separate Android client?

The Web OAuth client uses application type `Web application` and authenticates via a registered **redirect URI** plus a **client secret**.

The Android OAuth client uses application type `Android` and authenticates via the **SHA-1 fingerprint** of the APK's signing certificate plus the **package name**.

Google will not issue tokens to an Android OAuth flow unless the calling APK is signed by the certificate whose SHA-1 matches the registered fingerprint. The package name + SHA-1 pair is the credential — there is no client secret on Android.

---

## 2. Get your SHA-1 fingerprint

### Debug builds (development)

```bash
keytool -list -v \
  -keystore ~/.android/debug.keystore \
  -alias androiddebugkey \
  -storepass android \
  -keypass android
```

Look for the line starting with `SHA1:` in the output (format: `XX:XX:XX:...` — 20 hex pairs).

### Release builds (production)

Use **Google Play App Signing**. After uploading your first APK/AAB to the Play Console:

1. Open the Play Console for your app
2. Navigate to **Setup → App Signing**
3. Copy the SHA-1 listed under **App signing key certificate**

Do **not** use your local upload-key SHA-1 for the production OAuth client — Google re-signs every distributed APK with the Play app-signing key, so that is the certificate the runtime APK actually carries.

---

## 3. Create the OAuth client in Google Cloud Console

1. Open **APIs & Services → Credentials**
2. Click **Create Credentials → OAuth client ID**
3. **Application type:** `Android`
4. **Name:**
   - `Inbox Agent Android (debug)` for the development client
   - `Inbox Agent Android (prod)` for the production client
5. **Package name:** `com.inbox.agent`
6. **SHA-1 certificate fingerprint:** paste the fingerprint from step 2
7. Click **CREATE**

Repeat the entire flow once for debug and once for production. They are independent clients with independent client IDs.

---

## 4. There is no client_secret for an Android OAuth client

Google's documentation states this explicitly. The Credentials page does not show a "client secret" field for the `Android` application type, and the JSON download contains only `client_id` and the package/SHA-1 binding.

**Your APK's signature is the credential.** This is why decompiling an Android app reveals nothing useful in terms of OAuth secrets — there is literally no secret stored in the binary to extract.

---

## 5. Create both a debug and a production client

During development the app is signed with the debug keystore (`~/.android/debug.keystore`), so it needs a debug OAuth client whose registered SHA-1 matches the debug certificate.

Before Play Store release the runtime APK will be signed by the Play App Signing key, so it needs a separate production OAuth client whose registered SHA-1 matches **that** certificate.

Keep both client IDs in your app config and select the appropriate one based on build variant.

---

## 6. What an attacker who decompiles your APK can do

- **Can see:** your client ID (it's public, this is fine)
- **Can see:** your package name (visible in app metadata regardless)
- **Cannot:** issue OAuth requests on your behalf, because they don't have your signing keystore
- **Can:** publish a malicious build under a *different* client ID and a *different* package name — but that's a fraudulent app of their own, unconnected to your credentials

There is no extractable secret to protect. The signature binding does the work.

---

## 7. The cracked-and-resigned attack

1. Attacker downloads your APK from the Play Store or a mirror
2. Attacker modifies it (injects code, swaps assets, etc.)
3. Attacker re-signs the modified APK with their own keystore (your key is not on their machine)
4. The resigned APK now has a **different SHA-1** than the one registered in GCP
5. Google's token endpoint refuses to issue tokens because the calling certificate doesn't match

The attack fails at the Google end. The attacker has a modified binary that cannot authenticate.

---

## 8. The Play Store distribution defense

- Enroll the app in **Google Play App Signing**
- Google holds the app signing key in a hardware-backed key store and signs every APK that Play distributes
- Even if your upload key leaks, an attacker still cannot produce a Play-signed APK — only Google can do that, and only for builds you upload
- Users who sideload an off-store APK end up with a different signature, and Google refuses tokens for that build

End result: the only binaries that can successfully obtain tokens are the ones you uploaded and Google signed.

---

## 9. Wire-up in the Android app

The app uses `expo-auth-session` with the Google provider:

```ts
import * as Google from "expo-auth-session/providers/google";

const [request, response, promptAsync] = Google.useAuthRequest({
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  scopes: [
    "openid",
    "email",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.metadata",
  ],
});
```

- Set `androidClientId` to the **Android** client ID (the one with the SHA-1 binding, no secret)
- Do **not** set `clientSecret` — there isn't one
- PKCE is automatically enabled by `expo-auth-session` for public clients

---

## 10. Verification command (paranoia mode)

Confirm that your built APK's signature matches what you registered in GCP:

```bash
apksigner verify --print-certs \
  apps/mobile/android/app/build/outputs/apk/debug/app-arm64-v8a-debug.apk \
  | grep SHA-1
```

The printed SHA-1 must match — byte for byte, ignoring colons and case — the SHA-1 fingerprint registered on the Android OAuth client in Google Cloud Console. If it doesn't match, the OAuth flow will fail at runtime with an `invalid_client` or `redirect_uri_mismatch`-style error.

---

## Summary checklist

- [ ] Pulled the **debug** SHA-1 from `~/.android/debug.keystore`
- [ ] Created **Inbox Agent Android (debug)** OAuth client with package `com.inbox.agent` + debug SHA-1
- [ ] Enrolled in Play App Signing and copied the **production** SHA-1 from the Play Console
- [ ] Created **Inbox Agent Android (prod)** OAuth client with package `com.inbox.agent` + prod SHA-1
- [ ] Wired both client IDs into the app config keyed by build variant
- [ ] Verified an actual built APK's certificate via `apksigner verify --print-certs`
