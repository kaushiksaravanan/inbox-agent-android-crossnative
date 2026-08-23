"use client";

import { useReducedMotion } from "motion/react";

const LANE_A = [
  "BILLS",
  "DEADLINES",
  "FOLLOW-UPS",
  "PAYMENT REMINDERS",
  "AUTOPAY MANDATES",
  "MEETING REQUESTS",
  "SUBSCRIPTION RENEWALS",
];

const LANE_B = [
  "DELIVERY UPDATES",
  "CALENDAR INVITES",
  "INVOICES DUE",
  "NEWSLETTER NOISE",
  "RECEIPTS",
  "ONBOARDING NUDGES",
  "EXPENSE REPORTS",
];

const LANE_C = [
  "VENDOR QUOTES",
  "CONTRACT TERMS",
  "RENEWAL WINDOWS",
  "REIMBURSEMENTS",
  "TRAVEL HOLDS",
  "INTERVIEW SLOTS",
  "TAX NOTICES",
];

/**
 * Marquee3D — three horizontal lanes scrolling at different speeds and
 * directions, masked at the edges. Lane 1 fast, lane 2 normal, lane 3
 * reverse. Pure CSS keyframes so it never blocks the main thread.
 *
 * Adapted from the watermelon.sh "Marquee" pattern.
 */
export function Marquee3D() {
  const reduce = useReducedMotion();

  return (
    <section
      className="overflow-hidden py-10 relative min-h-[168px] bg-[var(--paper-warm)]"
      aria-label="Things Inbox Agent watches for"
    >
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-24 z-10"
        style={{
          background:
            "linear-gradient(to right, rgba(255,255,255,1), rgba(255,255,255,0))",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-24 z-10"
        style={{
          background:
            "linear-gradient(to left, rgba(255,255,255,1), rgba(255,255,255,0))",
        }}
        aria-hidden
      />

      <div className="flex flex-col gap-4">
        <Lane items={LANE_A} speed={28} reverse={false} variant="solid" reduce={!!reduce} />
        <Lane items={LANE_B} speed={44} reverse={false} variant="outline" reduce={!!reduce} />
        <Lane items={LANE_C} speed={36} reverse={true} variant="solid" reduce={!!reduce} />
      </div>
    </section>
  );
}

function Lane({
  items,
  speed,
  reverse,
  variant,
  reduce,
}: {
  items: string[];
  speed: number;
  reverse: boolean;
  variant: "solid" | "outline";
  reduce: boolean;
}) {
  const doubled = [...items, ...items];

  return (
    <div className="overflow-hidden">
      <div
        className="flex gap-3 whitespace-nowrap w-max"
        style={
          reduce
            ? undefined
            : {
                animation: `marquee3d ${speed}s linear infinite`,
                animationDirection: reverse ? "reverse" : "normal",
              }
        }
      >
        {doubled.map((label, i) => (
          <Pill key={`${label}-${i}`} variant={variant}>
            {label}
          </Pill>
        ))}
      </div>
      <style jsx>{`
        @keyframes marquee3d {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}

function Pill({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: "solid" | "outline";
}) {
  const base =
    "inline-flex items-center gap-2 px-5 py-2.5 mono text-[11px] tracking-[0.16em] uppercase shrink-0 rounded-full";
  if (variant === "solid") {
    return (
      <span
        className={`${base} text-white`}
        style={{ background: "var(--accent)" }}
      >
        {children}
      </span>
    );
  }
  return (
    <span
      className={`${base} bg-white`}
      style={{
        border: "1px solid var(--hairline)",
        color: "var(--ink)",
        boxShadow: "var(--shadow-card-sm)",
      }}
    >
      {children}
    </span>
  );
}

export default Marquee3D;
