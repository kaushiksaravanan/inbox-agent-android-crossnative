import { cn } from "@/lib/cn";
import type { TaskPriority } from "@inbox/shared";

const STYLES: Record<TaskPriority, string> = {
  urgent: "bg-red-600 animate-pulse motion-reduce:animate-none",
  high: "bg-amber-500",
  medium: "bg-yellow-400",
  low: "bg-stone-400",
};

const LABELS: Record<TaskPriority, string> = {
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export interface PriorityDotProps {
  priority: TaskPriority;
  size?: "sm" | "md";
  className?: string;
}

export function PriorityDot({
  priority,
  size = "md",
  className,
}: PriorityDotProps) {
  const dim = size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5";
  return (
    <span
      title={LABELS[priority]}
      aria-label={`${LABELS[priority]} priority`}
      className={cn(
        "inline-block rounded-full",
        dim,
        STYLES[priority],
        className
      )}
    />
  );
}
