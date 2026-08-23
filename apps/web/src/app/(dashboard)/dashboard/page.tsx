"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckSquare,
  BellRing,
  Mail,
  Activity,
  Smartphone,
} from "lucide-react";
import { format } from "date-fns";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { PriorityDot } from "@/components/priority-dot";
import { CategoryIcon } from "@/components/category-icon";
import { formatSmartDate } from "@/lib/format";
import { isGmailConnected } from "@/lib/gmail-oauth";
import { getAllTasks } from "@/lib/local-db";
import type { Task } from "@inbox/shared";

type Bucket = {
  todayCount: number;
  upcomingAlarms: Task[];
  activity: Task[];
  accountCount: number;
};

const EMPTY: Bucket = {
  todayCount: 0,
  upcomingAlarms: [],
  activity: [],
  accountCount: 0,
};

export default function DashboardPage() {
  const [data, setData] = useState<Bucket | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const tasks = await getAllTasks();
      if (cancelled) return;

      const pending = tasks.filter((t) => t.status === "pending");

      const todayCount = pending.filter((t) => {
        if (!t.due_at) return false;
        const due = new Date(t.due_at);
        return due <= endOfDay;
      }).length;

      const upcomingAlarms = pending
        .filter((t) => t.alarm_at && new Date(t.alarm_at) >= now)
        .sort(
          (a, b) =>
            new Date(a.alarm_at!).getTime() - new Date(b.alarm_at!).getTime(),
        )
        .slice(0, 5);

      const activity = [...tasks]
        .sort((a, b) => {
          const aTime = a.alarm_at ? new Date(a.alarm_at).getTime() : 0;
          const bTime = b.alarm_at ? new Date(b.alarm_at).getTime() : 0;
          return bTime - aTime;
        })
        .slice(0, 8);

      setData({
        todayCount,
        upcomingAlarms,
        activity,
        accountCount: isGmailConnected() ? 1 : 0,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const view = data ?? EMPTY;

  if (data && view.accountCount === 0) {
    return (
      <EmptyState
        icon={<Mail className="h-7 w-7" />}
        title="Set up your phone first"
        description="Inbox Agent runs on Android. Install the APK, pair this account, and connect Gmail — all three steps live on one page."
        action={{ label: "Open setup", href: "/welcome" }}
      />
    );
  }

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Tasks today"
          value={view.todayCount}
          hint="Due before midnight"
          icon={<CheckSquare className="h-5 w-5" />}
        />
        <StatCard
          label="Pending alarms"
          value={view.upcomingAlarms.length}
          hint="Next 7 days"
          icon={<BellRing className="h-5 w-5" />}
          accent="red"
        />
        <StatCard
          label="Connected accounts"
          value={view.accountCount}
          hint={view.accountCount > 0 ? "Syncing locally" : "Connect Gmail"}
          icon={<Mail className="h-5 w-5" />}
          accent="success"
        />
        <StatCard
          label="Pairing status"
          value="Open /devices"
          hint="Pair your phone for alarms"
          icon={<Smartphone className="h-5 w-5" />}
          accent="muted"
        />
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-xl">Upcoming alarms</h2>
          <Link
            href="/tasks"
            className="text-sm text-primary-600 hover:text-primary-700 font-semibold"
          >
            View all tasks →
          </Link>
        </div>

        {view.upcomingAlarms.length === 0 ? (
          <EmptyState
            icon={<BellRing className="h-7 w-7" />}
            title="Nothing pressing right now"
            description="When a task gets close to its due date, it'll show up here so you can act before the deadline."
          />
        ) : (
          <ul className="rounded-lg overflow-hidden border border-border bg-white">
            {view.upcomingAlarms.map((task, i) => (
              <li
                key={task.id}
                className={i % 2 === 0 ? "bg-white" : "bg-bg-cream/60"}
              >
                <Link
                  href="/tasks"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-amber-50 transition-colors"
                >
                  <PriorityDot priority={task.priority} />
                  <CategoryIcon category={task.category} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    {task.counterparty ? (
                      <p className="text-xs text-muted truncate">
                        {task.counterparty}
                      </p>
                    ) : null}
                  </div>
                  {task.alarm_at ? (
                    <span
                      className="text-xs text-muted whitespace-nowrap tabular-nums"
                      title={format(new Date(task.alarm_at), "PPpp")}
                    >
                      {formatSmartDate(new Date(task.alarm_at))}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-xl">Recent activity</h2>
          <Activity className="h-4 w-4 text-muted" />
        </div>
        {view.activity.length === 0 ? (
          <p className="text-sm text-muted">
            No activity yet. Hit Sync on /accounts to pull recent mail.
          </p>
        ) : (
          <ul className="space-y-2">
            {view.activity.map((task) => (
              <li
                key={task.id}
                className="flex items-center gap-3 rounded-lg bg-white border border-border px-4 py-2.5 text-sm hover:shadow-soft transition-shadow"
              >
                <PriorityDot priority={task.priority} size="sm" />
                <span className="flex-1 truncate">{task.title}</span>
                <span
                  className={
                    "text-xs font-medium capitalize " +
                    (task.status === "done"
                      ? "text-success"
                      : task.status === "dismissed"
                        ? "text-muted"
                        : task.status === "snoozed"
                          ? "text-warning"
                          : "text-primary-600")
                  }
                >
                  {task.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
