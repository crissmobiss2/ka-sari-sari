"use client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { XCircle, RefreshCcw, Home } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

function FailedContent() {
  const params = useSearchParams();
  const orderId = params.get("orderId");
  const method = params.get("method") || "gcash";

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-danger-50 dark:bg-danger-500/10 border-2 border-danger-200 mb-8">
        <XCircle className="h-12 w-12 text-danger-600 dark:text-danger-500" strokeWidth={1.5} />
      </div>

      <h1 className="font-display text-2xl font-black text-foreground mb-2">Payment Failed</h1>
      <p className="text-muted-foreground text-sm mb-6 max-w-xs leading-relaxed">
        Your payment could not be processed. Please try again or use a different payment method.
      </p>

      {orderId && (
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-card p-4 space-y-2 text-left mb-8">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Order reference</span>
            <span className="font-bold text-foreground font-mono">{orderId}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Payment via</span>
            <span className="font-semibold text-foreground capitalize">{method}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            <span className="font-semibold text-danger-600 dark:text-danger-500">Failed ?</span>
          </div>
        </div>
      )}

      <div className="w-full max-w-sm space-y-3">
        <ButtonLink href="/checkout" size="lg" className="w-full">
          <RefreshCcw className="h-4 w-4" />
          Try again
        </ButtonLink>
        <ButtonLink href="/dashboard" variant="outline" size="md" className="w-full">
          <Home className="h-4 w-4" />
          Back to home
        </ButtonLink>
      </div>

      <p className="text-xs text-muted-foreground mt-6 max-w-xs">
        If money was deducted from your account, it will be refunded within 3–5 business days.
        Contact support if you need help.
      </p>
    </div>
  );
}

export default function CheckoutFailedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 rounded-full border-4 border-brand-700 border-t-transparent" /></div>}>
      <FailedContent />
    </Suspense>
  );
}
