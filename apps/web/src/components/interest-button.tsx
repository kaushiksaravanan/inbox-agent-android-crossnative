"use client";

import { useState } from "react";

interface InterestButtonProps {
  feature: string;
  label?: string;
  className?: string;
  source?: string;
  /** Inline vs popover layout. */
  variant?: "inline" | "compact";
}

interface InterestResponse {
  ok: boolean;
  count?: number;
  message?: string;
  error?: string;
}

export function InterestButton({
  feature,
  label,
  className = "",
  source,
  variant = "compact",
}: InterestButtonProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InterestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), feature, source }),
      });
      const data = (await res.json()) as InterestResponse;
      if (!data.ok) {
        setError(
          data.error === "rate_limited"
            ? "Too many requests. Wait a minute."
            : data.error === "unknown_feature"
              ? "Configuration error — let us know."
              : data.error ?? "Something went wrong.",
        );
      } else {
        setResult(data);
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (result?.ok) {
    return (
      <span className={`inline-flex items-center gap-2 text-[12px] mono text-emerald-700 ${className}`}>
        <span aria-hidden>✓</span>
        On the list{result.count ? ` · ${result.count} others waiting` : ""}
      </span>
    );
  }

  if (variant === "inline") {
    return (
      <form onSubmit={submit} className={`flex flex-col sm:flex-row gap-2 ${className}`}>
        <input
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          required
          placeholder="your@email.com"
          aria-label={`Email for ${feature} interest`}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 rounded-full border border-black/15 bg-white px-4 py-2 text-sm placeholder:text-black/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        />
        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="shrink-0 inline-flex items-center gap-2 bg-[var(--accent)] text-white rounded-full px-5 py-2 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
        >
          {loading ? "..." : label ?? "Notify me"}
        </button>
        {error && <span role="alert" className="text-[12px] mono text-red-600 self-center">{error}</span>}
      </form>
    );
  }

  if (!open) {
    const visibleLabel = label ?? "+ I want this";
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 text-[12px] mono underline decoration-dotted hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 rounded ${className}`}
        // aria-label must contain the visible text to satisfy the
        // label-content-name-mismatch axe rule. We append the feature name
        // so screen-reader users hear which feature they're voting for.
        aria-label={`${visibleLabel} — ${feature}`}
      >
        {visibleLabel}
      </button>
    );
  }

  return (
    <form onSubmit={submit} className={`inline-flex flex-wrap items-center gap-2 ${className}`}>
      <input
        type="email"
        name="email"
        autoComplete="email"
        inputMode="email"
        required
        autoFocus
        placeholder="email"
        aria-label={`Email for ${feature} interest`}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="rounded-full border border-black/15 bg-white px-3 py-1 text-[12px] placeholder:text-black/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] w-44"
      />
      <button
        type="submit"
        disabled={loading || !email.trim()}
        className="shrink-0 inline-flex items-center gap-1 bg-[var(--accent)] text-white rounded-full px-3 py-1 text-[12px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
      >
        {loading ? "..." : "Add me"}
      </button>
      {error && <span role="alert" className="text-[11px] mono text-red-600">{error}</span>}
    </form>
  );
}
