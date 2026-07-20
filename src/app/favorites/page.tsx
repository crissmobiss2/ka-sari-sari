"use client";
import Link from "next/link";
import { Heart, Package, ShoppingCart } from "lucide-react";
import { RetailerTopBar, RetailerBottomNav } from "@/components/layout/retailer-nav";
import { EmptyState } from "@/components/ui/empty-state";
import { useFavoritesStore } from "@/store/favorites";
import { useCartStore } from "@/store/cart";
import { formatPHP } from "@/lib/utils";

export default function FavoritesPage() {
  const { items: favorites, remove } = useFavoritesStore();
  const { addItem, items: cartItems } = useCartStore();

  return (
    <div className="min-h-screen bg-background pb-24">
      <RetailerTopBar title="My Favorites" />

      {favorites.length === 0 ? (
        <EmptyState
          icon={<Heart className="h-8 w-8" />}
          title="No saved items yet"
          description="Tap the heart icon on any product to save it here for quick ordering."
          action={{ label: "Browse catalog", onClick: () => (window.location.href = "/catalog") }}
          className="min-h-[60vh]"
        />
      ) : (
        <div className="px-4 py-5 space-y-3">
          <p className="text-sm text-muted-foreground">{favorites.length} saved {favorites.length === 1 ? "item" : "items"}</p>
          {favorites.map((product) => {
            const inCart = cartItems.find((c) => c.product.id === product.id);
            return (
              <div key={product.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card shadow-card p-3">
                <div className="h-16 w-16 rounded-xl bg-surface-100 dark:bg-surface-800 shrink-0 overflow-hidden">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Package className="h-7 w-7 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground line-clamp-1">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{product.brand}</p>
                  <p className="text-sm font-bold text-brand-700 dark:text-brand-400 mt-1">{formatPHP(product.price)}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <button
                    onClick={() => remove(product.id)}
                    className="text-danger-400 hover:text-danger-600 dark:text-danger-500 transition-colors"
                    aria-label="Remove from favorites"
                  >
                    <Heart className="h-5 w-5 fill-current" />
                  </button>
                  <button
                    onClick={() => addItem(product)}
                    className="flex items-center gap-1 rounded-xl bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-800 transition-colors active:scale-95"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    {inCart ? "Add more" : "Add"}
                  </button>
                </div>
              </div>
            );
          })}

          <Link
            href="/catalog"
            className="block text-center text-sm text-brand-700 dark:text-brand-400 hover:text-brand-600 font-medium py-2"
          >
            Browse more products
          </Link>
        </div>
      )}

      <RetailerBottomNav />
    </div>
  );
}
