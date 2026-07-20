"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { cn } from "@/lib/utils";

const STEPS = [
  { label: "Placing Order", detail: "Securing your items…" },
  { label: "Verifying Payment", detail: "Confirming your transfer…" },
  { label: "Confirmed", detail: "Your order is on its way!" },
];

function ProcessingContent() {
  const params = useSearchParams();
  const router = useRouter();
  const orderId = params.get("orderId");
  const method = params.get("method") ?? "bank";
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!orderId) {
      router.replace("/checkout/failed?reason=missing_order");
      return;
    }

    const t1 = setTimeout(() => setStep(1), 1200);
    const t2 = setTimeout(() => setStep(2), 2800);

    // Poll the order status instead of blindly assuming success
    let attempts = 0;
    const MAX_ATTEMPTS = 20; // 20 × 2s = 40 second timeout

    const poll = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        if (!res.ok) { attempts++; return; }
        const data = await res.json();
        const status = data?.order?.status ?? data?.status;
        if (status === "confirmed" || status === "picking" || status === "packed") {
          router.replace(`/checkout/success?orderId=${orderId}&method=${method}`);
        } else if (status === "payment_failed" || status === "cancelled") {
          router.replace(`/checkout/failed?orderId=${orderId}`);
        } else {
          attempts++;
          if (attempts >= MAX_ATTEMPTS) {
            // Timeout — treat as failed to avoid stuck UI
            router.replace(`/checkout/failed?orderId=${orderId}&reason=timeout`);
          } else {
            setTimeout(poll, 2000);
          }
        }
      } catch {
        attempts++;
        if (attempts >= MAX_ATTEMPTS) {
          router.replace(`/checkout/failed?orderId=${orderId}&reason=timeout`);
        } else {
          setTimeout(poll, 2000);
        }
      }
    };

    // Start polling after a brief initial delay
    const t3 = setTimeout(poll, 3000);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [orderId, method, router]);

  const methodIcon = method === "cod" ? "💵" : method === "gcash" ? "📱" : method === "maya" ? "💳" : "🏦";
  const methodLabel = method === "cod" ? "Cash on Delivery" : method === "gcash" ? "GCash" : method === "maya" ? "Maya" : "Bank Transfer";

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12 text-center">
      {/* Animated icon */}
      <div className="relative mb-8">
        <div className={cn(
          "h-24 w-24 rounded-full border-4 transition-colors duration-700",
          step < 2
            ? "border-brand-100 border-t-brand-500 animate-spin"
            : "border-success-500 animate-none"
        )} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl">{step === 2 ? "✅" : methodIcon}</span>
        </div>
      </div>

      {/* Step label */}
      <h1 className="font-display text-xl font-bold text-foreground mb-1">
        {STEPS[step]?.label}
      </h1>
      <p className="text-muted-foreground text-sm mb-5 max-w-xs">
        {STEPS[step]?.detail}
      </p>

      {/* Step dots */}
      <div className="flex items-center gap-2 mb-5">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={cn(
              "h-2.5 w-2.5 rounded-full transition-all duration-500",
              i < step ? "bg-success-500 scale-100" :
              i === step ? "bg-brand-500 scale-125" :
              "bg-muted-foreground/30 scale-100"
            )} />
            {i < STEPS.length - 1 && (
              <div className={cn(
                "h-0.5 w-8 rounded-full transition-all duration-700",
                i < step ? "bg-success-500" : "bg-muted-foreground/20"
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Step labels row */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center mb-6">
        {STEPS.map((s, i) => (
          <span key={i} className={cn(
            "text-xs transition-colors duration-300",
            i === step ? "text-brand-700 dark:text-brand-400 font-semibold" :
            i < step ? "text-success-700 dark:text-foreground font-medium" :
            "text-muted-foreground"
          )}>
            {s.label}
          </span>
        ))}
      </div>

      {/* Reference */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground">
          <span>{methodLabel}</span>
        </div>
        {orderId && (
          <p className="text-xs text-muted-foreground font-mono bg-surface-100 dark:bg-surface-800 rounded-lg px-3 py-1.5">
            Ref: {orderId}
          </p>
        )}
      </div>

      <p className="text-xs text-muted-foreground mt-6 max-w-xs leading-relaxed">
        Please don&apos;t close this page. You&apos;ll be redirected automatically once confirmed.
      </p>
    </div>
  );
}

export default function CheckoutProcessingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    }>
      <ProcessingContent />
    </Suspense>
  );
}
