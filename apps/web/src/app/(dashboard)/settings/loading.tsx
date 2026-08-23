import { SkeletonList } from "@/components/loading-skeleton";

export default function Loading() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="h-10 w-32 animate-pulse rounded-lg bg-primary/5" />
      <SkeletonList rows={3} height="h-40" />
    </div>
  );
}
