"use client";
import Link from "next/link";
import { BarChart3, TrendingUp, Package, ShoppingBasket, Zap, RotateCcw } from "lucide-react";
import { RetailerTopBar, RetailerBottomNav } from "@/components/layout/retailer-nav";
import { formatPHP } from "@/lib/utils";
import { cn } from "@/lib/utils";

// ── Static data ──────────────────────────────────────────────────────────────

const MONTHLY_DATA = [
  { month: "Aug", value: 3200 },
  { month: "Sep", value: 4100 },
  { month: "Oct", value: 3800 },
  { month: "Nov", value: 5200 },
  { month: "Dec", value: 6100 },
  { month: "Jan", value: 4980, current: true },
];

const MAX_VALUE = Math.max(...MONTHLY_DATA.map((d) => d.value));

const TOP_PRODUCTS = [
  { rank: 1, name: "Coca-Cola Regular 330ml", orders: 18, spent: 3024 },
  { rank: 2, name: "Lucky Me! Pancit Canton", orders: 14, spent: 1176 },
  { rank: 3, name: "Nescafé 3-in-1 Original", orders: 12, spent: 1020 },
  { rank: 4, name: "555 Sardines Tomato Sauce", orders: 10, spent: 1680 },
  { rank: 5, name: "Safeguard Classic Bar", orders: 8, spent: 1760 },
];

const RESTOCK_SUGGESTIONS = [
  { name: "Coca-Cola Regular 330ml", frequency: "every 2 weeks", daysSince: 12, href: "/catalog?q=coca-cola" },
  { name: "Lucky Me! Pancit Canton", frequency: "every 10 days", daysSince: 8, href: "/catalog?q=lucky+me" },
  { name: "555 Sardines Tomato Sauce", frequency: "every 2 weeks", daysSince: 15, href: "/catalog?q=555+sardines" },
];

const RANK_COLORS = [
  "bg-brand-500",
  "bg-brand-400",
  "bg-brand-300",
  "bg-brand-200",
  "bg-brand-100",
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

        {/* Key stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Total Spent" value="₱45,280" sub="This year" />
          <StatCard label="Orders" value="24" sub="This year" />
          <StatCard label="Avg. Order" value="₱1,887" sub="Per order" />
          <StatCard
            label="Savings vs SRP"
            value="₱12,450"
            sub="21.6% saved"
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
        </div>

        {/* Top products */}
        <div>
          <h2 className="font-display text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <Package className="h-4 w-4 text-brand-500" />
            Your Top Products
          </h2>
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
                    <p className="text-xs text-muted-foreground mt-0.5">{p.orders} orders</p>
                  </div>
                  <span className="text-sm font-bold text-foreground tabular-nums shrink-0">
                    {formatPHP(p.spent)}
                  </span>
                </div>
              </div>
            ))}
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
              <div key={s.name} className="rounded-2xl border border-border bg-card shadow-card px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      You usually order {s.frequency}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        s.daysSince >= 14
                          ? "bg-danger-50 text-danger-600 border border-danger-200"
                          : s.daysSince >= 10
                          ? "bg-warning-50 text-warning-600 border border-warning-200"
                          : "bg-surface-100 text-muted-foreground border border-border"
                      )}>
                        Last ordered {s.daysSince} days ago
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
                <div className="w-20 shrink-0 text-right text-xs font-bold text-brand-500">₱45,280</div>
                <div className="flex-1 h-3 rounded-full bg-surface-100 overflow-hidden">
                  <div className="h-full bg-brand-500 rounded-full" style={{ width: "78.4%" }} />
                </div>
                <div className="w-4 shrink-0 text-[9px] text-muted-foreground">78%</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-20 shrink-0 text-right text-xs font-medium text-muted-foreground">₱57,730</div>
                <div className="flex-1 h-3 rounded-full bg-surface-100 overflow-hidden">
                  <div className="h-full bg-surface-200 rounded-full" style={{ width: "100%" }} />
                </div>
                <div className="w-4 shrink-0 text-[9px] text-muted-foreground">SRP</div>
              </div>
            </div>

            <div className="mt-3 rounded-xl bg-success-50 border border-success-200 px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-success-700">Total savings this year</p>
                <p className="text-[11px] text-success-600 mt-0.5">Buying through Ka Sari-Sari</p>
              </div>
              <div className="text-right">
                <p className="font-display text-lg font-black text-success-700">₱12,450</p>
                <p className="text-xs text-success-600 font-semibold">21.6% saved</p>
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
                You&apos;re on track to save <span className="text-brand-600 font-semibold">₱15,000+</span> this year if you keep ordering through Ka Sari-Sari.
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
