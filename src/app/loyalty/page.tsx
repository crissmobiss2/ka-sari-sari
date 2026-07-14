"use client";
import { useState, useEffect } from "react";
import { Crown, Star, Gift, Users, Copy, CheckCircle2, ChevronRight } from "lucide-react";
import { RetailerTopBar, RetailerBottomNav } from "@/components/layout/retailer-nav";
import { cn } from "@/lib/utils";
import { useLoyaltyStore } from "@/store/loyalty";
import { toastSuccess } from "@/store/toast";

// ── Tier config ───────────────────────────────────────────────────────────────

interface TierConfig {
  name: string;
  icon: string;
  min: number;
  max: number | null;
  color: string;
  badge: string;
  perks: string[];
}

const TIER_CONFIG: TierConfig[] = [
  {
    name: "Bronze",
    icon: "🥉",
    min: 0,
    max: 999,
    color: "border-orange-200 bg-orange-50",
    badge: "bg-orange-100 text-orange-700",
    perks: ["Access to bulk pricing", "Standard support"],
  },
  {
    name: "Silver",
    icon: "🥈",
    min: 1000,
    max: 2999,
    color: "border-slate-300 bg-slate-50",
    badge: "bg-slate-100 text-slate-600",
    perks: ["Early access to flash sales", "Priority support"],
  },
  {
    name: "Gold",
    icon: "🥇",
    min: 3000,
    max: 5999,
    color: "border-amber-300 bg-amber-50",
    badge: "bg-amber-100 text-amber-700",
    perks: ["Extra 5% discount on all orders", "Free delivery on Fridays"],
  },
  {
    name: "Platinum",
    icon: "💎",
    min: 6000,
    max: null,
    color: "border-violet-300 bg-violet-50",
    badge: "bg-violet-100 text-violet-700",
    perks: ["Personal account manager", "Custom pricing", "First pick on new arrivals"],
  },
];

function getTierForBalance(balance: number): TierConfig {
  return (
    TIER_CONFIG.slice()
      .reverse()
      .find((t) => balance >= t.min) ?? TIER_CONFIG[0]
  );
}

function getNextTier(current: TierConfig): TierConfig | null {
  const idx = TIER_CONFIG.findIndex((t) => t.name === current.name);
  return idx < TIER_CONFIG.length - 1 ? TIER_CONFIG[idx + 1] : null;
}

// ── Static data ───────────────────────────────────────────────────────────────

const HOW_TO_EARN = [
  { icon: Star, text: "1 point per ₱10 spent on any order" },
  { icon: Users, text: "Bonus 50 pts for every friend you refer" },
  { icon: Gift, text: "25 pts for leaving a product review" },
];

// Referral code is derived dynamically from auth; see useState below

// ── Main page ────────────────────────────────────────────────────────────────

export default function LoyaltyPage() {
  const [copied, setCopied] = useState(false);
  const [referralCode, setReferralCode] = useState("KSS-DEMO-2025");

  const { balance, transactions } = useLoyaltyStore();

  // Hydrate loyalty balance and transaction history from the server on mount
  useEffect(() => {
    fetch("/api/user/loyalty")
      .then((r) => { if (!r.ok) return null; return r.json(); })
      .then((data) => {
        if (data?.balance !== undefined) {
          useLoyaltyStore.getState().hydrate(data.balance, data.transactions ?? []);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.referralCode) {
          setReferralCode(data.referralCode);
        } else if (data?.name) {
          const first = data.name.split(" ")[0].toUpperCase();
          const suffix = data.id ? data.id.slice(-4).toUpperCase() : String(new Date().getFullYear());
          setReferralCode(`${first}-KSS-${suffix}`);
        }
      })
      .catch(() => {/* keep default */});
  }, []);

  // Derived tier data
  const currentTier = getTierForBalance(balance);
  const nextTier = getNextTier(currentTier);
  const pointsToNext = nextTier ? nextTier.min - balance : 0;
  const progressPct = nextTier
    ? Math.round((balance - currentTier.min) / (nextTier.min - currentTier.min) * 100)
    : 100;

  // Build TIERS display list (Silver onward — always show Silver, Gold, Platinum for aspirational UX)
  const displayTiers = TIER_CONFIG.filter((t) => t.name !== "Bronze").map((t) => ({
    ...t,
    current: t.name === currentTier.name,
  }));

  // Map store transactions to display shape
  const HISTORY = transactions.map((tx) => ({
    id: tx.id,
    type: tx.type,
    pts: tx.points,
    label: tx.label,
    date: tx.date,
  }));

  function handleCopy() {
    navigator.clipboard.writeText(referralCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function handleShareMessenger() {
    if (navigator.share) {
      navigator.share({
        title: "Ka Sari-Sari",
        text: `Join Ka Sari-Sari with my referral code: ${referralCode}`,
        url: "https://ka-sari-sari.vercel.app",
      }).catch(() => {/* user cancelled or share failed */});
    } else {
      navigator.clipboard
        .writeText(`Join Ka Sari-Sari! Use my code: ${referralCode}`)
        .catch(() => {});
      toastSuccess("Referral link copied to clipboard!");
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <RetailerTopBar title="Rewards" />

      <div className="px-4 py-5 space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
            <Crown className="h-5 w-5 text-brand-500" />
            Rewards &amp; Loyalty
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
                {currentTier.icon} {currentTier.name} Member
              </span>
            </div>

            {/* Points */}
            <p className="text-xs text-brand-200 uppercase tracking-wide mb-1">Your points</p>
            <p className="font-display text-5xl font-black leading-none">
              {balance.toLocaleString()}
              <span className="text-2xl text-brand-200 ml-1 font-semibold">pts</span>
            </p>

            {/* Progress to next tier */}
            {nextTier ? (
              <div className="mt-5 space-y-2">
                <div className="flex justify-between text-xs text-brand-200">
                  <span>{currentTier.name}</span>
                  <span className="font-semibold text-white">{pointsToNext} pts to {nextTier.name}</span>
                  <span>{nextTier.name}</span>
                </div>
                <div className="h-2.5 rounded-full bg-white/20 overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <p className="text-[10px] text-brand-200 text-center">{progressPct}% of the way to {nextTier.name}</p>
              </div>
            ) : (
              <div className="mt-5">
                <p className="text-xs text-brand-200 text-center">You&apos;ve reached the highest tier!</p>
              </div>
            )}
          </div>
        </div>

        {/* Tier benefits */}
        <div>
          <h2 className="font-display text-sm font-bold text-foreground mb-3">Tier Benefits</h2>
          <div className="space-y-3">
            {displayTiers.map((tier) => (
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
              {referralCode}
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
