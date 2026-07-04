"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPHP } from "@/lib/utils";
import { DRIVERS, ROUTES, MOCK_ORDERS } from "@/lib/mock-data";

const driver = DRIVERS[0]; // Rodrigo Delos Santos
const route = ROUTES[0];   // Caloocan North

// Mock today's summary data derived from route + orders
const TODAY = {
  assigned: 8,
  delivered: 5,
  codToCollect: MOCK_ORDERS.filter(o => o.paymentMethod === "cod").reduce((s, o) => s + o.total, 0),
  earnings: 620,
  distanceKm: "18.4",
  successRate: "96%",
};

export default function DriverHomePage() {
  const [onDuty, setOnDuty] = useState(true);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const progressPct = Math.round((route.completedStops / route.stops) * 100);

  return (
    <div className="px-4 py-5 flex flex-col gap-4">
      {/* Greeting */}
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground text-balance">
          {greeting}, {driver.name.split(" ")[0]}! 🚗
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {onDuty ? "You're on duty — keep it moving!" : "You're off duty. Start your shift when ready."}
        </p>
      </div>

      {/* On/Off Duty toggle */}
      <Button
        size="lg"
        variant={onDuty ? "outline" : "default"}
        className={`w-full h-14 text-base font-semibold rounded-2xl ${
          onDuty
            ? "border-danger-500 text-danger-600 hover:bg-danger-50"
            : "bg-brand-500 text-white"
        }`}
        onClick={() => setOnDuty(!onDuty)}
      >
        {onDuty ? "Go Off-Duty" : "Go On-Duty"}
      </Button>

      {/* Today's summary cards */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Today's Summary
        </p>
        <div className="grid grid-cols-2 gap-3">
          <SummaryCard
            label="Assigned"
            value={TODAY.assigned}
            badge={`${TODAY.delivered} done`}
            badgeVariant="success"
          />
          <SummaryCard
            label="Delivered"
            value={TODAY.delivered}
            badge={`${TODAY.assigned - TODAY.delivered} left`}
            badgeVariant="warning"
          />
          <SummaryCard
            label="COD to Collect"
            value={formatPHP(TODAY.codToCollect)}
            valueClass="text-brand-500"
            badge="cash"
            badgeVariant="default"
          />
          <SummaryCard
            label="Est. Earnings"
            value={formatPHP(TODAY.earnings)}
            valueClass="text-success-600"
            badge="today"
            badgeVariant="success"
          />
        </div>
      </div>

      {/* Quick stats row */}
      <Card className="p-4">
        <div className="grid grid-cols-3 divide-x divide-border">
          <StatCell label="Distance" value={`${TODAY.distanceKm} km`} />
          <StatCell label="Done" value={String(TODAY.delivered)} />
          <StatCell label="Success" value={TODAY.successRate} valueClass="text-success-600" />
        </div>
      </Card>

      {/* Active route card */}
      <Card className="p-4 border-brand-200 bg-brand-50/40">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider mb-0.5">
              Active Route
            </p>
            <h2 className="font-display text-base font-bold text-foreground">{route.name}</h2>
            <p className="text-sm text-muted-foreground">{route.stops} stops · {route.distance} · {route.estimatedDuration}</p>
          </div>
          <Badge variant="default" className="mt-0.5">Live</Badge>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>{route.completedStops} of {route.stops} stops complete</span>
            <span className="font-semibold text-brand-600">{progressPct}%</span>
          </div>
          <div className="h-2.5 bg-brand-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <Link href="/driver/route">
          <Button variant="default" size="sm" className="w-full">
            View Route
          </Button>
        </Link>
      </Card>

      {/* Next delivery hint */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
            <span className="font-display text-sm font-bold text-brand-600">{route.completedStops + 1}</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Next stop</p>
            <p className="text-sm font-semibold text-foreground truncate">Maria Santos · Brgy. 7, Caloocan</p>
            <p className="text-xs text-muted-foreground">#KSS-2025-00145 · COD ₱1,920</p>
          </div>
          <Link href="/driver/deliveries" className="flex-shrink-0">
            <Button size="sm" variant="outline">Go</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  badge,
  badgeVariant = "neutral",
  valueClass = "",
}: {
  label: string;
  value: string | number;
  badge?: string;
  badgeVariant?: "default" | "success" | "warning" | "danger" | "info" | "neutral";
  valueClass?: string;
}) {
  return (
    <Card className="p-4 flex flex-col gap-1.5">
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
      <p className={`font-display text-lg font-bold text-foreground leading-none ${valueClass}`}>
        {value}
      </p>
      {badge && <Badge variant={badgeVariant} className="self-start">{badge}</Badge>}
    </Card>
  );
}

function StatCell({
  label,
  value,
  valueClass = "",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 px-3">
      <p className={`font-display text-lg font-bold tabular-nums ${valueClass || "text-foreground"}`}>
        {value}
      </p>
      <p className="text-2xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
    </div>
  );
}
