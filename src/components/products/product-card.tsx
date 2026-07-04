"use client";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { cn, formatPHP } from "@/lib/utils";
import { useCartStore } from "@/store/cart";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  className?: string;
}

const CATEGORY_DISPLAY: Record<string, { gradient: string; emoji: string }> = {
  "cat-1": { gradient: "from-blue-400 to-cyan-500",     emoji: "🥤" },
  "cat-2": { gradient: "from-yellow-400 to-orange-500", emoji: "🍜" },
  "cat-3": { gradient: "from-red-400 to-pink-500",      emoji: "🍿" },
  "cat-4": { gradient: "from-orange-400 to-red-500",    emoji: "🥫" },
  "cat-5": { gradient: "from-green-400 to-emerald-500", emoji: "🧂" },
  "cat-6": { gradient: "from-purple-400 to-violet-500", emoji: "🧴" },
  "cat-7": { gradient: "from-amber-500 to-yellow-600",  emoji: "☕" },
  "cat-8": { gradient: "from-teal-400 to-green-500",    emoji: "🧺" },
};

export function ProductCard({ product, className }: ProductCardProps) {
  const { addItem } = useCartStore();
  const outOfStock = product.stock === 0;
  const lowStock = product.stock > 0 && product.stock <= product.lowStockThreshold;
  const display = CATEGORY_DISPLAY[product.categoryId] || { gradient: "from-gray-400 to-slate-500", emoji: "📦" };

  const hasSavings = product.srp && product.price < product.srp;
  const savingsPct = hasSavings
    ? Math.round(((product.srp! - product.price) / product.srp!) * 100)
    : 0;

  return (
    <Link
      href={`/catalog/${product.id}`}
      className={cn(
        "group block rounded-2xl border border-border bg-card shadow-card overflow-hidden hover:shadow-card-md active:scale-[0.98] transition-all",
        className
      )}
    >
      {/* Image area */}
      <div className={cn("relative h-32 bg-gradient-to-br flex items-center justify-center rounded-t-2xl", display.gradient)}>
        <span className="text-4xl select-none" role="img">{display.emoji}</span>

        {/* Savings badge */}
        {hasSavings && (
          <span className="absolute top-2 right-2 rounded-lg bg-danger-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow">
            Save {savingsPct}%
          </span>
        )}

        {/* Out of stock overlay */}
        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-t-2xl">
            <span className="rounded-lg bg-surface-900/90 px-3 py-1 text-xs font-semibold text-white">
              Out of Stock
            </span>
          </div>
        )}

        {/* Low stock badge */}
        {lowStock && !outOfStock && (
          <span className="absolute top-2 left-2 rounded-lg bg-warning-500 px-2 py-0.5 text-[10px] font-bold text-white shadow">
            Low Stock
          </span>
        )}
      </div>

      {/* Info area */}
      <div className="p-3 flex flex-col gap-2">
        {/* Brand */}
        {product.brand && (
          <p className="text-[10px] font-semibold text-brand-500 uppercase tracking-wider leading-none">
            {product.brand}
          </p>
        )}

        {/* Name */}
        <p className="text-sm font-semibold text-foreground line-clamp-2 leading-tight -mt-1">
          {product.name}
        </p>

        {/* Unit size */}
        {product.unitSize && (
          <p className="text-xs text-muted-foreground -mt-1">{product.unitSize}</p>
        )}

        {/* Price row */}
        <div className="flex items-baseline gap-1.5">
          <span className="text-base font-black text-brand-500">{formatPHP(product.price)}</span>
          {product.srp && product.srp > product.price && (
            <span className="text-[11px] text-muted-foreground line-through">{formatPHP(product.srp)}</span>
          )}
        </div>

        {/* Min order */}
        <p className="text-xs text-muted-foreground -mt-1">
          Min. {product.minOrderQty} {product.unit}
        </p>

        {/* Add to cart button */}
        {outOfStock ? (
          <button
            disabled
            onClick={(e) => e.preventDefault()}
            className="mt-1 w-full flex items-center justify-center gap-1.5 rounded-xl bg-muted text-muted-foreground text-xs font-semibold py-2 cursor-not-allowed"
          >
            Out of Stock
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.preventDefault();
              addItem(product, product.minOrderQty);
            }}
            className="mt-1 w-full flex items-center justify-center gap-1.5 rounded-xl bg-brand-500 text-white text-xs font-semibold py-2 hover:bg-brand-600 active:scale-95 transition-all shadow-brand"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Add to Cart
          </button>
        )}
      </div>
    </Link>
  );
}
