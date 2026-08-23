"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Check, Clock, Trash2 } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/client";
import { SNOOZE_PRESETS, parseLocalDateTime } from "@/lib/format";
import { TaskRow } from "./task-row";
import type { Task, TaskStatus } from "@inbox/shared";

export interface TaskListProps {
  initialTasks: Task[];
}

export function TaskList({ initialTasks }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLInputElement | null>(null);
  const supabase = useMemo(() => createBrowserClient(), []);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  useEffect(() => {
    const channel = supabase
      .channel("tasks-list")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const next = payload.new as Task;
            setTasks((prev) =>
              prev.some((t) => t.id === next.id) ? prev : [next, ...prev]
            );
          } else if (payload.eventType === "UPDATE") {
            const next = payload.new as Task;
            setTasks((prev) =>
              prev.map((t) => (t.id === next.id ? next : t))
            );
          } else if (payload.eventType === "DELETE") {
            const old = payload.old as { id: string };
            setTasks((prev) => prev.filter((t) => t.id !== old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function bulkUpdate(patch: Partial<Task> & { status?: TaskStatus }) {
    const ids = [...selected];
    if (ids.length === 0) return;
    const prev = tasks;
    setTasks((cur) =>
      cur.map((t) => (selected.has(t.id) ? { ...t, ...patch } : t))
    );
    const { error } = await supabase
      .from("tasks")
      .update(patch)
      .in("id", ids);
    if (error) {
      setTasks(prev);
      toast.error("Couldn't update tasks");
    } else {
      toast.success(`Updated ${ids.length} task${ids.length === 1 ? "" : "s"}`);
      setSelected(new Set());
    }
  }

  async function bulkDone() {
    await bulkUpdate({ status: "done" });
  }
  async function bulkSnoozeTo(iso: string) {
    await bulkUpdate({ status: "snoozed", alarm_at: iso });
  }
  async function bulkSnoozeCustom() {
    const value = pickerRef.current?.value;
    if (!value) return;
    const iso = parseLocalDateTime(value);
    if (!iso) {
      toast.error("Couldn't read that date");
      return;
    }
    if (new Date(iso).getTime() < Date.now()) {
      toast.error("Pick a time in the future");
      return;
    }
    setPickerOpen(false);
    await bulkUpdate({ status: "snoozed", alarm_at: iso });
  }
  async function bulkDismiss() {
    await bulkUpdate({ status: "dismissed" });
  }

  return (
    <div className="space-y-3">
      {selected.size > 0 ? (
        <div className="flex items-center gap-2 flex-wrap rounded-lg bg-amber-50 border border-amber-200 px-4 py-2 text-sm">
          <span className="font-medium">
            {selected.size} selected
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={bulkDone}
              className="inline-flex items-center gap-1 rounded-md bg-success text-white px-2.5 py-1 text-xs font-semibold hover:opacity-90"
            >
              <Check className="h-3.5 w-3.5" /> Done
            </button>
            {SNOOZE_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => bulkSnoozeTo(preset.resolve())}
                className="inline-flex items-center gap-1 rounded-md bg-white border border-border px-2.5 py-1 text-xs font-semibold hover:bg-amber-50"
              >
                <Clock className="h-3.5 w-3.5" /> {preset.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPickerOpen((v) => !v)}
              aria-expanded={pickerOpen}
              className="inline-flex items-center gap-1 rounded-md bg-white border border-border px-2.5 py-1 text-xs font-semibold hover:bg-amber-50"
            >
              <Clock className="h-3.5 w-3.5" /> Pick a time…
            </button>
            <button
              type="button"
              onClick={bulkDismiss}
              className="inline-flex items-center gap-1 rounded-md bg-white border border-border text-muted px-2.5 py-1 text-xs font-semibold hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="h-3.5 w-3.5" /> Dismiss
            </button>
          </div>
          {pickerOpen ? (
            <div className="basis-full mt-2 flex items-center gap-2 border-t border-amber-200 pt-2">
              <label htmlFor="bulk-snooze-picker" className="text-xs text-muted">
                Snooze until
              </label>
              <input
                ref={pickerRef}
                id="bulk-snooze-picker"
                type="datetime-local"
                className="rounded-md border border-border bg-white px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
              <button
                type="button"
                onClick={bulkSnoozeCustom}
                className="inline-flex items-center gap-1 rounded-md bg-primary-500 text-white px-2.5 py-1 text-xs font-semibold hover:bg-primary-600"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="text-xs text-muted hover:text-fg px-2"
              >
                Cancel
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      <ul className="rounded-lg overflow-hidden border border-border bg-white divide-y divide-border">
        {tasks.map((task, i) => (
          <li
            key={task.id}
            className={i % 2 === 0 ? "bg-white" : "bg-bg-cream/60"}
          >
            <TaskRow
              task={task}
              selected={selected.has(task.id)}
              onSelect={() => toggle(task.id)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
