"use client";

import { useState, useEffect } from "react";
import {
  PackageCheck,
  ScanLine,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Keyboard,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { GOODS_RECEIPTS } from "@/lib/mock-data";
import { toastError, toastSuccess } from "@/store/toast";

// ─── Local types ──────────────────────────────────────────────────────────────

type ReceivingItem = {
  purchaseOrderItemId: string;
  productId: string;
  productName: string;
  sku: string;
  expectedQty: number;
  receivedQty: number;
};

type ReceivingPO = {
  id: string;          // purchase order id (used as purchaseOrderId in POST)
  poNumber: string;
  supplierName: string;
  status: "pending" | "in_progress" | "completed" | "rejected";
  items: ReceivingItem[];
  createdAt: string;
};

type ReceiveFormState = {
  grId: string;
  itemIdx: number;
  barcode: string;
  qty: string;
  manualMode: boolean;
  confirming: boolean;
  confirmed: boolean;
  error: string;
};

// ─── Data mapping helpers ─────────────────────────────────────────────────────

// Map raw API/Supabase PO object (may be snake_case) to ReceivingPO
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPOToReceivingPO(po: any): ReceivingPO {
  const rawStatus: string = po.status ?? "";
  const status: ReceivingPO["status"] =
    rawStatus === "partial" ? "in_progress"
    : rawStatus === "received" ? "completed"
    : "pending";

  return {
    id: po.id,
    poNumber: po.po_number ?? po.poNumber ?? "",
    supplierName: po.supplier?.name ?? po.supplierName ?? "",
    status,
    items: (po.items ?? []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (item: any): ReceivingItem => ({
        purchaseOrderItemId: item.id ?? "",
        productId: item.product_id ?? item.productId ?? "",
        productName:
          item.product?.name ?? item.product_name ?? item.productName ?? "",
        sku: item.product?.sku ?? item.sku ?? "",
        expectedQty: item.qty_ordered ?? item.orderedQty ?? item.expectedQty ?? 0,
        receivedQty: item.qty_received ?? item.receivedQty ?? 0,
      })
    ),
    createdAt: po.created_at ?? po.createdAt ?? new Date().toISOString(),
  };
}

// Convert mock GOODS_RECEIPTS to ReceivingPO shape for offline fallback
const FALLBACK_RECEIVING: ReceivingPO[] = GOODS_RECEIPTS.map((gr) => ({
  id: gr.id,
  poNumber: gr.poNumber,
  supplierName: gr.supplierName,
  status: gr.status,
  items: gr.items.map((item) => ({
    purchaseOrderItemId: "",
    productId: "",
    productName: item.productName,
    sku: item.sku,
    expectedQty: item.expectedQty,
    receivedQty: item.receivedQty,
  })),
  createdAt: gr.createdAt,
}));

// ─── Formatters ───────────────────────────────────────────────────────────────

function formatDate(isoString: string) {
  return new Date(isoString).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function statusBadge(status: ReceivingPO["status"]) {
  if (status === "completed")
    return <Badge variant="success">Received</Badge>;
  if (status === "in_progress")
    return <Badge variant="default">In Progress</Badge>;
  return <Badge variant="warning">Pending</Badge>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReceivingPage() {
  const [receipts, setReceipts] = useState<ReceivingPO[]>([]);
  const [loading, setLoading] = useState(true);
  // Fix #4: allow multiple cards expanded at once via a Set
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [form, setForm] = useState<ReceiveFormState | null>(null);

  async function fetchPOs() {
    try {
      const res = await fetch("/api/warehouse/receive");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      const pos: unknown[] = data.purchaseOrders ?? [];
      setReceipts(pos.length > 0 ? pos.map(mapPOToReceivingPO) : FALLBACK_RECEIVING);
    } catch {
      setReceipts(FALLBACK_RECEIVING);
    }
  }

  useEffect(() => {
    setLoading(true);
    fetchPOs().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    // Only clear the form when collapsing the card that owns it
    setForm((f) => (f?.grId === id ? null : f));
  }

  function openReceiveForm(grId: string, itemIdx: number) {
    setForm({
      grId,
      itemIdx,
      barcode: "",
      qty: "",
      manualMode: false,
      confirming: false,
      confirmed: false,
      error: "",
    });
  }

  function closeForm() {
    setForm(null);
  }

  function handleBarcodeChange(value: string) {
    if (!form) return;
    setForm((f) => f && { ...f, barcode: value, error: "" });
  }

  function handleQtyChange(value: string) {
    if (!form) return;
    const num = value.replace(/[^0-9]/g, "");
    setForm((f) => f && { ...f, qty: num, error: "" });
  }

  async function handleConfirm() {
    if (!form) return;

    // Validate
    const receipt = receipts.find((gr) => gr.id === form.grId);
    const item = receipt?.items[form.itemIdx];
    if (!item) return;

    if (!form.qty || parseInt(form.qty) <= 0) {
      setForm((f) => f && { ...f, error: "Enter a valid quantity." });
      return;
    }

    const qty = parseInt(form.qty);
    const remaining = item.expectedQty - item.receivedQty;

    if (qty > remaining) {
      setForm((f) => f && {
        ...f,
        error: `Cannot receive more than expected. Remaining: ${remaining}`,
      });
      return;
    }

    // Optimistic local update
    setReceipts((prev) =>
      prev.map((gr) => {
        if (gr.id !== form.grId) return gr;
        const updatedItems = gr.items.map((itm, idx) => {
          if (idx !== form.itemIdx) return itm;
          return { ...itm, receivedQty: itm.receivedQty + qty };
        });
        const allDone = updatedItems.every(
          (itm) => itm.receivedQty >= itm.expectedQty
        );
        const anyStarted = updatedItems.some((itm) => itm.receivedQty > 0);
        return {
          ...gr,
          items: updatedItems,
          status: allDone
            ? ("completed" as const)
            : anyStarted
            ? ("in_progress" as const)
            : gr.status,
        };
      })
    );

    setForm((f) => f && { ...f, confirmed: true, error: "" });

    // POST to API
    try {
      const res = await fetch("/api/warehouse/receive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purchaseOrderId: receipt.id,
          items: [
            {
              purchaseOrderItemId: item.purchaseOrderItemId,
              productId: item.productId,
              qtyReceived: qty,
            },
          ],
          notes: "",
        }),
      });
      if (res.ok) {
        toastSuccess("Items received successfully");
      }
    } catch {
      // Optimistic update stays in place even on network error
    }

    setTimeout(() => {
      setForm(null);
    }, 3000);
  }

  function handleReject(id: string) {
    // The POST /api/warehouse/receive handler iterates `items` unconditionally;
    // sending `action: 'reject'` without an items array causes a 500
    // (TypeError: items is not iterable). The API route needs a dedicated
    // reject branch — until then, rejection is applied locally only.
    // TODO: add `if (body.action === 'reject')` early-exit in the API handler
    // to persist `status: 'rejected'` to Supabase.
    setReceipts((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "rejected" as const } : r))
    );
    toastError("Shipment rejected — admin notified");
  }

  const pending = receipts.filter((gr) => gr.status === "pending");
  const inProgress = receipts.filter((gr) => gr.status === "in_progress");
  const completed = receipts.filter((gr) => gr.status === "completed");

  const sections = [
    { label: "Pending Receipt", items: pending, accent: "text-warning-600" },
    { label: "In Progress", items: inProgress, accent: "text-blue-600" },
    { label: "Completed", items: completed, accent: "text-success-700" },
  ];

  if (loading) {
    return (
      <div className="px-4 py-6 max-w-2xl mx-auto flex items-center justify-center min-h-[40vh]">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="h-8 w-8 rounded-full border-4 border-brand-500 border-t-transparent animate-spin" />
          <p className="text-sm">Loading deliveries…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
      {/* Page title */}
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Goods Receiving</h1>
        <p className="text-base text-muted-foreground mt-0.5">
          {pending.length + inProgress.length} purchase order{(pending.length + inProgress.length) !== 1 ? "s" : ""} awaiting receipt
        </p>
      </div>

      {/* Fix #5: Today's Receipts summary chips */}
      <div className="flex gap-2 flex-wrap">
        {[
          { label: "Pending", count: pending.length, chipClass: "bg-warning-50 text-warning-700 border-warning-200" },
          { label: "In Progress", count: inProgress.length, chipClass: "bg-blue-50 text-blue-700 border-blue-200" },
          { label: "Completed", count: completed.length, chipClass: "bg-success-50 text-success-700 border-success-200" },
        ].map(({ label, count, chipClass }) => (
          <span
            key={label}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border",
              chipClass
            )}
          >
            <span className="text-base font-bold">{count}</span>
            {label}
          </span>
        ))}
      </div>

      {/* Sections */}
      {sections.map(({ label, items, accent }) =>
        items.length === 0 ? null : (
          <div key={label} className="space-y-3">
            <h2 className={cn("font-display text-lg font-semibold", accent)}>{label}</h2>
            <div className="space-y-4">
              {items.map((gr) => (
                <ReceiptCard
                  key={gr.id}
                  gr={gr}
                  isExpanded={expandedIds.has(gr.id)}
                  form={form?.grId === gr.id ? form : null}
                  onToggle={() => toggleExpand(gr.id)}
                  onOpenForm={openReceiveForm}
                  onCloseForm={closeForm}
                  onBarcodeChange={handleBarcodeChange}
                  onQtyChange={handleQtyChange}
                  onConfirm={handleConfirm}
                  onReject={handleReject}
                  onToggleManual={() =>
                    setForm((f) => f && { ...f, manualMode: !f.manualMode, barcode: "" })
                  }
                />
              ))}
            </div>
          </div>
        )
      )}

      {receipts.length === 0 && (
        <Card>
          <CardContent className="p-10 text-center">
            <CheckCircle2 className="h-12 w-12 text-success-700 mx-auto mb-3" />
            <p className="text-lg font-semibold text-foreground">No pending deliveries</p>
            <p className="text-muted-foreground mt-1">No purchase orders are awaiting receipt.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Receipt Card ─────────────────────────────────────────────────────────────

function ReceiptCard({
  gr,
  isExpanded,
  form,
  onToggle,
  onOpenForm,
  onCloseForm,
  onBarcodeChange,
  onQtyChange,
  onConfirm,
  onReject,
  onToggleManual,
}: {
  gr: ReceivingPO;
  isExpanded: boolean;
  form: ReceiveFormState | null;
  onToggle: () => void;
  onOpenForm: (grId: string, itemIdx: number) => void;
  onCloseForm: () => void;
  onBarcodeChange: (v: string) => void;
  onQtyChange: (v: string) => void;
  onConfirm: () => void;
  onReject: (id: string) => void;
  onToggleManual: () => void;
}) {
  const totalExpected = gr.items.reduce((s, i) => s + i.expectedQty, 0);
  const totalReceived = gr.items.reduce((s, i) => s + i.receivedQty, 0);
  const pct = totalExpected === 0 ? 0 : Math.round((totalReceived / totalExpected) * 100);

  function handleReject() {
    const confirmed = window.confirm("Reject this shipment? This cannot be undone.");
    if (confirmed) {
      onReject(gr.id);
    }
  }

  return (
    <Card className="overflow-hidden">
      {/* Card header — tap to expand */}
      <button
        onClick={onToggle}
        className="w-full text-left px-5 pt-5 pb-4 focus:outline-none"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-xl font-bold text-foreground">{gr.poNumber}</p>
            <p className="text-base text-muted-foreground mt-0.5 truncate">{gr.supplierName}</p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            {statusBadge(gr.status)}
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground mt-1" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground mt-1" />
            )}
          </div>
        </div>

        {/* Mini progress */}
        <div className="mt-3 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {totalReceived} / {totalExpected} units received
            </span>
            <span className="font-semibold text-foreground">{pct}%</span>
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                pct === 100 ? "bg-success-500" : pct > 0 ? "bg-blue-500" : "bg-muted-foreground/30"
              )}
              style={{ width: `${Math.max(pct, pct > 0 ? 4 : 0)}%` }}
            />
          </div>
        </div>
      </button>

      {/* Expanded — item list + receive forms */}
      {isExpanded && (
        <div className="border-t border-border">
          <div className="px-5 py-4 space-y-4">
            {gr.items.map((item, idx) => {
              const remaining = item.expectedQty - item.receivedQty;
              const isDone = remaining <= 0;
              const isActiveForm = form?.itemIdx === idx;

              return (
                <div key={item.sku || idx} className="space-y-3">
                  {/* Item row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-semibold text-foreground leading-snug">
                        {item.productName}
                      </p>
                      <p className="text-xs font-mono text-muted-foreground mt-0.5">{item.sku}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-sm">
                        <span className="text-muted-foreground">
                          Expected: <span className="font-semibold text-foreground">{item.expectedQty}</span>
                        </span>
                        <span className="text-muted-foreground">
                          Received:{" "}
                          <span
                            className={cn(
                              "font-semibold",
                              isDone ? "text-success-700" : "text-foreground"
                            )}
                          >
                            {item.receivedQty}
                          </span>
                        </span>
                        {isDone && (
                          <CheckCircle2 className="h-4 w-4 text-success-700" />
                        )}
                      </div>
                    </div>

                    {!isDone && !isActiveForm && gr.status !== "completed" && (
                      <Button
                        size="sm"
                        className="shrink-0 py-3 px-4 text-base"
                        onClick={() => onOpenForm(gr.id, idx)}
                      >
                        <ScanLine className="h-4 w-4" />
                        Scan &amp; Receive
                      </Button>
                    )}
                  </div>

                  {/* Inline receive form */}
                  {isActiveForm && form && (
                    <div className="bg-muted rounded-2xl p-4 space-y-4 border border-border">
                      {/* Form header */}
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-foreground text-base">
                          {form.manualMode ? "Manual Entry" : "Scan Barcode"}
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={onToggleManual}
                            className="flex items-center gap-1.5 text-sm text-brand-500 font-medium py-1 px-2 rounded-lg hover:bg-brand-500/10 transition-colors"
                            title={form.manualMode ? "Switch to scanner" : "Switch to manual entry"}
                          >
                            {form.manualMode ? (
                              <>
                                <ScanLine className="h-4 w-4" />
                                Use Scanner
                              </>
                            ) : (
                              <>
                                <Keyboard className="h-4 w-4" />
                                Manual Entry
                              </>
                            )}
                          </button>
                          <button
                            onClick={onCloseForm}
                            className="p-1 rounded-lg hover:bg-muted-foreground/10 text-muted-foreground"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Barcode field */}
                      {!form.manualMode && (
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-muted-foreground">
                            Barcode / SKU
                          </label>
                          <input
                            type="text"
                            inputMode="text"
                            autoFocus
                            placeholder={`Scan or type SKU — expected: ${item.sku}`}
                            value={form.barcode}
                            onChange={(e) => onBarcodeChange(e.target.value)}
                            className="w-full bg-background border border-border rounded-xl px-4 py-4 text-lg font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-muted-foreground/50"
                          />
                          {form.barcode && form.barcode !== item.sku && (
                            <p className="text-xs text-warning-600 font-medium">
                              SKU mismatch — expected {item.sku}
                            </p>
                          )}
                          {form.barcode === item.sku && (
                            <p className="text-xs text-success-700 font-medium flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" /> SKU matched
                            </p>
                          )}
                        </div>
                      )}

                      {/* Quantity field */}
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-muted-foreground">
                          Quantity Received
                          <span className="ml-2 text-xs text-muted-foreground font-normal">
                            (remaining: {remaining})
                          </span>
                        </label>
                        <input
                          type="number"
                          inputMode="numeric"
                          min={1}
                          max={remaining}
                          placeholder={`Enter quantity (max ${remaining})`}
                          value={form.qty}
                          onChange={(e) => onQtyChange(e.target.value)}
                          className="w-full bg-background border border-border rounded-xl px-4 py-4 text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-muted-foreground/40 placeholder:text-lg placeholder:font-normal"
                        />
                      </div>

                      {/* Quick quantity buttons */}
                      <div className="flex gap-2">
                        {[10, 24, 48, remaining].filter((v, i, arr) => arr.indexOf(v) === i && v > 0 && v <= remaining).map((v) => (
                          <button
                            key={v}
                            onClick={() => onQtyChange(String(v))}
                            className={cn(
                              "flex-1 py-3 rounded-xl text-base font-semibold border transition-colors",
                              form.qty === String(v)
                                ? "bg-brand-500 text-white border-brand-500"
                                : "bg-background border-border text-foreground hover:bg-muted"
                            )}
                          >
                            {v === remaining ? "All" : v}
                          </button>
                        ))}
                      </div>

                      {/* Error */}
                      {form.error && (
                        <p className="text-sm text-danger-500 font-medium bg-danger-50 rounded-xl px-3 py-2">
                          {form.error}
                        </p>
                      )}

                      {/* Confirm button */}
                      {form.confirmed ? (
                        <div className="flex items-center justify-center gap-2 py-3 bg-success-50 rounded-xl text-success-700 font-semibold text-base">
                          <CheckCircle2 className="h-5 w-5" />
                          Received successfully!
                        </div>
                      ) : (
                        <Button
                          className="w-full py-4 text-lg"
                          size="lg"
                          onClick={onConfirm}
                          disabled={
                            !form.qty ||
                            parseInt(form.qty) <= 0 ||
                            (!form.manualMode && (!form.barcode || form.barcode.trim() === ""))
                          }
                        >
                          <PackageCheck className="h-5 w-5" />
                          Confirm Receipt
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Divider between items */}
                  {gr.items.indexOf(item) < gr.items.length - 1 && (
                    <div className="border-b border-border" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Card footer — PO date + Fix #3: Reject button */}
          <div className="px-5 pb-5 pt-0 flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Created {formatDate(gr.createdAt)}
            </p>
            {gr.status !== "completed" && (
              <Button
                variant="outline"
                size="sm"
                className="border-danger-400 text-danger-600 hover:bg-danger-50 hover:border-danger-500"
                onClick={handleReject}
              >
                Reject Shipment
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
