"use client";
import { useRouter } from "next/navigation";
import { Shield, CheckCircle2, Clock, CreditCard, ArrowLeft, ArrowRight } from "lucide-react";
import { RetailerTopBar, RetailerBottomNav } from "@/components/layout/retailer-nav";
import { ButtonLink } from "@/components/ui/button";
import { formatPHP } from "@/lib/utils";

const FEATURES = [
  "Unlimited warehouse orders",
  "Live stock visibility",
  "Order tracking and history",
  "Fast reorder from past purchases",
  "Dedicated customer support",
  "Price transparency, no hidden fees",
];

export default function SubscriptionPage() {
  const router = useRouter();
  const renewalDate = "February 1, 2026";
  const daysLeft = 211;

  return (
    <div className="min-h-screen bg-background pb-24">
      <RetailerTopBar title="Subscription" />

      <div className="px-4 py-5 space-y-5">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {/* Status card */}
        <div className="rounded-2xl border border-success-500/25 bg-success-50 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-success-100 text-success-600">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <p className="font-display text-lg font-bold text-success-700">Active</p>
              <p className="text-sm text-success-600">Ka Sari-Sari Platform Access</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/60 p-3">
              <p className="text-xs text-success-600 mb-0.5">Plan</p>
              <p className="text-sm font-bold text-success-700">Annual</p>
            </div>
            <div className="rounded-xl bg-white/60 p-3">
              <p className="text-xs text-success-600 mb-0.5">Amount paid</p>
              <p className="text-sm font-bold text-success-700">{formatPHP(1000)}</p>
            </div>
            <div className="rounded-xl bg-white/60 p-3">
              <p className="text-xs text-success-600 mb-0.5">Renews on</p>
              <p className="text-sm font-bold text-success-700">{renewalDate}</p>
            </div>
            <div className="rounded-xl bg-white/60 p-3">
              <p className="text-xs text-success-600 mb-0.5">Days remaining</p>
              <p className="text-sm font-bold text-success-700">{daysLeft} days</p>
            </div>
          </div>
        </div>

        {/* What's included */}
        <div className="rounded-2xl border border-border bg-card shadow-card p-5">
          <h3 className="font-display text-sm font-semibold text-foreground mb-4">What&apos;s included</h3>
          <ul className="space-y-3">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-foreground">
                <CheckCircle2 className="h-4 w-4 text-success-500 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Payment history */}
        <div className="rounded-2xl border border-border bg-card shadow-card p-5">
          <h3 className="font-display text-sm font-semibold text-foreground mb-4">Payment history</h3>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-success-50 text-success-600">
                <CreditCard className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Annual subscription</p>
                <p className="text-xs text-muted-foreground">Feb 1, 2025 · GCash</p>
              </div>
            </div>
            <span className="text-sm font-bold text-foreground">{formatPHP(1000)}</span>
          </div>
        </div>

        {/* Renew CTA */}
        <div className="rounded-2xl border border-brand-200 bg-brand-50 p-5 space-y-3">
          <div className="flex items-start gap-2">
            <Clock className="h-4 w-4 text-brand-500 mt-0.5 shrink-0" />
            <p className="text-sm text-brand-700">
              Your subscription renews on <span className="font-semibold">{renewalDate}</span>.
              Renew early to avoid any interruption.
            </p>
          </div>
          <ButtonLink size="md" href="/checkout" className="w-full">
            Renew now - {formatPHP(1000)} <ArrowRight className="h-4 w-4" />
          </ButtonLink>
        </div>
      </div>

      <RetailerBottomNav />
    </div>
  );
}
