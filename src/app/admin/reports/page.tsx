"use client";
import { TrendingUp, ShoppingCart, Users, Package, Download, CheckCircle2, Clock, RefreshCw, UserPlus, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPHP, formatNumber } from "@/lib/utils";
import { ADMIN_STATS } from "@/lib/mock-data";

// Revenue: Aug 25 → Jan 26
const MONTHLY_REVENUE = [890000, 1020000, 1150000, 1340000, 1480000, 1250000];
const MONTHS = ["Aug '25", "Sep '25", "Oct '25", "Nov '25", "Dec '25", "Jan '26"];
const maxRevenue = Math.max(...MONTHLY_REVENUE);

const TOP_CATEGORIES = [
  { name: "Beverages",       revenue: 420000, pct: 32, color: "bg-blue-500" },
  { name: "Instant Noodles", revenue: 285000, pct: 22, color: "bg-yellow-500" },
  { name: "Snacks",          revenue: 210000, pct: 16, color: "bg-red-500" },
  { name: "Canned Goods",    revenue: 195000, pct: 15, color: "bg-orange-500" },
  { name: "Others",          revenue: 196000, pct: 15, color: "bg-slate-400" },
];

const KEY_METRICS = [
  { label: "Order Fulfillment Rate",   value: "96.8%", icon: CheckCircle2, color: "text-success-600 bg-success-50" },
  { label: "Avg. Delivery Time",       value: "1.8 days", icon: Clock,       color: "text-info-600 bg-info-50" },
  { label: "Customer Retention",       value: "87%",   icon: RefreshCw,   color: "text-brand-600 bg-brand-50" },
  { label: "New Retailer Conversion",  value: "68%",   icon: UserPlus,    color: "text-purple-600 bg-purple-50" },
  { label: "Payment Collection Rate",  value: "98.2%", icon: Wallet,      color: "text-emerald-600 bg-emerald-50" },
];

const TOP_RETAILERS = [
  { name: "Aling Nena's Store",   orders: 48, revenue: 184200, status: "Active" },
  { name: "Mang Tony Sari-Sari",  orders: 41, revenue: 156800, status: "Active" },
  { name: "JB General Merchandise", orders: 37, revenue: 142500, status: "Active" },
  { name: "Rose Convenience Store", orders: 32, revenue: 118400, status: "Active" },
  { name: "Dela Cruz Store",       orders: 28, revenue: 97600,  status: "Active" },
];

const STATUS_COLORS: Record<string, string> = {
  Active: "bg-success-50 text-success-700",
  Inactive: "bg-surface-100 text-muted-foreground",
};

export default function AdminReportsPage() {
  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Business Intelligence</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Performance overview · Jan 2026</p>
        </div>
        <Button variant="outline" size="md">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Monthly Revenue",  value: formatPHP(ADMIN_STATS.revenueMonth),          icon: TrendingUp,  color: "text-success-600 bg-success-50",  delta: "+12.4%" },
          { label: "Total Orders",     value: formatNumber(ADMIN_STATS.totalOrders),         icon: ShoppingCart, color: "text-info-600 bg-info-50",        delta: "+8.1%" },
          { label: "Active Retailers", value: ADMIN_STATS.activeRetailers.toString(),        icon: Users,       color: "text-brand-600 bg-brand-50",       delta: "+5" },
          { label: "New Retailers",    value: ADMIN_STATS.newRetailersMonth.toString(),      icon: Package,     color: "text-purple-600 bg-purple-50",     delta: "This month" },
        ].map((s) => (
          <Card key={s.label} className="p-5 h-28 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <span className="text-[11px] font-medium text-success-600 bg-success-50 rounded-full px-2 py-0.5">{s.delta}</span>
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-foreground leading-none">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Revenue Overview + Category breakdown */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Horizontal bar chart */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle>Revenue Overview</CardTitle>
            <p className="text-xs text-muted-foreground">Aug 2025 – Jan 2026</p>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {MONTHLY_REVENUE.map((v, i) => {
              const pct = (v / maxRevenue) * 100;
              const label = v >= 1_000_000
                ? `₱${(v / 1_000_000).toFixed(2)}M`
                : `₱${(v / 1000).toFixed(0)}k`;
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-14 shrink-0">{MONTHS[i]}</span>
                  <div className="flex-1 h-8 bg-surface-100 rounded-lg overflow-hidden relative">
                    <div
                      className="h-full bg-brand-500 rounded-lg flex items-center px-2 transition-all"
                      style={{ width: `${pct}%` }}
                    >
                      {pct > 25 && (
                        <span className="text-[11px] font-semibold text-white whitespace-nowrap">{label}</span>
                      )}
                    </div>
                    {pct <= 25 && (
                      <span className="absolute left-[calc(100%+4px)] top-1/2 -translate-y-1/2 text-[11px] font-semibold text-foreground whitespace-nowrap"
                        style={{ left: `${pct + 1}%` }}
                      >{label}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Top categories */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle>Revenue by Category</CardTitle>
            <p className="text-xs text-muted-foreground">Jan 2026</p>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {TOP_CATEGORIES.map((cat) => (
              <div key={cat.name}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${cat.color}`} />
                    <p className="text-xs font-medium text-foreground truncate">{cat.name}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-2 shrink-0">
                    <span className="text-[11px] text-muted-foreground">{cat.pct}%</span>
                    <span className="text-xs font-semibold text-foreground">{formatPHP(cat.revenue)}</span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-surface-100">
                  <div className={`h-2 rounded-full ${cat.color}`} style={{ width: `${cat.pct}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Key Metrics + Top Retailers */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Key metrics */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle>Key Metrics</CardTitle>
            <p className="text-xs text-muted-foreground">Operational health indicators</p>
          </CardHeader>
          <CardContent className="space-y-1 pt-0">
            {KEY_METRICS.map((m) => (
              <div key={m.label} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${m.color}`}>
                    <m.icon className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-sm text-foreground">{m.label}</p>
                </div>
                <span className="text-sm font-bold text-foreground">{m.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Top retailers */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle>Top Retailers This Month</CardTitle>
            <p className="text-xs text-muted-foreground">By revenue · Jan 2026</p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-2 text-left text-xs font-semibold text-muted-foreground w-8">#</th>
                    <th className="pb-2 text-left text-xs font-semibold text-muted-foreground">Store</th>
                    <th className="pb-2 text-right text-xs font-semibold text-muted-foreground">Orders</th>
                    <th className="pb-2 text-right text-xs font-semibold text-muted-foreground">Revenue</th>
                    <th className="pb-2 text-right text-xs font-semibold text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {TOP_RETAILERS.map((r, i) => (
                    <tr key={r.name} className="border-b border-border last:border-0">
                      <td className="py-3 text-xs font-bold text-muted-foreground">{i + 1}</td>
                      <td className="py-3">
                        <p className="text-sm font-medium text-foreground">{r.name}</p>
                      </td>
                      <td className="py-3 text-right text-sm text-foreground">{r.orders}</td>
                      <td className="py-3 text-right text-sm font-semibold text-foreground">{formatPHP(r.revenue)}</td>
                      <td className="py-3 text-right">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_COLORS[r.status] ?? ""}`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
