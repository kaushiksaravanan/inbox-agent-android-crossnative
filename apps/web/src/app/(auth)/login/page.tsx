import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Sign in",
  description:
    "Sign in to Inbox Agent to manage your connected mailboxes, paired phones, and the action verbs your agent rings you for.",
};

export default async function LoginPage() {
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
        <h2 className="display text-3xl text-[var(--ink)] tracking-[-0.03em]">Welcome back</h2>
        <p className="mt-2 text-[var(--ink-muted)]">
          Sign in to keep on top of your inbox.
        </p>
      </div>

      <LoginForm />

      <p className="text-center text-sm text-[var(--ink-muted)]">
        New here?{" "}
        <Link
          href="/signup"
          className="text-[var(--accent)] font-semibold hover:opacity-80 transition-opacity"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
