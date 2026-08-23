"use client";

// apps/web/src/app/(dashboard)/settings/byok-section.tsx
//
// "API Keys" section for the Settings page. Lets users either rely on the
// platform-vended (CipherStack-rotated) key pool or supply their own provider
// API key. We never round-trip the actual key value back to the client — GET
// only returns provider/label/created_at/last_used_at.
//
// Visual language matches the rest of Settings: black-on-white with border-black
// rules, mono labels in small caps, no chrome.

import { useEffect, useState, useTransition } from "react";
import {
  listByokKeys,
  saveByokKey,
  deleteByokKey,
  setUseByok,
  getUseByok,
  type ByokKey,
  type Provider as ProviderId,
} from "@/lib/local-byok";

interface SavedKey {
  provider: ProviderId;
  label: string | null;
  created_at: string;
  last_used_at: string | null;
}

interface BYOKState {
  keys: SavedKey[];
  use_byok: boolean;
  preferred_byok_provider: ProviderId | null;
}

const PROVIDERS: { id: ProviderId; label: string }[] = [
  { id: "gemini", label: "Gemini" },
  { id: "openai", label: "OpenAI" },
  { id: "anthropic", label: "Anthropic" },
  { id: "groq", label: "Groq" },
];

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const s = Math.max(1, Math.floor((now - then) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function ByokSection() {
  const [state, setState] = useState<BYOKState | null>(null);
  const [mode, setMode] = useState<"platform" | "byok">("platform");
  const [provider, setProvider] = useState<ProviderId>("gemini");
  const [keyValue, setKeyValue] = useState("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function refresh() {
    try {
      const [keys, useByok] = await Promise.all([listByokKeys(), getUseByok()]);
      const mapped: SavedKey[] = keys.map((k: ByokKey) => ({
        provider: k.provider,
        label: k.label ?? null,
        created_at: new Date(k.createdAt).toISOString(),
        last_used_at: k.lastUsedAt ? new Date(k.lastUsedAt).toISOString() : null,
      }));
      const preferred = mapped[0]?.provider ?? null;
      setState({ keys: mapped, use_byok: useByok, preferred_byok_provider: preferred });
      setMode(useByok ? "byok" : "platform");
      if (preferred) setProvider(preferred);
    } catch {
      setError("Failed to load API key settings.");
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function save() {
    setError(null);
    if (mode === "platform") {
      try {
        await setUseByok(false);
      } catch {
        setError("Could not update preference.");
      }
      await refresh();
      return;
    }

    if (!keyValue.trim()) {
      setError("Paste your API key to save.");
      return;
    }
    try {
      await saveByokKey(provider, keyValue.trim(), label.trim() || undefined);
      await setUseByok(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save key.");
      return;
    }
    setKeyValue("");
    setLabel("");
    await refresh();
  }

  async function remove(p: ProviderId) {
    setError(null);
    try {
      await deleteByokKey(p);
    } catch {
      setError("Failed to delete key.");
      return;
    }
    await refresh();
  }

  return (
    <section className="rounded-lg bg-white border border-black p-5">
      <div className="border-b border-black pb-3 mb-4">
        <h2 className="font-mono text-xs uppercase tracking-widest">API Keys</h2>
        <p className="text-xs text-muted mt-1">
          Keys are encrypted and stored on this device only. They never touch our servers.
        </p>
        <p className="text-xs text-muted mt-1">
          Choose whether Inbox Agent uses our managed key pool or your own provider API key.
        </p>
      </div>

      <fieldset className="space-y-2">
        <legend className="sr-only">Key source</legend>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="radio"
            name="key_source"
            value="platform"
            checked={mode === "platform"}
            onChange={() => setMode("platform")}
            className="mt-1 accent-black"
          />
          <span>
            <span className="text-sm font-medium">Use ours (recommended)</span>
            <span className="block text-xs text-muted">
              We rotate keys automatically and absorb rate limits.
            </span>
          </span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="radio"
            name="key_source"
            value="byok"
            checked={mode === "byok"}
            onChange={() => setMode("byok")}
            className="mt-1 accent-black"
          />
          <span>
            <span className="text-sm font-medium">Use my own key</span>
            <span className="block text-xs text-muted">
              When using your own key, we don&apos;t track usage and we don&apos;t apply rate
              limiting. You manage quotas with your provider.
            </span>
          </span>
        </label>
      </fieldset>

      {mode === "byok" ? (
        <div className="mt-5 space-y-3 border-t border-black/20 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-3">
            <label htmlFor="byok_provider" className="font-mono text-xs uppercase tracking-widest">
              Provider
            </label>
            <select
              id="byok_provider"
              value={provider}
              onChange={(e) => setProvider(e.target.value as ProviderId)}
              className="sm:col-span-2 rounded-md border border-black bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
            >
              {PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-3">
            <label htmlFor="byok_key" className="font-mono text-xs uppercase tracking-widest">
              API key
            </label>
            <input
              id="byok_key"
              type="password"
              autoComplete="off"
              spellCheck={false}
              value={keyValue}
              onChange={(e) => setKeyValue(e.target.value)}
              placeholder="sk-… / AIza… / etc."
              className="sm:col-span-2 rounded-md border border-black bg-white px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-3">
            <label htmlFor="byok_label" className="font-mono text-xs uppercase tracking-widest">
              Label
            </label>
            <input
              id="byok_label"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. work, billing"
              className="sm:col-span-2 rounded-md border border-black bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => startTransition(save)}
              disabled={pending}
              className="rounded-none border border-black bg-black text-white text-sm font-medium px-4 py-2 hover:bg-white hover:text-black disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save key"}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={() => startTransition(save)}
            disabled={pending}
            className="rounded-none border border-black bg-white text-black text-sm font-medium px-4 py-2 hover:bg-black hover:text-white disabled:opacity-60"
          >
            {pending ? "Saving…" : "Use platform keys"}
          </button>
        </div>
      )}

      {error ? <p className="mt-3 text-xs text-red-700">{error}</p> : null}

      {state && state.keys.length > 0 ? (
        <div className="mt-6 border-t border-black/20 pt-4">
          <h3 className="font-mono text-xs uppercase tracking-widest mb-2">Saved keys</h3>
          <ul className="divide-y divide-black/10">
            {state.keys.map((k) => (
              <li key={k.provider} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <span className="font-medium">
                    {PROVIDERS.find((p) => p.id === k.provider)?.label ?? k.provider}
                  </span>
                  {k.label ? <span className="text-muted"> · {k.label}</span> : null}
                  <span className="block text-xs text-muted">
                    Added {relativeTime(k.created_at)}
                    {k.last_used_at ? ` · used ${relativeTime(k.last_used_at)}` : ""}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => startTransition(() => remove(k.provider))}
                  className="text-xs underline underline-offset-2 hover:text-red-700"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
