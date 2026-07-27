"use client";

import { useState, useEffect, useCallback } from "react";
import { ScanLine, CheckCircle2, Clock, Package, Truck, Loader2, PackageCheck, Store } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatPHP } from "@/lib/utils";

// The warehouse fulfillment queue is driven by REAL orders (not mock pick lists).
// A retailer's order lands here the moment it's placed (status "pending") and the
// warehouse advances it: pick -> pack -> dispatch (assigns a driver so it appears
// in the driver app).

interface OrderItem { productName: string; quantity: number; unitPrice: number; }
interface FulfillmentOrder {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  deliveryAddress?: string;
  createdAt: string;
  retailer?: { name?: string; store_name?: string };
  items: OrderItem[];
}
interface Driver { id: string; name: string; }

type Tab = "incoming" | "picking" | "packed" | "dispatched";

const TABS: { key: Tab; label: string; statuses: string[] }[] = [
  { key: "incoming",   label: "Incoming",   statuses: ["pending", "confirmed"] },
  { key: "picking",    label: "Picking",    statuses: ["picking", "picked"] },
  { key: "packed",     label: "Packed",     statuses: ["packed"] },
  { key: "dispatched", label: "Dispatched", statuses: ["out_for_delivery", "dispatched"] },
];

const FETCH_STATUSES = "pending,confirmed,picking,picked,packed,dispatched,out_for_delivery";

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "default" | "success" | "neutral" | "warning" }> = {
    pending:          { label: "New",         variant: "warning" },
    confirmed:        { label: "Confirmed",   variant: "warning" },
    picking:          { label: "Picking",     variant: "default" },
    picked:           { label: "Picked",      variant: "default" },
    packed:           { label: "Packed",      variant: "success" },
    out_for_delivery: { label: "Out for delivery", variant: "neutral" },
    dispatched:       { label: "Dispatched",  variant: "neutral" },
  };
  const m = map[status] ?? { label: status, variant: "neutral" as const };
  return <Badge variant={m.variant}>{m.label}</Badge>;
}

export default function WarehouseFulfillmentPage() {
  const [orders, setOrders] = useState<FulfillmentOrder[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("incoming");
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders?status=${FETCH_STATUSES}`);
      const data = await res.json();
      setOrders(data.orders ?? []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetch("/api/admin/drivers")
      .then((r) => r.json())
      .then((d) => setDrivers(d.drivers ?? []))
      .catch(() => {});
    const t = setInterval(fetchOrders, 15000); // keep the queue live
    return () => clearInterval(t);
  }, [fetchOrders]);

  async function advance(order: FulfillmentOrder, body: object, okMsg: string) {
    setBusyId(order.id);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast(okMsg);
      await fetchOrders();
    } catch {
      showToast("Could not update — please retry");
    } finally {
      setBusyId(null);
    }
  }

  const startPicking = (o: FulfillmentOrder) => advance(o, { status: "picking" }, `${o.orderNumber} — picking started`);
  const markPacked   = (o: FulfillmentOrder) => advance(o, { status: "packed" }, `${o.orderNumber} — packed`);
  const dispatch     = (o: FulfillmentOrder) => {
    if (!drivers.length) { showToast("No drivers available to assign"); return; }
    advance(o, { action: "assign_driver", driverId: drivers[0].id }, `${o.orderNumber} — dispatched to ${drivers[0].name}`);
  };

  const activeTab = TABS.find((t) => t.key === tab)!;
  const visible = orders.filter((o) => activeTab.statuses.includes(o.status));
  const countFor = (t: Tab) => orders.filter((o) => TABS.find((x) => x.key === t)!.statuses.includes(o.status)).length;

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-5 pb-24">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Fulfillment</h1>
        <p className="text-base text-muted-foreground mt-0.5">
          {countFor("incoming")} incoming · {countFor("picking")} picking · {countFor("packed")} packed
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors shrink-0",
              tab === key ? "bg-brand-700 text-white" : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
            <span className={cn(
              "inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full text-xs font-bold",
              tab === key ? "bg-white/20 text-white" : "bg-background text-foreground"
            )}>
              {countFor(key)}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : visible.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <Package className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-lg font-semibold text-foreground">Nothing here yet</p>
            <p className="text-muted-foreground mt-1 text-sm">
              {tab === "incoming" ? "New orders from stores will appear here automatically." : "No orders in this stage."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {visible.map((o) => {
            const isBusy = busyId === o.id;
            const itemCount = o.items?.reduce((s, i) => s + (i.quantity ?? 0), 0) ?? 0;
            return (
              <Card key={o.id} className="overflow-hidden">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-lg font-bold text-foreground leading-tight truncate">{o.orderNumber}</p>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                        <Store className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{o.retailer?.store_name ?? o.retailer?.name ?? "Store"}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <StatusBadge status={o.status} />
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />{timeAgo(o.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="rounded-xl bg-muted/40 border border-border divide-y divide-border">
                    {(o.items ?? []).slice(0, 4).map((it, i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                        <span className="text-foreground truncate mr-2">{it.productName}</span>
                        <span className="font-semibold text-foreground shrink-0">×{it.quantity}</span>
                      </div>
                    ))}
                    {(o.items?.length ?? 0) > 4 && (
                      <div className="px-3 py-1.5 text-xs text-muted-foreground">+{o.items.length - 4} more</div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{itemCount} unit{itemCount !== 1 ? "s" : ""}</span>
                    <span className="font-bold text-foreground">{formatPHP(o.total)}</span>
                  </div>

                  {/* Action */}
                  {(o.status === "pending" || o.status === "confirmed") && (
                    <Button className="w-full" size="lg" disabled={isBusy} onClick={() => startPicking(o)}>
                      {isBusy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ScanLine className="h-5 w-5" />}
                      Start Picking
                    </Button>
                  )}
                  {(o.status === "picking" || o.status === "picked") && (
                    <Button className="w-full bg-success-700 hover:bg-success-800 text-white" size="lg" disabled={isBusy} onClick={() => markPacked(o)}>
                      {isBusy ? <Loader2 className="h-5 w-5 animate-spin" /> : <PackageCheck className="h-5 w-5" />}
                      Mark Packed
                    </Button>
                  )}
                  {o.status === "packed" && (
                    <Button className="w-full bg-brand-700 hover:bg-brand-800 text-white" size="lg" disabled={isBusy} onClick={() => dispatch(o)}>
                      {isBusy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Truck className="h-5 w-5" />}
                      Dispatch to Driver
                    </Button>
                  )}
                  {(o.status === "out_for_delivery" || o.status === "dispatched") && (
                    <div className="flex items-center justify-center gap-1.5 text-sm text-success-700 dark:text-success-500 font-medium py-1">
                      <CheckCircle2 className="h-4 w-4" /> Dispatched — with driver
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background text-sm px-4 py-2.5 rounded-xl shadow-lg whitespace-nowrap">
          {toast}
        </div>
      )}
    </div>
  );
}
