"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPHP } from "@/lib/utils";
import { DRIVERS, ROUTES } from "@/lib/mock-data";
import { useOrdersStore } from "@/store/orders";

const driver = DRIVERS[0]; // Rodrigo Delos Santos
const route = ROUTES[0];   // Caloocan North

interface ApiDeliveryCounts {
  total: number;
  delivered: number;
  pending: number;
  codToCollect: number;
}

export default function DriverHomePage() {
  // Persist duty state to sessionStorage so it survives page navigation within the session
  const [onDuty, setOnDuty] = useState(() =>
    typeof window !== "undefined" ? sessionStorage.getItem("driver-duty") === "1" : false
  );

  // Ref to hold the geolocation watchPosition ID so we can clear it later
  const watchIdRef = useRef<number | null>(null);

  const [greeting, setGreeting] = useState("Good day");
  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening");
  }, []);

  // API-derived delivery counts — fetched on mount, used in summary cards
  const [apiCounts, setApiCounts] = useState<ApiDeliveryCounts | null>(null);

  useEffect(() => {
    async function fetchDeliveryCounts() {
      try {
        const res = await fetch("/api/driver/deliveries");
        if (!res.ok) return;
        const data = await res.json();
        const deliveries: Array<{ status: string; codAmount?: number }> = data.deliveries ?? [];
        const total = deliveries.length;
        const delivered = deliveries.filter((d) => d.status === "delivered").length;
        const pending = deliveries.filter((d) =>
          ["assigned", "pending", "out_for_delivery"].includes(d.status)
        ).length;
        const codToCollect = deliveries
          .filter((d) => ["assigned", "pending", "out_for_delivery"].includes(d.status) && d.codAmount)
          .reduce((sum, d) => sum + (d.codAmount ?? 0), 0);
        setApiCounts({ total, delivered, pending, codToCollect });
      } catch {
        // Fall back to store data silently
      }
    }
    fetchDeliveryCounts();
  }, []);

  // Clear geolocation watch when component unmounts
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && typeof navigator !== "undefined" && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const progressPct = Math.round((route.completedStops / route.stops) * 100);

  // Derive fallback metrics from the orders store (also drives the "Next stop" card)
  const orders = useOrdersStore((s) => s.orders);
  const myDeliveries = orders.filter((o) =>
    ["out_for_delivery", "delivered", "failed_delivery"].includes(o.status)
  );
  const pendingDeliveries = myDeliveries.filter((o) => o.status === "out_for_delivery");
  const deliveredToday = myDeliveries.filter((o) => o.status === "delivered").length;
  const codToCollect = pendingDeliveries
    .filter((o) => o.paymentMethod === "cod")
    .reduce((s, o) => s + o.total, 0);
  const nextStop = pendingDeliveries[0] ?? null; // first pending delivery

  // Prefer API counts; fall back to store-derived values
  const displayTotal         = apiCounts?.total       ?? myDeliveries.length;
  const displayDelivered     = apiCounts?.delivered   ?? deliveredToday;
  const displayPending       = apiCounts?.pending     ?? pendingDeliveries.length;
  const displayCodToCollect  = apiCounts?.codToCollect ?? codToCollect;

  // Estimated earnings: ₱80/stop + 2% COD incentive
  const estEarnings = displayDelivered * 80 + displayCodToCollect * 0.02;

  // ── GPS helpers ──────────────────────────────────────────────────────────────

  function startLocationSharing() {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        fetch("/api/driver/location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            heading: pos.coords.heading ?? null,
            speed: pos.coords.speed ?? null,
          }),
        }).catch(() => {}); // fire-and-forget; don't block the driver
      },
      (err) => console.warn("Geolocation error:", err),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
    watchIdRef.current = id;
  }

  function stopLocationSharing() {
    if (watchIdRef.current !== null && typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }

  // ── Duty toggle ──────────────────────────────────────────────────────────────

  const handleDutyToggle = () => {
    const next = !onDuty;
    sessionStorage.setItem("driver-duty", next ? "1" : "0");
    setOnDuty(next);
    if (next) {
      startLocationSharing();
    } else {
      stopLocationSharing();
    }
  };

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
        onClick={handleDutyToggle}
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
            value={displayTotal}
            badge={`${displayDelivered} done`}
            badgeVariant="success"
          />
          <SummaryCard
            label="Delivered"
            value={displayDelivered}
            badge={`${displayPending} left`}
            badgeVariant="warning"
          />
          <SummaryCard
            label="COD to Collect"
            value={formatPHP(displayCodToCollect)}
            valueClass="text-brand-500"
            badge="cash"
            badgeVariant="default"
          />
          <SummaryCard
            label="Est. Earnings"
            value={formatPHP(estEarnings)}
            valueClass="text-success-600"
            badge="today"
            badgeVariant="success"
          />
        </div>
      </div>

      {/* Quick stats row */}
      <Card className="p-4">
        <div className="grid grid-cols-3 divide-x divide-border">
          <StatCell label="Distance" value={route.distance} />
          <StatCell label="Done" value={String(displayDelivered)} />
          <StatCell
            label="Success"
            value={displayTotal > 0 ? `${Math.round((displayDelivered / displayTotal) * 100)}%` : "—"}
            valueClass="text-success-600"
          />
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
        {nextStop ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
              <span className="font-display text-sm font-bold text-brand-600">
                {pendingDeliveries.indexOf(nextStop) + 1}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Next stop</p>
              <p className="text-sm font-semibold text-foreground truncate">
                {nextStop.deliveryAddress}
              </p>
              <p className="text-xs text-muted-foreground">
                {nextStop.orderNumber}
                {nextStop.paymentMethod === "cod" ? ` · COD ${formatPHP(nextStop.total)}` : ""}
              </p>
            </div>
            <Link href="/driver/deliveries" className="flex-shrink-0">
              <Button size="sm" variant="outline">Go</Button>
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <span className="font-display text-sm font-bold text-muted-foreground">—</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Next stop</p>
              <p className="text-sm font-semibold text-foreground">No pending stops</p>
            </div>
          </div>
        )}
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
