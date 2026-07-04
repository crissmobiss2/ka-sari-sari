"use client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { CheckCircle2, Package, ArrowRight, Home } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

function SuccessContent() {
  const params = useSearchParams();
  const orderId = params.get("orderId") || "KSS-" + Date.now().toString().slice(-8);
  const method = params.get("method") || "gcash";

  const methodLabels: Record<string, string> = {
    gcash: "GCash",
    maya: "Maya",
    card: "Credit/Debit Card",
    cod: "Cash on Delivery",
    bank: "Bank Transfer",
    wallet: "Ka Sari-Sari Wallet",
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12 text-center">
      {/* Success animation */}
      <div className="relative mb-8">
        <div className="absolute inset-0 animate-ping rounded-full bg-success-500/20" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-success-50 border-2 border-success-200">
          <CheckCircle2 className="h-12 w-12 text-success-500" strokeWidth={1.5} />
        </div>
      </div>

      <h1 className="font-display text-2xl font-black text-foreground mb-2">Order Placed!</h1>
      <p className="text-muted-foreground text-sm mb-6 max-w-xs leading-relaxed">
        Your order has been confirmed. We&apos;ll start picking your items and deliver within 2–3 business days.
      </p>

      {/* Order details */}
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-card p-5 space-y-3 text-left mb-8">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Order number</span>
          <span className="font-bold text-foreground font-mono">{orderId}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Payment method</span>
          <span className="font-semibold text-foreground">{methodLabels[method] || method}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Status</span>
          <span className="font-semibold text-success-600">Confirmed ✓</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Estimated delivery</span>
          <span className="font-semibold text-foreground">2–3 business days</span>
        </div>
      </div>

      {/* CTAs */}
      <div className="w-full max-w-sm space-y-3">
        <ButtonLink href="/orders" size="lg" className="w-full">
          <Package className="h-4 w-4" />
          Track my order
          <ArrowRight className="h-4 w-4" />
        </ButtonLink>
        <ButtonLink href="/dashboard" variant="outline" size="md" className="w-full">
          <Home className="h-4 w-4" />
          Back to home
        </ButtonLink>
      </div>

      <p className="text-xs text-muted-foreground mt-6 max-w-xs">
        You&apos;ll receive an SMS and notification at every step of your order.
      </p>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 rounded-full border-4 border-brand-500 border-t-transparent" /></div>}>
      <SuccessContent />
    </Suspense>
  );
}
