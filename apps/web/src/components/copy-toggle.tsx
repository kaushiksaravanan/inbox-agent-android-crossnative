"use client";

import { useEffect, useState } from "react";
import type { CopyMode } from "@/lib/copy";

const STORAGE_KEY = "inbox.copy-mode";
const EVENT_NAME = "inbox:copy-mode";

export function CopyToggle() {
  const [mode, setMode] = useState<CopyMode>("simple");
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage after mount to avoid SSR mismatch.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "simple" || stored === "buzzword") {
        setMode(stored);
      }
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  // Keep this component in sync with toggles fired elsewhere on the page.
  useEffect(() => {
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<CopyMode>).detail;
      if (detail === "simple" || detail === "buzzword") {
        setMode(detail);
      }
    };
    window.addEventListener(EVENT_NAME, onChange as EventListener);
    return () =>
      window.removeEventListener(EVENT_NAME, onChange as EventListener);
  }, []);

  const select = (next: CopyMode) => {
    if (next === mode) return;
    setMode(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
    window.dispatchEvent(new CustomEvent<CopyMode>(EVENT_NAME, { detail: next }));
  };

  return (
    <div
      role="group"
      aria-label="Copy style"
      className="inline-flex items-center rounded-full bg-white px-1 py-1 mono text-[10px] uppercase tracking-[0.12em]"
      style={{
        border: "1px solid color-mix(in srgb, var(--ink) 15%, transparent)",
      }}
    >
      <Segment
        active={hydrated && mode === "simple"}
        onClick={() => select("simple")}
      >
        Simple
      </Segment>
      <Segment
        active={hydrated && mode === "buzzword"}
        onClick={() => select("buzzword")}
      >
        Buzzword
      </Segment>
    </div>
  );
}

function Segment({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`px-3 py-1 rounded-full transition-colors ${
        active
          ? "text-white"
          : "text-[var(--ink-mid)] hover:text-[var(--ink)]"
      }`}
      style={active ? { background: "var(--accent)" } : undefined}
    >
      {children}
    </button>
  );
}
