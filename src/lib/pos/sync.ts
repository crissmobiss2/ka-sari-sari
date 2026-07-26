// Offline-first POS — the sync engine.
//
// Drains the local outbox to the server whenever we're online. Triggered from
// several places so a queued sale is never stranded: on reconnect, when the app
// regains focus, on a periodic timer, and (via the service worker) even when the
// app was closed. Every POST is idempotent server-side, so retries are safe.

import {
  pendingOutbox,
  markSynced,
  bumpAttempt,
  pendingCount,
  pruneSynced,
  type OutboxTxn,
} from "./offline-db";

const ENDPOINT = "/api/pos/transaction";
const CHANGE_EVENT = "pos-sync-change";
const INTERVAL_MS = 30_000;

let flushing = false;

// Broadcast the current pending count so any UI (the header badge) can react.
export async function emitPending(): Promise<void> {
  if (typeof window === "undefined") return;
  const pending = await pendingCount();
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { pending } }));
}

export async function flush(): Promise<void> {
  if (flushing) return;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return;
  flushing = true;
  try {
    const pending = await pendingOutbox();
    for (const txn of pending) {
      try {
        const res = await fetch(ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload(txn)),
        });
        if (res.ok) {
          await markSynced(txn.clientTxnId);
          await emitPending();
        } else if (res.status === 401) {
          // Not signed in / session expired — stop; retry after re-auth.
          await bumpAttempt(txn.clientTxnId, "HTTP 401");
          break;
        } else {
          await bumpAttempt(txn.clientTxnId, `HTTP ${res.status}`);
          break; // back off; the timer/online triggers will retry
        }
      } catch (e) {
        await bumpAttempt(txn.clientTxnId, e instanceof Error ? e.message : "network");
        break; // offline again — stop and wait for the next trigger
      }
    }
  } finally {
    flushing = false;
    void pruneSynced();
  }
}

function payload(txn: OutboxTxn) {
  return {
    clientTxnId: txn.clientTxnId,
    deviceId: txn.deviceId,
    receiptNumber: txn.receiptNumber,
    items: txn.items,
    total: txn.total,
    method: txn.method,
    paymentRef: txn.paymentRef,
    posType: txn.posType,
    clientCreatedAt: txn.clientCreatedAt,
  };
}

// Ask the service worker to flush us later, even if the app is closed.
// Chromium-only (great on Android); a no-op elsewhere, where the foreground
// triggers below cover the gap.
export async function registerBackgroundSync(): Promise<void> {
  try {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    const reg = await navigator.serviceWorker.ready;
    // @ts-expect-error — SyncManager isn't in the DOM lib types
    if (reg.sync) await reg.sync.register("pos-outbox");
  } catch {
    /* background sync unavailable — foreground triggers handle it */
  }
}

// Wire up all triggers. Returns a cleanup function. Safe to call once per mount.
export function initSync(onChange?: (pending: number) => void): () => void {
  if (typeof window === "undefined") return () => {};

  const changeHandler = (e: Event) => {
    const pending = (e as CustomEvent<{ pending: number }>).detail?.pending ?? 0;
    onChange?.(pending);
  };
  const onlineHandler = () => void flush();
  const visibilityHandler = () => {
    if (!document.hidden) void flush();
  };
  const swMessageHandler = (e: MessageEvent) => {
    if (e.data?.type === "flush-outbox") void flush();
  };

  window.addEventListener(CHANGE_EVENT, changeHandler);
  window.addEventListener("online", onlineHandler);
  document.addEventListener("visibilitychange", visibilityHandler);
  navigator.serviceWorker?.addEventListener("message", swMessageHandler);
  const timer = window.setInterval(() => void flush(), INTERVAL_MS);

  // Initial reconcile + drain.
  void emitPending();
  void flush();

  return () => {
    window.removeEventListener(CHANGE_EVENT, changeHandler);
    window.removeEventListener("online", onlineHandler);
    document.removeEventListener("visibilitychange", visibilityHandler);
    navigator.serviceWorker?.removeEventListener("message", swMessageHandler);
    window.clearInterval(timer);
  };
}
