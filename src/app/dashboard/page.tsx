"use client";
// v2
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  Package, ArrowRight, RotateCcw, ChevronRight, Zap, TrendingUp,
  Flame, Tag, Wallet, Bell, Star, Clock, ShoppingCart, AlertTriangle
} from "lucide-react";
import { RetailerTopBar, RetailerBottomNav } from "@/components/layout/retailer-nav";
import { ProductCard } from "@/components/products/product-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatPHP, formatDate, cn, type OrderStatus } from "@/lib/utils";
import { PRODUCTS, CATEGORIES } from "@/lib/mock-data";
import { useWalletStore } from "@/store/wallet";
import { useCartStore } from "@/store/cart";
import { Suspense, useState, useEffect } from "react";

const PROMO_BANNERS = [
  {
    id: "flash",
    label: "Flash Sale",
    title: "Up to 30% Off",
    sub: "Beverages & Snacks · Today only",
    href: "/deals",
    gradient: "from-danger-600 to-brand-700",
    icon: "🔥",
  },
  {
    id: "free-del",
    label: "New",
    title: "Free Delivery",
    sub: "Orders ₱1,500 and above",
    href: "/catalog",
    gradient: "from-brand-700 to-brand-800",
    icon: "🚚",
  },
];

const QUICK_CATS = [
  { id: "beverages", name: "Drinks", emoji: "🥤" },
  { id: "instant-noodles", name: "Noodles", emoji: "🍜" },
  { id: "snacks", name: "Snacks", emoji: "🍿" },
  { id: "canned-goods", name: "Canned", emoji: "🥫" },
  { id: "coffee", name: "Coffee", emoji: "☕" },
  { id: "personal-care", name: "Personal", emoji: "🧼" },
];

function WelcomeBanner() {
  const params = useSearchParams();
  if (!params.get("welcome")) return null;
  return (
    <div className="mx-4 mb-4 rounded-2xl bg-brand-700 p-5 text-white animate-fade-in">
      <p className="font-display text-lg font-bold mb-1">Welcome to Ka Sari-Sari! 🎉</p>
      <p className="text-sm text-brand-100">Your account is active. Start ordering from our warehouse now.</p>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Magandang umaga";
  if (h < 17) return "Magandang hapon";
  return "Magandang gabi";
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
  eta?: string;
}

export default function DashboardPage() {
  const [greeting, setGreeting] = useState("Magandang araw");
  const [storeName, setStoreName] = useState("Your Store");
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [activeOrder, setActiveOrder] = useState<RecentOrder | null>(null);

  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.name) {
          const name = data.name as string;
          setStoreName(name.toLowerCase().includes("store") ? name : name + "'s Store");
        }
      })
      .catch(() => {});
  }, []);

  // Fetch wallet balance and recent orders from the API
  useEffect(() => {
    // Hydrate wallet
    fetch("/api/user/wallet")
      .then((r) => { if (!r.ok) return null; return r.json(); })
      .then((data) => {
        if (data?.balance !== undefined) {
          useWalletStore.getState().hydrate(data.balance, data.transactions ?? []);
        }
      })
      .catch(() => {});

    // Fetch real recent orders
    fetch("/api/orders?limit=5")
      .then((r) => { if (!r.ok) throw new Error(r.statusText); return r.json(); })
      .then((d) => {
        const orders: RecentOrder[] = (d.orders ?? []).map((o: RecentOrder) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          status: o.status,
          total: o.total,
          createdAt: o.createdAt,
          eta: o.eta,
        }));
        setRecentOrders(orders.slice(0, 2));
        const active = orders.find(
          (o) => o.status === "out_for_delivery" || o.status === "picking" || o.status === "packed"
        );
        setActiveOrder(active ?? null);
      })
      .catch(() => {});
  }, []);

  const popularProducts = PRODUCTS.filter((p) => p.isFeatured).slice(0, 4);
  const newArrivals = PRODUCTS.slice(0, 4);
  const walletBalance = useWalletStore((s) => s.balance);
  const { addItem, items: cartItems } = useCartStore();

  const lowStockProducts = PRODUCTS
    .filter((p) => p.isActive && p.stock < p.lowStockThreshold)
    .sort((a, b) => (a.stock / a.lowStockThreshold) - (b.stock / b.lowStockThreshold))
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-background pb-24">
      <RetailerTopBar />

      <div className="py-5 space-y-6">
        <Suspense fallback={null}><WelcomeBanner /></Suspense>

        {/* Greeting + wallet */}
        <div className="px-4 flex items-start justify-between">
          <div>
            <p className="text-muted-foreground text-sm">{greeting} 👋</p>
            <h1 className="font-display text-xl font-bold text-foreground mt-0.5">{storeName}</h1>
          </div>
          <Link
            href="/wallet"
            className="flex items-center gap-1.5 rounded-2xl border border-border bg-card shadow-card px-3 py-2"
          >
            <Wallet className="h-4 w-4 text-brand-700 dark:text-brand-400" />
            <span className="text-sm font-bold text-foreground">{formatPHP(walletBalance)}</span>
          </Link>
        </div>

        {/* Promo banners horizontal scroll */}
        <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-0 px-4">
          {PROMO_BANNERS.map((b) => (
            <Link
              key={b.id}
              href={b.href}
              className={`shrink-0 w-72 relative overflow-hidden rounded-2xl bg-gradient-to-r ${b.gradient} p-5 text-white active:scale-[0.98] transition-transform`}
            >
              <div className="absolute -top-4 -right-4 h-20 w-20 rounded-full bg-white/10" />
              <span className="text-xs font-bold bg-black/20 rounded-full px-2 py-0.5">{b.label}</span>
              <p className="text-2xl font-black mt-2 leading-tight">{b.icon} {b.title}</p>
              <p className="text-sm mt-1">{b.sub}</p>
              <div className="flex items-center gap-1 mt-3 text-sm font-semibold">
                Shop now <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>

        {/* Quick category chips */}
        <div className="px-4">
          <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4">
            {QUICK_CATS.map((cat) => (
              <Link
                key={cat.id}
                href={`/catalog?category=${cat.id}`}
                className="shrink-0 flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-card shadow-card px-4 py-3 hover:border-brand-200 active:scale-95 transition-all"
              >
                <span className="text-2xl">{cat.emoji}</span>
                <span className="text-[11px] font-semibold text-foreground">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Active order banner */}
        {activeOrder && (
          <div className="px-4">
            <Link href={`/orders/${activeOrder.id}`} className="block">
              <div className="rounded-2xl border border-brand-200 bg-brand-50 dark:bg-brand-500/10 px-4 py-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-500 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-500" />
                    </span>
                    <p className="text-sm font-semibold text-brand-700 dark:text-brand-400">Order on the way!</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-brand-400" />
                </div>
                <p className="text-xs text-brand-700 dark:text-brand-400">{activeOrder.orderNumber} · {activeOrder.eta ? `Expected by ${activeOrder.eta}` : "Estimated delivery by today"}</p>
                <div className="mt-3 flex gap-1">
                  {(["confirmed", "picking", "packed", "out_for_delivery"] as OrderStatus[]).map((s, i) => {
                    const steps = ["confirmed", "picking", "packed", "out_for_delivery"];
                    const currentIdx = steps.indexOf(activeOrder.status);
                    return (
                      <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= currentIdx ? "bg-brand-500" : "bg-brand-200"}`} />
                    );
                  })}
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Recent orders */}
        <div className="px-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-base font-semibold text-foreground">Recent Orders</h2>
            <Link href="/orders" className="flex items-center gap-1 text-sm text-brand-700 dark:text-brand-400 font-medium">
              See all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="rounded-2xl border border-border bg-card shadow-card divide-y divide-border overflow-hidden">
            {recentOrders.map((order) => (
              <Link key={order.id} href={`/orders/${order.id}`} className="flex items-center gap-4 px-4 py-3.5 hover:bg-muted transition-colors">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-100 dark:bg-surface-800">
                  <Package className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{order.orderNumber}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)} · {formatPHP(order.total)}</p>
                </div>
                <StatusBadge status={order.status} />
              </Link>
            ))}
            {recentOrders.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No orders yet. <Link href="/catalog" className="text-brand-700 dark:text-brand-400 font-medium">Browse the catalog →</Link>
              </div>
            )}
          </div>
        </div>

        {/* Flash deals section */}
        <div className="px-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-base font-semibold text-foreground flex items-center gap-2">
              <Flame className="h-4 w-4 text-danger-600 dark:text-danger-500" />
              Today&apos;s Deals
            </h2>
            <Link href="/deals" className="flex items-center gap-1 text-sm text-brand-700 dark:text-brand-400 font-medium">
              All deals <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
            {PRODUCTS.slice(0, 6).map((p, i) => {
              const discount = [10, 15, 20, 10, 15, 20][i];
              const salePrice = Math.round(p.price * (1 - discount / 100));
              return (
                <Link key={p.id} href={`/catalog/${p.id}`} className="shrink-0 w-40 rounded-2xl border border-border bg-card shadow-card overflow-hidden active:scale-95 transition-transform">
                  <div className="h-24 bg-gradient-to-br from-surface-100 to-surface-200 flex items-center justify-center relative overflow-hidden">
                    {p.imageUrl ? (
                      <Image src={p.imageUrl} alt={p.name} fill className="object-cover" sizes="160px" />
                    ) : (
                      <Package className="h-10 w-10 text-muted-foreground/30" />
                    )}
                    <span className="absolute top-2 left-2 rounded-full bg-danger-500 text-white text-[10px] font-bold px-1.5 py-0.5 z-10">-{discount}%</span>
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-semibold text-foreground line-clamp-2 leading-tight">{p.name}</p>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-sm font-black text-brand-700 dark:text-brand-400">{formatPHP(salePrice)}</span>
                      <span className="text-[10px] text-muted-foreground line-through">{formatPHP(p.price)}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Quick reorder */}
        <div className="px-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-base font-semibold text-foreground flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-brand-700 dark:text-brand-400" />
              Your Usuals
            </h2>
            <Link href="/catalog" className="flex items-center gap-1 text-sm text-brand-700 dark:text-brand-400 font-medium">
              Browse <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {newArrivals.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>

        {/* Popular this week */}
        <div className="px-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-brand-700 dark:text-brand-400" />
            <h2 className="font-display text-base font-semibold text-foreground">Popular This Week</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {popularProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>

        {/* Smart restock suggestions */}
        {lowStockProducts.length > 0 && (
          <div className="px-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-base font-semibold text-foreground flex items-center gap-2">
                <Zap className="h-4 w-4 text-warning-700 dark:text-warning-500" />
                Restock Suggestions
              </h2>
              <Link href="/reorder" className="flex items-center gap-1 text-sm text-brand-700 dark:text-brand-400 font-medium">
                View all <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="rounded-2xl border border-warning-200 bg-warning-50/50 overflow-hidden divide-y divide-warning-100">
              {lowStockProducts.map((p) => {
                const pctLeft = Math.round((p.stock / p.lowStockThreshold) * 100);
                const inCart = cartItems.find((c) => c.product.id === p.id);
                const urgency = pctLeft < 20 ? "critical" : "low";
                return (
                  <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="h-12 w-12 rounded-xl bg-white overflow-hidden shrink-0 border border-warning-100">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Package className="h-5 w-5 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {urgency === "critical" && <AlertTriangle className="h-3 w-3 text-danger-600 dark:text-danger-500 shrink-0" />}
                        <p className="text-xs font-semibold text-foreground truncate">{p.name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 rounded-full bg-warning-100 dark:bg-warning-500/20 overflow-hidden max-w-[80px]">
                          <div
                            className={cn("h-full rounded-full", urgency === "critical" ? "bg-danger-500" : "bg-warning-700 dark:bg-warning-500")}
                            style={{ width: `${Math.max(4, pctLeft)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground">{p.stock} left</span>
                      </div>
                      <p className="text-xs text-brand-700 dark:text-brand-400 font-bold mt-0.5">{formatPHP(p.price)} · min {p.minOrderQty} {p.unit}s</p>
                    </div>
                    <button
                      onClick={() => addItem(p)}
                      className="flex items-center gap-1 rounded-xl bg-brand-700 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-800 active:scale-95 transition-all shrink-0"
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                      {inCart ? "Add more" : "Add"}
                    </button>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-muted-foreground mt-2 px-1">
              Based on your stock levels · {lowStockProducts.length} item{lowStockProducts.length > 1 ? "s" : ""} need restocking
            </p>
          </div>
        )}
      </div>

      <RetailerBottomNav />
    </div>
  );
}
