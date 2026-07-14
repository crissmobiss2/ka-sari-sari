"use client";
// v2
import { useState, useEffect, useCallback } from "react";
import { TrendingUp, TrendingDown, Package, Users, ShoppingCart, AlertTriangle, ArrowRight, Clock } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatPHP, formatDateTime, type OrderStatus } from "@/lib/utils";
import { ADMIN_STATS, ADMIN_RECENT_ORDERS } from "@/lib/mock-data";
import type { AdminStats } from "@/types";

// ── Normalized order shape for the dashboard table ────────────────────────────
interface DisplayOrder {
  id: string;
  orderNumber: string;
  storeName: string;
  createdAt: string;
  total: number;
  status: OrderStatus;
}

function normalizeOrder(o: unknown): DisplayOrder {
  const order = o as Record<string, unknown>;
  const retailer = order.retailer as Record<string, unknown> | null | undefined;
  return {
    id: String(order.id ?? ""),
    orderNumber: String(order.order_number ?? order.orderNumber ?? order.id ?? ""),
    storeName: retailer
      ? String(retailer.store_name ?? retailer.name ?? "—")
      : String((order.deliveryAddress as string | undefined)?.split(",")[0] ?? "—"),
    createdAt: String(order.created_at ?? order.createdAt ?? new Date().toISOString()),
    total: Number(order.total ?? 0),
    status: (order.status ?? "pending") as OrderStatus,
  };
}


const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const REVENUE_VALUES = [312000, 428000, 541000, 380000, 623000, 568000, 657000, 485000, 610000, 519000, 637000, 693000];

function RevenueChart() {
  const [hovered, setHovered] = useState<number | null>(null);
  const maxVal = Math.max(...REVENUE_VALUES);
  const currentMonth = new Date().getMonth();
  return (
    <div>
      <div className="flex items-end gap-1.5 h-28 mt-1">
        {REVENUE_VALUES.map((v, i) => {
          const pct = (v / maxVal) * 100;
          const isCurrent = i === currentMonth;
          const isHovered = hovered === i;
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-end justify-end h-full cursor-default"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {isHovered && (
                <span className="text-[9px] font-bold text-foreground mb-0.5 text-center leading-none">
                  {(v / 1000).toFixed(0)}k
                </span>
              )}
              <div
                className={`w-full rounded-t-md transition-all duration-150 ${isCurrent ? "bg-brand-500" : isHovered ? "bg-brand-400" : "bg-brand-200"}`}
                style={{ height: `${pct}%`, minHeight: "4px" }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex mt-1.5">
        {MONTHS.map((m, i) => (
          <span key={m} className={`text-[9px] font-medium flex-1 text-center ${i === currentMonth ? "text-brand-500" : "text-muted-foreground"}`}>
            {m.slice(0, 1)}
          </span>
        ))}
      </div>
      {hovered !== null ? (
        <p className="text-xs text-foreground font-semibold mt-1.5">{MONTHS[hovered]}: {formatPHP(REVENUE_VALUES[hovered])}</p>
      ) : (
        <p className="text-[11px] text-muted-foreground mt-1.5">Hover a bar for monthly total</p>
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [timeStr, setTimeStr] = useState<string>("");
  const [dateStr, setDateStr] = useState<string>("");
  const [stats, setStats] = useState<AdminStats>(ADMIN_STATS);
  const [recentOrders, setRecentOrders] = useState<DisplayOrder[]>(
    ADMIN_RECENT_ORDERS.map(normalizeOrder)
  );
  const [usingFallback, setUsingFallback] = useState(false);
  const [loading, setLoading] = useState(true);

  // Clock
  useEffect(() => {
    const update = () => {
      setTimeStr(new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" }));
      setDateStr(new Date().toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" }));
    };
    update();
    const t = setInterval(update, 60000);
    return () => clearInterval(t);
  }, []);

  // Fetch live stats — auto-refreshes every 30s
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      if (data.stats) setStats(data.stats as AdminStats);
      if (Array.isArray(data.recentOrders) && data.recentOrders.length > 0) {
        setRecentOrders(data.recentOrders.map(normalizeOrder));
        setUsingFallback(false);
      }
    } catch {
      // Fall back to mock data for recentOrders; stats already has ADMIN_STATS as default
      setRecentOrders(ADMIN_RECENT_ORDERS.map(normalizeOrder));
      setUsingFallback(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const statCards = [
    {
      label: "Orders Today",
      value: stats.ordersToday.toString(),
      change: "+12% vs yesterday",
      up: true,
      icon: ShoppingCart,
      href: "/admin/orders",
      color: "text-info-600 bg-info-50",
    },
    {
      label: "Revenue Today",
      value: formatPHP(stats.revenueToday),
      change: "+8% vs yesterday",
      up: true,
      icon: TrendingUp,
      href: "/admin/reports",
      color: "text-success-600 bg-success-50",
    },
    {
      label: "Active Retailers",
      value: stats.activeRetailers.toString(),
      change: `+${stats.newRetailersMonth} this month`,
      up: true,
      icon: Users,
      href: "/admin/retailers",
      color: "text-brand-600 bg-brand-50",
    },
    {
      label: "Low Stock Items",
      value: stats.lowStockItems.toString(),
      change: "Needs attention",
      up: false,
      icon: AlertTriangle,
      href: "/admin/inventory",
      color: "text-warning-600 bg-warning-50",
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {dateStr}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {timeStr || "--:--"}
          </span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-9 w-9 rounded-xl animate-pulse bg-muted" />
                </div>
                <div className="h-8 w-20 rounded animate-pulse bg-muted mb-2" />
                <div className="h-3 w-28 rounded animate-pulse bg-muted mb-1" />
                <div className="h-3 w-20 rounded animate-pulse bg-muted" />
              </CardContent>
            </Card>
          ))
        ) : (
          statCards.map((s) => (
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
          ))
        )}
      </div>

      {/* Revenue summary */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Monthly Revenue</CardTitle>
              {loading ? (
                <div className="h-8 w-28 rounded animate-pulse bg-muted" />
              ) : (
                <span className="text-2xl font-bold text-foreground">{formatPHP(stats.revenueMonth)}</span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <RevenueChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Pending Actions</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Orders to pick", count: stats.pendingOrders, color: "text-warning-600 bg-warning-50", href: "/admin/fulfillment" },
              { label: "Orders to pack", count: stats.processingOrders, color: "text-info-600 bg-info-50", href: "/admin/fulfillment" },
              { label: "Out for delivery", count: stats.outForDelivery, color: "text-brand-600 bg-brand-50", href: "/admin/delivery" },
              { label: "Low stock items", count: stats.lowStockItems, color: "text-danger-600 bg-danger-50", href: "/admin/inventory" },
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

      {/* Fallback banner */}
      {usingFallback && !loading && (
        <div className="rounded-xl border border-warning-200 bg-warning-50 px-4 py-2.5 text-sm text-warning-700 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Unable to load live data — showing cached orders. Check your connection or API status.
        </div>
      )}

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
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-5 py-3.5"><div className="h-4 w-32 rounded animate-pulse bg-muted" /></td>
                      <td className="px-5 py-3.5 hidden md:table-cell"><div className="h-4 w-24 rounded animate-pulse bg-muted" /></td>
                      <td className="px-5 py-3.5 hidden lg:table-cell"><div className="h-4 w-20 rounded animate-pulse bg-muted" /></td>
                      <td className="px-5 py-3.5 text-right"><div className="h-4 w-16 rounded animate-pulse bg-muted ml-auto" /></td>
                      <td className="px-5 py-3.5 text-right"><div className="h-5 w-16 rounded-full animate-pulse bg-muted ml-auto" /></td>
                    </tr>
                  ))
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <Link href={`/admin/orders/${order.id}`} className="font-medium text-foreground hover:text-brand-500">
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell">{order.storeName}</td>
                      <td className="px-5 py-3.5 text-muted-foreground hidden lg:table-cell text-xs">{formatDateTime(order.createdAt)}</td>
                      <td className="px-5 py-3.5 text-right font-semibold text-foreground">{formatPHP(order.total)}</td>
                      <td className="px-5 py-3.5 text-right"><StatusBadge status={order.status} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
