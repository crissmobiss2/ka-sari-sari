"use client";

import { useState } from "react";
import { ScanLine, ChevronRight, CheckCircle2, Clock, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PICK_LISTS } from "@/lib/mock-data";
import type { PickList } from "@/types";

type FilterTab = "all" | "open" | "in_progress" | "completed";

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
];

function timeAgo(isoString: string) {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getPickedCount(pl: PickList) {
  return pl.items.reduce((sum, item) => sum + item.pickedQty, 0);
}

function getTotalCount(pl: PickList) {
  return pl.items.reduce((sum, item) => sum + item.quantity, 0);
}

function StatusBanner({ status }: { status: PickList["status"] }) {
  if (status === "open") {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-500/10 text-brand-500 text-sm font-semibold w-fit">
        <Package className="h-4 w-4" />
        Open
      </div>
    );
  }
  if (status === "in_progress") {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 text-sm font-semibold w-fit">
        <Clock className="h-4 w-4" />
        In Progress
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-sm font-semibold w-fit">
      <CheckCircle2 className="h-4 w-4 text-success-700" />
      Completed
    </div>
  );
}

function ProgressBar({ picked, total }: { picked: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((picked / total) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">
          {picked} / {total} items picked
        </span>
        <span className="font-semibold text-foreground">{pct}%</span>
      </div>
      <div className="h-3 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            pct === 100
              ? "bg-success-500"
              : pct > 0
              ? "bg-blue-500"
              : "bg-brand-500"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function PickListCard({ pl, onAction }: { pl: PickList; onAction: (id: string) => void }) {
  const picked = getPickedCount(pl);
  const total = getTotalCount(pl);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5 space-y-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-mono text-2xl font-bold text-foreground leading-tight">
              {pl.orderNumber}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {pl.items.length} line item{pl.items.length !== 1 ? "s" : ""}
              {pl.assignedTo && (
                <span className="ml-2 text-foreground/60">· {pl.assignedTo}</span>
              )}
            </p>
          </div>
          <StatusBanner status={pl.status} />
        </div>

        {/* Progress bar */}
        <ProgressBar picked={picked} total={total} />

        {/* Item preview */}
        <div className="space-y-1.5">
          {pl.items.slice(0, 3).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-2 text-sm py-1"
            >
              <div className="min-w-0 flex-1">
                <span className="text-foreground font-medium truncate block">{item.productName}</span>
                <span className="text-xs text-muted-foreground font-mono">{item.bin}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-muted-foreground text-xs">
                  {item.pickedQty}/{item.quantity}
                </span>
                {item.status === "picked" && (
                  <CheckCircle2 className="h-4 w-4 text-success-700" />
                )}
                {item.status === "partial" && (
                  <div className="h-4 w-4 rounded-full border-2 border-blue-500 flex items-center justify-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  </div>
                )}
                {item.status === "pending" && (
                  <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/40" />
                )}
              </div>
            </div>
          ))}
          {pl.items.length > 3 && (
            <p className="text-xs text-muted-foreground pt-1">
              +{pl.items.length - 3} more item{pl.items.length - 3 !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* Action button */}
        {pl.status !== "completed" && (
          <Button
            className={cn(
              "w-full py-4 text-lg",
              pl.status === "in_progress" ? "bg-blue-600 hover:bg-blue-700 text-white" : ""
            )}
            variant={pl.status === "in_progress" ? "default" : "default"}
            size="lg"
            onClick={() => onAction(pl.id)}
          >
            <ScanLine className="h-5 w-5" />
            {pl.status === "open" ? "Start Picking" : "Continue Picking"}
            <ChevronRight className="h-5 w-5 ml-auto" />
          </Button>
        )}

        {pl.status === "completed" && (
          <div className="flex items-center justify-between text-sm text-muted-foreground pt-1 border-t border-border">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-success-700" />
              All items picked
            </span>
            {pl.completedAt && (
              <span>{timeAgo(pl.completedAt)}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function PickingPage() {
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [lists, setLists] = useState<PickList[]>(PICK_LISTS);

  const filtered =
    activeFilter === "all"
      ? lists
      : lists.filter((pl) => pl.status === activeFilter);

  const counts: Record<FilterTab, number> = {
    all: lists.length,
    open: lists.filter((pl) => pl.status === "open").length,
    in_progress: lists.filter((pl) => pl.status === "in_progress").length,
    completed: lists.filter((pl) => pl.status === "completed").length,
  };

  function handleAction(id: string) {
    setLists((prev) =>
      prev.map((pl) => {
        if (pl.id !== id) return pl;
        if (pl.status === "open") return { ...pl, status: "in_progress" as const, assignedTo: "Juan Dela Cruz" };
        return pl;
      })
    );
  }

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-5">
      {/* Page title */}
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Pick Lists</h1>
        <p className="text-base text-muted-foreground mt-0.5">
          {counts.open} open · {counts.in_progress} in progress
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {FILTER_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveFilter(key)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors shrink-0",
              activeFilter === key
                ? "bg-brand-500 text-white"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
            <span
              className={cn(
                "inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold",
                activeFilter === key ? "bg-white/20 text-white" : "bg-background text-foreground"
              )}
            >
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      {/* Pick list cards */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-success-700 mx-auto mb-3" />
              <p className="text-lg font-semibold text-foreground">All done!</p>
              <p className="text-muted-foreground mt-1">No {activeFilter === "all" ? "" : activeFilter.replace("_", " ")} pick lists.</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((pl) => (
            <PickListCard key={pl.id} pl={pl} onAction={handleAction} />
          ))
        )}
      </div>
    </div>
  );
}
