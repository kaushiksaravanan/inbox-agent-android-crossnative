"use client";

// Pill-button row for choosing how often we poll connected mailboxes. The
// underlying setting lives on user_settings.sync_interval_minutes; we PATCH
// /api/settings on click and update local state optimistically so the UI
// snaps to the new pill before the round-trip completes.

import { useState, useTransition } from "react";

const OPTIONS: { value: 5 | 15 | 30 | 60; label: string }[] = [
  { value: 5, label: "5m" },
  { value: 15, label: "15m" },
  { value: 30, label: "30m" },
  { value: 60, label: "1h" },
];

export function SyncIntervalPills({
  initial,
}: {
  initial: 5 | 15 | 30 | 60;
}) {
  const [value, setValue] = useState<5 | 15 | 30 | 60>(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function choose(next: 5 | 15 | 30 | 60) {
    if (next === value) return;
    const prev = value;
    setValue(next);
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sync_interval_minutes: next }),
        });
        if (!res.ok) {
          setValue(prev);
          setError("Couldn't save. Try again.");
        }
      } catch {
        setValue(prev);
        setError("Network error. Try again.");
      }
    });
  }

  return (
    <div>
      <div
        role="radiogroup"
        aria-label="Sync interval"
        className="inline-flex flex-wrap gap-2"
      >
        {OPTIONS.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={pending}
              onClick={() => choose(o.value)}
              className={
                "rounded-full px-4 py-1.5 text-sm font-medium border transition-colors " +
                (active
                  ? "bg-primary-500 border-primary-500 text-white shadow-soft"
                  : "bg-white border-border text-fg hover:bg-stone-50") +
                (pending ? " opacity-70 cursor-wait" : "")
              }
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {error ? (
        <p className="mt-2 text-xs text-red-600">{error}</p>
      ) : null}
    </div>
  );
}
