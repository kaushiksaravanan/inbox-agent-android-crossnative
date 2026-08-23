import {
  CreditCard,
  Repeat,
  MessageSquare,
  CalendarClock,
  Banknote,
  Tag,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { TaskCategory } from "@inbox/shared";

const ICONS: Record<TaskCategory, LucideIcon> = {
  payment: CreditCard,
  subscription: Repeat,
  followup: MessageSquare,
  deadline: CalendarClock,
  autopay: Banknote,
  other: Tag,
};

const LABELS: Record<TaskCategory, string> = {
  payment: "Payment",
  subscription: "Subscription",
  followup: "Follow-up",
  deadline: "Deadline",
  autopay: "Autopay",
  other: "Other",
};

export interface CategoryIconProps {
  category: TaskCategory;
  className?: string;
  withLabel?: boolean;
}

export function CategoryIcon({
  category,
  className,
  withLabel = false,
}: CategoryIconProps) {
  const Icon = ICONS[category];
  if (withLabel) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 text-primary-700 text-xs",
          className
        )}
      >
        <Icon className="h-3 w-3" />
        {LABELS[category]}
      </span>
    );
  }
  return (
    <Icon
      aria-label={LABELS[category]}
      className={cn("h-4 w-4 text-muted", className)}
    />
  );
}
