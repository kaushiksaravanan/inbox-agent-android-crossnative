# Contributing to Inbox Agent

Thanks for the interest. Inbox Agent is a small project with strong opinions — read this before opening a PR.

## Design constraints (non-negotiable)

These are the rules that shape every decision. Violating any of them is grounds for an immediate revert, no matter how clever the implementation:

1. **The server never touches email content.** Not the body, not the subject, not the sender, not any token that could fetch any of those. If your change adds a server-side route that reads, stores, or proxies email content, it does not belong in this project.

2. **Every task carries its provenance.** The `Task.derivedFrom` field is non-optional. The UI's "Why?" panel reads it to explain to the user where this task came from. If you add a new extractor path, it must populate `derivedFrom` correctly. Black-box LLM output without explainable spans is not acceptable.

3. **OAuth tokens never leave the device.** Web tokens live in IndexedDB encrypted with a non-extractable Web Crypto AES-GCM key. Mobile tokens live in Android Keystore via `expo-secure-store`. If you find yourself sending a token over the wire to our server, stop.

4. **PKCE replaces the client_secret in browsers and mobile apps.** No `client_secret` ships in any client bundle. Ever.

5. **No silent error swallowing.** If a code path can fail in a way the user should know about, surface it. `try { ... } catch {}` blocks need a `// eslint-disable-next-line no-empty-block — REASON` comment that explains why eating the error is correct.

6. **Honest documentation.** The `pnpm test` SPEC-consistency check (`scripts/check-spec-consistency.ts`) verifies that `SPEC.md`'s claims about routes, files, and tables match the actual codebase. If you change one, the other must change too.

## Local setup

```bash
pnpm install
pnpm dev          # everything in parallel via Turbo
```

Per-app: `pnpm --filter @inbox/web dev` or `pnpm --filter @inbox/mobile dev`.

For the mobile app on a real phone with Expo Go, set `EXPO_PUBLIC_SUPABASE_URL` to your machine's LAN IP, not `localhost`.

## Before opening a PR

Run the full quality bar locally:

```bash
pnpm verify            # runs lint + typecheck + test + build in order (the full quality bar)
pnpm lint              # ESLint across all packages, must be clean
pnpm typecheck         # web + mobile, must be clean
pnpm test              # 263 assertions across unit/SPEC/README/rule-audit/OG-card/health-contract
pnpm test:watch <name> # iterate on a single test script (re-runs on save)
pnpm test:integration  # boots server, runs OG + health contract tests, kills server
pnpm build             # web + mobile builds must succeed
pnpm format            # apply Prettier across the workspace (use sparingly — large diffs)
pnpm format:check      # check formatting without writing
```

Prettier is wired up but **not** in the verify pipeline. The codebase predates the current `.prettierrc`, so running `pnpm format` once will reformat ~388 files. Do that on a clean branch when you're ready to lock formatting in.

If you're working on UI changes, also:

```bash
cd apps/web
npx next build && npx next start -p 3000
# In another shell, run Lighthouse on whatever pages you touched:
npx lighthouse http://localhost:3000/<your-page> --preset=desktop
```

Target: 95+ on every Lighthouse category. The current production baseline is 99/100/100/100 desktop, 93/100/100/100 mobile.

## Enable the pre-push hook

The hook in `.githooks/pre-push` runs typecheck + tests before allowing any push. Enable it once:

```bash
git config core.hooksPath .githooks
```

To bypass once (e.g. WIP branch): `git push --no-verify`.

## Where things live

```
apps/web/           Next.js 14 dashboard + marketing site
apps/mobile/        Expo Android app
packages/shared/    Shared types, Zod schemas, sender catalog, L3 extractor slot
packages/ui/        Shared React components (web-only)
supabase/           Postgres schema + the one remaining edge function
docs/               Setup guides + auditing notes
scripts/            check-spec-consistency.ts (CI-style consistency assertion)
.githooks/          pre-push hook (gates push on typecheck + tests)
```

See [README.md](README.md) for the architecture overview, [SPEC.md](SPEC.md) for the full design, and [docs/gcp-setup/](docs/gcp-setup/) for OAuth setup.

## Style

- TypeScript strict mode everywhere.
- Prefer named exports over default exports (one default per file is OK when it's the obvious thing).
- Comments explain *why*, not *what*. The code says what.
- No emoji in production prose. They're OK in changelogs, comments, and chat.
- Imperative-form task titles in extractor output: "Cancel Netflix before midnight", not "Netflix subscription".

## Things that won't be accepted

- Server-side email reading, even as a "fallback" or "for users who can't run local AI"
- LLM calls without a `derivedFrom` audit trail (rule | regex | model + matched spans + confidence)
- Adding a database table for user content (email, tasks, drafts, extracted entities) on the server
- Adding `client_secret` to any client-side bundle
- New providers without a matching update to `packages/shared/src/sender-catalog.ts` and `docs/provider-oauth/<provider>.md`
- Tests with `.skip()` or `.only()` left in
- `console.log` left in production code paths (debug logs OK during dev, must be cleaned before merge)
- Disabled accessibility rules without an inline justification

## License

Source-available, not open-source. Contributions are accepted under the same terms as the rest of the codebase.
