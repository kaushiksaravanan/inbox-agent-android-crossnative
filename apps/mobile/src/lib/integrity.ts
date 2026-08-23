import { NativeModules, Platform } from 'react-native';

type InboxIntegrityNative = {
  requestIntegrityToken(nonce: string): Promise<string>;
};

const native: InboxIntegrityNative | undefined = (
  NativeModules as { InboxIntegrity?: InboxIntegrityNative }
).InboxIntegrity;

/**
 * Requests a Google Play Integrity attestation token for the given nonce.
 *
 * Best-effort: returns `null` on platforms where Play Integrity is not
 * available (iOS, web, sideloaded APKs that fail attestation, missing
 * cloud project number, Play Services unavailable, etc.). Callers should
 * treat a non-null token as a trust boost, not a hard gate — the app
 * continues to function with `null`.
 *
 * The `nonce` should be a server-issued, single-use value (e.g. base64 of
 * 16+ random bytes) so the resulting token cannot be replayed.
 */
export async function getIntegrityToken(nonce: string): Promise<string | null> {
  if (Platform.OS !== 'android') {
    return null;
  }
  if (!native || typeof native.requestIntegrityToken !== 'function') {
    return null;
  }
  try {
    const token = await native.requestIntegrityToken(nonce);
    return token || null;
  } catch (err) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('[integrity] Play Integrity request failed:', err);
    }
    return null;
  }
}
