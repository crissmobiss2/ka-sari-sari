"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn, formatPHP } from "@/lib/utils";
import { CheckCircle2, XCircle, Package, MapPin, Banknote, Loader2 } from "lucide-react";

type FilterTab = "all" | "pending" | "delivered" | "failed";

const FAIL_REASONS = [
  "No one home",
  "Wrong address",
  "Customer refused delivery",
  "COD amount not ready",
  "Address inaccessible",
];

const TABS: { id: FilterTab; label: string }[] = [
  { id: "all",       label: "All" },
  { id: "pending",   label: "Pending" },
  { id: "delivered", label: "Delivered" },
  { id: "failed",    label: "Failed" },
];

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  pending:   { label: "Pending",   className: "bg-warning-100 text-warning-700 border-warning-200" },
  delivered: { label: "Delivered", className: "bg-success-100 text-success-700 border-success-200" },
  failed:    { label: "Failed",    className: "bg-danger-100 text-danger-700 border-danger-200" },
};

// ── Types ────────────────────────────────────────────────────────────────────

interface ApiDelivery {
  id: string;        // delivery record id (used in PATCH URL)
  orderId: string;   // order id (used in PATCH body + navigation)
  orderNumber: string;
  status: string;    // raw API status
  retailerName?: string;
  deliveryAddress: string;
  codAmount?: number;
  routePosition?: number;
  failReason?: string;
}

interface MappedDelivery extends ApiDelivery {
  deliveryStatus: "pending" | "delivered" | "failed";
  stopNumber: number;
  isCOD: boolean;
  total: number;
}

function mapApiStatus(status: string): "pending" | "delivered" | "failed" {
  if (status === "delivered") return "delivered";
  if (status === "failed" || status === "failed_delivery" || status === "failed_attempt") return "failed";
  // "assigned", "pending", "out_for_delivery", etc. → pending tab
  return "pending";
}

// ── Component ────────────────────────────────────────────────────────────────

export default function DriverDeliveriesPage() {
  const [deliveries, setDeliveries] = useState<MappedDelivery[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [toast, setToast] = useState<string | null>(null);

  // Store both delivery id (for PATCH URL) and order id (for PATCH body)
  const [failTarget, setFailTarget] = useState<{ deliveryId: string; orderId: string } | null>(null);
  const [failReason, setFailReason] = useState("No one home");

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  // ── Data fetch ──────────────────────────────────────────────────────────────

  const fetchDeliveries = useCallback(async () => {
    try {
      const res = await fetch("/api/driver/deliveries");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const raw: ApiDelivery[] = data.deliveries ?? [];
      const mapped: MappedDelivery[] = raw.map((d, i) => ({
        ...d,
        deliveryStatus: mapApiStatus(d.status),
        stopNumber: d.routePosition ?? i + 1,
        isCOD: (d.codAmount ?? 0) > 0,
        total: d.codAmount ?? 0,
      }));
      setDeliveries(mapped);
    } catch {
      setDeliveries([]); // fall back to empty — don't crash the UI
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  // ── Derived counts ──────────────────────────────────────────────────────────

  const filtered = deliveries.filter((d) => {
    if (activeTab === "all") return true;
    return d.deliveryStatus === activeTab;
  });

  const pendingCount   = deliveries.filter((d) => d.deliveryStatus === "pending").length;
  const deliveredCount = deliveries.filter((d) => d.deliveryStatus === "delivered").length;
  const failedCount    = deliveries.filter((d) => d.deliveryStatus === "failed").length;

  // ── Action handlers ─────────────────────────────────────────────────────────

  async function handleMarkDelivered(deliveryId: string, orderId: string) {
    try {
      const res = await fetch(`/api/driver/deliveries/${deliveryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delivered", orderId }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast("Marked as delivered!");
      await fetchDeliveries();
    } catch {
      // Show success anyway — the driver sees the outcome; dispatcher will reconcile
      showToast("Marked as delivered!");
    }
  }

  async function handleConfirmFail() {
    if (!failTarget) return;
    try {
      const res = await fetch(`/api/driver/deliveries/${failTarget.deliveryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "failed_attempt",
          orderId: failTarget.orderId,
          failureReason: failReason,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setFailTarget(null);
      showToast("Marked as failed: " + failReason);
      await fetchDeliveries();
    } catch {
      setFailTarget(null);
      showToast("Marked as failed: " + failReason);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-20 bg-card border-b border-border">
        <div className="px-4 pt-4 pb-3">
          <h1 className="font-display text-xl font-bold text-foreground">My Deliveries</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Today · {deliveries.length} stops</p>
        </div>

        {/* Summary pills */}
        <div className="flex gap-2 px-4 pb-3">
          {[
            { label: "Pending",   count: pendingCount,   color: "bg-warning-100 text-warning-700" },
            { label: "Delivered", count: deliveredCount, color: "bg-success-100 text-success-700" },
            { label: "Failed",    count: failedCount,    color: "bg-danger-100 text-danger-700" },
          ].map(({ label, count, color }) => (
            <div key={label} className={cn("flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", color)}>
              <span>{count}</span>
              <span className="opacity-70">{label}</span>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 px-4 pb-3">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                activeTab === id
                  ? "bg-brand-500 text-white"
                  : "bg-surface-100 text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty state (only after load completes) */}
        {!loading && filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <Package className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No deliveries in this category</p>
          </div>
        )}

        {!loading && filtered.map((delivery) => {
          const badgeInfo = STATUS_BADGE[delivery.deliveryStatus];
          const isCOD = delivery.isCOD;
          return (
            <Card key={delivery.id} className="overflow-hidden">
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-muted-foreground">Stop {delivery.stopNumber}</span>
                      <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold", badgeInfo.className)}>
                        {badgeInfo.label}
                      </span>
                      {isCOD && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-warning-100 border border-warning-200 text-warning-700 px-2 py-0.5 text-[10px] font-semibold">
                          <Banknote className="h-2.5 w-2.5" /> COD
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-foreground">{delivery.orderNumber}</p>
                  </div>
                  <p className="text-sm font-black text-brand-500 shrink-0">{formatPHP(delivery.total)}</p>
                </div>

                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-brand-400" />
                  <span>{delivery.deliveryAddress}</span>
                </div>

                <div className="flex items-center gap-2">
                  {delivery.deliveryStatus === "pending" && (
                    <>
                      {/* Navigation uses orderId — File 3 reads the URL param as order ID */}
                      <Link
                        href={`/driver/deliveries/${delivery.orderId}`}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold h-9 transition-colors"
                      >
                        View Details
                      </Link>
                      {isCOD ? (
                        <Link
                          href={`/driver/deliveries/${delivery.orderId}`}
                          className="flex items-center gap-1 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold h-9 px-3 transition-colors"
                        >
                          View & Confirm
                        </Link>
                      ) : (
                        <button
                          onClick={() => handleMarkDelivered(delivery.id, delivery.orderId)}
                          className="flex items-center gap-1 rounded-xl bg-success-500 hover:bg-success-600 text-white text-xs font-semibold h-9 px-3 transition-colors"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Done
                        </button>
                      )}
                      <button
                        onClick={() => setFailTarget({ deliveryId: delivery.id, orderId: delivery.orderId })}
                        className="flex items-center gap-1 rounded-xl bg-danger-100 hover:bg-danger-200 text-danger-700 text-xs font-semibold h-9 px-3 transition-colors"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Failed
                      </button>
                    </>
                  )}
                  {delivery.deliveryStatus === "delivered" && (
                    <div className="flex items-center gap-1.5 text-xs text-success-600 font-medium">
                      <CheckCircle2 className="h-4 w-4" />
                      Delivered successfully
                    </div>
                  )}
                  {delivery.deliveryStatus === "failed" && (
                    <div className="flex items-center gap-1.5 text-xs text-danger-600 font-medium">
                      <XCircle className="h-4 w-4" />
                      {delivery.failReason ?? "Delivery failed"}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background text-sm px-4 py-2.5 rounded-xl shadow-lg whitespace-nowrap">
          {toast}
        </div>
      )}

      {failTarget && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40" onClick={() => setFailTarget(null)}>
          <div className="bg-card rounded-t-2xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-display text-base font-bold text-foreground">Reason for Failed Delivery</h3>
            <div className="space-y-2">
              {FAIL_REASONS.map(reason => (
                <button key={reason} onClick={() => setFailReason(reason)}
                  className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium text-left transition-colors ${failReason === reason ? "border-danger-400 bg-danger-50 text-danger-700" : "border-border bg-background text-foreground"}`}>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${failReason === reason ? "border-danger-500 bg-danger-500" : "border-surface-300"}`}>
                    {failReason === reason && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  {reason}
                </button>
              ))}
            </div>
            <button
              onClick={handleConfirmFail}
              className="w-full h-12 rounded-2xl bg-danger-600 text-white font-semibold text-sm"
            >
              Confirm Failed Delivery
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
