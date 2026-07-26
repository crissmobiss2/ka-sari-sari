// Offline-first POS — device identity + receipt numbering.
//
// Each register gets a stable device id (generated once, persisted locally).
// Receipts are OR-{series}-{seq}:
//   series — 5 chars derived from the device id → unique per register
//   seq    — a local monotonic counter → gapless per register
// So two devices in the same store never collide, and each device's own
// sequence is unbroken — the shape BIR expects per terminal. For strict
// accreditation this counter can later be seeded from a server-issued range.

import { getMeta, setMeta, nextCounter } from "./offline-db";

const DEVICE_KEY = "deviceId";
const SEQ_KEY = "receiptSeq";

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

// Allocate the next receipt number for this device, e.g. "OR-3F9A2-000042".
export async function nextReceiptNumber(): Promise<string> {
  const deviceId = await getDeviceId();
  const seq = await nextCounter(SEQ_KEY);
  return `OR-${seriesOf(deviceId)}-${String(seq).padStart(6, "0")}`;
}
