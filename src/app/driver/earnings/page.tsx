"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Wallet, Clock, CheckCircle2, Banknote, MapPin, Star, Gift } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatPHP } from "@/lib/utils";

const WEEKLY = [
  { day: "Mon", deliveries: 3, earned: 480 },
  { day: "Tue", deliveries: 4, earned: 640 },
  { day: "Wed", deliveries: 5, earned: 800 },
  { day: "Thu", deliveries: 2, earned: 320 },
  { day: "Fri", deliveries: 4, earned: 640 },
  { day: "Sat", deliveries: 3, earned: 480 },
  { day: "Sun", deliveries: 2, earned: 320 },
];

const HISTORY = [
  { date: "Sun Jul 06", order: "KSS-2026-00218", area: "Brgy. 5, Caloocan", earned: 160, cod: 0,    status: "paid" },
  { date: "Sun Jul 06", order: "KSS-2026-00219", area: "Brgy. Bagong Barrio, Caloocan", earned: 160, cod: 850,  status: "pending" },
  { date: "Sat Jul 05", order: "KSS-2026-00215", area: "Brgy. 15, Caloocan", earned: 160, cod: 450,  status: "paid" },
  { date: "Sat Jul 05", order: "KSS-2026-00216", area: "Brgy. Bagong Pag-Asa, QC", earned: 160, cod: 0,    status: "paid" },
  { date: "Sat Jul 05", order: "KSS-2026-00217", area: "Brgy. Tatalon, QC", earned: 160, cod: 680,  status: "paid" },
  { date: "Fri Jul 04", order: "KSS-2026-00211", area: "Brgy. Maypajo, Caloocan", earned: 160, cod: 0,    status: "paid" },
  { date: "Fri Jul 04", order: "KSS-2026-00212", area: "Brgy. 5, Caloocan", earned: 160, cod: 920,  status: "paid" },
  { date: "Fri Jul 04", order: "KSS-2026-00213", area: "Brgy. Camarin, Caloocan", earned: 160, cod: 0,    status: "paid" },
  { date: "Fri Jul 04", order: "KSS-2026-00214", area: "Brgy. Bagong Silang, Caloocan", earned: 160, cod: 550,  status: "paid" },
];

const CITY_PERFORMANCE = [
  { city: "Caloocan",    deliveries: 42, earned: 6720, trend: "up"   },
  { city: "Quezon City", deliveries: 18, earned: 2880, trend: "up"   },
  { city: "Malabon",     deliveries: 12, earned: 1920, trend: "same" },
  { city: "Navotas",     deliveries: 8,  earned: 1280, trend: "down" },
  { city: "Valenzuela",  deliveries: 15, earned: 2400, trend: "up"   },
];

const BONUSES = [
  { label: "Daily streak (7 days)", amount: 200,  earned: true  },
  { label: "Weekend warrior",       amount: 350,  earned: true  },
  { label: "10-delivery bonus",     amount: 500,  earned: false, progress: 7, target: 10 },
  { label: "5-star rating bonus",   amount: 300,  earned: false, progress: 4.8, target: 5.0, isStar: true },
];

const COD_THIS_WEEK = {
  expected: 3450,
  collected: 2600,
  pending: 850,
};

const maxEarned = Math.max(...WEEKLY.map((d) => d.earned));
const MAX_BAR_HEIGHT = 80;
const TODAY_INDEX = (() => { const d = new Date().getDay(); return d === 0 ? 6 : d - 1; })();

const weeklyTotal = WEEKLY.reduce((sum, w) => sum + w.earned, 0);
const monthlyTotal = weeklyTotal * 4;
const yearToDateTotal = monthlyTotal * 8;

interface EarningsBreakdown { day: string; amount: number; deliveries: number }
interface EarningsDelivery { id: string; date: string; address: string; amount: number; tip: number; status: string }
interface EarningsData {
  weeklyTotal: number;
  monthlyTotal: number;
  ytdTotal: number;
  deliveryCount: number;
  completionRate: number;
  gcashNumber: string;
  nextPaymentDate: string;
  weeklyBreakdown: EarningsBreakdown[];
  recentDeliveries: EarningsDelivery[];
}

type Tab = "overview" | "history" | "areas";

export default function EarningsPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/driver/earnings")
      .then(r => r.json())
      .then(d => setEarnings(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Derive display values — prefer API data, fall back to hardcoded constants
  const displayWeekly = earnings?.weeklyBreakdown?.map(w => ({
    day: w.day,
    deliveries: w.deliveries,
    earned: w.amount,
  })) ?? WEEKLY;
  const displayMaxEarned = Math.max(...displayWeekly.map(d => d.earned));
  const displayWeeklyTotal = earnings?.weeklyTotal ?? weeklyTotal;
  const displayMonthlyTotal = earnings?.monthlyTotal ?? monthlyTotal;
  const displayYtdTotal = earnings?.ytdTotal ?? yearToDateTotal;
  const displayDeliveryCount = earnings?.deliveryCount ?? 23;
  const displayHistory: Array<{ date: string; order: string; area: string; earned: number; cod: number; status: string }> =
    earnings?.recentDeliveries?.map(d => ({
      date: d.date,
      order: d.id,
      area: d.address,
      earned: d.amount,
      cod: 0,
      status: d.status === "delivered" ? "paid" : "pending",
    })) ?? HISTORY;
  const displayGcash = earnings?.gcashNumber ?? "09171234567";
  const displayNextPayment = earnings?.nextPaymentDate ?? "Friday";

  if (loading) {
    return (
      <div className="flex flex-col gap-4 pb-8">
        <div className="px-4 pt-5 pb-1">
          <h1 className="font-display text-xl font-bold text-foreground">My Earnings</h1>
        </div>
        <div className="flex items-center justify-center h-40">
          <p className="text-muted-foreground text-sm animate-pulse">Loading earnings…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-8">
      {/* Page header */}
      <div className="px-4 pt-5 pb-1">
        <h1 className="font-display text-xl font-bold text-foreground">My Earnings</h1>
      </div>

      {/* Hero card */}
      <div className="mx-4 rounded-2xl bg-brand-700 text-white p-5">
        <p className="text-xs opacity-80 uppercase tracking-wider font-medium mb-1">This Week</p>
        <p className="font-display text-4xl font-black leading-none mb-1">{formatPHP(displayWeeklyTotal)}</p>
        <p className="text-sm opacity-90 mb-3">{displayDeliveryCount} deliveries</p>
        <div className="flex items-center gap-1.5 opacity-80">
          <TrendingUp className="w-3.5 h-3.5" />
          <span className="text-xs">+₱320 vs last week</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="mx-4 grid grid-cols-2 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4 text-brand-500 flex-shrink-0" />
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">This Month</p>
          </div>
          <p className="font-display text-xl font-black text-foreground">{formatPHP(displayMonthlyTotal)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">95 deliveries</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-brand-500 flex-shrink-0" />
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Year to Date</p>
          </div>
          <p className="font-display text-xl font-black text-foreground">{formatPHP(displayYtdTotal)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">559 deliveries</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="mx-4 flex gap-1 bg-surface-100 dark:bg-surface-800 rounded-xl p-1">
        {(["overview", "history", "areas"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors",
              tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            )}
          >
            {t === "areas" ? "By City" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ─── Overview tab ─── */}
      {tab === "overview" && (
        <>
          {/* Weekly chart */}
          <Card className="mx-4 p-4">
            <p className="text-sm font-semibold text-foreground mb-4">This Week</p>
            <div className="flex items-end gap-1" style={{ height: MAX_BAR_HEIGHT + 28 }}>
              {displayWeekly.map((d, i) => {
                const barH = d.earned > 0 ? Math.max(6, (d.earned / displayMaxEarned) * MAX_BAR_HEIGHT) : 4;
                const isToday = i === TODAY_INDEX;
                return (
                  <div key={d.day} className="flex-1 flex flex-col items-center justify-end gap-1">
                    <span className={cn("text-[9px] tabular-nums leading-none", isToday ? "text-brand-500 font-bold" : "text-muted-foreground")}>
                      {d.earned > 0 ? `₱${d.earned}` : ""}
                    </span>
                    <div className={cn("w-full rounded-t-md", isToday ? "bg-brand-500" : "bg-brand-500/40")} style={{ height: barH }} />
                    <span className={cn("text-[10px] font-medium", isToday ? "text-brand-500" : "text-muted-foreground")}>{d.day}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* COD reconciliation */}
          <div className="mx-4 rounded-2xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Banknote className="h-4 w-4 text-brand-500" />
              <p className="text-sm font-semibold text-foreground">COD This Week</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Expected",  value: COD_THIS_WEEK.expected,  color: "text-foreground" },
                { label: "Collected", value: COD_THIS_WEEK.collected, color: "text-success-700 dark:text-foreground" },
                { label: "Pending",   value: COD_THIS_WEEK.pending,   color: "text-warning-700 dark:text-foreground" },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-xl bg-surface-50 dark:bg-surface-900 dark:bg-surface-800 border border-border/60 p-2.5 text-center">
                  <p className={cn("text-base font-black tabular-nums", color)}>₱{value.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
                </div>
              ))}
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Collection rate</span>
                <span className="font-semibold text-success-700 dark:text-foreground">{Math.round((COD_THIS_WEEK.collected / COD_THIS_WEEK.expected) * 100)}%</span>
              </div>
              <div className="h-2 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-success-500 rounded-full"
                  style={{ width: `${(COD_THIS_WEEK.collected / COD_THIS_WEEK.expected) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Bonuses & incentives */}
          <div className="mx-4 space-y-2">
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Gift className="h-4 w-4 text-brand-500" />
              Bonuses & Incentives
            </p>
            {BONUSES.map((b, i) => (
              <div key={i} className={cn("rounded-xl border p-3.5", b.earned ? "border-success-200 bg-success-50 dark:bg-success-500/10 dark:bg-card dark:border-success-900/30" : "border-border bg-card")}>
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-xs font-semibold", "text-foreground")}>{b.label}</p>
                    {!b.earned && b.progress !== undefined && (
                      <div className="mt-1.5">
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="text-muted-foreground">
                            {b.isStar ? `${b.progress}★ / ${b.target}★` : `${b.progress}/${b.target} deliveries`}
                          </span>
                          <span className="font-medium text-foreground">{Math.round(((b.progress as number) / (b.target as number)) * 100)}%</span>
                        </div>
                        <div className="h-1.5 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-400 rounded-full" style={{ width: `${((b.progress as number) / (b.target as number)) * 100}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="ml-3 text-right shrink-0">
                    <p className={cn("text-sm font-black tabular-nums", b.earned ? "text-success-700 dark:text-foreground" : "text-foreground")}>
                      +₱{b.amount}
                    </p>
                    {b.earned && <p className="text-[10px] text-success-700 dark:text-foreground mt-0.5 font-medium">Earned ✓</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Payment info */}
          <div className="mx-4 rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-brand-500" />
              <p className="text-sm font-semibold text-foreground">Payment Details</p>
            </div>
            <div className="space-y-2">
              {[
                { label: "GCash number", value: displayGcash },
                { label: "Schedule", value: `Every ${displayNextPayment}` },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="text-xs font-semibold text-foreground tabular-nums">{value}</span>
                </div>
              ))}
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Next payment</span>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-success-500" />
                  <span className="text-xs font-semibold text-success-700 dark:text-foreground">Fri, Jul 11, 2026</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ─── History tab ─── */}
      {tab === "history" && (
        <Card className="mx-4 overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Delivery History</p>
            <span className="text-xs text-muted-foreground">{displayHistory.length} deliveries</span>
          </div>
          <div className="divide-y divide-border">
            {displayHistory.map((item) => (
              <div key={item.order} className="px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{item.order}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.area}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[10px] text-muted-foreground">{item.date}</p>
                    {item.cod > 0 && (
                      <span className="text-[10px] font-medium text-warning-700 dark:text-foreground bg-warning-50 dark:bg-warning-500/10 dark:bg-warning-500/20 dark:text-foreground dark:border-warning-500/30 border border-warning-100 rounded-full px-1.5">
                        COD ₱{item.cod.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className="text-sm font-bold tabular-nums text-foreground">
                    {formatPHP(item.earned)}
                  </span>
                  <Badge variant={item.status === "paid" ? "success" : "warning"}>
                    {item.status === "paid" ? "Paid" : "Pending"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ─── Areas tab ─── */}
      {tab === "areas" && (
        <div className="mx-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">This Month — by City</p>
          {CITY_PERFORMANCE.map((c) => {
            const maxD = Math.max(...CITY_PERFORMANCE.map((x) => x.deliveries));
            const pct = (c.deliveries / maxD) * 100;
            return (
              <div key={c.city} className="rounded-xl border border-border bg-card p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-brand-500" />
                    <span className="text-sm font-semibold text-foreground">{c.city}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-xs",
                      c.trend === "up" ? "text-success-700 dark:text-foreground" : c.trend === "down" ? "text-danger-700 dark:text-foreground" : "text-muted-foreground"
                    )}>
                      {c.trend === "up" ? "↑" : c.trend === "down" ? "↓" : "→"}
                    </span>
                    <span className="text-sm font-black text-foreground tabular-nums">₱{c.earned.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="flex-1 h-1.5 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[11px] text-muted-foreground shrink-0 tabular-nums">{c.deliveries} drops</span>
                </div>
              </div>
            );
          })}

          <div className="rounded-xl border border-brand-100 bg-brand-50 dark:bg-brand-500/10 dark:bg-card dark:border-border/50 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Star className="h-4 w-4 text-brand-500" />
              <p className="text-xs font-semibold text-foreground">Top Area: Caloocan</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              42 deliveries this month — your strongest city. Focus on Caloocan routes to maximize earnings.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
