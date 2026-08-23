import type { ReactElement } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

// JSX-safe ReactNode (excludes bigint which conflicts across React 18/19 types).
type Node = ReactElement | string | number | boolean | null | undefined | Iterable<Node>;

export interface EmptyStateProps {
  icon?: Node;
  title: string;
  description?: Node;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-dashed border-border bg-bg-cream/60 px-6 py-12 text-center",
        className
      )}
    >
      {icon ? (
        <div className="mx-auto h-16 w-16 rounded-full bg-amber-100 text-primary-600 inline-flex items-center justify-center shadow-soft [&>svg]:h-7 [&>svg]:w-7">
          {icon}
        </div>
      ) : null}
      <h3 className="mt-5 font-display text-2xl">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-md mx-auto text-sm text-muted">
          {description}
        </p>
      ) : null}
      {action ? (
        <div className="mt-5">
          {action.href ? (
            <Link
              href={action.href}
              className="inline-flex items-center rounded-full bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-5 py-2 transition-colors"
            >
              {action.label}
            </Link>
          ) : (
            <button
              type="button"
              onClick={action.onClick}
              className="inline-flex items-center rounded-full bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-5 py-2 transition-colors"
            >
              {action.label}
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
