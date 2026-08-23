"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { completeGmailOAuth } from "@/lib/gmail-oauth";

type Status = "exchanging" | "success" | "error";

function GoogleOAuthCallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [status, setStatus] = useState<Status>("exchanging");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      // Google can come back with an explicit error (e.g. access_denied).
      const oauthError = params.get("error");
      if (oauthError) {
        if (!cancelled) {
          setError(
            params.get("error_description") || oauthError || "OAuth error."
          );
          setStatus("error");
        }
        return;
      }

      const code = params.get("code");
      const state = params.get("state") ?? undefined;
      if (!code) {
        if (!cancelled) {
          setError("Missing authorization code in callback URL.");
          setStatus("error");
        }
        return;
      }

      try {
        await completeGmailOAuth(code, state);
        if (cancelled) return;
        setStatus("success");
        router.replace("/dashboard/tasks");
      } catch (e) {
        if (cancelled) return;
        const msg =
          e instanceof Error ? e.message : "Failed to complete OAuth.";
        setError(msg);
        setStatus("error");
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [params, router]);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      {status === "exchanging" && (
        <>
          <h1 className="text-lg font-semibold">Connecting Gmail…</h1>
          <p className="text-sm text-muted-foreground">
            Exchanging the authorization code with Google. This stays entirely
            in your browser.
          </p>
        </>
      )}

      {status === "success" && (
        <>
          <h1 className="text-lg font-semibold">Gmail connected</h1>
          <p className="text-sm text-muted-foreground">
            Redirecting to your tasks…
          </p>
        </>
      )}

      {status === "error" && (
        <>
          <h1 className="text-lg font-semibold text-destructive">
            Couldn&apos;t finish Gmail sign-in
          </h1>
          <p className="break-words text-sm text-muted-foreground">
            {error}
          </p>
          <button
            type="button"
            onClick={() => router.replace("/dashboard/tasks")}
            className="mt-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm hover:bg-accent"
          >
            Back to dashboard
          </button>
        </>
      )}
    </main>
  );
}

export default function GoogleOAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
          <h1 className="text-lg font-semibold">Connecting Gmail…</h1>
        </main>
      }
    >
      <GoogleOAuthCallbackInner />
    </Suspense>
  );
}
