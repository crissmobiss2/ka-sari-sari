"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight, Truck, Gift } from "lucide-react";
import { RetailerTopBar, RetailerBottomNav } from "@/components/layout/retailer-nav";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useCartStore } from "@/store/cart";
import { formatPHP, cn } from "@/lib/utils";

const DELIVERY_FEE = 80;
const FREE_DELIVERY_THRESHOLD = 1500;

const CATEGORY_EMOJI: Record<string, string> = {
  "cat-01": "☕", "cat-02": "🍜", "cat-03": "🍿", "cat-04": "🍫",
  "cat-05": "🥫", "cat-06": "🥤", "cat-07": "🧃", "cat-08": "🥛",
  "cat-09": "🧂", "cat-10": "🍳", "cat-11": "🧈", "cat-12": "🍞",
  "cat-13": "🥚", "cat-14": "🍚", "cat-15": "🧊", "cat-16": "🧴",
  "cat-17": "🌸", "cat-18": "🧺", "cat-19": "🧹", "cat-20": "🦟",
  "cat-21": "👶", "cat-22": "📚", "cat-23": "💊", "cat-24": "🔋",
  "cat-25": "💧", "cat-26": "📱",
};

function ProductThumb({ product }: { product: { imageUrl?: string; categoryId: string; name: string } }) {
  const [err, setErr] = useState(false);
  const emoji = CATEGORY_EMOJI[product.categoryId] ?? "📦";

  if (product.imageUrl && !err) {
    return (
      <div className="relative h-14 w-14 rounded-xl overflow-hidden shrink-0 bg-surface-100 dark:bg-surface-800">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-cover"
          sizes="56px"
          onError={() => setErr(true)}
        />
      </div>
    );
  }
  return (
    <div className="h-14 w-14 rounded-xl shrink-0 bg-gradient-to-br from-surface-100 to-surface-200 flex items-center justify-center text-2xl">
      {emoji}
    </div>
  );
}

export default function CartPage() {
  const { items, updateQty, removeItem, clearCart, _hasHydrated } = useCartStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const subtotal    = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const freeDelivery = subtotal >= FREE_DELIVERY_THRESHOLD;
  const toFree      = FREE_DELIVERY_THRESHOLD - subtotal;
  const progress    = Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100);
  const deliveryFee = freeDelivery ? 0 : DELIVERY_FEE;
  const total       = subtotal + deliveryFee;

  if (!mounted || !_hasHydrated) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <RetailerTopBar title="Cart" />
        <div className="px-4 py-5 space-y-4 animate-pulse">
          <div className="h-16 rounded-2xl bg-muted" />
          <div className="h-28 rounded-2xl bg-muted" />
          <div className="h-20 rounded-2xl bg-muted" />
        </div>
        <RetailerBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <RetailerTopBar title="Cart" />

      {items.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart className="h-8 w-8" />}
          title="Your cart is empty"
          description="Add products from the catalog to start your order."
          action={{ label: "Browse catalog", onClick: () => window.location.href = "/catalog" }}
          className="min-h-[60vh]"
        />
      ) : (
        <div className="px-4 py-5 space-y-4">
          {/* Free delivery progress */}
          <div className={cn(
            "rounded-2xl border px-4 py-3.5 space-y-2.5",
            freeDelivery
              ? "border-success-500/30 bg-success-50 dark:bg-success-500/10"
              : "border-border bg-card"
          )}>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Truck className={cn("h-4 w-4", freeDelivery ? "text-success-700 dark:text-foreground" : "text-muted-foreground")} />
                <span className={cn("font-medium", freeDelivery ? "text-success-700 dark:text-foreground" : "text-foreground")}>
                  {freeDelivery ? "Free delivery unlocked!" : `Add ${formatPHP(toFree)} for free delivery`}
                </span>
              </div>
              {freeDelivery && <Gift className="h-4 w-4 text-success-500" />}
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-500", freeDelivery ? "bg-success-500" : "bg-brand-500")}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Items */}
          <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden divide-y divide-border">
            {items.map(({ product, quantity }) => (
              <div key={product.id} className="flex items-center gap-3 px-4 py-3.5">
                <ProductThumb product={product} />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-brand-700 dark:text-brand-400 uppercase tracking-wide">{product.brand}</p>
                  <p className="text-sm font-semibold text-foreground leading-snug line-clamp-1">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{formatPHP(product.price)} each</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateQty(product.id, quantity - 1)}
                      className="flex h-6 w-6 items-center justify-center rounded-lg border border-border bg-muted hover:bg-surface-200 transition-colors"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-8 text-center text-sm font-bold tabular-nums">{quantity}</span>
                    <button
                      onClick={() => updateQty(product.id, quantity + 1)}
                      disabled={product.stock !== undefined && quantity >= product.stock}
                      className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-700 text-white hover:bg-brand-800 transition-colors disabled:opacity-40"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <p className="text-sm font-bold text-foreground">{formatPHP(product.price * quantity)}</p>
                  <button onClick={() => removeItem(product.id)} className="text-muted-foreground hover:text-danger-500 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Order summary */}
          <div className="rounded-2xl border border-border bg-card shadow-card p-5 space-y-3">
            <h3 className="font-display text-sm font-semibold text-foreground">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span>{formatPHP(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery fee</span>
                {freeDelivery ? (
                  <span className="text-success-700 dark:text-foreground font-medium line-through-none flex items-center gap-1">
                    <span className="line-through text-muted-foreground/60">{formatPHP(DELIVERY_FEE)}</span>
                    <span className="text-success-700 dark:text-foreground">FREE</span>
                  </span>
                ) : (
                  <span>{formatPHP(DELIVERY_FEE)}</span>
                )}
              </div>
              <div className="border-t border-border pt-2 flex justify-between font-bold text-foreground text-base">
                <span>Total</span>
                <span className="text-brand-700 dark:text-brand-400">{formatPHP(total)}</span>
              </div>
            </div>
          </div>

          <ButtonLink size="lg" href="/checkout" className="w-full">
            Proceed to Checkout — {formatPHP(total)}
            <ArrowRight className="h-4 w-4" />
          </ButtonLink>

          <button onClick={clearCart} className="w-full text-center text-sm text-muted-foreground hover:text-danger-500 transition-colors py-2">
            Clear cart
          </button>
        </div>
      )}

      <RetailerBottomNav />
    </div>
  );
}
