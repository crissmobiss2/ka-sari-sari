"use client";
import { useState, useEffect } from "react";
import {
  Plus, X, Calendar, Tag, Pause, Pencil, Copy, Archive, Ban,
  Zap, TrendingUp, BarChart3,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PromoStatus = "active" | "scheduled" | "ended" | "paused" | "expired";

type Promo = {
  id: string;
  title: string;
  description: string;
  type: "percentage" | "fixed";
  value: number;
  minOrder: number;
  category: string;
  startDate: string;
  endDate: string;
  status: PromoStatus;
  usageCount: number;
  maxUsage: number | undefined;
};

const INITIAL_PROMOS: Promo[] = [
  { id: "promo-1", title: "Flash Sale: Beverages", description: "20% off all beverages today", type: "percentage", value: 20, minOrder: 500, category: "Beverages", startDate: "Jan 21, 2025 8:00 AM", endDate: "Jan 21, 2025 11:59 PM", status: "active", usageCount: 47, maxUsage: 100 },
  { id: "promo-2", title: "Snacks Bonanza", description: "10% off on bulk snack orders", type: "percentage", value: 10, minOrder: 1000, category: "Snacks & Chips", startDate: "Jan 20, 2025", endDate: "Jan 22, 2025", status: "active", usageCount: 23, maxUsage: undefined },
  { id: "promo-3", title: "Free Delivery Weekend", description: "PHP 80 delivery discount on orders 2000+", type: "fixed", value: 80, minOrder: 2000, category: "All", startDate: "Jan 22, 2025", endDate: "Jan 24, 2025", status: "scheduled", usageCount: 0, maxUsage: undefined },
  { id: "promo-4", title: "New Year Promo", description: "PHP 100 off on first 200 orders of the year", type: "fixed", value: 100, minOrder: 2500, category: "All", startDate: "Jan 1, 2025", endDate: "Jan 15, 2025", status: "ended", usageCount: 156, maxUsage: 200 },
];

const AVG_ORDER_VALUE = 800;

const STATUS_STYLE: Record<PromoStatus, string> = {
  active:    "bg-success-50 dark:bg-success-500/10 text-success-700 dark:text-foreground border-success-500/25",
  scheduled: "bg-warning-50 dark:bg-warning-500/10 text-warning-600 dark:text-foreground border-warning-500/25",
  ended:     "bg-surface-100 dark:bg-surface-800 text-muted-foreground border-surface-200",
  paused:    "bg-surface-100 dark:bg-surface-800 text-muted-foreground border-surface-200",
  expired:   "bg-surface-100 dark:bg-surface-800 text-muted-foreground border-surface-200",
};

const STATUS_BAR: Record<PromoStatus, string> = {
  active:    "bg-brand-700 dark:bg-brand-500",
  scheduled: "bg-warning-700 dark:bg-warning-500",
  ended:     "bg-surface-300",
  paused:    "bg-surface-300",
  expired:   "bg-surface-300",
};

const CATEGORIES = [
  "All", "Beverages", "Coffee", "Instant Noodles",
  "Snacks & Chips", "Canned Goods", "Condiments", "Personal Care", "Laundry",
];

type PromoCardProps = {
  promo: Promo;
  onPause: (id: string) => void;
  onEdit: (promo: Promo) => void;
  onDuplicate: (id: string) => void;
  onArchiveOrCancel: (id: string) => void;
};

function PromoCard({ promo, onPause, onEdit, onDuplicate, onArchiveOrCancel }: PromoCardProps) {
  const status = promo.status;
  const discountLabel = promo.type === "percentage" ? `${promo.value}% off` : `PHP ${promo.value} off`;
  const usagePct = promo.maxUsage ? Math.round((promo.usageCount / promo.maxUsage) * 100) : null;

  return (
    <div className="relative flex rounded-2xl border border-border bg-card shadow-card overflow-hidden hover:shadow-card-md transition-shadow">
      <div className={cn("w-1.5 shrink-0", STATUS_BAR[status])} />
      <div className="flex-1 p-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            {status === "active" && (
              <span className="relative flex h-2.5 w-2.5 shrink-0" aria-label="Live">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success-700 dark:bg-success-500" />
              </span>
            )}
            <p className="font-semibold text-foreground">{promo.title}</p>
          </div>
          <span className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium shrink-0 capitalize",
            STATUS_STYLE[status]
          )}>
            {status}
          </span>
        </div>

        <p className="text-sm text-muted-foreground mt-1.5">{promo.description}</p>

        <div className="mt-4 flex flex-wrap gap-3 items-center">
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-brand-50 dark:bg-brand-500/10 border border-brand-200 px-3 py-1.5 text-sm font-bold text-brand-600 dark:text-foreground">
            <Tag className="h-3.5 w-3.5" /> {discountLabel}
          </span>
          <span className="text-xs text-muted-foreground">
            Min. order: PHP {promo.minOrder.toLocaleString("en-PH")}
          </span>
          <span className="text-xs text-muted-foreground">Category: {promo.category}</span>
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>{promo.startDate} — {promo.endDate}</span>
        </div>

        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="tabular-nums">
              {promo.usageCount}{promo.maxUsage ? ` / ${promo.maxUsage}` : ""} uses
            </span>
            {usagePct !== null && <span className="tabular-nums">{usagePct}%</span>}
          </div>
          {promo.maxUsage && (
            <div className="h-1.5 w-full rounded-full bg-surface-100 dark:bg-surface-800 overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", status === "active" ? "bg-brand-700 dark:bg-brand-500" : "bg-surface-300")}
                style={{ width: `${usagePct}%` }}
              />
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
          {status === "active" && (
            <>
              <button
                onClick={() => onPause(promo.id)}
                className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
              >
                <Pause className="h-3.5 w-3.5" /> Pause
              </button>
              <button
                onClick={() => onEdit(promo)}
                className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
              <button
                onClick={() => onDuplicate(promo.id)}
                className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
              >
                <Copy className="h-3.5 w-3.5" /> Duplicate
              </button>
            </>
          )}
          {status === "scheduled" && (
            <>
              <button
                onClick={() => onEdit(promo)}
                className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
              <button
                onClick={() => onArchiveOrCancel(promo.id)}
                className="flex items-center gap-1.5 rounded-xl border border-danger-200 bg-danger-50 dark:bg-danger-500/10 px-3 py-2 text-xs font-medium text-danger-600 dark:text-foreground hover:bg-danger-100 transition-colors"
              >
                <Ban className="h-3.5 w-3.5" /> Cancel
              </button>
            </>
          )}
          {(status === "ended" || status === "paused" || status === "expired") && (
            <>
              <button
                onClick={() => onDuplicate(promo.id)}
                className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
              >
                <Copy className="h-3.5 w-3.5" /> Duplicate
              </button>
              <button
                onClick={() => onArchiveOrCancel(promo.id)}
                className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
              >
                <Archive className="h-3.5 w-3.5" /> Archive
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

type CreatePromoModalProps = {
  onClose: () => void;
  onSave: (promo: Omit<Promo, "id" | "status" | "usageCount">) => void;
};

function CreatePromoModal({ onClose, onSave }: CreatePromoModalProps) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    discountType: "percentage" as "percentage" | "fixed",
    value: "",
    minOrder: "",
    category: "All",
    startDate: "",
    endDate: "",
    maxUsage: "",
  });
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const set =
    <K extends keyof typeof form>(k: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  function handleSubmit() {
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!form.value.trim() || isNaN(Number(form.value)) || Number(form.value) <= 0) {
      setError("A valid discount value is required.");
      return;
    }
    setError("");
    onSave({
      title: form.title.trim(),
      description: form.description.trim(),
      type: form.discountType,
      value: Number(form.value),
      minOrder: form.minOrder ? Number(form.minOrder) : 0,
      category: form.category,
      startDate: form.startDate || "—",
      endDate: form.endDate || "—",
      maxUsage: form.maxUsage ? Number(form.maxUsage) : undefined,
    });
    setSaved(true);
    setTimeout(() => onClose(), 800);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-display text-lg font-bold text-foreground">Create Promotion</h2>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-muted-foreground hover:bg-muted/50 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <Input
            label="Title"
            placeholder="e.g. Flash Sale: Beverages"
            value={form.title}
            onChange={set("title")}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Description</label>
            <textarea
              rows={2}
              placeholder="Short description of the promotion"
              value={form.description}
              onChange={set("description")}
              className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Discount Type</label>
            <div className="flex rounded-xl border border-border overflow-hidden">
              {(["percentage", "fixed"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, discountType: t }))}
                  className={cn(
                    "flex-1 py-2.5 text-sm font-medium transition-colors",
                    form.discountType === t
                      ? "bg-brand-700 dark:bg-brand-500 text-white"
                      : "text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  {t === "percentage" ? "Percentage (%)" : "Fixed (PHP)"}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={form.discountType === "percentage" ? "Discount %" : "Discount Amount (PHP)"}
              type="number"
              placeholder={form.discountType === "percentage" ? "20" : "80"}
              value={form.value}
              onChange={set("value")}
            />
            <Input
              label="Min. Order (PHP)"
              type="number"
              placeholder="500"
              value={form.minOrder}
              onChange={set("minOrder")}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Category</label>
            <select
              value={form.category}
              onChange={set("category")}
              className="h-11 w-full border border-input rounded-xl px-3 py-2 text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start Date" type="date" value={form.startDate} onChange={set("startDate")} />
            <Input label="End Date" type="date" value={form.endDate} onChange={set("endDate")} />
          </div>
          <Input
            label="Max Usage (optional)"
            type="number"
            placeholder="Leave blank for unlimited"
            value={form.maxUsage}
            onChange={set("maxUsage")}
          />
          {error && <p className="text-xs text-danger-600 dark:text-danger-500">{error}</p>}
          {saved && <p className="text-xs text-success-700 dark:text-success-500">Promotion created successfully.</p>}
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
            className="flex-1 rounded-xl bg-brand-700 dark:bg-brand-500 py-2.5 text-sm font-medium text-white hover:bg-brand-800 transition-colors"
          >
            Create Promotion
          </button>
        </div>
      </Card>
    </div>
  );
}

type EditPromoModalProps = {
  promo: Promo;
  onClose: () => void;
  onSave: (updated: Promo) => void;
};

function EditPromoModal({ promo, onClose, onSave }: EditPromoModalProps) {
  const [form, setForm] = useState({
    title: promo.title,
    description: promo.description,
    discountType: promo.type,
    value: promo.value.toString(),
    minOrder: promo.minOrder.toString(),
    category: promo.category,
    startDate: promo.startDate,
    endDate: promo.endDate,
    maxUsage: promo.maxUsage !== undefined ? promo.maxUsage.toString() : "",
  });
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const set =
    <K extends keyof typeof form>(k: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  function handleSave() {
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!form.value.trim() || isNaN(Number(form.value)) || Number(form.value) <= 0) {
      setError("A valid discount value is required.");
      return;
    }
    setError("");
    onSave({
      ...promo,
      title: form.title.trim(),
      description: form.description.trim(),
      type: form.discountType,
      value: Number(form.value),
      minOrder: form.minOrder ? Number(form.minOrder) : 0,
      category: form.category,
      startDate: form.startDate || promo.startDate,
      endDate: form.endDate || promo.endDate,
      maxUsage: form.maxUsage ? Number(form.maxUsage) : undefined,
    });
    setSaved(true);
    setTimeout(() => onClose(), 800);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-display text-lg font-bold text-foreground">Edit Promotion</h2>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-muted-foreground hover:bg-muted/50 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <Input
            label="Title"
            placeholder="e.g. Flash Sale: Beverages"
            value={form.title}
            onChange={set("title")}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Description</label>
            <textarea
              rows={2}
              placeholder="Short description of the promotion"
              value={form.description}
              onChange={set("description")}
              className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Discount Type</label>
            <div className="flex rounded-xl border border-border overflow-hidden">
              {(["percentage", "fixed"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, discountType: t }))}
                  className={cn(
                    "flex-1 py-2.5 text-sm font-medium transition-colors",
                    form.discountType === t
                      ? "bg-brand-700 dark:bg-brand-500 text-white"
                      : "text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  {t === "percentage" ? "Percentage (%)" : "Fixed (PHP)"}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={form.discountType === "percentage" ? "Discount %" : "Discount Amount (PHP)"}
              type="number"
              placeholder={form.discountType === "percentage" ? "20" : "80"}
              value={form.value}
              onChange={set("value")}
            />
            <Input
              label="Min. Order (PHP)"
              type="number"
              placeholder="500"
              value={form.minOrder}
              onChange={set("minOrder")}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Category</label>
            <select
              value={form.category}
              onChange={set("category")}
              className="h-11 w-full border border-input rounded-xl px-3 py-2 text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start Date" type="date" value={form.startDate} onChange={set("startDate")} />
            <Input label="End Date" type="date" value={form.endDate} onChange={set("endDate")} />
          </div>
          <Input
            label="Max Usage (optional)"
            type="number"
            placeholder="Leave blank for unlimited"
            value={form.maxUsage}
            onChange={set("maxUsage")}
          />
          {error && <p className="text-xs text-danger-600 dark:text-danger-500">{error}</p>}
          {saved && <p className="text-xs text-success-700 dark:text-success-500">Promotion updated successfully.</p>}
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 rounded-xl bg-brand-700 dark:bg-brand-500 py-2.5 text-sm font-medium text-white hover:bg-brand-800 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </Card>
    </div>
  );
}

export default function AdminPromotionsPage() {
  const [promos, setPromos] = useState<Promo[]>(INITIAL_PROMOS);

  useEffect(() => {
    fetch("/api/promotions")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (Array.isArray(data?.promotions) && data.promotions.length > 0) {
          setPromos(data.promotions);
        }
      })
      .catch(() => {});
  }, []);
  const [activeTab, setActiveTab] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promo | null>(null);

  const activeCount = promos.filter((p) => p.status === "active").length;
  const totalUses = promos.reduce((sum, p) => sum + p.usageCount, 0);
  const revenueImpact = promos
    .filter((p) => p.status === "active")
    .reduce((sum, p) => {
      const discountPerOrder =
        p.type === "percentage"
          ? (p.value / 100) * AVG_ORDER_VALUE
          : p.value;
      return sum + discountPerOrder * p.usageCount;
    }, 0);
  const revenueImpactLabel =
    revenueImpact >= 1000
      ? `~PHP ${Math.round(revenueImpact / 1000)}K`
      : `PHP ${Math.round(revenueImpact)}`;

  const tabDefs = [
    { id: "all",       label: "All",       count: promos.length },
    { id: "active",    label: "Active",    count: promos.filter((p) => p.status === "active").length },
    { id: "scheduled", label: "Scheduled", count: promos.filter((p) => p.status === "scheduled").length },
    { id: "ended",     label: "Ended",     count: promos.filter((p) => p.status === "ended").length },
  ];

  const filtered = promos.filter((p) => activeTab === "all" || p.status === activeTab);

  function handleCreate(data: Omit<Promo, "id" | "status" | "usageCount">) {
    const newPromo: Promo = {
      ...data,
      id: `promo-${typeof crypto !== "undefined" ? crypto.randomUUID() : Date.now().toString(36)}`,
      status: "active",
      usageCount: 0,
    };
    setPromos((prev) => [newPromo, ...prev]);
    fetch("/api/promotions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPromo),
    }).catch(() => {});
  }

  function handlePause(id: string) {
    setPromos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "paused" } : p))
    );
    fetch(`/api/promotions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "paused" }),
    }).catch(() => {});
  }

  function handleEdit(promo: Promo) {
    setEditingPromo(promo);
  }

  function handleEditSave(updated: Promo) {
    setPromos((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
    setEditingPromo(null);
    fetch(`/api/promotions/${updated.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    }).catch(() => {});
  }

  function handleDuplicate(id: string) {
    const original = promos.find((p) => p.id === id);
    if (!original) return;
    const copy: Promo = {
      ...original,
      id: `promo-${typeof crypto !== "undefined" ? crypto.randomUUID() : Date.now().toString(36)}`,
      title: `${original.title} (Copy)`,
      usageCount: 0,
      status: "scheduled",
    };
    setPromos((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
    fetch("/api/promotions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(copy),
    }).catch(() => {});
  }

  function handleArchiveOrCancel(id: string) {
    setPromos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "expired" } : p))
    );
    fetch(`/api/promotions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "expired" }),
    }).catch(() => {});
  }

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {showCreate && (
        <CreatePromoModal
          onClose={() => setShowCreate(false)}
          onSave={(data) => {
            handleCreate(data);
            setShowCreate(false);
          }}
        />
      )}
      {editingPromo && (
        <EditPromoModal
          promo={editingPromo}
          onClose={() => setEditingPromo(null)}
          onSave={handleEditSave}
        />
      )}

      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-foreground">Promotions &amp; Deals</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-xl bg-brand-700 dark:bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-800 transition-colors"
        >
          <Plus className="h-4 w-4" /> Create Promotion
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Zap, label: "Active Promos", value: activeCount.toString(), color: "text-brand-700 dark:text-brand-400", bg: "bg-brand-50 dark:bg-brand-500/10" },
          { icon: BarChart3, label: "Total Uses", value: totalUses.toString(), color: "text-success-700 dark:text-foreground", bg: "bg-success-50 dark:bg-success-500/10" },
          { icon: TrendingUp, label: "Revenue Impact", value: revenueImpactLabel, color: "text-warning-600 dark:text-foreground", bg: "bg-warning-50 dark:bg-warning-500/10" },
        ].map((s) => (
          <Card key={s.label} className="p-4 flex items-center gap-4">
            <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", s.bg, s.color)}>
              <s.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-xl font-bold text-foreground tabular-nums">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex gap-1 overflow-x-auto scrollbar-hide border-b border-border">
        {tabDefs.map((tab) => (
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
              activeTab === tab.id ? "bg-brand-100 text-brand-600" : "bg-surface-100 dark:bg-surface-800 text-muted-foreground"
            )}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((p) => (
          <PromoCard
            key={p.id}
            promo={p}
            onPause={handlePause}
            onEdit={handleEdit}
            onDuplicate={handleDuplicate}
            onArchiveOrCancel={handleArchiveOrCancel}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center text-muted-foreground text-sm">No promotions in this category.</div>
      )}
    </div>
  );
}
