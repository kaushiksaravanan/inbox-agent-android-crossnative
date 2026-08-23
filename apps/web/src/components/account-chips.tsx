"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isGmailConnected } from "@/lib/gmail-oauth";

export function AccountChips() {
  // Render a placeholder during hydration so the SSR markup matches.
  const [mounted, setMounted] = useState(false);
  const [gmail, setGmail] = useState(false);

  useEffect(() => {
    setMounted(true);
    setGmail(isGmailConnected());

    const onStorage = () => setGmail(isGmailConnected());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (!mounted) {
    return <div className="hidden sm:block w-32" aria-hidden="true" />;
  }

  if (!gmail) {
    return (
      <div className="hidden sm:flex">
        <Link
          href="/accounts"
          className="inline-flex items-center rounded-full border border-dashed border-border text-xs text-muted hover:text-fg px-3 py-1"
        >
          No accounts connected
        </Link>
      </div>
    );
  }

  return (
    <div className="hidden sm:flex items-center gap-1.5">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs text-primary-700">
        <span className="h-1.5 w-1.5 rounded-full bg-success" />
        Gmail
      </span>
    </div>
  );
}
