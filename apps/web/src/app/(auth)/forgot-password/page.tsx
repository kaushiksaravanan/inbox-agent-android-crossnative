import Link from "next/link";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata = {
  title: "Reset password",
};

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="display text-3xl text-[var(--ink)] tracking-[-0.03em]">Reset your password</h2>
        <p className="mt-2 text-[var(--ink-muted)]">
          Enter your email and we&apos;ll send you a link to set a new password.
        </p>
      </div>

      <ForgotPasswordForm />

      <p className="text-center text-sm text-[var(--ink-muted)]">
        Remembered it?{" "}
        <Link
          href="/login"
          className="text-[var(--accent)] font-semibold hover:opacity-80 transition-opacity"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
