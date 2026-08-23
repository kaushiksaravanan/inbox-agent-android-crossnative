/**
 * Browser OAuth flow uses PKCE (RFC 7636). No client_secret ships to the browser.
 * The code_verifier is random (32 bytes), held in sessionStorage only during the
 * redirect round-trip, and discarded after token exchange. Decompiling or inspecting
 * the bundle reveals only the public CLIENT_ID — which is by design public.
 *
 * Defense against impersonation:
 *   1. Google enforces the redirect_uri whitelist (configured in Cloud Console)
 *   2. The web app uses its origin's exact URI; an attacker cannot redirect to
 *      their own domain even if they harvest the client_id.
 */

// Browser-side Gmail OAuth using Authorization Code + PKCE (S256).
//
// Local-first mode: there is NO backend. The browser talks directly to
// Google's authorization and token endpoints. We never send credentials,
// codes, or tokens to our own servers.
//
// Tokens are persisted in localStorage under "inbox.gmail.tokens", encrypted
// at rest with AES-GCM via lib/local-crypto.ts (Track B). The encryption key
// is derived from a per-install random seed kept in IndexedDB.
//
// Coexists with src/lib/oauth/ (the server-side OAuth path used when a
// backend is available). This module is browser-only — every API here will
// throw if called server-side.

import {
  encryptJson,
  decryptJson,
  type EncryptedBlob,
} from "@/lib/local-crypto";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const REVOKE_URL = "https://oauth2.googleapis.com/revoke";

const SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.metadata",
].join(" ");

const TOKENS_STORAGE_KEY = "inbox.gmail.tokens";
const PKCE_VERIFIER_KEY = "inbox.gmail.pkce_verifier";
const PKCE_STATE_KEY = "inbox.gmail.pkce_state";

// Refresh the access token if it has fewer than this many seconds left.
const REFRESH_SKEW_SECONDS = 60;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StoredTokens {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  /** Unix epoch seconds when the access token expires. */
  expires_at: number;
  /** Optional id_token returned by Google when "openid" was requested. */
  id_token?: string;
  /** When these tokens were first issued (epoch seconds). */
  issued_at: number;
}

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  refresh_token?: string;
  id_token?: string;
}

interface GoogleTokenErrorResponse {
  error: string;
  error_description?: string;
}

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------

function assertBrowser(): void {
  if (typeof window === "undefined") {
    throw new Error("Gmail OAuth client APIs must be called in the browser.");
  }
}

function getClientId(): string {
  const id = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID;
  if (!id) {
    throw new Error(
      "Missing NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID. Local-first mode requires a public Google OAuth client id."
    );
  }
  return id;
}

function getRedirectUri(): string {
  assertBrowser();
  return `${window.location.origin}/oauth/google/callback`;
}

// ---------------------------------------------------------------------------
// PKCE helpers
// ---------------------------------------------------------------------------

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function randomBase64Url(byteLength: number): string {
  const buf = new Uint8Array(byteLength);
  crypto.getRandomValues(buf);
  return bytesToBase64Url(buf);
}

async function sha256Base64Url(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return bytesToBase64Url(new Uint8Array(digest));
}

// ---------------------------------------------------------------------------
// Encrypted token persistence
// ---------------------------------------------------------------------------

async function persistTokens(tokens: StoredTokens): Promise<void> {
  assertBrowser();
  const blob = await encryptJson(tokens);
  window.localStorage.setItem(TOKENS_STORAGE_KEY, JSON.stringify(blob));
}

async function loadTokens(): Promise<StoredTokens | null> {
  assertBrowser();
  const raw = window.localStorage.getItem(TOKENS_STORAGE_KEY);
  if (!raw) return null;
  try {
    const blob = JSON.parse(raw) as EncryptedBlob;
    return await decryptJson<StoredTokens>(blob);
  } catch {
    // Corrupted blob or key mismatch — drop it so the user can reconnect.
    window.localStorage.removeItem(TOKENS_STORAGE_KEY);
    return null;
  }
}

function clearStoredTokens(): void {
  assertBrowser();
  window.localStorage.removeItem(TOKENS_STORAGE_KEY);
}

// ---------------------------------------------------------------------------
// Google token endpoint
// ---------------------------------------------------------------------------

async function postToken(
  body: Record<string, string>
): Promise<GoogleTokenResponse> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString(),
  });
  const text = await res.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`Google token endpoint returned non-JSON: ${text}`);
  }
  if (!res.ok) {
    const err = parsed as GoogleTokenErrorResponse;
    const detail = err?.error_description || err?.error || text;
    throw new Error(`Google token exchange failed: ${detail}`);
  }
  return parsed as GoogleTokenResponse;
}

function tokenResponseToStored(
  resp: GoogleTokenResponse,
  fallbackRefreshToken: string | undefined,
  fallbackIssuedAt: number | undefined
): StoredTokens {
  const now = Math.floor(Date.now() / 1000);
  const refresh = resp.refresh_token ?? fallbackRefreshToken;
  if (!refresh) {
    // Without a refresh token we cannot keep the session alive past expiry.
    // Force the user to redo consent with prompt=consent (already configured).
    throw new Error(
      "Google did not return a refresh_token. Re-run the consent flow."
    );
  }
  return {
    access_token: resp.access_token,
    refresh_token: refresh,
    scope: resp.scope,
    token_type: resp.token_type,
    expires_at: now + resp.expires_in,
    id_token: resp.id_token,
    issued_at: fallbackIssuedAt ?? now,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Kick off the Gmail OAuth flow. Generates a PKCE code_verifier + state,
 * stores them in sessionStorage, and redirects the browser to Google's
 * authorization endpoint. Does not return — the browser navigates away.
 */
export async function startGmailOAuth(): Promise<void> {
  assertBrowser();
  const clientId = getClientId();
  const redirectUri = getRedirectUri();

  const codeVerifier = randomBase64Url(64);
  const codeChallenge = await sha256Base64Url(codeVerifier);
  const state = randomBase64Url(24);

  window.sessionStorage.setItem(PKCE_VERIFIER_KEY, codeVerifier);
  window.sessionStorage.setItem(PKCE_STATE_KEY, state);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
  });

  window.location.assign(`${AUTH_URL}?${params.toString()}`);
}

/**
 * Exchange the authorization code for tokens, then encrypt + persist them.
 * Pass the raw value from the `?code=` query param. If the URL also carries
 * a `state` param it should be validated by the caller before invoking us;
 * we cross-check it here too as defense in depth.
 */
export async function completeGmailOAuth(
  code: string,
  receivedState?: string
): Promise<void> {
  assertBrowser();
  if (!code) throw new Error("Missing authorization code.");

  const codeVerifier = window.sessionStorage.getItem(PKCE_VERIFIER_KEY);
  const expectedState = window.sessionStorage.getItem(PKCE_STATE_KEY);
  if (!codeVerifier) {
    throw new Error(
      "Missing PKCE verifier — start the OAuth flow from this browser tab."
    );
  }
  if (
    receivedState !== undefined &&
    expectedState !== null &&
    receivedState !== expectedState
  ) {
    throw new Error("OAuth state mismatch — possible CSRF.");
  }

  const clientId = getClientId();
  const redirectUri = getRedirectUri();

  const resp = await postToken({
    client_id: clientId,
    code,
    code_verifier: codeVerifier,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  });

  const tokens = tokenResponseToStored(resp, undefined, undefined);
  await persistTokens(tokens);

  // PKCE values are single-use.
  window.sessionStorage.removeItem(PKCE_VERIFIER_KEY);
  window.sessionStorage.removeItem(PKCE_STATE_KEY);
}

/**
 * Returns a valid access token, refreshing it via the refresh_token grant
 * if the current one has expired (or is about to). Throws if there is no
 * stored session or if refresh fails.
 */
export async function getValidAccessToken(): Promise<string> {
  assertBrowser();
  const tokens = await loadTokens();
  if (!tokens) throw new Error("Gmail is not connected.");

  const now = Math.floor(Date.now() / 1000);
  if (tokens.expires_at - REFRESH_SKEW_SECONDS > now) {
    return tokens.access_token;
  }

  // Refresh.
  const clientId = getClientId();
  const resp = await postToken({
    client_id: clientId,
    grant_type: "refresh_token",
    refresh_token: tokens.refresh_token,
  });

  const refreshed = tokenResponseToStored(
    resp,
    tokens.refresh_token,
    tokens.issued_at
  );
  await persistTokens(refreshed);
  return refreshed.access_token;
}

/**
 * Revoke Gmail access at Google and wipe the local tokens. Best-effort:
 * if the revoke request fails (e.g. network), we still clear local state
 * so the UI reflects "disconnected".
 */
export async function revokeGmailAccess(): Promise<void> {
  assertBrowser();
  const tokens = await loadTokens();
  try {
    if (tokens) {
      // Prefer revoking the refresh token — that invalidates the whole grant.
      const target = tokens.refresh_token || tokens.access_token;
      await fetch(REVOKE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token: target }).toString(),
      });
    }
  } catch {
    // Swallow — local cleanup must still happen.
  } finally {
    clearStoredTokens();
  }
}

/**
 * Cheap synchronous-ish probe for UI. Returns true if an encrypted blob
 * exists in localStorage. Does NOT validate the token is still good — call
 * getValidAccessToken() for that.
 */
export function isGmailConnected(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(TOKENS_STORAGE_KEY) !== null;
}
