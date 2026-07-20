"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Zap, Clock, Tag, ShoppingCart, Flame } from "lucide-react";
import { RetailerTopBar, RetailerBottomNav } from "@/components/layout/retailer-nav";
import { PRODUCTS, CATEGORIES } from "@/lib/mock-data";
import { formatPHP } from "@/lib/utils";
import { useCartStore } from "@/store/cart";
import { toastError } from "@/store/toast";
import { cn } from "@/lib/utils";

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

function getDealLabel(categoryId: string): string {
  const labels = ["Bundle Deal", "Flash Sale", "Bulk Discount", "Weekend Special", "Hot Pick", "Daily Deal"];
  const idx = parseInt(categoryId.replace("cat-", ""), 10) % labels.length;
  return labels[idx] ?? "Hot Pick";
}

// Compute deal price (used as fallback when API is unavailable)
const MOCK_DEALS = PRODUCTS.map((p, i) => ({
  ...p,
  originalPrice: p.price,
  discountPct: [15, 20, 10, 25, 12, 18, 22, 8, 30, 15][i % 10],
  price: Math.round(p.price * [0.85, 0.80, 0.90, 0.75, 0.88, 0.82, 0.78, 0.92, 0.70, 0.85][i % 10]),
  dealLabel: getDealLabel(p.categoryId),
  expiresIn: [3600 * 2 + 1800, 3600 * 5, 3600 * 12, 3600 * 24, 3600 * 8][i % 5],
}));

type Deal = (typeof MOCK_DEALS)[0];

function getSessionStart(): number {
  const key = "deals-session-start";
  const stored = sessionStorage.getItem(key);
  if (stored) return parseInt(stored, 10);
  const now = Date.now();
  sessionStorage.setItem(key, now.toString());
  return now;
}

function Countdown({ seconds }: { seconds: number }) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const sessionStart = getSessionStart();
    const elapsed = Math.floor((Date.now() - sessionStart) / 1000);
    const initial = Math.max(0, seconds - elapsed);
    setRemaining(initial);

    if (initial <= 0) return;
    const interval = setInterval(() => {
      const e = Math.floor((Date.now() - sessionStart) / 1000);
      setRemaining(Math.max(0, seconds - e));
    }, 1000);
    return () => clearInterval(interval);
  }, [seconds]);

  if (remaining === null) return <span className="font-mono font-bold tabular-nums">--:--:--</span>;
  if (remaining === 0) return <span className="font-mono font-bold tabular-nums text-danger-600 dark:text-danger-500">Expired</span>;

  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <span className="font-mono font-bold tabular-nums">
      {pad(h)}:{pad(m)}:{pad(s)}
    </span>
  );
}

function DealCard({ deal }: { deal: Deal }) {
  const { addItem, items, updateQty } = useCartStore();
  const cartItem = items.find((i) => i.product.id === deal.id);
  const [imgError, setImgError] = useState(false);
  const display = CATEGORY_DISPLAY[deal.categoryId] || { gradient: "from-gray-400 to-slate-500", emoji: "📦" };
  const showRealImage = !!deal.imageUrl && !imgError;

  function handleAddToCart() {
    const product = PRODUCTS.find((p) => p.id === deal.id) ?? deal;
    if (product && (product as typeof deal).stock === 0) {
      toastError("Out of stock");
      return;
    }
    addItem(deal as any);
  }

  return (
    <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden flex flex-col">
      <div className="relative">
        <div className={cn(
          "relative h-28 overflow-hidden",
          !showRealImage && `bg-gradient-to-br ${display.gradient} flex items-center justify-center`
        )}>
          {showRealImage ? (
            <Image
              src={deal.imageUrl!}
              alt={deal.name}
              fill
              className="object-cover"
              onError={() => setImgError(true)}
              sizes="(max-width: 640px) 50vw, 25vw"
            />
          ) : (
            <span className="text-4xl select-none" role="img">{display.emoji}</span>
          )}
        </div>
        <div className="absolute top-2 left-2 rounded-full bg-danger-500 px-2 py-0.5 text-[10px] font-bold text-white">
          -{deal.discountPct}%
        </div>
        <div className="absolute top-2 right-2 rounded-full bg-card/90 backdrop-blur-sm border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <Countdown seconds={deal.expiresIn} />
        </div>
      </div>
      <div className="p-3 flex-1 flex flex-col gap-1">
        <span className="text-[10px] font-semibold text-brand-700 dark:text-brand-400 uppercase tracking-wide">{deal.dealLabel}</span>
        <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2">{deal.name}</p>
        <div className="flex items-baseline gap-1.5 mt-auto pt-1">
          <span className="text-base font-bold text-foreground">{formatPHP(deal.price)}</span>
          <span className="text-xs text-muted-foreground line-through">{formatPHP(deal.originalPrice)}</span>
        </div>
        {cartItem ? (
          <div className="flex items-center justify-between mt-1">
            <button onClick={() => updateQty(deal.id, cartItem.quantity - 1)} className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-muted text-sm font-bold">−</button>
            <span className="text-sm font-semibold">{cartItem.quantity}</span>
            <button onClick={() => updateQty(deal.id, cartItem.quantity + 1)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-700 text-white text-sm font-bold">+</button>
          </div>
        ) : (
          <button
            onClick={handleAddToCart}
            className="mt-1 w-full rounded-xl bg-brand-700 py-2 text-xs font-semibold text-white hover:bg-brand-800 transition-colors active:scale-95"
          >
            Add to Cart
          </button>
        )}
      </div>
    </div>
  );
}

export default function DealsPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [allDeals, setAllDeals] = useState<Deal[]>(MOCK_DEALS);

  useEffect(() => {
    fetch("/api/deals")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (Array.isArray(data?.deals) && data.deals.length > 0) {
          setAllDeals(data.deals);
        }
      })
      .catch(() => {});
  }, []);

  const flashDeals = allDeals.slice(0, 4);
  const filtered = activeCategory === "all"
    ? allDeals
    : allDeals.filter((d) => d.categoryId === activeCategory);

  return (
    <div className="min-h-screen bg-background pb-24">
      <RetailerTopBar title="Today's Deals" />

      <div className="px-4 py-5 space-y-6">
        {/* Hero banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-danger-600 to-brand-700 p-5 text-white">
          <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-white/10" />
          <div className="absolute -bottom-6 -right-8 h-32 w-32 rounded-full bg-white/5" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="h-5 w-5 text-yellow-300" />
              <span className="text-xs font-semibold uppercase tracking-wider">Flash Sale Today</span>
            </div>
            <h2 className="font-display text-2xl font-black leading-tight">Up to 30% Off</h2>
            <p className="text-sm mt-1">Exclusive deals for Ka Sari-Sari members</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs font-medium">Ends in:</span>
              <span className="rounded-lg bg-black/25 px-2 py-1 text-sm font-bold">
                <Countdown seconds={3600 * 8 + 1234} />
              </span>
            </div>
          </div>
        </div>

        {/* Flash deals horizontal scroll */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-danger-600 dark:text-danger-500" />
            <h2 className="font-display text-base font-bold text-foreground">Flash Deals</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
            {flashDeals.map((deal) => (
              <div key={deal.id} className="w-44 shrink-0">
                <DealCard deal={deal} />
              </div>
            ))}
          </div>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
          {[{ id: "all", name: "All Deals" }, ...CATEGORIES].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-colors",
                activeCategory === cat.id
                  ? "bg-brand-700 text-white"
                  : "border border-border bg-card text-muted-foreground hover:border-brand-300"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* All deals grid */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
              <Tag className="h-4 w-4 text-brand-700 dark:text-brand-400" />
              All Deals
              <span className="text-xs font-normal text-muted-foreground">({filtered.length})</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        </div>
      </div>

      <RetailerBottomNav />
    </div>
  );
}
