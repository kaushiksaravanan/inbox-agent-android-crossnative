# Roadmap

What's planned, what's not, what's been ruled out. This file is the source of truth for "is feature X coming?" — promises made here will land or be explicitly removed. README, marketing pages, and SPEC may reference this file.

Order within a section is rough priority (top = next), not commitment to ship in that exact order. **Dates are intentionally absent** — this is a one-person project and dates lie.

---

## In flight

Things actively being worked on right now.

- (none)

---

## Next up

Things that will land, in roughly this order, once the current focus clears. Not yet started.

- **OAuth verification submission to Google.** Required to lift the 100-test-user cap on `gmail.readonly`. Assets ready at `.secrets/oauth-assets/`; checklist at `docs/gcp-setup/OAUTH-VERIFICATION-CHECKLIST.md`. Submission itself is a manual step in Cloud Console. Review takes 3–6 weeks after submit.
- **Android OAuth client.** Web client is configured and smoke-tested. Android client (different type, SHA-1-bound) is documented in `docs/gcp-setup/ANDROID-OAUTH.md` but not yet created in Cloud Console.
- **License verification endpoint.** `/api/license-verify` accepting Stripe / App Store / Play Store receipts. Schema and table (`licenses`) already exist; the endpoint doesn't.
- **GLiNER drop-in for Layer 3.** The L3 extractor slot is wired with a heuristic span tagger today. Swapping in a quantized GLiNER ONNX (~25 MB) is a one-line change in `extractor-l3.ts`. The decision gate is whether the heuristic's accuracy on real user inboxes turns out to need the upgrade.

## On the table, no decision yet

Things that have been considered but not committed.

- **Outlook / Microsoft 365 support.** Doc skeleton in `docs/provider-oauth/outlook.md`. Same PKCE pattern as Gmail. Demand-gated — will land if more than a handful of users ask, otherwise we stay Gmail-only at first.
- **Self-hosted edition.** Referenced in README pricing copy. Would require either (a) baking the marketing site + pair-device relay into a single Docker image, or (b) shipping just the apps and using a third-party Supabase project. Both options are feasible; neither is started.
- **iOS app.** App config has placeholders for iOS but no working pipeline. Bundle ID is reserved. No App Store account yet.
- **`docs/user-stories/CANONICAL.md` rewrite.** The doc is currently flagged with a staleness banner because the technical touchpoints describe v1 architecture. The user-facing acceptance criteria are still mostly right. Full rewrite would re-align tech sections with the local-first architecture.
- **`@inbox/ui` package decision.** Currently wired in `tsconfig.json` paths and `transpilePackages` in next.config, but no source file actually imports from it. Two options: (a) consolidate web's shared components into `@inbox/ui` so the package earns its keep, or (b) delete the package and its tooling references. Today it's neither — wasted boilerplate.

## Ruled out (and not coming back)

These were considered and explicitly dropped. If you find yourself wanting to add one, re-read [CONTRIBUTING.md](CONTRIBUTING.md) first.

- **Server-side email reading.** The pivot to local-first was deliberate and is the trust moat. Adding "just a tiny server path for users who can't run local AI" would undo the whole point.
- **Reply drafting.** Read-only is the entire OAuth scope contract. Drafting / sending is out of scope forever.
- **Style learning / per-user LLM fine-tuning.** Removed in v0.2. The audit-trail-first design rules out opaque per-user models.
- **Subscription pricing.** $49 one-time is the decision. No usage tier, no "pro" features gated above the line.
- **Server-side cron over user data.** The dropped pg_cron jobs (`extract-tasks`, `send-followups`, `learn-style`) are not coming back. All scheduled work happens on the user's device.
- **IMAP / app-password providers (iCloud, Yahoo IMAP, AOL).** Doc skeletons exist but the security model (storing IMAP credentials on the device with no way to revoke them remotely) doesn't fit our trust posture. We will wait for OAuth-equivalent flows from those providers, not build the legacy path.

## Recently shipped

For the user-facing version, see `/changelog`. For the developer-facing detail, see [CHANGELOG.md](CHANGELOG.md). Recent highlights:

- **v0.4.1** — Self-protective infrastructure. 238 unit tests + 22 integration tests, 6 cross-doc consistency checks, pre-push hook gating on lint + typecheck + test + integration. Doc-vs-code drift is now a CI failure.
- **v0.4** — Local-first. Server no longer touches email content. Mobile parity. L3 slot wired.
- **Quality infrastructure (post-v0.4 hardening, shipped as v0.4.1).** 238 unit tests + 22 integration tests covering:
  - 3-layer extractor pipeline (web + mobile parity)
  - `@inbox/shared` barrel exports (every deletion verified absent)
  - Background-poll Settings UI state formatter
  - SPEC.md ↔ codebase consistency (meta-tested)
  - README.md ↔ codebase consistency (self-referential count check)
  - CONTRIBUTING.md rule enforcement (6 design constraints checked structurally)
  - OG card pixel regression (gated by live server in pre-push hook)
- **Workspace pipeline.** `pnpm lint` + `pnpm typecheck` + `pnpm test` + `pnpm build` all clean; Turbo cache fingerprints tight; FULL TURBO at ~500ms on no-op rerun.
- **Pre-push hook.** `.githooks/pre-push` runs lint + typecheck + tests + integration before allowing a push. `SKIP_INTEGRATION=1` hatch for fast iteration.
- **Lighthouse + a11y baseline.** Desktop avg 99/100/100/100, mobile (warm) avg 93/100/100/100, axe-core 0 violations across 11 public pages.

---

This file gets updated on the same cadence as `/changelog` and `CHANGELOG.md`. If something is missing from all three, it's not a commitment.
