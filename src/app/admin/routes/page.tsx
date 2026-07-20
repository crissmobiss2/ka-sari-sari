"use client";
import { useState, useEffect } from "react";
import {
  MapPin, Clock, Navigation, Plus, CheckCircle2, AlertTriangle,
  Copy, Play, UserCheck, X, Radio, Zap, Loader2, TrendingDown,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RouteStatus = "active" | "planned" | "completed";
type OptimizeStep = 1 | 2 | 3;

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

interface OptimizationResult {
  name: string;
  driver: string;
  before: { distance: string; time: string; stops: number };
  after: { distance: string; time: string; stops: number };
  savings: { distance: string; time: string; fuel: string };
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
    badgeClass: "bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400 border border-brand-200 dark:bg-brand-500/20 dark:text-foreground dark:border-brand-500/30",
    headerClass: "border-t-brand-400",
  },
  planned: {
    label: "Planned",
    badgeClass: "bg-warning-50 dark:bg-warning-500/10 text-warning-700 dark:text-foreground border border-warning-200 dark:bg-warning-500/20 dark:text-foreground dark:border-warning-500/30",
    headerClass: "border-t-warning-400",
  },
  completed: {
    label: "Completed",
    badgeClass: "bg-success-50 dark:bg-success-500/10 text-success-700 dark:text-foreground border border-success-200 dark:bg-success-500/20 dark:text-foreground dark:border-success-500/30",
    headerClass: "border-t-success-400",
  },
};

const OPTIMIZATION_RESULTS: OptimizationResult[] = [
  {
    name: "Caloocan North",
    driver: "Rodrigo Delos Santos",
    before: { distance: "34 km", time: "4 hrs", stops: 12 },
    after:  { distance: "28 km", time: "3.2 hrs", stops: 12 },
    savings: { distance: "6 km", time: "48 min", fuel: "₱85" },
  },
  {
    name: "Marikina – Pasig",
    driver: "Benjamin Cruz",
    before: { distance: "28 km", time: "3.5 hrs", stops: 9 },
    after:  { distance: "22 km", time: "2.8 hrs", stops: 9 },
    savings: { distance: "6 km", time: "42 min", fuel: "₱65" },
  },
  {
    name: "Quezon City South",
    driver: "Unassigned",
    before: { distance: "41 km", time: "5 hrs", stops: 15 },
    after:  { distance: "33 km", time: "4.1 hrs", stops: 15 },
    savings: { distance: "8 km", time: "54 min", fuel: "₱110" },
  },
];

const PROGRESS_LINES = [
  "✓ Loaded 36 delivery stops across 4 active routes",
  "✓ Calculating optimal sequence using nearest-neighbor heuristic",
  "✓ Applying time-window constraints for each stop",
];

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

function OptimizeModal({
  step,
  visibleLines,
  applying,
  onApply,
  onClose,
}: {
  step: OptimizeStep;
  visibleLines: number;
  applying: boolean;
  onApply: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="max-w-2xl w-full rounded-2xl bg-card shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Step 1 — Running */}
        {step === 1 && (
          <div className="p-8 flex flex-col items-center gap-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-500/10">
              <Loader2 className="h-8 w-8 text-brand-700 dark:text-brand-400 animate-spin" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-foreground">Running TSP optimization...</h2>
              <p className="text-sm text-muted-foreground mt-1">Analyzing delivery stops and calculating optimal sequences</p>
            </div>
            <div className="w-full max-w-md space-y-2.5 text-left">
              {PROGRESS_LINES.map((line, i) => (
                <div
                  key={i}
                  className={cn(
                    "text-sm transition-all duration-300",
                    i < visibleLines
                      ? "text-success-700 dark:text-foreground opacity-100 translate-y-0"
                      : "text-muted-foreground opacity-0 translate-y-1"
                  )}
                >
                  {line}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2 — Results */}
        {step === 2 && (
          <div className="p-6 space-y-5">
            {/* Modal header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-500/10">
                  <Zap className="h-4 w-4 text-brand-700 dark:text-brand-400" />
                </div>
                <h2 className="font-display text-lg font-bold text-foreground">Optimization Results</h2>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 hover:bg-muted transition-colors text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Route result cards */}
            <div className="space-y-3">
              {OPTIMIZATION_RESULTS.map((result) => (
                <div key={result.name} className="rounded-xl border border-border bg-card p-4 space-y-3">
                  {/* Route name + driver */}
                  <div>
                    <p className="font-medium text-sm text-foreground">{result.name}</p>
                    <p className="text-xs text-muted-foreground">{result.driver}</p>
                  </div>

                  {/* Before / After columns */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-muted/50 px-3 py-2.5 space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Before</p>
                      <p className="text-sm font-semibold text-foreground">{result.before.distance}</p>
                      <p className="text-xs text-muted-foreground">{result.before.time}</p>
                    </div>
                    <div className="rounded-lg bg-success-50 dark:bg-success-500/10 px-3 py-2.5 space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-success-700 dark:text-foreground">After</p>
                      <p className="text-sm font-semibold text-success-700 dark:text-foreground">{result.after.distance}</p>
                      <p className="text-xs text-success-700 dark:text-foreground">{result.after.time}</p>
                    </div>
                  </div>

                  {/* Savings row */}
                  <div className="flex items-center gap-1.5 text-xs text-success-700 dark:text-foreground font-medium">
                    <TrendingDown className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      -{result.savings.distance} · -{result.savings.time} · Saves {result.savings.fuel} in fuel
                    </span>
                  </div>

                  {/* Efficiency progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Route efficiency</span>
                      <span className="text-success-700 dark:text-foreground font-semibold">65% → 82%</span>
                    </div>
                    <div className="relative h-2 rounded-full bg-surface-100 dark:bg-surface-800 overflow-hidden">
                      {/* Before bar (gray, underneath) */}
                      <div className="absolute inset-y-0 left-0 rounded-full bg-surface-300" style={{ width: "65%" }} />
                      {/* After bar (success, on top, animated) */}
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-success-500 transition-all duration-700"
                        style={{ width: "82%" }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total savings banner */}
            <div className="rounded-xl border border-success-200 bg-success-50 dark:bg-success-500/10 px-4 py-3 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-success-500 shrink-0" />
              <p className="text-sm font-medium text-success-700 dark:text-foreground">
                Total savings: 20 km less · 2h 24min saved · ₱260 fuel saved
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={onClose}
                disabled={applying}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-brand-700 hover:bg-brand-800 text-white"
                onClick={onApply}
                disabled={applying}
              >
                {applying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Apply Optimized Routes
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3 — Success */}
        {step === 3 && (
          <div className="p-8 flex flex-col items-center gap-5 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success-50 dark:bg-success-500/10">
              <CheckCircle2 className="h-8 w-8 text-success-500" />
            </div>
            <div className="space-y-1.5">
              <h2 className="font-display text-xl font-bold text-foreground">Routes optimized and applied!</h2>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Drivers have been notified of updated stop sequences via the app.
              </p>
            </div>
            <Button className="bg-brand-700 hover:bg-brand-800 text-white px-8" onClick={onClose}>
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminRoutesPage() {
  const [routes, setRoutes] = useState(ROUTES_DATA);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/routes")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (Array.isArray(data?.routes) && data.routes.length > 0) setRoutes(data.routes);
      })
      .catch(() => {});
  }, []);
  const [assignModal, setAssignModal] = useState<string | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<string>("");

  // Optimize Routes state
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState<OptimizeStep>(1);
  const [visibleLines, setVisibleLines] = useState(0);
  const [applying, setApplying] = useState(false);

  // Create Route modal
  const [createModal, setCreateModal] = useState(false);
  const [newRoute, setNewRoute] = useState({ name: "", area: "", driver: "" });

  // GPS / Edit / Summary modals — hold the routeId
  const [gpsModal, setGpsModal] = useState<string | null>(null);
  const [editModal, setEditModal] = useState<string | null>(null);
  // Controlled values for the Edit Route modal
  const [editName, setEditName] = useState("");
  const [editDriver, setEditDriver] = useState("");
  const [summaryModal, setSummaryModal] = useState<string | null>(null);

  // Auto-advance step 1 → 2 with staggered progress lines
  useEffect(() => {
    if (!showModal || step !== 1) return;

    setVisibleLines(0);

    const timers: ReturnType<typeof setTimeout>[] = [];

    // Show each line at 400ms intervals
    PROGRESS_LINES.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleLines(i + 1), 400 * (i + 1)));
    });

    // Advance to step 2 after 2000ms
    timers.push(setTimeout(() => setStep(2), 2000));

    return () => timers.forEach(clearTimeout);
  }, [showModal, step]);

  function openOptimizeModal() {
    setStep(1);
    setVisibleLines(0);
    setApplying(false);
    setShowModal(true);
  }

  function closeOptimizeModal() {
    setShowModal(false);
  }

  async function handleApply() {
    setApplying(true);
    try {
      await fetch("/api/admin/routes/optimize", { method: "POST" });
    } catch { /* proceed regardless */ }
    setApplying(false);
    setStep(3);
  }

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
                      ? "border-brand-400 bg-brand-50 dark:bg-brand-500/10"
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
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-success-100 dark:bg-success-500/20 text-success-700 dark:text-foreground text-xs font-bold">
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

      {/* Optimize Routes Modal */}
      {showModal && (
        <OptimizeModal
          step={step}
          visibleLines={visibleLines}
          applying={applying}
          onApply={handleApply}
          onClose={closeOptimizeModal}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Routes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{today}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={openOptimizeModal}
          >
            <Zap className="h-4 w-4" />
            Optimize Routes
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setNewRoute({ name: "", area: "", driver: "" }); setCreateModal(true); }}>
            <Plus className="h-4 w-4" />
            Create Route
          </Button>
        </div>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Radio, value: activeCount, label: "Active Routes", color: "bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-foreground dark:bg-brand-500/10 dark:text-foreground" },
          { icon: Clock, value: plannedCount, label: "Planned Routes", color: "bg-warning-50 dark:bg-warning-500/10 text-warning-700 dark:text-foreground dark:bg-warning-500/10 dark:text-foreground" },
          { icon: CheckCircle2, value: completedCount, label: "Completed Today", color: "bg-success-50 dark:bg-success-500/10 text-success-700 dark:text-foreground dark:bg-success-500/10 dark:text-foreground" },
          { icon: MapPin, value: totalOrders, label: "Orders in Routes", color: "bg-info-50 dark:bg-info-500/10 text-info-600 dark:text-foreground dark:bg-info-500/10 dark:text-foreground" },
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
                        <span className="flex items-center gap-1 text-warning-700 dark:text-foreground font-medium">
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
                  <div className="flex items-center gap-2 rounded-xl border border-warning-200 bg-warning-50 dark:bg-warning-500/10 dark:bg-surface-800 dark:border-warning-600/40 px-3 py-2 text-sm text-warning-700 dark:text-foreground">
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
                  <div className="h-2 rounded-full bg-surface-100 dark:bg-surface-800 overflow-hidden">
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
                        onClick={() => setGpsModal(route.id)}
                      >
                        <Navigation className="h-3.5 w-3.5" />
                        View Live Tracking
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          setEditModal(route.id);
                          setEditName(route.name);
                          setEditDriver(route.driver ?? "");
                        }}
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
                        onClick={() => setSummaryModal(route.id)}
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

      {/* ── Create Route Modal ── */}
      {createModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setCreateModal(false)}>
          <Card className="w-full max-w-sm mx-4 p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-base text-foreground">Create New Route</h3>
              <button onClick={() => setCreateModal(false)} className="rounded-lg p-1 hover:bg-muted text-muted-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Route Name</label>
                <input value={newRoute.name} onChange={e => setNewRoute(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Cubao – Quezon City"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Coverage Area</label>
                <input value={newRoute.area} onChange={e => setNewRoute(p => ({ ...p, area: e.target.value }))}
                  placeholder="e.g. Quezon City North"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Assign Driver (optional)</label>
                <select value={newRoute.driver} onChange={e => setNewRoute(p => ({ ...p, driver: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="">Unassigned</option>
                  {AVAILABLE_DRIVERS.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setCreateModal(false)}>Cancel</Button>
              <Button className="flex-1" disabled={!newRoute.name.trim()} onClick={() => {
                const id = `route-${Date.now()}`;
                setRoutes(prev => [...prev, { id, name: newRoute.name.trim(), driver: newRoute.driver || null, status: "planned", stops: 0, completedStops: 0, distance: "—", duration: "—", orderCount: 0 }]);
                showToast(`Route "${newRoute.name}" created`);
                setCreateModal(false);
              }}>Create Route</Button>
            </div>
          </Card>
        </div>
      )}

      {/* ── GPS Live Tracking Modal ── */}
      {gpsModal && (() => {
        const r = routes.find(x => x.id === gpsModal);
        if (!r) return null;
        const pct = r.stops > 0 ? Math.round((r.completedStops / r.stops) * 100) : 0;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setGpsModal(null)}>
            <Card className="w-full max-w-md mx-4 p-5 space-y-4" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-success-500 animate-pulse" />
                  <h3 className="font-display font-semibold text-base text-foreground">Live Tracking — {r.name}</h3>
                </div>
                <button onClick={() => setGpsModal(null)} className="rounded-lg p-1 hover:bg-muted text-muted-foreground"><X className="h-4 w-4" /></button>
              </div>
              {/* Animated map */}
              <div className="rounded-xl overflow-hidden border border-border h-40 relative bg-gradient-to-br from-teal-50 via-cyan-50 to-emerald-50">
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 160" preserveAspectRatio="xMidYMid slice">
                  <path d="M20 80 Q100 40 200 80 Q300 120 380 80" stroke="#0891b2" strokeWidth="3" fill="none" strokeDasharray="8 4" opacity="0.4" />
                  <path d="M20 100 Q80 70 160 100 Q240 130 320 100 Q360 85 380 100" stroke="#059669" strokeWidth="1.5" fill="none" opacity="0.3" />
                  {[60, 130, 200, 270, 340].map((x, i) => {
                    const y = 80 + Math.sin(i * 1.2) * 25;
                    const done = i < r.completedStops;
                    return <circle key={i} cx={x} cy={y} r="6" fill={done ? "#22c55e" : "#e2e8f0"} stroke={done ? "#16a34a" : "#94a3b8"} strokeWidth="2" />;
                  })}
                  {/* Animated truck */}
                  <g style={{ animation: "x-move 4s ease-in-out infinite alternate" }}>
                    <style>{`@keyframes x-move { from { transform: translateX(-8px); } to { transform: translateX(8px); } }`}</style>
                    <rect x={r.completedStops * 70 + 20} y="68" width="22" height="14" rx="3" fill="#f47028" />
                    <circle cx={r.completedStops * 70 + 25} cy="83" r="4" fill="#1e293b" />
                    <circle cx={r.completedStops * 70 + 37} cy="83" r="4" fill="#1e293b" />
                  </g>
                </svg>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div><p className="text-xl font-bold text-foreground tabular-nums">{r.completedStops}/{r.stops}</p><p className="text-xs text-muted-foreground">Stops</p></div>
                <div><p className="text-xl font-bold text-brand-700 dark:text-brand-400 tabular-nums">{pct}%</p><p className="text-xs text-muted-foreground">Complete</p></div>
                <div><p className="text-xl font-bold text-foreground">{r.distance}</p><p className="text-xs text-muted-foreground">Total dist.</p></div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1"><span>Route progress</span><span>{pct}%</span></div>
                <div className="h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${pct}%` }} /></div>
              </div>
              <p className="text-xs text-muted-foreground text-center">Driver: {r.driver ?? "Unassigned"} · {r.duration} estimated</p>
            </Card>
          </div>
        );
      })()}

      {/* ── Edit Route Modal ── */}
      {editModal && (() => {
        const r = routes.find(x => x.id === editModal);
        if (!r) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setEditModal(null)}>
            <Card className="w-full max-w-sm mx-4 p-5 space-y-4" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold text-base text-foreground">Edit Route</h3>
                <button onClick={() => setEditModal(null)} className="rounded-lg p-1 hover:bg-muted text-muted-foreground"><X className="h-4 w-4" /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Route Name</label>
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Assigned Driver</label>
                  <select
                    value={editDriver}
                    onChange={e => setEditDriver(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">Unassigned</option>
                    {AVAILABLE_DRIVERS.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <Button variant="outline" className="flex-1" onClick={() => setEditModal(null)}>Cancel</Button>
                <Button className="flex-1" onClick={() => {
                  setRoutes(prev => prev.map(x => x.id === r.id
                    ? { ...x, name: editName.trim() || x.name, driver: editDriver || null }
                    : x
                  ));
                  showToast("Route updated");
                  setEditModal(null);
                }}>Save Changes</Button>
              </div>
            </Card>
          </div>
        );
      })()}

      {/* ── Route Summary Modal ── */}
      {summaryModal && (() => {
        const r = routes.find(x => x.id === summaryModal);
        if (!r) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setSummaryModal(null)}>
            <Card className="w-full max-w-sm mx-4 p-5 space-y-4" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold text-base text-foreground">Route Summary</h3>
                <button onClick={() => setSummaryModal(null)} className="rounded-lg p-1 hover:bg-muted text-muted-foreground"><X className="h-4 w-4" /></button>
              </div>
              <div className="rounded-xl bg-success-50 dark:bg-success-500/10 border border-success-200 p-4 flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-success-500 shrink-0" />
                <div><p className="font-semibold text-success-700 dark:text-foreground text-sm">Route Completed</p><p className="text-xs text-success-700 dark:text-foreground">{r.name} · {r.driver}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Total Stops", value: r.stops },
                  { label: "Delivered", value: r.completedStops },
                  { label: "Distance", value: r.distance },
                  { label: "Duration", value: r.duration },
                  { label: "Orders", value: r.orderCount },
                  { label: "Success Rate", value: `${r.stops > 0 ? Math.round((r.completedStops / r.stops) * 100) : 0}%` },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl border border-border bg-card p-3 text-center">
                    <p className="text-lg font-bold text-foreground tabular-nums">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
              <Button className="w-full" variant="outline" onClick={() => { setSummaryModal(null); showToast("Summary exported"); }}>
                Export Summary
              </Button>
            </Card>
          </div>
        );
      })()}
    </div>
  );
}
