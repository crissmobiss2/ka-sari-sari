"use client";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MapPin, ShoppingBag, ClipboardList, Star, Clock } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { earnPoints, POINTS_PER_PESO } from "@/store/loyalty";
import { useCartStore } from "@/store/cart";

// --- animated checkmark ----------------------------------------------------
const CheckmarkSVG = () => (
  <svg
    viewBox="0 0 52 52"
    fill="none"
    className="checkmark"
    aria-hidden="true"
    style={{ width: 96, height: 96 }}
  >
    <style>{`
      @keyframes kss-circle-draw {
        from { stroke-dashoffset: 166; }
        to   { stroke-dashoffset: 0; }
      }
      @keyframes kss-check-draw {
        0%   { stroke-dashoffset: 48; }
        50%  { stroke-dashoffset: 48; }
        100% { stroke-dashoffset: 0; }
      }
      @keyframes kss-pop {
        0%   { transform: scale(0.6); opacity: 0; }
        60%  { transform: scale(1.1); opacity: 1; }
        100% { transform: scale(1); opacity: 1; }
      }
      @keyframes kss-confetti-fall {
        0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
        100% { transform: translateY(60px) rotate(360deg); opacity: 0; }
      }
      .kss-circle {
        stroke-dasharray: 166;
        stroke-dashoffset: 166;
        animation: kss-circle-draw 0.6s cubic-bezier(0.65, 0, 0.45, 1) 0.1s forwards;
      }
      .kss-check {
        stroke-dasharray: 48;
        stroke-dashoffset: 48;
        animation: kss-check-draw 0.8s cubic-bezier(0.65, 0, 0.45, 1) 0.2s forwards;
      }
      .kss-checkmark-wrap {
        animation: kss-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.05s both;
      }
      .kss-confetti-dot {
        animation: kss-confetti-fall 0.8s ease-in forwards;
      }
      @keyframes kss-points-slide {
        from { opacity: 0; transform: translateY(12px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .kss-points-in {
        animation: kss-points-slide 0.4s ease-out 0.6s both;
      }
    `}</style>
    <circle
      className="kss-circle"
      cx="26"
      cy="26"
      r="25"
      stroke="#22c55e"
      strokeWidth="2"
      fill="none"
    />
    <polyline
      className="kss-check"
      points="14,27 22,35 38,18"
      stroke="#22c55e"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

// --- tiny confetti dots -----------------------------------------------------
const CONFETTI = [
  { color: "#f59e0b", x: -38, delay: 0.1 },
  { color: "#3b82f6", x:  38, delay: 0.15 },
  { color: "#ec4899", x: -20, delay: 0.2 },
  { color: "#10b981", x:  20, delay: 0.25 },
  { color: "#a855f7", x: -50, delay: 0.3 },
  { color: "#f97316", x:  50, delay: 0.05 },
];

// --- main inner component (uses useSearchParams) ----------------------------
function SuccessContent() {
  const params = useSearchParams();
  const clearCart = useCartStore((s) => s.clearCart);

  // Order ID: prefer explicit orderId param, fall back to auto-generated
  const rawId = params.get("orderId");
  const orderId = rawId
    ? rawId.startsWith("KSS-") ? rawId : `KSS-${rawId}`
    : `KSS-${Date.now().toString().slice(-6)}`;

  // Total: fetched from API (preferred) or URL param as fallback
  const totalParam = parseFloat(params.get("total") ?? "0");
  const [orderTotal, setOrderTotal] = useState(totalParam > 0 ? totalParam : 1500);
  const [realTotalLoaded, setRealTotalLoaded] = useState(!rawId);

  const method = params.get("method") || "gcash";
  const methodLabels: Record<string, string> = {
    gcash:  "GCash",
    maya:   "Maya",
    card:   "Credit / Debit Card",
    cod:    "Cash on Delivery",
    bank:   "Bank Transfer",
    wallet: "Ka Sari-Sari Wallet",
  };

  const awardedRef  = useRef(false);
  const [ptsEarned, setPtsEarned] = useState(0);
  const [shown,     setShown]     = useState(false);

  useEffect(() => {
    // Trigger entrance animations after mount
    const t = setTimeout(() => setShown(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Fetch real order total so loyalty points can't be inflated via URL manipulation
  useEffect(() => {
    if (!rawId) return;
    fetch(`/api/orders/${rawId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        const real = data?.order?.total ?? data?.total;
        if (typeof real === "number" && real > 0) setOrderTotal(real);
      })
      .catch(() => {})
      .finally(() => setRealTotalLoaded(true));
  }, [rawId]);

  // Clear the cart on first mount of the success page.
  // For online payments (GCash/Maya) the cart is NOT cleared in checkout/page.tsx
  // (in case redirect fails); this is the safe place to clear it after confirmed payment.
  useEffect(() => {
    clearCart();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Wait for the real order total from API before awarding points
    // so URL-param manipulation can't inflate loyalty balance
    if (!realTotalLoaded) return;

    const storageKey = `kss-pts-awarded-${orderId}`;
    const alreadyAwarded = typeof window !== "undefined" && localStorage.getItem(storageKey);

    if (!awardedRef.current && !alreadyAwarded) {
      awardedRef.current = true;
      const pts = Math.floor(orderTotal * POINTS_PER_PESO);
      earnPoints(orderTotal, orderId);
      if (typeof window !== "undefined") {
        localStorage.setItem(storageKey, "1");
      }
      setPtsEarned(pts);
    } else if (alreadyAwarded) {
      setPtsEarned(Math.floor(orderTotal * POINTS_PER_PESO));
    }
  }, [orderId, orderTotal, realTotalLoaded]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12 text-center">

      {/* -- animated checkmark + confetti -- */}
      <div className="relative mb-8 flex items-center justify-center">
        {/* confetti dots scattered around the circle */}
        {shown && CONFETTI.map((c, i) => (
          <span
            key={i}
            className="kss-confetti-dot absolute block h-2.5 w-2.5 rounded-full"
            style={{
              background:       c.color,
              left:             `calc(50% + ${c.x}px)`,
              top:              "-8px",
              animationDelay:   `${c.delay}s`,
            }}
          />
        ))}

        {/* ring pulse behind the circle */}
        <span className="absolute inset-0 animate-ping rounded-full bg-green-400/20" />

        {/* checkmark SVG */}
        <div className="kss-checkmark-wrap relative z-10">
          <CheckmarkSVG />
        </div>
      </div>

      {/* -- headline -- */}
      <h1 className="font-display text-3xl font-black text-foreground mb-1 leading-tight">
        Order {orderId} confirmed!
      </h1>
      <p className="text-muted-foreground text-sm mb-2 max-w-xs leading-relaxed">
        Salamat for shopping with Ka Sari-Sari! Your order is now being prepared.
      </p>

      {/* -- delivery chip -- */}
      <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-4 py-1.5 text-amber-700 text-sm font-semibold mb-8">
        <Clock className="h-4 w-4 text-amber-700" />
        Expected delivery in 2–4 hours
      </div>

      {/* -- order details card -- */}
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-sm p-5 space-y-3 text-left mb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          Order details
        </p>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Order number</span>
          <span className="font-bold text-foreground font-mono">{orderId}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Payment method</span>
          <span className="font-semibold text-foreground">{methodLabels[method] ?? method}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Status</span>
          <span className="inline-flex items-center gap-1 font-semibold text-green-600 dark:text-success-500">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            Confirmed
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Estimated delivery</span>
          <span className="font-semibold text-foreground">2–4 hours</span>
        </div>
      </div>

      {/* -- loyalty points banner -- */}
      {ptsEarned > 0 && (
        <div className="kss-points-in w-full max-w-sm rounded-2xl border border-brand-200 bg-brand-50 dark:bg-brand-500/10 p-4 flex items-center gap-3 text-left mb-6">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-500/20">
            <Star className="h-5 w-5 text-brand-700 dark:text-brand-400 fill-brand-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-brand-700 dark:text-brand-400">
              You earned {ptsEarned} loyalty points!
            </p>
            <p className="text-xs text-brand-700 dark:text-brand-400 mt-0.5">
              Visit your Rewards page to see your balance.
            </p>
          </div>
        </div>
      )}

      {/* -- action buttons -- */}
      <div className="w-full max-w-sm flex flex-col gap-3">
        <ButtonLink href={`/tracking?orderId=${rawId ?? ""}`} size="lg" className="w-full">
          <MapPin className="h-4 w-4 shrink-0" />
          Track Order
        </ButtonLink>

        {rawId && (
          <a
            href={`/api/orders/${rawId}/receipt`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card hover:bg-muted text-foreground text-sm font-semibold px-6 h-11 transition-colors w-full"
          >
            <ClipboardList className="h-4 w-4 shrink-0" />
            Download Receipt (OR)
          </a>
        )}

        <ButtonLink href="/catalog" variant="outline" size="md" className="w-full">
          <ShoppingBag className="h-4 w-4 shrink-0" />
          Continue Shopping
        </ButtonLink>

        <ButtonLink href="/orders" variant="ghost" size="md" className="w-full">
          <ClipboardList className="h-4 w-4 shrink-0" />
          View Orders
        </ButtonLink>
      </div>

      <p className="text-xs text-muted-foreground mt-8 max-w-xs">
        You&apos;ll receive an SMS and in-app notification at every step of your delivery.
      </p>
    </div>
  );
}

// --- page (Suspense wraps useSearchParams) -----------------------------------
export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin h-10 w-10 rounded-full border-4 border-brand-700 border-t-transparent" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
