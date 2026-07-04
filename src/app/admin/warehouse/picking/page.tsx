"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Circle,
  MinusCircle,
  Play,
  User,
  Clock,
  PackageCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PICK_LISTS } from "@/lib/mock-data";

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterTab = "open" | "in_progress" | "completed";

type ItemStatus = "pending" | "partial" | "picked";

interface PickItem {
  id: string;
  productName: string;
  sku: string;
  quantity: number;
  pickedQty: number;
  bin: string;
  status: ItemStatus;
}

interface PickListState {
  id: string;
  orderNumber: string;
  status: "open" | "in_progress" | "completed";
  assignedTo?: string;
  createdAt: string;
  completedAt?: string;
  items: PickItem[];
}

// ─── Seed / derive state from mock data ──────────────────────────────────────

function seedPickLists(): PickListState[] {
  return PICK_LISTS.map((pl) => ({
    id: pl.id,
    orderNumber: pl.orderNumber,
    status: pl.status as "open" | "in_progress" | "completed",
    assignedTo: pl.assignedTo,
    createdAt: pl.createdAt,
    completedAt: pl.completedAt,
    items: pl.items.map((i) => ({
      id: i.id,
      productName: i.productName,
      sku: i.sku,
      quantity: i.quantity,
      pickedQty: i.pickedQty,
      bin: i.bin,
      status: i.status as ItemStatus,
    })),
  }));
}

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  return `${hrs}h ago`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function BinLabel({ bin }: { bin: string }) {
  return (
    <span className="font-mono text-xs bg-muted rounded px-1.5 py-0.5 text-muted-foreground border border-border/60">
      {bin}
    </span>
  );
}

function ItemStatusIcon({ status }: { status: ItemStatus }) {
  if (status === "picked") return <CheckCircle2 className="h-4.5 w-4.5 text-success-500 shrink-0" />;
  if (status === "partial") return <MinusCircle className="h-4.5 w-4.5 text-warning-500 shrink-0" />;
  return <Circle className="h-4.5 w-4.5 text-muted-foreground shrink-0" />;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PickingPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>("open");
  const [lists, setLists] = useState<PickListState[]>(seedPickLists);
  // partialQty[itemId] = qty entered for partial items
  const [partialQty, setPartialQty] = useState<Record<string, string>>({});

  function startPicking(listId: string) {
    setLists((prev) =>
      prev.map((l) =>
        l.id === listId ? { ...l, status: "in_progress", assignedTo: "Staff A" } : l
      )
    );
    setActiveTab("in_progress");
  }

  function toggleItem(listId: string, itemId: string) {
    setLists((prev) =>
      prev.map((l) => {
        if (l.id !== listId) return l;
        return {
          ...l,
          items: l.items.map((i) => {
            if (i.id !== itemId) return i;
            if (i.status === "pending" || i.status === "partial") {
              return { ...i, status: "picked", pickedQty: i.quantity };
            }
            return { ...i, status: "pending", pickedQty: 0 };
          }),
        };
      })
    );
  }

  function markAllPicked(listId: string) {
    setLists((prev) =>
      prev.map((l) => {
        if (l.id !== listId) return l;
        return {
          ...l,
          items: l.items.map((i) => ({ ...i, status: "picked", pickedQty: i.quantity })),
        };
      })
    );
  }

  function completeList(listId: string) {
    setLists((prev) =>
      prev.map((l) =>
        l.id === listId
          ? { ...l, status: "completed", completedAt: new Date().toISOString() }
          : l
      )
    );
    setActiveTab("completed");
  }

  const openLists      = lists.filter((l) => l.status === "open");
  const inProgressLists = lists.filter((l) => l.status === "in_progress");
  const completedLists = lists.filter((l) => l.status === "completed");

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "open",        label: "Open",        count: openLists.length },
    { key: "in_progress", label: "In Progress",  count: inProgressLists.length },
    { key: "completed",   label: "Completed",    count: completedLists.length },
  ];

  const currentLists =
    activeTab === "open" ? openLists :
    activeTab === "in_progress" ? inProgressLists : completedLists;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Picking</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Fulfill orders from warehouse stock</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              "relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
              activeTab === key
                ? "text-brand-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-brand-500 after:rounded-full"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
            <span
              className={cn(
                "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold",
                activeTab === key
                  ? "bg-brand-100 text-brand-700"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* List area */}
      <div className="space-y-5">
        {currentLists.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No pick lists in this category
          </div>
        )}

        {currentLists.map((list) => {
          const pickedCount = list.items.filter((i) => i.status === "picked").length;
          const totalCount  = list.items.length;
          const allPicked   = pickedCount === totalCount;
          const pct         = totalCount > 0 ? Math.round((pickedCount / totalCount) * 100) : 0;
          const isCompleted = list.status === "completed";
          const isOpen      = list.status === "open";

          return (
            <Card key={list.id} className={cn(isCompleted && "opacity-70")}>
              {/* Card header */}
              <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-semibold text-foreground uppercase tracking-wide">
                      {list.id.toUpperCase()}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                        isCompleted  && "bg-success-50 text-success-700 border-success-300/50",
                        list.status === "in_progress" && "bg-purple-50 text-purple-700 border-purple-300/50",
                        isOpen       && "bg-warning-50 text-warning-700 border-warning-300/50"
                      )}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {isCompleted ? "Completed" : list.status === "in_progress" ? "In Progress" : "Open"}
                    </span>
                  </div>
                  <p className="text-base font-semibold text-foreground">Order {list.orderNumber}</p>
                </div>
                <div className="text-right shrink-0 space-y-1">
                  {list.assignedTo && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground justify-end">
                      <User className="h-3 w-3" />
                      <span>{list.assignedTo}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground justify-end">
                    <Clock className="h-3 w-3" />
                    <span>
                      {isCompleted && list.completedAt
                        ? `Completed ${timeAgo(list.completedAt)}`
                        : `Created ${timeAgo(list.createdAt)}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress (show for in_progress and completed) */}
              {!isOpen && (
                <div className="px-5 pt-4 pb-0">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                    <span>{pickedCount}/{totalCount} items complete</span>
                    <span className="font-medium text-foreground">{pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-300",
                        isCompleted ? "bg-success-400" : "bg-brand-500"
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Items list */}
              <div className="px-5 py-4 space-y-2">
                {list.items.map((item) => {
                  const isItemPicked = item.status === "picked";
                  const isPartial    = item.status === "partial";

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "flex items-center gap-3 rounded-xl p-3 transition-colors",
                        !isCompleted && "cursor-pointer hover:bg-muted/50",
                        isItemPicked && !isCompleted && "bg-success-50/60",
                        isCompleted  && "bg-muted/20"
                      )}
                      onClick={!isCompleted ? () => toggleItem(list.id, item.id) : undefined}
                      role={!isCompleted ? "checkbox" : undefined}
                      aria-checked={isItemPicked}
                      tabIndex={!isCompleted ? 0 : undefined}
                      onKeyDown={
                        !isCompleted
                          ? (e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); toggleItem(list.id, item.id); } }
                          : undefined
                      }
                    >
                      <ItemStatusIcon status={item.status} />

                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            "text-sm font-medium",
                            isItemPicked ? "text-muted-foreground line-through" : "text-foreground"
                          )}
                        >
                          {item.productName}
                          <span className="ml-1 text-muted-foreground font-normal">
                            x{item.quantity}
                          </span>
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <BinLabel bin={item.bin} />
                          <span className="text-[11px] text-muted-foreground font-mono">{item.sku}</span>
                        </div>
                      </div>

                      {/* Partial qty input */}
                      {isPartial && !isCompleted && (
                        <div
                          className="flex items-center gap-1.5 shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="text-xs text-muted-foreground">Partial:</span>
                          <input
                            type="number"
                            min={0}
                            max={item.quantity}
                            placeholder="0"
                            value={(partialQty[item.id] ?? item.pickedQty) || ""}
                            onChange={(e) =>
                              setPartialQty((prev) => ({ ...prev, [item.id]: e.target.value }))
                            }
                            className="border border-input rounded-xl px-3 py-1.5 text-sm w-16 text-right tabular-nums
                              focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-card text-foreground"
                          />
                        </div>
                      )}

                      {/* Picked badge */}
                      {isItemPicked && !isCompleted && (
                        <span className="text-xs font-medium text-success-600 shrink-0">Picked</span>
                      )}

                      {/* Completed checkmark */}
                      {isCompleted && (
                        <CheckCircle2 className="h-4 w-4 text-success-500 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Actions footer */}
              {!isCompleted && (
                <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-4">
                  {isOpen ? (
                    <>
                      <p className="text-xs text-muted-foreground">
                        {totalCount} items to pick from warehouse
                      </p>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => startPicking(list.id)}
                        className="shrink-0"
                      >
                        <Play className="h-3.5 w-3.5" />
                        Start Picking
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markAllPicked(list.id)}
                        disabled={allPicked}
                        className="text-xs"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Mark All Picked
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => completeList(list.id)}
                        disabled={!allPicked}
                        className="shrink-0"
                        title={!allPicked ? "Pick all items first" : ""}
                      >
                        <PackageCheck className="h-3.5 w-3.5" />
                        Complete Pick List
                      </Button>
                    </>
                  )}
                </div>
              )}

              {/* Completed footer */}
              {isCompleted && (
                <div className="flex items-center gap-2 border-t border-border px-5 py-3 bg-success-50/40">
                  <CheckCircle2 className="h-4 w-4 text-success-600 shrink-0" />
                  <p className="text-xs font-medium text-success-700">
                    All {totalCount} items picked — ready to pack
                  </p>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
