"use client";
import { useState } from "react";
import {
  Phone, Eye, Navigation, Star, Truck, User, CheckCircle2,
  Clock, TrendingUp, Plus,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DriverStatus = "on_route" | "active" | "off_duty";

interface Driver {
  id: string;
  name: string;
  phone: string;
  vehiclePlate: string;
  vehicleType: string;
  status: DriverStatus;
  rating: number;
  deliveriesToday: number;
  deliveriesTotal: number;
  deliveriesMonth: number;
  initials: string;
}

const DRIVERS_DATA: Driver[] = [
  { id: "drv-1", name: "Rodrigo Delos Santos", phone: "+63 917 111 2222", vehiclePlate: "AAA 1234", vehicleType: "Van", status: "on_route", rating: 4.9, deliveriesToday: 8, deliveriesTotal: 1247, deliveriesMonth: 61, initials: "RD" },
  { id: "drv-2", name: "Benjamin Cruz", phone: "+63 918 222 3333", vehiclePlate: "BBB 5678", vehicleType: "Van", status: "on_route", rating: 4.7, deliveriesToday: 5, deliveriesTotal: 892, deliveriesMonth: 44, initials: "BC" },
  { id: "drv-3", name: "Antonio Lim", phone: "+63 919 333 4444", vehiclePlate: "CC 9012", vehicleType: "Tricycle", status: "active", rating: 4.8, deliveriesToday: 0, deliveriesTotal: 2105, deliveriesMonth: 73, initials: "AL" },
  { id: "drv-4", name: "Mark Villanueva", phone: "+63 920 444 5555", vehiclePlate: "DDD 3456", vehicleType: "Motorcycle", status: "off_duty", rating: 4.6, deliveriesToday: 0, deliveriesTotal: 456, deliveriesMonth: 28, initials: "MV" },
  { id: "drv-5", name: "Jose Fernandez", phone: "+63 921 555 6666", vehiclePlate: "EEE 7890", vehicleType: "Van", status: "active", rating: 4.95, deliveriesToday: 0, deliveriesTotal: 3420, deliveriesMonth: 89, initials: "JF" },
];

const STATUS_CONFIG: Record<DriverStatus, { label: string; badgeClass: string; avatarClass: string }> = {
  on_route: {
    label: "On Route",
    badgeClass: "bg-brand-50 text-brand-600 border border-brand-200",
    avatarClass: "bg-brand-100 text-brand-600",
  },
  active: {
    label: "Available",
    badgeClass: "bg-success-50 text-success-600 border border-success-200",
    avatarClass: "bg-success-100 text-success-600",
  },
  off_duty: {
    label: "Off Duty",
    badgeClass: "bg-surface-100 text-muted-foreground border border-border",
    avatarClass: "bg-surface-100 text-muted-foreground",
  },
};

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
            <span
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${partial * 100}%` }}
            >
              <Star className="h-3.5 w-3.5 text-warning-400" fill="currentColor" />
            </span>
          )}
        </span>
      ))}
      <span className="ml-1 text-xs font-medium text-foreground tabular-nums">{rating.toFixed(2)}</span>
    </div>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: React.ElementType;
  value: string | number;
  label: string;
  color: string;
}) {
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

export default function AdminDriversPage() {
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  const onRoute = DRIVERS_DATA.filter((d) => d.status === "on_route").length;
  const available = DRIVERS_DATA.filter((d) => d.status === "active").length;
  const offDuty = DRIVERS_DATA.filter((d) => d.status === "off_duty").length;
  const deliveriesToday = DRIVERS_DATA.reduce((sum, d) => sum + d.deliveriesToday, 0);

  const topDriver = [...DRIVERS_DATA].sort((a, b) => b.rating - a.rating)[0];

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
          <p className="text-sm text-muted-foreground mt-0.5">{DRIVERS_DATA.length} drivers registered</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => showToast("Add Driver form coming soon")}>
          <Plus className="h-4 w-4" />
          Add Driver
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Truck} value={onRoute} label="On Route" color="bg-brand-50 text-brand-500" />
        <StatCard icon={CheckCircle2} value={available} label="Available" color="bg-success-50 text-success-500" />
        <StatCard icon={Clock} value={offDuty} label="Off Duty" color="bg-surface-100 text-muted-foreground" />
        <StatCard icon={TrendingUp} value={deliveriesToday} label="Deliveries Today" color="bg-info-50 text-info-500" />
      </div>

      {/* Driver Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {DRIVERS_DATA.map((driver) => {
          const cfg = STATUS_CONFIG[driver.status];
          return (
            <Card key={driver.id} className="p-5 space-y-4">
              {/* Top row */}
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-bold",
                    cfg.avatarClass
                  )}
                >
                  {driver.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-display font-semibold text-sm text-foreground truncate">{driver.name}</p>
                    {driver.rating === topDriver.rating && (
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
                <span className="text-border">·</span>
                <span className="font-mono font-medium text-foreground">{driver.vehiclePlate}</span>
              </div>

              {/* Rating */}
              <StarRating rating={driver.rating} />

              {/* Delivery stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-surface-50 p-2.5 text-center">
                  <p className="text-lg font-bold text-foreground tabular-nums">{driver.deliveriesToday}</p>
                  <p className="text-[11px] text-muted-foreground">Today</p>
                </div>
                <div className="rounded-xl bg-surface-50 p-2.5 text-center">
                  <p className="text-lg font-bold text-foreground tabular-nums">{driver.deliveriesTotal.toLocaleString("en-PH")}</p>
                  <p className="text-[11px] text-muted-foreground">All Time</p>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs flex-col h-auto py-2 gap-1"
                  onClick={() => showToast(`Calling ${driver.name}…`)}
                >
                  <Phone className="h-3.5 w-3.5" />
                  Call
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs flex-col h-auto py-2 gap-1"
                  onClick={() => showToast("Driver profile coming soon")}
                >
                  <Eye className="h-3.5 w-3.5" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs flex-col h-auto py-2 gap-1"
                  onClick={() => showToast("Route assignment coming soon")}
                >
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
              {[...DRIVERS_DATA]
                .sort((a, b) => b.rating - a.rating)
                .map((driver, i) => {
                  const cfg = STATUS_CONFIG[driver.status];
                  const isTop = driver.id === topDriver.id;
                  return (
                    <tr
                      key={driver.id}
                      className={cn(
                        "border-b border-border last:border-0 transition-colors hover:bg-muted/40",
                        isTop && "bg-warning-50/40"
                      )}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={cn(
                              "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                              cfg.avatarClass
                            )}
                          >
                            {driver.initials}
                          </div>
                          <span className="font-medium text-foreground">{driver.name}</span>
                          {isTop && (
                            <Star className="h-3.5 w-3.5 text-warning-400 shrink-0" fill="currentColor" />
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums font-semibold text-foreground">
                        {driver.rating.toFixed(2)}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-foreground">
                        {driver.deliveriesMonth}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-foreground">
                        {driver.deliveriesTotal.toLocaleString("en-PH")}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", cfg.badgeClass)}>
                          {cfg.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
