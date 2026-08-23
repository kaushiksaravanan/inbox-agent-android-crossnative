// Simple in-memory rate limiter.
//
// Counts requests per IP per window and rejects beyond a threshold. Lives
// in process memory — doesn't survive a restart, doesn't share across
// instances. For our scale (one Next host or a small set behind a CDN
// edge cache), that's sufficient. If we ever need durable / distributed
// limits, swap the Map for Redis / Upstash without changing callers.
//
// Each route picks its own bucket name + limits.
//
// Usage:
//
//   import { rateLimit } from "@/lib/rate-limit";
//
//   const limit = rateLimit({ bucket: "contact", max: 5, windowMs: 60_000 });
//   const allowed = limit(request);
//   if (!allowed.ok) {
//     return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
//   }

interface BucketEntry {
  count: number;
  resetAt: number; // epoch ms
}

const buckets = new Map<string, Map<string, BucketEntry>>();

export interface RateLimitConfig {
  /** Bucket name — distinct counters per route. */
  bucket: string;
  /** Max requests per window per IP. */
  max: number;
  /** Window length in ms. */
  windowMs: number;
}

export interface RateLimitResult {
  ok: boolean;
  /** Remaining requests in the current window. */
  remaining: number;
  /** Seconds until the window resets. */
  retryAfter: number;
}

function getIp(request: Request): string {
  // Trust x-forwarded-for from the platform (Vercel, CF) — first hop is the client.
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  // Fall back to a constant so local-dev requests share a bucket.
  return "local";
}

/**
 * Returns a function that, given a Request, increments the IP's count
 * and returns whether the request is allowed.
 */
export function rateLimit(config: RateLimitConfig) {
  if (!buckets.has(config.bucket)) buckets.set(config.bucket, new Map());
  const bucket = buckets.get(config.bucket)!;

  return (request: Request): RateLimitResult => {
    const ip = getIp(request);
    const now = Date.now();
    let entry = bucket.get(ip);

    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + config.windowMs };
      bucket.set(ip, entry);
    }

    entry.count += 1;
    const remaining = Math.max(0, config.max - entry.count);
    const retryAfter = Math.max(0, Math.ceil((entry.resetAt - now) / 1000));

    return {
      ok: entry.count <= config.max,
      remaining,
      retryAfter,
    };
  };
}

/**
 * Reset all buckets. Test helper; never call from production code.
 */
export function _resetRateLimitForTests(): void {
  buckets.clear();
}
