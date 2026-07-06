"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ScanLine, PackageCheck, CheckCircle2, ClipboardList,
  Clock, TrendingUp, Truck, ArrowRightLeft, AlertTriangle,
  MapPin, ChevronRight, Zap, Package
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PICK_LISTS, GOODS_RECEIPTS } from "@/lib/mock-data";
import { getCitiesByHub } from "@/lib/nexoflow-cities";
import { toastSuccess } from "@/store/toast";
import { useOrdersStore } from "@/store/orders";

type HubKey = "NCR" | "North Luzon" | "South Luzon" | "Visayas" | "Mindanao";

interface HubConfig {
  label: string;
  location: string;
  color: string;
  accent: string;
  cities: number;
  capacity: number;
  used: number;
  pickers: number;
  driversActive: number;
}

const HUBS: Record<HubKey, HubConfig> = {
  "NCR": {
    label: "NCR Hub",
    location: "Valenzuela, Metro Manila",
    color: "bg-brand-500",
    accent: "text-brand-600 bg-brand-50 border-brand-200",
    cities: getCitiesByHub("NCR").length,
    capacity: 1200, used: 847, pickers: 8, driversActive: 12,
  },
  "North Luzon": {
    label: "North Luzon Hub",
    location: "San Fernando, Pampanga",
    color: "bg-purple-500",
    accent: "text-purple-600 bg-purple-50 border-purple-200",
    cities: getCitiesByHub("North Luzon").length,
    capacity: 600, used: 320, pickers: 4, driversActive: 6,
  },
  "South Luzon": {
    label: "South Luzon Hub",
    location: "Calamba, Laguna",
    color: "bg-info-500",
    accent: "text-info-600 bg-info-50 border-info-200",
    cities: getCitiesByHub("South Luzon").length,
    capacity: 500, used: 210, pickers: 3, driversActive: 5,
  },
  "Visayas": {
    label: "Visayas Hub",
    location: "Mandaue, Cebu",
    color: "bg-success-500",
    accent: "text-success-600 bg-success-50 border-success-200",
    cities: getCitiesByHub("Visayas").length,
    capacity: 400, used: 180, pickers: 2, driversActive: 4,
  },
  "Mindanao": {
    label: "Mindanao Hub",
    location: "Davao City",
    color: "bg-warning-500",
    accent: "text-warning-700 bg-warning-50 border-warning-200",
    cities: getCitiesByHub("Mindanao").length,
    capacity: 350, used: 95, pickers: 2, driversActive: 3,
  },
};

const HUB_KEYS: HubKey[] = ["NCR", "North Luzon", "South Luzon", "Visayas", "Mindanao"];

const TRANSFER_REQUESTS = [
  { from: "South Luzon", to: "NCR", product: "Coca-Cola 330ml (2 cases)", qty: 48, urgent: true },
  { from: "NCR", to: "North Luzon", product: "Lucky Me Pancit Canton (1 case)", qty: 24, urgent: false },
];

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function timeAgo(isoString: string) {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function WarehouseDashboard() {
  const [now, setNow] = useState<Date | null>(null);
  const [activeHub, setActiveHub] = useState<HubKey>("NCR");
  const [preppedTransfers, setPreppedTransfers] = useState<number[]>([]);

  const storeOrders = useOrdersStore(s => s.orders);
  const packedCount = storeOrders.filter(o => o.status === "packed").length;

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const hour = now ? now.getHours() : new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const hub = HUBS[activeHub];
  const capacityPct = Math.round((hub.used / hub.capacity) * 100);

  const openPickLists     = PICK_LISTS.filter((pl) => pl.status === "open").length;
  const inProgress        = PICK_LISTS.filter((pl) => pl.status === "in_progress").length;
  const completedToday    = PICK_LISTS.filter((pl) => pl.status === "completed").length;
  const receivingQueue    = GOODS_RECEIPTS.filter((gr) => gr.status === "pending").length;
  const itemsToPick       = PICK_LISTS
    .filter((pl) => pl.status === "open" || pl.status === "in_progress")
    .flatMap((pl) => pl.items)
    .filter((i) => i.status === "pending" || i.status === "partial")
    .reduce((sum, i) => sum + (i.quantity - i.pickedQty), 0);

  const recentActivity = [...PICK_LISTS]
    .sort((a, b) => new Date(b.completedAt ?? b.createdAt).getTime() - new Date(a.completedAt ?? a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="px-4 py-5 max-w-2xl mx-auto space-y-5 pb-24">

      {/* Greeting */}
      <div>
        <h1 className="font-display text-xl font-bold text-foreground">{greeting}, Juan!</h1>
        <div className="flex items-center gap-2 mt-0.5 text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span className="text-sm">{now ? formatTime(now) : '--:--'}</span>
        </div>
      </div>

      {/* Hub selector */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Your Hub</p>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
          {HUB_KEYS.map((key) => {
            const h = HUBS[key];
            const isActive = activeHub === key;
            return (
              <button
                key={key}
                onClick={() => setActiveHub(key)}
                className={cn(
                  "shrink-0 rounded-2xl border px-3 py-2 text-left transition-all",
                  isActive
                    ? cn(h.accent, "ring-1 ring-current/20")
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                )}
              >
                <p className="text-xs font-bold">{h.label}</p>
                <p className="text-[10px] opacity-70 mt-0.5">{h.cities} cities</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active hub card */}
      <Card className={cn("border-2 overflow-hidden", HUBS[activeHub].accent.split(" ").find(c => c.startsWith("border-")))}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-display text-base font-bold text-foreground">{hub.label}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <MapPin className="h-3 w-3" />
                {hub.location}
              </div>
            </div>
            <span className={cn("text-xs font-semibold rounded-full border px-2 py-0.5", hub.accent)}>
              {hub.cities} cities covered
            </span>
          </div>

          {/* Capacity bar */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Storage capacity</span>
              <span className={cn("font-semibold", capacityPct > 80 ? "text-danger-600" : capacityPct > 60 ? "text-warning-600" : "text-success-600")}>
                {hub.used}/{hub.capacity} pallets ({capacityPct}%)
              </span>
            </div>
            <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", capacityPct > 80 ? "bg-danger-500" : capacityPct > 60 ? "bg-warning-400" : "bg-success-500")}
                style={{ width: `${capacityPct}%` }}
              />
            </div>
          </div>

          {/* Hub stats */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Active Pickers", value: hub.pickers, icon: "👷" },
              { label: "Drivers Out", value: hub.driversActive, icon: "🚛" },
            ].map(({ label, value, icon }) => (
              <div key={label} className="rounded-xl bg-white/50 border border-border/50 p-2.5 flex items-center gap-2">
                <span className="text-xl">{icon}</span>
                <div>
                  <p className="text-lg font-black text-foreground">{value}</p>
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* KPI stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: "Open Pick Lists", value: openPickLists, icon: ClipboardList, color: "text-brand-500", bg: "bg-brand-500/10" },
          { label: "Items to Pick",   value: itemsToPick,   icon: ScanLine,       color: "text-blue-500",  bg: "bg-blue-500/10" },
          { label: "Receiving Queue", value: receivingQueue, icon: PackageCheck,  color: "text-warning-600",bg: "bg-warning-50" },
          { label: "Completed Today", value: completedToday, icon: CheckCircle2,  color: "text-success-700",bg: "bg-success-50" },
          { label: "Packed & Ready",  value: packedCount,    icon: PackageCheck,  color: "text-amber-600",  bg: "bg-amber-50" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground leading-snug">{label}</p>
                  <p className={cn("text-3xl font-display font-bold mt-1", color)}>{value}</p>
                </div>
                <div className={cn("flex items-center justify-center w-9 h-9 rounded-xl", bg)}>
                  <Icon className={cn("h-4.5 w-4.5", color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-xs text-muted-foreground -mt-1">
        Live data for {hub.label} · {hub.cities} cities covered
      </p>

      {/* Quick Actions */}
      <div className="space-y-2">
        <h2 className="font-display text-base font-semibold text-foreground">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-2">
          {[
            { href: "/warehouse/picking",   label: "Start Picking",    icon: ScanLine,   color: "bg-brand-500 text-white",          sub: `${openPickLists + inProgress} lists` },
            { href: "/warehouse/receiving", label: "Receive Goods",    icon: PackageCheck,color: "bg-success-500 text-white",       sub: `${receivingQueue} pending` },
            { href: "/warehouse/scan",      label: "Scan / Lookup",   icon: Zap,         color: "bg-surface-800 text-white",        sub: "Quick scan" },
            { href: "/warehouse/inventory", label: "Check Inventory",  icon: Package,     color: "bg-surface-100 text-foreground",   sub: "Stock levels" },
          ].map(({ href, label, icon: Icon, color, sub }) => (
            <Link key={href} href={href}>
              <div className={cn("rounded-2xl p-4 flex flex-col gap-2 h-full transition-opacity hover:opacity-90", color)}>
                <Icon className="h-5 w-5" />
                <div>
                  <p className="text-sm font-bold leading-tight">{label}</p>
                  <p className="text-xs opacity-70 mt-0.5">{sub}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Inter-hub transfers */}
      {TRANSFER_REQUESTS.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-display text-base font-semibold text-foreground flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4 text-brand-500" />
            Transfer Requests
          </h2>
          {TRANSFER_REQUESTS.map((t, i) => {
            const isPrepped = preppedTransfers.includes(i);
            return (
              <Card key={i} className={cn(t.urgent && "border-warning-200")}>
                <CardContent className="p-3.5 flex items-center gap-3">
                  <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-xl", t.urgent ? "bg-warning-100" : "bg-surface-100")}>
                    <Truck className={cn("h-4 w-4", t.urgent ? "text-warning-600" : "text-muted-foreground")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {t.urgent && <AlertTriangle className="h-3 w-3 text-warning-500" />}
                      <p className="text-xs font-semibold text-foreground truncate">{t.product}</p>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{t.from} → {t.to} · {t.qty} units</p>
                  </div>
                  <button
                    disabled={isPrepped}
                    onClick={() => {
                      setPreppedTransfers(prev => [...prev, i]);
                      toastSuccess("Transfer prep started — route to dispatch area");
                    }}
                    className={cn(
                      "shrink-0 rounded-lg text-xs font-semibold px-2.5 py-1.5 transition-colors",
                      isPrepped
                        ? "bg-success-100 text-success-700 cursor-default"
                        : "bg-brand-500 text-white"
                    )}
                  >
                    {isPrepped ? "Prepped ✓" : "Prep"}
                  </button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Recent activity */}
      <div className="space-y-2">
        <h2 className="font-display text-base font-semibold text-foreground">Recent Activity</h2>
        <Card>
          <CardContent className="p-0 divide-y divide-border">
            {recentActivity.map((pl) => (
              <div key={pl.id} className="flex items-center gap-3 px-4 py-3">
                <div className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                  pl.status === "completed" ? "bg-success-50" : pl.status === "in_progress" ? "bg-brand-50" : "bg-surface-100"
                )}>
                  {pl.status === "completed"
                    ? <CheckCircle2 className="h-4 w-4 text-success-600" />
                    : pl.status === "in_progress"
                    ? <ScanLine className="h-4 w-4 text-brand-500" />
                    : <ClipboardList className="h-4 w-4 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{pl.orderNumber}</p>
                  <p className="text-xs text-muted-foreground">{timeAgo(pl.completedAt ?? pl.createdAt)}</p>
                </div>
                <Badge
                  variant={pl.status === "completed" ? "success" : pl.status === "in_progress" ? "default" : "neutral"}
                >
                  {pl.status === "completed" ? "Done" : pl.status === "in_progress" ? "Picking" : "Open"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <Link href="/warehouse/picking" className="flex items-center justify-center gap-1 text-sm text-brand-500 font-medium py-1">
          View all pick lists <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
