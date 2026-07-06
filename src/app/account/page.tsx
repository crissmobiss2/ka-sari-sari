"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  User, Store, CreditCard, Bell, HelpCircle, LogOut,
  ChevronRight, Shield, ShieldCheck, Check, Clock, Heart, Wallet, Tag
} from "lucide-react";
import { RetailerTopBar, RetailerBottomNav } from "@/components/layout/retailer-nav";
import { useWalletStore } from "@/store/wallet";
import { useFavoritesStore } from "@/store/favorites";
import { formatPHP } from "@/lib/utils";

// Credit score constants
const CREDIT_SCORE = 724;
const CREDIT_SCORE_MAX = 850;
const CREDIT_SCORE_MIN = 300;
const CREDIT_LIMIT = 15000;
const CREDIT_USED = 3200;
const CREDIT_AVAILABLE = CREDIT_LIMIT - CREDIT_USED;
const CREDIT_UTILIZATION = (CREDIT_USED / CREDIT_LIMIT) * 100;

// Gauge arc helpers
// The semicircle goes from 180° (left) to 0° (right), center at (75, 80), radius 60
function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArc = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
  // sweep=1 means clockwise in SVG coordinate space
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

// Score as fraction 0–1 mapped over the score range
const scorePct = (CREDIT_SCORE - CREDIT_SCORE_MIN) / (CREDIT_SCORE_MAX - CREDIT_SCORE_MIN);
// Arc goes from 180° to 0° (clockwise in SVG), so needle angle = 180 - pct*180
const needleAngle = 180 - scorePct * 180;

const BG_ARC = describeArc(75, 80, 60, 180, 0);
const SCORE_ARC = describeArc(75, 80, 60, 180, needleAngle);

const scoreFactors: { label: string; pct: number; grade: string; color: string }[] = [
  { label: "Payment History", pct: 95, grade: "Excellent", color: "#22c55e" },
  { label: "Order Frequency", pct: 78, grade: "Good", color: "#f47028" },
  { label: "Account Age", pct: 62, grade: "Building", color: "#f59e0b" },
];

export default function AccountPage() {
  const walletBalance = useWalletStore((s) => s.balance);
  const favCount = useFavoritesStore((s) => s.items.length);

  const [creditData, setCreditData] = useState({
    score: CREDIT_SCORE,
    limit: CREDIT_LIMIT,
    used: CREDIT_USED,
    available: CREDIT_AVAILABLE,
    utilization: CREDIT_UTILIZATION,
  });

  const [userInfo, setUserInfo] = useState({
    displayName: "Maria Santos",
    phone: "+63 917 123 4567",
    storeName: "Santos Sari-Sari Store · Caloocan City",
    initial: "M",
  });

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        setUserInfo({
          displayName: data.displayName ?? data.name ?? userInfo.displayName,
          phone: data.phone ?? userInfo.phone,
          storeName: data.storeName ?? userInfo.storeName,
          initial: (data.displayName ?? data.name ?? userInfo.displayName).charAt(0).toUpperCase(),
        });
      })
      .catch(() => {});
  }, []);

  const menuItems = [
    { label: "Store Profile", description: "Manage your store details", href: "/account/store", icon: Store },
    { label: "Subscription", description: "Active · Renews Jul 6, 2027", href: "/account/subscription", icon: CreditCard },
    { label: "My Wallet", description: `Balance: ${formatPHP(walletBalance)}`, href: "/wallet", icon: Wallet },
    { label: "Saved Items", description: `${favCount} saved ${favCount === 1 ? "product" : "products"}`, href: "/favorites", icon: Heart },
    { label: "Today's Deals", description: "Exclusive discounts for you", href: "/deals", icon: Tag },
    { label: "Notifications", description: "Manage alerts and updates", href: "/notifications", icon: Bell },
    { label: "Help & Support", description: "FAQs, contact, and tickets", href: "/support", icon: HelpCircle },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <RetailerTopBar title="Account" />

      <div className="px-4 py-5 space-y-5">
        {/* Profile card */}
        <div className="rounded-2xl border border-border bg-card shadow-card p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-600 text-2xl font-black shrink-0">
              {userInfo.initial}
            </div>
            <div>
              <p className="font-display text-base font-bold text-foreground">{userInfo.displayName}</p>
              <p className="text-sm text-muted-foreground">{userInfo.phone}</p>
              <p className="text-sm text-muted-foreground">{userInfo.storeName}</p>
            </div>
          </div>
        </div>

        {/* Quick stats row */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/wallet" className="rounded-2xl border border-border bg-card shadow-card p-4 hover:border-brand-200 active:scale-95 transition-all">
            <p className="text-xs text-muted-foreground mb-1">Wallet Balance</p>
            <p className="text-xl font-black text-brand-500">{formatPHP(walletBalance)}</p>
          </Link>
          <Link href="/favorites" className="rounded-2xl border border-border bg-card shadow-card p-4 hover:border-brand-200 active:scale-95 transition-all">
            <p className="text-xs text-muted-foreground mb-1">Saved Items</p>
            <p className="text-xl font-black text-foreground">{favCount}</p>
          </Link>
        </div>

        {/* Credit Score card */}
        <div className="rounded-2xl border border-border bg-card shadow-card p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50">
                <ShieldCheck className="h-4 w-4 text-brand-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Credit Standing</p>
                <p className="text-xs text-muted-foreground">Ka Sari-Sari Credit Score</p>
              </div>
            </div>
            <span className="rounded-full bg-success-50 border border-success-200 px-2.5 py-0.5 text-xs font-bold text-success-700">
              Good Standing
            </span>
          </div>

          {/* Score gauge */}
          <div className="flex flex-col items-center mb-4">
            <svg viewBox="0 0 150 90" width={150} height={90} aria-label={`Credit score ${creditData.score} out of ${CREDIT_SCORE_MAX}`}>
              {/* Background arc */}
              <path
                d={BG_ARC}
                fill="none"
                stroke="#e5e7eb"
                strokeWidth={12}
                strokeLinecap="round"
              />
              {/* Score arc */}
              <path
                d={SCORE_ARC}
                fill="none"
                stroke="#22c55e"
                strokeWidth={12}
                strokeLinecap="round"
              />
              {/* Score label */}
              <text
                x="75"
                y="70"
                textAnchor="middle"
                fontSize="22"
                fontWeight="800"
                fill="currentColor"
                className="fill-foreground"
              >
                {creditData.score}
              </text>
              <text
                x="75"
                y="83"
                textAnchor="middle"
                fontSize="9"
                fill="#6b7280"
              >
                / {CREDIT_SCORE_MAX}
              </text>
            </svg>
            <p className="text-xs font-black tracking-widest text-success-600 -mt-1">GOOD</p>
          </div>

          {/* Score breakdown */}
          <div className="space-y-2.5 mb-4">
            {scoreFactors.map(({ label, pct, grade, color }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-xs font-bold" style={{ color }}>{grade}</p>
                </div>
                <div className="h-1.5 rounded-full bg-surface-200 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Credit limit row */}
          <div className="rounded-xl bg-surface-50 border border-border px-4 py-3 flex justify-between items-center">
            <div>
              <p className="text-xs text-muted-foreground">Credit Limit</p>
              <p className="text-lg font-black text-foreground">₱{creditData.limit.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Used</p>
              <p className="text-base font-bold text-brand-500">₱{creditData.used.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Available</p>
              <p className="text-base font-bold text-success-600">₱{creditData.available.toLocaleString()}</p>
            </div>
          </div>

          {/* Credit utilization bar */}
          <div className="mt-2.5">
            <div className="flex justify-between items-center mb-1">
              <p className="text-[11px] text-muted-foreground">Credit utilization</p>
              <p className="text-[11px] font-semibold text-muted-foreground">{creditData.utilization.toFixed(1)}% used</p>
            </div>
            <div className="h-1.5 rounded-full bg-success-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-brand-500 transition-all"
                style={{ width: `${creditData.utilization}%` }}
              />
            </div>
          </div>

          {/* Info text */}
          <p className="text-[11px] text-muted-foreground mt-3">
            Your credit score improves with consistent payments and regular ordering.
            Score updates monthly.
          </p>
        </div>

        {/* Subscription status */}
        <div className="rounded-2xl border border-success-500/25 bg-success-50 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-success-100 text-success-600">
              <Shield className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-success-700">Active Subscription</p>
              <p className="text-xs text-success-600 mt-0.5">Platform access · Annual · PHP 1,000</p>
              <div className="flex items-center gap-2 mt-2">
                <Check className="h-3.5 w-3.5 text-success-500" />
                <span className="text-xs text-success-600">Unlimited orders</span>
                <span className="text-success-300">·</span>
                <Clock className="h-3 w-3 text-success-500" />
                <span className="text-xs text-success-600">211 days left</span>
              </div>
            </div>
          </div>
        </div>

        {/* Menu */}
        <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden divide-y divide-border">
          {menuItems.map(({ label, description, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-4 px-5 py-4 hover:bg-muted transition-colors active:bg-muted"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-100 text-muted-foreground">
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground truncate">{description}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </Link>
          ))}
        </div>

        {/* Sign out */}
        <Link
          href="/login"
          className="flex items-center gap-3 rounded-2xl border border-danger-500/20 bg-danger-50 px-5 py-4 text-danger-600 hover:bg-danger-100 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span className="text-sm font-semibold">Sign out</span>
        </Link>

        <p className="text-center text-xs text-muted-foreground pb-2">Ka Sari-Sari v1.0.0 · Made with ❤️ in the Philippines</p>
      </div>

      <RetailerBottomNav />
    </div>
  );
}
