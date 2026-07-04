"use client";
import { useState } from "react";
import Link from "next/link";
import { RotateCcw, Plus, ShoppingCart, CheckCircle2, ChevronRight, Package, AlertTriangle } from "lucide-react";
import { RetailerTopBar, RetailerBottomNav } from "@/components/layout/retailer-nav";
import { useCartStore } from "@/store/cart";
import { PRODUCTS } from "@/lib/mock-data";
import { formatPHP, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { toastSuccess } from "@/store/toast";

// ── Past order definitions ───────────────────────────────────────────────────
// Product IDs mapped from mock-data.ts:
//   prod-1  = Coca-Cola Regular 330ml
//   prod-2  = Lucky Me! Pancit Canton Original
//   prod-4  = 555 Sardines in Tomato Sauce 155g
//   prod-5  = Nescafé 3-in-1 Original 20g x 10pcs
//   prod-6  = Safeguard Classic Bar 60g
//   prod-7  = Silver Swan Soy Sauce 1L
//   prod-8  = Surf Powder Detergent 80g x 6

const PAST_ORDERS = [
  {
    id: "kss-142",
    orderNumber: "KSS-2025-00142",
    date: "2025-01-20T10:00:00Z",
    items: [
      { productId: "prod-1", name: "Coca-Cola Regular 330ml", qty: 24 },
      { productId: "prod-2", name: "Lucky Me! Pancit Canton", qty: 48 },
      { productId: "prod-4", name: "555 Sardines Tomato Sauce", qty: 24 },
    ],
    total: 1500,
  },
  {
    id: "kss-141",
    orderNumber: "KSS-2025-00141",
    date: "2025-01-17T10:00:00Z",
    items: [
      { productId: "prod-5", name: "Nescafé 3-in-1 Original", qty: 20 },
      { productId: "prod-6", name: "Safeguard Classic Bar", qty: 48 },
    ],
    total: 2320,
  },
  {
    id: "kss-138",
    orderNumber: "KSS-2025-00138",
    date: "2025-01-12T10:00:00Z",
    items: [
      { productId: "prod-7", name: "Silver Swan Soy Sauce 1L", qty: 12 },
      { productId: "prod-8", name: "Surf Powder Detergent", qty: 12 },
    ],
    total: 1970,
  },
];

// ── Urgent restock data ──────────────────────────────────────────────────────

const URGENT = {
  name: "Coca-Cola Regular 330ml",
  daysSince: 12,
  frequency: "every 2 weeks",
  urgency: "high" as const,
};

// ── Toast ────────────────────────────────────────────────────────────────────

function SuccessToast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div
      className={cn(
        "fixed top-16 left-1/2 -translate-x-1/2 z-50 transition-all duration-300",
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
      )}
    >
      <div className="flex items-center gap-2 rounded-2xl bg-success-600 px-4 py-3 text-white shadow-lg">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        <span className="text-sm font-semibold whitespace-nowrap">{message}</span>
      </div>
    </div>
  );
}

// ── Urgent restock banner ────────────────────────────────────────────────────

function UrgentRestockBanner() {
  const { addItem } = useCartStore();
  const [added, setAdded] = useState(false);

  function handleQuickAdd() {
    const product = PRODUCTS.find((p) => p.id === "prod-1");
    if (product) {
      addItem(product, 24);
      setAdded(true);
      toastSuccess(`${product.name} added — 24 pcs`);
      setTimeout(() => setAdded(false), 2500);
    }
  }

  return (
    <div className="rounded-2xl border border-brand-300 bg-brand-50 overflow-hidden">
      {/* Urgency label */}
      <div className="flex items-center gap-1.5 bg-brand-500 px-4 py-1.5">
        <AlertTriangle className="h-3 w-3 text-white" />
        <span className="text-[11px] font-bold text-white uppercase tracking-wide">Suggested Reorder</span>
      </div>

      {/* Body */}
      <div className="px-4 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100">
            <RotateCcw className="h-5 w-5 text-brand-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-brand-900">You&apos;re overdue for a restock!</p>
            <p className="text-sm font-semibold text-foreground mt-0.5 truncate">{URGENT.name}</p>
            <p className="text-xs text-brand-700 mt-1">
              Usually ordered {URGENT.frequency} — last ordered {URGENT.daysSince} days ago
            </p>
          </div>
        </div>

        <button
          onClick={handleQuickAdd}
          disabled={added}
          className={cn(
            "mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all active:scale-[0.98]",
            added
              ? "bg-success-500 text-white cursor-default"
              : "bg-brand-500 text-white hover:bg-brand-600"
          )}
        >
          {added ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Added to cart!
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Quick Add 24 pcs
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Cart sticky footer ───────────────────────────────────────────────────────

function CartStickyFooter() {
  const { items } = useCartStore();
  const count = items.reduce((acc, item) => acc + item.quantity, 0);

  if (count === 0) return null;

  return (
    <div className="fixed bottom-16 left-0 right-0 z-40 px-4 pb-2">
      <Link
        href="/cart"
        className="flex items-center justify-between rounded-2xl bg-brand-500 px-5 py-3.5 shadow-brand active:scale-[0.99] transition-all"
      >
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <ShoppingCart className="h-5 w-5 text-white" />
            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-black text-brand-500 leading-none">
              {count > 99 ? "99+" : count}
            </span>
          </div>
          <span className="text-sm font-bold text-white">{count} item{count !== 1 ? "s" : ""} ready</span>
        </div>
        <span className="text-sm font-bold text-white flex items-center gap-1">
          Go to Cart <ChevronRight className="h-4 w-4" />
        </span>
      </Link>
    </div>
  );
}

// ── Order card ───────────────────────────────────────────────────────────────

function OrderCard({ order }: { order: typeof PAST_ORDERS[number] }) {
  const { addItem } = useCartStore();
  const [toastMsg, setToastMsg] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  function showToast(msg: string) {
    setToastMsg(msg);
    setToastVisible(true);
    toastSuccess(msg);
    setTimeout(() => setToastVisible(false), 2200);
  }

  function handleReorderAll() {
    order.items.forEach((item) => {
      const product = PRODUCTS.find((p) => p.id === item.productId);
      if (product) addItem(product, item.qty);
    });
    showToast(`${order.items.length} items added to cart`);
  }

  function handleAddOne(productId: string, qty: number) {
    const product = PRODUCTS.find((p) => p.id === productId);
    if (product) {
      addItem(product, qty);
      showToast(`${product.name} added`);
    }
  }

  return (
    <>
      <SuccessToast message={toastMsg} visible={toastVisible} />
      <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
        {/* Order header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-border bg-surface-50">
          <div>
            <p className="text-xs font-bold text-foreground font-mono">{order.orderNumber}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{formatDate(order.date)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-black text-foreground">{formatPHP(order.total)}</p>
            <p className="text-[11px] text-muted-foreground">{order.items.length} items</p>
          </div>
        </div>

        {/* Items list */}
        <div className="divide-y divide-border">
          {order.items.map((item) => (
            <div key={item.productId} className="flex items-center gap-3 px-4 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-100">
                <Package className="h-4 w-4 text-muted-foreground/60" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground">Qty: {item.qty}</p>
              </div>
              <button
                onClick={() => handleAddOne(item.productId, item.qty)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 text-brand-500 hover:bg-brand-100 active:scale-90 transition-all"
                aria-label={`Add ${item.name} to cart`}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Reorder all button */}
        <div className="px-4 py-3.5 border-t border-border bg-surface-50">
          <button
            onClick={handleReorderAll}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-sm font-bold text-white hover:bg-brand-600 active:scale-[0.98] transition-all"
          >
            <RotateCcw className="h-4 w-4" />
            Reorder All — {formatPHP(order.total)}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function ReorderPage() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <RetailerTopBar title="Quick Reorder" />

      <div className="px-4 py-5 space-y-5">
        {/* Urgent restock banner */}
        <UrgentRestockBanner />

        {/* Header */}
        <div>
          <h1 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-brand-500" />
            Quick Reorder
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Your recent orders, ready to repeat</p>
        </div>

        {/* Tip banner */}
        <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 flex items-center gap-3">
          <span className="text-brand-500 shrink-0">
            <ShoppingCart className="h-4 w-4" />
          </span>
          <p className="text-xs text-brand-700 font-medium">
            Tap <span className="font-bold">Reorder All</span> to add a full order to your cart, or <Plus className="inline h-3 w-3" /> to add individual items.
          </p>
        </div>

        {/* Order cards */}
        {PAST_ORDERS.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}

        {/* View cart CTA */}
        <Link
          href="/cart"
          className="flex items-center justify-between rounded-2xl border border-border bg-card shadow-card px-5 py-4 hover:border-brand-300 active:scale-[0.99] transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-500">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">View Cart</p>
              <p className="text-xs text-muted-foreground">See all items ready to order</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </Link>
      </div>

      <CartStickyFooter />
      <RetailerBottomNav />
    </div>
  );
}
