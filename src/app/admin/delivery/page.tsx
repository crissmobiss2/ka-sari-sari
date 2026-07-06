"use client";
import { useState } from "react";
import {
  CheckCircle2, XCircle, RotateCcw, Phone, Truck,
  MapPin, Clock, ChevronDown, AlertCircle, Package,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPHP } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useOrdersStore } from "@/store/orders";

type DispatchStatus = "ready" | "out" | "delivered" | "failed";

// Map shared OrderStatus → local DispatchStatus for column layout
function toDispatch(status: string): DispatchStatus | null {
  if (status === "packed") return "ready";
  if (status === "out_for_delivery") return "out";
  if (status === "delivered") return "delivered";
  if (status === "failed_delivery") return "failed";
  return null;
}

const DRIVERS = [
  { id: "drv-1", name: "Rodrigo Santos" },
  { id: "drv-2", name: "Benjamin Cruz" },
  { id: "drv-3", name: "Antonio Reyes" },
  { id: "drv-5", name: "Jose Dela Cruz" },
];

const COLUMNS: { status: DispatchStatus; label: string; bgClass: string; countClass: string }[] = [
  { status: "ready",     label: "Ready to Dispatch", bgClass: "bg-warning-50",  countClass: "bg-warning-100 text-warning-700" },
  { status: "out",       label: "Out for Delivery",  bgClass: "bg-brand-50",    countClass: "bg-brand-100 text-brand-700" },
  { status: "delivered", label: "Delivered",          bgClass: "bg-success-50",  countClass: "bg-success-100 text-success-700" },
  { status: "failed",    label: "Failed",             bgClass: "bg-danger-50",   countClass: "bg-danger-100 text-danger-700" },
];

function DriverSelect({ value, onChange }: { value: string | null | undefined; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-lg border border-border bg-background px-2.5 py-1.5 pr-7 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1 cursor-pointer"
      >
        <option value="">Select driver…</option>
        {DRIVERS.map((d) => (
          <option key={d.id} value={d.name}>{d.name}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
    </div>
  );
}

function DispatchCard({
  id, orderNumber, amount, address, driverName, eta, failReason, dispatchStatus,
  onDispatch, onDelivered, onFailed, onRetry, onAssignDriver,
}: {
  id: string;
  orderNumber: string;
  amount: number;
  address: string;
  driverName?: string;
  eta?: string;
  failReason?: string;
  dispatchStatus: DispatchStatus;
  onDispatch: (id: string) => void;
  onDelivered: (id: string) => void;
  onFailed: (id: string) => void;
  onRetry: (id: string) => void;
  onAssignDriver: (id: string, driver: string) => void;
}) {
  return (
    <Card className="p-3.5 space-y-2.5 hover:shadow-card-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-xs font-semibold text-foreground leading-tight">{orderNumber}</span>
        <span className="text-xs font-bold text-foreground tabular-nums shrink-0">{formatPHP(amount)}</span>
      </div>

      <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <MapPin className="h-3 w-3 shrink-0 mt-0.5" />
        <span className="line-clamp-1">{address}</span>
      </div>

      {dispatchStatus === "ready" && (
        <DriverSelect value={driverName} onChange={(v) => onAssignDriver(id, v)} />
      )}

      {dispatchStatus === "out" && driverName && (
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Truck className="h-3 w-3" />
            <span>{driverName}</span>
          </div>
          {eta && (
            <div className="flex items-center gap-1 text-brand-600 font-medium">
              <Clock className="h-3 w-3" />
              <span>ETA {eta}</span>
            </div>
          )}
        </div>
      )}

      {dispatchStatus === "delivered" && (
        <div className="flex items-center gap-1.5 text-xs text-success-600">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span className="font-medium">Delivered</span>
        </div>
      )}

      {dispatchStatus === "failed" && failReason && (
        <div className="flex items-center gap-1.5 rounded-lg bg-danger-50 border border-danger-200 px-2 py-1.5 text-xs text-danger-600">
          <AlertCircle className="h-3 w-3 shrink-0" />
          <span>{failReason}</span>
        </div>
      )}

      {dispatchStatus === "ready" && (
        <Button
          size="sm"
          className="w-full text-xs h-8"
          disabled={!driverName}
          onClick={() => onDispatch(id)}
        >
          <Truck className="h-3.5 w-3.5" />
          Dispatch
        </Button>
      )}

      {dispatchStatus === "out" && (
        <div className="grid grid-cols-2 gap-1.5">
          <Button
            size="sm"
            className="text-xs h-8 bg-success-500 hover:bg-success-600 text-white"
            onClick={() => onDelivered(id)}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Delivered
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-8 text-danger-600 border-danger-200 hover:bg-danger-50"
            onClick={() => onFailed(id)}
          >
            <XCircle className="h-3.5 w-3.5" />
            Failed
          </Button>
        </div>
      )}

      {dispatchStatus === "failed" && (
        <div className="grid grid-cols-2 gap-1.5">
          <Button size="sm" className="text-xs h-8" onClick={() => onRetry(id)}>
            <RotateCcw className="h-3.5 w-3.5" />
            Retry
          </Button>
          <Button size="sm" variant="outline" className="text-xs h-8">
            <Phone className="h-3.5 w-3.5" />
            Contact
          </Button>
        </div>
      )}
    </Card>
  );
}

export default function AdminDeliveryPage() {
  const storeOrders = useOrdersStore((s) => s.orders);
  const storeDispatch = useOrdersStore((s) => s.dispatch);
  const markDelivered = useOrdersStore((s) => s.markDelivered);
  const markFailed = useOrdersStore((s) => s.markFailed);
  const advance = useOrdersStore((s) => s.advance);

  // Local driver assignment state (before dispatching)
  const [assigned, setAssigned] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  // Only show orders that belong on the dispatch board
  const dispatchOrders = storeOrders
    .map((o) => ({ ...o, dispatchStatus: toDispatch(o.status) }))
    .filter((o) => o.dispatchStatus !== null) as Array<(typeof storeOrders)[0] & { dispatchStatus: DispatchStatus }>;

  function handleAssignDriver(id: string, driver: string) {
    setAssigned((prev) => ({ ...prev, [id]: driver }));
  }

  function handleDispatch(id: string) {
    const driver = assigned[id] ?? storeOrders.find((o) => o.id === id)?.driverName ?? "";
    if (!driver) return;
    storeDispatch(id, driver, "5:00 PM");
    showToast(`Order dispatched to ${driver}`);
  }

  function handleDelivered(id: string) {
    markDelivered(id);
    showToast("Order marked as delivered");
  }

  function handleFailed(id: string) {
    markFailed(id, "Delivery unsuccessful");
    showToast("Order marked as failed delivery");
  }

  function handleRetry(id: string) {
    // Move back to "packed" so it re-appears in ready column
    advance(id);
    showToast("Order moved back to dispatch queue");
  }

  const counts = {
    delivered: dispatchOrders.filter((o) => o.dispatchStatus === "delivered").length,
    out: dispatchOrders.filter((o) => o.dispatchStatus === "out").length,
    failed: dispatchOrders.filter((o) => o.dispatchStatus === "failed").length,
  };

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-foreground text-background text-sm px-4 py-2.5 rounded-xl shadow-lg animate-in fade-in slide-in-from-bottom-2">
          {toast}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Dispatch Board</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Real-time delivery operations — synced with Fulfillment</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-surface-50 border border-border rounded-xl px-3 py-2 self-start">
          <Clock className="h-3.5 w-3.5" />
          <span>{new Date().toLocaleString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Today's Orders", value: dispatchOrders.length, icon: Package, color: "bg-surface-50 text-surface-600", border: "border-surface-200" },
          { label: "Delivered", value: counts.delivered, icon: CheckCircle2, color: "bg-success-50 text-success-600", border: "border-success-200" },
          { label: "Out for Delivery", value: counts.out, icon: Truck, color: "bg-brand-50 text-brand-600", border: "border-brand-200" },
          { label: "Failed", value: counts.failed, icon: XCircle, color: "bg-danger-50 text-danger-600", border: "border-danger-200" },
        ].map(({ label, value, icon: Icon, color, border }) => (
          <div key={label} className={cn("rounded-2xl border p-4 flex items-center gap-3", color, border)}>
            <Icon className="h-5 w-5 shrink-0" />
            <div>
              <p className="text-xl font-bold tabular-nums leading-tight">{value}</p>
              <p className="text-[11px] opacity-80">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto pb-2 -mx-1 px-1">
        <div className="flex gap-4" style={{ minWidth: "max-content" }}>
          {COLUMNS.map(({ status, label, bgClass, countClass }) => {
            const columnOrders = dispatchOrders.filter((o) => o.dispatchStatus === status);
            return (
              <div
                key={status}
                className={cn("rounded-2xl p-4 space-y-3 flex flex-col", bgClass)}
                style={{ width: "290px" }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">{label}</span>
                  <span className={cn("flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold tabular-nums", countClass)}>
                    {columnOrders.length}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1">
                  {columnOrders.map((order) => (
                    <DispatchCard
                      key={order.id}
                      id={order.id}
                      orderNumber={order.orderNumber}
                      amount={order.total}
                      address={order.deliveryAddress}
                      driverName={order.driverName ?? assigned[order.id]}
                      eta={order.eta}
                      failReason={order.failReason}
                      dispatchStatus={status}
                      onDispatch={handleDispatch}
                      onDelivered={handleDelivered}
                      onFailed={handleFailed}
                      onRetry={handleRetry}
                      onAssignDriver={handleAssignDriver}
                    />
                  ))}
                  {columnOrders.length === 0 && (
                    <div className="rounded-xl border border-dashed border-border/60 p-5 text-center text-xs text-muted-foreground">
                      No orders here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
