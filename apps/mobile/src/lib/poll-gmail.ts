// Gmail polling orchestrator (mobile).
//
// Same one-pass loop as apps/web/src/lib/poll-gmail.ts:
//   1. Resolve a valid Gmail access token (refreshes if needed).
//   2. List recent message IDs (last 1 day, max 50).
//   3. For each ID not already in the seen-set:
//        a. Fetch the full message.
//        b. Run the layered extractor.
//        c. Persist any produced tasks via local-db.addTask.
//        d. Mark the email as seen via local-db.markEmailSeen.
//
// Differences from web:
//   - No window.localStorage. Seen state lives in expo-sqlite via local-db
//     (markEmailSeen / isEmailSeen) — same API as web's IndexedDB layer.
//   - The "every N minutes" scheduler is owned by background-poll.ts
//     (expo-task-manager + expo-background-fetch). pollGmailAndExtract()
//     itself is just the one-pass body; both foreground (pull-to-refresh,
//     screen mount) and background paths call it the same way.
//
// On TokenExpired we let getValidAccessToken refresh on the next call —
// the calling screen will retry on its next pull-to-refresh, or the next
// OS-driven background wakeup.

import { getValidAccessToken } from "./gmail-oauth";
import {
  listRecentMessages,
  getMessage,
  TokenExpired,
} from "./gmail-client";
import { extractTasks } from "./extractor";
import { addTask, isEmailSeen, markEmailSeen } from "./local-db";

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface PollResult {
  newTasks: number;
  newEmails: number;
}

/**
 * Run one polling pass. Idempotent: emails already marked seen in local-db
 * are skipped. Returns counts of newly-seen emails and newly-extracted tasks.
 *
 * Token refresh is delegated to getValidAccessToken. If a TokenExpired is
 * thrown mid-pass we stop early so the next invocation can refresh and
 * resume — we don't try to recover within a single call.
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

  let newTasks = 0;
  let newEmails = 0;

  for (const { id } of messages) {
    if (await isEmailSeen(id)) continue;

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
    for (const t of produced) {
      try {
        await addTask(t);
        newTasks += 1;
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("[poll-gmail] addTask failed", err);
      }
    }
    await markEmailSeen(id);
    newEmails += 1;
  }

  return { newTasks, newEmails };
}

// ---------------------------------------------------------------------------
// Background scheduling — placeholder
// ---------------------------------------------------------------------------

/**
 * On the web, this used `window.setInterval`. That pattern does not work on
 * mobile: a `setInterval` inside a screen component dies when the app is
 * backgrounded, and even while foregrounded it keeps the JS bridge busy.
 *
 * The real OS-driven background scheduler lives in
 * `background-poll.ts` (registerBackgroundPolling / unregisterBackgroundPolling)
 * and uses expo-task-manager + expo-background-fetch. That is what to call
 * when you actually want recurring polls — this stub stays as a no-op for
 * web/mobile call-site parity.
 *
 * @param _intervalMs Ignored on mobile (kept for parity with web signature).
 * @returns A cancel function (no-op).
 */
export function schedulePolling(_intervalMs: number): () => void {
  // eslint-disable-next-line no-console
  console.warn(
    "[poll-gmail] schedulePolling is a no-op on mobile. " +
      "For recurring polls, use registerBackgroundPolling() from " +
      "src/lib/background-poll. For one-shot polls, call " +
      "pollGmailAndExtract() directly from screen mount or pull-to-refresh.",
  );
  return () => {};
}
