"use client";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Package, MapPin, CreditCard, CheckCircle2, Clock, Truck, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { formatPHP, formatDateTime, type OrderStatus, ORDER_STATUS_LABELS } from "@/lib/utils";
import { PRODUCTS } from "@/lib/mock-data";
import { useOrdersStore } from "@/store/orders";
import { toastSuccess, toastError } from "@/store/toast";

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: "confirmed",
  confirmed: "picking",
  picking: "packed",
  packed: "out_for_delivery",
  out_for_delivery: "delivered",
};

const TERMINAL_STATUSES: OrderStatus[] = ["delivered", "cancelled", "failed_delivery", "returned"];

// Statuses where a driver can be assigned
const ASSIGNABLE_STATUSES: OrderStatus[] = ["confirmed", "picking", "packed"];

export default function AdminOrderDetailPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  // API-fetched order data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [apiOrder, setApiOrder] = useState<any | null>(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Driver assignment state
  const [driverId, setDriverId] = useState("");
  const [assigning, setAssigning] = useState(false);

  // Cancel order state
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [showCancelForm, setShowCancelForm] = useState(false);

  // Local status override (after API actions)
  const [localStatus, setLocalStatus] = useState<OrderStatus | null>(null);

  const storeOrders = useOrdersStore((s) => s.orders);
  const advance = useOrdersStore((s) => s.advance);
  const storeDispatch = useOrdersStore((s) => s.dispatch);

  // Fetch order from API on mount
  useEffect(() => {
    if (!id) return;
    setFetchLoading(true);
    setFetchError(null);
    fetch(`/api/admin/orders/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setApiOrder(data.order ?? data);
      })
      .catch((err) => {
        setFetchError(err.message ?? "Failed to load order");
      })
      .finally(() => setFetchLoading(false));
  }, [id]);

  // Look up order: API response first, then Zustand store as live fallback
  const storeOrder = storeOrders.find((o) => o.id === id);
  const baseOrder = apiOrder ?? storeOrder;

  if (fetchLoading) {
    return (
      <div className="p-6 space-y-5 max-w-4xl mx-auto animate-pulse">
        <div className="h-5 w-32 rounded-xl bg-muted" />
        <div className="h-8 w-64 rounded-xl bg-muted" />
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 h-64 rounded-2xl bg-muted" />
          <div className="space-y-4">
            <div className="h-32 rounded-2xl bg-muted" />
            <div className="h-24 rounded-2xl bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (fetchError || !baseOrder) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Link href="/admin/orders" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Orders
        </Link>
        <div className="rounded-2xl border border-danger-200 bg-danger-50 p-8 text-center">
          <XCircle className="h-10 w-10 text-danger-400 mx-auto mb-3" />
          <p className="font-semibold text-danger-700">Failed to load order</p>
          <p className="text-sm text-danger-700 dark:text-danger-500 mt-1">{fetchError ?? "Order not found"}</p>
          <Button size="sm" variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Overlay live status from store if the store knows this order
  const liveStatus: OrderStatus = (storeOrder?.status ?? baseOrder.status) as OrderStatus;
  const effectiveStatus: OrderStatus = localStatus ?? liveStatus;
  // Cast to a known shape so downstream access is typed
  const order = { ...baseOrder, status: effectiveStatus } as {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    deliveryAddress: string;
    notes?: string;
    paymentMethod: string;
    paymentStatus: string;
    subtotal: number;
    deliveryFee: number;
    total: number;
    createdAt: string;
    updatedAt: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: any[];
  };

  const nextStatus = NEXT_STATUS[order.status];
  const isTerminal = TERMINAL_STATUSES.includes(order.status);
  const canAssignDriver = ASSIGNABLE_STATUSES.includes(order.status);

  async function handleAdvance() {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    const label = ORDER_STATUS_LABELS[next] ?? "next status";
    advance(order.id);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        toastError(`Failed to update order status. Please refresh.`);
        return;
      }
      toastSuccess(`Order ${order.orderNumber} marked as ${label}`);
    } catch {
      toastError("Network error. Please check your connection.");
    }
  }

  async function handleAssignDriver() {
    if (!driverId.trim()) return;
    setAssigning(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "assign_driver", driverId: driverId.trim() }),
      });
      if (!res.ok) throw new Error("Failed");
      storeDispatch(order.id, driverId.trim());
      setLocalStatus("out_for_delivery");
      toastSuccess(`Driver assigned — Order ${order.orderNumber} dispatched`);
      setDriverId("");
    } catch {
      toastError("Failed to assign driver. Please try again.");
    } finally {
      setAssigning(false);
    }
  }

  async function handleCancelOrder() {
    if (!cancelReason.trim()) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", reason: cancelReason.trim() }),
      });
      if (!res.ok) throw new Error("Failed");
      setLocalStatus("cancelled");
      toastSuccess(`Order ${order.orderNumber} has been cancelled`);
      setShowCancelForm(false);
      setCancelReason("");
    } catch {
      toastError("Failed to cancel order. Please try again.");
    } finally {
      setCancelling(false);
    }
  }

  // Resolve items: use order.items if present, else show a placeholder row
  const resolvedItems = order.items.length > 0
    ? order.items.map((item) => {
        const product = PRODUCTS.find((p) => p.id === item.productId);
        return {
          name: product?.name ?? item.productId,
          brand: product?.brand ?? "—",
          qty: item.quantity,
          price: item.unitPrice,
          total: item.totalPrice,
        };
      })
    : null;

  return (
    <div className="p-6 space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/admin/orders" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Orders
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-medium text-foreground">{order.orderNumber}</span>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{formatDateTime(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={order.status} />
          {!isTerminal && nextStatus && (
            <Button size="md" onClick={handleAdvance}>
              <CheckCircle2 className="h-4 w-4" />
              Mark as {ORDER_STATUS_LABELS[nextStatus]}
            </Button>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Order items */}
        <Card className="md:col-span-2">
          <CardHeader><CardTitle>Order Items</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {resolvedItems ? (
                resolvedItems.map((item) => (
                  <div key={`${item.name}-${item.qty}`} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="h-9 w-9 rounded-xl bg-surface-100 flex items-center justify-center shrink-0">
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.brand} · Qty: {item.qty}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">{formatPHP(item.total)}</p>
                      <p className="text-xs text-muted-foreground">{formatPHP(item.price)}/ea</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-3 px-5 py-4 text-sm text-muted-foreground">
                  <Package className="h-4 w-4 shrink-0" />
                  <span>Item details not available for this order.</span>
                </div>
              )}
            </div>
            <div className="border-t border-border px-5 py-4 space-y-1.5">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal</span><span>{formatPHP(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Delivery fee</span><span>{formatPHP(order.deliveryFee)}</span>
              </div>
              <div className="flex justify-between font-bold text-foreground border-t border-border pt-2">
                <span>Total</span><span>{formatPHP(order.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Side details */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Delivery</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-foreground">{order.deliveryAddress}</p>
              </div>
              {order.notes && (
                <p className="text-xs text-muted-foreground italic">{order.notes}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Payment</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground capitalize">{order.paymentMethod.replace(/_/g, " ")}</span>
                <span className={`font-semibold ${order.paymentStatus === "paid" ? "text-success-700" : "text-warning-700"}`}>
                  {order.paymentStatus === "paid" ? "Paid" : "Pending"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-bold text-foreground">{formatPHP(order.total)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { label: "Order placed", time: order.createdAt },
                  { label: ORDER_STATUS_LABELS[order.status], time: order.updatedAt },
                ].map((ev) => (
                  <div key={ev.label} className="flex items-start gap-2.5 text-sm">
                    <div className="mt-0.5 h-2 w-2 rounded-full bg-brand-500 shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">{ev.label}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(ev.time)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Admin Actions — driver assignment + cancel */}
          {!isTerminal && (
            <Card>
              <CardHeader><CardTitle>Admin Actions</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {/* Assign & Dispatch — only when order is ready */}
                {canAssignDriver && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <Truck className="h-3.5 w-3.5" /> Assign Driver
                    </p>
                    <input
                      type="text"
                      value={driverId}
                      onChange={(e) => setDriverId(e.target.value)}
                      placeholder="Driver ID or name"
                      className="w-full h-9 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      onKeyDown={(e) => { if (e.key === "Enter") handleAssignDriver(); }}
                    />
                    <Button
                      size="sm"
                      className="w-full bg-brand-700 hover:bg-brand-800 text-white"
                      onClick={handleAssignDriver}
                      disabled={!driverId.trim() || assigning}
                    >
                      <Truck className="h-3.5 w-3.5" />
                      {assigning ? "Dispatching…" : "Assign & Dispatch"}
                    </Button>
                  </div>
                )}

                {/* Cancel Order */}
                <div className="space-y-2">
                  {!showCancelForm ? (
                    <button
                      onClick={() => setShowCancelForm(true)}
                      className="w-full rounded-xl border border-danger-200 text-danger-700 dark:text-danger-500 py-2 text-sm font-semibold hover:bg-danger-50 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <XCircle className="h-3.5 w-3.5" /> Cancel Order
                    </button>
                  ) : (
                    <>
                      <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                        <XCircle className="h-3.5 w-3.5 text-danger-500" /> Cancellation Reason
                      </p>
                      <input
                        type="text"
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder="e.g. Out of stock"
                        className="w-full h-9 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-danger-500"
                        autoFocus
                        onKeyDown={(e) => { if (e.key === "Enter") handleCancelOrder(); }}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => { setShowCancelForm(false); setCancelReason(""); }}
                        >
                          Back
                        </Button>
                        <button
                          onClick={handleCancelOrder}
                          disabled={!cancelReason.trim() || cancelling}
                          className="flex-1 rounded-xl bg-danger-500 text-white py-1.5 text-sm font-semibold hover:bg-danger-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {cancelling ? "Cancelling…" : "Confirm Cancel"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
