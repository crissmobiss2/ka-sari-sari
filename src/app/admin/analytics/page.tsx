"use client";

import { TrendingUp, Users, ShoppingCart, Package, Download, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPHP, cn } from "@/lib/utils";

// ── Static mock data ─────────────────────────────────────────────────────────

const MONTHLY_REVENUE = [890000, 1020000, 1150000, 1340000, 1480000, 1250000];
const MONTHS = ["Aug '25", "Sep '25", "Oct '25", "Nov '25", "Dec '25", "Jan '26"];
const maxRevenue = Math.max(...MONTHLY_REVENUE);

const TOP_RETAILERS = [
  { name: "Aling Nena's Store",      orders: 48, revenue: 184200, avgOrder: 3838, status: "Active" },
  { name: "Mang Tony Sari-Sari",     orders: 41, revenue: 156800, avgOrder: 3824, status: "Active" },
  { name: "JB General Merchandise",  orders: 37, revenue: 142500, avgOrder: 3851, status: "Active" },
  { name: "Rose Convenience Store",  orders: 32, revenue: 118400, avgOrder: 3700, status: "Active" },
  { name: "Dela Cruz Store",         orders: 28, revenue: 97600,  avgOrder: 3486, status: "Inactive" },
];

const CATEGORIES = [
  { name: "Beverages",        revenue: 420000, pct: 32 },
  { name: "Instant Noodles", revenue: 285000, pct: 22 },
  { name: "Snacks & Chips",  revenue: 210000, pct: 16 },
  { name: "Canned Goods",    revenue: 195000, pct: 15 },
  { name: "Personal Care",   revenue: 98000,  pct: 7  },
  { name: "Others",          revenue: 42000,  pct: 8  },
];

const PAYMENT_METHODS = [
  { name: "GCash",  pct: 58, count: 1072, barColor: "bg-blue-500" },
  { name: "COD",    pct: 27, count: 499,  barColor: "bg-brand-500" },
  { name: "Maya",   pct: 15, count: 277,  barColor: "bg-emerald-500" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatMillions(n: number) {
  if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `₱${(n / 1_000).toFixed(0)}k`;
  return `₱${n}`;
}

// ── SVG Bar Chart ────────────────────────────────────────────────────────────

const CHART_W = 600;
const CHART_H = 200;
const CHART_PADDING = { top: 28, right: 10, bottom: 36, left: 10 };
const BAR_GAP = 12;
const BRAND_COLOR = "#f47028";
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
            {/* Bar with rounded top corners via path */}
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
            {/* Value label above bar */}
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
            {/* Month label on x-axis */}
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

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AdminAnalyticsPage() {
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
          <Button size="sm">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* ── KPI Row ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <Card className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl text-success-600 bg-success-50">
              <TrendingUp className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-success-600 bg-success-50 rounded-full px-2 py-0.5">
              <ArrowUpRight className="h-3 w-3" />12.3%
            </span>
          </div>
          <p className="font-display text-2xl font-bold text-foreground leading-none">₱1.25M</p>
          <p className="text-xs text-muted-foreground mt-1">Total Revenue</p>
          <p className="text-[11px] text-muted-foreground/70 mt-0.5">vs last month</p>
        </Card>

        {/* Active Retailers */}
        <Card className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl text-brand-600 bg-brand-50">
              <Users className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-success-600 bg-success-50 rounded-full px-2 py-0.5">
              <ArrowUpRight className="h-3 w-3" />+8 new
            </span>
          </div>
          <p className="font-display text-2xl font-bold text-foreground leading-none">284</p>
          <p className="text-xs text-muted-foreground mt-1">Active Retailers</p>
          <p className="text-[11px] text-muted-foreground/70 mt-0.5">this month</p>
        </Card>

        {/* Orders This Month */}
        <Card className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl text-info-600 bg-info-50">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-red-600 bg-red-50 rounded-full px-2 py-0.5">
              <ArrowDownRight className="h-3 w-3" />3.2%
            </span>
          </div>
          <p className="font-display text-2xl font-bold text-foreground leading-none">1,847</p>
          <p className="text-xs text-muted-foreground mt-1">Orders This Month</p>
          <p className="text-[11px] text-muted-foreground/70 mt-0.5">vs last month</p>
        </Card>

        {/* Avg Order Value */}
        <Card className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl text-purple-600 bg-purple-50">
              <Package className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-success-600 bg-success-50 rounded-full px-2 py-0.5">
              <ArrowUpRight className="h-3 w-3" />4.1%
            </span>
          </div>
          <p className="font-display text-2xl font-bold text-foreground leading-none">₱676</p>
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

      {/* ── Order Status + Payment Methods ─────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Order Status Donut */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Order Status</CardTitle>
            <p className="text-xs text-muted-foreground">Distribution · Jan 2026</p>
          </CardHeader>
          <CardContent className="pt-2 flex flex-col items-center gap-5">
            {/* Donut via conic-gradient */}
            <div className="relative flex-shrink-0">
              <div
                className="rounded-full"
                style={{
                  width: 148,
                  height: 148,
                  background: "conic-gradient(#22c55e 0% 73%, #f59e0b 73% 85%, #3b82f6 85% 94%, #ef4444 94% 100%)",
                }}
              />
              {/* Centre hole */}
              <div
                className="absolute inset-0 m-auto rounded-full bg-card flex flex-col items-center justify-center"
                style={{ width: 80, height: 80 }}
              >
                <p className="font-display text-xl font-bold text-foreground leading-none">1,847</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">orders</p>
              </div>
            </div>

            {/* Legend */}
            <div className="w-full grid grid-cols-2 gap-x-6 gap-y-2">
              {[
                { label: "Delivered",   pct: 73, color: "bg-green-500"  },
                { label: "In Transit",  pct: 12, color: "bg-amber-500"  },
                { label: "Processing",  pct: 9,  color: "bg-blue-500"   },
                { label: "Cancelled",   pct: 6,  color: "bg-red-500"    },
              ].map((s) => (
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
            {PAYMENT_METHODS.map((pm) => (
              <div key={pm.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-foreground">{pm.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{pm.count.toLocaleString()} txns</span>
                    <span className="text-sm font-bold text-foreground">{pm.pct}%</span>
                  </div>
                </div>
                <div className="h-3 w-full rounded-full bg-surface-100 overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", pm.barColor)}
                    style={{ width: `${pm.pct}%` }}
                  />
                </div>
              </div>
            ))}

            {/* Total callout */}
            <div className="mt-2 rounded-xl bg-surface-50 border border-border p-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Total Transactions</span>
              <span className="text-sm font-bold text-foreground">1,848</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Top Retailers Table ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Top Retailers by Revenue</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Jan 2026 · Sorted by total revenue</p>
            </div>
          </div>
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
                {TOP_RETAILERS.map((r, i) => (
                  <tr key={r.name} className="border-b border-border last:border-0 hover:bg-surface-50 transition-colors">
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
            <button className="text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors">
              View All Retailers →
            </button>
          </div>
        </CardContent>
      </Card>

      {/* ── Category Performance ────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Revenue by Category</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">Jan 2026 · Sorted by revenue</p>
        </CardHeader>
        <CardContent className="pt-2 space-y-4">
          {CATEGORIES.map((cat, i) => {
            // Decreasing opacity for visual hierarchy
            const opacity = Math.max(0.45, 1 - i * 0.1);
            return (
              <div key={cat.name} className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground w-32 shrink-0 truncate">{cat.name}</span>
                <div className="flex-1 h-5 rounded-full bg-surface-100 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${cat.pct}%`,
                      background: `rgba(244, 112, 40, ${opacity})`,
                    }}
                  />
                </div>
                <span className="text-sm font-semibold text-foreground w-24 text-right shrink-0">
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
