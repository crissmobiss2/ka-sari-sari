"use client";

import { useState } from "react";
import {
  Truck,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  Package,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GOODS_RECEIPTS, PURCHASE_ORDERS, SUPPLIERS } from "@/lib/mock-data";

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterTab = "pending" | "in_progress" | "completed";

interface ReceivingItem {
  sku: string;
  productName: string;
  expectedQty: number;
}

interface ReceivingReceipt {
  id: string;
  grNumber: string;
  poNumber: string;
  supplierName: string;
  expectedDate: string;
  items: ReceivingItem[];
  status: "pending" | "in_progress" | "completed";
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const COMPLETED_RECEIPTS: ReceivingReceipt[] = [
  {
    id: "gr-000",
    grNumber: "GR-000",
    poNumber: "PO-2025-0088",
    supplierName: "Lucky Me Foods Corp",
    expectedDate: "Jan 19, 2025",
    status: "completed",
    items: [
      { productName: "Lucky Me! Pancit Canton Original", sku: "LM-PC-ORI", expectedQty: 480 },
    ],
  },
];

// Build pending receipts from mock data
const PENDING_RECEIPTS: ReceivingReceipt[] = GOODS_RECEIPTS.filter(
  (gr) => gr.status === "pending"
).map((gr) => {
  const po = PURCHASE_ORDERS.find((p) => p.poNumber === gr.poNumber);
  const supplier = SUPPLIERS.find((s) => s.id === po?.supplierId);
  return {
    id: gr.id,
    grNumber: `GR-${gr.id.replace("gr-", "").padStart(3, "0").toUpperCase()}`,
    poNumber: gr.poNumber,
    supplierName: supplier?.name ?? gr.supplierName,
    expectedDate: po?.expectedDate
      ? new Date(po.expectedDate).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
      : "Tomorrow",
    status: "pending" as const,
    items: gr.items.map((i) => ({
      sku: i.sku,
      productName: i.productName,
      expectedQty: i.expectedQty,
    })),
  };
});

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GoodsReceivingPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>("pending");
  const [receipts, setReceipts] = useState<ReceivingReceipt[]>([
    ...PENDING_RECEIPTS,
    ...COMPLETED_RECEIPTS,
  ]);

  // receivedQty[grId][sku] = number
  const [receivedQty, setReceivedQty] = useState<Record<string, Record<string, number>>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<Set<string>>(new Set());
  const [expandedCompleted, setExpandedCompleted] = useState<Set<string>>(new Set());

  function handleQtyChange(grId: string, sku: string, value: string) {
    const num = Math.max(0, parseInt(value, 10) || 0);
    setReceivedQty((prev) => ({
      ...prev,
      [grId]: { ...(prev[grId] ?? {}), [sku]: num },
    }));
  }

  function handleReceive(grId: string) {
    setSubmitting(grId);
    setTimeout(() => {
      setSubmitting(null);
      setSubmitted((prev) => new Set([...prev, grId]));
      setReceipts((prev) =>
        prev.map((r) => (r.id === grId ? { ...r, status: "completed" as const } : r))
      );
    }, 1200);
  }

  function toggleCompleted(id: string) {
    setExpandedCompleted((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const pendingReceipts = receipts.filter((r) => r.status === "pending");
  const completedReceipts = receipts.filter((r) => r.status === "completed");

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "pending",     label: "Pending",     count: pendingReceipts.length },
    { key: "in_progress", label: "In Progress", count: 0 },
    { key: "completed",   label: "Completed",   count: completedReceipts.length },
  ];

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Goods Receiving</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Record incoming shipments from suppliers</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 border-b border-border pb-0">
        {tabs.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              "relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none",
              activeTab === key
                ? "text-brand-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-brand-500 after:rounded-full"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
            {count > 0 && (
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
            )}
          </button>
        ))}
      </div>

      {/* Pending Tab Content */}
      {activeTab === "pending" && (
        <div className="space-y-5">
          {pendingReceipts.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              No pending receipts
            </div>
          )}

          {pendingReceipts.map((receipt) => {
            const isSubmitting = submitting === receipt.id;
            const isSubmitted = submitted.has(receipt.id);

            return (
              <Card key={receipt.id}>
                {/* Card header */}
                <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-semibold text-foreground tracking-wide uppercase">
                        {receipt.grNumber}
                      </span>
                      <span className="text-muted-foreground">/</span>
                      <span className="text-sm text-muted-foreground">{receipt.poNumber}</span>
                    </div>
                    <p className="text-base font-semibold text-foreground">{receipt.supplierName}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                      <Clock className="h-3 w-3" />
                      Expected
                    </p>
                    <p className="text-sm font-medium text-foreground">{receipt.expectedDate}</p>
                  </div>
                </div>

                {/* Items table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Product
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                          SKU
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                          Expected
                        </th>
                        <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                          Received
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {receipt.items.map((item, idx) => {
                        const qty = receivedQty[receipt.id]?.[item.sku] ?? "";
                        return (
                          <tr
                            key={item.sku}
                            className={cn(
                              "transition-colors",
                              idx < receipt.items.length - 1 && "border-b border-border"
                            )}
                          >
                            <td className="px-5 py-3.5 font-medium text-foreground">{item.productName}</td>
                            <td className="px-4 py-3.5">
                              <span className="font-mono text-xs bg-muted rounded-lg px-2 py-1 text-muted-foreground">
                                {item.sku}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-right tabular-nums text-foreground font-medium">
                              {item.expectedQty.toLocaleString()}
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <input
                                type="number"
                                min={0}
                                max={item.expectedQty}
                                placeholder="0"
                                value={qty}
                                onChange={(e) => handleQtyChange(receipt.id, item.sku, e.target.value)}
                                disabled={isSubmitting || isSubmitted}
                                className="border border-input rounded-xl px-3 py-1.5 text-sm w-20 text-right tabular-nums
                                  focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
                                  bg-card text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Card footer */}
                <div className="flex items-center justify-between gap-4 border-t border-border px-5 py-4">
                  <p className="text-xs text-muted-foreground">
                    Enter received quantities for each product, then confirm.
                  </p>
                  <Button
                    size="sm"
                    variant="default"
                    loading={isSubmitting}
                    disabled={isSubmitted}
                    onClick={() => handleReceive(receipt.id)}
                    className="shrink-0"
                  >
                    {isSubmitted ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Received
                      </>
                    ) : (
                      <>
                        <Package className="h-4 w-4" />
                        Mark as Received
                      </>
                    )}
                  </Button>
                </div>

                {/* Success banner */}
                {isSubmitted && (
                  <div className="mx-5 mb-5 flex items-center gap-2 rounded-xl bg-success-50 border border-success-200 px-4 py-3 text-sm text-success-700">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    Goods receipt recorded. Stock updated successfully.
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* In Progress Tab */}
      {activeTab === "in_progress" && (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No receipts in progress
        </div>
      )}

      {/* Completed Tab */}
      {activeTab === "completed" && (
        <div className="space-y-3">
          {completedReceipts.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              No completed receipts yet
            </div>
          )}

          {completedReceipts.map((receipt) => {
            const expanded = expandedCompleted.has(receipt.id);
            return (
              <Card key={receipt.id} className="overflow-hidden">
                <button
                  onClick={() => toggleCompleted(receipt.id)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-success-50 text-success-600">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-foreground uppercase tracking-wide">
                          {receipt.grNumber}
                        </span>
                        <span className="text-xs text-muted-foreground">{receipt.poNumber}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{receipt.supplierName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs rounded-full bg-success-50 text-success-700 border border-success-300/50 px-2.5 py-0.5 font-medium">
                      Received
                    </span>
                    {expanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {expanded && (
                  <div className="border-t border-border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/40">
                          <th className="px-5 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Product</th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">SKU</th>
                          <th className="px-5 py-2.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Qty Received</th>
                        </tr>
                      </thead>
                      <tbody>
                        {receipt.items.map((item, idx) => (
                          <tr key={item.sku} className={cn(idx < receipt.items.length - 1 && "border-b border-border")}>
                            <td className="px-5 py-3 font-medium text-foreground">{item.productName}</td>
                            <td className="px-4 py-3">
                              <span className="font-mono text-xs bg-muted rounded-lg px-2 py-1 text-muted-foreground">
                                {item.sku}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-right tabular-nums font-medium text-success-700">
                              {item.expectedQty.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
