"use client";
import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

function ProcessingContent() {
  const params = useSearchParams();
  const router = useRouter();
  const orderId = params.get("orderId");

  // Poll for payment status - in production this checks the DB
  useEffect(() => {
    const timeout = setTimeout(() => {
      router.replace(`/checkout/success?orderId=${orderId}&method=bank`);
    }, 4000);
    return () => clearTimeout(timeout);
  }, [orderId, router]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12 text-center">
      <div className="relative mb-8">
        <div className="h-24 w-24 rounded-full border-4 border-brand-100 border-t-brand-500 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl">🏦</span>
        </div>
      </div>

      <h1 className="font-display text-xl font-bold text-foreground mb-2">Verifying Payment</h1>
      <p className="text-muted-foreground text-sm mb-2 max-w-xs">
        We&apos;re confirming your bank transfer. This usually takes a few seconds.
      </p>
      {orderId && (
        <p className="text-xs text-muted-foreground font-mono bg-surface-100 rounded-lg px-3 py-1.5 mt-2">
          Ref: {orderId}
        </p>
      )}
      <p className="text-xs text-muted-foreground mt-6 max-w-xs leading-relaxed">
        Please don&apos;t close this page. You&apos;ll be redirected automatically once confirmed.
      </p>
    </div>
  );
}

export default function CheckoutProcessingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 rounded-full border-4 border-brand-500 border-t-transparent" /></div>}>
      <ProcessingContent />
    </Suspense>
  );
}
