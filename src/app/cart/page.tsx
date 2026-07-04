"use client";
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight } from "lucide-react";
import { RetailerTopBar, RetailerBottomNav } from "@/components/layout/retailer-nav";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useCartStore } from "@/store/cart";
import { formatPHP } from "@/lib/utils";

const DELIVERY_FEE = 80;

export default function CartPage() {
  const { items, updateQty, removeItem, clearCart } = useCartStore();
  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const total = subtotal + (items.length > 0 ? DELIVERY_FEE : 0);

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
          {/* Items */}
          <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden divide-y divide-border">
            {items.map(({ product, quantity }) => (
              <div key={product.id} className="flex items-center gap-3 px-4 py-3.5">
                <div className="h-14 w-14 rounded-xl bg-surface-100 shrink-0 flex items-center justify-center text-muted-foreground">
                  <ShoppingCart className="h-6 w-6" strokeWidth={1.2} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground leading-snug line-clamp-1">{product.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatPHP(product.price)} each</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateQty(product.id, quantity - 1)}
                      className="flex h-6 w-6 items-center justify-center rounded-lg border border-border bg-muted hover:bg-surface-200 transition-colors"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">{quantity}</span>
                    <button
                      onClick={() => updateQty(product.id, quantity + 1)}
                      disabled={product.stock !== undefined && quantity >= product.stock}
                      className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition-colors disabled:opacity-40"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <p className="text-sm font-bold text-foreground">{formatPHP(product.price * quantity)}</p>
                  <button onClick={() => removeItem(product.id)} className="text-muted-foreground hover:text-danger-500 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="rounded-2xl border border-border bg-card shadow-card p-5 space-y-3">
            <h3 className="font-display text-sm font-semibold text-foreground">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span>{formatPHP(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery fee</span>
                <span>{formatPHP(DELIVERY_FEE)}</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between font-semibold text-foreground">
                <span>Total</span>
                <span>{formatPHP(total)}</span>
              </div>
            </div>
          </div>

          <ButtonLink size="lg" href="/checkout" className="w-full">
            Proceed to Checkout - {formatPHP(total)}
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
