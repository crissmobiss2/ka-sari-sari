"use client";
import { useState } from "react";
import {
  Plus, X, Calendar, Tag, Pause, Pencil, Copy, Archive, Ban,
  Zap, TrendingUp, BarChart3,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const PROMOS_DATA = [
  { id: "promo-1", title: "Flash Sale: Beverages", description: "20% off all beverages today", type: "percentage", value: 20, minOrder: 500, category: "Beverages", startDate: "Jan 21, 2025 8:00 AM", endDate: "Jan 21, 2025 11:59 PM", status: "active", usageCount: 47, maxUsage: 100 },
  { id: "promo-2", title: "Snacks Bonanza", description: "10% off on bulk snack orders", type: "percentage", value: 10, minOrder: 1000, category: "Snacks & Chips", startDate: "Jan 20, 2025", endDate: "Jan 22, 2025", status: "active", usageCount: 23, maxUsage: undefined },
  { id: "promo-3", title: "Free Delivery Weekend", description: "PHP 80 delivery discount on orders 2000+", type: "fixed", value: 80, minOrder: 2000, category: "All", startDate: "Jan 22, 2025", endDate: "Jan 24, 2025", status: "scheduled", usageCount: 0, maxUsage: undefined },
  { id: "promo-4", title: "New Year Promo", description: "PHP 100 off on first 200 orders of the year", type: "fixed", value: 100, minOrder: 2500, category: "All", startDate: "Jan 1, 2025", endDate: "Jan 15, 2025", status: "ended", usageCount: 156, maxUsage: 200 },
];

type PromoStatus = "active" | "scheduled" | "ended";

const STATUS_STYLE: Record<PromoStatus, string> = {
  active:    "bg-success-50 text-success-700 border-success-500/25",
  scheduled: "bg-warning-50 text-warning-600 border-warning-500/25",
  ended:     "bg-surface-100 text-muted-foreground border-surface-200",
};

const STATUS_BAR: Record<PromoStatus, string> = {
  active:    "bg-brand-500",
  scheduled: "bg-warning-400",
  ended:     "bg-surface-300",
};

const TABS = [
  { id: "all",       label: "All",       count: PROMOS_DATA.length },
  { id: "active",    label: "Active",    count: PROMOS_DATA.filter((p) => p.status === "active").length },
  { id: "scheduled", label: "Scheduled", count: PROMOS_DATA.filter((p) => p.status === "scheduled").length },
  { id: "ended",     label: "Ended",     count: PROMOS_DATA.filter((p) => p.status === "ended").length },
];

const CATEGORIES = [
  "All", "Beverages", "Coffee", "Instant Noodles",
  "Snacks & Chips", "Canned Goods", "Condiments", "Personal Care", "Laundry",
];

function PromoCard({ promo }: { promo: typeof PROMOS_DATA[number] }) {
  const status = promo.status as PromoStatus;
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
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success-500" />
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
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-brand-50 border border-brand-200 px-3 py-1.5 text-sm font-bold text-brand-600">
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
            <div className="h-1.5 w-full rounded-full bg-surface-100 overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", status === "active" ? "bg-brand-500" : "bg-surface-300")}
                style={{ width: `${usagePct}%` }}
              />
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
          {status === "active" && (
            <>
              <button className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors">
                <Pause className="h-3.5 w-3.5" /> Pause
              </button>
              <button className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors">
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
              <button className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors">
                <Copy className="h-3.5 w-3.5" /> Duplicate
              </button>
            </>
          )}
          {status === "scheduled" && (
            <>
              <button className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors">
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
              <button className="flex items-center gap-1.5 rounded-xl border border-danger-200 bg-danger-50 px-3 py-2 text-xs font-medium text-danger-600 hover:bg-danger-100 transition-colors">
                <Ban className="h-3.5 w-3.5" /> Cancel
              </button>
            </>
          )}
          {status === "ended" && (
            <>
              <button className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors">
                <Copy className="h-3.5 w-3.5" /> Duplicate
              </button>
              <button className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors">
                <Archive className="h-3.5 w-3.5" /> Archive
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CreatePromoModal({ onClose }: { onClose: () => void }) {
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

  const set =
    <K extends keyof typeof form>(k: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

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
                      ? "bg-brand-500 text-white"
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
            Create Promotion
          </button>
        </div>
      </Card>
    </div>
  );
}

export default function AdminPromotionsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [showCreate, setShowCreate] = useState(false);

  const filtered = PROMOS_DATA.filter((p) => activeTab === "all" || p.status === activeTab);
  const activeCount = PROMOS_DATA.filter((p) => p.status === "active").length;
  const totalUses = PROMOS_DATA.reduce((sum, p) => sum + p.usageCount, 0);

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {showCreate && <CreatePromoModal onClose={() => setShowCreate(false)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-foreground">Promotions &amp; Deals</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
        >
          <Plus className="h-4 w-4" /> Create Promotion
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Zap, label: "Active Promos", value: activeCount.toString(), color: "text-brand-500", bg: "bg-brand-50" },
          { icon: BarChart3, label: "Total Uses", value: totalUses.toString(), color: "text-success-600", bg: "bg-success-50" },
          { icon: TrendingUp, label: "Revenue Impact", value: "~PHP 18K", color: "text-warning-600", bg: "bg-warning-50" },
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

      {/* Promo list */}
      <div className="space-y-3">
        {filtered.map((p) => <PromoCard key={p.id} promo={p} />)}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center text-muted-foreground text-sm">No promotions in this category.</div>
      )}
    </div>
  );
}
