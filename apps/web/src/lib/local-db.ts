/**
 * IndexedDB wrapper for the inbox-agent web client.
 *
 * Stores:
 *   - `tasks` — keyed by id, indexed by status / category / createdAt
 *   - `emails_seen` — keyed by gmailId, tracks which Gmail messages we've
 *     already extracted from so we don't double-create tasks on re-poll
 *   - `meta` — generic key/value for things like lastPollAt, syncIntervalMinutes
 *   - `byok_keys` — keyed by provider, AES-GCM ciphertext of the user's
 *     API key (decrypted only at use time via local-byok.ts)
 *
 * No external deps — hand-written wrapper around the browser IndexedDB API.
 *
 * Schema migrations are version-gated. Bump DB_VERSION and add an
 * `onupgradeneeded` branch when you need to add a store.
 */

import type { Task, TaskStatus } from "@inbox/shared";

const DB_NAME = "inbox-agent-v1";
const DB_VERSION = 2;

const STORE_TASKS = "tasks";
const STORE_EMAILS_SEEN = "emails_seen";
const STORE_META = "meta";

/** Object store for encrypted BYOK API keys. Exported because local-byok.ts
 *  needs to reference the same store name as the migration. */
export const STORE_BYOK_KEYS = "byok_keys";

let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Open (or return the already-open handle to) the local IndexedDB.
 * Cached so repeated calls are essentially free. Throws if the browser
 * refuses to open (private-browsing mode on some Safari versions).
 */
export function openLocalDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_TASKS)) {
        const tasks = db.createObjectStore(STORE_TASKS, { keyPath: "id" });
        tasks.createIndex("by_status", "status", { unique: false });
        tasks.createIndex("by_category", "category", { unique: false });
        tasks.createIndex("by_createdAt", "createdAt", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_EMAILS_SEEN)) {
        db.createObjectStore(STORE_EMAILS_SEEN, { keyPath: "gmailId" });
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains(STORE_BYOK_KEYS)) {
        db.createObjectStore(STORE_BYOK_KEYS, { keyPath: "provider" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

/**
 * Internal helper: open a transaction on `store` in the given mode and
 * apply `fn` to the object store. Returns the first request's result.
 * Used to keep the per-store CRUD helpers below short.
 */
function run<T>(
  store: string,
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest | void,
): Promise<T> {
  return openLocalDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(store, mode);
        const s = tx.objectStore(store);
        let result: T | undefined;
        const req = fn(s);
        if (req) req.onsuccess = () => (result = req.result as T);
        tx.oncomplete = () => resolve(result as T);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      }),
  );
}

/**
 * Fetch all tasks, optionally filtered. When both `status` and `category`
 * are passed, the IDB index is used for the more selective key (status)
 * and the secondary filter is applied in JS.
 */
export async function getAllTasks(filter?: {
  status?: TaskStatus;
  category?: string;
}): Promise<Task[]> {
  const db = await openLocalDb();
  return new Promise<Task[]>((resolve, reject) => {
    const tx = db.transaction(STORE_TASKS, "readonly");
    const store = tx.objectStore(STORE_TASKS);
    let req: IDBRequest<Task[]>;
    if (filter?.status) {
      req = store.index("by_status").getAll(IDBKeyRange.only(filter.status));
    } else if (filter?.category) {
      req = store.index("by_category").getAll(IDBKeyRange.only(filter.category));
    } else {
      req = store.getAll() as IDBRequest<Task[]>;
    }
    req.onsuccess = () => {
      let rows = req.result;
      if (filter?.status && filter?.category) {
        rows = rows.filter((t) => t.category === filter.category);
      }
      resolve(rows);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Insert (or replace) a task. Stamps `createdAt` if it isn't already set
 * so the dashboard's "recent activity" sort works.
 *
 * Tasks are keyed by `id`. Re-inserting a task with the same id is the
 * intended way to do a full replacement; use `updateTask` for partials.
 */
export async function addTask(task: Task): Promise<void> {
  const stamped = "createdAt" in task ? task : { ...task, createdAt: Date.now() };
  await run<unknown>(STORE_TASKS, "readwrite", (s) => s.put(stamped));
}

/**
 * Apply a partial patch to an existing task. Rejects if the task id
 * does not exist (caller should pre-check or wrap in try/catch).
 */
export async function updateTask(id: string, patch: Partial<Task>): Promise<void> {
  const db = await openLocalDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_TASKS, "readwrite");
    const store = tx.objectStore(STORE_TASKS);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const existing = getReq.result as Task | undefined;
      if (!existing) {
        reject(new Error(`task ${id} not found`));
        return;
      }
      store.put({ ...existing, ...patch, id });
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Record that we've already extracted from this Gmail message id.
 * Idempotent — calling twice with the same gmailId is a no-op.
 */
export async function markEmailSeen(gmailId: string): Promise<void> {
  await run<unknown>(STORE_EMAILS_SEEN, "readwrite", (s) =>
    s.put({ gmailId, seenAt: Date.now() }),
  );
}

/** Check whether `markEmailSeen` was already called for this gmailId.
 *  poll-gmail uses this to skip messages that already produced tasks. */
export async function isEmailSeen(gmailId: string): Promise<boolean> {
  const row = await run<unknown>(STORE_EMAILS_SEEN, "readonly", (s) => s.get(gmailId));
  return row !== undefined;
}

/**
 * Read a value from the generic meta store. Returns undefined when the
 * key has never been set — callers should treat that as their "default".
 *
 * Common keys:
 *   - lastPollAt: number (epoch ms)
 *   - syncIntervalMinutes: number
 *   - lastPollError: { message, at }
 */
export async function getMeta<T>(key: string): Promise<T | undefined> {
  const row = await run<{ key: string; value: T } | undefined>(
    STORE_META,
    "readonly",
    (s) => s.get(key),
  );
  return row?.value;
}

/** Write a value to the generic meta store. Overwrites any previous value. */
export async function setMeta<T>(key: string, value: T): Promise<void> {
  await run<unknown>(STORE_META, "readwrite", (s) => s.put({ key, value }));
}

/**
 * Wipe tasks, emails_seen, and meta. Used by Settings → "Clear local data".
 * Does NOT clear `byok_keys` (those are the user's API keys; nuking them
 * silently feels wrong — make a separate UI for that).
 */
export async function clearAll(): Promise<void> {
  const db = await openLocalDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(
      [STORE_TASKS, STORE_EMAILS_SEEN, STORE_META],
      "readwrite",
    );
    tx.objectStore(STORE_TASKS).clear();
    tx.objectStore(STORE_EMAILS_SEEN).clear();
    tx.objectStore(STORE_META).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
