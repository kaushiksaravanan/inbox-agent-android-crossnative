"use client";

import { useCallback, useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Loader2, Mail, Plug, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { InterestButton } from "@/components/interest-button";
import {
  isGmailConnected,
  revokeGmailAccess,
  startGmailOAuth,
} from "@/lib/gmail-oauth";
import { pollGmailAndExtract } from "@/lib/poll-gmail";
import { getMeta, setMeta } from "@/lib/local-db";

const META_LAST_POLL = "lastPollAt";

function GmailIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <path
        d="M2 6.5A2.5 2.5 0 0 1 4.5 4h15A2.5 2.5 0 0 1 22 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 2 17.5v-11Z"
        fill="#fff"
        stroke="#d1d5db"
        strokeWidth="1"
      />
      <path
        d="m2.5 6.7 9.5 6.8 9.5-6.8"
        stroke="#ea4335"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M2.5 6.7v10.8"
        stroke="#4285f4"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M21.5 6.7v10.8"
        stroke="#34a853"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

function StatusPill({ status }: { status: "active" | "disconnected" }) {
  const tone =
    status === "active"
      ? "bg-success/10 text-success border-success/30"
      : "bg-amber-50 text-warning border-amber-200";
  const dotTone = status === "active" ? "bg-success" : "bg-warning";
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium capitalize " +
        tone
      }
    >
      <span className={"h-1.5 w-1.5 rounded-full " + dotTone} />
      {status === "active" ? "Connected" : "Disconnected"}
    </span>
  );
}

export function AccountsClient() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [lastPollAt, setLastPollAt] = useState<number | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const refresh = useCallback(async () => {
    setConnected(isGmailConnected());
    try {
      const last = await getMeta<number>(META_LAST_POLL);
      setLastPollAt(typeof last === "number" ? last : null);
    } catch {
      setLastPollAt(null);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleConnect() {
    if (connecting) return;
    setConnecting(true);
    try {
      await startGmailOAuth();
      // startGmailOAuth navigates away; nothing more to do.
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Couldn't start the Gmail flow."
      );
      setConnecting(false);
    }
  }

  async function handleSync() {
    if (syncing) return;
    setSyncing(true);
    try {
      const result = await pollGmailAndExtract();
      const now = Date.now();
      await setMeta(META_LAST_POLL, now);
      setLastPollAt(now);
      toast.success(
        `Synced — ${result.newEmails} new email${
          result.newEmails === 1 ? "" : "s"
        }, ${result.newTasks} new task${result.newTasks === 1 ? "" : "s"}.`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sync failed.");
    } finally {
      setSyncing(false);
    }
  }

  async function handleDisconnect() {
    if (disconnecting) return;
    if (
      !window.confirm(
        "Disconnect Gmail? We'll wipe the stored tokens on this device."
      )
    ) {
      return;
    }
    setDisconnecting(true);
    try {
      await revokeGmailAccess();
      toast.success("Gmail disconnected.");
    } catch (err) {
      // revokeGmailAccess swallows network errors internally; log just in case.
      // eslint-disable-next-line no-console
      console.warn("[accounts] revoke failed", err);
    } finally {
      setDisconnecting(false);
      await refresh();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl">Accounts</h1>
          <p className="text-sm text-muted">
            Connect your inboxes so we can scan them for tasks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleConnect}
            disabled={connecting || connected === true}
            className="inline-flex items-center gap-2 rounded-full bg-primary-500 hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2"
          >
            {connecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
            {connected === true ? "Gmail connected" : "Connect Gmail"}
          </button>
          <span
            aria-disabled="true"
            className="inline-flex items-center gap-2 rounded-full bg-white border border-border text-muted text-sm font-semibold px-4 py-2 opacity-60 cursor-not-allowed"
            title="Outlook support is not wired up yet."
          >
            <Mail className="h-4 w-4" />
            Outlook (coming soon)
          </span>
          <InterestButton feature="outlook" source="accounts-page" label="+ I want Outlook" />
        </div>
      </div>

      {connected === null ? (
        <div className="rounded-lg bg-white border border-border p-6 shadow-soft text-sm text-muted flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Checking local connection…
        </div>
      ) : connected === false ? (
        <EmptyState
          icon={<Plug className="h-7 w-7" />}
          title="No inboxes connected yet"
          description="Connect a Gmail account to let Inbox Agent extract tasks, set alarms, and learn your reply style. Everything stays on this device."
          action={{
            label: "Connect Gmail",
            onClick: handleConnect,
          }}
        />
      ) : (
        <ul className="space-y-3">
          <li className="rounded-lg bg-white border border-border p-4 shadow-soft hover:shadow-lift transition-shadow flex items-center gap-4">
            <span className="h-10 w-10 rounded-full bg-amber-50 inline-flex items-center justify-center">
              <GmailIcon className="h-6 w-6" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">Gmail</p>
              <div className="text-xs text-muted flex items-center gap-2 flex-wrap mt-1">
                <StatusPill status="active" />
                {lastPollAt ? (
                  <span title={new Date(lastPollAt).toISOString()}>
                    Last synced{" "}
                    {formatDistanceToNow(new Date(lastPollAt), {
                      addSuffix: true,
                    })}
                  </span>
                ) : (
                  <span className="italic">Not synced yet</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleSync}
                disabled={syncing}
                aria-label="Sync Gmail now"
                className="text-xs text-muted hover:text-fg hover:bg-amber-50 px-3 py-2 rounded-md min-h-11 inline-flex items-center gap-1.5 transition-colors disabled:opacity-60"
              >
                {syncing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Syncing…
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3.5 w-3.5" /> Sync now
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={disconnecting}
                aria-label="Disconnect Gmail"
                className="text-xs text-muted hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-md min-h-11 inline-flex items-center gap-1.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {disconnecting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plug className="h-3.5 w-3.5" />
                )}
                Disconnect
              </button>
            </div>
          </li>
        </ul>
      )}
    </div>
  );
}
