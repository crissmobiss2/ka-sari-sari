"use client";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  Heart,
  ShoppingCart,
  Star,
  Package,
  CheckCircle2,
  Truck,
  Shield,
  AlertTriangle,
  XCircle,
  Tag,
  TrendingDown,
  Loader2,
} from "lucide-react";
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

// Derives simple bulk-discount tiers from product pricing context.
// Since the Product type has no bulkPricing field, we simulate tiers based on
// the wholesale price vs SRP spread and common sari-sari bulk thresholds.
function getBulkTiers(price: number, minOrderQty: number) {
  return [
    { minQty: minOrderQty * 2,  discountPct: 3  },
    { minQty: minOrderQty * 5,  discountPct: 5  },
    { minQty: minOrderQty * 10, discountPct: 8  },
  ].map((t) => ({
    ...t,
    discountedPrice: Math.round(price * (1 - t.discountPct / 100) * 100) / 100,
  }));
}

// ── Stock badge ────────────────────────────────────────────────────────────────
type StockStatus = "out" | "low" | "ok";

function getStockStatus(stock: number): StockStatus {
  if (stock === 0)  return "out";
  if (stock < 50)   return "low";
  return "ok";
}

interface StockBadgeProps {
  stock: number;
  className?: string;
}

function StockBadge({ stock, className }: StockBadgeProps) {
  const status = getStockStatus(stock);

  if (status === "out") {
    return (
      <span className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold bg-danger-100 dark:bg-danger-500/20 text-danger-700 dark:text-foreground border border-danger-200",
        className,
      )}>
        <XCircle className="h-3.5 w-3.5" />
        Out of Stock
      </span>
    );
  }

  if (status === "low") {
    return (
      <span className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold bg-warning-100 dark:bg-warning-500/20 text-warning-700 dark:text-foreground border border-warning-200",
        className,
      )}>
        <AlertTriangle className="h-3.5 w-3.5" />
        Low Stock — {stock} left
      </span>
    );
  }

  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold bg-success-100 dark:bg-success-500/20 text-success-700 dark:text-foreground border border-success-200",
      className,
    )}>
      <CheckCircle2 className="h-3.5 w-3.5" />
      In Stock
    </span>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  // Fetch product from API; fall back to mock data if unavailable
  const [product, setProduct] = useState<(typeof PRODUCTS)[0] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/products/${id}`)
      .then((r) => { if (!r.ok) return null; return r.json(); })
      .then((data) => {
        const p = data?.product ?? (data?.id ? data : null);
        // Fall back to mock data if API returns nothing
        setProduct(p ?? PRODUCTS.find((q) => q.id === id) ?? null);
      })
      .catch(() => {
        setProduct(PRODUCTS.find((p) => p.id === id) ?? null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Related products — derived once product is known
  const related = PRODUCTS.filter((p) => p.categoryId === product?.categoryId && p.id !== id).slice(0, 4);

  const { addItem, items, updateQty } = useCartStore();
  const { isFavorite, toggle } = useFavoritesStore();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [reviews, setReviews] = useState(MOCK_REVIEWS);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/products/${id}/reviews`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (Array.isArray(data?.reviews) && data.reviews.length > 0) setReviews(data.reviews);
      })
      .catch(() => {});
  }, [id]);

  // Sync qty to product's minimum order qty once loaded
  useEffect(() => {
    if (product?.minOrderQty) setQty(product.minOrderQty);
  }, [product?.minOrderQty]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-brand-700 dark:text-brand-400" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background px-4">
        <Package className="h-12 w-12 text-muted-foreground" />
        <p className="text-foreground font-semibold">Product not found</p>
        <button onClick={() => router.back()} className="text-sm text-brand-700 dark:text-brand-400 underline">Go back</button>
      </div>
    );
  }

  const cartItem = items.find((i) => i.product.id === product.id);
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "5.0";

  // Savings vs SRP
  const hasSrp = product.srp !== undefined && product.srp > product.price;
  const savingsPerUnit = hasSrp ? (product.srp! - product.price) : 0;
  const savingsTotal = savingsPerUnit * qty;
  const savingsPct = hasSrp ? Math.round((savingsPerUnit / product.srp!) * 100) : 0;

  // Min-order enforcement
  const belowMinOrder = qty < product.minOrderQty;
  const isOutOfStock = product.stock === 0;
  const addDisabled = isOutOfStock || belowMinOrder;

  // Bulk discount tiers (simulated)
  const bulkTiers = getBulkTiers(product.price, product.minOrderQty);

  // Active bulk tier for current qty
  const activeTier = [...bulkTiers].reverse().find((t) => qty >= t.minQty);

  function handleAddToCart() {
    if (!product || addDisabled) return;
    addItem(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  function handleQtyDecrease() {
    setQty((prev) => Math.max(product!.minOrderQty, prev - 1));
  }

  function handleQtyIncrease() {
    setQty((prev) => Math.min(product!.stock || 9999, prev + 1));
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between bg-card/90 backdrop-blur-md border-b border-border px-4">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <span className="font-display text-sm font-bold text-foreground truncate mx-3">{product.name}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => toggle(product)}
            className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-muted transition-colors"
          >
            <Heart className={cn("h-5 w-5", isFavorite(product.id) ? "fill-danger-500 text-danger-600 dark:text-danger-500" : "text-muted-foreground")} />
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
              <p className="text-xs font-semibold text-brand-700 dark:text-brand-400 uppercase tracking-wide mb-1">{product.brand}</p>
              <h1 className="font-display text-xl font-bold text-foreground leading-tight">{product.name}</h1>
            </div>
          </div>

          {/* Stock badge + rating row */}
          <div className="flex items-center gap-3 flex-wrap mt-2">
            <StockBadge stock={product.stock} />
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-amber-600 text-amber-600" />
              <span className="text-xs font-semibold text-foreground">{avgRating}</span>
              <span className="text-xs text-muted-foreground">({reviews.length} reviews)</span>
            </div>
          </div>

          {/* Price block */}
          <div className="mt-3 flex items-baseline gap-2 flex-wrap">
            <span className="font-display text-3xl font-black text-brand-700 dark:text-brand-400">{formatPHP(product.price)}</span>
            {hasSrp && (
              <span className="text-base text-muted-foreground line-through">{formatPHP(product.srp!)}</span>
            )}
            <span className="text-sm text-muted-foreground">per {product.unit}</span>
          </div>

          {/* SRP savings highlight */}
          {hasSrp && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-success-50 dark:bg-success-500/10 border border-success-200 px-3 py-1.5">
              <TrendingDown className="h-4 w-4 text-success-700 dark:text-foreground shrink-0" />
              <p className="text-sm font-semibold text-success-700 dark:text-foreground">
                You save {formatPHP(savingsTotal)} vs retail price
                <span className="ml-1 font-normal text-success-700 dark:text-foreground">({savingsPct}% off SRP)</span>
              </p>
            </div>
          )}

          <p className="text-xs text-muted-foreground mt-2">
            Order total: <span className="font-semibold text-foreground">{formatPHP(product.price * qty)}</span>
          </p>
        </div>

        {/* Min-order callout */}
        <div className="rounded-2xl border border-brand-200 bg-brand-50 dark:bg-brand-500/10 px-4 py-3 flex items-center gap-3">
          <Tag className="h-5 w-5 text-brand-700 dark:text-brand-400 shrink-0" />
          <div>
            <p className="text-xs font-bold text-brand-700 dark:text-brand-400 uppercase tracking-wide">Minimum Order</p>
            <p className="text-sm font-semibold text-brand-700 dark:text-brand-400">
              {product.minOrderQty} {product.unit}{product.minOrderQty > 1 ? "s" : ""} per order
            </p>
          </div>
        </div>

        {/* Qty selector */}
        <div className="rounded-2xl border border-border bg-card shadow-card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-foreground">Quantity</p>
            {belowMinOrder && (
              <p className="text-xs font-semibold text-danger-700 dark:text-foreground">
                Min. {product.minOrderQty} required
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleQtyDecrease}
              disabled={qty <= product.minOrderQty}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-muted text-lg font-bold hover:bg-surface-200 disabled:opacity-50 transition-colors"
            >
              −
            </button>
            <span className="text-2xl font-bold text-foreground w-16 text-center tabular-nums">{qty}</span>
            <button
              onClick={handleQtyIncrease}
              disabled={product.stock !== undefined && qty >= product.stock}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-700 text-white text-lg font-bold hover:bg-brand-800 disabled:opacity-50 transition-colors"
            >
              +
            </button>
            <div className="ml-2 text-right flex-1">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-bold text-foreground">{formatPHP(product.price * qty)}</p>
              {activeTier && (
                <p className="text-xs text-success-700 dark:text-foreground font-semibold">{activeTier.discountPct}% bulk discount applied</p>
              )}
            </div>
          </div>
        </div>

        {/* Bulk discount hint */}
        <div className="rounded-2xl border border-border bg-card shadow-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="h-4 w-4 text-success-700 dark:text-foreground" />
            <h2 className="text-sm font-bold text-foreground">Bulk Discounts Available</h2>
          </div>
          <div className="space-y-2">
            {bulkTiers.map((tier) => {
              const isActive = qty >= tier.minQty;
              return (
                <div
                  key={tier.minQty}
                  className={cn(
                    "flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-success-50 dark:bg-success-500/10 border border-success-200"
                      : "bg-muted/50 border border-transparent",
                  )}
                >
                  <span className={cn("font-medium", isActive ? "text-success-700 dark:text-foreground" : "text-muted-foreground")}>
                    {tier.minQty}+ {product.unit}s
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={cn("font-bold", isActive ? "text-success-700 dark:text-foreground" : "text-foreground")}>
                      {formatPHP(tier.discountedPrice)}/{product.unit}
                    </span>
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-bold",
                      isActive ? "bg-success-600 text-white" : "bg-muted text-muted-foreground",
                    )}>
                      -{tier.discountPct}%
                    </span>
                    {isActive && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-success-700 dark:text-foreground" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Increase your order quantity to unlock lower prices.
          </p>
        </div>

        {/* Trust signals */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Truck,   label: "2-3 Day Delivery" },
            { icon: Shield,  label: "Quality Guaranteed" },
            { icon: Package, label: "Bulk Savings" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card py-3 px-2 text-center">
              <Icon className="h-5 w-5 text-brand-700 dark:text-brand-400" />
              <p className="text-[10px] font-medium text-muted-foreground leading-tight">{label}</p>
            </div>
          ))}
        </div>

        {/* Product details */}
        <div className="rounded-2xl border border-border bg-card shadow-card p-4 space-y-3">
          <h2 className="font-display text-sm font-bold text-foreground">Product Details</h2>
          <div className="space-y-2 text-sm">
            {[
              { label: "Brand",     value: product.brand ?? "-" },
              { label: "Category",  value: CATEGORIES.find(c => c.id === product.categoryId)?.name ?? "-" },
              { label: "Unit size", value: product.unit },
              { label: "Min. order",value: `${product.minOrderQty} pieces` },
              { label: "Stock",     value: `${product.stock} pcs available` },
              ...(hasSrp ? [{ label: "Retail SRP", value: formatPHP(product.srp!) }] : []),
              { label: "Wholesale", value: formatPHP(product.price) },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium text-foreground">{value}</span>
              </div>
            ))}
          </div>
          {hasSrp && (
            <div className="mt-1 pt-2 border-t border-border flex justify-between items-center">
              <span className="text-xs font-semibold text-success-700 dark:text-foreground">Your savings per unit</span>
              <span className="text-sm font-bold text-success-700 dark:text-foreground">{formatPHP(savingsPerUnit)} ({savingsPct}% off)</span>
            </div>
          )}
        </div>

        {/* Reviews */}
        <div>
          <h2 className="font-display text-base font-bold text-foreground mb-3">
            Reviews
            <span className="ml-2 text-sm font-normal text-muted-foreground">({reviews.length})</span>
          </h2>
          <div className="space-y-3">
            {reviews.map((review) => (
              <div key={review.id} className="rounded-2xl border border-border bg-card shadow-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-foreground">{review.name}</p>
                  <p className="text-xs text-muted-foreground">{review.date}</p>
                </div>
                <div className="flex gap-0.5 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={cn("h-3.5 w-3.5", i < review.rating ? "fill-amber-600 text-amber-600" : "text-surface-500")} />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div>
            <h2 className="font-display text-base font-bold text-foreground mb-1">You may also need</h2>
            <p className="text-xs text-muted-foreground mb-3">
              More from {CATEGORIES.find(c => c.id === product.categoryId)?.name ?? "this category"}
            </p>
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
              <button
                onClick={() => updateQty(product.id, cartItem.quantity - 1)}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-muted text-lg font-bold"
              >
                −
              </button>
              <span className="flex-1 text-center text-lg font-bold">{cartItem.quantity} in cart</span>
              <button
                onClick={() => updateQty(product.id, cartItem.quantity + 1)}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-700 text-white text-lg font-bold"
              >
                +
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {belowMinOrder && !isOutOfStock && (
              <p className="text-center text-xs text-danger-700 dark:text-foreground font-semibold">
                Set quantity to at least {product.minOrderQty} to add to cart
              </p>
            )}
            <Button
              size="lg"
              className="w-full"
              onClick={handleAddToCart}
              disabled={addDisabled}
            >
              {added ? (
                <><CheckCircle2 className="h-4 w-4" /> Added to Cart!</>
              ) : isOutOfStock ? (
                <><XCircle className="h-4 w-4" /> Out of Stock</>
              ) : (
                <><ShoppingCart className="h-4 w-4" /> Add {qty} to Cart — {formatPHP(product.price * qty)}</>
              )}
            </Button>
          </div>
        )}
      </div>

      <RetailerBottomNav />
    </div>
  );
}
