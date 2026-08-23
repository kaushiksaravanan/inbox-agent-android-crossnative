// expo-sqlite wrapper for the inbox-agent mobile client.
// Stores: tasks (id), emails_seen (gmail_id), meta (key).
// Mirrors the surface of apps/web/src/lib/local-db.ts.

import * as SQLite from "expo-sqlite";
import type { Task, TaskStatus, TaskDerivation } from "@inbox/shared";

const DB_NAME = "inbox-agent.db";

// Row shape as it lives in SQLite. derived_from is JSON-encoded.
interface TaskRow {
  id: string;
  title: string | null;
  detail: string | null;
  category: string | null;
  priority: string | null;
  due_at: string | null;
  amount_cents: number | null;
  counterparty: string | null;
  status: string;
  source_email_id: string | null;
  derived_from: string | null;
  created_at: number | null;
}

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function openLocalDb(): Promise<SQLite.SQLiteDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = (async () => {
    const db = await SQLite.openDatabaseAsync(DB_NAME);
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT,
        detail TEXT,
        category TEXT,
        priority TEXT,
        due_at TEXT,
        amount_cents INTEGER,
        counterparty TEXT,
        status TEXT DEFAULT 'pending',
        source_email_id TEXT,
        derived_from TEXT,
        created_at INTEGER
      );
      CREATE TABLE IF NOT EXISTS emails_seen (
        gmail_id TEXT PRIMARY KEY,
        seen_at INTEGER
      );
      CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY,
        value TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_tasks_created ON tasks(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    `);
    return db;
  })();
  return dbPromise;
}

// Cast a stored row back to a Task. JSON-decodes derived_from.
function rowToTask(row: TaskRow): Task {
  let derived: TaskDerivation;
  try {
    derived = row.derived_from
      ? (JSON.parse(row.derived_from) as TaskDerivation)
      : ({ source: "manual" } as unknown as TaskDerivation);
  } catch {
    derived = { source: "manual" } as unknown as TaskDerivation;
  }
  return {
    id: row.id,
    user_id: "",
    source_email_id: row.source_email_id ?? null,
    title: row.title ?? "",
    detail: row.detail ?? null,
    category: (row.category ?? "other") as Task["category"],
    priority: (row.priority ?? "medium") as Task["priority"],
    due_at: row.due_at ?? null,
    amount_cents: row.amount_cents ?? null,
    counterparty: row.counterparty ?? null,
    status: (row.status ?? "pending") as TaskStatus,
    alarm_at: null,
    alarm_fired_at: null,
    followup_count: 0,
    next_followup_at: null,
    derivedFrom: derived,
  };
}

export async function getAllTasks(filter?: {
  status?: TaskStatus;
  category?: string;
}): Promise<Task[]> {
  const db = await openLocalDb();
  const where: string[] = [];
  const args: (string | number | null)[] = [];
  if (filter?.status) {
    where.push("status = ?");
    args.push(filter.status);
  }
  if (filter?.category) {
    where.push("category = ?");
    args.push(filter.category);
  }
  const sql =
    "SELECT * FROM tasks" +
    (where.length ? " WHERE " + where.join(" AND ") : "") +
    " ORDER BY created_at DESC";
  const rows = await db.getAllAsync<TaskRow>(sql, args);
  return rows.map(rowToTask);
}

export async function addTask(task: Task): Promise<void> {
  const db = await openLocalDb();
  const createdAt =
    (task as Task & { createdAt?: number }).createdAt ?? Date.now();
  await db.runAsync(
    `INSERT OR REPLACE INTO tasks
       (id, title, detail, category, priority, due_at, amount_cents,
        counterparty, status, source_email_id, derived_from, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      task.id,
      task.title ?? null,
      task.detail ?? null,
      task.category ?? null,
      task.priority ?? null,
      task.due_at ?? null,
      task.amount_cents ?? null,
      task.counterparty ?? null,
      task.status ?? "pending",
      task.source_email_id ?? null,
      task.derivedFrom ? JSON.stringify(task.derivedFrom) : null,
      createdAt,
    ],
  );
}

export async function updateTask(
  id: string,
  patch: Partial<Task>,
): Promise<void> {
  const db = await openLocalDb();
  // Map Task keys to column names. derivedFrom is special-cased.
  const colMap: Record<string, string> = {
    title: "title",
    detail: "detail",
    category: "category",
    priority: "priority",
    due_at: "due_at",
    amount_cents: "amount_cents",
    counterparty: "counterparty",
    status: "status",
    source_email_id: "source_email_id",
  };
  const sets: string[] = [];
  const args: (string | number | null)[] = [];
  for (const [k, v] of Object.entries(patch)) {
    const col = colMap[k];
    if (col) {
      sets.push(`${col} = ?`);
      args.push((v ?? null) as string | number | null);
    } else if (k === "derivedFrom") {
      sets.push("derived_from = ?");
      args.push(v ? JSON.stringify(v) : null);
    }
  }
  if (!sets.length) return;
  args.push(id);
  await db.runAsync(
    `UPDATE tasks SET ${sets.join(", ")} WHERE id = ?`,
    args,
  );
}

export async function deleteTask(id: string): Promise<void> {
  const db = await openLocalDb();
  await db.runAsync("DELETE FROM tasks WHERE id = ?", [id]);
}

export async function markEmailSeen(gmailId: string): Promise<void> {
  const db = await openLocalDb();
  await db.runAsync(
    "INSERT OR REPLACE INTO emails_seen (gmail_id, seen_at) VALUES (?, ?)",
    [gmailId, Date.now()],
  );
}

export async function isEmailSeen(gmailId: string): Promise<boolean> {
  const db = await openLocalDb();
  const row = await db.getFirstAsync<{ gmail_id: string }>(
    "SELECT gmail_id FROM emails_seen WHERE gmail_id = ?",
    [gmailId],
  );
  return row !== null && row !== undefined;
}

export async function getMeta<T>(key: string): Promise<T | undefined> {
  const db = await openLocalDb();
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM meta WHERE key = ?",
    [key],
  );
  if (!row) return undefined;
  try {
    return JSON.parse(row.value) as T;
  } catch {
    return row.value as unknown as T;
  }
}

export async function setMeta<T>(key: string, value: T): Promise<void> {
  const db = await openLocalDb();
  await db.runAsync(
    "INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)",
    [key, JSON.stringify(value)],
  );
}

export async function clearAll(): Promise<void> {
  const db = await openLocalDb();
  await db.execAsync(`
    DELETE FROM tasks;
    DELETE FROM emails_seen;
    DELETE FROM meta;
  `);
}

export async function getTaskCount(): Promise<number> {
  const db = await openLocalDb();
  const row = await db.getFirstAsync<{ n: number }>(
    "SELECT COUNT(*) AS n FROM tasks",
  );
  return row?.n ?? 0;
}
