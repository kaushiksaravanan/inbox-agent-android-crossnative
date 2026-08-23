// Unit test for apps/web/src/lib/rate-limit.ts.
//
// Pure logic — no network, no server. Tests the in-memory limiter against
// fabricated Request objects.

import { rateLimit, _resetRateLimitForTests } from "../src/lib/rate-limit";

let passed = 0;
let failed = 0;
function check(label: string, cond: boolean, detail?: unknown) {
  if (cond) {
    passed += 1;
    console.log(`✓ ${label}`);
  } else {
    failed += 1;
    console.log(`✗ ${label}`);
    if (detail !== undefined) console.log("  detail:", detail);
  }
}

function fakeRequest(ip: string): Request {
  return new Request("http://localhost/test", {
    method: "POST",
    headers: { "x-forwarded-for": ip },
  });
}

// ---------------------------------------------------------------------------
// 1. First request from a new IP is always allowed.
// ---------------------------------------------------------------------------

_resetRateLimitForTests();
const limit3 = rateLimit({ bucket: "test1", max: 3, windowMs: 60_000 });
const r1 = limit3(fakeRequest("1.1.1.1"));
check("first request is allowed", r1.ok);
check("remaining is max-1 after first request", r1.remaining === 2, r1);

// ---------------------------------------------------------------------------
// 2. The Nth request is denied once max is exceeded.
// ---------------------------------------------------------------------------

_resetRateLimitForTests();
const limit2 = rateLimit({ bucket: "test2", max: 2, windowMs: 60_000 });
const allowed1 = limit2(fakeRequest("2.2.2.2"));
const allowed2 = limit2(fakeRequest("2.2.2.2"));
const denied = limit2(fakeRequest("2.2.2.2"));
check("1st request within max is allowed", allowed1.ok);
check("2nd request within max is allowed", allowed2.ok);
check("3rd request exceeds max=2 and is denied", !denied.ok, denied);
check("denied request has retryAfter > 0", denied.retryAfter > 0);

// ---------------------------------------------------------------------------
// 3. Distinct IPs have independent counters.
// ---------------------------------------------------------------------------

_resetRateLimitForTests();
const limitPerIp = rateLimit({ bucket: "test3", max: 1, windowMs: 60_000 });
const ipA = limitPerIp(fakeRequest("3.3.3.3"));
const ipB = limitPerIp(fakeRequest("4.4.4.4"));
const ipAagain = limitPerIp(fakeRequest("3.3.3.3"));
check("IP A's first request is allowed", ipA.ok);
check("IP B's first request is allowed (independent counter)", ipB.ok);
check("IP A's second request is denied", !ipAagain.ok);

// ---------------------------------------------------------------------------
// 4. Different buckets have independent counters even for same IP.
// ---------------------------------------------------------------------------

_resetRateLimitForTests();
const contact = rateLimit({ bucket: "contact", max: 1, windowMs: 60_000 });
const subscribe = rateLimit({ bucket: "subscribe", max: 1, windowMs: 60_000 });
const cRes = contact(fakeRequest("5.5.5.5"));
const sRes = subscribe(fakeRequest("5.5.5.5"));
check("contact bucket first request allowed", cRes.ok);
check("subscribe bucket first request from same IP also allowed", sRes.ok);

// ---------------------------------------------------------------------------
// 5. Missing x-forwarded-for falls back to "local" — multiple unidentified
//    clients share the same bucket entry. (Test by making 2 requests w/o IP.)
// ---------------------------------------------------------------------------

_resetRateLimitForTests();
const noIpLimit = rateLimit({ bucket: "no-ip", max: 1, windowMs: 60_000 });
const noIp1 = noIpLimit(new Request("http://localhost/", { method: "POST" }));
const noIp2 = noIpLimit(new Request("http://localhost/", { method: "POST" }));
check("first no-IP request is allowed", noIp1.ok);
check("second no-IP request (same fallback bucket) is denied", !noIp2.ok);

// ---------------------------------------------------------------------------
// 6. Window expiry resets the counter. We simulate by using a tiny window.
// ---------------------------------------------------------------------------

(async () => {
  _resetRateLimitForTests();
  const fastLimit = rateLimit({ bucket: "expiry", max: 1, windowMs: 50 });
  const before = fastLimit(fakeRequest("6.6.6.6"));
  check("before window expiry: allowed", before.ok);
  const beforeAgain = fastLimit(fakeRequest("6.6.6.6"));
  check("before window expiry: second request denied", !beforeAgain.ok);
  await new Promise((r) => setTimeout(r, 80));
  const after = fastLimit(fakeRequest("6.6.6.6"));
  check("after window expiry: counter has reset, request allowed", after.ok);

  console.log();
  console.log(`rate-limit: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
})();
