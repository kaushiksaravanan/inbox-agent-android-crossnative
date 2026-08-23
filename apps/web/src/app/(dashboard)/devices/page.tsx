"use client";

import { useEffect, useMemo, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { Smartphone, X, RefreshCw, Loader2, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";
import { createBrowserClient } from "@/lib/supabase/client";
import { EmptyState } from "@/components/empty-state";
import type { Device } from "@inbox/shared";

interface PairingState {
  open: boolean;
  code: string | null;
  expiresAt: string | null;
  loading: boolean;
}

export default function DevicesPage() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [pairing, setPairing] = useState<PairingState>({
    open: false,
    code: null,
    expiresAt: null,
    loading: false,
  });
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("devices")
        .select("*")
        .order("paired_at", { ascending: false });
      if (cancelled) return;
      setDevices((data ?? []) as Device[]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  useEffect(() => {
    if (!pairing.open) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [pairing.open]);

  // Close on Escape, like a real dialog should.
  useEffect(() => {
    if (!pairing.open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setPairing({
          open: false,
          code: null,
          expiresAt: null,
          loading: false,
        });
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [pairing.open]);

  async function startPairing() {
    setPairing({ open: true, code: null, expiresAt: null, loading: true });
    try {
      const { data, error } = await supabase.functions.invoke("pair-device", {
        body: { action: "create" },
      });
      if (error) throw error;
      const code = (data as { code?: string })?.code ?? null;
      const expiresAt = (data as { expires_at?: string })?.expires_at ?? null;
      if (!code) throw new Error("No code returned");
      setPairing({ open: true, code, expiresAt, loading: false });
    } catch (err) {
      setPairing({ open: false, code: null, expiresAt: null, loading: false });
      toast.error((err as Error).message ?? "Couldn't create pairing code");
    }
  }

  async function removeDevice(id: string) {
    const prev = devices;
    setDevices(devices.filter((d) => d.id !== id));
    const { error } = await supabase.from("devices").delete().eq("id", id);
    if (error) {
      setDevices(prev);
      toast.error("Couldn't remove device");
    } else {
      toast.success("Device removed");
    }
  }

  // `now` is consumed by <CountdownBar> via prop to drive the per-second tick.

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl">Devices</h1>
          <p className="text-sm text-muted">
            Pair your phone to receive alarm notifications.
          </p>
        </div>
        <button
          type="button"
          onClick={startPairing}
          className="inline-flex items-center gap-2 rounded-full bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-4 py-2"
        >
          <Smartphone className="h-4 w-4" />
          Pair new phone
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted" />
        </div>
      ) : devices.length === 0 ? (
        <EmptyState
          icon={<Smartphone className="h-7 w-7" />}
          title="No paired devices"
          description="Pair your phone to get loud alarms when an inbox task is due. We'll show you a 6-digit code to enter in the mobile app."
          action={{ label: "Pair new phone", onClick: startPairing }}
        />
      ) : (
        <ul className="space-y-3">
          {devices.map((d) => (
            <li
              key={d.id}
              className="rounded-lg bg-white border border-border p-4 shadow-soft hover:shadow-lift transition-shadow flex items-center gap-4"
            >
              <span className="h-10 w-10 rounded-full bg-amber-100 inline-flex items-center justify-center text-primary-600">
                <Smartphone className="h-5 w-5" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">
                  {d.device_name ?? `${d.platform} device`}
                </p>
                <p className="text-xs text-muted">
                  <span className="capitalize">{d.platform}</span>
                  <span className="mx-1.5">·</span>
                  Paired {format(new Date(d.paired_at), "PP")}
                  {d.last_seen_at ? (
                    <>
                      <span className="mx-1.5">·</span>
                      Last seen{" "}
                      {formatDistanceToNow(new Date(d.last_seen_at), {
                        addSuffix: true,
                      })}
                    </>
                  ) : null}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeDevice(d.id)}
                className="text-xs text-muted hover:text-red-700 px-3 py-1.5 rounded-md hover:bg-red-50 inline-flex items-center gap-1"
              >
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {pairing.open ? (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() =>
            setPairing({
              open: false,
              code: null,
              expiresAt: null,
              loading: false,
            })
          }
          role="dialog"
          aria-modal="true"
          aria-labelledby="pair-phone-title"
        >
          <div
            className="w-full max-w-md rounded-lg bg-white shadow-lift p-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() =>
                setPairing({
                  open: false,
                  code: null,
                  expiresAt: null,
                  loading: false,
                })
              }
              className="absolute top-3 right-3 p-2.5 min-h-11 min-w-11 rounded-md hover:bg-amber-50 text-muted inline-flex items-center justify-center"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 id="pair-phone-title" className="font-display text-2xl text-center">
              Pair your phone
            </h2>
            <p className="text-sm text-muted text-center mt-1">
              Open Inbox Agent on your phone and enter this code.
            </p>

            <div className="my-8">
              {pairing.loading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                </div>
              ) : pairing.code ? (
                <div
                  className="flex items-center justify-center gap-2 select-all"
                  role="group"
                  aria-label={`Pairing code: ${pairing.code.split("").join(" ")}`}
                >
                  {pairing.code.split("").map((digit, i) => (
                    <span
                      key={i}
                      aria-hidden="true"
                      className="font-display text-primary-600 tabular-nums text-6xl sm:text-7xl leading-none flex items-center justify-center w-14 h-20 sm:w-16 sm:h-24 rounded-lg bg-amber-50 border border-amber-200 shadow-lift"
                    >
                      {digit}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="font-display text-primary-600 text-center text-6xl">—</p>
              )}
            </div>

            {pairing.code && pairing.expiresAt ? (
              <CountdownBar expiresAt={pairing.expiresAt} now={now} />
            ) : null}

            {pairing.code ? (
              <>
                <div className="mt-5 flex items-center justify-center">
                  <QrFallback code={pairing.code} />
                </div>
                <div className="mt-4 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(pairing.code!);
                        toast.success("Code copied");
                      } catch {
                        toast.error("Couldn't copy");
                      }
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-primary-700 hover:underline"
                  >
                    <Copy className="h-3 w-3" /> Copy code
                  </button>
                  <button
                    type="button"
                    onClick={startPairing}
                    className="inline-flex items-center gap-1.5 text-xs text-primary-700 hover:underline"
                  >
                    <RefreshCw className="h-3 w-3" /> Generate a new code
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function QrFallback({ code }: { code: string }) {
  // Lightweight visual fallback that doesn't require an additional dep.
  // The 6-digit code is the canonical pairing input; this is decorative.
  const link = `inbox-agent://pair/${code}`;
  return (
    <a
      href={link}
      className="text-xs text-muted hover:text-primary-600 inline-flex flex-col items-center"
    >
      <span className="grid grid-cols-6 gap-0.5 p-2 rounded-md border border-border bg-bg-cream">
        {Array.from({ length: 36 }).map((_, i) => {
          const seed = (code.charCodeAt(i % code.length) + i) % 3;
          return (
            <span
              key={i}
              className={
                "h-2 w-2 " +
                (seed === 0
                  ? "bg-primary-600"
                  : seed === 1
                    ? "bg-primary-300"
                    : "bg-transparent")
              }
            />
          );
        })}
      </span>
      <span className="mt-1">{link}</span>
    </a>
  );
}

function CountdownBar({
  expiresAt,
  now,
}: {
  expiresAt: string;
  now: number;
}) {
  const expires = new Date(expiresAt).getTime();
  const totalMs = 10 * 60 * 1000; // assume 10-minute window
  const remaining = Math.max(0, expires - now);
  const pct = Math.min(100, Math.max(0, (remaining / totalMs) * 100));
  const minutes = Math.max(0, Math.floor(remaining / 60000));
  const seconds = Math.max(0, Math.floor((remaining % 60000) / 1000));
  return (
    <div className="space-y-2">
      <div
        className="h-1.5 w-full rounded-full bg-amber-100 overflow-hidden"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
        aria-label="Time remaining"
      >
        <div
          className="h-full bg-primary-500 transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-center text-sm">
        Expires in{" "}
        <span className="font-mono font-semibold tabular-nums">
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </span>
      </p>
    </div>
  );
}
