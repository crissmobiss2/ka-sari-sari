"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Warehouse,
  Package,
  PackageCheck,
  Truck,
  AlertTriangle,
  ChevronRight,
  Play,
  RotateCcw,
  TrendingDown,
  CheckCircle2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PICK_LISTS, GOODS_RECEIPTS, PURCHASE_ORDERS, SUPPLIERS, CATEGORIES } from "@/lib/mock-data";

// ─── Derived data ─────────────────────────────────────────────────────────────

const today = new Date();
const todayLabel = today.toLocaleDateString("en-PH", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});

const activePicks = PICK_LISTS.filter((pl) => pl.status === "open" || pl.status === "in_progress");
const totalPickUnits = activePicks.reduce(
  (sum, pl) => sum + pl.items.reduce((s, i) => s + i.quantity, 0),
  0
);
const readyToPack = PICK_LISTS.filter((pl) => pl.status === "completed").length;
const incomingToday = PURCHASE_ORDERS.filter((po) => po.status === "confirmed").length;

const STOCK_ALERTS = [
  { name: "Wilkins Pure Distilled Water 500ml", sku: "WLK-500-PUR", stock: 0, threshold: 48, level: "out" as const },
  { name: "Nissin Wafer Sticks Vanilla 50g", sku: "NIS-WAF-VAN", stock: 0, threshold: 24, level: "out" as const },
  { name: "Coca-Cola Regular 330ml", sku: "CC-330-REG", stock: 480, threshold: 48, level: "low" as const },
];

// Aisle mapping per category
const CATEGORY_AISLES: Record<string, { aisle: string; items: number; pct: number }> = {
  Beverages:           { aisle: "A", items: 48, pct: 82 },
  "Instant Noodles":   { aisle: "B", items: 24, pct: 70 },
  "Snacks & Chips":    { aisle: "C", items: 56, pct: 60 },
  "Canned Goods":      { aisle: "D", items: 38, pct: 55 },
  "Condiments & Sauces": { aisle: "E", items: 32, pct: 45 },
  "Personal Care":     { aisle: "F", items: 44, pct: 75 },
  "Coffee & Milo":     { aisle: "G", items: 20, pct: 50 },
  "Laundry & Cleaning": { aisle: "H", items: 28, pct: 65 },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function PickStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    open: "bg-warning-50 text-warning-700 border-warning-300/50",
    in_progress: "bg-purple-50 text-purple-700 border-purple-300/50",
    completed: "bg-success-50 text-success-700 border-success-300/50",
  };
  const label: Record<string, string> = {
    open: "Open",
    in_progress: "In Progress",
    completed: "Completed",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium", map[status])}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label[status]}
    </span>
  );
}

function KpiCard({
  icon: Icon,
  value,
  label,
  sub,
  iconBg,
  accent,
  ring,
}: {
  icon: React.ElementType;
  value: string;
  label: string;
  sub?: string;
  iconBg: string;
  accent?: string;
  ring?: number; // 0-100
}) {
  return (
    <Card className="p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", iconBg)}>
          <Icon className="h-4.5 w-4.5" />
        </div>
        {ring !== undefined && (
          <div
            className="relative h-10 w-10 shrink-0"
            style={{
              background: `conic-gradient(#f47028 ${ring * 3.6}deg, rgb(var(--border)) 0deg)`,
              borderRadius: "50%",
            }}
          >
            <div className="absolute inset-[4px] rounded-full bg-card flex items-center justify-center">
              <span className="text-[9px] font-bold text-foreground">{ring}%</span>
            </div>
          </div>
        )}
      </div>
      <div>
        <p className={cn("font-display text-2xl font-bold tabular-nums", accent ?? "text-foreground")}>{value}</p>
        <p className="text-sm font-medium text-foreground mt-0.5">{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WarehouseDashboardPage() {
  return (
    <div className="p-6 space-y-7 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Warehouse</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{todayLabel}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ButtonLink href="/admin/warehouse/receiving" variant="outline" size="sm">
            <Truck className="h-3.5 w-3.5" />
            Receive Goods
          </ButtonLink>
          <ButtonLink href="/admin/warehouse/picking" variant="default" size="sm">
            <Package className="h-3.5 w-3.5" />
            Start Picking
          </ButtonLink>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={Warehouse}
          value="68%"
          label="Capacity Used"
          sub="of 5,000 unit capacity"
          iconBg="bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-foreground"
          accent="text-brand-700 dark:text-foreground"
          ring={68}
        />
        <KpiCard
          icon={Package}
          value={`${totalPickUnits} units`}
          label="Items to Pick"
          sub={`${activePicks.length} active pick lists`}
          iconBg="bg-purple-50 text-purple-600"
          accent="text-purple-600"
        />
        <KpiCard
          icon={PackageCheck}
          value={`${readyToPack} orders`}
          label="Ready to Pack"
          sub="Awaiting dispatch"
          iconBg="bg-success-50 dark:bg-success-500/10 text-success-700 dark:text-foreground"
          accent="text-success-700 dark:text-foreground"
        />
        <KpiCard
          icon={Truck}
          value={`${incomingToday} delivery`}
          label="Incoming Today"
          sub="Confirmed POs"
          iconBg="bg-info-50 text-info-600"
          accent="text-info-600"
        />
      </div>

      {/* Two-column layout for middle sections */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Active Pick Lists – 2 cols */}
        <div className="xl:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-foreground">Active Pick Lists</h2>
            <ButtonLink href="/admin/warehouse/picking" variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground hover:text-foreground">
              View all <ChevronRight className="h-3.5 w-3.5" />
            </ButtonLink>
          </div>

          <div className="space-y-3">
            {PICK_LISTS.map((pl) => {
              const totalItems = pl.items.length;
              const pickedItems = pl.items.filter((i) => i.status === "picked").length;
              const pct = totalItems > 0 ? Math.round((pickedItems / totalItems) * 100) : 0;
              const isCompleted = pl.status === "completed";

              return (
                <Card key={pl.id} className={cn("p-4", isCompleted && "opacity-60")}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-semibold text-foreground uppercase tracking-wide">
                          {pl.id.toUpperCase()}
                        </span>
                        <PickStatusBadge status={pl.status} />
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">Order {pl.orderNumber}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">
                        {pl.assignedTo ?? <span className="text-warning-700 font-medium">Unassigned</span>}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{totalItems} items</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                      <span>{pickedItems}/{totalItems} picked</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          isCompleted ? "bg-success-400" : pct > 0 ? "bg-brand-500" : "bg-border"
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Item status pills */}
                  <div className="mt-3 flex gap-1.5 flex-wrap">
                    {pl.items.map((item) => (
                      <span
                        key={item.id}
                        className={cn(
                          "rounded-lg border px-2 py-0.5 text-[11px] font-medium",
                          item.status === "picked"   && "bg-success-50 text-success-700 border-success-300/50",
                          item.status === "partial"  && "bg-warning-50 text-warning-700 border-warning-300/50",
                          item.status === "pending"  && "bg-surface-50 text-muted-foreground border-border"
                        )}
                      >
                        {item.productName.split(" ").slice(0, 2).join(" ")}
                      </span>
                    ))}
                  </div>

                  {/* Action */}
                  {!isCompleted && (
                    <div className="mt-3 flex justify-end">
                      <ButtonLink
                        href="/admin/warehouse/picking"
                        size="sm"
                        variant={pl.status === "in_progress" ? "default" : "outline"}
                        className="text-xs h-8"
                      >
                        {pl.status === "in_progress" ? (
                          <>
                            <RotateCcw className="h-3 w-3" />
                            Continue
                          </>
                        ) : (
                          <>
                            <Play className="h-3 w-3" />
                            Start Picking
                          </>
                        )}
                      </ButtonLink>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>

        {/* Right column: Incoming + Alerts */}
        <div className="space-y-5">
          {/* Incoming Shipments */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-foreground">Incoming Shipments</h2>
              <ButtonLink href="/admin/warehouse/receiving" variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground hover:text-foreground">
                View all <ChevronRight className="h-3.5 w-3.5" />
              </ButtonLink>
            </div>

            {GOODS_RECEIPTS.filter((gr) => gr.status === "pending").map((gr) => {
              const po = PURCHASE_ORDERS.find((p) => p.id === gr.purchaseOrderId);
              const supplier = SUPPLIERS.find((s) => s.id === po?.supplierId);
              return (
                <Card key={gr.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{gr.poNumber}</p>
                      <p className="text-xs text-muted-foreground">{supplier?.name ?? gr.supplierName}</p>
                    </div>
                    <span className="text-xs rounded-full bg-warning-50 text-warning-700 border border-warning-300/50 px-2.5 py-0.5 font-medium shrink-0">
                      Tomorrow
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{gr.items.length} products expected</p>
                  <ButtonLink
                    href="/admin/warehouse/receiving"
                    size="sm"
                    variant="outline"
                    className="w-full text-xs h-8"
                  >
                    <Truck className="h-3 w-3" />
                    Receive Goods
                  </ButtonLink>
                </Card>
              );
            })}

            {GOODS_RECEIPTS.filter((gr) => gr.status === "pending").length === 0 && (
              <Card className="p-5 text-center text-sm text-muted-foreground">
                No pending shipments
              </Card>
            )}
          </div>

          {/* Stock Alerts */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-foreground">Stock Alerts</h2>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-danger-50 dark:bg-danger-500/10 text-danger-700 dark:text-foreground text-[10px] font-bold">
                {STOCK_ALERTS.length}
              </span>
            </div>

            <div className="space-y-2">
              {STOCK_ALERTS.map((alert) => (
                <Card key={alert.sku} className="p-3.5 flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                      alert.level === "out" ? "bg-danger-50 dark:bg-danger-500/10 text-danger-700 dark:text-foreground" : "bg-warning-50 dark:bg-warning-500/10 text-warning-700 dark:text-foreground"
                    )}
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{alert.name}</p>
                    <p className={cn("text-[11px] font-semibold", alert.level === "out" ? "text-danger-700" : "text-warning-700")}>
                      {alert.level === "out" ? "Out of Stock" : `Low — ${alert.stock} units`}
                    </p>
                  </div>
                  <ButtonLink
                    href="/admin/purchase-orders"
                    size="sm"
                    variant="ghost"
                    className="text-[11px] h-7 px-2 text-brand-700 hover:bg-brand-50 shrink-0"
                  >
                    Replenish
                  </ButtonLink>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Warehouse Capacity Grid */}
      <div className="space-y-3">
        <h2 className="font-display text-base font-semibold text-foreground">Warehouse Layout</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
          {CATEGORIES.map((cat) => {
            const info = CATEGORY_AISLES[cat.name];
            if (!info) return null;
            return (
              <Card key={cat.id} className="p-3.5 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-foreground text-xs font-bold font-mono">
                    {info.aisle}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium">{info.items} SKUs</span>
                </div>
                <p className="text-[11px] font-medium text-foreground leading-tight" style={{ textWrap: "balance" } as React.CSSProperties}>
                  {cat.name}
                </p>
                {/* Mini bar */}
                <div className="h-1 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      info.pct >= 80 ? "bg-danger-400" : info.pct >= 60 ? "bg-warning-400" : "bg-brand-400"
                    )}
                    style={{ width: `${info.pct}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">{info.pct}% full</p>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
