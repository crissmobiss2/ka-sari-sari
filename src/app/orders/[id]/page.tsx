"use client";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, Suspense } from "react";
import {
  ArrowLeft, Package, MapPin, CreditCard, CheckCircle2,
  Phone, Star, Truck, Clock, Download, MessageCircle,
  AlertCircle, CheckCheck, Circle, Navigation, ShoppingCart,
} from "lucide-react";
import { RetailerTopBar, RetailerBottomNav } from "@/components/layout/retailer-nav";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button, ButtonLink } from "@/components/ui/button";
import {
  formatPHP, formatDateTime,
  type OrderStatus, ORDER_STATUS_LABELS,
} from "@/lib/utils";
import { MOCK_ORDERS, PRODUCTS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart";
import type { OrderItem, Product } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type StepStatus = "done" | "current" | "upcoming";

interface TimelineStep {
  key: string;
  label: string;
  description: string;
  statuses: OrderStatus[];  // which order statuses map to this step
}

// ─── Constants ───────────────────────────────────────────────────────────────

// 5-step timeline as required
const DELIVERY_STEPS: TimelineStep[] = [
  {
    key: "placed",
    label: "Order Placed",
    description: "We received your order",
    statuses: ["pending"],
  },
  {
    key: "confirmed",
    label: "Confirmed",
    description: "Order accepted by warehouse",
    statuses: ["confirmed"],
  },
  {
    key: "picked_packed",
    label: "Picked & Packed",
    description: "Items prepared for delivery",
    statuses: ["picking", "packed"],
  },
  {
    key: "out_for_delivery",
    label: "Out for Delivery",
    description: "Driver is on the way",
    statuses: ["out_for_delivery"],
  },
  {
    key: "delivered",
    label: "Delivered",
    description: "Order successfully delivered",
    statuses: ["delivered"],
  },
];

// Maps an OrderStatus to the step index it belongs to
function getStepIndex(status: OrderStatus): number {
  for (let i = 0; i < DELIVERY_STEPS.length; i++) {
    if (DELIVERY_STEPS[i].statuses.includes(status)) return i;
  }
  return -1;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  gcash: "GCash",
  maya: "Maya",
  cod: "Cash on Delivery",
  bank_transfer: "Bank Transfer",
  credit: "Credit",
};

const PAYMENT_METHOD_COLORS: Record<string, string> = {
  gcash: "bg-blue-100 text-blue-700 border-blue-200",
  maya: "bg-green-100 text-green-700 border-green-200",
  cod: "bg-amber-100 text-amber-700 border-amber-200",
  bank_transfer: "bg-purple-100 text-purple-700 border-purple-200",
  credit: "bg-gray-100 text-gray-700 border-gray-200",
};

// Deterministic picsum seed from productId for stable thumbnails
function picsumUrl(productId: string, size = 80): string {
  const seed = productId.replace(/\D/g, "") || "1";
  return `https://picsum.photos/seed/prod${seed}/${size}/${size}`;
}

// ─── ConfirmBanner ────────────────────────────────────────────────────────────

function ConfirmBanner() {
  const params = useSearchParams();
  if (!params.get("confirmed")) return null;
  return (
    <div className="mx-4 mb-4 rounded-2xl bg-success-50 dark:bg-success-500/10 border border-success-500/25 p-4 flex items-start gap-3 animate-fade-in">
      <CheckCircle2 className="h-5 w-5 text-success-700 dark:text-success-500 shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-success-700 dark:text-foreground">Order placed successfully!</p>
        <p className="text-xs text-success-700 dark:text-foreground mt-0.5">We&apos;ll notify you when it&apos;s being prepared.</p>
      </div>
    </div>
  );
}

// ─── StatusHero ───────────────────────────────────────────────────────────────

function StatusHero({ status, createdAt }: { status: OrderStatus; createdAt: string }) {
  const isOutForDelivery = status === "out_for_delivery";
  const isDelivered = status === "delivered";
  const isCancelled = ["cancelled", "failed_delivery", "returned"].includes(status);
  const isPending = ["pending", "confirmed"].includes(status);

  const bannerClass = isOutForDelivery
    ? "bg-brand-700 text-white"
    : isDelivered
    ? "bg-success-700 text-white"
    : isCancelled
    ? "bg-danger-50 dark:bg-danger-500/10 text-danger-700 dark:text-foreground"
    : "bg-warning-50 dark:bg-warning-500/10 text-warning-700 dark:text-foreground";

  const label = ORDER_STATUS_LABELS[status] ?? status;

  const subtext = isOutForDelivery
    ? "Expected today by 5:00 PM"
    : isDelivered
    ? `Delivered ${formatDateTime(createdAt)}`
    : isPending
    ? "We received your order and are processing it"
    : `Updated ${formatDateTime(createdAt)}`;

  const Icon = isOutForDelivery
    ? Truck
    : isDelivered
    ? CheckCheck
    : isCancelled
    ? AlertCircle
    : Clock;

  return (
    <div className={cn("mx-4 rounded-2xl p-6 flex items-center gap-5", bannerClass)}>
      <div className={cn(
        "flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl",
        (isOutForDelivery || isDelivered) ? "bg-black/20" : "bg-white/60"
      )}>
        <Icon className={cn(
          "h-8 w-8",
          isOutForDelivery && "animate-bounce",
          (isOutForDelivery || isDelivered) ? "text-white" : ""
        )} />
      </div>
      <div>
        <p className={cn(
          "font-display text-2xl font-bold",
          !(isOutForDelivery || isDelivered) && "text-warning-800"
        )}>
          {isOutForDelivery ? "On the way!" : isDelivered ? "Delivered!" : label}
        </p>
        <p className={cn(
          "text-sm mt-1 font-medium",
          isOutForDelivery ? "" : isDelivered ? "" : isCancelled ? "text-danger-700 dark:text-foreground" : "text-warning-700 dark:text-foreground"
        )}>{subtext}</p>
      </div>
    </div>
  );
}

// ─── TrackingLink ─────────────────────────────────────────────────────────────

function TrackingLink({ orderId }: { orderId: string }) {
  // Include orderId in the tracking URL so it loads real data for this order
  const href = `/tracking?orderId=${encodeURIComponent(orderId)}`;
  return (
    <Link
      href={href}
      className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 active:scale-95 transition-all"
    >
      <Navigation className="h-4 w-4" />
      View Live Tracking
    </Link>
  );
}

// ─── DeliveryTimeline ─────────────────────────────────────────────────────────

function DeliveryTimeline({
  status,
  fulfillmentEvents,
  orderId,
}: {
  status: OrderStatus;
  fulfillmentEvents: Array<{ status: OrderStatus; createdAt: string }>;
  orderId: string;
}) {
  const isCancelled = ["cancelled", "failed_delivery", "returned"].includes(status);
  const currentStepIdx = getStepIndex(status);

  if (isCancelled) {
    return (
      <div className="rounded-2xl border border-border bg-card shadow-card p-5 mx-4">
        <div className="flex items-center gap-2 mb-1">
          <AlertCircle className="h-4 w-4 text-danger-600 dark:text-danger-500" />
          <h3 className="font-display text-sm font-semibold text-foreground">Order Status</h3>
        </div>
        <p className="text-sm text-danger-700 dark:text-foreground mt-1">
          This order was {ORDER_STATUS_LABELS[status]?.toLowerCase() ?? status.replace(/_/g, " ")}.
        </p>
      </div>
    );
  }

  // Build a lookup of event times by status
  const eventTimeByStatus = new Map<string, string>();
  for (const ev of fulfillmentEvents) {
    eventTimeByStatus.set(ev.status, ev.createdAt);
  }

  return (
    <div className="rounded-2xl border border-border bg-card shadow-card px-5 py-4 mx-4">
      <h3 className="font-display text-sm font-semibold text-foreground mb-4">Delivery Progress</h3>
      <div className="relative">
        {/* Vertical connector line */}
        <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-surface-200" />

        <div className="space-y-0">
          {DELIVERY_STEPS.map((step, idx) => {
            const stepStatus: StepStatus =
              idx < currentStepIdx ? "done"
              : idx === currentStepIdx ? "current"
              : "upcoming";

            // Get the timestamp from fulfillment events if available
            let timeLabel: string | undefined;
            if (stepStatus === "done") {
              // Try to find a matching event time for any of the step's statuses
              for (const s of step.statuses) {
                const t = eventTimeByStatus.get(s);
                if (t) { timeLabel = formatDateTime(t); break; }
              }
            }

            return (
              <div key={step.key} className="flex items-start gap-4 relative py-2.5">
                {/* Circle indicator */}
                <div className="relative z-10 shrink-0">
                  {stepStatus === "done" ? (
                    <div className="h-8 w-8 rounded-full bg-brand-700 flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    </div>
                  ) : stepStatus === "current" ? (
                    <div className="relative h-8 w-8">
                      <div className="absolute inset-0 rounded-full bg-brand-500/20 animate-ping" />
                      <div className="relative h-8 w-8 rounded-full border-2 border-brand-700 bg-white flex items-center justify-center">
                        <div className="h-2.5 w-2.5 rounded-full bg-brand-700" />
                      </div>
                    </div>
                  ) : (
                    <div className="h-8 w-8 rounded-full border-2 border-surface-200 bg-surface-50 dark:bg-surface-900 flex items-center justify-center">
                      <Circle className="h-2.5 w-2.5 text-surface-300" />
                    </div>
                  )}
                </div>

                {/* Step content */}
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={cn(
                        "text-sm font-semibold",
                        stepStatus === "done" ? "text-foreground"
                        : stepStatus === "current" ? "text-brand-700"
                        : "text-muted-foreground"
                      )}>
                        {step.label}
                      </p>
                      <p className={cn(
                        "text-xs mt-0.5",
                        stepStatus === "upcoming" ? "text-surface-300" : "text-muted-foreground"
                      )}>
                        {step.description}
                      </p>
                    </div>
                    {timeLabel && (
                      <span className="text-xs text-muted-foreground shrink-0">{timeLabel}</span>
                    )}
                  </div>
                  {stepStatus === "current" && (
                    <p className="text-xs text-brand-700 dark:text-brand-400 mt-1 flex items-center gap-1">
                      In progress
                      <span className="inline-flex gap-0.5">
                        <span className="animate-bounce" style={{ animationDelay: "0ms" }}>.</span>
                        <span className="animate-bounce" style={{ animationDelay: "150ms" }}>.</span>
                        <span className="animate-bounce" style={{ animationDelay: "300ms" }}>.</span>
                      </span>
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Link to live tracking when out for delivery */}
      {status === "out_for_delivery" && (
        <TrackingLink orderId={orderId} />
      )}
    </div>
  );
}

// ─── DeliveryAddress ──────────────────────────────────────────────────────────

function DeliveryAddress({ address, notes }: { address: string; notes?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-card p-5 mx-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-500/20">
          <MapPin className="h-4 w-4 text-brand-700 dark:text-brand-400" />
        </div>
        <h3 className="font-display text-sm font-semibold text-foreground">Delivery Address</h3>
      </div>
      <p className="text-sm font-medium text-foreground leading-relaxed">{address}</p>
      {notes && (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-warning-50 dark:bg-warning-500/10 border border-warning-200 p-3">
          <AlertCircle className="h-3.5 w-3.5 text-warning-700 dark:text-foreground mt-0.5 shrink-0" />
          <p className="text-xs text-warning-700 dark:text-foreground">{notes}</p>
        </div>
      )}
    </div>
  );
}

// ─── PaymentBadge ─────────────────────────────────────────────────────────────

function PaymentBadge({ method, paymentStatus }: { method: string; paymentStatus: string }) {
  const colorClass = PAYMENT_METHOD_COLORS[method] ?? "bg-gray-100 text-gray-700 border-gray-200";
  const label = PAYMENT_METHOD_LABELS[method] ?? method.replace(/_/g, " ");
  const isPaid = paymentStatus === "paid";

  return (
    <div className="flex items-center gap-2">
      <span className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
        colorClass
      )}>
        <CreditCard className="h-3 w-3" />
        {label}
      </span>
      <span className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        isPaid
          ? "bg-success-100 dark:bg-success-500/20 text-success-700 dark:text-foreground"
          : "bg-warning-100 dark:bg-warning-500/20 text-warning-700 dark:text-foreground"
      )}>
        {isPaid ? "Paid" : "Payment Pending"}
      </span>
    </div>
  );
}

// ─── OrderItems ───────────────────────────────────────────────────────────────

interface EnrichedItem {
  orderItem: OrderItem;
  product: Product | undefined;
}

function OrderItems({
  orderItems,
  subtotal,
  deliveryFee,
  total,
  paymentMethod,
  paymentStatus,
}: {
  orderItems: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
}) {
  // Enrich order items with product data from PRODUCTS catalog
  const enriched: EnrichedItem[] = orderItems.map((oi) => ({
    orderItem: oi,
    product: oi.product ?? PRODUCTS.find((p) => p.id === oi.productId),
  }));

  // Fallback rows if no items (e.g. admin orders with empty items array)
  const hasItems = enriched.length > 0;

  return (
    <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden mx-4">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-foreground">Order Items</h3>
        <span className="text-xs text-muted-foreground">
          {hasItems ? `${enriched.length} item${enriched.length !== 1 ? "s" : ""}` : ""}
        </span>
      </div>

      {/* Items list */}
      <div className="divide-y divide-border">
        {hasItems ? (
          enriched.map(({ orderItem, product }) => {
            const imgSeed = product?.id ?? orderItem.productId;
            const name = product?.name ?? `Product ${orderItem.productId}`;
            const unitLabel = product?.unit ?? "pc";
            const lineTotal = orderItem.totalPrice ?? (orderItem.unitPrice * orderItem.quantity);

            return (
              <div key={orderItem.id} className="flex items-center gap-3 px-5 py-3.5">
                {/* Thumbnail */}
                <div className="h-14 w-14 shrink-0 rounded-xl overflow-hidden bg-surface-100 dark:bg-surface-800 border border-border">
                  <Image
                    src={picsumUrl(imgSeed)}
                    alt={name}
                    width={56}
                    height={56}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground leading-tight line-clamp-2">{name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {orderItem.quantity} {unitLabel}
                    {unitLabel !== "pc" ? "s" : "s"} &times; {formatPHP(orderItem.unitPrice)}
                  </p>
                  {orderItem.status === "partial" && (
                    <p className="text-xs text-warning-700 dark:text-foreground mt-0.5">
                      Partial: {orderItem.fulfilledQty ?? "?"} fulfilled
                    </p>
                  )}
                  {orderItem.status === "unavailable" && (
                    <p className="text-xs text-danger-600 dark:text-danger-500 mt-0.5">Unavailable</p>
                  )}
                </div>

                {/* Line total */}
                <p className="text-sm font-bold text-foreground shrink-0">
                  {formatPHP(lineTotal)}
                </p>
              </div>
            );
          })
        ) : (
          <div className="flex items-center gap-3 px-5 py-4 text-sm text-muted-foreground">
            <Package className="h-4 w-4 shrink-0" />
            Item details unavailable
          </div>
        )}
      </div>

      {/* Totals */}
      <div className="border-t border-border bg-surface-50 dark:bg-surface-900 px-5 py-4 space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Subtotal</span>
          <span>{formatPHP(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Delivery fee</span>
          <span>{formatPHP(deliveryFee)}</span>
        </div>
        <div className="flex justify-between text-base font-bold text-foreground border-t border-border pt-2.5 mt-1">
          <span>Total</span>
          <span className="text-brand-700 dark:text-brand-400">{formatPHP(total)}</span>
        </div>
      </div>

      {/* Payment method & status */}
      <div className="border-t border-border px-5 py-3.5">
        <PaymentBadge method={paymentMethod} paymentStatus={paymentStatus} />
      </div>
    </div>
  );
}

// ─── ReorderButton ────────────────────────────────────────────────────────────

function ReorderButton({ orderItems }: { orderItems: OrderItem[] }) {
  const addItem = useCartStore((s) => s.addItem);
  const [done, setDone] = useState(false);

  function handleReorder() {
    const itemsToAdd = orderItems.filter((oi) => oi.status !== "unavailable");
    for (const oi of itemsToAdd) {
      const product = oi.product ?? PRODUCTS.find((p) => p.id === oi.productId);
      if (product) {
        addItem(product, oi.quantity);
      }
    }
    setDone(true);
    setTimeout(() => setDone(false), 3000);
  }

  return (
    <Button
      size="lg"
      className="w-full"
      onClick={handleReorder}
      disabled={done}
    >
      {done ? (
        <>
          <CheckCircle2 className="h-4 w-4" />
          Added to cart!
        </>
      ) : (
        <>
          <ShoppingCart className="h-4 w-4" />
          Reorder All Items
        </>
      )}
    </Button>
  );
}

// ─── DriverCard ───────────────────────────────────────────────────────────────

interface DriverInfo {
  name?: string;
  vehicle?: string;
  phone?: string;
  rating?: number;
}

function DriverCard({ onAction, driver }: { onAction: (msg: string) => void; driver?: DriverInfo }) {
  const name    = driver?.name    ?? "Your Driver";
  const vehicle = driver?.vehicle ?? "";
  const phone   = driver?.phone   ?? "";
  const rating  = driver?.rating  ?? 4.9;
  const initials = name.split(" ").filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "DR";
  const ratingFloor = Math.floor(rating);

  return (
    <div className="rounded-2xl border border-border bg-card shadow-card p-5 mx-4">
      <h3 className="font-display text-sm font-semibold text-foreground mb-4">Your Driver</h3>
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-100 dark:bg-brand-700 text-brand-600 dark:text-white font-display font-bold text-lg">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm">{name}</p>
          <div className="flex items-center gap-1 mt-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={cn(
                  "h-3 w-3",
                  s <= ratingFloor ? "fill-warning-400 text-warning-400" : "fill-warning-200 text-warning-200"
                )}
              />
            ))}
            <span className="text-xs text-muted-foreground ml-1">{rating.toFixed(1)}</span>
          </div>
          {vehicle && <p className="text-xs text-muted-foreground mt-0.5">{vehicle}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-4">
        {phone ? (
          <a
            href={`tel:${phone}`}
            className="flex items-center justify-center gap-2 rounded-xl border border-border bg-surface-50 dark:bg-surface-900 py-2.5 text-sm font-medium text-surface-900 hover:bg-surface-100 dark:bg-surface-800 active:scale-95 transition-all"
          >
            <Phone className="h-4 w-4 text-brand-700 dark:text-brand-400" />
            Call Driver
          </a>
        ) : (
          <button
            disabled
            className="flex items-center justify-center gap-2 rounded-xl border border-border bg-surface-50 dark:bg-surface-900 py-2.5 text-sm font-medium text-muted-foreground opacity-40 cursor-not-allowed"
          >
            <Phone className="h-4 w-4" />
            Call Driver
          </button>
        )}
        {phone ? (
          <a
            href={`https://wa.me/${phone.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl bg-brand-700 py-2.5 text-sm font-medium text-white hover:bg-brand-800 active:scale-95 transition-all"
          >
            <MessageCircle className="h-4 w-4" />
            Message
          </a>
        ) : (
          <button
            disabled
            className="flex items-center justify-center gap-2 rounded-xl bg-brand-200 py-2.5 text-sm font-medium text-white cursor-not-allowed opacity-40"
          >
            <MessageCircle className="h-4 w-4" />
            Message
          </button>
        )}
      </div>
    </div>
  );
}

// ─── MapPlaceholder ───────────────────────────────────────────────────────────

function MapPlaceholder() {
  return (
    <div className="mx-4 rounded-2xl overflow-hidden border border-border shadow-card">
      <div className="relative h-44 bg-gradient-to-br from-emerald-100 via-teal-100 to-cyan-100">
        <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 400 176">
          <path d="M0 88 Q100 60 200 88 Q300 116 400 88" stroke="#0f766e" strokeWidth="6" fill="none" strokeDasharray="12 6" />
          <path d="M0 44 Q80 30 160 44 Q240 58 320 44 Q360 38 400 44" stroke="#059669" strokeWidth="2" fill="none" opacity="0.5" />
          <path d="M0 132 Q80 118 160 132 Q240 146 320 132 Q360 126 400 132" stroke="#059669" strokeWidth="2" fill="none" opacity="0.5" />
          <rect x="30" y="20" width="40" height="28" rx="4" fill="#0f766e" opacity="0.15" />
          <rect x="100" y="100" width="50" height="32" rx="4" fill="#0f766e" opacity="0.12" />
          <rect x="280" y="30" width="45" height="30" rx="4" fill="#0f766e" opacity="0.15" />
          <rect x="320" y="100" width="55" height="36" rx="4" fill="#0f766e" opacity="0.1" />
        </svg>
        <div className="absolute left-8 top-1/2 -translate-y-1/2 flex flex-col items-center">
          <div className="h-8 w-8 rounded-full bg-white shadow-lg flex items-center justify-center border-2 border-brand-500">
            <Package className="h-4 w-4 text-brand-700 dark:text-brand-400" />
          </div>
          <div className="mt-1 rounded-md bg-brand-700 px-2 py-0.5 text-[10px] font-semibold text-white whitespace-nowrap shadow">
            Warehouse
          </div>
        </div>
        <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col items-center">
          <div className="h-8 w-8 rounded-full bg-white shadow-lg flex items-center justify-center border-2 border-success-500">
            <MapPin className="h-4 w-4 text-success-700 dark:text-success-500" />
          </div>
          <div className="mt-1 rounded-md bg-success-700 px-2 py-0.5 text-[10px] font-semibold text-white whitespace-nowrap shadow">
            Your Store
          </div>
        </div>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
          <div className="relative">
            <div className="absolute -inset-2 rounded-full bg-brand-500/30 animate-ping" />
            <div className="relative h-6 w-6 rounded-full bg-brand-700 border-2 border-white shadow-lg flex items-center justify-center">
              <Truck className="h-3 w-3 text-white" />
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/30 to-transparent p-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-brand-400 animate-pulse" />
            <span className="text-xs font-semibold text-white drop-shadow">Driver is 3.2 km away</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── RatingSection ────────────────────────────────────────────────────────────

function RatingSection({ orderId }: { orderId: string }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratingError, setRatingError] = useState<string | null>(null);

  if (submitted) {
    return (
      <div className="mx-4 rounded-2xl bg-success-50 dark:bg-success-500/10 border border-success-500/25 p-5 text-center">
        <CheckCircle2 className="h-8 w-8 text-success-700 dark:text-success-500 mx-auto mb-2" />
        <p className="font-display font-semibold text-success-700 dark:text-foreground">Thanks for your feedback!</p>
        <p className="text-xs text-success-700 dark:text-foreground mt-1">Your rating helps us improve our service.</p>
      </div>
    );
  }

  async function handleSubmitRating() {
    if (!rating) return;
    setRatingLoading(true);
    setRatingError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/rating`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, orderId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to submit rating");
      }
      setSubmitted(true);
    } catch (err) {
      setRatingError(err instanceof Error ? err.message : "Failed to submit rating. Please try again.");
    } finally {
      setRatingLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card shadow-card p-5 mx-4">
      <p className="font-display text-sm font-semibold text-foreground mb-1">How was your delivery?</p>
      <p className="text-xs text-muted-foreground mb-4">Rate your experience</p>
      <div className="flex items-center justify-center gap-3 mb-4">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            onMouseEnter={() => setHovered(s)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setRating(s)}
            className="transition-transform active:scale-90 hover:scale-110"
          >
            <Star
              className={cn(
                "h-9 w-9 transition-all",
                s <= (hovered || rating)
                  ? "fill-warning-400 text-warning-400 drop-shadow-md"
                  : "fill-surface-200 text-surface-300"
              )}
            />
          </button>
        ))}
      </div>
      {ratingError && (
        <p className="text-xs text-danger-600 dark:text-danger-500 text-center mb-2">{ratingError}</p>
      )}
      {rating > 0 && (
        <Button size="sm" className="w-full" onClick={handleSubmitRating} loading={ratingLoading} disabled={ratingLoading}>
          Submit Rating ({rating}/5)
        </Button>
      )}
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 animate-fade-in">
      <div className="rounded-2xl bg-foreground/90 backdrop-blur-sm px-4 py-3.5 flex items-start justify-between gap-3 shadow-xl">
        <p className="text-sm text-background font-medium">{message}</p>
        <button onClick={onDismiss} className="text-background/60 hover:text-background shrink-0 text-lg leading-none">&times;</button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrderDetailPage() {
  const { id } = useParams();
  const orderId = typeof id === "string" ? id : Array.isArray(id) ? id[0] : "";

  const [order, setOrder] = useState<typeof MOCK_ORDERS[number] | null>(null);
  const [orderLoading, setOrderLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) { setOrderLoading(false); return; }
    fetch(`/api/orders/${orderId}`)
      .then((r) => {
        if (!r.ok) throw new Error(r.statusText || `HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        if (d.order) {
          setOrder(d.order as typeof MOCK_ORDERS[number]);
        } else {
          // API returned 200 but no order object — show not found
          setOrder(null);
        }
      })
      .catch(() => {
        // On network/API error, show not found rather than wrong mock data
        setOrder(null);
      })
      .finally(() => setOrderLoading(false));
  }, [orderId]);

  if (orderLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 text-center">
        <div>
          <p className="text-foreground font-semibold">Order not found</p>
          <Link href="/orders" className="mt-3 block text-sm text-brand-700 dark:text-brand-400">Back to orders</Link>
        </div>
      </div>
    );
  }

  const isOutForDelivery = order.status === "out_for_delivery";
  const isDelivered = order.status === "delivered";

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <RetailerTopBar title="Order Details" />

      {/* Back link */}
      <div className="px-4 pt-4 pb-2">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to orders
        </Link>
      </div>

      {/* Order number row */}
      <div className="flex items-center justify-between px-4 mb-4">
        <div>
          <p className="text-xs text-muted-foreground">Order</p>
          <p className="font-display text-base font-bold text-foreground">{order.orderNumber}</p>
          <p className="text-xs text-muted-foreground">{formatDateTime(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <Suspense fallback={null}><ConfirmBanner /></Suspense>

      <div className="space-y-4">
        {/* 1. Status Hero */}
        <StatusHero status={order.status} createdAt={order.createdAt} />

        {/* 2. Map (out for delivery only) */}
        {isOutForDelivery && <MapPlaceholder />}

        {/* 3. Driver card (out for delivery only) */}
        {isOutForDelivery && (
          <DriverCard
            onAction={showToast}
            driver={(order as unknown as { driver?: DriverInfo }).driver}
          />
        )}

        {/* 4. Order Status Timeline (5 steps) */}
        <DeliveryTimeline
          status={order.status}
          fulfillmentEvents={order.fulfillmentEvents ?? []}
          orderId={order.id}
        />

        {/* 5. Delivery Address — shown prominently */}
        <DeliveryAddress address={order.deliveryAddress} notes={order.notes} />

        {/* 6. Order Items with thumbnails, qty, unit price, line total, payment badge */}
        <OrderItems
          orderItems={order.items}
          subtotal={order.subtotal}
          deliveryFee={order.deliveryFee}
          total={order.total}
          paymentMethod={order.paymentMethod}
          paymentStatus={order.paymentStatus}
        />

        {/* 7. Rating (delivered only) */}
        {isDelivered && <RatingSection orderId={orderId} />}

        {/* 8. Action buttons */}
        <div className="px-4 space-y-3">
          {/* Reorder button — always show, adds all items to cart */}
          <ReorderButton orderItems={order.items} />

          {isOutForDelivery && (
            <ButtonLink href="/support" variant="outline" size="lg" className="w-full">
              <MessageCircle className="h-4 w-4" />
              Contact Support
            </ButtonLink>
          )}

          <a
            href={`/api/orders/${id}/receipt`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 rounded-2xl border border-border bg-surface-50 dark:bg-surface-900 py-3.5 text-sm font-semibold text-surface-900 hover:bg-surface-100 dark:bg-surface-800 active:scale-[0.98] transition-all"
          >
            <Download className="h-4 w-4" />
            Download Receipt (OR)
          </a>
        </div>
      </div>

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
      <RetailerBottomNav />
    </div>
  );
}
