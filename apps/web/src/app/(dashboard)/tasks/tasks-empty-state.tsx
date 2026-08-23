"use client";

import { CheckSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { isGmailConnected } from "@/lib/gmail-oauth";

export interface TasksEmptyStateProps {
  /**
   * True when filters are active and pruning all results — show the
   * "widen your filters" copy instead of the onboarding nudge.
   */
  hasActiveFilters: boolean;
}

/**
 * Friendly empty state for the tasks page. Resolves Gmail connection status
 * on the client (tokens live in localStorage), so we render a neutral
 * fallback during SSR / first paint and swap in the connect-or-demo nudge
 * once we know the user has no Gmail tokens stored.
 */
export function TasksEmptyState({ hasActiveFilters }: TasksEmptyStateProps) {
  const [gmailConnected, setGmailConnected] = useState<boolean | null>(null);

  useEffect(() => {
    setGmailConnected(isGmailConnected());
  }, []);

  if (hasActiveFilters) {
    return (
      <EmptyState
        icon={<CheckSquare className="h-7 w-7" />}
        title="No tasks match these filters"
        description="Try widening the filters above, or wait for the next inbox sync to surface new tasks."
      />
    );
  }

  if (gmailConnected === false) {
    return (
      <EmptyState
        icon={<CheckSquare className="h-7 w-7" />}
        title="Nothing here yet"
        description="Connect Gmail to see real tasks, or try Demo Mode to see how the agent matches sample emails."
        action={{ label: "Connect Gmail", href: "/onboarding" }}
      />
    );
  }

  return (
    <EmptyState
      icon={<CheckSquare className="h-7 w-7" />}
      title="Inbox zero"
      description="We haven't surfaced any tasks for you yet. New emails will show up here as they arrive."
    />
  );
}
