"use client";
import { useState } from "react";
import Image from "next/image";
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
  "cat-01": { gradient: "from-amber-500 to-yellow-600",   emoji: "☕" },
  "cat-02": { gradient: "from-yellow-400 to-orange-500",  emoji: "🍜" },
  "cat-03": { gradient: "from-orange-400 to-red-500",     emoji: "🍿" },
  "cat-04": { gradient: "from-pink-400 to-rose-500",      emoji: "🍫" },
  "cat-05": { gradient: "from-red-400 to-orange-500",     emoji: "🥫" },
  "cat-06": { gradient: "from-blue-400 to-cyan-500",      emoji: "🥤" },
  "cat-07": { gradient: "from-green-400 to-teal-500",     emoji: "🧃" },
  "cat-08": { gradient: "from-sky-300 to-blue-400",       emoji: "🥛" },
  "cat-09": { gradient: "from-amber-400 to-orange-500",   emoji: "🧂" },
  "cat-10": { gradient: "from-yellow-300 to-amber-400",   emoji: "🍳" },
  "cat-11": { gradient: "from-yellow-400 to-amber-500",   emoji: "🧈" },
  "cat-12": { gradient: "from-amber-300 to-orange-400",   emoji: "🍞" },
  "cat-13": { gradient: "from-yellow-200 to-amber-300",   emoji: "🥚" },
  "cat-14": { gradient: "from-lime-300 to-green-400",     emoji: "🍚" },
  "cat-15": { gradient: "from-cyan-400 to-blue-500",      emoji: "🧊" },
  "cat-16": { gradient: "from-purple-400 to-violet-500",  emoji: "🧴" },
  "cat-17": { gradient: "from-pink-300 to-rose-400",      emoji: "🌸" },
  "cat-18": { gradient: "from-teal-400 to-green-500",     emoji: "🧺" },
  "cat-19": { gradient: "from-emerald-400 to-green-600",  emoji: "🧹" },
  "cat-20": { gradient: "from-red-500 to-rose-600",       emoji: "🦟" },
  "cat-21": { gradient: "from-pink-300 to-pink-500",      emoji: "👶" },
  "cat-22": { gradient: "from-indigo-400 to-blue-500",    emoji: "📚" },
  "cat-23": { gradient: "from-red-300 to-rose-400",       emoji: "💊" },
  "cat-24": { gradient: "from-gray-400 to-slate-500",     emoji: "🔋" },
  "cat-25": { gradient: "from-blue-300 to-cyan-400",      emoji: "💧" },
  "cat-26": { gradient: "from-violet-400 to-purple-500",  emoji: "📱" },
};

export function ProductCard({ product, className }: ProductCardProps) {
  const { addItem } = useCartStore();
  const [imgError, setImgError] = useState(false);

  const outOfStock = product.stock === 0;
  const lowStock   = product.stock > 0 && product.stock <= product.lowStockThreshold;
  const display    = CATEGORY_DISPLAY[product.categoryId] || { gradient: "from-gray-400 to-slate-500", emoji: "📦" };

  const hasSavings = product.srp && product.price < product.srp;
  const savingsPct = hasSavings
    ? Math.round(((product.srp! - product.price) / product.srp!) * 100)
    : 0;

  const showRealImage = !!product.imageUrl && !imgError;

  return (
    <Link
      href={`/catalog/${product.id}`}
      className={cn(
        "group block rounded-2xl border border-border bg-card shadow-card overflow-hidden hover:shadow-card-md active:scale-[0.98] transition-all",
        className
      )}
    >
      {/* Image area */}
      <div className={cn(
        "relative h-32 overflow-hidden rounded-t-2xl",
        !showRealImage && `bg-gradient-to-br ${display.gradient} flex items-center justify-center`
      )}>
        {showRealImage ? (
          <Image
            src={product.imageUrl!}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <span className="text-4xl select-none" role="img">{display.emoji}</span>
        )}

        {/* Savings badge */}
        {hasSavings && (
          <span className="absolute top-2 right-2 rounded-lg bg-danger-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow z-10">
            Save {savingsPct}%
          </span>
        )}

        {/* Out of stock overlay */}
        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-t-2xl z-10">
            <span className="rounded-lg bg-surface-900/90 px-3 py-1 text-xs font-semibold text-white">
              Out of Stock
            </span>
          </div>
        )}

        {/* Low stock badge */}
        {lowStock && !outOfStock && (
          <span className="absolute top-2 left-2 rounded-lg bg-warning-500 px-2 py-0.5 text-[10px] font-bold text-white shadow z-10">
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
            className="mt-1 w-full flex items-center justify-center gap-1.5 rounded-xl bg-muted text-muted-foreground text-xs font-semibold py-3 min-h-[44px] cursor-not-allowed"
          >
            Out of Stock
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.preventDefault();
              addItem(product, product.minOrderQty);
            }}
            className="mt-1 w-full flex items-center justify-center gap-1.5 rounded-xl bg-brand-700 text-white text-xs font-semibold py-3 min-h-[44px] hover:bg-brand-600 active:scale-95 transition-all shadow-brand"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Add to Cart
          </button>
        )}
      </div>
    </Link>
  );
}
