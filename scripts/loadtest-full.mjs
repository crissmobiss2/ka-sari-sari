#!/usr/bin/env node
/**
 * Full-system load test for Ka Sari-Sari.
 *
 * Simulates many store owners concurrently placing varied orders, then drives
 * every order through the warehouse/admin -> driver pipeline, measuring
 * throughput, error rate, and latency percentiles for each phase.
 *
 * DEMO-MODE CAVEAT: with no Supabase configured the server uses a single-process
 * in-memory store, so this measures ONE instance's request handling + the code's
 * behaviour under concurrency (races, error handling, rough throughput). It is
 * NOT production capacity (Vercel serverless auto-scales; Supabase is the real
 * DB) — load-test the real stack separately once Supabase is connected.
 *
 * Usage:
 *   BASE_URL=http://localhost:3900 STORES=100 ORDERS_PER_STORE=3 \
 *   PIPELINE=1 CONCURRENCY=40 node scripts/loadtest-full.mjs
 */

const BASE = (process.env.BASE_URL || "http://localhost:3900").replace(/\/$/, "");
const STORES = Number(process.env.STORES || 100);
const ORDERS_PER_STORE = Number(process.env.ORDERS_PER_STORE || 3);
const CONCURRENCY = Number(process.env.CONCURRENCY || 40);
const RUN_PIPELINE = process.env.PIPELINE !== "0";

const PRODUCTS = ["p-001","p-002","p-003","p-004","p-005","p-006","p-007","p-008"];
const PAYMENTS = ["cod","gcash","maya"];
const CITIES = ["Caloocan","Quezon City","Manila","Pasig","Marikina","Antipolo"];

const metrics = {};
function m(phase) {
  return (metrics[phase] ||= { n: 0, ok: 0, fail: 0, status: {}, lat: [], err: {} });
}
function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
function rint(lo, hi) { return lo + Math.floor(Math.random() * (hi - lo + 1)); }

async function call(phase, method, path, body, cookie) {
  const rec = m(phase);
  rec.n++;
  const t0 = performance.now();
  try {
    const res = await fetch(BASE + path, {
      method,
      headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    rec.lat.push(performance.now() - t0);
    rec.status[res.status] = (rec.status[res.status] || 0) + 1;
    if (res.ok) rec.ok++; else rec.fail++;
    const setCookie = res.headers.get("set-cookie");
    const ck = setCookie ? setCookie.split(";")[0] : undefined;
    const json = await res.json().catch(() => ({}));
    return { status: res.status, ok: res.ok, json, cookie: ck };
  } catch (e) {
    rec.fail++;
    rec.err[e.message] = (rec.err[e.message] || 0) + 1;
    return { status: 0, ok: false, json: {}, error: e.message };
  }
}

// Bounded-concurrency map.
async function pool(items, worker) {
  const q = items.slice();
  const out = [];
  async function run() {
    while (q.length) {
      const item = q.shift();
      out.push(await worker(item));
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, run));
  return out;
}

function pct(arr, p) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))];
}
function report(phase, wallSecs) {
  const r = m(phase);
  const rate = r.n / wallSecs;
  console.log(`\n── ${phase} ──`);
  console.log(`  requests=${r.n}  ok=${r.ok}  fail=${r.fail}  in ${wallSecs.toFixed(1)}s  → ${rate.toFixed(0)} req/s`);
  console.log(`  latency ms: p50=${pct(r.lat,50).toFixed(0)}  p95=${pct(r.lat,95).toFixed(0)}  p99=${pct(r.lat,99).toFixed(0)}  max=${Math.max(0,...r.lat).toFixed(0)}`);
  console.log(`  status: ${JSON.stringify(r.status)}`);
  if (Object.keys(r.err).length) console.log(`  errors: ${JSON.stringify(r.err)}`);
}

async function main() {
  console.log(`Load test → ${BASE}`);
  console.log(`stores=${STORES}  orders/store=${ORDERS_PER_STORE}  concurrency=${CONCURRENCY}  pipeline=${RUN_PIPELINE}\n`);

  // ── Phase 1: register store owners ──────────────────────────────────────────
  let t = performance.now();
  const stores = await pool(
    Array.from({ length: STORES }, (_, i) => i),
    async (i) => {
      const phone = "09" + String(300000000 + i); // unique 11-digit
      const res = await call("1_register", "POST", "/api/auth/register", {
        phone, password: "load1234", name: `Store ${i}`, storeName: `Sari ${i}`, address: `${pick(CITIES)}`,
      });
      return res.cookie ? { i, phone, cookie: res.cookie } : null;
    }
  );
  report("1_register", (performance.now() - t) / 1000);
  const active = stores.filter(Boolean);
  // Registration is rate-limited per IP (by design). Add the seeded retailer so
  // we always have enough sessions to drive real order-throughput load.
  const seeded = await call("_auth", "POST", "/api/auth/login", { phone: "09181234567", password: "demo1234" });
  if (seeded.cookie) active.push({ i: -1, phone: "09181234567", cookie: seeded.cookie });
  console.log(`  → ${stores.filter(Boolean).length}/${STORES} new stores + ${seeded.cookie ? 1 : 0} seeded = ${active.length} sessions`);

  // ── Phase 2: each store places varied orders ────────────────────────────────
  t = performance.now();
  const TOTAL_ORDERS = Number(process.env.TOTAL_ORDERS || active.length * ORDERS_PER_STORE);
  const jobs = Array.from({ length: TOTAL_ORDERS }, (_, i) => active[i % active.length]);
  const orders = await pool(jobs, async (s) => {
    const itemCount = rint(1, 4);
    const items = Array.from({ length: itemCount }, () => {
      const qty = rint(1, 5);
      const unitPrice = rint(8, 120);
      // Match the real checkout contract: { productId, name, unitPrice, quantity }.
      return { productId: pick(PRODUCTS), name: "Item", quantity: qty, unitPrice };
    });
    const subtotal = items.reduce((a, it) => a + it.unitPrice * it.quantity, 0);
    const total = subtotal;
    const res = await call("2_orders", "POST", "/api/orders",
      { items, subtotal, total, deliveryFee: 0, paymentMethod: pick(PAYMENTS), deliveryAddress: `${rint(1,999)} St, ${pick(CITIES)}` },
      s.cookie);
    return res.json?.order?.id ?? null;
  });
  report("2_orders", (performance.now() - t) / 1000);
  const orderIds = orders.filter(Boolean);
  console.log(`  → ${orderIds.length} orders created`);

  if (!RUN_PIPELINE) return summary();

  // ── Phase 3: admin drives the pipeline; drivers deliver ─────────────────────
  const admin = (await call("_auth", "POST", "/api/auth/login", { phone: "09171234567", password: "admin" })).cookie;
  const driver = (await call("_auth", "POST", "/api/auth/login", { phone: "09173456789", password: "driver" })).cookie;
  const drivers = (await call("_auth", "GET", "/api/admin/drivers", null, admin)).json?.drivers ?? [];
  const driverId = drivers[0]?.id;

  t = performance.now();
  await pool(orderIds, async (id) => {
    await call("3_pipeline", "PATCH", `/api/admin/orders/${id}`, { status: "picking" }, admin);
    await call("3_pipeline", "PATCH", `/api/admin/orders/${id}`, { status: "packed" }, admin);
    await call("3_pipeline", "PATCH", `/api/admin/orders/${id}`, { action: "assign_driver", driverId }, admin);
    await call("3_pipeline", "PATCH", "/api/driver/deliveries", { orderId: id, status: "out_for_delivery" }, driver);
    await call("3_pipeline", "PATCH", "/api/driver/deliveries", { orderId: id, status: "delivered" }, driver);
  });
  report("3_pipeline", (performance.now() - t) / 1000);

  // ── Verify final state ──────────────────────────────────────────────────────
  const delivered = (await call("_verify", "GET", "/api/orders?status=delivered", null, admin)).json;
  const allOrders = (await call("_verify", "GET", "/api/orders", null, admin)).json?.orders ?? [];
  const deliveredCount = allOrders.filter((o) => o.status === "delivered").length;
  console.log(`\n── Verification ──`);
  console.log(`  orders in system: ${allOrders.length}  |  delivered: ${deliveredCount}`);

  summary();
}

function summary() {
  const total = Object.values(metrics).reduce((a, r) => a + r.n, 0);
  const ok = Object.values(metrics).reduce((a, r) => a + r.ok, 0);
  const fail = Object.values(metrics).reduce((a, r) => a + r.fail, 0);
  console.log(`\n════ TOTAL: ${total} requests, ${ok} ok, ${fail} failed (${((fail / total) * 100).toFixed(2)}% error) ════`);
}

main().catch((e) => { console.error(e); process.exit(1); });
