import Link from "next/link";
import { ArrowLeft, Flame } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-[var(--paper)]">
      {/* Left: brand panel — clonk lime splash */}
      <aside className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden bg-[var(--lime)]">
        {/* Warm orange glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -left-32 w-[28rem] h-[28rem] rounded-full opacity-50 blur-3xl"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, rgba(255,85,29,0.35) 0%, rgba(255,122,71,0.18) 45%, transparent 70%)",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 right-0 w-[20rem] h-[20rem] rounded-full opacity-30 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(255,85,29,0.42) 0%, transparent 60%)",
          }}
        />

        <div className="relative">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <span
              className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center group-hover:scale-105 transition-transform"
              style={{
                background: "var(--accent)",
                boxShadow: "0 6px 18px rgba(255,85,29,0.32)",
              }}
            >
              <Flame className="w-5 h-5 text-white" strokeWidth={2.5} />
            </span>
            <span className="display text-2xl tracking-[-0.03em]">Inbox Agent</span>
          </Link>
        </div>

        <div className="relative max-w-md">
          <h1 className="display text-4xl leading-tight tracking-[-0.03em]">
            Stop missing what matters in your inbox.
          </h1>
          <p className="mt-4 text-[var(--ink-muted)] text-lg">
            Inbox Agent reads your email so you don&apos;t have to. Get specific alarms
            like &ldquo;Cancel Netflix before Jun 28 &mdash; $15.99&rdquo; &mdash; never another silent auto-renewal.
          </p>
        </div>

        <figure
          className="relative pl-5 max-w-md"
          style={{ borderLeft: "4px solid var(--accent)" }}
        >
          <blockquote className="text-[var(--ink)] leading-relaxed italic">
            &ldquo;I cancelled three forgotten subscriptions in my first week
            &mdash; $47/month back in my account. The Sunday-night inbox dread
            is just gone.&rdquo;
          </blockquote>
          <figcaption className="mt-3 text-sm text-[var(--ink-muted)] not-italic">
            Renee Castillo &middot; Independent designer, Oakland CA
          </figcaption>
        </figure>
      </aside>

      {/* Right: form panel */}
      <main className="bg-[var(--paper)] flex items-center justify-center p-6 sm:p-12 relative">
        {/* Back-to-home top-left of right panel */}
        <Link
          href="/"
          className="absolute top-6 left-6 inline-flex items-center gap-1.5 text-sm text-[var(--ink-muted)] hover:text-[var(--accent)] transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
