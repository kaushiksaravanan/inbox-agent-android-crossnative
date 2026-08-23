// Single source of truth for invite codes. Both /api/redeem and
// /api/download/apk import from here so a token that survives redeem also
// passes the download gate. Move to Supabase when we add per-code usage
// counts; the canon() helper stays.

export const canon = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");

const RAW_CODES = [
  "EARLY-ACCESS-2026",
  "FRIEND-OF-KAUSHIK",
  "PRODUCTHUNT",
  "HACKERNEWS",
  "REDDIT-LOCAL-FIRST",
];

export const VALID_CODES: ReadonlySet<string> = new Set(RAW_CODES.map(canon));

export const isValidCode = (input: string): boolean =>
  VALID_CODES.has(canon(input));
