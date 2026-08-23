"use client";

import { useState } from "react";

type Status = "idle" | "submitting" | "success" | "error";

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setError(null);

    // Capture form element BEFORE await — React nulls e.currentTarget after
    // any async boundary, so any later access via e.currentTarget throws.
    const form = e.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      message: String(formData.get("message") || ""),
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || `Request failed (${res.status})`);
      }
      form.reset();
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (status === "success") {
    return (
      <div className="border border-black p-8">
        <p className="mono text-xs text-black/55 mb-3">SENT</p>
        <h3 className="display text-[28px] leading-[1.05]">Thanks. We&rsquo;ll reply.</h3>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-6 inline-flex items-center gap-2 text-sm border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors"
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="border border-black p-8 space-y-6">
      <Field
        id="name"
        label="Name"
        input={
          <input
            id="name"
            name="name"
            type="text"
            required
            minLength={1}
            maxLength={120}
            autoComplete="name"
            className="block w-full bg-transparent border-b border-black/30 focus:border-black outline-none py-2 text-[15px]"
          />
        }
      />
      <Field
        id="email"
        label="Email"
        input={
          <input
            id="email"
            name="email"
            type="email"
            required
            maxLength={200}
            autoComplete="email"
            className="block w-full bg-transparent border-b border-black/30 focus:border-black outline-none py-2 text-[15px]"
          />
        }
      />
      <Field
        id="message"
        label="Message"
        input={
          <textarea
            id="message"
            name="message"
            required
            minLength={5}
            maxLength={5000}
            rows={6}
            className="block w-full bg-transparent border-b border-black/30 focus:border-black outline-none py-2 text-[15px] resize-y"
          />
        }
      />

      {status === "error" && error ? (
        <p className="mono text-xs text-red-600">{error}</p>
      ) : null}

      <div className="flex items-center justify-between gap-4 pt-2">
        <p className="mono text-[11px] text-black/60">
          By submitting you accept that we will reply by email.
        </p>
        <button
          type="submit"
          disabled={status === "submitting"}
          className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 text-[14px] hover:bg-black/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "submitting" ? "Sending…" : "Send message"}
          <span aria-hidden>→</span>
        </button>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  input,
}: {
  id: string;
  label: string;
  input: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mono text-[11px] text-black/55 uppercase tracking-wider block mb-1">
        {label}
      </label>
      {input}
    </div>
  );
}
