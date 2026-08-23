"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createBrowserClient();

  const initialEmail = searchParams?.get("email") ?? "";
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // tick down resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  async function handleResend() {
    if (resending || resendCooldown > 0) return;
    const trimmed = email.trim();
    if (!trimmed) {
      toast.error("Enter your email above first.");
      return;
    }
    setResending(true);
    try {
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback`
          : undefined;
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: trimmed,
        options: { emailRedirectTo: redirectTo },
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Verification email sent. Check your inbox.");
        setResendCooldown(30);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Resend failed.");
    } finally {
      setResending(false);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    setEmailError(null);
    setPasswordError(null);
    setFormError(null);
    setNeedsConfirm(false);

    const trimmedEmail = email.trim();
    let hasError = false;
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setEmailError("Enter a valid email address.");
      hasError = true;
    }
    if (!password) {
      setPasswordError("Enter your password.");
      hasError = true;
    }
    if (hasError) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        const msg = error.message ?? "Couldn’t sign in. Check your details.";
        if (msg === "Email not confirmed" || /not.*confirmed/i.test(msg)) {
          setNeedsConfirm(true);
          setFormError("Your email isn’t confirmed yet.");
        } else {
          setFormError(msg);
          toast.error(msg);
        }
        return;
      }

      toast.success("Welcome back!");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setFormError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    if (googleLoading) return;
    setGoogleLoading(true);
    try {
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback`
          : undefined;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      });

      if (error) {
        toast.error(error.message);
        setGoogleLoading(false);
      }
      // On success the browser is redirected to Google; no further action.
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Couldn’t start Google sign-in.";
      toast.error(message);
      setGoogleLoading(false);
    }
  }

  const inputBase =
    "w-full rounded-md border bg-white px-3.5 py-2.5 text-fg placeholder:text-muted shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)] focus-visible:ring-offset-2 focus-visible:border-[var(--accent)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed";
  const inputClass = (hasError: boolean) =>
    `${inputBase} ${hasError ? "border-red-500" : "border-ink/15"}`;

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={handleGoogle}
        disabled={googleLoading || loading}
        className="w-full inline-flex items-center justify-center gap-3 rounded-full border border-ink/15 bg-white px-4 py-3 text-fg font-medium shadow-soft hover:bg-bg-cream hover:scale-[1.01] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)] focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
      >
        {googleLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <GoogleIcon />
        )}
        {googleLoading ? "Redirecting…" : "Continue with Google"}
      </button>

      <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-muted">
        <span className="h-px flex-1 bg-border" />
        <span>or</span>
        <span className="h-px flex-1 bg-border" />
      </div>

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
            className={inputClass(!!emailError)}
            disabled={loading}
            aria-invalid={!!emailError}
            aria-describedby={emailError ? "email-error" : undefined}
          />
          {emailError && (
            <p id="email-error" className="mt-1.5 text-xs text-red-600">
              {emailError}
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-fg">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-sm text-[var(--accent)] hover:underline transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (passwordError) setPasswordError(null);
            }}
            placeholder="••••••••"
            className={inputClass(!!passwordError)}
            disabled={loading}
            aria-invalid={!!passwordError}
            aria-describedby={passwordError ? "password-error" : undefined}
          />
          {passwordError && (
            <p id="password-error" className="mt-1.5 text-xs text-red-600">
              {passwordError}
            </p>
          )}
        </div>

        {formError && (
          <div className="rounded-md bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-red-700">
            <p>{formError}</p>
            {needsConfirm && (
              <p className="mt-2">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending || resendCooldown > 0}
                  className="font-semibold underline hover:no-underline disabled:opacity-60 disabled:no-underline disabled:cursor-not-allowed"
                >
                  {resending
                    ? "Sending…"
                    : resendCooldown > 0
                      ? `Resend in ${resendCooldown}s`
                      : "Resend verification email"}
                </button>
              </p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || googleLoading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 font-semibold text-white shadow-soft hover:shadow-[var(--shadow-cta)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)] focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? "Signing in…" : "Sign in"}
        </button>

        <p className="text-sm text-muted text-center">
          New to Inbox Agent?{" "}
          <Link
            href="/signup"
            className="font-semibold text-[var(--accent)] hover:underline transition-colors"
          >
            Create an account
          </Link>
        </p>
      </form>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}
