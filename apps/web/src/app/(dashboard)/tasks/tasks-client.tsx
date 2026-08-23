"use client";

// Client-side tasks dashboard.
//
// Local-first: tasks live in IndexedDB (via lib/local-db), Gmail OAuth lives
// in localStorage (encrypted) (via lib/gmail-oauth). The page has three
// possible states:
//
//   1. No Gmail connected, no demo data    -> CTA: "Connect Gmail" + Demo toggle
//   2. Gmail connected, no tasks yet       -> "polling Gmail every 15 minutes"
//   3. Tasks exist                         -> render TaskList
//
// "Sync now" calls pollGmailAndExtract() and toasts the result.
// "Demo mode" loads/clears a hand-curated email fixture so the catalog UX
// is visible before the user goes through OAuth.

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckSquare, Mail, RefreshCw, Sparkles } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { TaskList } from "./task-list";

import { getAllTasks } from "@/lib/local-db";
import { isGmailConnected, startGmailOAuth } from "@/lib/gmail-oauth";
import { pollGmailAndExtract } from "@/lib/poll-gmail";
import {
  loadDemoTasks,
  clearDemoTasks,
  DEMO_EMAILS,
} from "@/lib/demo-emails";

import type { Task } from "@inbox/shared";

// Local-db rows carry an extra `createdAt: number` stamped by addTask().
type StoredTask = Task & { createdAt?: number };

function sortByCreatedDesc(rows: StoredTask[]): StoredTask[] {
  return rows.slice().sort((a, b) => {
    const ac = a.createdAt ?? 0;
    const bc = b.createdAt ?? 0;
    if (bc !== ac) return bc - ac;
    // Tie-break on id so the order is stable.
    return a.id > b.id ? -1 : a.id < b.id ? 1 : 0;
  });
}

function hasDemoTasks(rows: StoredTask[]): boolean {
  return rows.some((t) => t.source_email_id?.startsWith("demo-"));
}

export function TasksClient() {
  const [tasks, setTasks] = useState<StoredTask[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [demoBusy, setDemoBusy] = useState(false);

  const refresh = useCallback(async () => {
    const rows = (await getAllTasks()) as StoredTask[];
    setTasks(sortByCreatedDesc(rows));
    setLoaded(true);
  }, []);

  useEffect(() => {
    setGmailConnected(isGmailConnected());
    void refresh();
  }, [refresh]);

  const demoOn = useMemo(() => hasDemoTasks(tasks), [tasks]);

  async function onSyncNow() {
    if (syncing) return;
    if (!gmailConnected) {
      toast.error("Connect Gmail first");
      return;
    }
    setSyncing(true);
    try {
      const result = await pollGmailAndExtract();
      await refresh();
      if (result.newTasks === 0 && result.newEmails === 0) {
        toast.success("Up to date — nothing new in the last day");
      } else {
        toast.success(
          `Synced ${result.newEmails} email${result.newEmails === 1 ? "" : "s"}, ` +
            `${result.newTasks} new task${result.newTasks === 1 ? "" : "s"}`,
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sync failed";
      toast.error(msg);
    } finally {
      setSyncing(false);
    }
  }

  async function onDemoToggle() {
    if (demoBusy) return;
    setDemoBusy(true);
    try {
      if (demoOn) {
        await clearDemoTasks();
        await refresh();
        toast.success("Demo data cleared");
      } else {
        const added = await loadDemoTasks();
        await refresh();
        toast.success(
          `Loaded ${added} demo task${added === 1 ? "" : "s"} from ` +
            `${DEMO_EMAILS.length} sample emails`,
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Couldn't toggle demo";
      toast.error(msg);
    } finally {
      setDemoBusy(false);
    }
  }

  async function onConnectGmail() {
    try {
      await startGmailOAuth();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "OAuth start failed";
      toast.error(msg);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Tasks</h1>
          <p className="text-sm text-muted">
            Everything your inbox has surfaced for you, newest first.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSyncNow}
            disabled={syncing || !gmailConnected}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 disabled:cursor-not-allowed text-white text-xs font-semibold px-3 py-1.5 transition-colors"
            title={
              gmailConnected
                ? "Pull recent Gmail messages and run the extractor"
                : "Connect Gmail to enable sync"
            }
          >
            <RefreshCw
              className={"h-3.5 w-3.5 " + (syncing ? "animate-spin" : "")}
              aria-hidden="true"
            />
            {syncing ? "Syncing…" : "Sync now"}
          </button>

          <button
            type="button"
            onClick={onDemoToggle}
            disabled={demoBusy}
            aria-pressed={demoOn}
            className={
              "inline-flex items-center gap-1.5 rounded-full text-xs font-semibold px-3 py-1.5 border transition-colors " +
              (demoOn
                ? "bg-amber-100 border-amber-300 text-amber-900 hover:bg-amber-200"
                : "bg-white border-border text-muted hover:border-primary-300 hover:text-fg")
            }
            title={
              demoOn
                ? "Remove the hand-crafted demo tasks"
                : "Inject hand-crafted sample tasks so you can see the catalog working"
            }
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            {demoOn ? "Clear demo" : "Demo mode"}
          </button>
        </div>
      </div>

      {!loaded ? (
        <div className="rounded-lg border border-dashed border-border bg-bg-cream/60 px-6 py-12 text-center text-sm text-muted">
          Loading tasks…
        </div>
      ) : tasks.length === 0 ? (
        gmailConnected ? (
          <EmptyState
            icon={<Mail className="h-7 w-7" />}
            title="No tasks yet"
            description="We're polling Gmail every 15 minutes. New tasks will appear here as soon as the extractor finds something actionable."
            action={{
              label: syncing ? "Syncing…" : "Sync now",
              onClick: onSyncNow,
            }}
          />
        ) : (
          <EmptyState
            icon={<CheckSquare className="h-7 w-7" />}
            title="Connect Gmail to get started"
            description="Inbox Agent runs entirely in your browser. Connect your Gmail to start surfacing payments, renewals, deadlines, and follow-ups — or try Demo mode to see what it does before you connect anything."
            action={{
              label: "Connect Gmail",
              onClick: onConnectGmail,
            }}
          />
        )
      ) : (
        <TaskList initialTasks={tasks} />
      )}
    </div>
  );
}
