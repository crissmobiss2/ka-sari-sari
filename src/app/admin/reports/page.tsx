"use client";
import { TrendingUp, ShoppingCart, Users, Package, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPHP, formatNumber } from "@/lib/utils";
import { ADMIN_STATS } from "@/lib/mock-data";

const MONTHLY_REVENUE = [820000, 940000, 880000, 1020000, 1100000, 1050000, 980000, 1150000, 1200000, 1180000, 1220000, 1248600];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const maxRevenue = Math.max(...MONTHLY_REVENUE);

const TOP_PRODUCTS = [
  { name: "Coca-Cola 330ml", orders: 312, revenue: 268320 },
  { name: "Lucky Me! Pancit Canton", orders: 284, revenue: 121824 },
  { name: "555 Sardines", orders: 256, revenue: 215040 },
  { name: "Nescafé 3-in-1", orders: 198, revenue: 110880 },
  { name: "Safeguard Bar Soap", orders: 176, revenue: 116160 },
];

export default function AdminReportsPage() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Business performance overview</p>
        </div>
        <Button variant="outline" size="md">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Monthly Revenue", value: formatPHP(ADMIN_STATS.revenueMonth), icon: TrendingUp, color: "text-success-600 bg-success-50" },
          { label: "Total Orders", value: formatNumber(ADMIN_STATS.totalOrders), icon: ShoppingCart, color: "text-info-600 bg-info-50" },
          { label: "Active Retailers", value: ADMIN_STATS.activeRetailers.toString(), icon: Users, color: "text-brand-600 bg-brand-50" },
          { label: "New Retailers", value: ADMIN_STATS.newRetailersMonth.toString(), icon: Package, color: "text-purple-600 bg-purple-50" },
        ].map((s) => (
          <Card key={s.label} className="p-5">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${s.color} mb-3`}>
              <s.icon className="h-4.5 w-4.5" />
            </div>
            <p className="font-display text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Revenue chart */}
        <Card className="lg:col-span-3">
          <CardHeader><CardTitle>Revenue 2025</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-end gap-1.5 h-32">
              {MONTHLY_REVENUE.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-lg bg-brand-500 hover:bg-brand-600 transition-colors cursor-pointer"
                    style={{ height: `${(v / maxRevenue) * 100}%` }}
                    title={formatPHP(v)}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2">
              {MONTHS.map((m) => (
                <span key={m} className="text-[9px] text-muted-foreground">{m}</span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top products */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Top Products</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {TOP_PRODUCTS.map((p, i) => (
              <div key={p.name}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                    <p className="text-xs font-medium text-foreground truncate">{p.name}</p>
                  </div>
                  <p className="text-xs font-semibold text-foreground ml-2 shrink-0">{formatPHP(p.revenue)}</p>
                </div>
                <div className="h-1.5 rounded-full bg-surface-200">
                  <div
                    className="h-1.5 rounded-full bg-brand-500"
                    style={{ width: `${(p.orders / TOP_PRODUCTS[0].orders) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
