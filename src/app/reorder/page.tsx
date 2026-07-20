"use client";
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  RotateCcw,
  Plus,
  ShoppingCart,
  ChevronRight,
  Package,
  CheckSquare2,
  Square,
  ListChecks,
  Star,
  ClipboardList,
} from "lucide-react";
import { RetailerTopBar, RetailerBottomNav } from "@/components/layout/retailer-nav";
import { useCartStore } from "@/store/cart";
import { useOrdersStore } from "@/store/orders";
import { PRODUCTS } from "@/lib/mock-data";
import { formatPHP, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { toastSuccess } from "@/store/toast";
import type { Product } from "@/types";

// ── Retailer-side past-order product data ────────────────────────────────────
// The orders store is seeded from ADMIN_RECENT_ORDERS which contain empty items
// arrays (admin view). We enrich delivered orders with retailer-side item data
// keyed by order ID so the reorder flow has real products to work with.

interface RetailerOrderItem {
  productId: string;
  name: string;
  qty: number;
}

const RETAILER_ITEMS: Record<string, RetailerOrderItem[]> = {
  "ord-a5": [
    { productId: "prod-5", name: "Nescafé 3-in-1 Original", qty: 20 },
    { productId: "prod-6", name: "Safeguard Classic Bar", qty: 48 },
  ],
  // Additional past orders seeded below
  "ord-r1": [
    { productId: "prod-1", name: "Coca-Cola Regular 330ml", qty: 24 },
    { productId: "prod-2", name: "Lucky Me! Pancit Canton", qty: 48 },
    { productId: "prod-4", name: "555 Sardines Tomato Sauce", qty: 24 },
  ],
  "ord-r2": [
    { productId: "prod-7", name: "Silver Swan Soy Sauce 1L", qty: 12 },
    { productId: "prod-8", name: "Surf Powder Detergent", qty: 12 },
    { productId: "prod-1", name: "Coca-Cola Regular 330ml", qty: 24 },
  ],
  "ord-r3": [
    { productId: "prod-2", name: "Lucky Me! Pancit Canton", qty: 48 },
    { productId: "prod-5", name: "Nescafé 3-in-1 Original", qty: 20 },
    { productId: "prod-4", name: "555 Sardines Tomato Sauce", qty: 24 },
  ],
};

// Additional delivered orders beyond what the store has (retailer history)
const SUPPLEMENTAL_DELIVERED_ORDERS = [
  {
    id: "ord-r1",
    orderNumber: "KSS-2025-00138",
    total: 1500,
    subtotal: 1420,
    deliveryFee: 80,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    status: "delivered" as const,
  },
  {
    id: "ord-r2",
    orderNumber: "KSS-2025-00132",
    total: 1970,
    subtotal: 1890,
    deliveryFee: 80,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
    status: "delivered" as const,
  },
  {
    id: "ord-r3",
    orderNumber: "KSS-2025-00121",
    total: 2080,
    subtotal: 2000,
    deliveryFee: 80,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 32).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 32).toISOString(),
    status: "delivered" as const,
  },
];

// Shape used inside this page
interface PastOrder {
  id: string;
  orderNumber: string;
  total: number;
  createdAt: string;
  items: RetailerOrderItem[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function isWithinDays(dateStr: string, days: number): boolean {
  const date = new Date(dateStr);
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return date >= cutoff;
}

function resolveProduct(productId: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === productId);
}

// ── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-100 dark:bg-surface-800 mb-4">
        <ClipboardList className="h-8 w-8 text-muted-foreground/50" />
      </div>
      <h2 className="text-lg font-bold text-foreground">No past orders yet</h2>
      <p className="text-sm text-muted-foreground mt-1 max-w-xs">
        Once you place your first order, you can quickly reorder from here.
      </p>
      <Link
        href="/catalog"
        className="mt-6 flex items-center gap-2 rounded-xl bg-brand-700 px-6 py-3 text-sm font-bold text-white hover:bg-brand-800 active:scale-[0.98] transition-all"
      >
        <ShoppingCart className="h-4 w-4" />
        Browse Catalog
      </Link>
    </div>
  );
}

// ── Frequently reordered section ─────────────────────────────────────────────

interface FreqProduct {
  productId: string;
  name: string;
  count: number;
  defaultQty: number;
}

function FrequentlyReordered({
  items,
  onAdd,
}: {
  items: FreqProduct[];
  onAdd: (productId: string, qty: number, name: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-surface-50 dark:bg-surface-900 dark:bg-surface-800">
        <Star className="h-4 w-4 text-brand-700 dark:text-brand-400 fill-brand-500" />
        <span className="text-sm font-bold text-foreground">Frequently Reordered</span>
        <span className="ml-auto text-[11px] text-muted-foreground">{items.length} items</span>
      </div>

      <div className="divide-y divide-border">
        {items.map((item) => (
          <div key={item.productId} className="flex items-center gap-3 px-4 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/10">
              <Package className="h-4 w-4 text-brand-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
              <p className="text-[11px] text-muted-foreground">
                Ordered {item.count} time{item.count !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              onClick={() => onAdd(item.productId, item.defaultQty, item.name)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400 hover:bg-brand-100 active:scale-90 transition-all"
              aria-label={`Add ${item.name} to cart`}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Order card ───────────────────────────────────────────────────────────────

function OrderCard({
  order,
  selectedItems,
  onToggleItem,
  selectionMode,
}: {
  order: PastOrder;
  selectedItems: Set<string>;
  onToggleItem: (key: string) => void;
  selectionMode: boolean;
}) {
  const { addItem } = useCartStore();
  const router = useRouter();

  function handleReorderAll() {
    let added = 0;
    order.items.forEach((item) => {
      const product = resolveProduct(item.productId);
      if (product) {
        addItem(product, item.qty);
        added++;
      }
    });
    if (added > 0) {
      toastSuccess(`${added} item${added !== 1 ? "s" : ""} added to cart`);
      router.push("/cart");
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
      {/* Order header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-border bg-surface-50 dark:bg-surface-900 dark:bg-surface-800">
        <div>
          <p className="text-xs font-bold text-foreground font-mono">{order.orderNumber}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{formatDate(order.createdAt)}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-black text-foreground">{formatPHP(order.total)}</p>
          <p className="text-[11px] text-muted-foreground">
            {order.items.length} item{order.items.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Items list */}
      <div className="divide-y divide-border">
        {order.items.map((item) => {
          const key = `${order.id}::${item.productId}`;
          const checked = selectedItems.has(key);

          return (
            <div key={item.productId} className="flex items-center gap-3 px-4 py-3">
              {/* Checkbox (visible in selection mode) */}
              {selectionMode && (
                <button
                  onClick={() => onToggleItem(key)}
                  className="shrink-0 text-brand-700 dark:text-brand-400 hover:text-brand-600 active:scale-90 transition-all"
                  aria-label={checked ? "Deselect item" : "Select item"}
                >
                  {checked ? (
                    <CheckSquare2 className="h-5 w-5" />
                  ) : (
                    <Square className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
              )}

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-100 dark:bg-surface-800">
                <Package className="h-4 w-4 text-muted-foreground" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground">Qty: {item.qty}</p>
              </div>

              {/* Quick-add button (hidden in selection mode) */}
              {!selectionMode && (
                <button
                  onClick={() => {
                    const product = resolveProduct(item.productId);
                    if (product) {
                      addItem(product, item.qty);
                    }
                  }}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400 hover:bg-brand-100 active:scale-90 transition-all"
                  aria-label={`Add ${item.name} to cart`}
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Reorder all button (hidden in selection mode) */}
      {!selectionMode && (
        <div className="px-4 py-3.5 border-t border-border bg-surface-50 dark:bg-surface-900">
          <button
            onClick={handleReorderAll}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-700 py-3 text-sm font-bold text-white hover:bg-brand-800 active:scale-[0.98] transition-all"
          >
            <RotateCcw className="h-4 w-4" />
            Reorder All — {formatPHP(order.total)}
          </button>
        </div>
      )}
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
            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white dark:bg-brand-700 text-[10px] font-black text-brand-700 dark:text-white leading-none">
              {count > 99 ? "99+" : count}
            </span>
          </div>
          <span className="text-sm font-bold text-white">
            {count} item{count !== 1 ? "s" : ""} ready
          </span>
        </div>
        <span className="text-sm font-bold text-white flex items-center gap-1">
          Go to Cart <ChevronRight className="h-4 w-4" />
        </span>
      </Link>
    </div>
  );
}

// ── Add Selected sticky footer ───────────────────────────────────────────────

function AddSelectedFooter({
  selectedItems,
  allOrders,
  onDone,
}: {
  selectedItems: Set<string>;
  allOrders: PastOrder[];
  onDone: () => void;
}) {
  const { addItem } = useCartStore();
  const router = useRouter();
  const count = selectedItems.size;

  function handleAddSelected() {
    // Build a map from key → { productId, qty }
    const byOrder: Record<string, { productId: string; qty: number }[]> = {};
    selectedItems.forEach((key) => {
      const [orderId, productId] = key.split("::");
      if (!byOrder[orderId]) byOrder[orderId] = [];
      const order = allOrders.find((o) => o.id === orderId);
      const item = order?.items.find((i) => i.productId === productId);
      if (item) byOrder[orderId].push({ productId: item.productId, qty: item.qty });
    });

    let added = 0;
    Object.values(byOrder).forEach((items) => {
      items.forEach(({ productId, qty }) => {
        const product = resolveProduct(productId);
        if (product) {
          addItem(product, qty);
          added++;
        }
      });
    });

    if (added > 0) {
      toastSuccess(`${added} item${added !== 1 ? "s" : ""} added to cart`);
    }

    onDone();
    router.push("/cart");
  }

  if (count === 0) return null;

  return (
    <div className="fixed bottom-16 left-0 right-0 z-40 px-4 pb-2">
      <button
        onClick={handleAddSelected}
        className="flex w-full items-center justify-between rounded-2xl bg-success-600 px-5 py-3.5 shadow-lg active:scale-[0.99] transition-all"
      >
        <span className="text-sm font-bold text-white">
          {count} item{count !== 1 ? "s" : ""} selected
        </span>
        <span className="text-sm font-bold text-white flex items-center gap-1">
          Add to Cart <ChevronRight className="h-4 w-4" />
        </span>
      </button>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function ReorderPage() {
  const storeOrders = useOrdersStore((s) => s.orders);
  const { addItem } = useCartStore();

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  // null = still loading; [] = loaded (may be empty)
  const [apiOrders, setApiOrders] = useState<PastOrder[] | null>(null);

  // Fetch delivered orders from API on mount
  useEffect(() => {
    fetch("/api/orders?status=delivered")
      .then((r) => { if (!r.ok) return null; return r.json(); })
      .then((data) => {
        if (Array.isArray(data?.orders) && data.orders.length > 0) {
          const mapped: PastOrder[] = data.orders
            .map((o: { id: string; orderNumber: string; total: number; createdAt: string; items?: { productId: string; name: string; quantity: number }[] }) => ({
              id: o.id,
              orderNumber: o.orderNumber,
              total: o.total,
              createdAt: o.createdAt,
              items: (o.items ?? []).map((i) => ({
                productId: i.productId,
                name: i.name,
                qty: i.quantity,
              })),
            }))
            .filter((o: PastOrder) => o.items.length > 0);
          setApiOrders(mapped.length > 0 ? mapped : []);
        } else {
          // API returned empty or failed — fall back to mock data
          setApiOrders(null);
        }
      })
      .catch(() => {
        // Network error — keep null so mock fallback is used
      });
  }, []);

  // Build the list of delivered orders:
  // API data is the primary source if available; otherwise fall back to store + supplemental mock
  const pastOrders = useMemo<PastOrder[]>(() => {
    if (apiOrders !== null) {
      // Use real API orders, sorted newest-first
      return [...apiOrders].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    // Fallback: derive from local store + supplemental mock data
    const fromStore: PastOrder[] = storeOrders
      .filter((o) => o.status === "delivered")
      .map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        total: o.total,
        createdAt: o.createdAt,
        items: RETAILER_ITEMS[o.id] ?? [],
      }))
      .filter((o) => o.items.length > 0);

    const fromSupplemental: PastOrder[] = SUPPLEMENTAL_DELIVERED_ORDERS.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      total: o.total,
      createdAt: o.createdAt,
      items: RETAILER_ITEMS[o.id] ?? [],
    })).filter((o) => o.items.length > 0);

    // Merge, deduplicate by id, sort newest-first
    const seen = new Set<string>();
    return [...fromStore, ...fromSupplemental]
      .filter((o) => {
        if (seen.has(o.id)) return false;
        seen.add(o.id);
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [apiOrders, storeOrders]);

  // Group into "last 7 days" and "older"
  const recentOrders = pastOrders.filter((o) => isWithinDays(o.createdAt, 7));
  const olderOrders = pastOrders.filter((o) => !isWithinDays(o.createdAt, 7));

  // Frequently reordered products (appearing in 2+ orders)
  const frequentProducts = useMemo<FreqProduct[]>(() => {
    const countMap = new Map<string, { name: string; count: number; defaultQty: number }>();

    pastOrders.forEach((order) => {
      order.items.forEach((item) => {
        const existing = countMap.get(item.productId);
        if (existing) {
          countMap.set(item.productId, { ...existing, count: existing.count + 1 });
        } else {
          countMap.set(item.productId, { name: item.name, count: 1, defaultQty: item.qty });
        }
      });
    });

    return Array.from(countMap.entries())
      .filter(([, v]) => v.count >= 2)
      .map(([productId, v]) => ({ productId, ...v }))
      .sort((a, b) => b.count - a.count);
  }, [pastOrders]);

  function toggleItem(key: string) {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function handleFrequentAdd(productId: string, qty: number, name: string) {
    const product = resolveProduct(productId);
    if (product) {
      addItem(product, qty);
      toastSuccess(`${name} added to cart`);
    }
  }

  function exitSelectionMode() {
    setSelectionMode(false);
    setSelectedItems(new Set());
  }

  if (pastOrders.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <RetailerTopBar title="Quick Reorder" />
        <EmptyState />
        <RetailerBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <RetailerTopBar title="Quick Reorder" />

      <div className="px-4 py-5 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-brand-700 dark:text-brand-400" />
              Quick Reorder
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Your past orders, ready to repeat</p>
          </div>

          {/* Selection mode toggle */}
          <button
            onClick={() => {
              if (selectionMode) {
                exitSelectionMode();
              } else {
                setSelectionMode(true);
              }
            }}
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all active:scale-95",
              selectionMode
                ? "bg-surface-100 dark:bg-surface-800 text-foreground border border-border"
                : "bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-foreground border border-brand-200 hover:bg-brand-100"
            )}
          >
            <ListChecks className="h-3.5 w-3.5" />
            {selectionMode ? "Cancel" : "Select Items"}
          </button>
        </div>

        {/* Tip banner */}
        {!selectionMode && (
          <div className="rounded-xl border border-brand-200 bg-brand-50 dark:bg-brand-500/10 px-4 py-3 flex items-center gap-3">
            <span className="text-brand-700 dark:text-brand-400 shrink-0">
              <ShoppingCart className="h-4 w-4" />
            </span>
            <p className="text-xs text-brand-700 dark:text-brand-400 font-medium">
              Tap <span className="font-bold">Reorder All</span> to add a full order to cart, or{" "}
              <span className="font-bold">Select Items</span> to pick specific products.
            </p>
          </div>
        )}

        {/* Frequently reordered */}
        {!selectionMode && (
          <FrequentlyReordered items={frequentProducts} onAdd={handleFrequentAdd} />
        )}

        {/* Last 7 days section */}
        {recentOrders.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
              Last 7 Days
            </p>
            {recentOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                selectedItems={selectedItems}
                onToggleItem={toggleItem}
                selectionMode={selectionMode}
              />
            ))}
          </div>
        )}

        {/* Older section */}
        {olderOrders.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
              Older Orders
            </p>
            {olderOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                selectedItems={selectedItems}
                onToggleItem={toggleItem}
                selectionMode={selectionMode}
              />
            ))}
          </div>
        )}

        {/* View cart CTA (normal mode only) */}
        {!selectionMode && (
          <Link
            href="/cart"
            className="flex items-center justify-between rounded-2xl border border-border bg-card shadow-card px-5 py-4 hover:border-brand-300 active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">View Cart</p>
                <p className="text-xs text-muted-foreground">See all items ready to order</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Link>
        )}
      </div>

      {/* Sticky footers — mutually exclusive */}
      {selectionMode ? (
        <AddSelectedFooter
          selectedItems={selectedItems}
          allOrders={pastOrders}
          onDone={exitSelectionMode}
        />
      ) : (
        <CartStickyFooter />
      )}

      <RetailerBottomNav />
    </div>
  );
}
