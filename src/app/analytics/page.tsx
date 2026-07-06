"use client";
import Link from "next/link";
import { BarChart3, TrendingUp, Package, ShoppingBasket, Zap, RotateCcw, Calendar } from "lucide-react";
import { RetailerTopBar, RetailerBottomNav } from "@/components/layout/retailer-nav";
import { formatPHP } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { MOCK_ORDERS, PRODUCTS, CATEGORIES } from "@/lib/mock-data";

// ── Computed stats from MOCK_ORDERS ──────────────────────────────────────────

const totalSpent = MOCK_ORDERS.reduce((sum, o) => sum + o.total, 0);
const orderCount = MOCK_ORDERS.length;
const avgOrder = Math.round(totalSpent / orderCount);
const srpPremium = 1.216; // Ka Sari-Sari saves ~21.6% vs SRP
const savings = Math.round(totalSpent * (srpPremium - 1) / srpPremium);
const srpTotal = Math.round(totalSpent * srpPremium);
const savingsPct = Math.round((savings / srpTotal) * 100);

// ── Order frequency stats ─────────────────────────────────────────────────────

const sortedOrders = [...MOCK_ORDERS].sort(
  (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
);

const lastOrderDate = sortedOrders[0]?.createdAt
  ? new Date(sortedOrders[0].createdAt)
  : null;

const lastOrderLabel = lastOrderDate
  ? lastOrderDate.toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })
  : "—";

// Average days between orders
let avgDaysBetween = 0;
if (sortedOrders.length >= 2) {
  const oldestDate = new Date(sortedOrders[sortedOrders.length - 1].createdAt);
  const newestDate = new Date(sortedOrders[0].createdAt);
  const totalDays = Math.round(
    (newestDate.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  avgDaysBetween = Math.round(totalDays / (sortedOrders.length - 1));
}

// Orders this month (Jan 2026 is current per app context; data is Jan 2025 — match the year/month of most recent order)
const mostRecentMonth = lastOrderDate ? lastOrderDate.getMonth() : -1;
const mostRecentYear = lastOrderDate ? lastOrderDate.getFullYear() : -1;
const ordersThisMonth = MOCK_ORDERS.filter((o) => {
  const d = new Date(o.createdAt);
  return d.getMonth() === mostRecentMonth && d.getFullYear() === mostRecentYear;
}).length;

// ── Category breakdown from order items ───────────────────────────────────────

// Build productId → categoryId map
const productCategoryMap = new Map<string, string>(
  PRODUCTS.map((p) => [p.id, p.categoryId])
);

// Build categoryId → name map
const categoryNameMap = new Map<string, string>(
  CATEGORIES.map((c) => [c.id, c.name])
);

// Aggregate spending by category
const categoryTotals = new Map<string, number>();
for (const order of MOCK_ORDERS) {
  for (const item of order.items) {
    const catId = productCategoryMap.get(item.productId);
    if (catId) {
      categoryTotals.set(catId, (categoryTotals.get(catId) ?? 0) + item.totalPrice);
    }
  }
}

// Sort by total descending and take top 4
const itemsTotal = Array.from(categoryTotals.values()).reduce((s, v) => s + v, 0);
const TOP_CATEGORIES = Array.from(categoryTotals.entries())
  .sort((a, b) => b[1] - a[1])
  .slice(0, 4)
  .map(([catId, total]) => ({
    name: categoryNameMap.get(catId) ?? catId,
    total,
    pct: itemsTotal > 0 ? Math.round((total / itemsTotal) * 100) : 0,
  }));

// ── Static chart & display data ───────────────────────────────────────────────

const MONTHLY_DATA = [
  { month: "Aug", value: 3200 },
  { month: "Sep", value: 4100 },
  { month: "Oct", value: 3800 },
  { month: "Nov", value: 5200 },
  { month: "Dec", value: 6100 },
  { month: "Jan", value: 4980, current: true },
];

const MAX_VALUE = Math.max(...MONTHLY_DATA.map((d) => d.value));

// ── Computed top products from MOCK_ORDERS ────────────────────────────────────

// Build productId → total quantity ordered
const productQtyMap = new Map<string, number>();
for (const order of MOCK_ORDERS) {
  for (const item of order.items) {
    productQtyMap.set(item.productId, (productQtyMap.get(item.productId) ?? 0) + item.quantity);
  }
}

// Build productId → number of orders it appears in
const productOrderCountMap = new Map<string, number>();
for (const order of MOCK_ORDERS) {
  const seen = new Set<string>();
  for (const item of order.items) {
    if (!seen.has(item.productId)) {
      productOrderCountMap.set(item.productId, (productOrderCountMap.get(item.productId) ?? 0) + 1);
      seen.add(item.productId);
    }
  }
}

// Build productId → Product lookup
const productMap = new Map(PRODUCTS.map((p) => [p.id, p]));

// Sort by total quantity descending, take top 5
const totalOrdersWithItems = MOCK_ORDERS.filter((o) => o.items.length > 0).length;

const TOP_PRODUCTS = Array.from(productQtyMap.entries())
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .map(([productId, totalQty], idx) => {
    const product = productMap.get(productId);
    const ordersAppearingIn = productOrderCountMap.get(productId) ?? 0;
    const pctOfOrders = totalOrdersWithItems > 0
      ? Math.round((ordersAppearingIn / totalOrdersWithItems) * 100)
      : 0;
    return {
      rank: idx + 1,
      name: product?.name ?? productId,
      brand: product?.brand ?? "",
      totalQty,
      pctOfOrders,
    };
  });

// ── Computed restock suggestions ──────────────────────────────────────────────

// Find the most-ordered product categories from MOCK_ORDERS items
const categoryOrderQtyMap = new Map<string, number>();
for (const order of MOCK_ORDERS) {
  for (const item of order.items) {
    const catId = productCategoryMap.get(item.productId);
    if (catId) {
      categoryOrderQtyMap.set(catId, (categoryOrderQtyMap.get(catId) ?? 0) + item.quantity);
    }
  }
}

// Top categories by order volume
const topCategoryIds = Array.from(categoryOrderQtyMap.entries())
  .sort((a, b) => b[1] - a[1])
  .map(([catId]) => catId);

// Products that are low stock, in the most-ordered categories
const lowStockInTopCats = PRODUCTS.filter(
  (p) => p.stock <= p.lowStockThreshold && topCategoryIds.includes(p.categoryId)
).sort((a, b) => {
  // Sort by category rank first, then stock ascending (most urgently low first)
  const catRankA = topCategoryIds.indexOf(a.categoryId);
  const catRankB = topCategoryIds.indexOf(b.categoryId);
  if (catRankA !== catRankB) return catRankA - catRankB;
  return a.stock - b.stock;
});

// If no low-stock products found, fall back to the most-ordered products
const RESTOCK_SUGGESTIONS: Array<{ name: string; brand: string; productId: string; isLowStock: boolean }> =
  lowStockInTopCats.length > 0
    ? lowStockInTopCats.slice(0, 3).map((p) => ({
        name: p.name,
        brand: p.brand ?? "",
        productId: p.id,
        isLowStock: true,
      }))
    : Array.from(productQtyMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([productId]) => {
          const p = productMap.get(productId);
          return {
            name: p?.name ?? productId,
            brand: p?.brand ?? "",
            productId,
            isLowStock: false,
          };
        });

// ── Savings forecast for CTA ──────────────────────────────────────────────────

const savingsForecast = Math.round(totalSpent * (srpPremium - 1));

const RANK_COLORS = [
  "bg-brand-500",
  "bg-brand-400",
  "bg-brand-300",
  "bg-brand-200",
  "bg-brand-100",
];

// Category bar opacity classes — brand-500 at decreasing opacity
const CATEGORY_BAR_CLASSES = [
  "bg-brand-500",
  "bg-brand-500/70",
  "bg-brand-500/50",
  "bg-brand-500/30",
];

// ── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-card px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">{label}</p>
      <p className={cn("font-display text-xl font-black leading-tight", accent ? "text-success-600" : "text-foreground")}>
        {value}
      </p>
      {sub && (
        <p className={cn("text-xs mt-1 flex items-center gap-1", accent ? "text-success-600" : "text-muted-foreground")}>
          {accent && <TrendingUp className="h-3 w-3" />}
          {sub}
        </p>
      )}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <RetailerTopBar title="Analytics" />

      <div className="px-4 py-5 space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-brand-500" />
            My Store Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Track your spending and savings</p>
        </div>

        {/* Key stats — computed from MOCK_ORDERS */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Total Spent" value={formatPHP(totalSpent)} sub="All orders" />
          <StatCard label="Orders" value={orderCount.toString()} sub="Total placed" />
          <StatCard label="Avg. Order" value={formatPHP(avgOrder)} sub="Per order" />
          <StatCard
            label="Savings vs SRP"
            value={formatPHP(savings)}
            sub={`${savingsPct}% saved`}
            accent
          />
        </div>

        {/* Monthly spending bar chart */}
        <div className="rounded-2xl border border-border bg-card shadow-card p-5">
          <h2 className="font-display text-sm font-bold text-foreground mb-4">Monthly Spending</h2>
          <div className="flex items-end gap-2 h-24">
            {MONTHLY_DATA.map((d) => {
              const heightPct = (d.value / MAX_VALUE) * 100;
              return (
                <div key={d.month} className="flex flex-col items-center gap-1.5 flex-1">
                  <div
                    className={cn(
                      "w-full rounded-t-lg transition-all",
                      d.current ? "bg-brand-500" : "bg-brand-200"
                    )}
                    style={{ height: `${heightPct}%` }}
                    title={`${d.month}: ${formatPHP(d.value)}`}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex items-start gap-2 mt-1.5">
            {MONTHLY_DATA.map((d) => (
              <div key={d.month} className="flex-1 text-center">
                <span className={cn("text-[10px] font-medium", d.current ? "text-brand-600 font-bold" : "text-muted-foreground")}>
                  {d.month}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-sm bg-brand-500" />
              <span className="text-[10px] text-muted-foreground">Current month</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-sm bg-brand-200" />
              <span className="text-[10px] text-muted-foreground">Previous months</span>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            Based on order history · Updated monthly
          </p>
        </div>

        {/* Category breakdown */}
        {TOP_CATEGORIES.length > 0 && (
          <div className="rounded-2xl border border-border bg-card shadow-card p-5">
            <h2 className="font-display text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-brand-500" />
              Category Breakdown
            </h2>
            <div className="space-y-3">
              {TOP_CATEGORIES.map((cat, i) => (
                <div key={cat.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-foreground">{cat.name}</span>
                    <span className="text-xs font-bold text-foreground tabular-nums">{formatPHP(cat.total)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2.5 rounded-full bg-surface-100 overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all", CATEGORY_BAR_CLASSES[i])}
                        style={{ width: `${cat.pct}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-muted-foreground tabular-nums w-8 text-right">
                      {cat.pct}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-3 pt-3 border-t border-border">
              Based on itemized orders · Top {TOP_CATEGORIES.length} categories shown
            </p>
          </div>
        )}

        {/* Top products */}
        <div>
          <h2 className="font-display text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <Package className="h-4 w-4 text-brand-500" />
            Your Top Products
          </h2>
          {TOP_PRODUCTS.length > 0 ? (
            <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden divide-y divide-border">
              {TOP_PRODUCTS.map((p) => (
                <div key={p.rank} className="flex items-center gap-0 overflow-hidden">
                  {/* Rank bar */}
                  <div className={cn("w-1.5 self-stretch shrink-0", RANK_COLORS[p.rank - 1])} />
                  <div className="flex items-center gap-3 px-4 py-3.5 flex-1 min-w-0">
                    <span className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-black",
                      p.rank === 1 ? "bg-brand-500 text-white" : "bg-surface-100 text-muted-foreground"
                    )}>
                      {p.rank}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {p.brand && <span className="mr-1">{p.brand} ·</span>}
                        {p.totalQty} units ordered · {p.pctOfOrders}% of orders
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No order item data available yet.</p>
          )}
        </div>

        {/* Order frequency */}
        <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
          <div className="px-5 pt-5 pb-3">
            <h2 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4 text-brand-500" />
              Order Frequency
            </h2>
          </div>
          <div className="divide-y divide-border">
            <div className="flex items-center justify-between px-5 py-3.5">
              <span className="text-sm text-muted-foreground">Avg. days between orders</span>
              <span className="text-sm font-bold text-foreground tabular-nums">
                {avgDaysBetween > 0 ? `${avgDaysBetween} days` : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between px-5 py-3.5">
              <span className="text-sm text-muted-foreground">Last order placed</span>
              <span className="text-sm font-bold text-foreground">{lastOrderLabel}</span>
            </div>
            <div className="flex items-center justify-between px-5 py-3.5">
              <span className="text-sm text-muted-foreground">Orders this month</span>
              <span className="text-sm font-bold text-foreground tabular-nums">
                {ordersThisMonth} order{ordersThisMonth !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Restock suggestions */}
        <div>
          <h2 className="font-display text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-brand-500" />
            Restock Suggestions
          </h2>
          <div className="space-y-3">
            {RESTOCK_SUGGESTIONS.map((s) => (
              <div key={s.productId} className="rounded-2xl border border-border bg-card shadow-card px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {s.brand && <span>{s.brand} · </span>}
                      {s.isLowStock ? "Low on stock — time to reorder" : "Consider stocking more"}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        s.isLowStock
                          ? "bg-warning-50 text-warning-600 border border-warning-200"
                          : "bg-surface-100 text-muted-foreground border border-border"
                      )}>
                        {s.isLowStock ? "Low stock" : "Frequently ordered"}
                      </span>
                    </div>
                  </div>
                  <Link
                    href="/catalog"
                    className="shrink-0 rounded-xl bg-brand-500 px-3 py-2 text-xs font-bold text-white active:scale-95 transition-transform hover:bg-brand-600"
                  >
                    Add to cart
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Savings vs market price */}
        <div className="rounded-2xl border border-border bg-card shadow-card p-5">
          <h2 className="font-display text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <Zap className="h-4 w-4 text-brand-500" />
            Savings vs Market Price
          </h2>

          <div className="space-y-3">
            <div className="flex justify-between text-xs text-muted-foreground font-medium">
              <span>You paid</span>
              <span>Market SRP</span>
            </div>

            {/* Bar comparison */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-20 shrink-0 text-right text-xs font-bold text-brand-500">
                  {formatPHP(totalSpent)}
                </div>
                <div className="flex-1 h-3 rounded-full bg-surface-100 overflow-hidden">
                  <div
                    className="h-full bg-brand-500 rounded-full"
                    style={{ width: `${Math.round((totalSpent / srpTotal) * 100)}%` }}
                  />
                </div>
                <div className="w-8 shrink-0 text-[9px] text-muted-foreground">
                  {Math.round((totalSpent / srpTotal) * 100)}%
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-20 shrink-0 text-right text-xs font-medium text-muted-foreground">
                  {formatPHP(srpTotal)}
                </div>
                <div className="flex-1 h-3 rounded-full bg-surface-100 overflow-hidden">
                  <div className="h-full bg-surface-200 rounded-full" style={{ width: "100%" }} />
                </div>
                <div className="w-8 shrink-0 text-[9px] text-muted-foreground">SRP</div>
              </div>
            </div>

            <div className="mt-3 rounded-xl bg-success-50 border border-success-200 px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-success-700">Total savings this year</p>
                <p className="text-[11px] text-success-600 mt-0.5">Buying through Ka Sari-Sari</p>
              </div>
              <div className="text-right">
                <p className="font-display text-lg font-black text-success-700">{formatPHP(savings)}</p>
                <p className="text-xs text-success-600 font-semibold">{savingsPct}% saved</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-2xl border border-dashed border-brand-300 bg-brand-50/50 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-500">
              <ShoppingBasket className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Keep saving more</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                You&apos;re on track to save <span className="text-brand-600 font-semibold">{formatPHP(savingsForecast)}</span> this year if you keep ordering through Ka Sari-Sari.
              </p>
              <Link href="/catalog" className="mt-2.5 inline-flex items-center gap-1 rounded-xl bg-brand-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-600 transition-colors active:scale-95">
                Browse catalog
              </Link>
            </div>
          </div>
        </div>
      </div>

      <RetailerBottomNav />
    </div>
  );
}
