"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CheckSquare,
  Mail,
  Smartphone,
  Settings,
  LogOut,
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { createBrowserClient } from "@/lib/supabase/client";
import { initialsFrom } from "@/lib/format";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: Sparkles },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/accounts", label: "Accounts", icon: Mail },
  { href: "/devices", label: "Devices", icon: Smartphone },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function NavSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<{
    email: string | null;
    name: string | null;
  }>({ email: null, name: null });

  useEffect(() => {
    const supabase = createBrowserClient();
    let cancelled = false;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled || !user) return;
      const md = (user.user_metadata ?? {}) as Record<string, unknown>;
      const name =
        (md.full_name as string | undefined) ??
        (md.name as string | undefined) ??
        null;
      setProfile({ email: user.email ?? null, name });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Close the mobile drawer on Escape — same affordance as the close button.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  async function signOut() {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {/* Mobile toggle */}
      <button
        type="button"
        aria-label="Open menu"
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-30 rounded-md bg-white p-2 shadow-soft border border-border"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-bg-cream border-r border-border flex flex-col",
          "transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-full gradient-amber inline-flex items-center justify-center text-white font-bold">
              i
            </span>
            <span className="font-display text-xl">Inbox Agent</span>
          </Link>
          <button
            type="button"
            aria-label="Close menu"
            className="lg:hidden min-h-11 min-w-11 inline-flex items-center justify-center rounded-md hover:bg-white -mr-2"
            onClick={() => setOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  active
                    ? "bg-primary-500 text-white shadow-soft font-semibold"
                    : "text-fg hover:bg-white"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-3 border-t border-border space-y-2">
          {profile.email ? (
            <div className="flex items-center gap-2 px-2 py-1.5">
              <span className="h-8 w-8 rounded-full bg-primary-light/30 text-primary-700 inline-flex items-center justify-center text-xs font-semibold shrink-0">
                {initialsFrom(profile.name ?? profile.email)}
              </span>
              <div className="min-w-0 flex-1">
                {profile.name ? (
                  <p className="text-xs font-semibold truncate">
                    {profile.name}
                  </p>
                ) : null}
                <p className="text-xs text-muted truncate">{profile.email}</p>
              </div>
            </div>
          ) : null}
          <button
            type="button"
            onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted hover:bg-white hover:text-fg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
