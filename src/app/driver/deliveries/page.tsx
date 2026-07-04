"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatPHP } from "@/lib/utils";
import { MOCK_ORDERS } from "@/lib/mock-data";
import type { Order } from "@/types";

// Use first 4 orders as today's deliveries with mock stop numbers and statuses
const TODAY_DELIVERIES: Array<Order & { stopNumber: number; deliveryStatus: "pending" | "delivered" | "failed" }> = [
  { ...MOCK_ORDERS[0], stopNumber: 1, deliveryStatus: "pending" },
  { ...MOCK_ORDERS[1], stopNumber: 2, deliveryStatus: "delivered" },
  { ...MOCK_ORDERS[2], stopNumber: 3, deliveryStatus: "pending" },
  // Extra synthetic entries from admin orders mock
  {
    id: "ord-004",
    orderNumber: "KSS-2025-00139",
    storeId: "store-2",
    userId: "user-2",
    status: "out_for_delivery",
    paymentStatus: "paid",
    paymentMethod: "maya",
    subtotal: 860,
    deliveryFee: 80,
    total: 940,
    deliveryAddress: "88 Sampaguita St., Brgy. Bagong Barrio, Caloocan",
    items: [
      { id: "oi-7", orderId: "ord-004", productId: "prod-3", quantity: 10, unitPrice: 38, totalPrice: 380, status: "picked" as const, fulfilledQty: 10 },
      { id: "oi-8", orderId: "ord-004", productId: "prod-5", quantity: 5, unitPrice: 85, totalPrice: 425, status: "picked" as const, fulfilledQty: 5 },
    ],
    fulfillmentEvents: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    stopNumber: 4,
    deliveryStatus: "failed",
  },
];

// Derive customer names from a mock map
const CUSTOMER_NAMES: Record<string, string> = {
  "ord-001": "Maria Santos",
  "ord-002": "Roberto Cruz",
  "ord-003": "Lina Reyes",
  "ord-004": "Fernando Delos Reyes",
};

const AREA_LABELS: Record<string, string> = {
  "ord-001": "Brgy. 5, Caloocan",
  "ord-002": "Brgy. 5, Caloocan",
  "ord-003": "Brgy. 5, Caloocan",
  "ord-004": "Brgy. Bagong Barrio, Caloocan",
};

type FilterTab = "all" | "pending" | "delivered" | "failed";

const TABS: { id: FilterTab; label: string }[] = [
  { id: "all",       label: "All" },
  { id: "pending",   label: "Pending" },
  { id: "delivered", label: "Delivered" },
  { id: "failed",    label: "Failed" },
];

function statusVariant(s: string): "success" | "danger" | "warning" | "neutral" {
  if (s === "delivered") return "success";
  if (s === "failed")    return "danger";
  return "warning";
}

function paymentBadge(method: string): { label: string; variant: "default" | "info" | "success" | "neutral" } {
  if (method === "cod")   return { label: "COD",   variant: "default" };
  if (method === "gcash") return { label: "GCash", variant: "info" };
  if (method === "maya")  return { label: "Maya",  variant: "success" };
  return { label: method.toUpperCase(), variant: "neutral" };
}

export default function DeliveriesPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const filtered = TODAY_DELIVERIES.filter((d) =>
    activeTab === "all" ? true : d.deliveryStatus === activeTab
  ).sort((a, b) => {
    // Pending first, delivered/failed last
    if (a.deliveryStatus === "pending" && b.deliveryStatus !== "pending") return -1;
    if (a.deliveryStatus !== "pending" && b.deliveryStatus === "pending") return 1;
    return a.stopNumber - b.stopNumber;
  });

  const counts = {
    all:       TODAY_DELIVERIES.length,
    pending:   TODAY_DELIVERIES.filter(d => d.deliveryStatus === "pending").length,
    delivered: TODAY_DELIVERIES.filter(d => d.deliveryStatus === "delivered").length,
    failed:    TODAY_DELIVERIES.filter(d => d.deliveryStatus === "failed").length,
  };

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="px-4 pt-5 pb-3">
        <h1 className="font-display text-xl font-bold text-foreground">Today's Deliveries</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{counts.pending} pending · {counts.delivered} done</p>
      </div>

      {/* Filter tabs */}
      <div className="px-4 mb-4">
        <div className="flex gap-2 p-1 bg-muted rounded-xl">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === tab.id
                  ? "bg-card text-foreground shadow-card"
                  : "text-muted-foreground"
              )}
            >
              {tab.label}
              {counts[tab.id] > 0 && (
                <span className={cn(
                  "ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-2xs font-bold",
                  activeTab === tab.id ? "bg-brand-500 text-white" : "bg-surface-200 text-surface-600"
                )}>
                  {counts[tab.id]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Delivery list */}
      <div className="px-4 flex flex-col gap-3 pb-4">
        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground text-sm">No {activeTab} deliveries</p>
          </div>
        )}
        {filtered.map((delivery) => {
          const pm = paymentBadge(delivery.paymentMethod);
          const isCOD = delivery.paymentMethod === "cod";

          return (
            <Link key={delivery.id} href={`/driver/deliveries/${delivery.id}`}>
              <Card
                className={cn(
                  "p-4 active:scale-[0.98] transition-transform",
                  isCOD && delivery.deliveryStatus === "pending" && "border-brand-300 bg-brand-50/30"
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Stop number badge */}
                  <div className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-display text-sm font-bold",
                    delivery.deliveryStatus === "delivered" ? "bg-success-50 text-success-700" :
                    delivery.deliveryStatus === "failed"    ? "bg-danger-50 text-danger-600" :
                    "bg-brand-500 text-white"
                  )}>
                    {delivery.stopNumber}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">
                          {CUSTOMER_NAMES[delivery.id] ?? "Customer"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {AREA_LABELS[delivery.id] ?? delivery.deliveryAddress}
                        </p>
                      </div>
                      <Badge variant={statusVariant(delivery.deliveryStatus)} className="flex-shrink-0 capitalize">
                        {delivery.deliveryStatus}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-muted-foreground">{delivery.orderNumber}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant={pm.variant}>{pm.label}</Badge>
                        <span className={cn(
                          "text-sm font-bold tabular-nums",
                          isCOD && delivery.deliveryStatus === "pending" ? "text-brand-500" : "text-foreground"
                        )}>
                          {formatPHP(delivery.total)}
                        </span>
                      </div>
                    </div>

                    {/* COD collect hint */}
                    {isCOD && delivery.deliveryStatus === "pending" && (
                      <div className="mt-2 flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
                        <p className="text-xs font-medium text-brand-600">Collect cash on delivery</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
