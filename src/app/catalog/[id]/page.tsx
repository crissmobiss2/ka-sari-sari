"use client";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { ArrowLeft, Heart, Share2, ShoppingCart, Star, Package, CheckCircle2, Truck, Shield } from "lucide-react";
import { RetailerBottomNav } from "@/components/layout/retailer-nav";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/products/product-card";
import { PRODUCTS, CATEGORIES } from "@/lib/mock-data";
import { useCartStore } from "@/store/cart";
import { useFavoritesStore } from "@/store/favorites";
import { formatPHP } from "@/lib/utils";
import { cn } from "@/lib/utils";

const MOCK_REVIEWS = [
  { id: 1, name: "Maria Santos", rating: 5, comment: "Laging bago at fresh yung products. Solid supplier!", date: "Jan 3, 2025" },
  { id: 2, name: "Juan dela Cruz", rating: 5, comment: "Mabilis yung delivery at tama yung quantity. Highly recommended!", date: "Dec 28, 2024" },
  { id: 3, name: "Ana Reyes", rating: 4, comment: "Good quality at competitive price. Will order again.", date: "Dec 15, 2024" },
];

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const product = PRODUCTS.find((p) => p.id === id);
  const related = PRODUCTS.filter((p) => p.categoryId === product?.categoryId && p.id !== id).slice(0, 4);

  const { addItem, items, updateQty } = useCartStore();
  const { isFavorite, toggle } = useFavoritesStore();
  const [qty, setQty] = useState(product?.minOrderQty || 1);
  const [added, setAdded] = useState(false);
  const [imgError, setImgError] = useState(false);

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background px-4">
        <Package className="h-12 w-12 text-muted-foreground" />
        <p className="text-foreground font-semibold">Product not found</p>
        <button onClick={() => router.back()} className="text-sm text-brand-500 underline">Go back</button>
      </div>
    );
  }

  const cartItem = items.find((i) => i.product.id === product.id);
  const stockColor = product.stock === 0 ? "text-danger-500" : product.stock < 20 ? "text-warning-600" : "text-success-600";
  const stockLabel = product.stock === 0 ? "Out of stock" : product.stock < 20 ? `Only ${product.stock} left` : "In stock";
  const avgRating = (MOCK_REVIEWS.reduce((s, r) => s + r.rating, 0) / MOCK_REVIEWS.length).toFixed(1);

  function handleAddToCart() {
    if (!product) return;
    addItem(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between bg-card/90 backdrop-blur-md border-b border-border px-4">
        <button onClick={() => router.back()} className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <span className="font-display text-sm font-bold text-foreground truncate mx-3">{product.name}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => toggle(product)}
            className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-muted transition-colors"
          >
            <Heart className={cn("h-5 w-5", isFavorite(product.id) ? "fill-danger-500 text-danger-500" : "text-muted-foreground")} />
          </button>
        </div>
      </div>

      {/* Product image */}
      <div className="h-64 md:h-80 bg-gradient-to-br from-surface-100 to-surface-200 flex items-center justify-center">
        {product.imageUrl && !imgError ? (
          <div className="relative h-full w-full rounded-2xl overflow-hidden">
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-contain"
              sizes="100vw"
              priority
              onError={() => setImgError(true)}
            />
          </div>
        ) : (
          <Package className="h-24 w-24 text-muted-foreground/30" strokeWidth={0.8} />
        )}
      </div>

      <div className="px-4 py-5 space-y-6">
        {/* Basic info */}
        <div>
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1">
              <p className="text-xs font-semibold text-brand-500 uppercase tracking-wide mb-1">{product.brand}</p>
              <h1 className="font-display text-xl font-bold text-foreground leading-tight">{product.name}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <span className={cn("text-xs font-semibold flex items-center gap-1", stockColor)}>
              <CheckCircle2 className="h-3.5 w-3.5" />
              {stockLabel}
            </span>
            <span className="text-xs text-muted-foreground">Min. order: {product.minOrderQty} pcs</span>
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-semibold text-foreground">{avgRating}</span>
              <span className="text-xs text-muted-foreground">({MOCK_REVIEWS.length} reviews)</span>
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-black text-brand-500">{formatPHP(product.price)}</span>
            <span className="text-sm text-muted-foreground">per piece</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Order total: {formatPHP(product.price * qty)}
          </p>
        </div>

        {/* Qty selector */}
        <div className="rounded-2xl border border-border bg-card shadow-card p-4">
          <p className="text-sm font-semibold text-foreground mb-3">Quantity</p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setQty(Math.max(product.minOrderQty, qty - 1))}
              disabled={qty <= product.minOrderQty}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-muted text-lg font-bold hover:bg-surface-200 disabled:opacity-30 transition-colors"
            >
              −
            </button>
            <span className="text-2xl font-bold text-foreground w-16 text-center tabular-nums">{qty}</span>
            <button
              onClick={() => setQty(Math.min(product.stock || 999, qty + 1))}
              disabled={product.stock !== undefined && qty >= product.stock}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500 text-white text-lg font-bold hover:bg-brand-600 disabled:opacity-30 transition-colors"
            >
              +
            </button>
            <div className="ml-2 text-right flex-1">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-bold text-foreground">{formatPHP(product.price * qty)}</p>
            </div>
          </div>
        </div>

        {/* Trust signals */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Truck, label: "2-3 Day Delivery" },
            { icon: Shield, label: "Quality Guaranteed" },
            { icon: Package, label: "Bulk Savings" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card py-3 px-2 text-center">
              <Icon className="h-5 w-5 text-brand-500" />
              <p className="text-[10px] font-medium text-muted-foreground leading-tight">{label}</p>
            </div>
          ))}
        </div>

        {/* Description */}
        <div className="rounded-2xl border border-border bg-card shadow-card p-4 space-y-3">
          <h2 className="font-display text-sm font-bold text-foreground">Product Details</h2>
          <div className="space-y-2 text-sm">
            {[
              { label: "Brand", value: product.brand },
              { label: "Category", value: CATEGORIES.find(c => c.id === product.categoryId)?.name ?? "-" },
              { label: "Unit size", value: product.unit },
              { label: "Min. order", value: `${product.minOrderQty} pieces` },
              { label: "Stock", value: `${product.stock} pcs available` },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium text-foreground">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews */}
        <div>
          <h2 className="font-display text-base font-bold text-foreground mb-3">
            Reviews
            <span className="ml-2 text-sm font-normal text-muted-foreground">({MOCK_REVIEWS.length})</span>
          </h2>
          <div className="space-y-3">
            {MOCK_REVIEWS.map((review) => (
              <div key={review.id} className="rounded-2xl border border-border bg-card shadow-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-foreground">{review.name}</p>
                  <p className="text-xs text-muted-foreground">{review.date}</p>
                </div>
                <div className="flex gap-0.5 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={cn("h-3.5 w-3.5", i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-surface-300")} />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <div>
            <h2 className="font-display text-base font-bold text-foreground mb-3">You may also need</h2>
            <div className="grid grid-cols-2 gap-3">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fixed CTA */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-card/95 backdrop-blur-md px-4 py-4">
        {cartItem ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 flex-1">
              <button onClick={() => updateQty(product.id, cartItem.quantity - 1)} className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-muted text-lg font-bold">−</button>
              <span className="flex-1 text-center text-lg font-bold">{cartItem.quantity} in cart</span>
              <button onClick={() => updateQty(product.id, cartItem.quantity + 1)} className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500 text-white text-lg font-bold">+</button>
            </div>
          </div>
        ) : (
          <Button size="lg" className="w-full" onClick={handleAddToCart} disabled={product.stock === 0}>
            {added ? (
              <><CheckCircle2 className="h-4 w-4" /> Added to Cart!</>
            ) : (
              <><ShoppingCart className="h-4 w-4" /> Add {qty} to Cart - {formatPHP(product.price * qty)}</>
            )}
          </Button>
        )}
      </div>

      <RetailerBottomNav />
    </div>
  );
}
