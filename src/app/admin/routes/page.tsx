"use client";
import { useState } from "react";
import {
  MapPin, Clock, Navigation, Plus, CheckCircle2, AlertTriangle,
  Copy, Play, UserCheck, X, Radio,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RouteStatus = "active" | "planned" | "completed";

interface RouteData {
  id: string;
  name: string;
  driver: string | null;
  status: RouteStatus;
  stops: number;
  completedStops: number;
  distance: string;
  duration: string;
  orderCount: number;
}

const ROUTES_DATA: RouteData[] = [
  { id: "route-1", name: "Caloocan North", driver: "Rodrigo Delos Santos", status: "active", stops: 12, completedStops: 7, distance: "34 km", duration: "4 hrs", orderCount: 12 },
  { id: "route-2", name: "Marikina – Pasig", driver: "Benjamin Cruz", status: "active", stops: 9, completedStops: 4, distance: "28 km", duration: "3.5 hrs", orderCount: 9 },
  { id: "route-3", name: "Quezon City South", driver: null, status: "planned", stops: 15, completedStops: 0, distance: "41 km", duration: "5 hrs", orderCount: 15 },
  { id: "route-4", name: "Caloocan South", driver: "Antonio Lim", status: "completed", stops: 8, completedStops: 8, distance: "22 km", duration: "3 hrs", orderCount: 8 },
];

const AVAILABLE_DRIVERS = [
  { id: "drv-3", name: "Antonio Lim" },
  { id: "drv-4", name: "Mark Villanueva" },
  { id: "drv-5", name: "Jose Fernandez" },
];

const STATUS_CONFIG: Record<RouteStatus, { label: string; badgeClass: string; headerClass: string }> = {
  active: {
    label: "Active",
    badgeClass: "bg-brand-50 text-brand-600 border border-brand-200",
    headerClass: "border-t-brand-400",
  },
  planned: {
    label: "Planned",
    badgeClass: "bg-warning-50 text-warning-600 border border-warning-200",
    headerClass: "border-t-warning-400",
  },
  completed: {
    label: "Completed",
    badgeClass: "bg-success-50 text-success-600 border border-success-200",
    headerClass: "border-t-success-400",
  },
};

// Pseudo-map dot positions for each route — static decorative layout
const ROUTE_MAP_DOTS: Record<string, { x: string; y: string; type: "warehouse" | "delivered" | "pending" | "current" }[]> = {
  "route-1": [
    { x: "10%", y: "70%", type: "warehouse" },
    { x: "28%", y: "50%", type: "delivered" },
    { x: "42%", y: "30%", type: "delivered" },
    { x: "55%", y: "55%", type: "delivered" },
    { x: "64%", y: "38%", type: "delivered" },
    { x: "72%", y: "20%", type: "delivered" },
    { x: "80%", y: "45%", type: "delivered" },
    { x: "66%", y: "62%", type: "current" },
    { x: "78%", y: "72%", type: "pending" },
    { x: "87%", y: "55%", type: "pending" },
    { x: "91%", y: "35%", type: "pending" },
    { x: "88%", y: "20%", type: "pending" },
  ],
  "route-2": [
    { x: "8%", y: "60%", type: "warehouse" },
    { x: "25%", y: "40%", type: "delivered" },
    { x: "38%", y: "65%", type: "delivered" },
    { x: "52%", y: "45%", type: "delivered" },
    { x: "60%", y: "28%", type: "delivered" },
    { x: "68%", y: "55%", type: "current" },
    { x: "76%", y: "40%", type: "pending" },
    { x: "84%", y: "62%", type: "pending" },
    { x: "90%", y: "45%", type: "pending" },
  ],
  "route-3": [
    { x: "10%", y: "65%", type: "warehouse" },
    { x: "22%", y: "48%", type: "pending" },
    { x: "34%", y: "35%", type: "pending" },
    { x: "45%", y: "55%", type: "pending" },
    { x: "55%", y: "38%", type: "pending" },
    { x: "64%", y: "60%", type: "pending" },
    { x: "72%", y: "44%", type: "pending" },
    { x: "80%", y: "28%", type: "pending" },
    { x: "86%", y: "52%", type: "pending" },
    { x: "90%", y: "68%", type: "pending" },
  ],
  "route-4": [
    { x: "10%", y: "65%", type: "warehouse" },
    { x: "24%", y: "48%", type: "delivered" },
    { x: "36%", y: "30%", type: "delivered" },
    { x: "50%", y: "55%", type: "delivered" },
    { x: "62%", y: "38%", type: "delivered" },
    { x: "73%", y: "58%", type: "delivered" },
    { x: "82%", y: "42%", type: "delivered" },
    { x: "90%", y: "60%", type: "delivered" },
  ],
};

function MapPlaceholder({ routeId, status }: { routeId: string; status: RouteStatus }) {
  const dots = ROUTE_MAP_DOTS[routeId] ?? [];
  return (
    <div className="relative h-28 rounded-xl bg-gradient-to-br from-slate-100 to-gray-200 overflow-hidden border border-border/60">
      {/* Grid lines */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id={`grid-${routeId}`} width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#cbd5e1" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#grid-${routeId})`} />
      </svg>

      {/* Route line */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
        {dots.length > 1 && (
          <polyline
            points={dots.map((d) => `${d.x},${d.y}`).join(" ")}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
        )}
      </svg>

      {/* Dots */}
      {dots.map((dot, i) => {
        let bg = "bg-surface-300";
        let size = "h-2.5 w-2.5";
        let zIndex = "z-10";
        if (dot.type === "warehouse") { bg = "bg-brand-500"; size = "h-3.5 w-3.5"; zIndex = "z-20"; }
        if (dot.type === "delivered") { bg = "bg-success-500"; }
        if (dot.type === "current") { bg = "bg-brand-500 ring-2 ring-brand-300 ring-offset-1"; zIndex = "z-20"; }
        return (
          <span
            key={i}
            className={cn("absolute rounded-full -translate-x-1/2 -translate-y-1/2 shrink-0", bg, size, zIndex)}
            style={{ left: dot.x, top: dot.y }}
          />
        );
      })}

      {/* Legend */}
      <div className="absolute bottom-2 right-2 flex items-center gap-2 text-[10px] text-muted-foreground bg-white/70 backdrop-blur-sm rounded-lg px-2 py-1">
        <span className="h-2 w-2 rounded-full bg-brand-500 shrink-0" />
        <span>Warehouse</span>
        {status !== "planned" && (
          <>
            <span className="h-2 w-2 rounded-full bg-success-500 shrink-0" />
            <span>Done</span>
          </>
        )}
        <span className="h-2 w-2 rounded-full bg-surface-300 shrink-0" />
        <span>Pending</span>
      </div>
    </div>
  );
}

export default function AdminRoutesPage() {
  const [routes, setRoutes] = useState(ROUTES_DATA);
  const [toast, setToast] = useState<string | null>(null);
  const [assignModal, setAssignModal] = useState<string | null>(null); // routeId
  const [selectedDriver, setSelectedDriver] = useState<string>("");

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function handleAssign() {
    if (!selectedDriver || !assignModal) return;
    const driverName = AVAILABLE_DRIVERS.find((d) => d.id === selectedDriver)?.name ?? "";
    setRoutes((prev) =>
      prev.map((r) => r.id === assignModal ? { ...r, driver: driverName } : r)
    );
    showToast(`Driver assigned to route`);
    setAssignModal(null);
    setSelectedDriver("");
  }

  const today = new Intl.DateTimeFormat("en-PH", { year: "numeric", month: "long", day: "numeric" }).format(new Date());
  const activeCount = routes.filter((r) => r.status === "active").length;
  const plannedCount = routes.filter((r) => r.status === "planned").length;
  const completedCount = routes.filter((r) => r.status === "completed").length;
  const totalOrders = routes.reduce((s, r) => s + r.orderCount, 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-foreground text-background text-sm px-4 py-2.5 rounded-xl shadow-lg animate-in fade-in slide-in-from-bottom-2">
          {toast}
        </div>
      )}

      {/* Assign Driver Modal */}
      {assignModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setAssignModal(null)}
        >
          <Card
            className="w-full max-w-sm mx-4 p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-base text-foreground">Assign Driver</h3>
              <button
                onClick={() => setAssignModal(null)}
                className="rounded-lg p-1 hover:bg-muted transition-colors text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              Select an available driver for{" "}
              <span className="font-medium text-foreground">
                {routes.find((r) => r.id === assignModal)?.name}
              </span>
            </p>
            <div className="space-y-2">
              {AVAILABLE_DRIVERS.map((driver) => (
                <label
                  key={driver.id}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-colors",
                    selectedDriver === driver.id
                      ? "border-brand-400 bg-brand-50"
                      : "border-border hover:bg-muted"
                  )}
                >
                  <input
                    type="radio"
                    name="driver"
                    value={driver.id}
                    checked={selectedDriver === driver.id}
                    onChange={() => setSelectedDriver(driver.id)}
                    className="accent-brand-500"
                  />
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-success-100 text-success-600 text-xs font-bold">
                    {driver.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </div>
                  <span className="text-sm font-medium text-foreground">{driver.name}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setAssignModal(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="flex-1"
                disabled={!selectedDriver}
                onClick={handleAssign}
              >
                <UserCheck className="h-4 w-4" />
                Assign
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Routes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{today}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => showToast("Route builder coming soon")}>
          <Plus className="h-4 w-4" />
          Create Route
        </Button>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Radio, value: activeCount, label: "Active Routes", color: "bg-brand-50 text-brand-500" },
          { icon: Clock, value: plannedCount, label: "Planned Routes", color: "bg-warning-50 text-warning-500" },
          { icon: CheckCircle2, value: completedCount, label: "Completed Today", color: "bg-success-50 text-success-500" },
          { icon: MapPin, value: totalOrders, label: "Orders in Routes", color: "bg-info-50 text-info-500" },
        ].map(({ icon: Icon, value, label, color }) => (
          <Card key={label} className="p-4 flex items-center gap-3">
            <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", color)}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground tabular-nums leading-tight">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Route Cards */}
      <div className="space-y-4">
        {routes.map((route) => {
          const cfg = STATUS_CONFIG[route.status];
          const pct = route.stops > 0 ? Math.round((route.completedStops / route.stops) * 100) : 0;
          const unassigned = !route.driver;

          return (
            <Card key={route.id} className={cn("border-t-2 overflow-hidden", cfg.headerClass)}>
              <div className="p-5 space-y-4">
                {/* Top row */}
                <div className="flex flex-wrap items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display font-semibold text-base text-foreground">{route.name}</h3>
                      <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", cfg.badgeClass)}>
                        {cfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                      {unassigned ? (
                        <span className="flex items-center gap-1 text-warning-600 font-medium">
                          <AlertTriangle className="h-3 w-3" />
                          Unassigned
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <UserCheck className="h-3 w-3" />
                          {route.driver}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {route.distance}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {route.duration}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Warning banner for unassigned */}
                {unassigned && (
                  <div className="flex items-center gap-2 rounded-xl border border-warning-200 bg-warning-50 px-3 py-2 text-sm text-warning-700">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    No driver assigned — route cannot start
                  </div>
                )}

                {/* Progress */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {route.completedStops} of {route.stops} stops completed
                    </span>
                    <span className="font-semibold tabular-nums text-foreground">{pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-100 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        route.status === "completed" ? "bg-success-500" :
                        route.status === "active" ? "bg-brand-500" : "bg-surface-300"
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Map placeholder */}
                <MapPlaceholder routeId={route.id} status={route.status} />

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {route.status === "active" && (
                    <>
                      <Button
                        size="sm"
                        className="text-xs"
                        onClick={() => showToast("GPS tracking coming soon")}
                      >
                        <Navigation className="h-3.5 w-3.5" />
                        View Live Tracking
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => showToast("Route editor coming soon")}
                      >
                        Edit Route
                      </Button>
                    </>
                  )}
                  {route.status === "planned" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => { setAssignModal(route.id); setSelectedDriver(""); }}
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                        Assign Driver
                      </Button>
                      <Button
                        size="sm"
                        className="text-xs"
                        disabled={unassigned}
                        onClick={() => showToast("Route started")}
                      >
                        <Play className="h-3.5 w-3.5" />
                        Start Route
                      </Button>
                    </>
                  )}
                  {route.status === "completed" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => showToast("Route summary coming soon")}
                      >
                        View Summary
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => showToast("Route duplicated")}
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Duplicate Route
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
