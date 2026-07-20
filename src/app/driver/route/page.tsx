"use client";

import { useState, useEffect } from "react";
import {
  MapPin, CheckCircle2, Clock, Banknote, Navigation,
  Phone, ChevronDown, ChevronUp, AlertTriangle, Package,
  TrendingUp, XCircle
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn, formatPHP } from "@/lib/utils";
import { toastSuccess, toastError } from "@/store/toast";

type StopStatus = "done" | "next" | "pending" | "failed";

interface Stop {
  stopNumber: number;
  customer: string;
  storeName: string;
  area: string;
  barangay: string;
  city: string;
  address: string;
  orderNumber: string;
  /** orderId from the API (maps to orderNumber field; kept separately for PATCH calls) */
  orderId?: string;
  total: number;
  paymentMethod: "gcash" | "maya" | "cod" | "bank_transfer" | "credit";
  status: StopStatus;
  collectedCOD?: number;
  phone: string;
  items: number;
  weight: string;
  lat?: number;
  lng?: number;
}

const INITIAL_STOPS: Stop[] = [
  {
    stopNumber: 1, status: "done",
    customer: "Maria Santos", storeName: "Santos Sari-Sari Store",
    area: "Brgy. 5", barangay: "Barangay 5", city: "Caloocan",
    address: "123 Rizal St., Barangay 5, Caloocan City",
    orderNumber: "KSS-2026-00218", total: 1500, paymentMethod: "gcash",
    collectedCOD: 0, phone: "+63 917 123 4567", items: 8, weight: "14 kg",
    lat: 14.7492, lng: 121.0600,
  },
  {
    stopNumber: 2, status: "done",
    customer: "Roberto Cruz", storeName: "Kuya Rob Tindahan",
    area: "Brgy. 8", barangay: "Barangay 8", city: "Caloocan",
    address: "45 Mabini Ave., Barangay 8, Caloocan City",
    orderNumber: "KSS-2026-00219", total: 2320, paymentMethod: "cod",
    collectedCOD: 2320, phone: "+63 928 234 5678", items: 12, weight: "22 kg",
    lat: 14.7350, lng: 120.9720,
  },
  {
    stopNumber: 3, status: "next",
    customer: "Lina Reyes", storeName: "Ate Lina Store",
    area: "Brgy. Bagong Barrio", barangay: "Bagong Barrio", city: "Caloocan",
    address: "78 Del Pilar Ext., Bagong Barrio, Caloocan City",
    orderNumber: "KSS-2026-00221", total: 1970, paymentMethod: "cod",
    collectedCOD: 0, phone: "+63 939 345 6789", items: 10, weight: "18 kg",
    lat: 14.7200, lng: 121.0100,
  },
  {
    stopNumber: 4, status: "pending",
    customer: "Fernando Delos Reyes", storeName: "FDR Mini Grocery",
    area: "Brgy. Maypajo", barangay: "Maypajo", city: "Caloocan",
    address: "22 Bonifacio St., Maypajo, Caloocan City",
    orderNumber: "KSS-2026-00223", total: 940, paymentMethod: "maya",
    phone: "+63 910 456 7890", items: 5, weight: "8 kg",
    lat: 14.6800, lng: 120.9750,
  },
  {
    stopNumber: 5, status: "pending",
    customer: "Teresa Villanueva", storeName: "Aling Terry Store",
    area: "Brgy. Camarin", barangay: "Camarin", city: "Caloocan",
    address: "101 Freedom Road, Camarin, Caloocan City",
    orderNumber: "KSS-2026-00225", total: 3200, paymentMethod: "cod",
    collectedCOD: 0, phone: "+63 921 567 8901", items: 18, weight: "31 kg",
    lat: 14.7600, lng: 121.0400,
  },
  {
    stopNumber: 6, status: "pending",
    customer: "Ernesto Flores", storeName: "Mang Ernie Sari-Sari",
    area: "Brgy. Bagong Silang", barangay: "Bagong Silang", city: "Caloocan",
    address: "55 Sampaguita St., Bagong Silang, Caloocan City",
    orderNumber: "KSS-2026-00227", total: 1280, paymentMethod: "gcash",
    phone: "+63 932 678 9012", items: 7, weight: "11 kg",
    lat: 14.7700, lng: 121.0500,
  },
];

interface ApiStop {
  id: string;
  sequence: number;
  orderId: string;
  customerName: string;
  address: string;
  phone: string;
  items: string[] | number;
  codAmount: number;
  paymentMethod: string;
  status: string;
}

function mapApiStop(s: ApiStop, isNext: boolean): Stop {
  const apiStatus = s.status;
  const baseStatus: StopStatus =
    apiStatus === "delivered" ? "done" :
    apiStatus === "failed" ? "failed" : "pending";
  return {
    stopNumber: s.sequence,
    customer: s.customerName,
    storeName: s.customerName,
    area: "",
    barangay: s.address.split(",")[0]?.trim() ?? "",
    city: s.address.split(",").slice(-1)[0]?.trim() ?? "",
    address: s.address,
    orderNumber: s.orderId,
    orderId: s.orderId,
    total: s.codAmount,
    paymentMethod: s.paymentMethod as Stop["paymentMethod"],
    status: isNext ? "next" : baseStatus,
    collectedCOD: baseStatus === "done" && s.paymentMethod === "cod" ? s.codAmount : 0,
    phone: s.phone,
    items: Array.isArray(s.items) ? s.items.length : (typeof s.items === "number" ? s.items : 0),
    weight: "â€”",
  };
}

function payIcon(method: Stop["paymentMethod"]) {
  if (method === "cod") return <Banknote className="h-3 w-3" />;
  if (method === "gcash") return <span className="text-[10px] font-bold">G</span>;
  if (method === "maya") return <span className="text-[10px] font-bold">M</span>;
  return <span className="text-[10px]">â™Ÿ</span>;
}

function payLabel(method: Stop["paymentMethod"]) {
  return { cod: "COD", gcash: "GCash", maya: "Maya", bank_transfer: "Bank", credit: "Terms" }[method];
}

export default function RouteMapPage() {
  const [stops, setStops] = useState<Stop[]>([]);
  const [expanded, setExpanded] = useState<number | null>(3);
  const [showReconcile, setShowReconcile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [routeError, setRouteError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [reportNotes] = useState("");

  useEffect(() => {
    fetch("/api/driver/route")
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(d => {
        if (d.stops?.length) {
          let nextAssigned = false;
          const mapped = (d.stops as ApiStop[]).map(s => {
            const isNext = (s.status !== "delivered" && s.status !== "failed") && !nextAssigned;
            if (isNext) nextAssigned = true;
            return mapApiStop(s, isNext);
          });
          setStops(mapped);
        }
      })
      .catch(() => { setRouteError(true); })
      .finally(() => setLoading(false));
  }, []);

  const totalStops   = stops.length;
  const doneStops    = stops.filter((s) => s.status === "done").length;
  const nextStop     = stops.find((s) => s.status === "next");
  const codStops     = stops.filter((s) => s.paymentMethod === "cod");
  const totalCOD     = codStops.reduce((sum, s) => sum + s.total, 0);
  const collectedCOD = codStops.reduce((sum, s) => sum + (s.collectedCOD ?? 0), 0);
  const pendingCOD   = totalCOD - collectedCOD;
  const progress     = totalStops === 0 ? 0 : Math.round((doneStops / totalStops) * 100);

  function markDone(num: number) {
    const stop = stops.find((s) => s.stopNumber === num);
    setStops((prev) =>
      prev.map((s, i, arr) => {
        if (s.stopNumber === num) {
          const cod = s.paymentMethod === "cod" ? s.total : 0;
          return { ...s, status: "done" as StopStatus, collectedCOD: cod };
        }
        const nextPending = arr.find((x) => x.stopNumber > num && x.status === "pending");
        if (s.stopNumber === nextPending?.stopNumber || s.stopNumber === num + 1 && s.status === "pending") {
          return { ...s, status: "next" as StopStatus };
        }
        return s;
      }).map((s, _, arr) => {
        const anyNext = arr.some((x) => x.status === "next");
        if (!anyNext && s.status === "pending") {
          const firstPending = arr.filter((x) => x.status === "pending").sort((a, b) => a.stopNumber - b.stopNumber)[0];
          if (firstPending && s.stopNumber === firstPending.stopNumber) return { ...s, status: "next" };
        }
        return s;
      })
    );
    setExpanded(null);
    // Persist to API â€” best-effort, local state is source of truth while driver is on route
    if (stop) {
      const orderId = stop.orderId ?? stop.orderNumber;
      fetch(`/api/driver/deliveries/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delivered", orderId }),
      }).catch(() => {});
    }
  }

  function markFailed(stop: Stop) {
    const num = stop.stopNumber;
    setStops((prev) =>
      prev.map((s, _i, arr) => {
        if (s.stopNumber === num) return { ...s, status: "failed" as StopStatus };
        const nextPending = arr.find((x) => x.stopNumber > num && x.status === "pending");
        if (nextPending && s.stopNumber === nextPending.stopNumber) return { ...s, status: "next" as StopStatus };
        return s;
      })
    );
    setExpanded(null);
    // Persist to API â€” best-effort
    const orderId = stop.orderId ?? stop.orderNumber;
    fetch(`/api/driver/deliveries/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "failed_attempt", orderId }),
    }).catch(() => {});
  }

  async function handleSubmitReport() {
    setIsSubmitting(true);
    try {
      await fetch("/api/driver/cod-settlement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveredCount: stops.filter(s => s.status === "done").length,
          failedCount: stops.filter(s => s.status === "failed").length,
          codCollected: stops
            .filter(s => s.status === "done" && s.paymentMethod === "cod")
            .reduce((sum, s) => sum + (s.collectedCOD ?? s.total), 0),
          notes: reportNotes,
        }),
      });
      toastSuccess(`EOD report submitted â€” ${formatPHP(collectedCOD)} COD collected`);
      setReportSubmitted(true);
      setShowReconcile(false);
    } catch {
      toastError("Failed to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const allDone = stops.every((s) => s.status === "done" || s.status === "failed");

  if (routeError) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-lg font-semibold text-foreground">Could not load route</p>
        <p className="text-sm text-muted-foreground text-center">Check your connection and try again.</p>
        <button
          onClick={() => { setRouteError(false); setLoading(true); fetch("/api/driver/route").then(r => r.ok ? r.json() : Promise.reject()).then(d => { if (d.stops?.length) { let na = false; setStops((d.stops as ApiStop[]).map(s => { const isNext = (s.status !== "delivered" && s.status !== "failed") && !na; if (isNext) na = true; return mapApiStop(s, isNext); })); } }).catch(() => setRouteError(true)).finally(() => setLoading(false)); }}
          className="rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Route header card */}
      <div className="bg-brand-700 px-4 pt-5 pb-6 text-white">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-medium opacity-80 uppercase tracking-wider">Today's Route</p>
            <h1 className="font-display text-xl font-bold mt-0.5">Caloocan North</h1>
            <p className="text-sm opacity-80 mt-0.5">
              {doneStops}/{totalStops} stops Â· {formatPHP(stops.filter(s=>s.status==="done").reduce((s,x)=>s+x.total,0))} delivered
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black">{progress}%</p>
            <p className="text-xs opacity-70">complete</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* COD summary */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[
            { label: "Total COD", value: formatPHP(totalCOD) },
            { label: "Collected", value: formatPHP(collectedCOD), green: true },
            { label: "Pending", value: formatPHP(pendingCOD), warn: pendingCOD > 0 },
          ].map(({ label, value, green, warn }) => (
            <div key={label} className="rounded-xl bg-white/10 px-2 py-2">
              <p className={cn("text-sm font-black", green && collectedCOD > 0 && "text-green-200", warn && pendingCOD > 0 && "text-yellow-200")}>{value}</p>
              <p className="text-[10px] opacity-70 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* EOD reconciliation banner */}
      {allDone && (
        <div className="mx-4 mt-4 rounded-2xl border border-success-200 bg-success-50 p-4 flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-success-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-success-700">Route Complete!</p>
            <p className="text-xs text-success-600 mt-0.5">Remit {formatPHP(collectedCOD)} COD to dispatch</p>
          </div>
          <button
            onClick={() => setShowReconcile(true)}
            className="shrink-0 rounded-xl bg-success-700 text-white text-xs font-bold px-3 py-2"
          >
            Submit Report
          </button>
        </div>
      )}

      {/* Stop list */}
      <div className="px-4 mt-4 space-y-2">
        {stops.map((stop) => {
          const isExpanded = expanded === stop.stopNumber;
          const isNext = stop.status === "next";
          const isDone = stop.status === "done";
          const isFailed = stop.status === "failed";

          return (
            <Card
              key={stop.stopNumber}
              className={cn(
                "overflow-hidden transition-all",
                isNext && "border-brand-300 ring-1 ring-brand-300 shadow-md",
                isDone && "opacity-60",
                isFailed && "opacity-50 border-l-4 border-danger-500"
              )}
            >
              {/* Stop header */}
              <button
                onClick={() => setExpanded(isExpanded ? null : stop.stopNumber)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
              >
                {/* Status indicator */}
                <div className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold text-sm",
                  isDone ? "bg-success-100 text-success-600"
                  : isFailed ? "bg-danger-100 text-danger-600"
                  : isNext ? "bg-brand-700 text-white"
                  : "bg-surface-100 dark:bg-surface-800 text-muted-foreground"
                )}>
                  {isDone ? <CheckCircle2 className="h-4 w-4" /> : isFailed ? <XCircle className="h-4 w-4" /> : stop.stopNumber}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-foreground truncate">{stop.storeName}</p>
                    {isNext && <span className="shrink-0 rounded-full bg-brand-700 text-white text-[10px] font-bold px-2 py-0.5">NEXT</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground truncate">{stop.barangay}, {stop.city}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-foreground">{formatPHP(stop.total)}</p>
                  <div className={cn(
                    "flex items-center gap-0.5 justify-end text-[10px] font-semibold mt-0.5",
                    stop.paymentMethod === "cod" ? "text-warning-600" : "text-info-600"
                  )}>
                    {payIcon(stop.paymentMethod)}
                    {payLabel(stop.paymentMethod)}
                  </div>
                </div>

                <div className="shrink-0 ml-1 text-muted-foreground">
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {/* Expanded details */}
              {isExpanded && (
                <div className="border-t border-border bg-surface-50/50 px-4 py-4 space-y-4">
                  {/* Customer info */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Customer</p>
                      <p className="font-semibold mt-0.5">{stop.customer}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Order</p>
                      <p className="font-semibold mt-0.5 font-mono text-xs">{stop.orderNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Items</p>
                      <p className="font-semibold mt-0.5">{stop.items} items Â· {stop.weight}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Payment</p>
                      <p className={cn("font-bold mt-0.5", stop.paymentMethod === "cod" ? "text-warning-600" : "text-info-600")}>
                        {payLabel(stop.paymentMethod)} Â· {formatPHP(stop.total)}
                      </p>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="flex items-start gap-2 rounded-xl bg-background border border-border px-3 py-2.5">
                    <MapPin className="h-4 w-4 text-brand-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-foreground leading-relaxed">{stop.address}</p>
                  </div>

                  {/* COD collection indicator */}
                  {stop.paymentMethod === "cod" && isDone && (
                    <div className="flex items-center gap-2 rounded-xl bg-success-50 border border-success-200 px-3 py-2">
                      <Banknote className="h-4 w-4 text-success-600" />
                      <p className="text-xs font-semibold text-success-700">
                        COD collected: {formatPHP(stop.collectedCOD ?? stop.total)}
                      </p>
                    </div>
                  )}

                  {/* Action buttons */}
                  {!isDone && !isFailed && (
                    <div className="grid grid-cols-3 gap-2">
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(stop.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center gap-1 rounded-xl bg-surface-100 hover:bg-surface-200 px-2 py-2.5 text-xs font-semibold text-surface-900 transition-colors"
                      >
                        <Navigation className="h-4 w-4 text-brand-500" />
                        Navigate
                      </a>
                      <a
                        href={`tel:${stop.phone}`}
                        className="flex flex-col items-center gap-1 rounded-xl bg-surface-100 hover:bg-surface-200 px-2 py-2.5 text-xs font-semibold text-surface-900 transition-colors"
                      >
                        <Phone className="h-4 w-4 text-brand-500" />
                        Call
                      </a>
                      <button
                        onClick={() => { if (window.confirm("Mark this stop as failed delivery?")) { markFailed(stop); } }}
                        className="flex flex-col items-center gap-1 rounded-xl bg-danger-50 hover:bg-danger-100 px-2 py-2.5 text-xs font-semibold text-danger-600 transition-colors"
                      >
                        <XCircle className="h-4 w-4" />
                        Failed
                      </button>
                    </div>
                  )}

                  {!isDone && !isFailed && (
                    <button
                      onClick={() => markDone(stop.stopNumber)}
                      className="w-full rounded-2xl bg-success-700 hover:bg-success-800 text-white text-sm font-bold h-11 flex items-center justify-center gap-2 transition-colors"
                    >
                      <CheckCircle2 className="h-5 w-5" />
                      {stop.paymentMethod === "cod" ? `Mark Delivered Â· Collect ${formatPHP(stop.total)}` : "Mark Delivered"}
                    </button>
                  )}

                  {isDone && (
                    <div className="flex items-center gap-2 text-sm text-success-600 font-medium">
                      <CheckCircle2 className="h-4 w-4" />
                      Delivered successfully
                    </div>
                  )}

                  {isFailed && (
                    <div className="flex items-center gap-2 text-sm text-danger-600 font-medium">
                      <AlertTriangle className="h-4 w-4" />
                      Delivery failed â€” reported to dispatch
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* COD Reconciliation modal */}
      {showReconcile && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
          <div className="w-full bg-card rounded-t-3xl p-6 space-y-4">
            <h2 className="font-display text-lg font-bold text-foreground">End-of-Day COD Report</h2>
            <p className="text-sm text-muted-foreground">Submit your cash collection to dispatch for remittance.</p>

            {codStops.map((s) => (
              <div key={s.stopNumber} className="flex items-center justify-between py-2 border-b border-border text-sm">
                <div>
                  <p className="font-semibold">{s.storeName}</p>
                  <p className="text-xs text-muted-foreground">{s.orderNumber}</p>
                </div>
                <div className={cn("text-right font-bold", s.status === "done" ? "text-success-600" : "text-muted-foreground")}>
                  {s.status === "done" ? formatPHP(s.total) : "â€”"}
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between pt-2">
              <span className="font-bold text-foreground">Total to Remit</span>
              <span className="font-black text-xl text-brand-500">{formatPHP(collectedCOD)}</span>
            </div>

            <button
              onClick={handleSubmitReport}
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-brand-700 hover:bg-brand-800 text-white font-bold h-12 transition-colors disabled:opacity-60"
            >
              {isSubmitting ? "Submittingâ€¦" : "Confirm & Submit Report"}
            </button>
            <button onClick={() => setShowReconcile(false)} className="w-full text-sm text-muted-foreground py-2">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
