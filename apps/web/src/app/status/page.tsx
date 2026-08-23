import type { Metadata } from "next";
import { MarketingShell, BackLink } from "@/components/marketing-shell";
import { Reveal } from "@/components/reveal";
import { TWITTER_BASE } from "@/lib/metadata-base";

export const metadata: Metadata = {
  title: "Status",
  description:
    "Live service status for Inbox Agent. What our server actually does, and whether it's working.",
  alternates: { canonical: "/status" },
  robots: { index: false, follow: true },
  openGraph: {
    type: "website",
    url: "/status",
    title: "Status",
    description:
      "Live service status for Inbox Agent. What our server actually does, and whether it's working.",
  },
  twitter: {
    ...TWITTER_BASE,
    title: "Status",
    description:
      "Live service status for Inbox Agent. What our server actually does, and whether it's working.",
  },
};

// Always re-fetch at request time so the status reflects reality.
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Health {
  ok: boolean;
  version?: string;
  buildId?: string | null;
  commit?: string | null;
  env?: string;
  envReady?: {
    supabase?: boolean;
    googleOAuth?: boolean;
  };
  time?: string;
}

async function getHealth(): Promise<Health | null> {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "http://localhost:3000";

  try {
    const res = await fetch(`${base}/api/health`, {
      cache: "no-store",
      // 4 second budget — status pages must never hang.
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    return (await res.json()) as Health;
  } catch {
    return null;
  }
}

type StatusLevel = "operational" | "degraded" | "down";

function StatusDot({ level }: { level: StatusLevel }) {
  const color =
    level === "operational"
      ? "bg-emerald-500"
      : level === "degraded"
        ? "bg-amber-500"
        : "bg-red-600";

  return (
    <span className="inline-flex items-center gap-2">
      <span className="relative inline-flex">
        <span
          className={`absolute inline-flex h-2.5 w-2.5 rounded-full ${color} opacity-40 animate-ping`}
          aria-hidden
        />
        <span
          className={`relative inline-flex h-2.5 w-2.5 rounded-full ${color}`}
          aria-hidden
        />
      </span>
    </span>
  );
}

function statusLabel(level: StatusLevel) {
  if (level === "operational") return "Operational";
  if (level === "degraded") return "Degraded";
  return "Down";
}

export default async function StatusPage() {
  const health = await getHealth();
  const apiLevel: StatusLevel = health?.ok ? "operational" : health === null ? "down" : "degraded";

  // The post-local-first server does very little. What it DOES do:
  //   - serve the marketing site + /api/health
  //   - mint/redeem 6-digit pairing codes via the pair-device edge function
  //   - eventually verify license receipts (not shipped yet)
  // Email reading, task extraction, alarm scheduling — all on-device.
  // Nothing to show here for "Sync workers" or "AI provider" because we
  // don't operate either.
  const services: { name: string; level: StatusLevel; detail: string }[] = [
    {
      name: "API & marketing site",
      level: apiLevel,
      detail:
        apiLevel === "operational"
          ? `Up since ${formatTime(health?.time)}`
          : apiLevel === "degraded"
            ? "Reporting issues."
            : "Unreachable.",
    },
    {
      name: "Pairing relay (Supabase edge)",
      level: health?.envReady?.supabase === false ? "degraded" : "operational",
      detail:
        health?.envReady?.supabase === false
          ? "Server env missing Supabase URL — pairing requests will fail."
          : "Mints 6-digit codes (5-min TTL).",
    },
    {
      name: "Google OAuth client",
      level: health?.envReady?.googleOAuth === false ? "degraded" : "operational",
      detail:
        health?.envReady?.googleOAuth === false
          ? "Server env missing client_id — new connections will fail."
          : "PKCE flow accepting auth codes.",
    },
  ];

  const overall: StatusLevel = services.some((s) => s.level === "down")
    ? "down"
    : services.some((s) => s.level === "degraded")
      ? "degraded"
      : "operational";

  return (
    <MarketingShell>
      {/* HERO */}
      <section className="border-b border-black/10">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-20 lg:py-28">
          <Reveal>
            <p className="eyebrow mb-6">Status</p>
            <h1 className="display text-[48px] sm:text-[72px] lg:text-[96px] leading-[0.95]">
              {overall === "operational" ? (
                <>
                  All systems
                  <br />
                  <em className="italic">operational.</em>
                </>
              ) : overall === "degraded" ? (
                <>
                  Partial
                  <br />
                  <em className="italic">degradation.</em>
                </>
              ) : (
                <>
                  Major
                  <br />
                  <em className="italic">outage.</em>
                </>
              )}
            </h1>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mt-8 mono text-xs text-black/60">
              Updated {formatTime(new Date().toISOString())} ·{" "}
              {health?.version ? `v${health.version}` : "version unknown"}
            </p>
          </Reveal>
        </div>
      </section>

      {/* SERVICES */}
      <section className="border-b border-black/10">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-16">
          <p className="eyebrow mb-8">Services</p>
          <div className="border border-black">
            {services.map((s, i) => (
              <div
                key={s.name}
                className={`flex items-center justify-between gap-6 px-6 py-5 ${i < services.length - 1 ? "border-b border-black/10" : ""}`}
              >
                <div className="flex items-center gap-4">
                  <StatusDot level={s.level} />
                  <div>
                    <p className="text-[15px] font-medium">{s.name}</p>
                    <p className="mono text-[11px] text-black/55 mt-0.5">
                      {s.detail}
                    </p>
                  </div>
                </div>
                <span className="mono text-xs uppercase tracking-wider">
                  {statusLabel(s.level)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INCIDENTS */}
      <section className="border-b border-black/10">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-16">
          <div className="grid lg:grid-cols-12 gap-10">
            <div className="lg:col-span-4">
              <p className="eyebrow mb-6">Incidents</p>
              <h2 className="display text-[36px] lg:text-[48px] leading-[1.0]">
                Last 30
                <br />
                <em className="italic">days.</em>
              </h2>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              <div className="border border-black p-8">
                <p className="mono text-xs text-black/55 mb-3">JUNE 2026</p>
                <p className="display text-[24px] leading-[1.1]">
                  None in the last 30 days.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CLOSER */}
      <section>
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-24">
          <BackLink />
        </div>
      </section>
    </MarketingShell>
  );
}

function formatTime(iso?: string) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toISOString().replace("T", " ").slice(0, 19) + " UTC";
  } catch {
    return iso;
  }
}
