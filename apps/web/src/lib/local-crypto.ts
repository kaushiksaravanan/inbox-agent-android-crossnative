// Client-side AES-GCM crypto backed by an install-scoped key in IndexedDB.
// No external deps — Web Crypto only.

const DB_NAME = "inbox.crypto";
const STORE_NAME = "keys";
const KEY_NAME = "installKey";
const IV_BYTES = 12;

function openCryptoDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function txGet<T>(db: IDBDatabase, key: string): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

function txPut(db: IDBDatabase, key: string, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

let cachedKey: CryptoKey | null = null;

export async function getOrCreateInstallKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;
  const db = await openCryptoDb();
  try {
    let key = await txGet<CryptoKey>(db, KEY_NAME);
    if (!key) {
      key = await window.crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        false, // non-extractable — never leaves the browser
        ["encrypt", "decrypt"],
      );
      await txPut(db, KEY_NAME, key);
    }
    cachedKey = key;
    return key;
  } finally {
    db.close();
  }
}

function b64encode(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function b64decode(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function encrypt(plaintext: string): Promise<string> {
  const key = await getOrCreateInstallKey();
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const ct = new Uint8Array(
    await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      new TextEncoder().encode(plaintext),
    ),
  );
  const combined = new Uint8Array(iv.length + ct.length);
  combined.set(iv, 0);
  combined.set(ct, iv.length);
  return b64encode(combined);
}

export async function decrypt(payload: string): Promise<string> {
  const key = await getOrCreateInstallKey();
  const combined = b64decode(payload);
  if (combined.length <= IV_BYTES) throw new Error("ciphertext too short");
  const iv = combined.slice(0, IV_BYTES);
  const ct = combined.slice(IV_BYTES);
  const pt = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return new TextDecoder().decode(pt);
}

// ---------------------------------------------------------------------------
// JSON helpers — serialize/deserialize structured data as encrypted blobs.
// EncryptedBlob is a typed wrapper around the base64 ciphertext so callers
// can persist it as JSON without confusing it with arbitrary strings.
// ---------------------------------------------------------------------------

export interface EncryptedBlob {
  v: 1;
  ct: string; // base64-encoded iv || ciphertext
}

export async function encryptJson<T>(value: T): Promise<EncryptedBlob> {
  const ct = await encrypt(JSON.stringify(value));
  return { v: 1, ct };
}

export async function decryptJson<T>(blob: EncryptedBlob): Promise<T> {
  if (!blob || blob.v !== 1 || typeof blob.ct !== "string") {
    throw new Error("invalid encrypted blob");
  }
  const text = await decrypt(blob.ct);
  return JSON.parse(text) as T;
}
