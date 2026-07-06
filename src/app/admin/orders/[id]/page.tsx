"use client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package, MapPin, CreditCard, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { formatPHP, formatDateTime, type OrderStatus, ORDER_STATUS_LABELS } from "@/lib/utils";
import { ADMIN_RECENT_ORDERS, MOCK_ORDERS, PRODUCTS } from "@/lib/mock-data";
import { useOrdersStore } from "@/store/orders";
import { toastSuccess } from "@/store/toast";

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: "confirmed",
  confirmed: "picking",
  picking: "packed",
  packed: "out_for_delivery",
  out_for_delivery: "delivered",
};

const TERMINAL_STATUSES: OrderStatus[] = ["delivered", "cancelled", "failed_delivery", "returned"];

export default function AdminOrderDetailPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const storeOrders = useOrdersStore((s) => s.orders);
  const advance = useOrdersStore((s) => s.advance);

  // Look up order: store first (live status), then ADMIN_RECENT_ORDERS, then MOCK_ORDERS, then first available
  const storeOrder = storeOrders.find((o) => o.id === id);
  const adminOrder = ADMIN_RECENT_ORDERS.find((o) => o.id === id);
  const mockOrder = MOCK_ORDERS.find((o) => o.id === id);

  const baseOrder = storeOrder ?? adminOrder ?? mockOrder ?? storeOrders[0] ?? ADMIN_RECENT_ORDERS[0];

  // Overlay live status from store if the store knows this order
  const liveStatus = storeOrder?.status ?? baseOrder.status;
  const order = { ...baseOrder, status: liveStatus };

  const nextStatus = NEXT_STATUS[order.status];
  const isTerminal = TERMINAL_STATUSES.includes(order.status);

  function handleAdvance() {
    advance(order.id);
    const next = NEXT_STATUS[order.status];
    const label = next ? ORDER_STATUS_LABELS[next] : "next status";
    toastSuccess(`Order ${order.orderNumber} marked as ${label}`);
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
                <span className={`font-semibold ${order.paymentStatus === "paid" ? "text-success-600" : "text-warning-600"}`}>
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
        </div>
      </div>
    </div>
  );
}
