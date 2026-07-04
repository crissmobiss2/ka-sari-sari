"use client";
import { useState } from "react";
import {
  Plus, X, Send, CheckCheck, Eye, Trash2, FileText,
  Package, Building2, CalendarClock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn, formatPHP } from "@/lib/utils";

const PO_DATA = [
  { id: "po-001", poNumber: "PO-2025-0089", supplier: "PhilBev Distribution Inc.", status: "confirmed", items: 2, total: 25440, expectedDate: "Tomorrow, Jan 22", createdAt: "Jan 21, 2025", receivedAt: undefined },
  { id: "po-002", poNumber: "PO-2025-0088", supplier: "Lucky Me Foods Corp", status: "received", items: 1, total: 4800, expectedDate: "Jan 19, 2025", createdAt: "Jan 18, 2025", receivedAt: "Jan 19, 2025" },
  { id: "po-003", poNumber: "PO-2025-0087", supplier: "P&G Philippines", status: "sent", items: 2, total: 17280, expectedDate: "Jan 24, 2025", createdAt: "Jan 20, 2025", receivedAt: undefined },
  { id: "po-004", poNumber: "PO-2025-0086", supplier: "Del Monte Philippines", status: "draft", items: 3, total: 12600, expectedDate: null, createdAt: "Jan 21, 2025", receivedAt: undefined },
] as const;

const SUPPLIER_OPTIONS = [
  "PhilBev Distribution Inc.",
  "Lucky Me Foods Corp",
  "Del Monte Philippines",
  "Procter & Gamble Philippines",
  "Mega Global Corp",
];

type POStatus = "draft" | "sent" | "confirmed" | "received" | "partial";

const STATUS_STYLE: Record<POStatus, string> = {
  draft:     "bg-surface-100 text-muted-foreground border-surface-200",
  sent:      "bg-warning-50 text-warning-600 border-warning-500/25",
  confirmed: "bg-blue-50 text-blue-600 border-blue-200",
  received:  "bg-success-50 text-success-600 border-success-500/25",
  partial:   "bg-orange-50 text-orange-600 border-orange-200",
};

const STATUS_BAR: Record<POStatus, string> = {
  draft:     "bg-surface-300",
  sent:      "bg-warning-400",
  confirmed: "bg-blue-400",
  received:  "bg-success-500",
  partial:   "bg-orange-400",
};

const STATUS_LABEL: Record<POStatus, string> = {
  draft:     "Draft",
  sent:      "Sent",
  confirmed: "Confirmed",
  received:  "Received",
  partial:   "Partial",
};

const TABS = [
  { id: "all",       label: "All",       count: PO_DATA.length },
  { id: "draft",     label: "Draft",     count: PO_DATA.filter((p) => p.status === "draft").length },
  { id: "sent",      label: "Sent",      count: PO_DATA.filter((p) => p.status === "sent").length },
  { id: "confirmed", label: "Confirmed", count: PO_DATA.filter((p) => p.status === "confirmed").length },
  { id: "received",  label: "Received",  count: PO_DATA.filter((p) => p.status === "received").length },
];

type POItem = { name: string; sku: string; qty: string; unitCost: string };

function CreatePOModal({ onClose }: { onClose: () => void }) {
  const [supplier, setSupplier] = useState("");
  const [items, setItems] = useState<POItem[]>([{ name: "", sku: "", qty: "", unitCost: "" }]);

  const addItem = () => setItems((prev) => [...prev, { name: "", sku: "", qty: "", unitCost: "" }]);
  const removeItem = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));
  const updateItem = (i: number, k: keyof POItem, v: string) =>
    setItems((prev) => prev.map((item, idx) => idx === i ? { ...item, [k]: v } : item));

  const total = items.reduce((sum, item) => {
    const qty = parseFloat(item.qty) || 0;
    const cost = parseFloat(item.unitCost) || 0;
    return sum + qty * cost;
  }, 0);

  const inputCls = "h-10 rounded-xl border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500 w-full";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-display text-lg font-bold text-foreground">Create Purchase Order</h2>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-muted-foreground hover:bg-muted/50 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Supplier</label>
            <select
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              className="h-11 w-full border border-input rounded-xl px-3 py-2 text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Select a supplier…</option>
              {SUPPLIER_OPTIONS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-foreground">Items</p>
              <button
                onClick={addItem}
                className="flex items-center gap-1.5 text-xs text-brand-500 hover:text-brand-600 font-medium transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Add Item
              </button>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 px-0.5">
                <p className="col-span-4 text-xs text-muted-foreground">Product</p>
                <p className="col-span-2 text-xs text-muted-foreground">SKU</p>
                <p className="col-span-2 text-xs text-muted-foreground">Qty</p>
                <p className="col-span-3 text-xs text-muted-foreground">Unit Cost</p>
                <p className="col-span-1" />
              </div>
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-4">
                    <input
                      className={inputCls}
                      placeholder="Product name"
                      value={item.name}
                      onChange={(e) => updateItem(i, "name", e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      className={cn(inputCls, "font-mono text-xs")}
                      placeholder="SKU"
                      value={item.sku}
                      onChange={(e) => updateItem(i, "sku", e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      className={inputCls}
                      placeholder="0"
                      type="number"
                      min="1"
                      value={item.qty}
                      onChange={(e) => updateItem(i, "qty", e.target.value)}
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      className={inputCls}
                      placeholder="0.00"
                      type="number"
                      step="0.01"
                      value={item.unitCost}
                      onChange={(e) => updateItem(i, "unitCost", e.target.value)}
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    {items.length > 1 && (
                      <button
                        onClick={() => removeItem(i)}
                        className="text-muted-foreground hover:text-danger-500 transition-colors"
                        aria-label="Remove item"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end items-center gap-2 pt-2 border-t border-border">
            <span className="text-sm text-muted-foreground">Total:</span>
            <span className="font-display text-lg font-bold text-foreground tabular-nums">{formatPHP(total)}</span>
          </div>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-xl bg-brand-500 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
          >
            Create PO
          </button>
        </div>
      </Card>
    </div>
  );
}

function POCard({ po }: { po: typeof PO_DATA[number] }) {
  const status = po.status as POStatus;
  return (
    <div className="relative flex rounded-2xl border border-border bg-card shadow-card overflow-hidden hover:shadow-card-md transition-shadow">
      <div className={cn("w-1 shrink-0", STATUS_BAR[status])} />
      <div className="flex-1 p-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-100 text-surface-600">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="font-mono font-bold text-foreground">{po.poNumber}</p>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                <Building2 className="h-3.5 w-3.5" />
                {po.supplier}
              </div>
            </div>
          </div>
          <span className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium shrink-0",
            STATUS_STYLE[status]
          )}>
            {STATUS_LABEL[status]}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Package className="h-3.5 w-3.5" />
            <span>{po.items} item{po.items !== 1 ? "s" : ""}</span>
            <span className="mx-1 text-border">·</span>
            <span className="font-semibold text-foreground tabular-nums">{formatPHP(po.total)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <CalendarClock className="h-3.5 w-3.5" />
            <span>Expected: {po.expectedDate ?? "Not scheduled"}</span>
          </div>
          <span className="text-xs text-muted-foreground">Created {po.createdAt}</span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
          {status === "draft" && (
            <>
              <button className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-3 py-2 text-xs font-medium text-white hover:bg-brand-600 transition-colors">
                <Send className="h-3.5 w-3.5" /> Send to Supplier
              </button>
              <button className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors">
                Edit
              </button>
              <button className="flex items-center gap-1.5 rounded-xl border border-danger-200 bg-danger-50 px-3 py-2 text-xs font-medium text-danger-600 hover:bg-danger-100 transition-colors">
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </>
          )}
          {(status === "sent" || status === "confirmed") && (
            <>
              <button className="flex items-center gap-1.5 rounded-xl bg-success-500 px-3 py-2 text-xs font-medium text-white hover:bg-success-600 transition-colors">
                <CheckCheck className="h-3.5 w-3.5" /> Mark as Received
              </button>
              <button className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors">
                <Eye className="h-3.5 w-3.5" /> View Details
              </button>
            </>
          )}
          {status === "received" && (
            <button className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors">
              <Eye className="h-3.5 w-3.5" /> View Receipt
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminPurchaseOrdersPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [showCreate, setShowCreate] = useState(false);

  const filtered = PO_DATA.filter((p) => activeTab === "all" || p.status === activeTab);

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {showCreate && <CreatePOModal onClose={() => setShowCreate(false)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-foreground">Purchase Orders</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
        >
          <Plus className="h-4 w-4" /> Create PO
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "shrink-0 flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
              activeTab === tab.id
                ? "border-brand-500 text-brand-600"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            <span className={cn(
              "rounded-full px-1.5 py-0.5 text-xs font-semibold tabular-nums",
              activeTab === tab.id ? "bg-brand-100 text-brand-600" : "bg-surface-100 text-muted-foreground"
            )}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* PO list */}
      <div className="space-y-3">
        {filtered.map((po) => <POCard key={po.id} po={po} />)}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center text-muted-foreground text-sm">No purchase orders in this status.</div>
      )}
    </div>
  );
}
