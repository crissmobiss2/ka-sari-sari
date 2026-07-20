"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, CheckCircle2, Clock, CreditCard, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
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

interface PaymentRecord {
  date: string;
  method: string;
  amount: number;
}

interface Subscription {
  status: string;
  plan: string;
  amount: number;
  renewalDate: string;
  daysLeft: number;
  paymentHistory: PaymentRecord[];
}

export default function SubscriptionPage() {
  const router = useRouter();
  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user/subscription")
      .then((r) => r.json())
      .then((d) => setSub(d.subscription ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const isActive = sub ? sub.status === "active" : false;

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
        {loading ? (
          <div className="rounded-2xl border border-border bg-card p-6 flex items-center justify-center min-h-[160px]">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className={`rounded-2xl border p-6 space-y-4 ${isActive ? "border-success-500/25 bg-success-50 dark:bg-success-500/10" : "border-border bg-card"}`}>
            <div className="flex items-center gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${isActive ? "bg-success-100 dark:bg-success-500/20 text-success-700 dark:text-foreground" : "bg-surface-100 dark:bg-surface-800 text-muted-foreground"}`}>
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <p className={`font-display text-lg font-bold ${isActive ? "text-success-700 dark:text-foreground" : "text-foreground"}`}>
                  {sub ? (isActive ? "Active" : "Inactive") : "No Subscription"}
                </p>
                <p className={`text-sm ${isActive ? "text-success-700 dark:text-foreground" : "text-muted-foreground"}`}>
                  Ka Sari-Sari Platform Access
                </p>
              </div>
            </div>

            {sub && (
              <div className="grid grid-cols-2 gap-3">
                <div className={`rounded-xl p-3 ${isActive ? "bg-white/60 dark:bg-success-500/10" : "bg-surface-50 dark:bg-surface-900"}`}>
                  <p className={`text-xs mb-0.5 ${isActive ? "text-success-700 dark:text-foreground/70" : "text-muted-foreground"}`}>Plan</p>
                  <p className={`text-sm font-bold ${isActive ? "text-success-700 dark:text-foreground" : "text-surface-900 dark:text-foreground"}`}>
                    {sub.plan === "free_trial" ? "Free Trial (Year 1)" : sub.plan.charAt(0).toUpperCase() + sub.plan.slice(1)}
                  </p>
                </div>
                <div className={`rounded-xl p-3 ${isActive ? "bg-white/60 dark:bg-success-500/10" : "bg-surface-50 dark:bg-surface-900"}`}>
                  <p className={`text-xs mb-0.5 ${isActive ? "text-success-700 dark:text-foreground/70" : "text-muted-foreground"}`}>Amount paid</p>
                  <p className={`text-sm font-bold ${isActive ? "text-success-700 dark:text-foreground" : "text-surface-900 dark:text-foreground"}`}>{sub.amount === 0 ? "Free" : formatPHP(sub.amount)}</p>
                </div>
                <div className={`rounded-xl p-3 ${isActive ? "bg-white/60 dark:bg-success-500/10" : "bg-surface-50 dark:bg-surface-900"}`}>
                  <p className={`text-xs mb-0.5 ${isActive ? "text-success-700 dark:text-foreground/70" : "text-muted-foreground"}`}>Renews on</p>
                  <p className={`text-sm font-bold ${isActive ? "text-success-700 dark:text-foreground" : "text-surface-900 dark:text-foreground"}`}>{sub.renewalDate}</p>
                </div>
                <div className={`rounded-xl p-3 ${isActive ? "bg-white/60 dark:bg-success-500/10" : "bg-surface-50 dark:bg-surface-900"}`}>
                  <p className={`text-xs mb-0.5 ${isActive ? "text-success-700 dark:text-foreground/70" : "text-muted-foreground"}`}>Days remaining</p>
                  <p className={`text-sm font-bold ${isActive ? "text-success-700 dark:text-foreground" : "text-surface-900 dark:text-foreground"}`}>{sub.daysLeft} days</p>
                </div>
              </div>
            )}
          </div>
        )}

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
        {!loading && sub && sub.paymentHistory.length > 0 && (
          <div className="rounded-2xl border border-border bg-card shadow-card p-5">
            <h3 className="font-display text-sm font-semibold text-foreground mb-4">Payment history</h3>
            <div className="space-y-3 divide-y divide-border">
              {sub.paymentHistory.map((h, i) => (
                <div key={i} className="flex items-center justify-between py-2 first:pt-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-success-50 dark:bg-success-500/10 text-success-700 dark:text-foreground">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Monthly subscription</p>
                      <p className="text-xs text-muted-foreground">{h.date} Â· {h.method}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-foreground">{formatPHP(h.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Renew CTA â€” shown only after free trial (monthly subscribers) */}
        {!loading && sub && sub.plan !== "free_trial" && (
          <div className="rounded-2xl border border-brand-200 dark:border-brand-500/30 bg-brand-50 dark:bg-brand-500/10 p-5 space-y-3">
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-brand-500 mt-0.5 shrink-0" />
              <p className="text-sm text-brand-700 dark:text-foreground">
                Your subscription renews on <span className="font-semibold">{sub.renewalDate}</span>.
                Renew early to avoid any interruption.
              </p>
            </div>
            <ButtonLink size="md" href="/checkout" className="w-full">
              Renew now â€” {formatPHP(sub.amount)} <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>
        )}

        {/* Free trial info */}
        {!loading && sub && sub.plan === "free_trial" && (
          <div className="rounded-2xl border border-brand-200 dark:border-brand-500/30 bg-brand-50 dark:bg-brand-500/10 p-5 space-y-2">
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-brand-500 mt-0.5 shrink-0" />
              <p className="text-sm text-brand-700 dark:text-foreground">
                Your free trial runs until <span className="font-semibold">{sub.renewalDate}</span>.
                After that, â‚±200/month keeps your store active.
              </p>
            </div>
          </div>
        )}
      </div>

      <RetailerBottomNav />
    </div>
  );
}
