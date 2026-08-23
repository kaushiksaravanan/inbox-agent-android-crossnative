// Gmail polling orchestrator.
//
// One pass:
//   1. Resolve a valid Gmail access token (refreshes if needed).
//   2. List recent message IDs (last 1 day, max 50).
//   3. For each ID not already in the seen-set:
//        a. Fetch the full message.
//        b. Run the layered extractor.
//        c. Persist any produced tasks locally.
//        d. Mark the email as seen so we don't reprocess it.
//
// Local-first storage: tasks and the "seen" set live in localStorage.
// (Replacing this with a Supabase round-trip later only requires swapping
// the storeTask / wasSeen / markSeen helpers.)

import { getValidAccessToken } from "./gmail-oauth";
import {
  listRecentMessages,
  getMessage,
  TokenExpired,
} from "./gmail-client";
import { extractTasks } from "./extractor";
import { addTask } from "./local-db";
import type { Task } from "@inbox/shared";

// ---------------------------------------------------------------------------
// Local storage keys
// ---------------------------------------------------------------------------

const TASKS_KEY = "inbox.tasks";
const SEEN_KEY = "inbox.emails_seen";
const SEEN_CAP = 5_000;

interface SeenEntry {
  gmailId: string;
  seenAt: number; // epoch seconds
}

function hasLocalStorage(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

function readJson<T>(key: string, fallback: T): T {
  if (!hasLocalStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (!hasLocalStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota / privacy mode — silently drop, caller has counts in memory.
  }
}

// ---------------------------------------------------------------------------
// Seen-email index
// ---------------------------------------------------------------------------

function loadSeen(): Map<string, number> {
  const arr = readJson<SeenEntry[]>(SEEN_KEY, []);
  const m = new Map<string, number>();
  for (const e of arr) m.set(e.gmailId, e.seenAt);
  return m;
}

function persistSeen(seen: Map<string, number>): void {
  // Trim to the SEEN_CAP most recent entries.
  const entries = Array.from(seen.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, SEEN_CAP)
    .map(([gmailId, seenAt]) => ({ gmailId, seenAt }));
  writeJson(SEEN_KEY, entries);
}

function wasSeen(seen: Map<string, number>, gmailId: string): boolean {
  return seen.has(gmailId);
}

function markSeen(seen: Map<string, number>, gmailId: string): void {
  seen.set(gmailId, Math.floor(Date.now() / 1000));
}

// ---------------------------------------------------------------------------
// Task store
// ---------------------------------------------------------------------------

function loadTasks(): Task[] {
  return readJson<Task[]>(TASKS_KEY, []);
}

function storeTasks(tasks: Task[], existing?: Task[]): void {
  const all = (existing ?? loadTasks()).concat(tasks);
  writeJson(TASKS_KEY, all);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface PollResult {
  newTasks: number;
  newEmails: number;
}

/**
 * Run one polling pass. Idempotent: emails already in the seen index are
 * skipped. Returns counts of newly-seen emails and newly-extracted tasks.
 *
 * On TokenExpired we let getValidAccessToken refresh on the next call —
 * the surrounding setInterval will retry shortly. We rethrow other errors
 * so the caller can surface them.
 */
export async function pollGmailAndExtract(): Promise<PollResult> {
  const accessToken = await getValidAccessToken();

  let messages;
  try {
    messages = await listRecentMessages(accessToken, {
      newerThan: "1d",
      maxResults: 50,
    });
  } catch (err) {
    if (err instanceof TokenExpired) {
      // Token went stale between fetch and list; next tick will refresh.
      return { newTasks: 0, newEmails: 0 };
    }
    throw err;
  }

  const seen = loadSeen();
  const existingTasks = loadTasks();
  const newTasksBatch: Task[] = [];
  let newEmails = 0;

  for (const { id } of messages) {
    if (wasSeen(seen, id)) continue;

    let parsed;
    try {
      parsed = await getMessage(accessToken, id);
    } catch (err) {
      if (err instanceof TokenExpired) {
        // Stop early — next call will refresh and resume.
        break;
      }
      // Skip individual failures; don't poison the whole batch.
      // eslint-disable-next-line no-console
      console.warn(`[poll-gmail] getMessage ${id} failed`, err);
      continue;
    }

    const produced = await extractTasks(parsed);
    if (produced.length > 0) newTasksBatch.push(...produced);
    markSeen(seen, id);
    newEmails += 1;
  }

  if (newTasksBatch.length > 0) {
    storeTasks(newTasksBatch, existingTasks);
    // Also persist to IndexedDB — the dashboard reads from local-db, not the
    // legacy localStorage blob. addTask() stamps createdAt for us.
    for (const t of newTasksBatch) {
      try {
        await addTask(t);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("[poll-gmail] addTask failed", err);
      }
    }
  }
  persistSeen(seen);

  return { newTasks: newTasksBatch.length, newEmails };
}

/**
 * Schedule pollGmailAndExtract on a fixed interval. Returns a cancel
 * function that clears the timer (does not abort an in-flight poll).
 *
 * Notes:
 *   - No leading-edge call; first poll fires at `intervalMs`. Callers that
 *     want an immediate sweep should `await pollGmailAndExtract()` once
 *     before invoking this.
 *   - Overlapping polls are guarded with a busy flag — if a previous tick
 *     is still running we skip this one instead of stacking requests.
 */
export function schedulePolling(intervalMs: number): () => void {
  if (typeof window === "undefined") {
    // No-op on the server.
    return () => {};
  }

  let busy = false;
  const handle = window.setInterval(async () => {
    if (busy) return;
    busy = true;
    try {
      await pollGmailAndExtract();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("[poll-gmail] poll failed", err);
    } finally {
      busy = false;
    }
  }, intervalMs);

  return () => {
    window.clearInterval(handle);
  };
}
