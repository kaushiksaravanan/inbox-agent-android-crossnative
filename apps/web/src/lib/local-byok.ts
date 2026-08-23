// Local-only BYOK key vault.
// Replaces the old server BYOK route. User API keys are encrypted with the install key
// (managed by local-crypto) and stored in IndexedDB. Plaintext keys never
// leave the browser and are never sent to a server.

import { decryptJson, encryptJson, type EncryptedBlob } from "./local-crypto";
import { openLocalDb, STORE_BYOK_KEYS, getMeta, setMeta } from "./local-db";

export type Provider = "gemini" | "openai" | "anthropic" | "groq";

export type ByokKey = {
  provider: Provider;
  label?: string;
  createdAt: number;
  lastUsedAt?: number;
};

// Row shape persisted in IndexedDB. The plaintext API key lives only inside
// `secret` as an encrypted blob; metadata fields are stored alongside in the
// clear so listByokKeys() can return them without touching crypto.
type ByokRow = ByokKey & {
  secret: EncryptedBlob;
};

const USE_BYOK_META_KEY = "useByok";

function rowToMeta(row: ByokRow): ByokKey {
  return {
    provider: row.provider,
    label: row.label,
    createdAt: row.createdAt,
    lastUsedAt: row.lastUsedAt,
  };
}

async function getRow(provider: Provider): Promise<ByokRow | undefined> {
  const db = await openLocalDb();
  return new Promise<ByokRow | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE_BYOK_KEYS, "readonly");
    const req = tx.objectStore(STORE_BYOK_KEYS).get(provider);
    req.onsuccess = () => resolve(req.result as ByokRow | undefined);
    req.onerror = () => reject(req.error);
  });
}

async function putRow(row: ByokRow): Promise<void> {
  const db = await openLocalDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_BYOK_KEYS, "readwrite");
    tx.objectStore(STORE_BYOK_KEYS).put(row);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function listByokKeys(): Promise<ByokKey[]> {
  const db = await openLocalDb();
  return new Promise<ByokKey[]>((resolve, reject) => {
    const tx = db.transaction(STORE_BYOK_KEYS, "readonly");
    const req = tx.objectStore(STORE_BYOK_KEYS).getAll();
    req.onsuccess = () => {
      const rows = (req.result as ByokRow[]) ?? [];
      resolve(rows.map(rowToMeta));
    };
    req.onerror = () => reject(req.error);
  });
}

export async function saveByokKey(
  provider: Provider,
  key: string,
  label?: string,
): Promise<void> {
  if (!key) throw new Error("saveByokKey: key is required");
  const existing = await getRow(provider);
  const secret = await encryptJson<string>(key);
  const row: ByokRow = {
    provider,
    label: label ?? existing?.label,
    createdAt: existing?.createdAt ?? Date.now(),
    lastUsedAt: existing?.lastUsedAt,
    secret,
  };
  await putRow(row);
}

export async function getByokKey(provider: Provider): Promise<string | null> {
  const row = await getRow(provider);
  if (!row) return null;
  const plaintext = await decryptJson<string>(row.secret);
  // Touch lastUsedAt — fire-and-forget shape, but we await the put so a
  // subsequent listByokKeys() reflects the update deterministically.
  await putRow({ ...row, lastUsedAt: Date.now() });
  return plaintext;
}

export async function deleteByokKey(provider: Provider): Promise<void> {
  const db = await openLocalDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_BYOK_KEYS, "readwrite");
    tx.objectStore(STORE_BYOK_KEYS).delete(provider);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function setUseByok(enabled: boolean): Promise<void> {
  await setMeta<boolean>(USE_BYOK_META_KEY, enabled);
}

export async function getUseByok(): Promise<boolean> {
  const v = await getMeta<boolean>(USE_BYOK_META_KEY);
  return v === true;
}
