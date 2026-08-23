"use client";

// Local-first Settings page.
//
// Everything visible here is sourced from the browser:
//   - Gmail connection state          → lib/gmail-oauth.ts (encrypted localStorage)
//   - Sync interval + last-poll time  → lib/local-db.ts (IndexedDB "meta" store)
//   - Task count                      → lib/local-db.ts (IndexedDB "tasks" store)
//
// No Supabase, no server actions, no BYOK round-trip. The old server-side
// BYOK section has been removed: "use a different model on-device" is a
// future feature and will land as its own section.

import { useCallback, useEffect, useState } from "react";
import {
  isGmailConnected,
  revokeGmailAccess,
  startGmailOAuth,
} from "@/lib/gmail-oauth";
import {
  clearAll as clearLocalDb,
  getAllTasks,
  getMeta,
  setMeta,
} from "@/lib/local-db";
import { pollGmailAndExtract } from "@/lib/poll-gmail";

// Build metadata. APP_VERSION is the shipped version (from @inbox/shared);
// APP_COMMIT comes from the deploy pipeline when set.
import { APP_VERSION as SHARED_APP_VERSION } from "@inbox/shared";
const APP_VERSION =
  process.env.NEXT_PUBLIC_BUILD_VERSION ?? SHARED_APP_VERSION;
const APP_COMMIT =
  process.env.NEXT_PUBLIC_BUILD_COMMIT ?? "dev";

type SyncInterval = 5 | 15 | 30 | 60;

const SYNC_OPTIONS: { value: SyncInterval; label: string }[] = [
  { value: 5, label: "Every 5 minutes" },
  { value: 15, label: "Every 15 minutes" },
  { value: 30, label: "Every 30 minutes" },
  { value: 60, label: "Every 60 minutes" },
];

const META_SYNC_INTERVAL = "syncIntervalMinutes";
const META_LAST_POLL = "lastPollAt";

function normalizeInterval(v: unknown): SyncInterval {
  return v === 5 || v === 15 || v === 30 || v === 60 ? v : 15;
}

function relativeMinutes(epochMs: number): string {
  const diff = Math.max(0, Date.now() - epochMs);
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes === 1) return "1 minute ago";
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return "1 hour ago";
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "1 day ago" : `${days} days ago`;
}

export default function SettingsPage() {
  // Connection state — derived from encrypted token blob in localStorage.
  const [connected, setConnected] = useState<boolean | null>(null);
  // Sync prefs and counters — IndexedDB-backed.
  const [interval, setIntervalValue] = useState<SyncInterval>(15);
  const [lastPollAt, setLastPollAt] = useState<number | null>(null);
  const [taskCount, setTaskCount] = useState<number | null>(null);
  // Transient UI flags.
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setConnected(isGmailConnected());
    try {
      const [stored, last, tasks] = await Promise.all([
        getMeta<SyncInterval>(META_SYNC_INTERVAL),
        getMeta<number>(META_LAST_POLL),
        getAllTasks(),
      ]);
      setIntervalValue(normalizeInterval(stored));
      setLastPollAt(typeof last === "number" ? last : null);
      setTaskCount(tasks.length);
    } catch (err) {
      // IndexedDB unavailable (private mode etc.) — fall back to defaults.
      setIntervalValue(15);
      setLastPollAt(null);
      setTaskCount(null);
      // eslint-disable-next-line no-console
      console.warn("[settings] could not read local-db meta", err);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function onChangeInterval(next: SyncInterval) {
    if (next === interval) return;
    const prev = interval;
    setIntervalValue(next);
    setError(null);
    try {
      await setMeta(META_SYNC_INTERVAL, next);
    } catch (err) {
      setIntervalValue(prev);
      setError("Couldn't save your sync interval.");
      // eslint-disable-next-line no-console
      console.warn("[settings] setMeta failed", err);
    }
  }

  async function onConnect() {
    setError(null);
    try {
      await startGmailOAuth();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't start the Gmail flow."
      );
    }
  }

  async function onDisconnect() {
    if (
      !window.confirm(
        "Disconnect Gmail? We'll wipe the stored tokens on this device."
      )
    ) {
      return;
    }
    setError(null);
    try {
      await revokeGmailAccess();
    } catch (err) {
      // revokeGmailAccess already swallows network errors — log just in case.
      // eslint-disable-next-line no-console
      console.warn("[settings] revoke failed", err);
    }
    await refresh();
  }

  async function onSyncNow() {
    if (syncing) return;
    setError(null);
    setInfo(null);
    setSyncing(true);
    try {
      const result = await pollGmailAndExtract();
      const now = Date.now();
      await setMeta(META_LAST_POLL, now);
      setLastPollAt(now);
      // Refresh the task count after the poll.
      const tasks = await getAllTasks();
      setTaskCount(tasks.length);
      setInfo(
        `Synced — ${result.newEmails} new email${
          result.newEmails === 1 ? "" : "s"
        }, ${result.newTasks} new task${result.newTasks === 1 ? "" : "s"}.`
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Sync failed. Try again."
      );
    } finally {
      setSyncing(false);
    }
  }

  async function onClearLocalData() {
    if (
      !window.confirm(
        "Delete ALL local data on this device? This wipes tasks, the seen-email index, sync preferences, and disconnects Gmail. This can't be undone."
      )
    ) {
      return;
    }
    setError(null);
    setInfo(null);
    try {
      await clearLocalDb();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("[settings] clearAll failed", err);
    }
    try {
      await revokeGmailAccess();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("[settings] revoke after clear failed", err);
    }
    setInfo("Local data cleared.");
    await refresh();
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-3xl">Settings</h1>
        <p className="text-sm text-muted">
          Local-first controls. Everything below lives on this device.
        </p>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {info ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {info}
        </div>
      ) : null}

      {/* Connected accounts ------------------------------------------------ */}
      <section className="rounded-lg bg-white border border-border p-5 shadow-soft">
        <h2 className="font-display text-xl">Connected accounts</h2>
        <p className="text-xs text-muted mt-0.5">
          Mailboxes Inbox Agent reads from. Tokens are encrypted and never
          leave your browser.
        </p>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-fg">Gmail</span>
            <StatusPill connected={connected} />
          </div>
          {connected ? (
            <button
              type="button"
              onClick={onDisconnect}
              className="rounded-full border border-red-300 text-red-700 hover:bg-red-50 text-sm font-semibold px-4 py-2"
            >
              Disconnect
            </button>
          ) : (
            <button
              type="button"
              onClick={onConnect}
              className="rounded-full bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-4 py-2"
            >
              Connect Gmail
            </button>
          )}
        </div>
      </section>

      {/* Sync -------------------------------------------------------------- */}
      <section className="rounded-lg bg-white border border-border p-5 shadow-soft space-y-5">
        <div>
          <h2 className="font-display text-xl">Sync</h2>
          <p className="text-xs text-muted mt-0.5">
            How often this device checks Gmail for new messages.
          </p>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-fg mb-1">
            Frequency
          </legend>
          {SYNC_OPTIONS.map((opt) => {
            const id = `sync-${opt.value}`;
            const checked = interval === opt.value;
            return (
              <label
                key={opt.value}
                htmlFor={id}
                className="flex items-center gap-2 cursor-pointer text-sm"
              >
                <input
                  id={id}
                  type="radio"
                  name="sync_interval"
                  value={opt.value}
                  checked={checked}
                  onChange={() => onChangeInterval(opt.value)}
                  className="h-4 w-4 accent-primary-500"
                />
                <span>{opt.label}</span>
              </label>
            );
          })}
        </fieldset>

        <div className="flex items-center justify-between border-t border-border pt-4">
          <p className="text-sm text-muted">
            {lastPollAt
              ? `Last synced: ${relativeMinutes(lastPollAt)}`
              : "Last synced: never"}
          </p>
          <button
            type="button"
            onClick={onSyncNow}
            disabled={syncing || connected === false}
            className="rounded-full bg-primary-500 hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2"
          >
            {syncing ? "Syncing…" : "Sync now"}
          </button>
        </div>
      </section>

      {/* Local data ------------------------------------------------------- */}
      <section className="rounded-lg bg-white border border-border p-5 shadow-soft">
        <h2 className="font-display text-xl">Local data</h2>
        <p className="text-xs text-muted mt-0.5">
          Everything Inbox Agent has stored on this device.
        </p>

        <dl className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-y-2 text-sm">
          <dt className="text-muted">Tasks stored locally</dt>
          <dd className="sm:col-span-2 font-medium">
            {taskCount === null ? "—" : `${taskCount} task${taskCount === 1 ? "" : "s"}`}
          </dd>
        </dl>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClearLocalData}
            className="rounded-full border border-red-300 text-red-700 hover:bg-red-50 text-sm font-semibold px-4 py-2"
          >
            Clear all local data
          </button>
        </div>
      </section>

      {/* About ------------------------------------------------------------- */}
      <section className="rounded-lg bg-white border border-border p-5 shadow-soft">
        <h2 className="font-display text-xl">About</h2>
        <p className="mt-2 text-sm text-fg">
          Your email never leaves your device. Tap any task to see why it&rsquo;s
          here.
        </p>
        <dl className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-y-2 text-sm">
          <dt className="text-muted">Version</dt>
          <dd className="sm:col-span-2 font-mono text-xs">{APP_VERSION}</dd>
          <dt className="text-muted">Commit</dt>
          <dd className="sm:col-span-2 font-mono text-xs">{APP_COMMIT}</dd>
        </dl>
      </section>
    </div>
  );
}

function StatusPill({ connected }: { connected: boolean | null }) {
  if (connected === null) {
    return (
      <span className="inline-flex items-center rounded-full bg-stone-100 text-stone-600 text-xs font-medium px-2 py-0.5">
        Checking…
      </span>
    );
  }
  if (connected) {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-800 text-xs font-medium px-2 py-0.5">
        Connected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-stone-100 text-stone-700 text-xs font-medium px-2 py-0.5">
      Not connected
    </span>
  );
}
