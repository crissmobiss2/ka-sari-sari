"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package, ChevronRight, RotateCcw, Clock, Truck, CheckCheck,
  AlertCircle, MapPin, ShoppingBag,
} from "lucide-react";
import { RetailerTopBar, RetailerBottomNav } from "@/components/layout/retailer-nav";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatPHP, formatDate, type OrderStatus, ORDER_STATUS_LABELS } from "@/lib/utils";
import { MOCK_ORDERS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { toastSuccess } from "@/store/toast";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DisplayOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: string;
  paymentMethod: string;
  total: number;
  subtotal: number;
  deliveryFee: number;
  deliveryAddress: string;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Extra hardcoded orders for display richness ───────────────────────────────

const EXTRA_ORDERS: DisplayOrder[] = [
  {
    id: "ord-004",
    orderNumber: "KSS-2025-00136",
    status: "pending",
    paymentStatus: "paid",
    paymentMethod: "gcash",
    total: 980,
    subtotal: 900,
    deliveryFee: 80,
    deliveryAddress: "48 Mabini St., Brgy. Poblacion, Marikina City",
    itemCount: 2,
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
  },
  {
    id: "ord-005",
    orderNumber: "KSS-2025-00130",
    status: "picking",
    paymentStatus: "paid",
    paymentMethod: "gcash",
    total: 2640,
    subtotal: 2560,
    deliveryFee: 80,
    deliveryAddress: "12 Luna Ave., Brgy. San Antonio, Quezon City",
    itemCount: 5,
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: "ord-006",
    orderNumber: "KSS-2025-00124",
    status: "confirmed",
    paymentStatus: "paid",
    paymentMethod: "cod",
    total: 1340,
    subtotal: 1260,
    deliveryFee: 80,
    deliveryAddress: "77 Del Pilar St., Brgy. Bagong Ilog, Pasig City",
    itemCount: 3,
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 150).toISOString(),
  },
  {
    id: "ord-007",
    orderNumber: "KSS-2025-00110",
    status: "delivered",
    paymentStatus: "paid",
    paymentMethod: "gcash",
    total: 3180,
    subtotal: 3100,
    deliveryFee: 80,
    deliveryAddress: "9 Aguinaldo St., Brgy. Kapitolyo, Pasig City",
    itemCount: 7,
    createdAt: "2025-01-10T07:00:00Z",
    updatedAt: "2025-01-10T15:30:00Z",
  },
  {
    id: "ord-008",
    orderNumber: "KSS-2025-00099",
    status: "cancelled",
    paymentStatus: "refunded",
    paymentMethod: "gcash",
    total: 860,
    subtotal: 780,
    deliveryFee: 80,
    deliveryAddress: "33 Bonifacio Ave., Brgy. Plainview, Mandaluyong City",
    itemCount: 2,
    createdAt: "2025-01-05T09:30:00Z",
    updatedAt: "2025-01-05T10:00:00Z",
  },
];

// ─── Merge MOCK_ORDERS + EXTRA_ORDERS ────────────────────────────────────────

function buildDisplayOrder(o: typeof MOCK_ORDERS[number]): DisplayOrder {
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    paymentStatus: o.paymentStatus,
    paymentMethod: o.paymentMethod,
    total: o.total,
    subtotal: o.subtotal,
    deliveryFee: o.deliveryFee,
    deliveryAddress: o.deliveryAddress,
    itemCount: o.items?.length ?? 3,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

const FALLBACK_ORDERS: DisplayOrder[] = [];

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = [
  { id: "all",    label: "All" },
  { id: "active", label: "Active" },
  { id: "done",   label: "Completed" },
];

const ACTIVE_STATUSES: OrderStatus[] = ["pending", "confirmed", "picking", "packed", "out_for_delivery"];
const DONE_STATUSES: OrderStatus[] = ["delivered", "failed_delivery", "cancelled"];

const PROGRESS_STEPS: OrderStatus[] = ["confirmed", "picking", "packed", "out_for_delivery"];

// ─── StatusIcon ───────────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: OrderStatus }) {
  if (status === "out_for_delivery") return <Truck className="h-5 w-5 text-brand-500" />;
  if (status === "delivered") return <CheckCheck className="h-5 w-5 text-success-500" />;
  if (status === "cancelled" || status === "failed_delivery" || status === "returned")
    return <AlertCircle className="h-5 w-5 text-danger-400" />;
  return <Clock className="h-5 w-5 text-warning-500" />;
}

function StatusIconBg({ status }: { status: OrderStatus }) {
  const bgClass =
    status === "out_for_delivery" ? "bg-brand-50"
    : status === "delivered" ? "bg-success-50"
    : ["cancelled", "failed_delivery", "returned"].includes(status) ? "bg-danger-50"
    : "bg-warning-50";
  return (
    <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl", bgClass)}>
      <StatusIcon status={status} />
    </div>
  );
}

// ─── ProgressBar ─────────────────────────────────────────────────────────────

function ActiveProgressBar({ status }: { status: OrderStatus }) {
  const current = PROGRESS_STEPS.indexOf(status);
  if (current < 0) return null;
  const pct = Math.round(((current + 1) / PROGRESS_STEPS.length) * 100);

  return (
    <div className="mt-3 px-4 pb-4">
      <div className="flex gap-1 mb-1.5">
        {PROGRESS_STEPS.map((s, i) => (
          <div
            key={s}
            className={cn(
              "h-1 flex-1 rounded-full transition-all",
              i <= current ? "bg-brand-500" : "bg-surface-200"
            )}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        <span className="font-medium text-brand-600">{ORDER_STATUS_LABELS[status]}</span>
        {" "}&mdash; {pct}% complete
      </p>
    </div>
  );
}

// ─── OrderCard ────────────────────────────────────────────────────────────────

function OrderCard({ order }: { order: DisplayOrder }) {
  const router = useRouter();
  const isActive = ACTIVE_STATUSES.includes(order.status);
  const isDelivered = order.status === "delivered";
  const showProgress = isActive && PROGRESS_STEPS.includes(order.status);
  const isCancelled = ["cancelled", "failed_delivery", "returned"].includes(order.status);

  function handleReorder(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    // DisplayOrder doesn't carry full product objects — redirect to catalog
    toastSuccess("Redirecting to catalog — pick your items!");
    router.push("/catalog");
  }

  return (
    <Link
      href={`/orders/${order.id}`}
      className="block rounded-2xl border border-border bg-card shadow-card hover:shadow-card-md hover:border-brand-500/30 transition-all active:scale-[0.99]"
    >
      {/* Top section */}
      <div className="flex items-start gap-3 px-4 pt-4 pb-3">
        <StatusIconBg status={order.status} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground">{order.orderNumber}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{formatDate(order.createdAt)}</p>
            </div>
            <StatusBadge status={order.status} />
          </div>
        </div>
      </div>

      {/* Meta row */}
      <div className="px-4 pb-3 flex items-center gap-3">
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <ShoppingBag className="h-3 w-3" />
          {order.itemCount} item{order.itemCount !== 1 ? "s" : ""}
        </span>
        <span className="text-surface-300">&bull;</span>
        <span className="text-xs text-muted-foreground flex items-center gap-1 truncate min-w-0">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{order.deliveryAddress}</span>
        </span>
      </div>

      {/* Progress bar */}
      {showProgress && <ActiveProgressBar status={order.status} />}

      {/* Bottom row */}
      <div className={cn(
        "flex items-center justify-between border-t border-border px-4 py-3",
        isCancelled ? "bg-surface-50/50" : ""
      )}>
        <p className="text-base font-bold text-foreground">{formatPHP(order.total)}</p>
        <div className="flex items-center gap-2">
          {isActive && (
            <Link
              href={`/tracking?orderId=${order.id}`}
              aria-label="Track order"
              onClick={(e) => e.stopPropagation()}
              className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white flex items-center gap-1.5 hover:bg-brand-600 transition-colors"
            >
              <Truck className="h-3 w-3" />
              Track
            </Link>
          )}
          {isDelivered && (
            <button
              type="button"
              onClick={handleReorder}
              className="rounded-lg bg-surface-100 px-3 py-1.5 text-xs font-semibold text-foreground flex items-center gap-1.5 hover:bg-surface-200 transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              Reorder
            </button>
          )}
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const router = useRouter();
  const [tab, setTab] = useState("all");
  const [orders, setOrders] = useState<DisplayOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => {
        if (!r.ok) throw new Error(r.statusText || `HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        const apiOrders = (d.orders ?? []) as typeof MOCK_ORDERS;
        setOrders(
          apiOrders
            .map(buildDisplayOrder)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        );
      })
      .catch((err) => {
        setFetchError(err instanceof Error ? err.message : "Failed to load orders");
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter((o) => {
    if (tab === "active") return ACTIVE_STATUSES.includes(o.status);
    if (tab === "done")   return DONE_STATUSES.includes(o.status);
    return true;
  });

  const counts = {
    all:    orders.length,
    active: orders.filter((o) => ACTIVE_STATUSES.includes(o.status)).length,
    done:   orders.filter((o) => DONE_STATUSES.includes(o.status)).length,
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <RetailerTopBar title="My Orders" />

      {/* Header summary */}
      <div className="px-4 pt-4 pb-3">
        <p className="text-sm text-muted-foreground">
          <span className="font-bold text-foreground">{counts.all}</span> total orders &middot;{" "}
          <span className="font-semibold text-brand-600">{counts.active} active</span>
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 px-4 pb-3">
        {TABS.map((t) => {
          const count = counts[t.id as keyof typeof counts];
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition-all",
                tab === t.id
                  ? "bg-brand-500 text-white shadow-brand"
                  : "bg-surface-100 text-muted-foreground hover:text-foreground hover:bg-surface-200"
              )}
            >
              {t.label}
              <span className={cn(
                "rounded-full px-1.5 py-0.5 text-[11px] font-bold leading-none",
                tab === t.id ? "bg-white/25 text-white" : "bg-surface-200 text-muted-foreground"
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Order list */}
      <div className="px-4 py-2">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          </div>
        ) : fetchError ? (
          <div className="flex flex-col items-center py-12 gap-3 text-center">
            <AlertCircle className="h-8 w-8 text-danger-400" />
            <p className="text-sm font-semibold text-foreground">Could not load orders</p>
            <p className="text-xs text-muted-foreground">{fetchError}</p>
            <button
              onClick={() => { setFetchError(null); setLoading(true); fetch("/api/orders").then((r) => { if (!r.ok) throw new Error(r.statusText); return r.json(); }).then((d) => { setOrders((d.orders ?? []).map(buildDisplayOrder).sort((a: DisplayOrder, b: DisplayOrder) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())); }).catch((e) => setFetchError(e.message)).finally(() => setLoading(false)); }}
              className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Package className="h-8 w-8" />}
            title={tab === "active" ? "No active orders" : tab === "done" ? "No completed orders" : "No orders yet"}
            description={
              tab === "active"
                ? "Your active orders will appear here."
                : tab === "done"
                ? "Delivered orders will show up here."
                : "Place your first order from the catalog."
            }
            action={{ label: "Browse catalog", onClick: () => router.push("/catalog") }}
            className="min-h-[50vh]"
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>

      <RetailerBottomNav />
    </div>
  );
}
