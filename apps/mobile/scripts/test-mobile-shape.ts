// Mobile lib modules — surface-area shape test.
//
// Mobile code can't run from Node (Hermes, expo-modules). We parse
// each lib file and assert it still exports the functions the rest
// of the app imports. If a refactor removes / renames a function,
// this test catches it at the source instead of letting the bug
// surface as a build error in Metro.
//
// Run: cd apps/web && npx tsx ../mobile/scripts/test-mobile-shape.ts

import { readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

const MOBILE_LIB = resolve(__dirname, "..", "src", "lib");

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

// Each entry: file, expected export names. Some are functions, some
// are constants or types. We check for the export keyword + name token
// so renames trip the test without needing per-export AST parsing.
const modules: Array<{ file: string; exports: string[] }> = [
  {
    file: "gmail-client.ts",
    exports: ["listRecentMessages", "getMessage", "TokenExpired", "ParsedEmail"],
  },
  {
    file: "gmail-oauth.ts",
    exports: ["useGmailAuth", "getValidAccessToken", "revokeGmailAccess", "isGmailConnected"],
  },
  {
    file: "integrity.ts",
    exports: ["getIntegrityToken"],
  },
  {
    file: "notifications.ts",
    exports: ["ALARM_CHANNEL_ID", "ALARM_CATEGORY_ID"],
  },
  {
    file: "poll-gmail.ts",
    exports: ["pollGmailAndExtract", "schedulePolling"],
  },
  {
    file: "privacy.ts",
    exports: [],
  },
  {
    file: "supabase.ts",
    exports: ["supabase"],
  },
  {
    file: "theme.ts",
    exports: ["colors", "spacing", "radii", "fontSizes"],
  },
  {
    file: "widget.ts",
    exports: [],
  },
];

for (const m of modules) {
  const path = join(MOBILE_LIB, m.file);
  if (!existsSync(path)) {
    check(`${m.file} exists`, false);
    continue;
  }
  check(`${m.file} exists`, true);

  const src = readFileSync(path, "utf8");
  for (const exp of m.exports) {
    // Look for any `export ... <name>` pattern: function, const, type, class.
    const re = new RegExp(
      `export\\s+(async\\s+)?(function|const|let|var|class|type|interface)\\s+${exp}\\b`,
    );
    check(`${m.file} exports ${exp}`, re.test(src));
  }
}

console.log();
console.log(`mobile shape test: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
