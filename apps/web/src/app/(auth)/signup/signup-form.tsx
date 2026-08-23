"use client";

import { useState, useMemo, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/client";

function validatePassword(pw: string): string | null {
  if (pw.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Za-z]/.test(pw)) return "Password must contain a letter.";
  if (!/\d/.test(pw)) return "Password must contain a number.";
  return null;
}

/**
 * Returns a strength score 0..4 based on length + class diversity.
 * 0 = empty, 1 = weak, 2 = fair, 3 = good, 4 = strong.
 */
function passwordStrength(pw: string): { score: 0 | 1 | 2 | 3 | 4; label: string } {
  if (!pw) return { score: 0, label: "" };
  let entropy = 0;
  if (pw.length >= 8) entropy++;
  if (pw.length >= 12) entropy++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) entropy++;
  if (/\d/.test(pw)) entropy++;
  if (/[^A-Za-z0-9]/.test(pw)) entropy++;

  let score: 0 | 1 | 2 | 3 | 4 = 1;
  if (entropy >= 5) score = 4;
  else if (entropy >= 4) score = 3;
  else if (entropy >= 3) score = 2;
  else score = 1;

  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  return { score, label: labels[score] };
}

export function SignupForm() {
  const router = useRouter();
  const supabase = createBrowserClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [alreadyExists, setAlreadyExists] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const strength = useMemo(() => passwordStrength(password), [password]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    setEmailError(null);
    setPasswordError(null);
    setConfirmError(null);
    setFormError(null);
    setAlreadyExists(null);

    const trimmedEmail = email.trim();
    let hasError = false;
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setEmailError("Enter a valid email address.");
      hasError = true;
    }
    const pwError = validatePassword(password);
    if (pwError) {
      setPasswordError(pwError);
      hasError = true;
    }
    if (password !== confirm) {
      setConfirmError("Passwords don’t match.");
      hasError = true;
    }
    if (hasError) return;

    setLoading(true);
    try {
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback`
          : undefined;

      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: { emailRedirectTo: redirectTo },
      });

      if (error) {
        const msg = error.message ?? "Couldn’t create account.";
        // Branch on user_already_exists / "already" patterns from Supabase
        if (/already/i.test(msg) || /exists/i.test(msg)) {
          setAlreadyExists(trimmedEmail);
          setFormError("An account with that email already exists.");
        } else {
          setFormError(msg);
          toast.error(msg);
        }
        return;
      }

      // If email confirmation is required, session will be null.
      if (!data.session) {
        toast.success("Check your email to confirm your account.");
        router.push("/login");
        return;
      }

      toast.success("Account created!");
      router.push("/welcome");
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
        options: { redirectTo },
      });

      if (error) {
        toast.error(error.message);
        setGoogleLoading(false);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Couldn’t start Google sign-up.";
      toast.error(message);
      setGoogleLoading(false);
    }
  }

  const inputBase =
    "w-full rounded-md border bg-white px-3.5 py-2.5 text-fg placeholder:text-muted shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)] focus-visible:ring-offset-2 focus-visible:border-[var(--accent)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed";
  const inputClass = (hasError: boolean) =>
    `${inputBase} ${hasError ? "border-red-500" : "border-ink/15"}`;

  const barColor = (idx: number) => {
    if (strength.score === 0) return "bg-border";
    if (idx >= strength.score) return "bg-border";
    if (strength.score === 1) return "bg-red-500";
    if (strength.score === 2) return "bg-amber-400";
    if (strength.score === 3) return "bg-amber-500";
    return "bg-emerald-500";
  };

  const labelColor =
    strength.score >= 4
      ? "text-emerald-600"
      : strength.score === 3
        ? "text-amber-600"
        : strength.score === 2
          ? "text-amber-600"
          : "text-red-600";

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
            aria-describedby={emailError ? "signup-email-error" : undefined}
          />
          {emailError && (
            <p id="signup-email-error" className="mt-1.5 text-xs text-red-600">
              {emailError}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-fg mb-1.5">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (passwordError) setPasswordError(null);
            }}
            placeholder="At least 8 characters"
            className={inputClass(!!passwordError)}
            disabled={loading}
            aria-invalid={!!passwordError}
            aria-describedby="signup-password-help"
          />

          {/* Password strength meter */}
          <div className="mt-2 flex items-center gap-2" aria-hidden={!password}>
            <div className="flex-1 grid grid-cols-4 gap-1">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-colors ${barColor(i)}`}
                />
              ))}
            </div>
            {strength.label && (
              <span className={`text-xs font-medium ${labelColor}`}>
                {strength.label}
              </span>
            )}
          </div>

          {passwordError ? (
            <p className="mt-1.5 text-xs text-red-600">{passwordError}</p>
          ) : (
            <p id="signup-password-help" className="mt-1.5 text-xs text-muted">
              8+ characters, with at least one letter and one number.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="confirm" className="block text-sm font-medium text-fg mb-1.5">
            Confirm password
          </label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value);
              if (confirmError) setConfirmError(null);
            }}
            placeholder="Re-enter your password"
            className={inputClass(!!confirmError)}
            disabled={loading}
            aria-invalid={!!confirmError}
            aria-describedby={confirmError ? "signup-confirm-error" : undefined}
          />
          {confirmError && (
            <p id="signup-confirm-error" className="mt-1.5 text-xs text-red-600">
              {confirmError}
            </p>
          )}
        </div>

        {formError && (
          <div className="rounded-md bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-red-700">
            <p>{formError}</p>
            {alreadyExists && (
              <p className="mt-2">
                <Link
                  href={`/login?email=${encodeURIComponent(alreadyExists)}`}
                  className="font-semibold underline hover:no-underline"
                >
                  Sign in instead
                </Link>
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
          {loading ? "Creating account…" : "Create account"}
        </button>

        <p className="text-[11px] text-muted text-center">
          By signing up you agree to our{" "}
          <Link href="/terms" className="underline hover:text-[var(--accent)]">Terms</Link>{" "}and{" "}
          <Link href="/privacy" className="underline hover:text-[var(--accent)]">Privacy</Link>.
        </p>

        <p className="text-sm text-muted text-center">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-[var(--accent)] hover:underline transition-colors"
          >
            Sign in
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
