"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ScanLine, PackageCheck, ClipboardList, Clock, Truck, Package,
  Store, ChevronRight, Loader2, CheckCircle2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatPHP } from "@/lib/utils";

// Real fulfillment dashboard — every number below reflects live orders from the
// database, not mock data. New retailer orders show up under "Incoming".

interface OrderItem { productName: string; quantity: number; }
interface WHOrder {
  id: string; orderNumber: string; status: string; total: number;
  createdAt: string; retailer?: { name?: string; store_name?: string }; items: OrderItem[];
}

const FETCH_STATUSES = "pending,confirmed,picking,picked,packed,dispatched,out_for_delivery";

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function WarehouseDashboard() {
  const [now, setNow] = useState<Date | null>(null);
  const [userName, setUserName] = useState("there");
  const [orders, setOrders] = useState<WHOrder[]>([]);
  const [loading, setLoading] = useState(true);

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
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      if (d.user?.name) setUserName(d.user.name.split(" ")[0]);
    }).catch(() => {});
    fetchOrders();
    const t = setInterval(fetchOrders, 15000);
    return () => clearInterval(t);
  }, [fetchOrders]);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const hour = now ? now.getHours() : new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const incoming   = orders.filter((o) => o.status === "pending" || o.status === "confirmed");
  const picking    = orders.filter((o) => o.status === "picking" || o.status === "picked");
  const packed     = orders.filter((o) => o.status === "packed");
  const dispatched = orders.filter((o) => o.status === "out_for_delivery" || o.status === "dispatched");

  const KPIS = [
    { label: "Incoming",   value: incoming.length,   icon: ClipboardList, color: "text-warning-700 dark:text-warning-400", bg: "bg-warning-500/10" },
    { label: "Picking",    value: picking.length,    icon: ScanLine,      color: "text-brand-700 dark:text-brand-400",     bg: "bg-brand-500/10" },
    { label: "Packed",     value: packed.length,     icon: PackageCheck,  color: "text-success-700 dark:text-success-400", bg: "bg-success-500/10" },
    { label: "Dispatched", value: dispatched.length, icon: Truck,         color: "text-info-600 dark:text-info-400",       bg: "bg-info-500/10" },
  ];

  return (
    <div className="px-4 py-5 max-w-2xl mx-auto space-y-5 pb-24">
      {/* Greeting */}
      <div>
        <h1 className="font-display text-xl font-bold text-foreground">{greeting}, {userName}!</h1>
        <div className="flex items-center gap-2 mt-0.5 text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span className="text-sm">
            {now ? now.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", hour12: true }) : "--:--"}
          </span>
        </div>
      </div>

      {/* KPI stats — real */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {KPIS.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground leading-snug">{label}</p>
                  <p className={cn("text-3xl font-display font-bold mt-1", color)}>{loading ? "–" : value}</p>
                </div>
                <div className={cn("flex items-center justify-center w-9 h-9 rounded-xl", bg)}>
                  <Icon className={cn("h-4.5 w-4.5", color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-2">
        <Link href="/warehouse/picking">
          <div className="rounded-2xl p-4 flex flex-col gap-2 h-full bg-brand-700 text-white transition-opacity hover:opacity-90">
            <ScanLine className="h-5 w-5" />
            <div>
              <p className="text-sm font-bold leading-tight">Fulfillment Queue</p>
              <p className="text-xs mt-0.5">{incoming.length + picking.length + packed.length} to handle</p>
            </div>
          </div>
        </Link>
        <Link href="/warehouse/receiving">
          <div className="rounded-2xl p-4 flex flex-col gap-2 h-full bg-success-700 text-white transition-opacity hover:opacity-90">
            <PackageCheck className="h-5 w-5" />
            <div>
              <p className="text-sm font-bold leading-tight">Receive Goods</p>
              <p className="text-xs mt-0.5">Inbound stock</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Incoming orders — the thing that was invisible before */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-foreground">Incoming Orders</h2>
          <Link href="/warehouse/picking" className="text-sm text-brand-700 dark:text-brand-400 font-medium flex items-center gap-1">
            View all <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : incoming.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle2 className="h-10 w-10 text-success-700 dark:text-success-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-foreground">All caught up</p>
              <p className="text-muted-foreground text-sm mt-1">New orders from stores appear here instantly.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              {incoming.slice(0, 6).map((o) => {
                const units = o.items?.reduce((s, i) => s + (i.quantity ?? 0), 0) ?? 0;
                return (
                  <Link key={o.id} href="/warehouse/picking" className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-warning-500/10">
                      <Package className="h-4 w-4 text-warning-700 dark:text-warning-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{o.orderNumber}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                        <Store className="h-3 w-3 shrink-0" />
                        {o.retailer?.store_name ?? o.retailer?.name ?? "Store"} · {units} unit{units !== 1 ? "s" : ""} · {timeAgo(o.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-sm font-bold text-foreground">{formatPHP(o.total)}</span>
                      <Badge variant="warning">New</Badge>
                    </div>
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
