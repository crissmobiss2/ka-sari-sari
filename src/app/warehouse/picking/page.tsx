"use client";

import { useState, useEffect, useRef } from "react";
import { ScanLine, ChevronRight, CheckCircle2, Clock, Package, ChevronDown, Camera } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PICK_LISTS, PRODUCTS } from "@/lib/mock-data";
import { BarcodeScanner } from "@/components/pos/barcode-scanner";
import type { PickList } from "@/types";

type FilterTab = "all" | "open" | "in_progress" | "completed";

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
];

const STATUS_ORDER: Record<PickList["status"], number> = {
  open: 0,
  in_progress: 1,
  completed: 2,
};

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

function PickListCard({
  pl,
  isExpanded,
  checkedItems,
  onAction,
  onToggleItem,
  onComplete,
  onOpenScanner,
  scanFeedback,
}: {
  pl: PickList;
  isExpanded: boolean;
  checkedItems: Record<string, boolean>;
  onAction: (id: string) => void;
  onToggleItem: (itemId: string, checked: boolean) => void;
  onComplete: (id: string) => void;
  onOpenScanner?: () => void;
  scanFeedback?: { ok: boolean; text: string } | null;
}) {
  const picked = getPickedCount(pl);
  const total = getTotalCount(pl);

  // Items remaining = items that are neither already picked in the data nor checked in UI
  const remainingCount = pl.items.filter(
    (item) => item.status !== "picked" && !checkedItems[item.id]
  ).length;

  // All items resolved = all items either "picked" in data or checked via checkbox
  const allItemsDone = pl.items.every(
    (item) => item.status === "picked" || checkedItems[item.id]
  );

  return (
    <Card className={cn("overflow-hidden transition-all", isExpanded && "ring-2 ring-blue-500")}>
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
          <div className="flex flex-col items-end gap-2">
            <StatusBanner status={pl.status} />
            {pl.status !== "completed" && remainingCount > 0 && (
              <Badge
                variant="outline"
                className={cn(
                  "text-xs font-bold",
                  pl.status === "in_progress"
                    ? "border-blue-400 text-blue-600 bg-blue-50 dark:bg-blue-950/20"
                    : "border-brand-400 text-brand-600 bg-brand-50 dark:bg-brand-950/20"
                )}
              >
                {remainingCount} item{remainingCount !== 1 ? "s" : ""} remaining
              </Badge>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <ProgressBar picked={picked} total={total} />

        {/* Expanded picking view — shown when active */}
        {isExpanded ? (
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <ChevronDown className="h-4 w-4 text-blue-500" />
                Pick items in order
              </div>
              {onOpenScanner && (
                <button
                  onClick={onOpenScanner}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-colors"
                >
                  <Camera className="h-4 w-4" />
                  Scan
                </button>
              )}
            </div>
            {scanFeedback && (
              <div className={cn(
                "rounded-xl px-3 py-2.5 text-sm font-semibold",
                scanFeedback.ok
                  ? "bg-success-50 text-success-700 border border-success-200"
                  : "bg-danger-50 text-danger-700 border border-danger-200"
              )}>
                {scanFeedback.text}
              </div>
            )}
            {pl.items.map((item) => {
              const isAlreadyPicked = item.status === "picked";
              const isChecked = isAlreadyPicked || !!checkedItems[item.id];
              return (
                <label
                  key={item.id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors",
                    isChecked
                      ? "bg-success-50 border-success-200 dark:bg-success-950/20 dark:border-success-800"
                      : "bg-muted/40 border-border hover:bg-muted/70"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    disabled={isAlreadyPicked}
                    onChange={(e) => onToggleItem(item.id, e.target.checked)}
                    className="mt-1 h-5 w-5 rounded accent-blue-600 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "font-medium text-sm leading-snug",
                        isChecked ? "line-through text-muted-foreground" : "text-foreground"
                      )}
                    >
                      {item.productName}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="font-mono text-lg font-bold text-foreground tracking-wide">
                        {item.bin}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Qty: <span className="font-semibold text-foreground">{item.quantity}</span>
                      </span>
                    </div>
                  </div>
                  {isChecked && (
                    <CheckCircle2 className="h-5 w-5 text-success-700 shrink-0 mt-0.5" />
                  )}
                </label>
              );
            })}

            {/* Complete button — only shown when all items are checked */}
            {allItemsDone ? (
              <Button
                className="w-full py-4 text-lg bg-success-600 hover:bg-success-700 text-white"
                size="lg"
                onClick={() => onComplete(pl.id)}
              >
                <CheckCircle2 className="h-5 w-5" />
                Complete Pick List
              </Button>
            ) : (
              <p className="text-center text-sm text-muted-foreground py-2">
                Check off each item above to complete this pick list.
              </p>
            )}
          </div>
        ) : (
          /* Collapsed item preview */
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
        )}

        {/* Action button — open or in_progress and not expanded */}
        {pl.status !== "completed" && !isExpanded && (
          <Button
            className={cn(
              "w-full py-4 text-lg",
              pl.status === "in_progress" ? "bg-blue-600 hover:bg-blue-700 text-white" : ""
            )}
            variant="default"
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

function EmptyState({ filter }: { filter: FilterTab }) {
  const messages: Record<FilterTab, { title: string; detail: string }> = {
    all: { title: "No pick lists", detail: "Pick lists will appear here when orders are ready to pick." },
    open: { title: "No open pick lists", detail: "All open orders have been started or completed." },
    in_progress: { title: "No pick lists in progress", detail: "Start picking an open list to see it here." },
    completed: { title: "No completed pick lists", detail: "Finished pick lists will appear here." },
  };
  const { title, detail } = messages[filter];
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <CheckCircle2 className="h-12 w-12 text-success-700 mx-auto mb-3" />
        <p className="text-lg font-semibold text-foreground">{title}</p>
        <p className="text-muted-foreground mt-1">{detail}</p>
      </CardContent>
    </Card>
  );
}

export default function PickingPage() {
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [lists, setLists] = useState<PickList[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePicking, setActivePicking] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [showScanner, setShowScanner] = useState(false);
  const [scanFeedback, setScanFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function fetchPickLists() {
      try {
        const res = await fetch("/api/warehouse/pick-lists");
        if (!res.ok) throw new Error("Failed to fetch pick lists");
        const data = await res.json();
        const fetched: PickList[] = data.pickLists ?? [];
        setLists(fetched.length > 0 ? fetched : PICK_LISTS);
      } catch {
        setLists(PICK_LISTS);
      } finally {
        setLoading(false);
      }
    }
    fetchPickLists();
  }, []);

  // Sort: open first, then in_progress, then completed; within each group oldest first (most urgent)
  const sorted = [...lists].sort((a, b) => {
    const statusDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (statusDiff !== 0) return statusDiff;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  const filtered =
    activeFilter === "all"
      ? sorted
      : sorted.filter((pl) => pl.status === activeFilter);

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
        if (pl.status === "open") return { ...pl, status: "in_progress" as const, assignedTo: "Warehouse Staff" };
        return pl;
      })
    );
    setActivePicking(id);
    // Use the collection-level PATCH which handles status updates.
    // The [id] PATCH handler only branches on action==='complete' or body.itemId;
    // sending action='start' there is silently ignored.
    fetch(`/api/warehouse/pick-lists`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "in_progress" }),
    }).catch(() => {});
  }

  function handleToggleItem(itemId: string, checked: boolean) {
    setCheckedItems((prev) => ({ ...prev, [itemId]: checked }));

    // Find which pick list owns this item and its required quantity
    const pl = lists.find((l) => l.items.some((i) => i.id === itemId));
    const item = pl?.items.find((i) => i.id === itemId);
    if (pl && item) {
      fetch(`/api/warehouse/pick-lists/${pl.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId,
          qtyPicked: checked ? item.quantity : 0,
          status: checked ? "picked" : "pending",
        }),
      }).catch(() => {
        // Fire-and-forget — optimistic UI update already applied
      });
    }
  }

  function handleScan(code: string) {
    if (!activePicking) return;
    const pl = lists.find((l) => l.id === activePicking);
    if (!pl) return;

    // Look up product in catalog by SKU/id
    const product = PRODUCTS.find(
      (p) =>
        p.sku.toLowerCase() === code.toLowerCase() ||
        p.id.toLowerCase() === code.toLowerCase()
    );

    // Find unfinished item matching this product
    const item = pl.items.find((i) => {
      if (i.status === "picked" || checkedItems[i.id]) return false;
      if (product) {
        const pName = product.name.toLowerCase();
        const iName = i.productName.toLowerCase();
        return pName.includes(iName.split(" ")[0]) || iName.includes(pName.split(" ")[0]);
      }
      return i.productName.toLowerCase().includes(code.toLowerCase());
    });

    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);

    if (item) {
      handleToggleItem(item.id, true);
      setScanFeedback({ ok: true, text: `✓ Picked: ${item.productName}` });
    } else {
      setScanFeedback({ ok: false, text: `No unpicked match for: ${code}` });
    }

    feedbackTimerRef.current = setTimeout(() => setScanFeedback(null), 2500);
  }

  async function handleComplete(id: string) {
    try {
      await fetch(`/api/warehouse/pick-lists/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete" }),
      });
    } catch {
      // Continue even if API call fails — remove from list optimistically
    }

    setLists((prev) =>
      prev.map((pl) =>
        pl.id === id
          ? { ...pl, status: "completed" as const, completedAt: new Date().toISOString() }
          : pl
      )
    );
    setActivePicking(null);
    setCheckedItems((prev) => {
      const updated = { ...prev };
      const pl = lists.find((l) => l.id === id);
      if (pl) pl.items.forEach((item) => delete updated[item.id]);
      return updated;
    });
  }

  if (loading) {
    return (
      <div className="px-4 py-6 max-w-2xl mx-auto flex items-center justify-center min-h-[40vh]">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="h-8 w-8 rounded-full border-4 border-brand-500 border-t-transparent animate-spin" />
          <p className="text-sm">Loading pick lists…</p>
        </div>
      </div>
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
          <EmptyState filter={activeFilter} />
        ) : (
          filtered.map((pl) => (
            <PickListCard
              key={pl.id}
              pl={pl}
              isExpanded={activePicking === pl.id}
              checkedItems={checkedItems}
              onAction={handleAction}
              onToggleItem={handleToggleItem}
              onComplete={handleComplete}
              onOpenScanner={activePicking === pl.id ? () => setShowScanner(true) : undefined}
              scanFeedback={activePicking === pl.id ? scanFeedback : null}
            />
          ))
        )}
      </div>

      {showScanner && (
        <BarcodeScanner
          onScan={(code) => {
            handleScan(code);
            setShowScanner(false);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}
