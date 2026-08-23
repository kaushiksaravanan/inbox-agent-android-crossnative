/**
 * Gmail OAuth 2.0 with PKCE (Proof Key for Code Exchange) — RFC 7636.
 *
 * Why no client_secret?
 * ---------------------
 * This is a public/native client (mobile app). The OAuth client_secret
 * cannot be safely embedded in a distributed binary — anyone can extract
 * it from the APK/IPA. Google's Android & iOS OAuth client types are
 * therefore issued WITHOUT a client_secret.
 *
 * PKCE replaces the client_secret as the proof-of-possession mechanism:
 *   1. Client generates a cryptographically random `code_verifier`.
 *   2. Client sends `code_challenge = BASE64URL(SHA256(code_verifier))`
 *      with the authorization request.
 *   3. Authorization server stores the challenge bound to the auth code.
 *   4. Client exchanges the auth code by sending the original `code_verifier`.
 *   5. Server hashes it and compares to the stored challenge — only the
 *      original requester can complete the exchange, even if an attacker
 *      intercepts the auth code via a malicious app intent / URL handler.
 *
 * expo-auth-session generates the verifier/challenge automatically and
 * uses Android App Links / iOS Universal Links + the SHA-1 / bundle-id
 * binding on the Google OAuth client to prevent code interception.
 *
 * Token refresh likewise needs no client_secret — the refresh_token is
 * the bearer credential and is kept in Keystore/Keychain via expo-secure-store.
 */

import { useEffect, useMemo, useState } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const TOKEN_STORAGE_KEY = 'inbox.gmail.tokens';

const GMAIL_SCOPES = [
  'openid',
  'email',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.metadata',
];

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_REVOKE_URL = 'https://oauth2.googleapis.com/revoke';

type StoredTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // epoch millis
};

function getExtra() {
  // Works both in classic & EAS-built apps.
  const extra =
    (Constants.expoConfig?.extra as Record<string, unknown> | undefined) ??
    ((Constants as unknown as { manifest?: { extra?: Record<string, unknown> } })
      .manifest?.extra) ??
    {};
  return extra as {
    googleAndroidClientId?: string;
    googleIosClientId?: string | null;
  };
}

function getAndroidClientId(): string {
  const { googleAndroidClientId } = getExtra();
  if (!googleAndroidClientId) {
    throw new Error(
      'GOOGLE_ANDROID_CLIENT_ID is not configured. Set it in your env and app.config.ts extra.',
    );
  }
  return googleAndroidClientId;
}

function getIosClientId(): string | null {
  const { googleIosClientId } = getExtra();
  return googleIosClientId ?? null;
}

async function persistTokens(tokens: StoredTokens): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
}

async function loadTokens(): Promise<StoredTokens | null> {
  const raw = await SecureStore.getItemAsync(TOKEN_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredTokens;
  } catch {
    return null;
  }
}

async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY);
}

/**
 * Hook: configure an expo-auth-session Google PKCE request and surface
 * UI-friendly state. The caller invokes `promptAsync()` to launch the
 * system browser / custom tab.
 */
export function useGmailAuth() {
  const androidClientId = useMemo(() => {
    try {
      return getAndroidClientId();
    } catch {
      return undefined;
    }
  }, []);
  const iosClientId = useMemo(() => getIosClientId() ?? undefined, []);

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId,
    iosClientId,
    scopes: GMAIL_SCOPES,
    // Request a refresh_token (offline access).
    extraParams: { access_type: 'offline', prompt: 'consent' },
  });

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Initial connection check.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const tokens = await loadTokens();
      if (!cancelled) setIsConnected(!!tokens?.refreshToken);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Handle the prompt response — persist tokens on success.
  useEffect(() => {
    if (!response) return;
    if (response.type === 'success') {
      const auth = response.authentication;
      if (auth?.accessToken) {
        const expiresInSec = auth.expiresIn ?? 3600;
        const tokens: StoredTokens = {
          accessToken: auth.accessToken,
          refreshToken: auth.refreshToken ?? '',
          expiresAt: Date.now() + expiresInSec * 1000,
        };
        persistTokens(tokens)
          .then(async () => {
            setIsConnected(true);
            // Register the background poll task now that we have a valid
            // refresh token. Dynamic-imported so this module doesn't take a
            // hard dep on background-poll (which imports back here for
            // isGmailConnected).
            try {
              const { registerBackgroundPolling } = await import(
                './background-poll'
              );
              await registerBackgroundPolling();
            } catch (err) {
              // Non-fatal — foreground sync still works. The Settings
              // screen surfaces the "background sync off" state separately.
              // eslint-disable-next-line no-console
              console.warn(
                '[gmail-oauth] could not register background poll',
                err,
              );
            }
          })
          .finally(() => setIsAuthenticating(false));
      } else {
        setIsAuthenticating(false);
      }
    } else if (
      response.type === 'error' ||
      response.type === 'cancel' ||
      response.type === 'dismiss'
    ) {
      setIsAuthenticating(false);
    }
  }, [response]);

  const wrappedPromptAsync: typeof promptAsync = async (...args) => {
    setIsAuthenticating(true);
    try {
      const res = await promptAsync(...args);
      return res;
    } catch (err) {
      setIsAuthenticating(false);
      throw err;
    }
  };

  return {
    request,
    promptAsync: wrappedPromptAsync,
    isAuthenticating,
    isConnected,
  };
}

/**
 * Imperative entrypoint — for use outside React components. Requires
 * that `useGmailAuth` has been mounted somewhere in the tree so a
 * `promptAsync` is available. Prefer triggering the prompt via the hook
 * directly; this helper just delegates.
 */
export async function startGmailAuth(
  promptAsync: () => Promise<unknown>,
): Promise<unknown> {
  return promptAsync();
}

/**
 * Returns a non-expired access token, refreshing via the refresh_token
 * grant if needed. Throws if no tokens are stored.
 */
export async function getValidAccessToken(): Promise<string> {
  const tokens = await loadTokens();
  if (!tokens) {
    throw new Error('Gmail is not connected — no tokens in secure storage.');
  }

  // 60-second safety margin to avoid mid-flight expiry.
  if (tokens.accessToken && tokens.expiresAt > Date.now() + 60_000) {
    return tokens.accessToken;
  }

  if (!tokens.refreshToken) {
    throw new Error('No refresh token available — user must re-authenticate.');
  }

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: tokens.refreshToken,
    client_id: getAndroidClientId(),
  });

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token refresh failed (${res.status}): ${text}`);
  }

  const json = (await res.json()) as {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
  };

  const refreshed: StoredTokens = {
    accessToken: json.access_token,
    // Google usually omits a new refresh_token on refresh — keep the existing one.
    refreshToken: json.refresh_token ?? tokens.refreshToken,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
  await persistTokens(refreshed);
  return refreshed.accessToken;
}

/**
 * Revoke the OAuth grant with Google and wipe local tokens.
 */
export async function revokeGmailAccess(): Promise<void> {
  // Stop the background poll first so it can't fire mid-revoke and observe
  // tokens disappearing under it. Best-effort: ignore unregister failures.
  try {
    const { unregisterBackgroundPolling } = await import('./background-poll');
    await unregisterBackgroundPolling();
  } catch {
    // Background poll already unregistered or task manager unavailable.
  }

  const tokens = await loadTokens();
  // Prefer revoking the refresh token (revokes the whole grant); fall back
  // to access token if that's all we have.
  const tokenToRevoke = tokens?.refreshToken || tokens?.accessToken;
  if (tokenToRevoke) {
    try {
      await fetch(GOOGLE_REVOKE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ token: tokenToRevoke }).toString(),
      });
    } catch {
      // Swallow network errors — we still want to clear local storage so
      // the UI reflects "disconnected".
    }
  }
  await clearTokens();
}

/**
 * Async boolean — does the secure store hold a usable Gmail grant?
 */
export async function isGmailConnected(): Promise<boolean> {
  const tokens = await loadTokens();
  return !!tokens?.refreshToken;
}
