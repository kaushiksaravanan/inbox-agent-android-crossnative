import type { ReactElement } from "react";
import { cn } from "@/lib/cn";

// JSX-safe ReactNode (excludes bigint which conflicts across React 18/19 types).
type Node = ReactElement | string | number | boolean | null | undefined | Iterable<Node>;

export interface StatCardProps {
  label: string;
  value: Node;
  hint?: Node;
  icon?: Node;
  accent?: "amber" | "red" | "muted" | "success";
  className?: string;
}

const ACCENT_CLASSES: Record<NonNullable<StatCardProps["accent"]>, string> = {
  amber: "text-primary-600",
  red: "text-red-600",
  muted: "text-muted",
  success: "text-success",
};

export function StatCard({
  label,
  value,
  hint,
  icon,
  accent = "amber",
  className,
}: StatCardProps) {
  // A "0" rendered in red looks like a permanent error state. Soften the
  // value color to muted when the count is literally zero — keep the icon
  // accent so the card still reads as the right category.
  const isZero = typeof value === "number" && value === 0;
  const valueAccent = isZero ? "text-muted" : ACCENT_CLASSES[accent];
  return (
    <div
      className={cn(
        "rounded-lg bg-white border border-border p-5 shadow-soft transition-shadow hover:shadow-lift",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">
          {label}
        </p>
        {icon ? (
          <span className={cn("h-5 w-5", ACCENT_CLASSES[accent])}>{icon}</span>
        ) : null}
      </div>
      <p
        className={cn(
          "mt-3 font-display text-4xl leading-none tabular-nums",
          valueAccent
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-2 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}
