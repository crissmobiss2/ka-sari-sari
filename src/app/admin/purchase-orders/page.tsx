"use client";
import { useState, useEffect } from "react";
import {
  Plus, X, Send, CheckCheck, Eye, Trash2, FileText,
  Package, Building2, CalendarClock, Zap, CheckCircle2, Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn, formatPHP } from "@/lib/utils";

const PO_DATA_INITIAL = [
  { id: "po-001", poNumber: "PO-2025-0089", supplier: "PhilBev Distribution Inc.", status: "confirmed", items: 2, total: 25440, expectedDate: "Tomorrow, Jan 22", createdAt: "Jan 21, 2025", receivedAt: undefined as string | undefined },
  { id: "po-002", poNumber: "PO-2025-0088", supplier: "Lucky Me Foods Corp", status: "received", items: 1, total: 4800, expectedDate: "Jan 19, 2025", createdAt: "Jan 18, 2025", receivedAt: "Jan 19, 2025" as string | undefined },
  { id: "po-003", poNumber: "PO-2025-0087", supplier: "P&G Philippines", status: "sent", items: 2, total: 17280, expectedDate: "Jan 24, 2025", createdAt: "Jan 20, 2025", receivedAt: undefined as string | undefined },
  { id: "po-004", poNumber: "PO-2025-0086", supplier: "Del Monte Philippines", status: "draft", items: 3, total: 12600, expectedDate: null as string | null, createdAt: "Jan 21, 2025", receivedAt: undefined as string | undefined },
];

const SUPPLIER_OPTIONS = [
  "PhilBev Distribution Inc.",
  "Lucky Me Foods Corp",
  "Del Monte Philippines",
  "Procter & Gamble Philippines",
  "Mega Global Corp",
];

type POStatus = "draft" | "sent" | "confirmed" | "received" | "partial";

type PORecord = {
  id: string;
  poNumber: string;
  supplier: string;
  status: string;
  items: number;
  lineItems?: POItem[];
  total: number;
  expectedDate: string | null;
  createdAt: string;
  receivedAt: string | undefined;
};

const STATUS_STYLE: Record<POStatus, string> = {
  draft:     "bg-surface-100 dark:bg-surface-800 text-muted-foreground border-surface-200",
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

type POItem = { name: string; sku: string; qty: string; unitCost: string };

type AutoPOEntry = {
  supplier: string;
  reason: string;
  items: number;
  total: number;
  urgency: "critical" | "high" | "medium";
};

const AUTO_POS: AutoPOEntry[] = [
  {
    supplier: "PhilBev Distribution Inc.",
    reason: "Coca-Cola (142 units â†’ needs 168 in 14 days)",
    items: 2,
    total: 15840,
    urgency: "high",
  },
  {
    supplier: "P&G Philippines",
    reason: "Safeguard (34 units â†’ needs 67 in 14 days, critically low)",
    items: 1,
    total: 8640,
    urgency: "critical",
  },
  {
    supplier: "NestlÃ© Philippines",
    reason: "Milo Active Go (23 units â†’ needs 51 in 14 days)",
    items: 1,
    total: 11520,
    urgency: "critical",
  },
  {
    supplier: "Lucky Me Foods Corp",
    reason: "Lucky Me! Pancit Canton (89 units â†’ needs 112 in 14 days)",
    items: 3,
    total: 6720,
    urgency: "medium",
  },
];

const URGENCY_BADGE: Record<AutoPOEntry["urgency"], string> = {
  critical: "bg-danger-50 text-danger-600 border-danger-200",
  high:     "bg-brand-50 text-brand-600 border-brand-200",
  medium:   "bg-warning-50 text-warning-600 border-warning-200",
};

const URGENCY_LABEL: Record<AutoPOEntry["urgency"], string> = {
  critical: "Critical",
  high:     "High",
  medium:   "Medium",
};

// â”€â”€â”€ Auto-Generate POs Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface AutoPOModalProps {
  onClose: () => void;
  onViewDrafts: () => void;
}

function AutoPOModal({ onClose, onViewDrafts }: AutoPOModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedPOs, setSelectedPOs] = useState<Set<number>>(
    new Set(AUTO_POS.map((_, i) => i))
  );
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (step !== 1) return;
    const timer = setTimeout(() => setStep(2), 1500);
    return () => clearTimeout(timer);
  }, [step]);

  const togglePO = (index: number) => {
    setSelectedPOs((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const selectedCount = selectedPOs.size;
  const selectedTotal = Array.from(selectedPOs).reduce(
    (sum, i) => sum + AUTO_POS[i].total,
    0
  );

  const handleCreate = () => {
    setIsCreating(true);
    setTimeout(() => {
      setIsCreating(false);
      setStep(3);
    }, 800);
  };

  const handleViewDrafts = () => {
    onViewDrafts();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="max-w-lg w-full rounded-2xl bg-card shadow-xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-xl p-1.5 text-muted-foreground hover:bg-muted/50 transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {step === 1 && (
          <div className="flex flex-col items-center py-8 gap-5 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
              <Loader2 className="h-7 w-7 animate-spin" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">
                Analyzing inventoryâ€¦
              </h2>
              <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                <p>Scanning 122 products across 12 categoriesâ€¦</p>
                <p>Checking supplier availabilityâ€¦</p>
                <p>Calculating reorder pointsâ€¦</p>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">
                Generated PO recommendations
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                AI detected {AUTO_POS.length} items needing restocking. Select which drafts to create.
              </p>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {AUTO_POS.map((po, i) => (
                <label
                  key={i}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-colors",
                    selectedPOs.has(i)
                      ? "border-brand-300 bg-brand-50/50"
                      : "border-border bg-card hover:bg-muted/30"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selectedPOs.has(i)}
                    onChange={() => togglePO(i)}
                    className="mt-0.5 h-4 w-4 rounded accent-brand-500 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-sm text-foreground leading-tight">
                        {po.supplier}
                      </p>
                      <span className={cn(
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium shrink-0",
                        URGENCY_BADGE[po.urgency]
                      )}>
                        {URGENCY_LABEL[po.urgency]}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground italic mt-0.5 leading-snug">
                      {po.reason}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                      <Package className="h-3 w-3" />
                      <span>{po.items} item{po.items !== 1 ? "s" : ""}</span>
                      <span className="text-border">Â·</span>
                      <span className="font-semibold text-foreground tabular-nums">
                        {formatPHP(po.total)}
                      </span>
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-between rounded-xl bg-surface-50 border border-border px-4 py-3 text-sm">
              <span className="text-muted-foreground">
                <span className="font-semibold text-surface-900">{selectedCount} PO{selectedCount !== 1 ? "s" : ""}</span> selected
              </span>
              <span className="text-muted-foreground">
                Total value:{" "}
                <span className="font-bold text-foreground tabular-nums">
                  {formatPHP(selectedTotal)}
                </span>
              </span>
            </div>

            <button
              onClick={handleCreate}
              disabled={selectedCount === 0 || isCreating}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creatingâ€¦
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Create {selectedCount} Draft PO{selectedCount !== 1 ? "s" : ""}
                </>
              )}
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col items-center py-8 gap-5 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success-50 text-success-500">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">
                {selectedCount} Draft PO{selectedCount !== 1 ? "s" : ""} created successfully
              </h2>
              <p className="text-sm text-muted-foreground mt-1.5 max-w-xs mx-auto">
                They appear in your Drafts tab. Review and send to suppliers.
              </p>
            </div>
            <div className="flex gap-3 w-full pt-2">
              <button
                onClick={handleViewDrafts}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
              >
                View Drafts
              </button>
              <button
                onClick={onClose}
                className="flex-1 rounded-xl bg-brand-500 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// â”€â”€â”€ Create PO Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface CreatePOModalProps {
  onClose: () => void;
  onSubmit: (supplier: string, items: POItem[], total: number) => void;
  initialSupplier?: string;
  initialItems?: POItem[];
  title?: string;
  submitLabel?: string;
}

function CreatePOModal({ onClose, onSubmit, initialSupplier = "", initialItems, title = "Create Purchase Order", submitLabel = "Create PO" }: CreatePOModalProps) {
  const [supplier, setSupplier] = useState(initialSupplier);
  const [items, setItems] = useState<POItem[]>(
    initialItems ?? [{ name: "", sku: "", qty: "", unitCost: "" }]
  );
  const [validationError, setValidationError] = useState("");

  const addItem = () => setItems((prev) => [...prev, { name: "", sku: "", qty: "", unitCost: "" }]);
  const removeItem = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));
  const updateItem = (i: number, k: keyof POItem, v: string) =>
    setItems((prev) => prev.map((item, idx) => idx === i ? { ...item, [k]: v } : item));

  const total = items.reduce((sum, item) => {
    const qty = parseFloat(item.qty) || 0;
    const cost = parseFloat(item.unitCost) || 0;
    return sum + qty * cost;
  }, 0);

  const handleSubmit = () => {
    if (!supplier) {
      setValidationError("Please select a supplier.");
      return;
    }
    const filledItems = items.filter((item) => item.name.trim() !== "");
    if (filledItems.length === 0) {
      setValidationError("Please add at least one item with a product name.");
      return;
    }
    setValidationError("");
    onSubmit(supplier, items, total);
  };

  const inputCls = "h-10 rounded-xl border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500 w-full";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-display text-lg font-bold text-foreground">{title}</h2>
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
              <option value="">Select a supplierâ€¦</option>
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

          {validationError && (
            <p className="text-xs text-danger-600">{validationError}</p>
          )}

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
            onClick={handleSubmit}
            className="flex-1 rounded-xl bg-brand-500 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
          >
            {submitLabel}
          </button>
        </div>
      </Card>
    </div>
  );
}

// â”€â”€â”€ PO Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface POCardProps {
  po: PORecord;
  onSend: (id: string) => void;
  onEdit: (po: PORecord) => void;
  onDelete: (id: string) => void;
  confirmDeleteId: string | null;
  onConfirmDelete: (id: string) => void;
  onCancelDelete: () => void;
}

function POCard({ po, onSend, onEdit, onDelete, confirmDeleteId, onConfirmDelete, onCancelDelete }: POCardProps) {
  const status = po.status as POStatus;
  const isConfirmingDelete = confirmDeleteId === po.id;
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
            <span className="mx-1 text-border">Â·</span>
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
              {isConfirmingDelete ? (
                <>
                  <span className="flex items-center text-xs text-danger-600 font-medium">Delete this PO?</span>
                  <button
                    onClick={() => onDelete(po.id)}
                    className="flex items-center gap-1.5 rounded-xl bg-danger-500 px-3 py-2 text-xs font-medium text-white hover:bg-danger-600 transition-colors"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={onCancelDelete}
                    className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => onSend(po.id)}
                    className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-3 py-2 text-xs font-medium text-white hover:bg-brand-600 transition-colors"
                  >
                    <Send className="h-3.5 w-3.5" /> Send to Supplier
                  </button>
                  <button
                    onClick={() => onEdit(po)}
                    className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
                  >
                    Edit PO
                  </button>
                  <button
                    onClick={() => onConfirmDelete(po.id)}
                    className="flex items-center gap-1.5 rounded-xl border border-danger-200 bg-danger-50 px-3 py-2 text-xs font-medium text-danger-600 hover:bg-danger-100 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </>
              )}
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

// â”€â”€â”€ Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function AdminPurchaseOrdersPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [showAutoModal, setShowAutoModal] = useState(false);
  const [poList, setPoList] = useState<PORecord[]>(PO_DATA_INITIAL);

  useEffect(() => {
    fetch("/api/admin/purchase-orders")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (Array.isArray(data?.purchaseOrders) && data.purchaseOrders.length > 0) {
          setPoList(data.purchaseOrders);
        }
      })
      .catch(() => {});
  }, []);
  const [poCounter, setPoCounter] = useState(90);
  const [toast, setToast] = useState<string | null>(null);
  const [editingPO, setEditingPO] = useState<PORecord | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const tabs = [
    { id: "all",       label: "All",       count: poList.length },
    { id: "draft",     label: "Draft",     count: poList.filter((p) => p.status === "draft").length },
    { id: "sent",      label: "Sent",      count: poList.filter((p) => p.status === "sent").length },
    { id: "confirmed", label: "Confirmed", count: poList.filter((p) => p.status === "confirmed").length },
    { id: "received",  label: "Received",  count: poList.filter((p) => p.status === "received").length },
  ];

  const filtered = poList.filter((p) => activeTab === "all" || p.status === activeTab);

  const handleCreateSubmit = (supplier: string, items: POItem[], total: number) => {
    const newCounter = poCounter + 1;
    setPoCounter(newCounter);
    const paddedNum = String(newCounter).padStart(4, "0");
    const today = new Date();
    const month = today.toLocaleString("en-US", { month: "short" });
    const day = today.getDate();
    const year = today.getFullYear();
    const dateStr = `${month} ${day}, ${year}`;
    const validItems = items.filter((item) => item.name.trim() !== "");
    const newPO: PORecord = {
      id: `po-new-${paddedNum}`,
      poNumber: `PO-2025-${paddedNum}`,
      supplier,
      status: "draft",
      items: validItems.length,
      lineItems: validItems,
      total,
      expectedDate: null,
      createdAt: dateStr,
      receivedAt: undefined,
    };
    setPoList((prev) => [newPO, ...prev]);
    setShowCreate(false);
    fetch("/api/admin/purchase-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPO),
    }).catch(() => {});
  };

  const handleSend = (id: string) => {
    setPoList((prev) =>
      prev.map((po) => po.id === id ? { ...po, status: "sent" } : po)
    );
    showToast("PO sent to supplier");
    fetch(`/api/admin/purchase-orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "sent" }),
    }).catch(() => {});
  };

  const handleEditOpen = (po: PORecord) => {
    setEditingPO(po);
  };

  const handleEditSubmit = (supplier: string, items: POItem[], total: number) => {
    if (!editingPO) return;
    const validItems = items.filter((item) => item.name.trim() !== "");
    setPoList((prev) =>
      prev.map((po) =>
        po.id === editingPO.id
          ? {
              ...po,
              supplier,
              items: validItems.length,
              lineItems: validItems,
              total,
            }
          : po
      )
    );
    setEditingPO(null);
  };

  const handleConfirmDelete = (id: string) => {
    setConfirmDeleteId(id);
  };

  const handleDelete = (id: string) => {
    setPoList((prev) => prev.filter((po) => po.id !== id));
    setConfirmDeleteId(null);
  };

  const handleCancelDelete = () => {
    setConfirmDeleteId(null);
  };

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {showCreate && (
        <CreatePOModal
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreateSubmit}
        />
      )}
      {editingPO && (
        <CreatePOModal
          onClose={() => setEditingPO(null)}
          onSubmit={handleEditSubmit}
          initialSupplier={editingPO.supplier}
          initialItems={editingPO.lineItems ?? [{ name: "", sku: "", qty: "", unitCost: "" }]}
          title="Edit Purchase Order"
          submitLabel="Save Changes"
        />
      )}
      {showAutoModal && (
        <AutoPOModal
          onClose={() => setShowAutoModal(false)}
          onViewDrafts={() => setActiveTab("draft")}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-xl bg-foreground px-5 py-3 text-sm font-medium text-background shadow-lg">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-foreground">Purchase Orders</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAutoModal(true)}
            className="flex items-center gap-2 rounded-xl border border-brand-300 bg-brand-50 px-4 py-2.5 text-sm font-medium text-brand-600 hover:bg-brand-100 transition-colors"
          >
            <Zap className="h-4 w-4" /> Auto-Generate POs
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
          >
            <Plus className="h-4 w-4" /> Create PO
          </button>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide border-b border-border">
        {tabs.map((tab) => (
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
              activeTab === tab.id ? "bg-brand-100 dark:bg-brand-700 text-brand-600 dark:text-white" : "bg-surface-100 dark:bg-surface-800 text-muted-foreground"
            )}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* PO list */}
      <div className="space-y-3">
        {filtered.map((po) => (
          <POCard
            key={po.id}
            po={po}
            onSend={handleSend}
            onEdit={handleEditOpen}
            onDelete={handleDelete}
            confirmDeleteId={confirmDeleteId}
            onConfirmDelete={handleConfirmDelete}
            onCancelDelete={handleCancelDelete}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center text-muted-foreground text-sm">No purchase orders in this status.</div>
      )}
    </div>
  );
}
