import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { SignupForm } from "./signup-form";

export const metadata = {
  title: "Create account",
  description:
    "Create a free Inbox Agent account. 60 second setup, no card required. Connect Gmail or Outlook and pair your phone in six digits.",
};

export default async function SignupPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="display text-3xl text-[var(--ink)] tracking-[-0.03em]">Create your account</h2>
        <p className="mt-2 text-[var(--ink-muted)]">
          Free to start. Connect a mailbox in under a minute.
        </p>
      </div>

      <SignupForm />

      <p className="text-center text-sm text-[var(--ink-muted)]">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-[var(--accent)] font-semibold hover:opacity-80 transition-opacity"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
