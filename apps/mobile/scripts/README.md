# apps/mobile/scripts/

Mobile-app-specific test runners. Mobile code can't actually execute from Node (Hermes / native modules), so these scripts test what they can: extractor logic that doesn't depend on RN, formatter pure functions, and **shape tests** that parse source files to verify exports.

## File index

### `test-l3-mobile.ts`
Mirrors `apps/web/scripts/test-l3.ts` but exercises the mobile extractor pipeline. The mobile extractor uses a different ID generator (timestamp+random, no `crypto.randomUUID`) so this test catches drift between the two. 12 assertions.

### `test-background-poll.ts`
Pure-function test for the `formatBackgroundStatus` helper that the Settings UI uses. Asserts the human-readable status string for every `BackgroundFetchStatus` enum value. 8 assertions.

### `test-local-db-shape.ts`
The mobile local-db wrapper depends on `expo-sqlite` which only loads in a React Native runtime. This script parses the source file instead and verifies each expected function is still exported. 15 assertions.

### `test-mobile-shape.ts`
Same idea as `test-local-db-shape.ts` but covers every other mobile lib module: `gmail-client`, `gmail-oauth`, `integrity`, `notifications`, `poll-gmail`, `supabase`, `theme`, `widget`. 27 assertions.

## Running scripts directly

Mobile scripts have no native dependencies, so they run cleanly from Node:

```bash
cd apps/web
npx tsx ../mobile/scripts/test-l3-mobile.ts
npx tsx ../mobile/scripts/test-background-poll.ts
npx tsx ../mobile/scripts/test-local-db-shape.ts
npx tsx ../mobile/scripts/test-mobile-shape.ts
```

(We run them from `apps/web` because that's where `tsx` is installed as a devDep.)
