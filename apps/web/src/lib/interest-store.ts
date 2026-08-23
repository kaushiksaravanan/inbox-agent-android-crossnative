// Append-only JSON-lines store for interest signals.
//
// One file per "feature" key (outlook, ios, fastmail, public-sale, etc.).
// Lines are JSON objects: { email, ts, ip_hash, ua, source }.
//
// No database dependency — fits the thin-Next-server invariant. When we
// outgrow this, swap the impl for Supabase without changing callers.

import { appendFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";

const ROOT = join(process.cwd(), ".data", "interest");

function ensureDir() {
  if (!existsSync(ROOT)) mkdirSync(ROOT, { recursive: true });
}

function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

export interface InterestEntry {
  email: string;
  feature: string;
  source?: string;
  ts: string;
  ip_hash: string;
  ua?: string;
}

export function recordInterest(opts: {
  email: string;
  feature: string;
  source?: string;
  ip: string;
  ua?: string;
}): InterestEntry {
  ensureDir();
  const entry: InterestEntry = {
    email: opts.email.trim().toLowerCase(),
    feature: opts.feature,
    source: opts.source,
    ts: new Date().toISOString(),
    ip_hash: hashIp(opts.ip),
    ua: opts.ua?.slice(0, 200),
  };
  const path = join(ROOT, `${opts.feature}.jsonl`);
  appendFileSync(path, JSON.stringify(entry) + "\n", "utf8");
  return entry;
}

export function countInterest(feature: string): number {
  ensureDir();
  const path = join(ROOT, `${feature}.jsonl`);
  if (!existsSync(path)) return 0;
  const lines = readFileSync(path, "utf8").split("\n").filter(Boolean);
  const seen = new Set<string>();
  for (const line of lines) {
    try {
      const e = JSON.parse(line) as InterestEntry;
      seen.add(e.email);
    } catch {
      // skip malformed line
    }
  }
  return seen.size;
}

// Allowlist — only features we publicly surface. Prevents arbitrary
// data from being written under attacker-controlled feature keys.
export const VALID_FEATURES = new Set([
  "outlook",
  "apple-mail",
  "fastmail",
  "proton",
  "ios",
  "public-sale",
  "byok",
  "team-plan",
]);
