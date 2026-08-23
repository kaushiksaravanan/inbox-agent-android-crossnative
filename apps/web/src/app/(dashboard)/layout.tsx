import { redirect } from "next/navigation";
import Link from "next/link";
import { Smartphone } from "lucide-react";
import { createServerClient } from "@/lib/supabase/server";
import { NavSidebar } from "@/components/nav-sidebar";
import { AccountChips } from "@/components/account-chips";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function firstNameFrom(user: {
  user_metadata?: Record<string, unknown> | null;
  email?: string | null;
}): string {
  const md = (user.user_metadata ?? {}) as Record<string, unknown>;
  const fullName =
    (md.full_name as string | undefined) ?? (md.name as string | undefined);
  if (fullName && fullName.trim()) return fullName.trim().split(/\s+/)[0]!;
  const first = md.first_name as string | undefined;
  if (first && first.trim()) return first.trim();
  if (user.email) return user.email.split("@")[0]!;
  return "there";
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Account state lives on this device now — read it client-side.

  return (
    <div className="min-h-screen bg-bg-cream/50 flex">
      <a
        href="#dashboard-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 z-50 rounded-md bg-primary-500 text-white text-sm font-semibold px-3 py-2 shadow-lift"
      >
        Skip to content
      </a>
      <NavSidebar />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-border">
          <div className="flex items-center justify-between gap-4 px-4 lg:px-8 py-4 pl-16 lg:pl-8">
            <div className="min-w-0">
              <p className="font-display text-xl lg:text-2xl truncate">
                {greeting()}, {firstNameFrom(user)}
              </p>
              <p className="text-xs text-muted">
                Here&apos;s what your inbox needs today.
              </p>
            </div>

            <div className="flex items-center gap-2 lg:gap-3">
              <AccountChips />

              <Link
                href="/devices"
                className="inline-flex items-center gap-2 rounded-full bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-4 py-2 transition-colors"
              >
                <Smartphone className="h-4 w-4" />
                <span className="hidden sm:inline">Pair Phone</span>
                <span className="sm:hidden">Pair</span>
              </Link>
            </div>
          </div>
        </header>

        <main id="dashboard-main" className="flex-1 px-4 lg:px-8 py-6 lg:py-8 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
