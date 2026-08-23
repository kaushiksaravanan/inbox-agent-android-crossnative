"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, MailCheck } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const supabase = createBrowserClient();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    setEmailError(null);
    setFormError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setEmailError("Enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback?next=/account/reset-password`
          : undefined;

      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo,
      });

      if (error) {
        setFormError(error.message);
        toast.error(error.message);
        return;
      }

      setSent(true);
      toast.success("Check your inbox for the reset link.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setFormError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  const inputBase =
    "w-full rounded-md border bg-white px-3.5 py-2.5 text-fg placeholder:text-muted shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)] focus-visible:ring-offset-2 focus-visible:border-[var(--accent)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed";
  const inputClass = emailError
    ? `${inputBase} border-red-500`
    : `${inputBase} border-ink/15`;

  if (sent) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-5 shadow-soft">
          <div className="flex items-start gap-3">
            <MailCheck className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-fg font-semibold">Email sent.</p>
              <p className="mt-1 text-sm text-muted">
                We sent a password reset link to <strong>{email}</strong>. The link
                expires in 1 hour. Check your spam folder if it&apos;s not in your inbox in
                the next minute.
              </p>
            </div>
          </div>
        </div>
        <p className="text-sm text-muted text-center">
          <Link
            href="/login"
            className="font-semibold text-[var(--accent)] hover:underline transition-colors"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-fg mb-1.5">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (emailError) setEmailError(null);
          }}
          placeholder="you@example.com"
          className={inputClass}
          disabled={loading}
          aria-invalid={!!emailError}
          aria-describedby={emailError ? "forgot-email-error" : undefined}
        />
        {emailError && (
          <p id="forgot-email-error" className="mt-1.5 text-xs text-red-600">
            {emailError}
          </p>
        )}
      </div>

      {formError && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-red-700">
          {formError}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 font-semibold text-white shadow-soft hover:shadow-[var(--shadow-cta)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)] focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? "Sending…" : "Send reset link"}
      </button>

      <p className="text-sm text-muted text-center">
        Remembered it?{" "}
        <Link
          href="/login"
          className="font-semibold text-[var(--accent)] hover:underline transition-colors"
        >
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
