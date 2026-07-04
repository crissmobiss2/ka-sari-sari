"use client";
import { TrendingUp, TrendingDown, Package, Users, ShoppingCart, AlertTriangle, ArrowRight, Clock } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatPHP, formatDateTime } from "@/lib/utils";
import { ADMIN_STATS, ADMIN_RECENT_ORDERS } from "@/lib/mock-data";

const STAT_CARDS = [
  {
    label: "Orders Today",
    value: ADMIN_STATS.ordersToday.toString(),
    change: "+12% vs yesterday",
    up: true,
    icon: ShoppingCart,
    href: "/admin/orders",
    color: "text-info-600 bg-info-50",
  },
  {
    label: "Revenue Today",
    value: formatPHP(ADMIN_STATS.revenueToday),
    change: "+8% vs yesterday",
    up: true,
    icon: TrendingUp,
    href: "/admin/reports",
    color: "text-success-600 bg-success-50",
  },
  {
    label: "Active Retailers",
    value: ADMIN_STATS.activeRetailers.toString(),
    change: `+${ADMIN_STATS.newRetailersMonth} this month`,
    up: true,
    icon: Users,
    href: "/admin/retailers",
    color: "text-brand-600 bg-brand-50",
  },
  {
    label: "Low Stock Items",
    value: ADMIN_STATS.lowStockItems.toString(),
    change: "Needs attention",
    up: false,
    icon: AlertTriangle,
    href: "/admin/inventory",
    color: "text-warning-600 bg-warning-50",
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="hover:shadow-card-md transition-shadow cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${s.color}`}>
                    <s.icon className="h-4.5 w-4.5" />
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-medium ${s.up ? "text-success-600" : "text-warning-600"}`}>
                    {s.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  </div>
                </div>
                <p className="font-display text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                <p className={`text-xs mt-0.5 font-medium ${s.up ? "text-success-600" : "text-warning-600"}`}>{s.change}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Revenue summary */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Monthly Revenue</CardTitle>
              <span className="text-2xl font-bold text-foreground">{formatPHP(ADMIN_STATS.revenueMonth)}</span>
            </div>
          </CardHeader>
          <CardContent>
            {/* Simple bar chart placeholder */}
            <div className="flex items-end gap-2 h-24">
              {[45, 62, 78, 55, 90, 82, 95, 70, 88, 75, 92, 100].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-lg bg-brand-200 hover:bg-brand-400 transition-colors"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>Jan</span><span>Jun</span><span>Dec</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Pending Actions</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Orders to pick", count: 8, color: "text-warning-600 bg-warning-50", href: "/admin/fulfillment" },
              { label: "Orders to pack", count: 4, color: "text-info-600 bg-info-50", href: "/admin/fulfillment" },
              { label: "Out for delivery", count: 6, color: "text-brand-600 bg-brand-50", href: "/admin/delivery" },
              { label: "Pending payments", count: 2, color: "text-danger-600 bg-danger-50", href: "/admin/subscriptions" },
            ].map((item) => (
              <Link key={item.label} href={item.href} className="flex items-center justify-between hover:opacity-80 transition-opacity">
                <span className="text-sm text-foreground">{item.label}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${item.color}`}>
                  {item.count}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent orders */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Orders</CardTitle>
            <Link href="/admin/orders" className="flex items-center gap-1 text-sm text-brand-500 hover:text-brand-600">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Order</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Store</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Time</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Amount</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ADMIN_RECENT_ORDERS.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <Link href={`/admin/orders/${order.id}`} className="font-medium text-foreground hover:text-brand-500">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell">{order.deliveryAddress.split(",")[0]}</td>
                    <td className="px-5 py-3.5 text-muted-foreground hidden lg:table-cell text-xs">{formatDateTime(order.createdAt)}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-foreground">{formatPHP(order.total)}</td>
                    <td className="px-5 py-3.5 text-right"><StatusBadge status={order.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
