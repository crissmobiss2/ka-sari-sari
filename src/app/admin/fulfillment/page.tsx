"use client";
import { useEffect } from "react";
import { Package, CheckCircle2, Clock, AlertTriangle, Truck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { formatPHP, type OrderStatus } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useOrdersStore, NEXT_STATUS, type FulfillOrder } from "@/store/orders";

const LANES: { status: OrderStatus; label: string; color: string }[] = [
  { status: "confirmed",        label: "To Pick",          color: "border-t-warning-400" },
  { status: "picking",          label: "Picking",           color: "border-t-purple-400" },
  { status: "packed",           label: "Ready to Ship",     color: "border-t-info-400" },
  { status: "out_for_delivery", label: "Out for Delivery",  color: "border-t-brand-400" },
];

/** Returns how long ago an ISO date string was, as a short human-readable label. */
function getWaitLabel(isoDate: string): { label: string; overdue: boolean } {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1)  return { label: "Just now",              overdue: false };
  if (diffMin < 60) return { label: `${diffMin}m ago`,        overdue: false };

  const diffHr = Math.floor(diffMin / 60);
  const remMin = diffMin % 60;
  const label   = remMin > 0 ? `${diffHr}h ${remMin}m ago` : `${diffHr}h ago`;
  return { label, overdue: diffMin >= 120 };
}

/**
 * Returns a human-readable action label for the advance button.
 * For out_for_delivery, clarifies that this marks it delivered without driver
 * assignment (driver dispatch lives on the dispatch/routes page).
 */
function advanceLabel(status: OrderStatus): string {
  const next = NEXT_STATUS[status];
  if (!next) return "";
  if (next === "out_for_delivery") return "Send Out for Delivery";
  if (next === "delivered")        return "Mark Delivered";
  return `Mark as ${next.replace(/_/g, " ")}`;
}

export default function FulfillmentPage() {
  const orders    = useOrdersStore((s) => s.orders);
  const advance   = useOrdersStore((s) => s.advance);
  const setOrders = useOrdersStore((s) => s.setOrders);

  /** Advance an order's status: call API first, then update Zustand store. */
  async function advanceOrder(orderId: string, currentStatus: OrderStatus) {
    const nextSt = NEXT_STATUS[currentStatus];
    if (!nextSt) return;
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextSt }),
      });
      if (!res.ok) {
        window.location.reload();
        return;
      }
      advance(orderId);
    } catch {
      window.location.reload();
    }
  }

  useEffect(() => {
    fetch("/api/orders?status=confirmed,picking,packed,dispatched")
      .then((r) => r.json())
      .then((d) => {
        const apiOrders: FulfillOrder[] = d.orders ?? [];
        if (apiOrders.length > 0) {
          setOrders(
            apiOrders.map((o) => ({
              ...o,
              status: (o.status === "pending" ? "confirmed" : o.status) as OrderStatus,
            }))
          );
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Summary counts — derived from live store state
  const confirmedCount      = orders.filter((o) => o.status === "confirmed").length;
  const pickingCount        = orders.filter((o) => o.status === "picking").length;
  const packedCount         = orders.filter((o) => o.status === "packed").length;
  const outForDeliveryCount = orders.filter((o) => o.status === "out_for_delivery").length;

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Fulfillment Board</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Pick, pack, and dispatch orders</p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "To Pick",          count: confirmedCount,      color: "text-warning-700 dark:text-foreground" },
          { label: "Picking",          count: pickingCount,        color: "text-purple-600 dark:text-foreground" },
          { label: "Ready to Ship",    count: packedCount,         color: "text-info-600 dark:text-foreground" },
          { label: "Out for Delivery", count: outForDeliveryCount, color: "text-brand-600" },
        ].map(({ label, count, color }) => (
          <Card key={label} className="p-3 flex items-center gap-3">
            <Package className={cn("h-5 w-5 shrink-0", color)} />
            <div>
              <p className={cn("text-xl font-bold leading-none", color)}>{count}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {LANES.map(({ status, label, color }) => {
          const laneOrders = orders.filter((o) => o.status === status);
          return (
            <div key={status} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">{label}</h3>
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-surface-200 px-1.5 text-xs font-medium text-muted-foreground">
                    {laneOrders.length}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {laneOrders.map((order) => {
                  const { label: waitLabel, overdue } = getWaitLabel(order.createdAt);
                  const nextStatus = NEXT_STATUS[order.status];

                  return (
                    <Card key={order.id} className={cn("border-t-2 hover:shadow-card-md transition-shadow", color, overdue && "ring-1 ring-warning-300")}>
                      <div className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{order.orderNumber}</p>
                            <p className="text-xs text-muted-foreground">{order.deliveryAddress.split(",")[0]}</p>
                          </div>
                          <StatusBadge status={order.status} />
                        </div>

                        {/* Wait time row */}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className={cn("flex items-center gap-1", overdue && "text-warning-700 dark:text-foreground font-medium")}>
                            {overdue
                              ? <AlertTriangle className="h-3 w-3 text-warning-500" aria-label="Waiting over 2 hours" />
                              : <Clock className="h-3 w-3" />
                            }
                            <span>{waitLabel}</span>
                          </div>
                          <span className="font-medium text-foreground">{formatPHP(order.total)}</span>
                        </div>

                        {/* Advance button — only when a next status exists */}
                        {nextStatus && (
                          <Button
                            size="sm"
                            className="w-full text-xs h-8"
                            onClick={() => advanceOrder(order.id, order.status)}
                          >
                            {nextStatus === "out_for_delivery"
                              ? <Truck className="h-3.5 w-3.5" />
                              : <CheckCircle2 className="h-3.5 w-3.5" />
                            }
                            {advanceLabel(order.status)}
                          </Button>
                        )}

                        {/* Terminal state — no further action available in this board */}
                        {!nextStatus && (
                          <p className="text-center text-xs text-muted-foreground italic">
                            No further action
                          </p>
                        )}
                      </div>
                    </Card>
                  );
                })}

                {laneOrders.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                    No orders here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
