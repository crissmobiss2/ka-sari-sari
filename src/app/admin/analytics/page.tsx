"use client";

import { useMemo } from "react";
import { TrendingUp, Users, ShoppingCart, Package, Download, FileDown, ArrowUpRight, ArrowDownRight, Zap, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPHP, cn } from "@/lib/utils";
import { toastSuccess, toastInfo } from "@/store/toast";
import {
  MOCK_ORDERS,
  PRODUCTS,
  CATEGORIES as PRODUCT_CATEGORIES,
  ADMIN_STATS,
} from "@/lib/mock-data";

// ── Constants ─────────────────────────────────────────────────────────────────

const BRAND_COLOR = "#f47028";

// ── Static chart data (monthly revenue trend — platform-level) ───────────────

const MONTHLY_REVENUE = [890_000, 1_020_000, 1_150_000, 1_340_000, 1_480_000, 1_250_000];
const MONTHS = ["Aug '25", "Sep '25", "Oct '25", "Nov '25", "Dec '25", "Jan '26"];
const maxRevenue = Math.max(...MONTHLY_REVENUE);

// ── Retailer names (synthetic — keyed to storeId from ADMIN_RECENT_ORDERS) ───

const RETAILER_NAMES: Record<string, string> = {
  "s1": "Aling Nena's Store",
  "s2": "Mang Tony Sari-Sari",
  "s3": "JB General Merchandise",
  "s4": "Rose Convenience Store",
  "s5": "Dela Cruz Store",
  "store-1": "Aling Nena's Store",
};

// ── Payment methods static split (from ADMIN_STATS scale) ────────────────────

const PAYMENT_METHODS = [
  { name: "GCash",  pct: 58, barColor: "bg-blue-500" },
  { name: "COD",    pct: 27, barColor: "bg-brand-50 dark:bg-brand-500/100" },
  { name: "Maya",   pct: 15, barColor: "bg-emerald-500" },
];

// ── CSV / PDF export ─────────────────────────────────────────────────────────

function downloadCSV(monthlyRevenue: number[], months: string[]) {
  const rows = [
    ["Month", "Revenue (PHP)", "Orders", "Avg Order (PHP)"],
    ...monthlyRevenue.map((rev, i) => [
      months[i],
      rev.toString(),
      Math.round(rev / 3_200).toString(),
      "3200",
    ]),
  ];
  const csv = rows.map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ka-sari-sari-analytics.csv";
  a.click();
  URL.revokeObjectURL(url);
  toastSuccess("Analytics exported as CSV");
}

function downloadPDF() {
  toastInfo("Opening print dialog for PDF...");
  window.print();
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatMillions(n: number) {
  if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `₱${(n / 1_000).toFixed(0)}k`;
  return `₱${n}`;
}

// ── SVG Bar Chart ─────────────────────────────────────────────────────────────

const CHART_W = 600;
const CHART_H = 200;
const CHART_PADDING = { top: 28, right: 10, bottom: 36, left: 10 };
const BAR_GAP = 12;
const GRID_LINES = 4;

function RevenueSvgChart() {
  const innerW = CHART_W - CHART_PADDING.left - CHART_PADDING.right;
  const innerH = CHART_H - CHART_PADDING.top - CHART_PADDING.bottom;
  const totalBars = MONTHLY_REVENUE.length;
  const barW = (innerW - BAR_GAP * (totalBars - 1)) / totalBars;

  return (
    <svg
      viewBox={`0 0 ${CHART_W} ${CHART_H}`}
      width="100%"
      preserveAspectRatio="xMidYMid meet"
      aria-label="Revenue trend bar chart"
    >
      {/* Grid lines */}
      {Array.from({ length: GRID_LINES + 1 }).map((_, i) => {
        const y = CHART_PADDING.top + (innerH / GRID_LINES) * i;
        return (
          <line
            key={i}
            x1={CHART_PADDING.left}
            x2={CHART_W - CHART_PADDING.right}
            y1={y}
            y2={y}
            stroke="#e5e7eb"
            strokeWidth={1}
            strokeDasharray={i === 0 ? "0" : "4 3"}
          />
        );
      })}

      {/* Bars */}
      {MONTHLY_REVENUE.map((val, i) => {
        const barH = (val / maxRevenue) * innerH;
        const x = CHART_PADDING.left + i * (barW + BAR_GAP);
        const y = CHART_PADDING.top + innerH - barH;
        const label = formatMillions(val);
        const midX = x + barW / 2;

        return (
          <g key={i}>
            <path
              d={`
                M ${x + 4} ${y}
                Q ${x} ${y} ${x} ${y + 4}
                L ${x} ${y + barH}
                L ${x + barW} ${y + barH}
                L ${x + barW} ${y + 4}
                Q ${x + barW} ${y} ${x + barW - 4} ${y}
                Z
              `}
              fill={BRAND_COLOR}
              opacity={i === MONTHLY_REVENUE.length - 1 ? 0.65 : 1}
            />
            <text
              x={midX}
              y={y - 6}
              textAnchor="middle"
              fontSize={9.5}
              fontWeight="600"
              fill="#374151"
            >
              {label}
            </text>
            <text
              x={midX}
              y={CHART_H - CHART_PADDING.bottom + 14}
              textAnchor="middle"
              fontSize={9}
              fill="#6b7280"
            >
              {MONTHS[i]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminAnalyticsPage() {

  // ── Build product lookup map ───────────────────────────────────────────────
  const productMap = useMemo(
    () => new Map(PRODUCTS.map((p) => [p.id, p])),
    []
  );

  // ── Build category lookup map ──────────────────────────────────────────────
  const categoryMap = useMemo(
    () => new Map(PRODUCT_CATEGORIES.map((c) => [c.id, c])),
    []
  );

  // ── Top products by revenue (from MOCK_ORDERS items × product prices) ─────
  const topProducts = useMemo(() => {
    const revenueByProduct = new Map<string, { name: string; revenue: number; qty: number; categoryId: string }>();

    for (const order of MOCK_ORDERS) {
      for (const item of order.items) {
        const product = productMap.get(item.productId);
        if (!product) continue;
        const existing = revenueByProduct.get(item.productId);
        const lineRevenue = item.totalPrice;
        if (existing) {
          existing.revenue += lineRevenue;
          existing.qty += item.quantity;
        } else {
          revenueByProduct.set(item.productId, {
            name: product.name,
            revenue: lineRevenue,
            qty: item.quantity,
            categoryId: product.categoryId,
          });
        }
      }
    }

    return Array.from(revenueByProduct.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [productMap]);

  // ── Revenue by Category (MOCK_ORDERS items × product prices) ──────────────
  // Supplement with ADMIN_STATS scale so the chart reflects realistic proportions.
  // We compute real percentages from order items, then scale to ADMIN_STATS revenue.
  const categoryRevenue = useMemo(() => {
    const revenueByCategory = new Map<string, number>();

    for (const order of MOCK_ORDERS) {
      for (const item of order.items) {
        const product = productMap.get(item.productId);
        if (!product) continue;
        const prev = revenueByCategory.get(product.categoryId) ?? 0;
        revenueByCategory.set(product.categoryId, prev + item.totalPrice);
      }
    }

    const totalItemRevenue = Array.from(revenueByCategory.values()).reduce((s, v) => s + v, 0);

    // If we have real data, scale proportionally to ADMIN_STATS platform revenue.
    // Otherwise fall back to category-level inventory value as a proxy.
    const platformRevenue = ADMIN_STATS.revenueMonth;

    let entries: Array<{ name: string; revenue: number; pct: number }> = [];

    if (totalItemRevenue > 0) {
      entries = Array.from(revenueByCategory.entries())
        .map(([catId, rawRev]) => {
          const cat = categoryMap.get(catId);
          const scaledRevenue = Math.round((rawRev / totalItemRevenue) * platformRevenue);
          const pct = Math.round((rawRev / totalItemRevenue) * 100);
          return { name: cat?.name ?? catId, revenue: scaledRevenue, pct };
        })
        .sort((a, b) => b.revenue - a.revenue);

      // Ensure pcts sum to 100 by adjusting the first entry
      const pctSum = entries.reduce((s, e) => s + e.pct, 0);
      if (entries.length > 0 && pctSum !== 100) {
        entries[0].pct += 100 - pctSum;
      }
    } else {
      // Fallback: distribute by product count per category
      const totalProducts = PRODUCT_CATEGORIES.reduce((s, c) => s + c.productCount, 0);
      entries = PRODUCT_CATEGORIES.map((cat) => {
        const pct = Math.round((cat.productCount / totalProducts) * 100);
        return { name: cat.name, revenue: Math.round((cat.productCount / totalProducts) * platformRevenue), pct };
      }).sort((a, b) => b.revenue - a.revenue);
    }

    return entries;
  }, [productMap, categoryMap]);

  // ── Sales Velocity — orders per day from order dates ──────────────────────
  const salesVelocity = useMemo(() => {
    if (MOCK_ORDERS.length === 0) return { ordersPerDay: 0, busiestDay: "N/A", dayBreakdown: [], platformOrdersPerDay: 0 };

    // Parse dates and group by date string
    const countByDay = new Map<string, number>();
    for (const order of MOCK_ORDERS) {
      const day = order.createdAt.slice(0, 10); // "YYYY-MM-DD"
      countByDay.set(day, (countByDay.get(day) ?? 0) + 1);
    }

    const days = Array.from(countByDay.keys()).sort();
    const firstDay = new Date(days[0]);
    const lastDay = new Date(days[days.length - 1]);
    const spanDays = Math.max(1, Math.round((lastDay.getTime() - firstDay.getTime()) / 86_400_000) + 1);

    const ordersPerDay = +(MOCK_ORDERS.length / spanDays).toFixed(1);

    let busiestDay = days[0];
    let busiestCount = 0;
    for (const [day, count] of countByDay) {
      if (count > busiestCount) { busiestCount = count; busiestDay = day; }
    }

    // Use ADMIN_STATS to show realistic platform-level velocity alongside sample data
    const platformOrdersPerDay = +(ADMIN_STATS.totalOrders / 31).toFixed(0);

    const dayBreakdown = days.map((day) => ({
      day,
      count: countByDay.get(day) ?? 0,
      label: new Date(day + "T00:00:00").toLocaleDateString("en-PH", { month: "short", day: "numeric" }),
    }));

    return { ordersPerDay, busiestDay, dayBreakdown, platformOrdersPerDay };
  }, []);

  // ── Top Retailers from MOCK_ORDERS (grouped by storeId) ───────────────────
  const topRetailers = useMemo(() => {
    const byStore = new Map<string, { orders: number; revenue: number }>();

    for (const order of MOCK_ORDERS) {
      const existing = byStore.get(order.storeId);
      if (existing) {
        existing.orders += 1;
        existing.revenue += order.total;
      } else {
        byStore.set(order.storeId, { orders: 1, revenue: order.total });
      }
    }

    const fromOrders = Array.from(byStore.entries())
      .map(([storeId, data]) => ({
        name: RETAILER_NAMES[storeId] ?? `Store ${storeId}`,
        orders: data.orders,
        revenue: data.revenue,
        avgOrder: Math.round(data.revenue / data.orders),
        status: "Active" as const,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // Supplement with synthetic retailers so the table is meaningful
    // (MOCK_ORDERS only has one store; supplement with platform-representative data)
    const SUPPLEMENTAL = [
      { name: "Mang Tony Sari-Sari",     orders: 41, revenue: 156_800, avgOrder: 3_824, status: "Active" as const },
      { name: "JB General Merchandise",  orders: 37, revenue: 142_500, avgOrder: 3_851, status: "Active" as const },
      { name: "Rose Convenience Store",  orders: 32, revenue: 118_400, avgOrder: 3_700, status: "Active" as const },
      { name: "Dela Cruz Store",         orders: 28, revenue: 97_600,  avgOrder: 3_486, status: "Inactive" as const },
    ];

    // Merge: real data first, then supplement if fewer than 5 rows
    type RetailerRow = { name: string; orders: number; revenue: number; avgOrder: number; status: "Active" | "Inactive" };
    const merged: RetailerRow[] = [...fromOrders];
    const existingNames = new Set(merged.map((r) => r.name));
    for (const s of SUPPLEMENTAL) {
      if (!existingNames.has(s.name) && merged.length < 5) merged.push(s);
    }

    return merged.slice(0, 5);
  }, []);

  // ── KPI numbers — use ADMIN_STATS for platform-level realism ───────────────
  const kpi = useMemo(() => {
    return {
      totalRevenue: ADMIN_STATS.revenueMonth,
      activeRetailers: ADMIN_STATS.activeRetailers,
      ordersThisMonth: ADMIN_STATS.totalOrders,
      avgOrderValue: Math.round(ADMIN_STATS.revenueMonth / ADMIN_STATS.totalOrders),
    };
  }, []);

  // ── Order status distribution computed from MOCK_ORDERS ───────────────────
  const orderStatusDist = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const o of MOCK_ORDERS) {
      counts[o.status] = (counts[o.status] ?? 0) + 1;
    }
    const total = MOCK_ORDERS.length || 1;
    return [
      { label: "Delivered",   pct: Math.round(((counts["delivered"] ?? 0) / total) * 100), color: "bg-green-500" },
      { label: "In Transit",  pct: Math.round(((counts["out_for_delivery"] ?? 0) / total) * 100), color: "bg-amber-500" },
      { label: "Processing",  pct: Math.round(((counts["picking"] ?? 0) + (counts["packed"] ?? 0) + (counts["confirmed"] ?? 0)) / total * 100), color: "bg-blue-500" },
      { label: "Cancelled",   pct: Math.round(((counts["cancelled"] ?? 0) + (counts["failed_delivery"] ?? 0)) / total * 100), color: "bg-red-500" },
    ];
  }, []);

  // Payment method counts from ADMIN_STATS scale
  const totalTxns = ADMIN_STATS.totalOrders;
  const paymentMethods = PAYMENT_METHODS.map((pm) => ({
    ...pm,
    count: Math.round((pm.pct / 100) * totalTxns),
  }));

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Business intelligence and performance metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            This Month ▼
          </Button>
          <Button size="sm" onClick={() => downloadCSV(MONTHLY_REVENUE, MONTHS)}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={downloadPDF}>
            <FileDown className="h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* ── KPI Row ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <Card className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl text-success-600 dark:text-foreground bg-success-50 dark:bg-success-500/10">
              <TrendingUp className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-success-600 dark:text-foreground bg-success-50 dark:bg-success-500/10 rounded-full px-2 py-0.5">
              <ArrowUpRight className="h-3 w-3" />12.3%
            </span>
          </div>
          <p className="font-display text-2xl font-bold text-foreground leading-none">
            {formatMillions(kpi.totalRevenue)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Total Revenue</p>
          <p className="text-[11px] text-muted-foreground/70 mt-0.5">vs last month</p>
        </Card>

        {/* Active Retailers */}
        <Card className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl text-brand-600 dark:text-foreground bg-brand-50 dark:bg-brand-500/10">
              <Users className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-success-600 dark:text-foreground bg-success-50 dark:bg-success-500/10 rounded-full px-2 py-0.5">
              <ArrowUpRight className="h-3 w-3" />+{ADMIN_STATS.newRetailersMonth} new
            </span>
          </div>
          <p className="font-display text-2xl font-bold text-foreground leading-none">
            {kpi.activeRetailers.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Active Retailers</p>
          <p className="text-[11px] text-muted-foreground/70 mt-0.5">this month</p>
        </Card>

        {/* Orders This Month */}
        <Card className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl text-info-600 dark:text-foreground bg-info-50 dark:bg-info-500/10">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-red-600 bg-red-50 rounded-full px-2 py-0.5">
              <ArrowDownRight className="h-3 w-3" />3.2%
            </span>
          </div>
          <p className="font-display text-2xl font-bold text-foreground leading-none">
            {kpi.ordersThisMonth.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Orders This Month</p>
          <p className="text-[11px] text-muted-foreground/70 mt-0.5">vs last month</p>
        </Card>

        {/* Avg Order Value */}
        <Card className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl text-purple-600 bg-purple-50">
              <Package className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-success-600 dark:text-foreground bg-success-50 dark:bg-success-500/10 rounded-full px-2 py-0.5">
              <ArrowUpRight className="h-3 w-3" />4.1%
            </span>
          </div>
          <p className="font-display text-2xl font-bold text-foreground leading-none">
            {formatPHP(kpi.avgOrderValue)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Avg Order Value</p>
          <p className="text-[11px] text-muted-foreground/70 mt-0.5">vs last month</p>
        </Card>
      </div>

      {/* ── Revenue Trend SVG Chart ─────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Revenue Trend</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Aug 2025 – Jan 2026</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-sm" style={{ background: BRAND_COLOR }} />
              <span className="text-xs text-muted-foreground">Monthly Revenue</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2 px-4 pb-4">
          <RevenueSvgChart />
        </CardContent>
      </Card>

      {/* ── Sales Velocity ──────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-brand-700 dark:text-brand-400" />
            <CardTitle>Sales Velocity</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Orders per day · computed from order dates</p>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            {/* Platform daily avg */}
            <div className="rounded-xl bg-brand-50 dark:bg-brand-500/10 border border-brand-100 p-4">
              <p className="text-xs text-brand-700 dark:text-brand-400 font-medium mb-1">Platform Daily Avg</p>
              <p className="font-display text-3xl font-bold text-brand-700 dark:text-brand-400 leading-none">
                {salesVelocity.platformOrdersPerDay}
              </p>
              <p className="text-[11px] text-brand-600 mt-1">orders / day (Jan 2026)</p>
            </div>
            {/* Today */}
            <div className="rounded-xl bg-surface-50 dark:bg-surface-900 border border-border p-4">
              <p className="text-xs text-muted-foreground font-medium mb-1">Today</p>
              <p className="font-display text-3xl font-bold text-surface-900 leading-none">
                {ADMIN_STATS.ordersToday}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">orders placed today</p>
            </div>
            {/* Sample avg from MOCK_ORDERS */}
            <div className="rounded-xl bg-surface-50 dark:bg-surface-900 border border-border p-4">
              <p className="text-xs text-muted-foreground font-medium mb-1">Recent Sample Avg</p>
              <p className="font-display text-3xl font-bold text-surface-900 leading-none">
                {salesVelocity.ordersPerDay}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">orders / day (last {salesVelocity.dayBreakdown.length} active days)</p>
            </div>
          </div>

          {/* Day-by-day breakdown from MOCK_ORDERS */}
          {salesVelocity.dayBreakdown.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Order Activity — Sample Window</p>
              <div className="flex flex-wrap gap-2">
                {salesVelocity.dayBreakdown.map((d) => (
                  <div
                    key={d.day}
                    className="flex flex-col items-center gap-1 rounded-lg border border-border bg-surface-50 dark:bg-surface-900 px-4 py-2.5 min-w-[80px]"
                  >
                    <span className="text-[10px] text-muted-foreground">{d.label}</span>
                    <span className="font-display text-xl font-bold text-surface-900">{d.count}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {d.count === 1 ? "order" : "orders"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Order Status + Payment Methods ─────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Order Status Donut */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Order Status</CardTitle>
            <p className="text-xs text-muted-foreground">Distribution · MOCK_ORDERS sample</p>
          </CardHeader>
          <CardContent className="pt-2 flex flex-col items-center gap-5">
            {/* Donut via conic-gradient — built from computed orderStatusDist */}
            <div className="relative flex-shrink-0">
              {(() => {
                // Build conic stops from real data
                const colors = ["#22c55e", "#f59e0b", "#3b82f6", "#ef4444"];
                let cumulative = 0;
                const stops = orderStatusDist.map((s, i) => {
                  const start = cumulative;
                  cumulative += s.pct;
                  return `${colors[i]} ${start}% ${cumulative}%`;
                });
                return (
                  <div
                    className="rounded-full"
                    style={{
                      width: 148,
                      height: 148,
                      background: `conic-gradient(${stops.join(", ")})`,
                    }}
                  />
                );
              })()}
              <div
                className="absolute inset-0 m-auto rounded-full bg-card flex flex-col items-center justify-center"
                style={{ width: 80, height: 80 }}
              >
                <p className="font-display text-xl font-bold text-foreground leading-none">
                  {MOCK_ORDERS.length}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">orders</p>
              </div>
            </div>

            {/* Legend */}
            <div className="w-full grid grid-cols-2 gap-x-6 gap-y-2">
              {orderStatusDist.map((s) => (
                <div key={s.label} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", s.color)} />
                    <span className="text-xs text-muted-foreground truncate">{s.label}</span>
                  </div>
                  <span className="text-xs font-semibold text-foreground">{s.pct}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment Method Split */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Payment Methods</CardTitle>
            <p className="text-xs text-muted-foreground">Transaction split · Jan 2026</p>
          </CardHeader>
          <CardContent className="pt-2 space-y-5">
            {paymentMethods.map((pm) => (
              <div key={pm.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-foreground">{pm.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{pm.count.toLocaleString()} txns</span>
                    <span className="text-sm font-bold text-foreground">{pm.pct}%</span>
                  </div>
                </div>
                <div className="h-3 w-full rounded-full bg-surface-100 dark:bg-surface-800 overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", pm.barColor)}
                    style={{ width: `${pm.pct}%` }}
                  />
                </div>
              </div>
            ))}

            <div className="mt-2 rounded-xl bg-surface-50 dark:bg-surface-900 border border-border p-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Total Transactions</span>
              <span className="text-sm font-bold text-surface-900">{totalTxns.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Top Retailers Table ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-500" />
            <CardTitle>Top Retailers by Revenue</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Computed from order history · Sorted by total revenue
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 text-left text-xs font-semibold text-muted-foreground w-10">Rank</th>
                  <th className="pb-3 text-left text-xs font-semibold text-muted-foreground">Store Name</th>
                  <th className="pb-3 text-right text-xs font-semibold text-muted-foreground">Orders</th>
                  <th className="pb-3 text-right text-xs font-semibold text-muted-foreground">Revenue</th>
                  <th className="pb-3 text-right text-xs font-semibold text-muted-foreground">Avg Order</th>
                  <th className="pb-3 text-right text-xs font-semibold text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {topRetailers.map((r, i) => (
                  <tr key={r.name} className="border-b border-border last:border-0 hover:bg-surface-50 dark:bg-surface-900 transition-colors">
                    <td className="py-3.5">
                      <span
                        className={cn(
                          "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                          i === 0 ? "bg-amber-100 text-amber-700" :
                          i === 1 ? "bg-slate-100 text-slate-600" :
                          i === 2 ? "bg-orange-100 text-orange-700" :
                          "text-muted-foreground"
                        )}
                      >
                        {i + 1}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <p className="font-medium text-foreground">{r.name}</p>
                    </td>
                    <td className="py-3.5 text-right text-foreground">{r.orders}</td>
                    <td className="py-3.5 text-right font-semibold text-foreground">{formatPHP(r.revenue)}</td>
                    <td className="py-3.5 text-right text-muted-foreground">{formatPHP(r.avgOrder)}</td>
                    <td className="py-3.5 text-right">
                      <Badge
                        variant={r.status === "Active" ? "success" : "neutral"}
                        className="text-[11px]"
                      >
                        {r.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 pt-3 border-t border-border">
            <button className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 transition-colors">
              View All Retailers →
            </button>
          </div>
        </CardContent>
      </Card>

      {/* ── Top Products by Revenue ─────────────────────────────────────────── */}
      {topProducts.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Top Products by Revenue</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Computed from MOCK_ORDERS line items × unit prices</p>
          </CardHeader>
          <CardContent className="pt-2 space-y-3">
            {topProducts.map((p, i) => {
              const cat = categoryMap.get(p.categoryId);
              const maxRev = topProducts[0].revenue;
              const widthPct = Math.round((p.revenue / maxRev) * 100);
              const opacity = Math.max(0.45, 1 - i * 0.12);
              return (
                <div key={p.name} className="flex items-center gap-3">
                  <span
                    className={cn(
                      "inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold shrink-0",
                      i === 0 ? "bg-amber-100 text-amber-700" :
                      i === 1 ? "bg-slate-100 text-slate-600" :
                      i === 2 ? "bg-orange-100 text-orange-700" :
                      "bg-surface-100 dark:bg-surface-800 text-muted-foreground"
                    )}
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-foreground truncate pr-2">{p.name}</span>
                      <span className="text-sm font-semibold text-foreground shrink-0">{formatPHP(p.revenue)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-surface-100 dark:bg-surface-800 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${widthPct}%`, background: `rgba(244, 112, 40, ${opacity})` }}
                        />
                      </div>
                      <span className="text-[11px] text-muted-foreground shrink-0 w-14 text-right">
                        {p.qty.toLocaleString()} units
                      </span>
                    </div>
                    {cat && (
                      <span className="text-[10px] text-muted-foreground/70">{cat.name}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* ── Category Performance ────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Revenue by Category</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Computed from order items · scaled to platform revenue
          </p>
        </CardHeader>
        <CardContent className="pt-2 space-y-4">
          {categoryRevenue.map((cat, i) => {
            const opacity = Math.max(0.45, 1 - i * 0.08);
            return (
              <div key={cat.name} className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground w-36 shrink-0 truncate">{cat.name}</span>
                <div className="flex-1 h-5 rounded-full bg-surface-100 dark:bg-surface-800 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${cat.pct}%`,
                      background: `rgba(244, 112, 40, ${opacity})`,
                    }}
                  />
                </div>
                <span className="text-sm font-semibold text-foreground w-28 text-right shrink-0">
                  {formatPHP(cat.revenue)}
                </span>
                <span className="text-xs text-muted-foreground w-8 text-right shrink-0">{cat.pct}%</span>
              </div>
            );
          })}
        </CardContent>
      </Card>

    </div>
  );
}
