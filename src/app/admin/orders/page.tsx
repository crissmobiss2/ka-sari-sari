"use client";
import { useState } from "react";
import Link from "next/link";
import { Search, Filter, ArrowUpDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatPHP, formatDateTime, type OrderStatus, ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/lib/utils";
import { ADMIN_RECENT_ORDERS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const STATUS_TABS: { id: string; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "confirmed", label: "Confirmed" },
  { id: "picking", label: "Picking" },
  { id: "packed", label: "Packed" },
  { id: "out_for_delivery", label: "Out for Delivery" },
  { id: "delivered", label: "Delivered" },
];

export default function AdminOrdersPage() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const orders = ADMIN_RECENT_ORDERS.filter((o) => {
    if (activeTab !== "all" && o.status !== activeTab) return false;
    if (search && !o.orderNumber.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Orders</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage and track all store orders</p>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide border-b border-border pb-0">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
              activeTab === tab.id
                ? "border-brand-500 text-brand-600"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search by order number, store…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-input bg-card pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Order #</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Store</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">Date</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Payment</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Amount</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <Link href={`/admin/orders/${order.id}`} className="font-medium text-foreground hover:text-brand-500">
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell">{order.deliveryAddress.split(",")[0]}</td>
                  <td className="px-5 py-3.5 text-xs text-muted-foreground hidden lg:table-cell">{formatDateTime(order.createdAt)}</td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${order.paymentStatus === "paid" ? "bg-success-50 text-success-600" : "bg-warning-50 text-warning-600"}`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold text-foreground">{formatPHP(order.total)}</td>
                  <td className="px-5 py-3.5 text-right"><StatusBadge status={order.status} /></td>
                  <td className="px-5 py-3.5">
                    <Link href={`/admin/orders/${order.id}`} className="text-xs text-brand-500 hover:text-brand-600 font-medium">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {orders.length === 0 && (
          <div className="py-16 text-center text-muted-foreground text-sm">No orders found.</div>
        )}
      </Card>
    </div>
  );
}
