# apps/web/scripts/

Web-app-specific test runners and orchestrators. The cross-package consistency checkers live at the repo root in `scripts/`; this directory is for tests that exercise web app behavior or boot the web server.

## File index

### `test-l3.ts`
Unit test for the Layer-3 extractor pipeline as exercised through `apps/web/src/lib/extractor.ts`. Verifies L1 (catalog) → L2 (regex) → L3 (heuristic span tagger) routing, span shapes, and confidence values. 17 assertions.

### `test-og-card.ts`
Pixel-regression test for `/opengraph-image` and `/twitter-image`. Fetches each card from a live server, parses the PNG with pngjs, and samples colors at known coordinates. Catches visual regressions (brand color drift, missing accent band, dimensions wrong). Skips cleanly when no server is reachable. 11 assertions.

### `test-health-contract.ts`
Shape contract test for `/api/health`. The `/status` page reads this endpoint and expects specific keys (`envReady.supabase`, `envReady.googleOAuth`, `buildId`, `commit`, etc.). If a future refactor renames a field, this test fails before `/status` silently breaks. 11 assertions.

### `test-welcome-interest.ts`
Smoke test for the gated APK download flow and the express-interest endpoint. Verifies `/welcome` redirects unauthenticated requests, `/api/interest` accepts allowlisted features and rejects unknown ones, `/api/interest` GET returns a dedupe-by-email count, `/api/redeem` returns a canonical token, and `/api/download/apk` only serves when given that token. Skips cleanly when no server is reachable.

### `test-rate-limit.ts`
Unit test for `apps/web/src/lib/rate-limit.ts` — the in-memory per-IP per-bucket rate limiter used by `/api/contact` and `/api/subscribe`. Verifies window expiry, IP isolation, bucket isolation, and the no-IP fallback. 16 assertions.

### `run-integration-tests.ts`
Orchestrates the live-server tests: builds (if `.next` is missing), boots `next start`, waits for `/api/health`, runs the integration tests, kills the server. Used by `pnpm test:integration` and by the pre-push hook.

### `test-watch.ts`
Fast-iteration watch runner. `pnpm test:watch <name>` reruns one test script on file change. `pnpm test:watch` (no arg) shows an interactive picker.

## Running scripts directly

Each can be run on its own for debugging:

```bash
cd apps/web
npx tsx scripts/test-l3.ts
npx tsx scripts/test-og-card.ts        # requires server on :3000
npx tsx scripts/test-health-contract.ts # requires server on :3000
npx tsx scripts/test-welcome-interest.ts # requires server on :3000
npx tsx scripts/run-integration-tests.ts # boots its own server
```

All scripts exit non-zero on failure so they integrate cleanly into CI.
