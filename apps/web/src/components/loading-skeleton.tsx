import { cn } from "@/lib/cn";

export interface SkeletonProps {
  className?: string;
}

/** Base shimmer block. Compose into larger skeletons. */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-lg bg-primary/5",
        className
      )}
    />
  );
}

/** Stack of card skeletons, suitable for list pages. */
export function SkeletonList({
  rows = 6,
  height = "h-24",
}: {
  rows?: number;
  height?: string;
}) {
  return (
    <div className="space-y-3" role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className={cn("w-full", height)} />
      ))}
    </div>
  );
}

/** A row of stat-card skeletons for dashboards. */
export function SkeletonStats({ count = 4 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      role="status"
      aria-label="Loading stats"
    >
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-28" />
      ))}
    </div>
  );
}

/** Page-level shell: title + stat row + list — covers most dashboard pages. */
export function SkeletonPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <SkeletonStats />
      <SkeletonList />
    </div>
  );
}

/** Shell that mirrors the Tasks page (title, filter bar, list). */
export function SkeletonTasksPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="rounded-lg bg-white border border-border p-4 shadow-soft space-y-3">
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
        </div>
      </div>
      <SkeletonList rows={5} height="h-20" />
    </div>
  );
}
