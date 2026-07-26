#!/usr/bin/env node
/**
 * POS load & idempotency test for Ka Sari-Sari.
 *
 * Fires N synthetic POS transactions at /api/pos/transaction to confirm the
 * backend handles the target volume, then RE-SENDS a batch with the same
 * clientTxnIds to prove the idempotent RPC never double-records or
 * double-decrements stock.
 *
 * Because the endpoint requires a retailer/admin session, pass a valid session
 * cookie. Grab it from your browser dev tools (Application → Cookies → ks-session)
 * after logging in.
 *
 * Usage:
 *   BASE_URL=https://ka-sari-sari.vercel.app \
 *   COOKIE="ks-session=eyJ...." \
 *   COUNT=5000 CONCURRENCY=25 \
 *   node scripts/pos-loadtest.mjs
 *
 * Notes:
 *   - In demo mode (no Supabase configured) the endpoint echoes success without
 *     persisting, so this measures the request path, not the DB.
 *   - With Supabase configured it exercises the full record_pos_sale() path,
 *     including the atomic stock decrement.
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const COOKIE = process.env.COOKIE || "";
const COUNT = Number(process.env.COUNT || 1000);
const CONCURRENCY = Number(process.env.CONCURRENCY || 20);
const ENDPOINT = `${BASE_URL.replace(/\/$/, "")}/api/pos/transaction`;

const SAMPLE_PRODUCTS = [
  { productId: "p-001", name: "Kopiko Brown", price: 8, qty: 2 },
  { productId: "p-002", name: "Lucky Me Pancit Canton", price: 15, qty: 1 },
  { productId: "p-003", name: "Piattos", price: 22, qty: 3 },
];

function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function makeTxn(i) {
  const items = SAMPLE_PRODUCTS.slice(0, 1 + (i % SAMPLE_PRODUCTS.length));
  const total = items.reduce((s, it) => s + it.price * it.qty, 0);
  return {
    clientTxnId: uuid(),
    deviceId: "loadtest-device",
    receiptNumber: `OR-LTEST-${String(i).padStart(6, "0")}`,
    items,
    total,
    method: "cash",
    posType: "retailer",
    clientCreatedAt: new Date().toISOString(),
  };
}

async function post(txn) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: COOKIE },
    body: JSON.stringify(txn),
  });
  return res.status;
}

async function runPool(txns, label) {
  const results = { ok: 0, fail: 0, statuses: {} };
  let idx = 0;
  const t0 = Date.now();
  async function worker() {
    while (idx < txns.length) {
      const txn = txns[idx++];
      try {
        const status = await post(txn);
        results.statuses[status] = (results.statuses[status] || 0) + 1;
        if (status >= 200 && status < 300) results.ok++;
        else results.fail++;
      } catch {
        results.fail++;
        results.statuses.network = (results.statuses.network || 0) + 1;
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  const secs = (Date.now() - t0) / 1000;
  console.log(
    `\n${label}: ${txns.length} reqs in ${secs.toFixed(1)}s ` +
      `→ ${(txns.length / secs).toFixed(0)} req/s | ok=${results.ok} fail=${results.fail}`
  );
  console.log("  status codes:", results.statuses);
  return results;
}

async function main() {
  if (!COOKIE) {
    console.error("ERROR: set COOKIE='ks-session=...' (a logged-in retailer/admin session).");
    process.exit(1);
  }
  console.log(`Target: ${ENDPOINT}`);
  console.log(`Plan:   ${COUNT} unique sales @ concurrency ${CONCURRENCY}, then re-send 200 to test idempotency.`);

  const txns = Array.from({ length: COUNT }, (_, i) => makeTxn(i));
  await runPool(txns, "PASS 1 — unique sales");

  // Idempotency: replay the first 200 with identical clientTxnIds.
  const replay = txns.slice(0, Math.min(200, txns.length));
  await runPool(replay, "PASS 2 — replay (idempotency)");

  console.log(
    "\nIdempotency check: with Supabase configured, PASS 2 must NOT create new rows " +
      "or change stock. Verify in SQL:\n" +
      "  SELECT count(*) FROM pos_transactions WHERE device_id = 'loadtest-device';\n" +
      `  -- expected: ${COUNT} (not ${COUNT + replay.length})`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
