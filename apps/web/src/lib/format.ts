import { format, formatDistanceToNow, differenceInHours } from "date-fns";

/**
 * Currency-code → symbol fallback used for compact badges where the locale
 * formatter would render something verbose (e.g. "INR 199" instead of "₹199"
 * on locales without the symbol). Kept tiny on purpose — extend only when a
 * real bug shows up.
 */
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  INR: "₹",
  JPY: "¥",
  CNY: "¥",
  CAD: "CA$",
  AUD: "A$",
};

/**
 * Format a monetary amount given in minor units (cents). The currency code
 * should come from the source record — there is no global "default currency".
 * Falls back to the user's browser locale via Intl.NumberFormat.
 */
export function formatCurrency(
  amountMinor: number | null | undefined,
  currency: string | null | undefined,
  locale?: string
): string | null {
  if (amountMinor == null) return null;
  // When currency is null we cannot honestly render a currency-style string —
  // pretend it's USD only when the caller explicitly opts in elsewhere. Here
  // we render a bare number to avoid lying about the unit.
  if (!currency) {
    return new Intl.NumberFormat(locale, {
      maximumFractionDigits: amountMinor % 100 === 0 ? 0 : 2,
    }).format(amountMinor / 100);
  }
  const code = currency.toUpperCase();
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
      currencyDisplay: "narrowSymbol",
      maximumFractionDigits: amountMinor % 100 === 0 ? 0 : 2,
    }).format(amountMinor / 100);
  } catch {
    const symbol = CURRENCY_SYMBOLS[code] ?? code + " ";
    const num = new Intl.NumberFormat(locale, {
      maximumFractionDigits: amountMinor % 100 === 0 ? 0 : 2,
    }).format(amountMinor / 100);
    return `${symbol}${num}`;
  }
}

/**
 * Compact relative-or-absolute date rendering. Relative when the date is
 * within 48 hours of now (good for "in 3 hours" / "5 minutes ago"), absolute
 * thereafter (good for "Fri, Jun 26").
 */
export function formatSmartDate(d: Date | string | number): string {
  const date = d instanceof Date ? d : new Date(d);
  const hours = Math.abs(differenceInHours(date, new Date()));
  if (hours < 48) {
    return formatDistanceToNow(date, { addSuffix: true });
  }
  return format(date, "EEE, MMM d");
}

/**
 * Combined absolute + relative label for due dates. Always shows the absolute
 * date so users on touch don't need to hover to see it.
 */
export function formatDueLabel(d: Date | string | number): string {
  const date = d instanceof Date ? d : new Date(d);
  return `${format(date, "EEE, MMM d")} · ${formatDistanceToNow(date, { addSuffix: true })}`;
}

/**
 * Snooze presets used everywhere snoozing happens. Keep this single source of
 * truth so we don't drift between bulk and per-row menus.
 */
export interface SnoozePreset {
  label: string;
  /** Compute the snooze target as an absolute ISO timestamp. */
  resolve: () => string;
}

export const SNOOZE_PRESETS: SnoozePreset[] = [
  {
    label: "1 hour",
    resolve: () => new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  },
  {
    label: "Until tomorrow 9am",
    resolve: () => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
      return d.toISOString();
    },
  },
  {
    label: "1 day",
    resolve: () => new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    label: "1 week",
    resolve: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

/**
 * Convert a local datetime-local input value (e.g. "2026-07-04T09:30") to an
 * ISO timestamp. Returns null when the string can't be parsed — callers
 * should surface that with a toast, not silently coerce to "now".
 */
export function parseLocalDateTime(input: string): string | null {
  if (!input) return null;
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

/**
 * Build initials for an avatar from a counterparty string. Caps at 2 letters
 * and strips email-domain noise.
 */
export function initialsFrom(input: string | null | undefined): string {
  if (!input) return "?";
  const stripped = input.includes("@") ? input.split("@")[0]! : input;
  const parts = stripped
    .replace(/[._-]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}
