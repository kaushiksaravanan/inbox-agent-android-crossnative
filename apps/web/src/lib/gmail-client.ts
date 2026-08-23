// Gmail REST API client.
//
// Local-first: this module runs in the browser and talks directly to
// https://gmail.googleapis.com using an access token obtained from
// gmail-oauth.getValidAccessToken(). It never touches our own backend.
//
// Two public helpers:
//   - listRecentMessages: enumerate message IDs (no payload)
//   - getMessage:         fetch a single message and parse it into a
//                         clean ParsedEmail (headers + plaintext body)
//
// On HTTP 401 from Google we throw a TokenExpired error so the caller
// (poll-gmail) can refresh and retry.

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface GmailMessage {
  id: string;
  threadId: string;
}

export interface ParsedEmail {
  gmailId: string;
  from: string;          // raw From header, e.g. 'Netflix <info@netflix.com>'
  fromEmail: string;     // lowercased address only
  fromDomain: string;    // domain portion of fromEmail
  subject: string;
  snippet: string;
  body: string;          // text/plain (or HTML stripped to text)
  receivedAt: string;    // ISO8601
}

export class TokenExpired extends Error {
  constructor(message = "Gmail access token expired or unauthorized.") {
    super(message);
    this.name = "TokenExpired";
  }
}

// ---------------------------------------------------------------------------
// Gmail API wire types (just the fields we use)
// ---------------------------------------------------------------------------

interface GmailListResponse {
  messages?: GmailMessage[];
  nextPageToken?: string;
  resultSizeEstimate?: number;
}

interface GmailHeader {
  name: string;
  value: string;
}

interface GmailPart {
  partId?: string;
  mimeType?: string;
  filename?: string;
  headers?: GmailHeader[];
  body?: { size?: number; data?: string; attachmentId?: string };
  parts?: GmailPart[];
}

interface GmailFullMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
  internalDate?: string; // ms since epoch as string
  payload?: GmailPart;
}

// ---------------------------------------------------------------------------
// HTTP helper — adds Authorization header, normalises 401 -> TokenExpired
// ---------------------------------------------------------------------------

const GMAIL_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";

async function gmailGet<T>(accessToken: string, path: string): Promise<T> {
  const res = await fetch(`${GMAIL_BASE}${path}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });
  if (res.status === 401) {
    throw new TokenExpired();
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Gmail API ${res.status} ${res.statusText} for ${path}: ${text.slice(0, 300)}`
    );
  }
  return (await res.json()) as T;
}

// ---------------------------------------------------------------------------
// listRecentMessages
// ---------------------------------------------------------------------------

export interface ListRecentOptions {
  /** Gmail search operator value, e.g. "1d", "6h". Default "1d". */
  newerThan?: string;
  /** Max IDs to return. Default 50, max 500 per Gmail API. */
  maxResults?: number;
}

/**
 * List recent Gmail message IDs. Returns at most `maxResults` items.
 * Filters via `q=newer_than:{newerThan}` so the request is cheap.
 */
export async function listRecentMessages(
  accessToken: string,
  opts: ListRecentOptions = {}
): Promise<GmailMessage[]> {
  const newerThan = opts.newerThan ?? "1d";
  const maxResults = Math.min(Math.max(opts.maxResults ?? 50, 1), 500);

  const params = new URLSearchParams({
    q: `newer_than:${newerThan}`,
    maxResults: String(maxResults),
  });

  const resp = await gmailGet<GmailListResponse>(
    accessToken,
    `/messages?${params.toString()}`
  );
  return resp.messages ?? [];
}

// ---------------------------------------------------------------------------
// getMessage — fetch full payload and parse into ParsedEmail
// ---------------------------------------------------------------------------

export async function getMessage(
  accessToken: string,
  messageId: string
): Promise<ParsedEmail> {
  const msg = await gmailGet<GmailFullMessage>(
    accessToken,
    `/messages/${encodeURIComponent(messageId)}?format=full`
  );
  return parseMessage(msg);
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

function decodeBase64Url(data: string): string {
  // Gmail returns base64url (RFC 4648 sec 5) with no padding.
  const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
  const padLen = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + "=".repeat(padLen);
  try {
    // atob handles standard base64. For non-ASCII bytes we go through
    // percent-encoding to recover UTF-8.
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  } catch {
    return "";
  }
}

function headerValue(headers: GmailHeader[] | undefined, name: string): string {
  if (!headers) return "";
  const want = name.toLowerCase();
  for (const h of headers) {
    if (h.name && h.name.toLowerCase() === want) return h.value ?? "";
  }
  return "";
}

function extractAddress(from: string): { email: string; domain: string } {
  const m = from.match(/<([^>]+)>/);
  const email = (m ? m[1] : from).trim().toLowerCase();
  const at = email.lastIndexOf("@");
  const domain = at >= 0 ? email.slice(at + 1) : email;
  return { email, domain };
}

/**
 * Walk a payload tree depth-first and return the first body matching
 * `targetMime`. We prefer text/plain; the caller falls back to text/html.
 */
function findPartByMime(part: GmailPart | undefined, targetMime: string): GmailPart | null {
  if (!part) return null;
  if (part.mimeType === targetMime && part.body?.data) return part;
  if (part.parts && part.parts.length > 0) {
    for (const sub of part.parts) {
      const found = findPartByMime(sub, targetMime);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Very small HTML -> text reduction. We are not building a renderer; we
 * just want a regex matcher (the sender catalog) to see readable text.
 */
function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|tr|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractBody(payload: GmailPart | undefined): string {
  if (!payload) return "";

  // Single-part message: body data sits on the payload itself.
  if (!payload.parts || payload.parts.length === 0) {
    const data = payload.body?.data;
    if (!data) return "";
    const decoded = decodeBase64Url(data);
    return payload.mimeType === "text/html" ? stripHtml(decoded) : decoded;
  }

  // Multipart: prefer text/plain, fall back to text/html stripped.
  const plain = findPartByMime(payload, "text/plain");
  if (plain?.body?.data) return decodeBase64Url(plain.body.data);

  const html = findPartByMime(payload, "text/html");
  if (html?.body?.data) return stripHtml(decodeBase64Url(html.body.data));

  return "";
}

function parseReceivedAt(msg: GmailFullMessage): string {
  if (msg.internalDate) {
    const ms = Number(msg.internalDate);
    if (Number.isFinite(ms) && ms > 0) return new Date(ms).toISOString();
  }
  const dateHeader = headerValue(msg.payload?.headers, "Date");
  if (dateHeader) {
    const t = Date.parse(dateHeader);
    if (Number.isFinite(t)) return new Date(t).toISOString();
  }
  return new Date().toISOString();
}

function parseMessage(msg: GmailFullMessage): ParsedEmail {
  const headers = msg.payload?.headers;
  const from = headerValue(headers, "From");
  const subject = headerValue(headers, "Subject");
  const { email: fromEmail, domain: fromDomain } = extractAddress(from);
  const body = extractBody(msg.payload);

  return {
    gmailId: msg.id,
    from,
    fromEmail,
    fromDomain,
    subject,
    snippet: msg.snippet ?? "",
    body,
    receivedAt: parseReceivedAt(msg),
  };
}
