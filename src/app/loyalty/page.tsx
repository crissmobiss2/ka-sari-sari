"use client";
import { useState } from "react";
import { Crown, Star, Gift, Users, Copy, CheckCircle2, ChevronRight } from "lucide-react";
import { RetailerTopBar, RetailerBottomNav } from "@/components/layout/retailer-nav";
import { cn } from "@/lib/utils";

// ── Data ─────────────────────────────────────────────────────────────────────

const POINTS_BALANCE = 2450;
const POINTS_TO_NEXT = 550;
const NEXT_TIER = "Gold";
const PROGRESS_PCT = Math.round((POINTS_BALANCE / (POINTS_BALANCE + POINTS_TO_NEXT)) * 100); // 82%

const TIERS = [
  {
    name: "Silver",
    icon: "🥈",
    current: true,
    color: "border-slate-300 bg-slate-50",
    badge: "bg-slate-100 text-slate-600",
    perks: ["Early access to flash sales", "Priority support"],
  },
  {
    name: "Gold",
    icon: "🥇",
    current: false,
    color: "border-amber-300 bg-amber-50",
    badge: "bg-amber-100 text-amber-700",
    perks: ["Extra 5% discount on all orders", "Free delivery on Fridays"],
  },
  {
    name: "Platinum",
    icon: "💎",
    current: false,
    color: "border-violet-300 bg-violet-50",
    badge: "bg-violet-100 text-violet-700",
    perks: ["Personal account manager", "Custom pricing", "First pick on new arrivals"],
  },
];

const HISTORY = [
  { id: "h1", type: "earn" as const, pts: 125, label: "Order KSS-2025-00142", date: "Jan 20" },
  { id: "h2", type: "earn" as const, pts: 87,  label: "Order KSS-2025-00141", date: "Jan 17" },
  { id: "h3", type: "earn" as const, pts: 98,  label: "Order KSS-2025-00138", date: "Jan 12" },
  { id: "h4", type: "earn" as const, pts: 65,  label: "Order KSS-2025-00135", date: "Jan 8" },
  { id: "h5", type: "redeem" as const, pts: 500, label: "Redeemed for ₱50 off", date: "Jan 5" },
];

const HOW_TO_EARN = [
  { icon: Star, text: "1 point per ₱10 spent on any order" },
  { icon: Users, text: "Bonus 50 pts for every friend you refer" },
  { icon: Gift, text: "25 pts for leaving a product review" },
];

const REFERRAL_CODE = "MARIA-SANTOS-2025";

// ── Main page ────────────────────────────────────────────────────────────────

export default function LoyaltyPage() {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(REFERRAL_CODE).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function handleShareMessenger() {
    alert("Opening Messenger share... (integration coming soon)");
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <RetailerTopBar title="Rewards" />

      <div className="px-4 py-5 space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
            <Crown className="h-5 w-5 text-brand-500" />
            Rewards & Loyalty
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Earn points with every order</p>
        </div>

        {/* Balance card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 p-6 text-white shadow-brand">
          {/* Decorative circles */}
          <div className="absolute -top-8 -right-8 h-36 w-36 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute top-10 right-10 h-12 w-12 rounded-full bg-white/8 pointer-events-none" />

          <div className="relative">
            {/* Tier badge */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-brand-200" />
                <span className="text-sm text-brand-200 font-medium">Ka Sari-Sari Rewards</span>
              </div>
              <span className="rounded-full border border-white/30 bg-white/20 px-3 py-0.5 text-xs font-bold text-white">
                🥈 Silver Member
              </span>
            </div>

            {/* Points */}
            <p className="text-xs text-brand-200 uppercase tracking-wide mb-1">Your points</p>
            <p className="font-display text-5xl font-black leading-none">
              {POINTS_BALANCE.toLocaleString()}
              <span className="text-2xl text-brand-200 ml-1 font-semibold">pts</span>
            </p>

            {/* Progress to Gold */}
            <div className="mt-5 space-y-2">
              <div className="flex justify-between text-xs text-brand-200">
                <span>Silver</span>
                <span className="font-semibold text-white">{POINTS_TO_NEXT} pts to {NEXT_TIER}</span>
                <span>{NEXT_TIER}</span>
              </div>
              <div className="h-2.5 rounded-full bg-white/20 overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all"
                  style={{ width: `${PROGRESS_PCT}%` }}
                />
              </div>
              <p className="text-[10px] text-brand-200 text-center">{PROGRESS_PCT}% of the way to {NEXT_TIER}</p>
            </div>
          </div>
        </div>

        {/* Tier benefits */}
        <div>
          <h2 className="font-display text-sm font-bold text-foreground mb-3">Tier Benefits</h2>
          <div className="space-y-3">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className={cn(
                  "rounded-2xl border px-4 py-4",
                  tier.current ? "border-brand-300 bg-brand-50" : tier.color
                )}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{tier.icon}</span>
                    <span className={cn(
                      "font-display text-sm font-bold",
                      tier.current ? "text-brand-700" : "text-foreground"
                    )}>
                      {tier.name}
                    </span>
                  </div>
                  {tier.current && (
                    <span className="rounded-full bg-brand-500 px-2.5 py-0.5 text-[10px] font-bold text-white">
                      Current tier
                    </span>
                  )}
                </div>
                <ul className="space-y-1.5">
                  {tier.perks.map((perk) => (
                    <li key={perk} className={cn(
                      "flex items-start gap-2 text-xs",
                      tier.current ? "text-brand-700" : "text-muted-foreground"
                    )}>
                      <ChevronRight className={cn(
                        "h-3.5 w-3.5 mt-0.5 shrink-0",
                        tier.current ? "text-brand-500" : "text-muted-foreground/50"
                      )} />
                      {perk}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Points history */}
        <div>
          <h2 className="font-display text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <Star className="h-4 w-4 text-brand-500" />
            Points History
          </h2>
          <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden divide-y divide-border">
            {HISTORY.map((entry) => (
              <div key={entry.id} className="flex items-center gap-3 px-4 py-3.5">
                <div className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                  entry.type === "earn" ? "bg-success-50" : "bg-brand-50"
                )}>
                  {entry.type === "earn"
                    ? <Star className="h-4 w-4 text-success-600" />
                    : <Gift className="h-4 w-4 text-brand-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{entry.label}</p>
                  <p className="text-xs text-muted-foreground">{entry.date}</p>
                </div>
                <span className={cn(
                  "text-sm font-black tabular-nums shrink-0",
                  entry.type === "earn" ? "text-success-600" : "text-brand-500"
                )}>
                  {entry.type === "earn" ? "+" : "−"}{entry.pts} pts
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* How to earn */}
        <div>
          <h2 className="font-display text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <Gift className="h-4 w-4 text-brand-500" />
            How to Earn Points
          </h2>
          <div className="rounded-2xl border border-border bg-card shadow-card divide-y divide-border overflow-hidden">
            {HOW_TO_EARN.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 px-4 py-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-sm text-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Referral */}
        <div className="rounded-2xl border border-border bg-card shadow-card p-5">
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-brand-500" />
            <h2 className="font-display text-sm font-bold text-foreground">Refer a Friend</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Earn <span className="font-semibold text-brand-600">50 bonus points</span> for every sari-sari store owner you bring in.
          </p>

          {/* Code display */}
          <div className="flex items-center gap-2 rounded-xl border border-dashed border-brand-300 bg-brand-50 px-4 py-3 mb-3">
            <span className="flex-1 font-mono text-sm font-bold text-brand-700 tracking-wider">
              {REFERRAL_CODE}
            </span>
            <button
              onClick={handleCopy}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all active:scale-95",
                copied
                  ? "bg-success-500 text-white"
                  : "bg-brand-500 text-white hover:bg-brand-600"
              )}
            >
              {copied ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </>
              )}
            </button>
          </div>

          {/* Share button */}
          <button
            onClick={handleShareMessenger}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#0084FF] bg-[#EFF8FF] py-3 text-sm font-bold text-[#0084FF] hover:bg-[#DBEEFF] active:scale-[0.98] transition-all"
          >
            {/* Messenger icon inline SVG */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#0084FF" aria-hidden="true">
              <path d="M12 2C6.477 2 2 6.145 2 11.259c0 2.821 1.257 5.351 3.267 7.12v3.32l3.167-1.734a11.166 11.166 0 003.566.584c5.523 0 10-4.145 10-9.259C22 6.145 17.523 2 12 2zm1.012 12.482l-2.547-2.714-4.97 2.714 5.47-5.805 2.61 2.714 4.908-2.714-5.471 5.805z"/>
            </svg>
            Share on Messenger
          </button>
        </div>
      </div>

      <RetailerBottomNav />
    </div>
  );
}
