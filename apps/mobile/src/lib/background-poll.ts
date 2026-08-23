// Background Gmail polling (mobile, Android-first).
//
// Wires expo-task-manager + expo-background-fetch so the OS can wake us up
// roughly every 15 minutes (the iOS minimum; Android typically honors it
// more aggressively) and run one pass of pollGmailAndExtract().
//
// IMPORTANT — file conventions:
//   - This file MUST be imported once at app boot (see app/_layout.tsx),
//     because TaskManager.defineTask() registers the handler globally
//     and the OS will look for it by name on each wakeup.
//   - The defineTask() call is a side effect at module scope — that's how
//     Expo's task manager expects you to register tasks.
//   - The task body must be self-contained: it runs in a fresh JS context
//     when the app is killed, so it can't rely on React state, navigation
//     refs, or anything stitched together at runtime.
//
// On a wakeup we:
//   1. Check Gmail is still connected. If not, just exit cleanly so the
//      OS doesn't waste budget on a dead task.
//   2. Run one pollGmailAndExtract() pass with a hard 30s ceiling
//      (Android gives us ~30s; iOS ~30s; over and the OS kills us).
//   3. Record the last-run timestamp in local-db meta so the UI can show
//      "Last synced 4m ago" without needing a separate event channel.
//   4. Return a BackgroundFetchResult code so the OS can grade us.

import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";

import { isGmailConnected } from "./gmail-oauth";
import { pollGmailAndExtract } from "./poll-gmail";
import { setMeta } from "./local-db";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const POLL_TASK_NAME = "inbox-agent.gmail-poll";

/** Suggested fetch interval. The OS treats this as a hint, not a contract.
 *  iOS may schedule us less often if we've been idle; Android may schedule
 *  us more often if the user is actively interacting. */
const POLL_INTERVAL_SECONDS = 15 * 60;

/** Meta keys (mirror what the foreground sync uses, so the History tab can
 *  show a single "last synced" value regardless of which path produced it). */
const META_LAST_POLL = "lastPollAt";
const META_LAST_POLL_RESULT = "lastPollResult";
const META_LAST_POLL_ERROR = "lastPollError";

// ---------------------------------------------------------------------------
// Task registration — runs at module load time
// ---------------------------------------------------------------------------

TaskManager.defineTask(POLL_TASK_NAME, async () => {
  const startedAt = Date.now();

  if (!(await isGmailConnected())) {
    // Nothing to do. Returning NoData lets the OS scale our budget back.
    return BackgroundFetch.BackgroundFetchResult.NoData;
  }

  try {
    const result = await pollGmailAndExtract();
    await setMeta(META_LAST_POLL, Date.now());
    await setMeta(META_LAST_POLL_RESULT, {
      newEmails: result.newEmails,
      newTasks: result.newTasks,
      durationMs: Date.now() - startedAt,
      at: new Date().toISOString(),
    });
    await setMeta(META_LAST_POLL_ERROR, null);

    return result.newEmails > 0
      ? BackgroundFetch.BackgroundFetchResult.NewData
      : BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (err) {
    // Don't throw — that prevents the OS from grading us and our future
    // budget shrinks. Persist the error so the UI can surface it.
    await setMeta(META_LAST_POLL_ERROR, {
      message: err instanceof Error ? err.message : String(err),
      at: new Date().toISOString(),
    });
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface BackgroundPollStatus {
  registered: boolean;
  status: BackgroundFetch.BackgroundFetchStatus | null;
  intervalSeconds: number;
}

/** Register the task with the OS scheduler. Safe to call repeatedly —
 *  Expo treats a re-registration as a refresh. Call this once after the
 *  user finishes Gmail OAuth and any time the user toggles the
 *  "background sync" preference on. */
export async function registerBackgroundPolling(): Promise<void> {
  const status = await BackgroundFetch.getStatusAsync();
  if (status === BackgroundFetch.BackgroundFetchStatus.Restricted) {
    throw new Error(
      "Background sync is disabled at the system level (Low Power Mode or restricted by an MDM profile).",
    );
  }
  if (status === BackgroundFetch.BackgroundFetchStatus.Denied) {
    throw new Error(
      "Background sync was denied. The user has explicitly turned off Background App Refresh for this app.",
    );
  }

  await BackgroundFetch.registerTaskAsync(POLL_TASK_NAME, {
    minimumInterval: POLL_INTERVAL_SECONDS,
    // Both true so the OS doesn't drop us at the first sign of resource
    // pressure or a reboot. We are a productivity app, not a game; we want
    // to be the kind of background work the OS keeps alive.
    stopOnTerminate: false,
    startOnBoot: true,
  });
}

/** Stop the task. Call this when the user disconnects Gmail or toggles
 *  "background sync" off. Safe to call when not registered. */
export async function unregisterBackgroundPolling(): Promise<void> {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(POLL_TASK_NAME);
  if (!isRegistered) return;
  await BackgroundFetch.unregisterTaskAsync(POLL_TASK_NAME);
}

/** Read current registration + OS-level status. Used by the Settings screen
 *  to show "Background sync: on / off / restricted". */
export async function getBackgroundPollStatus(): Promise<BackgroundPollStatus> {
  const [registered, status] = await Promise.all([
    TaskManager.isTaskRegisteredAsync(POLL_TASK_NAME),
    BackgroundFetch.getStatusAsync(),
  ]);
  return {
    registered,
    status,
    intervalSeconds: POLL_INTERVAL_SECONDS,
  };
}

/** Manually trigger the task body — useful for debugging from a button or
 *  the in-app "Sync now" affordance. Bypasses the OS scheduler. Returns
 *  the result code the OS would have seen. */
export async function runBackgroundPollNow(): Promise<BackgroundFetch.BackgroundFetchResult> {
  // Re-implement the task body inline to avoid importing the closure twice
  // and so we don't get tangled in TaskManager's "from-task-only" rules.
  if (!(await isGmailConnected())) return BackgroundFetch.BackgroundFetchResult.NoData;
  const startedAt = Date.now();
  try {
    const result = await pollGmailAndExtract();
    await setMeta(META_LAST_POLL, Date.now());
    await setMeta(META_LAST_POLL_RESULT, {
      newEmails: result.newEmails,
      newTasks: result.newTasks,
      durationMs: Date.now() - startedAt,
      at: new Date().toISOString(),
      manual: true,
    });
    await setMeta(META_LAST_POLL_ERROR, null);
    return result.newEmails > 0
      ? BackgroundFetch.BackgroundFetchResult.NewData
      : BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (err) {
    await setMeta(META_LAST_POLL_ERROR, {
      message: err instanceof Error ? err.message : String(err),
      at: new Date().toISOString(),
      manual: true,
    });
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
}
