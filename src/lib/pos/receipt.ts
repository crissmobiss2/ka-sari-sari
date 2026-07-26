// Offline-first POS — device identity + receipt series.
//
// Each register gets a stable device id (generated once, persisted locally).
// Receipts are OR-{series}-{seq}; the seq is allocated atomically at sale time
// by commitSale() in offline-db, and the series is derived from the device id.
//
// CAVEAT — this is PRACTICAL, not cryptographic, uniqueness. Registers imaged
// from a clone AFTER first use share a device id (hence a series), and a 5-char
// series can birthday-collide across a large fleet. Global, BIR-grade receipt
// uniqueness requires server-issued receipt ranges — a documented follow-up.
// A collision does NOT block a sale: receipt_number is not the idempotency key
// (client_txn_id is), and the server tolerates duplicate receipt numbers.

import { getMeta, setMeta } from "./offline-db";

const DEVICE_KEY = "deviceId";

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers / insecure contexts.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

let cachedDeviceId: string | null = null;

export async function getDeviceId(): Promise<string> {
  if (cachedDeviceId) return cachedDeviceId;
  let id = await getMeta<string>(DEVICE_KEY);
  if (!id) {
    id = uuid();
    await setMeta(DEVICE_KEY, id);
  }
  cachedDeviceId = id;
  return id;
}

// 5-char uppercase series derived from the device id — stable for the device.
export function seriesOf(deviceId: string): string {
  return deviceId.replace(/[^a-zA-Z0-9]/g, "").slice(-5).toUpperCase();
}
