"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { MoreHorizontal, Check, Clock, X, CalendarClock } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/client";
import { PriorityDot } from "@/components/priority-dot";
import { CategoryIcon } from "@/components/category-icon";
import { cn } from "@/lib/cn";
import {
  formatCurrency,
  formatDueLabel,
  formatSmartDate,
  initialsFrom,
  SNOOZE_PRESETS,
} from "@/lib/format";
import type { Task, TaskDerivation, TaskStatus } from "@inbox/shared";

export interface TaskRowProps {
  task: Task & { currency?: string | null };
  selected: boolean;
  onSelect: () => void;
}

export function TaskRow({ task, selected, onSelect }: TaskRowProps) {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuId = `task-menu-${task.id}`;
  const triggerId = `task-menu-trigger-${task.id}`;
  const whyPanelId = `task-why-${task.id}`;

  async function update(patch: Partial<Task> & { status?: TaskStatus }) {
    setPending(true);
    setMenuOpen(false);
    const { error } = await supabase
      .from("tasks")
      .update(patch)
      .eq("id", task.id);
    setPending(false);
    if (error) toast.error("Couldn't update task");
    else toast.success("Task updated");
  }

  // Close on Escape, return focus to trigger. Arrow keys move focus
  // between menuitems (a real menu, not a list of buttons).
  useEffect(() => {
    if (!menuOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setMenuOpen(false);
        triggerRef.current?.focus();
        return;
      }
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      const items = Array.from(
        menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ??
          []
      );
      if (items.length === 0) return;
      const idx = items.findIndex((el) => el === document.activeElement);
      const nextIdx =
        e.key === "ArrowDown"
          ? (idx + 1) % items.length
          : (idx - 1 + items.length) % items.length;
      e.preventDefault();
      items[nextIdx]?.focus();
    }
    document.addEventListener("keydown", onKey);
    // Focus the first menu item when the menu opens.
    const first = menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]');
    first?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const amount = formatCurrency(task.amount_cents, task.currency ?? null);
  const dueAt = task.due_at ? new Date(task.due_at) : null;
  const alarmAt = task.alarm_at ? new Date(task.alarm_at) : null;
  const counterpartyInitials = task.counterparty
    ? initialsFrom(task.counterparty)
    : null;

  return (
    <div
      className={cn(
        "transition-colors hover:bg-primary/[0.03] hover:shadow-soft",
        pending && "opacity-60",
        task.status === "done" && "opacity-60"
      )}
    >
      <div className="flex items-start gap-3 px-4 py-3">
      <input
        type="checkbox"
        checked={selected}
        onChange={onSelect}
        className="mt-1.5 h-4 w-4 rounded border-border accent-primary-500 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
        aria-label={`Select task: ${task.title}`}
      />

      <div className="flex flex-col items-center pt-1">
        <PriorityDot priority={task.priority} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <CategoryIcon category={task.category} />
          <h3
            className={cn(
              "font-semibold text-sm",
              task.status === "done" && "line-through text-muted"
            )}
          >
            {task.title}
          </h3>
        </div>

        {task.detail ? (
          <p className="text-sm text-muted mt-0.5 line-clamp-2">
            {task.detail}
          </p>
        ) : null}

        <div className="mt-1.5 flex items-center gap-3 text-xs text-muted flex-wrap">
          {dueAt ? (
            <span
              className="inline-flex items-center gap-1"
              title={format(dueAt, "PPpp")}
            >
              <CalendarClock className="h-3 w-3" aria-hidden="true" />
              <span className="sr-only">Due </span>
              {formatDueLabel(dueAt)}
            </span>
          ) : null}
          {alarmAt ? (
            <span
              className="inline-flex items-center gap-1 text-primary-700"
              title={format(alarmAt, "PPpp")}
            >
              <Clock className="h-3 w-3" />
              Alarm {formatSmartDate(alarmAt)}
            </span>
          ) : null}
          {task.status !== "pending" ? (
            <span className="capitalize">{task.status}</span>
          ) : null}
        </div>
      </div>

      {/* Right-side meta column: counterparty avatar + amount badge */}
      <div className="hidden sm:flex items-center gap-2 shrink-0">
        {counterpartyInitials ? (
          <span
            title={task.counterparty ?? undefined}
            className="h-7 w-7 rounded-full bg-primary-light/30 text-primary-700 inline-flex items-center justify-center text-[10px] font-semibold"
          >
            {counterpartyInitials}
          </span>
        ) : null}
        {amount ? (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-foreground/5">
            {amount}
          </span>
        ) : null}
      </div>

      <div className="relative">
        <button
          ref={triggerRef}
          id={triggerId}
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="rounded-md p-2.5 min-h-11 min-w-11 inline-flex items-center justify-center text-muted hover:bg-white hover:text-fg"
          aria-label="Task actions"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-controls={menuOpen ? menuId : undefined}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
        {menuOpen ? (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => setMenuOpen(false)}
              aria-hidden="true"
            />
            <div
              id={menuId}
              ref={menuRef}
              role="menu"
              aria-labelledby={triggerId}
              className="absolute right-0 mt-1 w-52 z-40 bg-white border border-border rounded-lg shadow-lift overflow-hidden text-sm py-1"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => update({ status: "done" })}
                className="w-full text-left px-3 py-2 hover:bg-primary/[0.05] inline-flex items-center gap-2"
              >
                <Check className="h-3.5 w-3.5 text-success" /> Mark done
              </button>
              {SNOOZE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  role="menuitem"
                  onClick={() =>
                    update({ status: "snoozed", alarm_at: preset.resolve() })
                  }
                  className="w-full text-left px-3 py-2 hover:bg-primary/[0.05] inline-flex items-center gap-2"
                >
                  <Clock className="h-3.5 w-3.5 text-warning" /> Snooze {preset.label}
                </button>
              ))}
              <button
                type="button"
                role="menuitem"
                onClick={() => update({ status: "dismissed" })}
                className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-700 inline-flex items-center gap-2"
              >
                <X className="h-3.5 w-3.5" /> Dismiss
              </button>
            </div>
          </>
        ) : null}
      </div>
      </div>

      {task.derivedFrom ? (
        <div className="px-4 pb-3 -mt-1 flex justify-end">
          <button
            type="button"
            onClick={() => setWhyOpen((v) => !v)}
            aria-expanded={whyOpen}
            aria-controls={whyPanelId}
            className="font-mono text-xs text-[var(--ink-muted)] hover:text-fg underline-offset-2 hover:underline transition-colors"
          >
            {whyOpen ? "Why? ▾" : "Why?"}
          </button>
        </div>
      ) : null}

      {whyOpen && task.derivedFrom ? (
        <div className="px-4 pb-3">
          <div
            id={whyPanelId}
            className="rounded-lg bg-[var(--paper-warm)] border border-[var(--ink-faint)] p-4 text-sm space-y-2"
          >
            <WhyExplanation derivation={task.derivedFrom} />
            <div className="pt-2 border-t border-[var(--ink-faint)]">
              <button
                type="button"
                onClick={() => {
                  toast.success("Thanks, we'll improve");
                  setWhyOpen(false);
                }}
                className="font-mono text-xs text-[var(--ink-muted)] hover:text-red-700 underline underline-offset-2"
              >
                Mark as wrong
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function WhyExplanation({ derivation }: { derivation: TaskDerivation }) {
  if (derivation.source === "rule") {
    const quote = derivation.matchedSpans[0]?.text;
    return (
      <p className="leading-relaxed">
        Matched rule:{" "}
        <span className="font-mono text-xs bg-foreground/5 px-1 py-0.5 rounded">
          {derivation.ruleId}
        </span>
        . {derivation.matchedPattern}.
        {quote ? (
          <>
            {" "}
            Quote: <em className="text-fg">&ldquo;{quote}&rdquo;</em>
          </>
        ) : null}
      </p>
    );
  }
  if (derivation.source === "regex") {
    const quote = derivation.matchedSpans[0]?.text;
    return (
      <p className="leading-relaxed">
        Matched pattern:{" "}
        <span className="font-mono text-xs bg-foreground/5 px-1 py-0.5 rounded">
          {derivation.patternId}
        </span>
        .
        {quote ? (
          <>
            {" "}
            Quote: <em className="text-fg">&ldquo;{quote}&rdquo;</em>
          </>
        ) : null}
      </p>
    );
  }
  // model
  const confidencePct = Math.round(derivation.confidence * 100);
  const labelled = derivation.matchedSpans
    .map((s) => `${s.label}=${s.text}`)
    .join(", ");
  return (
    <p className="leading-relaxed">
      Extracted by on-device model (confidence {confidencePct}%).
      {labelled ? (
        <>
          {" "}
          Spans: <span className="font-mono text-xs">{labelled}</span>.
        </>
      ) : null}
    </p>
  );
}
