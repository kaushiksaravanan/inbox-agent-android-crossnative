"use client";

import { useState } from "react";

interface RedeemResult {
  ok: boolean;
  access?: {
    apk_url: string;
    token: string;
    discord_invite: string;
    github_repo: string;
    message: string;
  };
  error?: string;
}

export function RedeemCode() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RedeemResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = (await res.json()) as RedeemResult;
      if (!data.ok) {
        setError(
          data.error === "invalid_code"
            ? "That code isn't valid. Check for typos or ask who sent it."
            : data.error === "rate_limited"
              ? "Too many attempts. Wait a minute and try again."
              : data.error ?? "Something went wrong.",
        );
      } else {
        setResult(data);
      }
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (result?.access) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center space-y-6">
        <div>
          <p className="display text-[28px] text-emerald-900">You&apos;re in.</p>
          <p className="mt-2 text-sm text-emerald-800">{result.access.message}</p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <a
            href={`${result.access.apk_url}?token=${encodeURIComponent(result.access.token)}`}
            className="inline-flex items-center gap-2 bg-[var(--accent)] text-white rounded-full px-6 py-3 text-sm font-semibold hover:scale-[1.02] transition"
          >
            Download APK
            <span aria-hidden>&darr;</span>
          </a>
          <a
            href={result.access.github_repo}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[var(--night)] text-white rounded-full px-6 py-3 text-sm font-semibold hover:scale-[1.02] transition"
          >
            View Source
            <span aria-hidden>&rarr;</span>
          </a>
          <a
            href={result.access.discord_invite}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white rounded-full px-6 py-3 text-sm font-semibold hover:scale-[1.02] transition"
          >
            Join Discord
            <span aria-hidden>&rarr;</span>
          </a>
        </div>

        <p className="mono text-[11px] text-emerald-700">
          GitHub repo is source-available (view-only license, no redistribution).
          Discord is where we coordinate feedback + bug reports.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex flex-col gap-2">
        <label htmlFor="redeem-code" className="sr-only">
          Invite code
        </label>
        <input
          id="redeem-code"
          name="code"
          type="text"
          placeholder="Invite code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
          autoComplete="one-time-code"
          aria-describedby={error ? "redeem-error" : undefined}
          className="w-full rounded-full border border-white/15 bg-white text-black px-5 py-3 text-sm placeholder:text-black/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--night)] mono uppercase tracking-wider"
        />
        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="w-full inline-flex items-center justify-center gap-2 bg-[var(--accent)] text-white rounded-full px-6 py-3 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--night)] transition"
        >
          {loading ? "Checking..." : "Redeem"}
          {!loading && <span aria-hidden>&rarr;</span>}
        </button>
      </div>

      {error && (
        <p
          id="redeem-error"
          role="alert"
          aria-live="polite"
          className="text-sm text-red-300 mono text-center"
        >
          {error}
        </p>
      )}

      <p className="mono text-[11px] text-white/60 text-center leading-relaxed">
        Got an invite code from a friend, tweet, or Product Hunt? Enter it above.
        <br />
        No code? Purchase a license for $49 instead.
      </p>
    </form>
  );
}
