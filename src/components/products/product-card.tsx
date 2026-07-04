"use client";
import Link from "next/link";
import { Plus, Minus, ShoppingCart, AlertTriangle, Heart } from "lucide-react";
import { cn, formatPHP } from "@/lib/utils";
import { useCartStore } from "@/store/cart";
import { useFavoritesStore } from "@/store/favorites";
import type { Product } from "@/types";
import { Button } from "@/components/ui/button";

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { items, addItem, updateQty } = useCartStore();
  const { isFavorite, toggle } = useFavoritesStore();
  const cartItem = items.find((i) => i.productId === product.id);
  const qty = cartItem?.quantity ?? 0;
  const inCart = qty > 0;
  const outOfStock = product.stock === 0;
  const lowStock = product.stock > 0 && product.stock <= product.lowStockThreshold;
  const favorited = isFavorite(product.id);

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-2xl border border-border bg-card overflow-hidden shadow-card hover:shadow-card-md transition-shadow",
        outOfStock && "opacity-60",
        className
      )}
    >
      {/* Image - tap goes to product detail */}
      <Link href={`/catalog/${product.id}`} className="relative aspect-square bg-surface-100 overflow-hidden block">
        <div className="absolute inset-0 flex items-center justify-center text-surface-300">
          <ShoppingCart className="h-12 w-12" strokeWidth={1} />
        </div>
        {product.isFeatured && (
          <span className="absolute top-2 left-2 rounded-lg bg-brand-500 px-2 py-0.5 text-[10px] font-semibold text-white">
            Popular
          </span>
        )}
        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-950/30">
            <span className="rounded-lg bg-surface-900 px-2.5 py-1 text-xs font-medium text-white">
              Out of Stock
            </span>
          </div>
        )}
        {lowStock && !outOfStock && (
          <span className="absolute top-2 right-2 flex items-center gap-1 rounded-lg bg-warning-50 border border-warning-500/25 px-1.5 py-0.5 text-[10px] font-medium text-warning-600">
            <AlertTriangle className="h-2.5 w-2.5" />
            Low
          </span>
        )}
        {/* Favorite button */}
        <button
          onClick={(e) => { e.preventDefault(); toggle(product); }}
          className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-card/90 backdrop-blur-sm shadow-sm hover:scale-110 transition-transform"
          aria-label={favorited ? "Remove from favorites" : "Save to favorites"}
        >
          <Heart className={cn("h-4 w-4", favorited ? "fill-danger-500 text-danger-500" : "text-muted-foreground")} />
        </button>
      </Link>

      {/* Info */}
      <div className="flex flex-col flex-1 p-3.5 gap-2">
        <Link href={`/catalog/${product.id}`} className="block">
          {product.brand && (
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-0.5">
              {product.brand}
            </p>
          )}
          <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
            {product.name}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Min. {product.minOrderQty} {product.unit}
            {product.stock > 0 && ` · ${product.stock} avail`}
          </p>
        </Link>

        <div className="flex items-end justify-between mt-auto">
          <div>
            <p className="text-base font-bold text-foreground">{formatPHP(product.price)}</p>
            {product.srp && (
              <p className="text-[10px] text-muted-foreground line-through">{formatPHP(product.srp)} SRP</p>
            )}
          </div>

          {/* Cart controls */}
          {outOfStock ? (
            <Button variant="outline" size="sm" disabled className="text-xs">
              Unavailable
            </Button>
          ) : inCart ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => updateQty(product.id, qty - 1)}
                className="flex h-7 w-7 items-center justify-center rounded-xl border border-border bg-muted hover:bg-surface-200 transition-colors"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-8 text-center text-sm font-semibold text-foreground">{qty}</span>
              <button
                onClick={() => updateQty(product.id, qty + 1)}
                className="flex h-7 w-7 items-center justify-center rounded-xl bg-brand-500 text-white hover:bg-brand-600 transition-colors"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => addItem(product, product.minOrderQty)}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500 text-white hover:bg-brand-600 transition-colors shadow-brand active:scale-95"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
