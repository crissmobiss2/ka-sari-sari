"use client";
import { Package, CheckCircle2, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { formatPHP, formatDateTime, type OrderStatus } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useOrdersStore, NEXT_STATUS } from "@/store/orders";
import Link from "next/link";

const LANES: { status: OrderStatus; label: string; color: string }[] = [
  { status: "confirmed",        label: "To Pick",         color: "border-t-warning-400" },
  { status: "picking",          label: "Picking",          color: "border-t-purple-400" },
  { status: "packed",           label: "Ready to Ship",    color: "border-t-info-400" },
  { status: "out_for_delivery", label: "Out for Delivery", color: "border-t-brand-400" },
];

export default function FulfillmentPage() {
  const orders = useOrdersStore((s) => s.orders);
  const advance = useOrdersStore((s) => s.advance);

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Fulfillment Board</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Pick, pack, and dispatch orders</p>
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
                {laneOrders.map((order) => (
                  <Card key={order.id} className={cn("border-t-2 hover:shadow-card-md transition-shadow", color)}>
                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{order.orderNumber}</p>
                          <p className="text-xs text-muted-foreground">{order.deliveryAddress.split(",")[0]}</p>
                        </div>
                        <StatusBadge status={order.status} />
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDateTime(order.createdAt)}</span>
                        </div>
                        <span className="font-medium text-foreground">{formatPHP(order.total)}</span>
                      </div>

                      {NEXT_STATUS[order.status] && (
                        <Button
                          size="sm"
                          className="w-full text-xs h-8"
                          onClick={() => advance(order.id)}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Mark as {NEXT_STATUS[order.status]?.replace(/_/g, " ")}
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}

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
