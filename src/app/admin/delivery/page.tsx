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

type DispatchStatus = "ready" | "out" | "delivered" | "failed";

interface DispatchOrder {
  id: string;
  orderNumber: string;
  city: string;
  address: string;
  amount: number;
  driver: string | null;
  eta?: string;
  time?: string;
  failReason?: string;
  status: DispatchStatus;
}

const INITIAL_ORDERS: DispatchOrder[] = [
  { id: "o-145", orderNumber: "KSS-2025-00145", city: "Quezon City", address: "Brgy. Batasan Hills, Quezon City", amount: 1920, driver: null, status: "ready" },
  { id: "o-146", orderNumber: "KSS-2025-00146", city: "Caloocan City", address: "Brgy. Bagong Silang, Caloocan City", amount: 890, driver: null, status: "ready" },
  { id: "o-147", orderNumber: "KSS-2025-00147", city: "Marikina City", address: "Brgy. Concepcion Uno, Marikina City", amount: 2340, driver: null, status: "ready" },
  { id: "o-142", orderNumber: "KSS-2025-00142", city: "Caloocan City", address: "Brgy. 177, Caloocan City", amount: 1450, driver: "Rodrigo", eta: "5:00 PM", status: "out" },
  { id: "o-144", orderNumber: "KSS-2025-00144", city: "Marikina City", address: "Brgy. Parang, Marikina City", amount: 3200, driver: "Benjamin", eta: "4:30 PM", status: "out" },
  { id: "o-141", orderNumber: "KSS-2025-00141", city: "Quezon City", address: "Brgy. Commonwealth, Quezon City", amount: 1120, driver: "Antonio", time: "4:20 PM", status: "delivered" },
  { id: "o-139", orderNumber: "KSS-2025-00139", city: "Caloocan City", address: "Brgy. Maypajo, Caloocan City", amount: 780, driver: "Jose", time: "3:45 PM", status: "delivered" },
  { id: "o-138", orderNumber: "KSS-2025-00138", city: "Marikina City", address: "Brgy. Nangka, Marikina City", amount: 2650, driver: "Rodrigo", time: "2:30 PM", status: "delivered" },
  { id: "o-140", orderNumber: "KSS-2025-00140", city: "Quezon City", address: "Brgy. Payatas, Quezon City", amount: 560, driver: "Benjamin", failReason: "No one home", status: "failed" },
];

const DRIVERS = [
  { id: "drv-1", name: "Rodrigo" },
  { id: "drv-2", name: "Benjamin" },
  { id: "drv-3", name: "Antonio" },
  { id: "drv-5", name: "Jose" },
];

const COLUMNS: { status: DispatchStatus; label: string; bgClass: string; countClass: string }[] = [
  { status: "ready", label: "Ready to Dispatch", bgClass: "bg-warning-50", countClass: "bg-warning-100 text-warning-700" },
  { status: "out", label: "Out for Delivery", bgClass: "bg-brand-50", countClass: "bg-brand-100 text-brand-700" },
  { status: "delivered", label: "Delivered", bgClass: "bg-success-50", countClass: "bg-success-100 text-success-700" },
  { status: "failed", label: "Failed", bgClass: "bg-danger-50", countClass: "bg-danger-100 text-danger-700" },
];

function DriverSelect({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (v: string) => void;
}) {
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

function DispatchCard({ order, onMarkDelivered, onMarkFailed, onAssignDriver, onRetry }: {
  order: DispatchOrder;
  onMarkDelivered: (id: string) => void;
  onMarkFailed: (id: string) => void;
  onAssignDriver: (id: string, driver: string) => void;
  onRetry: (id: string) => void;
}) {
  return (
    <Card className="p-3.5 space-y-2.5 hover:shadow-card-md transition-shadow">
      {/* Order number + amount */}
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-xs font-semibold text-foreground leading-tight">{order.orderNumber}</span>
        <span className="text-xs font-bold text-foreground tabular-nums shrink-0">{formatPHP(order.amount)}</span>
      </div>

      {/* Address */}
      <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <MapPin className="h-3 w-3 shrink-0 mt-0.5" />
        <span className="line-clamp-1">{order.address}</span>
      </div>

      {/* Driver / ETA / time */}
      {order.status === "ready" && (
        <DriverSelect
          value={order.driver}
          onChange={(v) => onAssignDriver(order.id, v)}
        />
      )}

      {order.status === "out" && order.driver && (
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Truck className="h-3 w-3" />
            <span>{order.driver}</span>
          </div>
          {order.eta && (
            <div className="flex items-center gap-1 text-brand-600 font-medium">
              <Clock className="h-3 w-3" />
              <span>ETA {order.eta}</span>
            </div>
          )}
        </div>
      )}

      {order.status === "delivered" && (
        <div className="flex items-center gap-1.5 text-xs text-success-600">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span className="font-medium">Delivered at {order.time}</span>
        </div>
      )}

      {order.status === "failed" && order.failReason && (
        <div className="flex items-center gap-1.5 rounded-lg bg-danger-50 border border-danger-200 px-2 py-1.5 text-xs text-danger-600">
          <AlertCircle className="h-3 w-3 shrink-0" />
          <span>{order.failReason}</span>
        </div>
      )}

      {/* Actions */}
      {order.status === "ready" && (
        <Button
          size="sm"
          className="w-full text-xs h-8"
          disabled={!order.driver}
          onClick={() => onMarkDelivered(order.id)}
        >
          <Truck className="h-3.5 w-3.5" />
          Dispatch
        </Button>
      )}

      {order.status === "out" && (
        <div className="grid grid-cols-2 gap-1.5">
          <Button
            size="sm"
            className="text-xs h-8 bg-success-500 hover:bg-success-600 text-white"
            onClick={() => onMarkDelivered(order.id)}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Delivered
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-8 text-danger-600 border-danger-200 hover:bg-danger-50"
            onClick={() => onMarkFailed(order.id)}
          >
            <XCircle className="h-3.5 w-3.5" />
            Failed
          </Button>
        </div>
      )}

      {order.status === "failed" && (
        <div className="grid grid-cols-2 gap-1.5">
          <Button
            size="sm"
            className="text-xs h-8"
            onClick={() => onRetry(order.id)}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Retry
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-8"
          >
            <Phone className="h-3.5 w-3.5" />
            Contact
          </Button>
        </div>
      )}
    </Card>
  );
}

export default function AdminDeliveryPage() {
  const [orders, setOrders] = useState<DispatchOrder[]>(INITIAL_ORDERS);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function markDelivered(id: string) {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id
          ? { ...o, status: "delivered" as DispatchStatus, time: "Now" }
          : o
      )
    );
    showToast("Order marked as delivered");
  }

  function markFailed(id: string) {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id
          ? { ...o, status: "failed" as DispatchStatus, failReason: "Delivery unsuccessful" }
          : o
      )
    );
    showToast("Order marked as failed");
  }

  function assignDriver(id: string, driver: string) {
    setOrders((prev) =>
      prev.map((o) => o.id === id ? { ...o, driver } : o)
    );
  }

  function retryDelivery(id: string) {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id
          ? { ...o, status: "ready" as DispatchStatus, failReason: undefined }
          : o
      )
    );
    showToast("Order moved back to dispatch queue");
  }

  const deliveredCount = orders.filter((o) => o.status === "delivered").length;
  const outCount = orders.filter((o) => o.status === "out").length;
  const failedCount = orders.filter((o) => o.status === "failed").length;
  const totalToday = orders.length;

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-foreground text-background text-sm px-4 py-2.5 rounded-xl shadow-lg animate-in fade-in slide-in-from-bottom-2">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Dispatch Board</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Real-time delivery operations</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-surface-50 border border-border rounded-xl px-3 py-2 self-start">
          <Clock className="h-3.5 w-3.5" />
          <span>Jul 4, 2025 — 2:14 PM</span>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Today's Orders", value: totalToday, icon: Package, color: "bg-surface-50 text-surface-600", border: "border-surface-200" },
          { label: "Delivered", value: deliveredCount, icon: CheckCircle2, color: "bg-success-50 text-success-600", border: "border-success-200" },
          { label: "Out for Delivery", value: outCount, icon: Truck, color: "bg-brand-50 text-brand-600", border: "border-brand-200" },
          { label: "Failed", value: failedCount, icon: XCircle, color: "bg-danger-50 text-danger-600", border: "border-danger-200" },
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

      {/* Kanban board */}
      <div className="overflow-x-auto pb-2 -mx-1 px-1">
        <div className="flex gap-4" style={{ minWidth: "max-content" }}>
          {COLUMNS.map(({ status, label, bgClass, countClass }) => {
            const columnOrders = orders.filter((o) => o.status === status);
            return (
              <div
                key={status}
                className={cn("rounded-2xl p-4 space-y-3 flex flex-col", bgClass)}
                style={{ width: "290px" }}
              >
                {/* Column header */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">{label}</span>
                  <span className={cn("flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold tabular-nums", countClass)}>
                    {columnOrders.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-2.5 flex-1">
                  {columnOrders.map((order) => (
                    <DispatchCard
                      key={order.id}
                      order={order}
                      onMarkDelivered={markDelivered}
                      onMarkFailed={markFailed}
                      onAssignDriver={assignDriver}
                      onRetry={retryDelivery}
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
