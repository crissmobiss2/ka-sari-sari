"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatPHP } from "@/lib/utils";
import { MOCK_ORDERS } from "@/lib/mock-data";

// Back arrow icon
function ArrowLeftIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

// Rich mock customer data keyed by order id
const CUSTOMER_DETAILS: Record<string, {
  name: string;
  address: string;
  phone: string;
  landmark: string;
  area: string;
}> = {
  "ord-001": {
    name: "Maria Santos",
    address: "123 Rizal St., Barangay 5, Caloocan City",
    phone: "+639171234567",
    landmark: "Near Jollibee corner Rizal",
    area: "Brgy. 5, Caloocan",
  },
  "ord-002": {
    name: "Roberto Cruz",
    address: "45 Mabini Ave., Barangay 8, Caloocan City",
    phone: "+639182345678",
    landmark: "Blue gate, 2nd house from sari-sari store",
    area: "Brgy. 8, Caloocan",
  },
  "ord-003": {
    name: "Lina Reyes",
    address: "78 Del Pilar Ext., Barangay 5, Caloocan City",
    phone: "+639193456789",
    landmark: "White bungalow, red roof",
    area: "Brgy. 5, Caloocan",
  },
  "ord-004": {
    name: "Fernando Delos Reyes",
    address: "88 Sampaguita St., Brgy. Bagong Barrio, Caloocan",
    phone: "+639204567890",
    landmark: "Green fence, beside the chapel",
    area: "Brgy. Bagong Barrio, Caloocan",
  },
};

const PRODUCT_NAME_MAP: Record<string, string> = {
  "prod-1": "Coca-Cola Regular 330ml",
  "prod-2": "Lucky Me! Pancit Canton Original",
  "prod-3": "Piattos Cheese 85g",
  "prod-4": "555 Sardines in Tomato Sauce 155g",
  "prod-5": "Nescafé 3-in-1 Original 20g x 10",
  "prod-6": "Safeguard Classic Bar 60g",
  "prod-7": "Silver Swan Soy Sauce 1L",
  "prod-8": "Surf Powder Detergent 80g x 6",
};

export default function DeliveryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const order = MOCK_ORDERS.find((o) => o.id === id) ?? MOCK_ORDERS[0];
  const customer = CUSTOMER_DETAILS[order.id] ?? CUSTOMER_DETAILS["ord-001"];

  const isCOD = order.paymentMethod === "cod";

  const [cashCollected, setCashCollected] = useState(false);
  const [delivered, setDelivered] = useState(false);
  const [deliveredAt, setDeliveredAt] = useState<string | null>(null);

  function handleDeliver() {
    const now = new Intl.DateTimeFormat("en-PH", {
      hour: "2-digit",
      minute: "2-digit",
      month: "short",
      day: "numeric",
    }).format(new Date());
    setDeliveredAt(now);
    setDelivered(true);
  }

  // Confirmation screen
  if (delivered) {
    return (
      <div className="px-4 py-8 flex flex-col items-center gap-6 min-h-[60vh] justify-center">
        <div className="w-20 h-20 rounded-full bg-success-50 border-2 border-success-500 flex items-center justify-center">
          <CheckCircleIcon className="w-10 h-10 text-success-600" />
        </div>
        <div className="text-center">
          <h2 className="font-display text-2xl font-bold text-foreground mb-1">Delivered!</h2>
          <p className="text-muted-foreground text-sm">{order.orderNumber}</p>
          <p className="text-muted-foreground text-sm">{deliveredAt}</p>
        </div>
        <div className="w-full bg-success-50 rounded-2xl p-4 border border-success-500/20 text-center">
          <p className="text-sm text-success-700 font-medium">Successfully delivered to {customer.name}</p>
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push("/driver/deliveries")}
        >
          Back to Deliveries
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Back header */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <Link href="/driver/deliveries" className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors">
          <ArrowLeftIcon />
        </Link>
        <div>
          <h1 className="font-display text-base font-bold text-foreground leading-tight">Delivery Detail</h1>
          <p className="text-xs text-muted-foreground">{order.orderNumber}</p>
        </div>
      </div>

      <div className="px-4 pb-6 flex flex-col gap-4">
        {/* Customer info card */}
        <Card className="p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Customer</p>
          <h2 className="font-display text-lg font-bold text-foreground mb-1">{customer.name}</h2>
          <p className="text-sm text-muted-foreground mb-0.5">{customer.address}</p>
          <p className="text-xs text-muted-foreground mb-3">
            <span className="font-medium text-foreground">Landmark:</span> {customer.landmark}
          </p>
          {/* Tap to call */}
          <a
            href={`tel:${customer.phone}`}
            className="flex items-center gap-2 w-full px-4 py-3 rounded-xl bg-brand-50 border border-brand-200 text-brand-700 font-medium text-sm active:bg-brand-100 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 014.31 11a19.79 19.79 0 01-3.07-8.67A2 2 0 013.22 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L7.91 7.91a16 16 0 006.18 6.18l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
            </svg>
            Call {customer.phone}
          </a>
        </Card>

        {/* Order items */}
        <Card className="p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Order Items</p>
          <div className="flex flex-col gap-2">
            {order.items.length > 0 ? order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground font-medium truncate">
                    {PRODUCT_NAME_MAP[item.productId] ?? item.productId}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.quantity} × {formatPHP(item.unitPrice)}
                  </p>
                </div>
                <p className="text-sm font-bold tabular-nums text-foreground flex-shrink-0">
                  {formatPHP(item.totalPrice)}
                </p>
              </div>
            )) : (
              // Fallback items for orders with no items
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm text-foreground font-medium">Assorted goods</p>
                  <p className="text-xs text-muted-foreground">1 × {formatPHP(order.subtotal)}</p>
                </div>
                <p className="text-sm font-bold tabular-nums text-foreground">{formatPHP(order.subtotal)}</p>
              </div>
            )}
          </div>
          <div className="mt-3 pt-3 border-t border-border flex flex-col gap-1">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatPHP(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Delivery fee</span>
              <span className="tabular-nums">{formatPHP(order.deliveryFee)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-foreground">
              <span>Total</span>
              <span className="tabular-nums">{formatPHP(order.total)}</span>
            </div>
          </div>
        </Card>

        {/* Payment section */}
        <Card className={cn("p-4", isCOD && "border-brand-300 bg-brand-50/30")}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payment</p>
            <Badge variant={isCOD ? "default" : "info"}>
              {order.paymentMethod.toUpperCase()}
            </Badge>
          </div>
          {isCOD ? (
            <>
              <p className="text-xs text-muted-foreground mb-2">Collect from customer</p>
              <p className="font-display text-3xl font-bold text-brand-500 tabular-nums">
                {formatPHP(order.total)}
              </p>
              {/* Cash collected toggle */}
              <button
                onClick={() => setCashCollected(!cashCollected)}
                className={cn(
                  "mt-4 w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-all font-medium text-sm",
                  cashCollected
                    ? "border-success-500 bg-success-50 text-success-700"
                    : "border-border bg-background text-foreground"
                )}
              >
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                  cashCollected ? "border-success-500 bg-success-500" : "border-surface-300"
                )}>
                  {cashCollected && (
                    <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                {cashCollected ? "Cash Collected" : "Mark Cash as Collected"}
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-success-50 flex items-center justify-center">
                <svg className="w-4 h-4 text-success-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="text-sm text-success-700 font-medium">Payment already received — {order.paymentMethod.toUpperCase()}</p>
            </div>
          )}
        </Card>

        {/* Notes */}
        {order.notes && (
          <div className="px-4 py-3 rounded-xl bg-warning-50 border border-warning-500/25">
            <p className="text-xs font-semibold text-warning-600 uppercase tracking-wider mb-1">Note from customer</p>
            <p className="text-sm text-foreground">{order.notes}</p>
          </div>
        )}

        {/* Delivery actions */}
        <div className="flex flex-col gap-3 pt-2">
          <Button
            size="lg"
            className={cn(
              "w-full h-14 text-base font-semibold rounded-2xl transition-all",
              isCOD && !cashCollected
                ? "bg-surface-200 text-surface-500 cursor-not-allowed"
                : "bg-success-600 hover:bg-success-700 text-white shadow-card-md"
            )}
            disabled={isCOD && !cashCollected}
            onClick={handleDeliver}
          >
            {isCOD && !cashCollected ? "Collect cash first" : "Mark as Delivered"}
          </Button>
          {isCOD && !cashCollected && (
            <p className="text-center text-xs text-muted-foreground">
              Toggle "Cash Collected" above before marking delivered
            </p>
          )}
          <Button
            size="lg"
            variant="outline"
            className="w-full h-12 border-danger-300 text-danger-600 hover:bg-danger-50"
          >
            Failed Delivery
          </Button>
        </div>
      </div>
    </div>
  );
}
