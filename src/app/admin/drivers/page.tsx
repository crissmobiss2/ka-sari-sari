"use client";
// v2
import { useState } from "react";
import {
  Phone, Eye, Navigation, Star, Truck, User, CheckCircle2,
  Clock, TrendingUp, Plus, X, MapPin, Package, ChevronRight,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type DriverStatus = "on_route" | "active" | "off_duty";
type VehicleType = "Van" | "Motorcycle" | "Tricycle";

interface Driver {
  id: string;
  name: string;
  phone: string;
  vehiclePlate: string;
  vehicleType: VehicleType;
  status: DriverStatus;
  rating: number;
  deliveriesToday: number;
  deliveriesTotal: number;
  deliveriesMonth: number;
  initials: string;
  area?: string;
  joined?: string;
}

interface Route {
  id: string;
  name: string;
  area: string;
  stops: number;
  estimatedHours: number;
  assignedTo?: string;
}

const DRIVERS_DATA: Driver[] = [
  { id: "drv-1", name: "Rodrigo Delos Santos", phone: "+63 917 111 2222", vehiclePlate: "AAA 1234", vehicleType: "Van", status: "on_route", rating: 4.9, deliveriesToday: 8, deliveriesTotal: 1247, deliveriesMonth: 61, initials: "RD", area: "Valenzuela City", joined: "Jan 2023" },
  { id: "drv-2", name: "Benjamin Cruz", phone: "+63 918 222 3333", vehiclePlate: "BBB 5678", vehicleType: "Van", status: "on_route", rating: 4.7, deliveriesToday: 5, deliveriesTotal: 892, deliveriesMonth: 44, initials: "BC", area: "Caloocan City", joined: "Mar 2023" },
  { id: "drv-3", name: "Antonio Lim", phone: "+63 919 333 4444", vehiclePlate: "CC 9012", vehicleType: "Tricycle", status: "active", rating: 4.8, deliveriesToday: 0, deliveriesTotal: 2105, deliveriesMonth: 73, initials: "AL", area: "Malabon City", joined: "Jun 2022" },
  { id: "drv-4", name: "Mark Villanueva", phone: "+63 920 444 5555", vehiclePlate: "DDD 3456", vehicleType: "Motorcycle", status: "off_duty", rating: 4.6, deliveriesToday: 0, deliveriesTotal: 456, deliveriesMonth: 28, initials: "MV", area: "Navotas City", joined: "Sep 2023" },
  { id: "drv-5", name: "Jose Fernandez", phone: "+63 921 555 6666", vehiclePlate: "EEE 7890", vehicleType: "Van", status: "active", rating: 4.95, deliveriesToday: 0, deliveriesTotal: 3420, deliveriesMonth: 89, initials: "JF", area: "Quezon City", joined: "Feb 2022" },
];

const ROUTES: Route[] = [
  { id: "rt-1", name: "Route A â€“ North Valenzuela", area: "Valenzuela City", stops: 12, estimatedHours: 4, assignedTo: "drv-1" },
  { id: "rt-2", name: "Route B â€“ Caloocan Central", area: "Caloocan City", stops: 9, estimatedHours: 3, assignedTo: "drv-2" },
  { id: "rt-3", name: "Route C â€“ Malabon / Navotas", area: "Malabon & Navotas", stops: 7, estimatedHours: 2.5 },
  { id: "rt-4", name: "Route D â€“ QC East", area: "Quezon City", stops: 15, estimatedHours: 5 },
  { id: "rt-5", name: "Route E â€“ Bagumbayan Loop", area: "Valenzuela City", stops: 8, estimatedHours: 3 },
];

const STATUS_CONFIG: Record<DriverStatus, { label: string; badgeClass: string; avatarClass: string }> = {
  on_route: {
    label: "On Route",
    badgeClass: "bg-brand-50 text-brand-600 border border-brand-200",
    avatarClass: "bg-brand-100 dark:bg-brand-700 text-brand-600 dark:text-white",
  },
  active: {
    label: "Available",
    badgeClass: "bg-success-50 text-success-600 border border-success-200",
    avatarClass: "bg-success-100 text-success-600",
  },
  off_duty: {
    label: "Off Duty",
    badgeClass: "bg-surface-100 dark:bg-surface-800 text-muted-foreground border border-border",
    avatarClass: "bg-surface-100 dark:bg-surface-800 text-muted-foreground",
  },
};

const VEHICLE_TYPES: VehicleType[] = ["Van", "Motorcycle", "Tricycle"];

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const partial = rating - full;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className="relative inline-block">
          <Star className="h-3.5 w-3.5 text-border" fill="currentColor" />
          {i <= full && (
            <Star className="absolute inset-0 h-3.5 w-3.5 text-warning-400" fill="currentColor" />
          )}
          {i === full + 1 && partial > 0 && (
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${partial * 100}%` }}>
              <Star className="h-3.5 w-3.5 text-warning-400" fill="currentColor" />
            </span>
          )}
        </span>
      ))}
      <span className="ml-1 text-xs font-medium text-foreground tabular-nums">{rating.toFixed(2)}</span>
    </div>
  );
}

function StatCard({ icon: Icon, value, label, color }: { icon: React.ElementType; value: string | number; label: string; color: string }) {
  return (
    <Card className="p-4 flex items-center gap-3">
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", color)}>
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div>
        <p className="text-xl font-bold text-foreground tabular-nums leading-tight">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </Card>
  );
}

function ModalBackdrop({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative w-full max-w-lg rounded-2xl bg-card border border-border shadow-xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export default function AdminDriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>(DRIVERS_DATA);
  const [routes, setRoutes] = useState<Route[]>(ROUTES);
  const [toast, setToast] = useState<string | null>(null);

  // Add driver modal
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", phone: "", plate: "", vehicleType: "Van" as VehicleType, area: "" });
  const [addLoading, setAddLoading] = useState(false);

  // View driver modal
  const [viewDriver, setViewDriver] = useState<Driver | null>(null);

  // Route assignment modal
  const [routeDriver, setRouteDriver] = useState<Driver | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<string>("");
  const [assignLoading, setAssignLoading] = useState(false);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function handleAddDriver() {
    if (!addForm.name || !addForm.phone || !addForm.plate) return;
    setAddLoading(true);
    try {
      const res = await fetch("/api/admin/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addForm.name,
          phone: addForm.phone,
          vehiclePlate: addForm.plate,
          vehicleType: addForm.vehicleType,
          area: addForm.area,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast(err.error ?? "Failed to add driver");
        return;
      }
      const { driver } = await res.json();
      const initials = addForm.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
      const newDriver: Driver = {
        id: driver.id,
        name: addForm.name,
        phone: addForm.phone,
        vehiclePlate: (driver.vehicle_plate ?? addForm.plate).toUpperCase(),
        vehicleType: addForm.vehicleType,
        status: "active",
        rating: 0,
        deliveriesToday: 0,
        deliveriesTotal: 0,
        deliveriesMonth: 0,
        initials,
        area: addForm.area,
        joined: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      };
      setDrivers((prev) => [...prev, newDriver]);
      setShowAdd(false);
      setAddForm({ name: "", phone: "", plate: "", vehicleType: "Van", area: "" });
      showToast(`${newDriver.name} added as a driver.`);
    } finally {
      setAddLoading(false);
    }
  }

  async function handleAssignRoute() {
    if (!routeDriver || !selectedRoute) return;
    setAssignLoading(true);
    const routeName = routes.find((r) => r.id === selectedRoute)?.name ?? "route";
    try {
      const res = await fetch(`/api/admin/drivers/${routeDriver.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ routeId: selectedRoute }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setRoutes((prev) => prev.map((r) =>
        r.id === selectedRoute ? { ...r, assignedTo: routeDriver.id } : r.assignedTo === routeDriver.id ? { ...r, assignedTo: undefined } : r
      ));
      setRouteDriver(null);
      setSelectedRoute("");
      showToast(`${routeDriver.name} assigned to ${routeName}.`);
    } catch {
      showToast(`Failed to assign ${routeDriver.name} to ${routeName}. Please try again.`);
    } finally {
      setAssignLoading(false);
    }
  }

  const onRoute = drivers.filter((d) => d.status === "on_route").length;
  const available = drivers.filter((d) => d.status === "active").length;
  const offDuty = drivers.filter((d) => d.status === "off_duty").length;
  const deliveriesToday = drivers.reduce((sum, d) => sum + d.deliveriesToday, 0);
  const topDriver = [...drivers].filter(d => d.rating > 0).sort((a, b) => b.rating - a.rating)[0];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-foreground text-background text-sm px-4 py-2.5 rounded-xl shadow-lg animate-in fade-in slide-in-from-bottom-2">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Drivers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{drivers.length} drivers registered</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4" />
          Add Driver
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Truck} value={onRoute} label="On Route" color="bg-brand-50 text-brand-500" />
        <StatCard icon={CheckCircle2} value={available} label="Available" color="bg-success-50 text-success-500" />
        <StatCard icon={Clock} value={offDuty} label="Off Duty" color="bg-surface-100 dark:bg-surface-800 text-muted-foreground" />
        <StatCard icon={TrendingUp} value={deliveriesToday} label="Deliveries Today" color="bg-info-50 text-info-500" />
      </div>

      {/* Driver Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {drivers.map((driver) => {
          const cfg = STATUS_CONFIG[driver.status];
          const assignedRoute = routes.find((r) => r.assignedTo === driver.id);
          return (
            <Card key={driver.id} className="p-5 space-y-4">
              {/* Top row */}
              <div className="flex items-start gap-3">
                <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-bold", cfg.avatarClass)}>
                  {driver.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-display font-semibold text-sm text-foreground truncate">{driver.name}</p>
                    {topDriver && driver.rating === topDriver.rating && driver.rating > 0 && (
                      <span className="text-warning-500 text-xs font-medium flex items-center gap-0.5">
                        <Star className="h-3 w-3" fill="currentColor" /> Top
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <Phone className="h-3 w-3 shrink-0" />
                    <span>{driver.phone}</span>
                  </div>
                </div>
                <span className={cn("shrink-0 text-xs font-medium px-2 py-0.5 rounded-full", cfg.badgeClass)}>
                  {cfg.label}
                </span>
              </div>

              {/* Vehicle */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Truck className="h-3.5 w-3.5 shrink-0" />
                <span>{driver.vehicleType}</span>
                <span className="text-border">Â·</span>
                <span className="font-mono font-medium text-foreground">{driver.vehiclePlate}</span>
                {driver.area && (
                  <>
                    <span className="text-border">Â·</span>
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span>{driver.area}</span>
                  </>
                )}
              </div>

              {/* Rating */}
              {driver.rating > 0 ? (
                <StarRating rating={driver.rating} />
              ) : (
                <p className="text-xs text-muted-foreground italic">No deliveries yet</p>
              )}

              {/* Assigned route */}
              {assignedRoute && (
                <div className="flex items-center gap-1.5 rounded-lg bg-brand-50 border border-brand-100 px-2.5 py-1.5">
                  <Navigation className="h-3 w-3 text-brand-500 shrink-0" />
                  <span className="text-xs text-brand-700 font-medium truncate">{assignedRoute.name}</span>
                </div>
              )}

              {/* Delivery stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-surface-50 p-2.5 text-center">
                  <p className="text-lg font-bold text-surface-900 tabular-nums">{driver.deliveriesToday}</p>
                  <p className="text-[11px] text-muted-foreground">Today</p>
                </div>
                <div className="rounded-xl bg-surface-50 p-2.5 text-center">
                  <p className="text-lg font-bold text-surface-900 tabular-nums">{driver.deliveriesTotal.toLocaleString("en-PH")}</p>
                  <p className="text-[11px] text-muted-foreground">All Time</p>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" size="sm" className="text-xs flex-col h-auto py-2 gap-1" onClick={() => { window.location.href = "tel:" + (driver.phone || "+639171234567"); }}>
                  <Phone className="h-3.5 w-3.5" />
                  Call
                </Button>
                <Button variant="outline" size="sm" className="text-xs flex-col h-auto py-2 gap-1" onClick={() => setViewDriver(driver)}>
                  <Eye className="h-3.5 w-3.5" />
                  View
                </Button>
                <Button variant="outline" size="sm" className="text-xs flex-col h-auto py-2 gap-1" onClick={() => { setRouteDriver(driver); setSelectedRoute(routes.find(r => r.assignedTo === driver.id)?.id ?? ""); }}>
                  <Navigation className="h-3.5 w-3.5" />
                  Route
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Performance Table */}
      <Card>
        <div className="p-5 pb-3 border-b border-border flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-brand-500" />
          <h2 className="font-display font-semibold text-sm text-foreground">Performance Overview</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Driver</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Rating</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">This Month</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody>
              {[...drivers].filter(d => d.rating > 0).sort((a, b) => b.rating - a.rating).map((driver) => {
                const cfg = STATUS_CONFIG[driver.status];
                const isTop = topDriver && driver.id === topDriver.id;
                return (
                  <tr key={driver.id} className={cn("border-b border-border last:border-0 transition-colors hover:bg-muted/40 cursor-pointer", isTop && "bg-warning-50/40")} onClick={() => setViewDriver(driver)}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold", cfg.avatarClass)}>
                          {driver.initials}
                        </div>
                        <span className="font-medium text-foreground">{driver.name}</span>
                        {isTop && <Star className="h-3.5 w-3.5 text-warning-400 shrink-0" fill="currentColor" />}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums font-semibold text-foreground">{driver.rating.toFixed(2)}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-foreground">{driver.deliveriesMonth}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-foreground">{driver.deliveriesTotal.toLocaleString("en-PH")}</td>
                    <td className="px-5 py-3 text-right">
                      <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", cfg.badgeClass)}>{cfg.label}</span>
                    </td>
                  </tr>
                );
              })}
              {drivers.filter(d => d.rating === 0).map((driver) => {
                const cfg = STATUS_CONFIG[driver.status];
                return (
                  <tr key={driver.id} className="border-b border-border last:border-0 transition-colors hover:bg-muted/40 cursor-pointer opacity-60" onClick={() => setViewDriver(driver)}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold", cfg.avatarClass)}>{driver.initials}</div>
                        <span className="font-medium text-foreground">{driver.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right text-muted-foreground text-xs italic">No data</td>
                    <td className="px-5 py-3 text-right tabular-nums text-foreground">{driver.deliveriesMonth}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-foreground">{driver.deliveriesTotal.toLocaleString("en-PH")}</td>
                    <td className="px-5 py-3 text-right">
                      <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", cfg.badgeClass)}>{cfg.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* â”€â”€ Add Driver Modal â”€â”€ */}
      {showAdd && (
        <ModalBackdrop onClose={() => setShowAdd(false)}>
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-foreground">Add New Driver</h2>
              <button onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-3">
              <Input label="Full Name" placeholder="e.g. Juan dela Cruz" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} />
              <Input label="Phone Number" type="tel" placeholder="+63 9XX XXX XXXX" value={addForm.phone} onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })} />
              <Input label="Vehicle Plate" placeholder="e.g. ABC 1234" value={addForm.plate} onChange={(e) => setAddForm({ ...addForm, plate: e.target.value })} />

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Vehicle Type</label>
                <div className="flex gap-2">
                  {VEHICLE_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => setAddForm({ ...addForm, vehicleType: type })}
                      className={cn(
                        "flex-1 rounded-xl border py-2.5 text-sm font-semibold transition-colors",
                        addForm.vehicleType === type ? "border-brand-500 bg-brand-700 text-white" : "border-border bg-card text-foreground hover:border-brand-300"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <Input label="Service Area" placeholder="e.g. Valenzuela City" value={addForm.area} onChange={(e) => setAddForm({ ...addForm, area: e.target.value })} />
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowAdd(false)} className="flex-1 rounded-xl border border-border bg-card py-3 text-sm font-semibold hover:bg-muted transition-colors">Cancel</button>
              <Button
                size="md"
                className="flex-1"
                loading={addLoading}
                disabled={!addForm.name || !addForm.phone || !addForm.plate}
                onClick={handleAddDriver}
              >
                Add Driver
              </Button>
            </div>
          </div>
        </ModalBackdrop>
      )}

      {/* â”€â”€ View Driver Modal â”€â”€ */}
      {viewDriver && (
        <ModalBackdrop onClose={() => setViewDriver(null)}>
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-foreground">Driver Profile</h2>
              <button onClick={() => setViewDriver(null)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>

            {/* Avatar + name */}
            <div className="flex items-center gap-4">
              <div className={cn("flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-bold", STATUS_CONFIG[viewDriver.status].avatarClass)}>
                {viewDriver.initials}
              </div>
              <div>
                <p className="font-display text-lg font-bold text-foreground">{viewDriver.name}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", STATUS_CONFIG[viewDriver.status].badgeClass)}>
                    {STATUS_CONFIG[viewDriver.status].label}
                  </span>
                  {viewDriver.rating > 0 && <StarRating rating={viewDriver.rating} />}
                </div>
              </div>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Phone", value: viewDriver.phone },
                { label: "Vehicle", value: `${viewDriver.vehicleType} Â· ${viewDriver.vehiclePlate}` },
                { label: "Service Area", value: viewDriver.area ?? "â€”" },
                { label: "Member Since", value: viewDriver.joined ?? "â€”" },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl bg-surface-50 px-3 py-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">{label}</p>
                  <p className="text-sm font-semibold text-surface-900 mt-0.5">{value}</p>
                </div>
              ))}
            </div>

            {/* Delivery stats */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Delivery Stats</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Today", value: viewDriver.deliveriesToday },
                  { label: "This Month", value: viewDriver.deliveriesMonth },
                  { label: "All Time", value: viewDriver.deliveriesTotal.toLocaleString("en-PH") },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl bg-surface-50 py-3 text-center">
                    <p className="text-xl font-black text-surface-900 tabular-nums">{value}</p>
                    <p className="text-[10px] text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Assigned route */}
            {(() => {
              const assignedRoute = routes.find((r) => r.assignedTo === viewDriver.id);
              return assignedRoute ? (
                <div className="flex items-center gap-2 rounded-xl bg-brand-50 border border-brand-100 px-4 py-3">
                  <Navigation className="h-4 w-4 text-brand-500 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-brand-700">{assignedRoute.name}</p>
                    <p className="text-xs text-brand-500">{assignedRoute.stops} stops Â· ~{assignedRoute.estimatedHours}h</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-xl bg-surface-100 border border-dashed border-border px-4 py-3">
                  <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                  <p className="text-sm text-muted-foreground">No route assigned</p>
                </div>
              );
            })()}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => { setViewDriver(null); setRouteDriver(viewDriver); setSelectedRoute(routes.find(r => r.assignedTo === viewDriver.id)?.id ?? ""); }}
                className="flex-1 rounded-xl border border-border bg-card py-3 text-sm font-semibold hover:bg-muted transition-colors flex items-center justify-center gap-1.5"
              >
                <Navigation className="h-4 w-4" /> Assign Route
              </button>
              <Button size="md" className="flex-1" onClick={() => { window.location.href = "tel:" + (viewDriver.phone || "+639171234567"); setViewDriver(null); }}>
                <Phone className="h-4 w-4 mr-1.5" /> Call Driver
              </Button>
            </div>
          </div>
        </ModalBackdrop>
      )}

      {/* â”€â”€ Route Assignment Modal â”€â”€ */}
      {routeDriver && (
        <ModalBackdrop onClose={() => setRouteDriver(null)}>
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-foreground">Assign Route</h2>
              <button onClick={() => setRouteDriver(null)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-surface-100 px-4 py-3">
              <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold", STATUS_CONFIG[routeDriver.status].avatarClass)}>
                {routeDriver.initials}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{routeDriver.name}</p>
                <p className="text-xs text-muted-foreground">{routeDriver.vehicleType} Â· {routeDriver.vehiclePlate}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Select Route</p>
              <div className="space-y-2">
                {routes.map((route) => {
                  const assignedDriver = drivers.find((d) => d.id === route.assignedTo && d.id !== routeDriver.id);
                  const isSelected = selectedRoute === route.id;
                  return (
                    <button
                      key={route.id}
                      onClick={() => setSelectedRoute(isSelected ? "" : route.id)}
                      className={cn(
                        "w-full flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                        isSelected ? "border-brand-500 bg-brand-50" : "border-border bg-card hover:border-brand-200"
                      )}
                    >
                      <div className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2", isSelected ? "border-brand-500 bg-brand-500" : "border-border")}>
                        {isSelected && <CheckCircle2 className="h-3 w-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-foreground truncate">{route.name}</p>
                          {assignedDriver && (
                            <span className="text-[10px] text-warning-600 bg-warning-50 border border-warning-200 rounded-full px-2 py-0.5 shrink-0">
                              {assignedDriver.initials}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          <MapPin className="h-3 w-3 inline mr-0.5" />{route.area} Â· {route.stops} stops Â· ~{route.estimatedHours}h
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setRouteDriver(null)} className="flex-1 rounded-xl border border-border bg-card py-3 text-sm font-semibold hover:bg-muted transition-colors">Cancel</button>
              <Button size="md" className="flex-1" loading={assignLoading} disabled={!selectedRoute} onClick={handleAssignRoute}>
                Assign Route
              </Button>
            </div>
          </div>
        </ModalBackdrop>
      )}
    </div>
  );
}
