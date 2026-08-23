// OG card pixel regression test.
//
// The /opengraph-image and /twitter-image edge routes render brand-matched
// social cards via next/og + satori. Satori's flex layout can drift in
// subtle ways across satori version bumps (margin-auto handling, text
// metrics, etc.). This test renders both cards, parses the resulting PNGs,
// and asserts a few high-confidence brand-color pixels at known coords.
//
// What it does NOT catch: subtle font-rendering drift, sub-pixel kerning
// shifts. What it DOES catch: the accent band missing, headline color
// regressed, paper background turned the wrong shade, dimensions wrong.
//
// Run: cd apps/web && npx tsx scripts/test-og-card.ts
// (Requires the web dev/prod server running on http://localhost:3000.)

import { PNG } from "pngjs";

const BASE = process.env.OG_TEST_BASE ?? "http://localhost:3000";

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

// Brand colors from globals.css / theme.ts.
const PAPER = { r: 0xfa, g: 0xfa, b: 0xf8 }; // #fafaf8
const INK = { r: 0x10, g: 0x10, b: 0x10 };   // #101010
const ACCENT = { r: 0xc6, g: 0x42, b: 0x10 }; // #c64210

function colorDist(a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }): number {
  return Math.sqrt(
    Math.pow(a.r - b.r, 2) + Math.pow(a.g - b.g, 2) + Math.pow(a.b - b.b, 2),
  );
}

function pixelAt(png: PNG, x: number, y: number): { r: number; g: number; b: number } {
  const idx = (png.width * y + x) << 2;
  return {
    r: png.data[idx]!,
    g: png.data[idx + 1]!,
    b: png.data[idx + 2]!,
  };
}

function near(
  png: PNG,
  x: number,
  y: number,
  expected: { r: number; g: number; b: number },
  tolerance = 12,
): boolean {
  const got = pixelAt(png, x, y);
  return colorDist(got, expected) <= tolerance;
}

async function fetchPng(url: string): Promise<PNG> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${url} failed: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return new Promise<PNG>((resolve, reject) => {
    new PNG().parse(buf, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

(async () => {
  // ---------------------------------------------------------------------------
  // Skip cleanly when the server isn't reachable. `pnpm test` shouldn't fail
  // just because nobody booted next start — that's the integration-test
  // layer's job. CI invokes us with the server already up.
  // ---------------------------------------------------------------------------
  try {
    const probe = await fetch(`${BASE}/api/health`, {
      signal: AbortSignal.timeout(2000),
    });
    if (!probe.ok) throw new Error(`health ${probe.status}`);
  } catch (err) {
    console.log(`SKIP og-card pixel regression — no server at ${BASE} (${err instanceof Error ? err.message : err}).`);
    console.log(`     To run this test, start the web server first:`);
    console.log(`       cd apps/web && npx next build && npx next start -p 3000 &`);
    process.exit(0);
  }

  // ---------------------------------------------------------------------------
  // /opengraph-image — 1200×630
  // ---------------------------------------------------------------------------

  console.log("\n[1/2] /opengraph-image:");
  const og = await fetchPng(`${BASE}/opengraph-image`);
  check(`dimensions are 1200×630`, og.width === 1200 && og.height === 630, `${og.width}×${og.height}`);

  // Top-left site mark — should be near-black at (100, 100) (inside the 56×56 black square at padding 72).
  check(`top-left mark is near-black at (100, 100)`, near(og, 100, 100, INK, 25), pixelAt(og, 100, 100));

  // Paper background — far-left around y=550 should be cream paper.
  check(`paper background at (40, 550) is cream`, near(og, 40, 550, PAPER, 8), pixelAt(og, 40, 550));

  // Accent band — bottom-right corner. The band is 480px wide and 12px tall at the bottom.
  check(`accent band at bottom-right (1100, 624) is accent orange`, near(og, 1100, 624, ACCENT, 20), pixelAt(og, 1100, 624));

  // Center area should be cream (the layout has headline on the left,
  // empty space on the right around y=300, x=900).
  check(`right-of-headline at (900, 200) is paper`, near(og, 900, 200, PAPER, 8), pixelAt(og, 900, 200));

  // ---------------------------------------------------------------------------
  // /twitter-image — 1200×600
  // ---------------------------------------------------------------------------

  console.log("\n[2/2] /twitter-image:");
  const tw = await fetchPng(`${BASE}/twitter-image`);
  check(`dimensions are 1200×600`, tw.width === 1200 && tw.height === 600, `${tw.width}×${tw.height}`);

  // Top-left mark — Twitter layout has a smaller mark at ~(90, 95).
  check(`top-left mark area is near-black at (95, 95)`, near(tw, 95, 95, INK, 30), pixelAt(tw, 95, 95));

  // Paper background somewhere safe.
  check(`paper background at (600, 50) is cream`, near(tw, 600, 50, PAPER, 8), pixelAt(tw, 600, 50));

  // Accent band — bottom-right, 480px wide, 10px tall on the Twitter card.
  check(`accent band at bottom-right (1100, 594) is accent orange`, near(tw, 1100, 594, ACCENT, 20), pixelAt(tw, 1100, 594));

  // ---------------------------------------------------------------------------
  // File size sanity — if either jumps past 100KB the design probably
  // grew an image asset that shouldn't be there.
  // ---------------------------------------------------------------------------

  const ogBytes = await fetch(`${BASE}/opengraph-image`).then((r) => r.arrayBuffer());
  const twBytes = await fetch(`${BASE}/twitter-image`).then((r) => r.arrayBuffer());
  check(`/opengraph-image is under 100KB`, ogBytes.byteLength < 100_000, `${ogBytes.byteLength} bytes`);
  check(`/twitter-image is under 100KB`, twBytes.byteLength < 100_000, `${twBytes.byteLength} bytes`);

  console.log();
  console.log(`OG card pixel regression: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
})();
