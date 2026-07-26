// Offline-first POS — local durable storage over IndexedDB.
//
// Three object stores:
//   outbox   — sales queued for sync (survives refresh, crash, power loss)
//   catalog  — cached product list so the register renders with no network
//   meta     — small key/value state (device id, receipt counter)
//
// Deliberately dependency-free (raw IndexedDB) and SSR-safe: every call is a
// no-op that resolves to a sane default when `indexedDB` is unavailable.

export interface SaleLine {
  productId: string;
  name: string;
  price: number;
  qty: number;
}

export interface OutboxTxn {
  clientTxnId: string;      // uuid — primary key AND server idempotency key
  deviceId: string;
  receiptNumber: string;    // OR-{series}-{seq}, assigned locally at sale time
  items: SaleLine[];
  total: number;
  method: string;
  paymentRef?: string;
  posType: string;
  clientCreatedAt: string;  // ISO, device clock
  status: "pending" | "synced" | "failed";
  attempts: number;
  lastError?: string;
  syncedAt?: string;
  failedAt?: string;
}

const DB_NAME = "kss-pos";
const DB_VERSION = 1;
const OUTBOX = "outbox";
const CATALOG = "catalog";
const META = "meta";
const SEQ_KEY = "receiptSeq";

function hasIDB(): boolean {
  return typeof indexedDB !== "undefined";
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(OUTBOX)) {
        const s = db.createObjectStore(OUTBOX, { keyPath: "clientTxnId" });
        s.createIndex("status", "status", { unique: false });
      }
      if (!db.objectStoreNames.contains(CATALOG)) {
        db.createObjectStore(CATALOG, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(META)) {
        db.createObjectStore(META, { keyPath: "k" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx<T>(
  store: string,
  mode: IDBTransactionMode,
  run: (s: IDBObjectStore) => IDBRequest<T> | void
): Promise<T | undefined> {
  return openDb().then(
    (db) =>
      new Promise<T | undefined>((resolve, reject) => {
        const t = db.transaction(store, mode);
        const s = t.objectStore(store);
        let out: T | undefined;
        const r = run(s);
        if (r) r.onsuccess = () => (out = r.result);
        t.oncomplete = () => resolve(out);
        t.onerror = () => reject(t.error);
        t.onabort = () => reject(t.error);
      })
  );
}

// ── Outbox ─────────────────────────────────────────────────────────────────────

// A sale MUST be durably stored before we tell the cashier it succeeded.
// If IndexedDB is missing (some embedded webviews / hardened browsers), throw
// so the caller shows an error instead of a false "Payment received!".
export async function putOutbox(txn: OutboxTxn): Promise<void> {
  if (!hasIDB()) throw new Error("Offline storage unavailable on this device");
  await tx(OUTBOX, "readwrite", (s) => s.put(txn));
}

// Atomically allocate the next receipt number AND persist the sale in a single
// IndexedDB transaction. This guarantees:
//   - no burned receipt numbers (the counter and the sale commit together), and
//   - no silent data loss (throws if storage is unavailable).
// Returns the assigned receipt number (also written onto `txn`).
export function commitSale(txn: OutboxTxn, series: string): Promise<string> {
  if (!hasIDB()) {
    return Promise.reject(new Error("Offline storage unavailable on this device"));
  }
  return openDb().then(
    (db) =>
      new Promise<string>((resolve, reject) => {
        const t = db.transaction([META, OUTBOX], "readwrite");
        const meta = t.objectStore(META);
        const get = meta.get(SEQ_KEY);
        let receiptNumber = txn.receiptNumber;
        get.onsuccess = () => {
          const seq = (((get.result as { v?: number } | undefined)?.v ?? 0) as number) + 1;
          meta.put({ k: SEQ_KEY, v: seq });
          receiptNumber = `OR-${series}-${String(seq).padStart(6, "0")}`;
          txn.receiptNumber = receiptNumber;
          t.objectStore(OUTBOX).put(txn);
        };
        t.oncomplete = () => resolve(receiptNumber);
        t.onerror = () => reject(t.error);
        t.onabort = () => reject(t.error);
      })
  );
}

export async function pendingOutbox(): Promise<OutboxTxn[]> {
  if (!hasIDB()) return [];
  const all = (await tx<OutboxTxn[]>(OUTBOX, "readonly", (s) => s.getAll())) ?? [];
  return all
    .filter((t) => t.status === "pending")
    .sort((a, b) => a.clientCreatedAt.localeCompare(b.clientCreatedAt));
}

export async function pendingCount(): Promise<number> {
  return (await pendingOutbox()).length;
}

export async function failedCount(): Promise<number> {
  if (!hasIDB()) return 0;
  const all = (await tx<OutboxTxn[]>(OUTBOX, "readonly", (s) => s.getAll())) ?? [];
  return all.filter((t) => t.status === "failed").length;
}

// Quarantine a transaction the server will never accept (permanent 4xx, or too
// many failed attempts) so it stops blocking the rest of the outbox.
export async function markFailed(clientTxnId: string, err: string): Promise<void> {
  if (!hasIDB()) return;
  await tx(OUTBOX, "readwrite", (s) => {
    const get = s.get(clientTxnId);
    get.onsuccess = () => {
      const row = get.result as OutboxTxn | undefined;
      if (!row) return;
      row.status = "failed";
      row.failedAt = new Date().toISOString();
      row.lastError = err;
      s.put(row);
    };
  });
}

export async function markSynced(clientTxnId: string): Promise<void> {
  if (!hasIDB()) return;
  await tx(OUTBOX, "readwrite", (s) => {
    const get = s.get(clientTxnId);
    get.onsuccess = () => {
      const row = get.result as OutboxTxn | undefined;
      if (!row) return;
      row.status = "synced";
      row.syncedAt = new Date().toISOString();
      s.put(row);
    };
  });
}

export async function bumpAttempt(clientTxnId: string, err: string): Promise<void> {
  if (!hasIDB()) return;
  await tx(OUTBOX, "readwrite", (s) => {
    const get = s.get(clientTxnId);
    get.onsuccess = () => {
      const row = get.result as OutboxTxn | undefined;
      if (!row) return;
      row.attempts = (row.attempts ?? 0) + 1;
      row.lastError = err;
      s.put(row);
    };
  });
}

// Drop synced rows older than `keepMs` (default 7 days) to bound local storage.
export async function pruneSynced(keepMs = 7 * 24 * 60 * 60 * 1000): Promise<void> {
  if (!hasIDB()) return;
  const cutoff = Date.now() - keepMs;
  const all = (await tx<OutboxTxn[]>(OUTBOX, "readonly", (s) => s.getAll())) ?? [];
  await Promise.all(
    all
      .filter((t) => t.status === "synced" && t.syncedAt && Date.parse(t.syncedAt) < cutoff)
      .map((t) => tx(OUTBOX, "readwrite", (s) => s.delete(t.clientTxnId)))
  );
}

// ── Catalog cache ────────────────────────────────────────────────────────────────

export async function cacheCatalog<T extends { id: string }>(products: T[]): Promise<void> {
  if (!hasIDB() || !products.length) return;
  await tx(CATALOG, "readwrite", (s) => {
    s.clear();
    products.forEach((p) => s.put(p));
  });
}

export async function readCatalog<T = unknown>(): Promise<T[]> {
  if (!hasIDB()) return [];
  return ((await tx<T[]>(CATALOG, "readonly", (s) => s.getAll())) ?? []) as T[];
}

// ── Meta (device id, receipt counter) ────────────────────────────────────────────

export async function getMeta<T = string>(k: string): Promise<T | undefined> {
  if (!hasIDB()) return undefined;
  const row = await tx<{ k: string; v: T }>(META, "readonly", (s) => s.get(k));
  return row?.v;
}

export async function setMeta<T = string>(k: string, v: T): Promise<void> {
  if (!hasIDB()) return;
  await tx(META, "readwrite", (s) => s.put({ k, v }));
}

// Atomic increment of a numeric meta counter (get + put in one transaction),
// so a rapid double-tap can never mint the same receipt sequence twice.
export function nextCounter(k: string): Promise<number> {
  if (!hasIDB()) return Promise.resolve(1);
  return openDb().then(
    (db) =>
      new Promise<number>((resolve, reject) => {
        const t = db.transaction(META, "readwrite");
        const s = t.objectStore(META);
        const get = s.get(k);
        let next = 1;
        get.onsuccess = () => {
          next = (((get.result as { v?: number } | undefined)?.v ?? 0) as number) + 1;
          s.put({ k, v: next });
        };
        t.oncomplete = () => resolve(next);
        t.onerror = () => reject(t.error);
        t.onabort = () => reject(t.error);
      })
  );
}
