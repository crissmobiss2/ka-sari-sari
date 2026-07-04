"use client";

import { TrendingUp, Wallet, Clock, CheckCircle2 } from "lucide-react";
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
  { date: "Sun Jul 06", order: "KSS-2026-00218", area: "Brgy. 5, Caloocan", earned: 160, status: "paid" },
  { date: "Sun Jul 06", order: "KSS-2026-00219", area: "Brgy. Bagong Barrio, Caloocan", earned: 160, status: "pending" },
  { date: "Sat Jul 05", order: "KSS-2026-00215", area: "Brgy. 15, Caloocan", earned: 160, status: "paid" },
  { date: "Sat Jul 05", order: "KSS-2026-00216", area: "Brgy. Bagong Pag-Asa, QC", earned: 160, status: "paid" },
  { date: "Sat Jul 05", order: "KSS-2026-00217", area: "Brgy. Tatalon, QC", earned: 160, status: "paid" },
  { date: "Fri Jul 04", order: "KSS-2026-00211", area: "Brgy. Maypajo, Caloocan", earned: 160, status: "paid" },
  { date: "Fri Jul 04", order: "KSS-2026-00212", area: "Brgy. 5, Caloocan", earned: 160, status: "paid" },
  { date: "Fri Jul 04", order: "KSS-2026-00213", area: "Brgy. Camarin, Caloocan", earned: 160, status: "paid" },
  { date: "Fri Jul 04", order: "KSS-2026-00214", area: "Brgy. Bagong Silang, Caloocan", earned: 160, status: "paid" },
];

const maxEarned = Math.max(...WEEKLY.map((d) => d.earned));
const MAX_BAR_HEIGHT = 80;

// Today is Saturday (index 5 = Sat)
const TODAY_INDEX = 5;

export default function EarningsPage() {
  return (
    <div className="flex flex-col gap-4 pb-6">
      {/* Page header */}
      <div className="px-4 pt-5 pb-1">
        <h1 className="font-display text-xl font-bold text-foreground">My Earnings</h1>
      </div>

      {/* Hero card */}
      <div className="mx-4 rounded-2xl bg-brand-500 text-white p-5">
        <p className="text-xs opacity-80 uppercase tracking-wider font-medium mb-1">This Week</p>
        <p className="font-display text-4xl font-black leading-none mb-1">₱3,680</p>
        <p className="text-sm opacity-90 mb-3">23 deliveries</p>
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
          <p className="font-display text-xl font-black text-foreground">₱15,200</p>
          <p className="text-xs text-muted-foreground mt-0.5">95 deliveries</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-brand-500 flex-shrink-0" />
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Year to Date</p>
          </div>
          <p className="font-display text-xl font-black text-foreground">₱89,400</p>
          <p className="text-xs text-muted-foreground mt-0.5">559 deliveries</p>
        </Card>
      </div>

      {/* Weekly chart */}
      <Card className="mx-4 p-4">
        <p className="text-sm font-semibold text-foreground mb-4">This Week</p>
        <div className="flex items-end gap-1" style={{ height: MAX_BAR_HEIGHT + 28 }}>
          {WEEKLY.map((d, i) => {
            const barHeight = d.earned > 0 ? Math.max(6, (d.earned / maxEarned) * MAX_BAR_HEIGHT) : 4;
            const isToday = i === TODAY_INDEX;
            return (
              <div key={d.day} className="flex-1 flex flex-col items-center justify-end gap-1">
                {/* Amount label above bar */}
                <span className={cn(
                  "text-[9px] tabular-nums leading-none",
                  isToday ? "text-brand-500 font-bold" : "text-muted-foreground"
                )}>
                  {d.earned > 0 ? `₱${d.earned}` : ""}
                </span>
                {/* Bar */}
                <div
                  className={cn(
                    "w-full rounded-t-md transition-all",
                    isToday ? "bg-brand-500" : "bg-brand-500/40"
                  )}
                  style={{ height: barHeight }}
                />
                {/* Day label */}
                <span className={cn(
                  "text-[10px] font-medium",
                  isToday ? "text-brand-500" : "text-muted-foreground"
                )}>
                  {d.day}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Delivery history */}
      <Card className="mx-4 overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm font-semibold text-foreground">Delivery History</p>
        </div>
        <div className="divide-y divide-border">
          {HISTORY.map((item) => (
            <div key={item.order} className="px-4 py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{item.order}</p>
                <p className="text-xs text-muted-foreground truncate">{item.area}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{item.date}</p>
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

      {/* Payment info card */}
      <div className="mx-4 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-brand-500" />
          <p className="text-sm font-semibold text-foreground">Payment Details</p>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">GCash number</span>
            <span className="text-xs font-semibold text-foreground tabular-nums">09171234567</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Schedule</span>
            <span className="text-xs font-medium text-foreground">Every Friday</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Next payment</span>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-success-500" />
              <span className="text-xs font-semibold text-success-600">Fri, Jul 11, 2026</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
