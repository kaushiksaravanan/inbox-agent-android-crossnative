"use client";

import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        <main className="min-h-screen flex items-center justify-center px-6 bg-bg-cream">
          <div className="max-w-md text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Something went wrong
            </p>
            <h1 className="mt-2 font-display text-4xl">
              We hit a snag.
            </h1>
            <p className="mt-3 text-sm text-muted">
              The Inbox Agent ran into an unexpected error. Try again, or head
              back home.
            </p>
            <div className="mt-6 flex gap-3 justify-center">
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center rounded-full bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-5 py-2 transition-colors"
              >
                Try again
              </button>
              <Link
                href="/"
                className="inline-flex items-center rounded-full border border-border text-fg text-sm font-semibold px-5 py-2 hover:bg-foreground/5 transition-colors"
              >
                Back home
              </Link>
            </div>
            {error.digest ? (
              <p className="mt-6 text-xs text-muted/60">
                Error ID: <code className="font-mono">{error.digest}</code>
              </p>
            ) : null}
          </div>
        </main>
      </body>
    </html>
  );
}
