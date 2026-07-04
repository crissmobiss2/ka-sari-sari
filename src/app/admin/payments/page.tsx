"use client";
import React, { useState, useMemo } from "react";
import {
  Download, Filter, Search, TrendingUp, TrendingDown,
  AlertCircle, CheckCircle2, Clock, XCircle, ArrowUpRight,
  CreditCard, Smartphone, Banknote, Building2, Package
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPHP, formatDate } from "@/lib/utils";

type PaymentStatus = "completed" | "pending" | "failed" | "processing";
type PaymentMethod = "gcash" | "maya" | "bank" | "cash" | "cod" | "card" | "instapay" | "qrph" | "shopeepay" | "palawan" | "cebuana" | "terms" | "wallet";

interface Transaction {
  id: string;
  orderId: string;
  store: string;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  reference?: string;
  date: string;
  notes?: string;
}

const MOCK_TXS: Transaction[] = [
  { id: "txn-001", orderId: "ORD-2025001", store: "Santos Sari-Sari", method: "gcash", amount: 4850, status: "completed", reference: "GC-20250101-001", date: "2025-12-01T08:23:00Z" },
  { id: "txn-002", orderId: "ORD-2025002", store: "Dela Cruz Store", method: "cod", amount: 2300, status: "pending", date: "2025-12-01T09:10:00Z", notes: "Driver to collect on delivery" },
  { id: "txn-003", orderId: "ORD-2025003", store: "Reyes General Mdse", method: "bank", amount: 12500, status: "pending", reference: "REF pending", date: "2025-12-01T10:05:00Z", notes: "BPI transfer, awaiting confirmation" },
  { id: "txn-004", orderId: "ORD-2025004", store: "Garcia Grocery", method: "maya", amount: 3700, status: "completed", reference: "MY-20250101-004", date: "2025-12-01T11:45:00Z" },
  { id: "txn-005", orderId: "ORD-2025005", store: "Lim Variety Store", method: "card", amount: 8200, status: "completed", reference: "CARD-XXXX-1234", date: "2025-12-01T12:30:00Z" },
  { id: "txn-006", orderId: "ORD-2025006", store: "Mendoza Tindahan", method: "gcash", amount: 1950, status: "failed", reference: "GC-FAILED", date: "2025-12-01T13:00:00Z", notes: "Payment timeout" },
  { id: "txn-007", orderId: "ORD-2025007", store: "Torres Mini Mart", method: "instapay", amount: 6400, status: "completed", reference: "IP-202501-007", date: "2025-12-01T14:20:00Z" },
  { id: "txn-008", orderId: "ORD-2025008", store: "Flores Sari-Sari", method: "terms", amount: 15000, status: "processing", date: "2025-12-01T15:00:00Z", notes: "30-day credit terms approved" },
  { id: "txn-009", orderId: "ORD-2025009", store: "Cruz Convenience", method: "qrph", amount: 2850, status: "completed", reference: "QR-20250101-009", date: "2025-12-02T08:00:00Z" },
  { id: "txn-010", orderId: "ORD-2025010", store: "Ramos Store", method: "shopeepay", amount: 1200, status: "completed", reference: "SP-20250102-010", date: "2025-12-02T09:30:00Z" },
  { id: "txn-011", orderId: "ORD-2025011", store: "Alvarez Tindahan", method: "cod", amount: 3600, status: "completed", date: "2025-12-02T10:15:00Z", notes: "Driver collected" },
  { id: "txn-012", orderId: "ORD-2025012", store: "Bautista Store", method: "palawan", amount: 900, status: "completed", reference: "PX-00129843", date: "2025-12-02T11:00:00Z" },
  { id: "txn-013", orderId: "ORD-2025013", store: "Castillo Gen. Mdse", method: "bank", amount: 9750, status: "completed", reference: "BDO-20250102", date: "2025-12-02T12:45:00Z" },
  { id: "txn-014", orderId: "ORD-2025014", store: "Soriano Sari-Sari", method: "gcash", amount: 5500, status: "processing", date: "2025-12-02T14:00:00Z" },
  { id: "txn-015", orderId: "ORD-2025015", store: "Ocampo Store", method: "maya", amount: 2100, status: "completed", reference: "MY-20250102-015", date: "2025-12-02T15:30:00Z" },
  { id: "txn-016", orderId: "ORD-2025016", store: "Aguilar Grocery", method: "cash", amount: 750, status: "completed", date: "2025-12-03T08:20:00Z", notes: "Walk-in warehouse purchase" },
  { id: "txn-017", orderId: "ORD-2025017", store: "Villanueva Tindahan", method: "cebuana", amount: 1450, status: "completed", reference: "CB-00398421", date: "2025-12-03T09:45:00Z" },
  { id: "txn-018", orderId: "ORD-2025018", store: "Reyes General Mdse", method: "terms", amount: 22000, status: "pending", date: "2025-12-03T11:00:00Z", notes: "30-day terms, due Jan 3" },
  { id: "txn-019", orderId: "ORD-2025019", store: "Perez Store", method: "gcash", amount: 3350, status: "completed", reference: "GC-20250103-019", date: "2025-12-03T13:20:00Z" },
  { id: "txn-020", orderId: "ORD-2025020", store: "Aquino Variety", method: "wallet", amount: 4200, status: "completed", date: "2025-12-03T14:10:00Z" },
];

const METHOD_CONFIG: Record<PaymentMethod, { label: string; icon: string; color: string; group: string }> = {
  gcash:     { label: "GCash",        icon: "💚", color: "bg-green-50 text-green-700 border-green-200",   group: "E-Wallets" },
  maya:      { label: "Maya",         icon: "💜", color: "bg-purple-50 text-purple-700 border-purple-200", group: "E-Wallets" },
  shopeepay: { label: "ShopeePay",    icon: "🛍️", color: "bg-orange-50 text-orange-700 border-orange-200", group: "E-Wallets" },
  qrph:      { label: "QR Ph",        icon: "📱", color: "bg-blue-50 text-blue-700 border-blue-200",       group: "E-Wallets" },
  wallet:    { label: "KSS Wallet",   icon: "👛", color: "bg-brand-50 text-brand-700 border-brand-200",   group: "E-Wallets" },
  bank:      { label: "Bank Transfer",icon: "🏦", color: "bg-sky-50 text-sky-700 border-sky-200",         group: "Bank" },
  instapay:  { label: "InstaPay",     icon: "⚡", color: "bg-yellow-50 text-yellow-700 border-yellow-200", group: "Bank" },
  card:      { label: "Card",         icon: "💳", color: "bg-slate-50 text-slate-700 border-slate-200",   group: "Card" },
  cash:      { label: "Cash",         icon: "💵", color: "bg-emerald-50 text-emerald-700 border-emerald-200", group: "Cash" },
  cod:       { label: "COD",          icon: "📦", color: "bg-amber-50 text-amber-700 border-amber-200",   group: "Cash" },
  palawan:   { label: "Palawan",      icon: "🌴", color: "bg-green-50 text-green-700 border-green-200",   group: "OTC" },
  cebuana:   { label: "Cebuana",      icon: "💛", color: "bg-yellow-50 text-yellow-700 border-yellow-200", group: "OTC" },
  terms:     { label: "Credit Terms", icon: "📋", color: "bg-gray-50 text-gray-700 border-gray-200",      group: "Terms" },
};

const STATUS_CONFIG: Record<PaymentStatus, { label: string; icon: React.ReactNode; color: string }> = {
  completed:  { label: "Completed",  icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: "bg-success-50 text-success-700 border-success-200" },
  pending:    { label: "Pending",    icon: <Clock className="h-3.5 w-3.5" />,         color: "bg-warning-50 text-warning-700 border-warning-200" },
  processing: { label: "Processing", icon: <AlertCircle className="h-3.5 w-3.5" />,  color: "bg-blue-50 text-blue-700 border-blue-200" },
  failed:     { label: "Failed",     icon: <XCircle className="h-3.5 w-3.5" />,       color: "bg-danger-50 text-danger-700 border-danger-200" },
};

const ALL_METHODS = ["all", "gcash", "maya", "bank", "instapay", "qrph", "shopeepay", "card", "cash", "cod", "palawan", "cebuana", "terms", "wallet"] as const;
const ALL_STATUSES = ["all", "completed", "pending", "processing", "failed"] as const;

export default function PaymentsPage() {
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Transaction | null>(null);

  const filtered = useMemo(() => {
    return MOCK_TXS.filter(t => {
      const matchMethod = methodFilter === "all" || t.method === methodFilter;
      const matchStatus = statusFilter === "all" || t.status === statusFilter;
      const q = search.toLowerCase();
      const matchSearch = !q || t.orderId.toLowerCase().includes(q) || t.store.toLowerCase().includes(q) || (t.reference || "").toLowerCase().includes(q);
      return matchMethod && matchStatus && matchSearch;
    });
  }, [methodFilter, statusFilter, search]);

  const totalRevenue = MOCK_TXS.filter(t => t.status === "completed").reduce((s, t) => s + t.amount, 0);
  const pendingAmount = MOCK_TXS.filter(t => t.status === "pending" || t.status === "processing").reduce((s, t) => s + t.amount, 0);
  const failedAmount = MOCK_TXS.filter(t => t.status === "failed").reduce((s, t) => s + t.amount, 0);
  const codPending = MOCK_TXS.filter(t => t.method === "cod" && t.status === "pending").reduce((s, t) => s + t.amount, 0);

  const byMethod = Object.entries(
    MOCK_TXS.filter(t => t.status === "completed").reduce((acc, t) => {
      acc[t.method] = (acc[t.method] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]);

  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-foreground">Payments & Transactions</h1>
          <p className="text-sm text-muted-foreground">All payment methods, all transaction types</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
          <Download className="h-3.5 w-3.5" /> Export
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Revenue (Settled)", value: formatPHP(totalRevenue), icon: <TrendingUp className="h-4 w-4" />, color: "bg-success-50 text-success-600", sub: `${MOCK_TXS.filter(t => t.status === "completed").length} transactions` },
          { label: "Pending Collection", value: formatPHP(pendingAmount), icon: <Clock className="h-4 w-4" />, color: "bg-warning-50 text-warning-600", sub: `${MOCK_TXS.filter(t => t.status === "pending" || t.status === "processing").length} transactions` },
          { label: "COD to Collect", value: formatPHP(codPending), icon: <Package className="h-4 w-4" />, color: "bg-brand-50 text-brand-600", sub: `${MOCK_TXS.filter(t => t.method === "cod" && t.status === "pending").length} pending deliveries` },
          { label: "Failed / Disputed", value: formatPHP(failedAmount), icon: <TrendingDown className="h-4 w-4" />, color: "bg-danger-50 text-danger-600", sub: `${MOCK_TXS.filter(t => t.status === "failed").length} transactions` },
        ].map(kpi => (
          <div key={kpi.label} className="rounded-2xl border border-border bg-card shadow-card p-4">
            <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center mb-3", kpi.color)}>
              {kpi.icon}
            </div>
            <p className="font-display text-lg font-bold text-foreground">{kpi.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{kpi.label}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Payment method breakdown */}
      <div className="rounded-2xl border border-border bg-card shadow-card p-5">
        <h3 className="font-display text-sm font-semibold text-foreground mb-4">Revenue by Payment Method</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {byMethod.slice(0, 8).map(([method, amount]) => {
            const cfg = METHOD_CONFIG[method as PaymentMethod];
            if (!cfg) return null;
            const pct = Math.round((amount / totalRevenue) * 100);
            return (
              <button
                key={method}
                onClick={() => setMethodFilter(method)}
                className={cn(
                  "rounded-xl border p-3 text-left transition-all hover:shadow-sm active:scale-95",
                  methodFilter === method ? "ring-2 ring-brand-400 " + cfg.color : "border-border bg-surface-50"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-base">{cfg.icon}</span>
                  <span className="text-[10px] font-bold text-muted-foreground">{pct}%</span>
                </div>
                <p className="text-xs font-bold text-foreground">{formatPHP(amount)}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{cfg.label}</p>
                <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-brand-400 rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Pending reconciliation alerts */}
      {MOCK_TXS.some(t => t.status === "pending") && (
        <div className="rounded-2xl border border-warning-200 bg-warning-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-warning-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-warning-800">Reconciliation Needed</p>
              <p className="text-xs text-warning-700 mt-0.5">
                {MOCK_TXS.filter(t => t.method === "bank" && t.status === "pending").length} bank transfers ({formatPHP(MOCK_TXS.filter(t => t.method === "bank" && t.status === "pending").reduce((s, t) => s + t.amount, 0))}) and {MOCK_TXS.filter(t => t.method === "cod" && t.status === "pending").length} COD collections ({formatPHP(codPending)}) await confirmation.
              </p>
              <div className="flex gap-2 mt-2">
                <button className="text-[11px] font-semibold text-warning-800 underline underline-offset-2">Review bank transfers</button>
                <span className="text-warning-500">·</span>
                <button className="text-[11px] font-semibold text-warning-800 underline underline-offset-2">Mark COD collected</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="search" placeholder="Search order ID, store, reference..." value={search} onChange={e => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-input bg-card pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div className="flex gap-2">
          <select value={methodFilter} onChange={e => setMethodFilter(e.target.value)}
            className="h-10 rounded-xl border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option value="all">All Methods</option>
            {ALL_METHODS.filter(m => m !== "all").map(m => (
              <option key={m} value={m}>{METHOD_CONFIG[m as PaymentMethod]?.label || m}</option>
            ))}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="h-10 rounded-xl border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option value="all">All Status</option>
            {ALL_STATUSES.filter(s => s !== "all").map(s => (
              <option key={s} value={s}>{STATUS_CONFIG[s as PaymentStatus]?.label || s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Transaction table */}
      <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-50">
                {["Order", "Store", "Method", "Amount", "Status", "Date", "Reference", ""].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(tx => {
                const method = METHOD_CONFIG[tx.method];
                const status = STATUS_CONFIG[tx.status];
                return (
                  <tr key={tx.id} className="hover:bg-muted/40 transition-colors cursor-pointer" onClick={() => setSelected(tx)}>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-medium text-foreground">{tx.orderId}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-foreground font-medium truncate max-w-[140px] block">{tx.store}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold", method?.color)}>
                        {method?.icon} {method?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-bold text-foreground">{formatPHP(tx.amount)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold", status?.color)}>
                        {status?.icon} {status?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(tx.date)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[10px] text-muted-foreground">{tx.reference || "-"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button className="text-brand-500 hover:text-brand-600" onClick={e => { e.stopPropagation(); setSelected(tx); }}>
                        <ArrowUpRight className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-muted-foreground">No transactions found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-border px-4 py-3 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{filtered.length} of {MOCK_TXS.length} transactions</p>
          <p className="text-xs font-semibold text-foreground">Total: {formatPHP(filtered.reduce((s, t) => s + t.amount, 0))}</p>
        </div>
      </div>

      {/* Detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-card rounded-3xl shadow-card-md w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display text-base font-bold text-foreground">{selected.orderId}</p>
                <p className="text-sm text-muted-foreground">{selected.store}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground text-xl leading-none">×</button>
            </div>
            <div className="rounded-2xl bg-surface-50 border border-border p-4 space-y-3">
              {[
                { label: "Amount", value: <span className="font-bold text-brand-500 text-base">{formatPHP(selected.amount)}</span> },
                { label: "Method", value: <span className={cn("inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold", METHOD_CONFIG[selected.method]?.color)}>{METHOD_CONFIG[selected.method]?.icon} {METHOD_CONFIG[selected.method]?.label}</span> },
                { label: "Status", value: <span className={cn("inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold", STATUS_CONFIG[selected.status]?.color)}>{STATUS_CONFIG[selected.status]?.icon} {STATUS_CONFIG[selected.status]?.label}</span> },
                { label: "Reference", value: <span className="font-mono text-xs">{selected.reference || "No reference"}</span> },
                { label: "Date", value: formatDate(selected.date) },
                ...(selected.notes ? [{ label: "Notes", value: selected.notes }] : []),
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between gap-4">
                  <span className="text-xs text-muted-foreground">{row.label}</span>
                  <span className="text-sm text-foreground text-right">{row.value}</span>
                </div>
              ))}
            </div>
            {(selected.status === "pending" || selected.status === "processing") && (
              <div className="flex gap-2">
                <button className="flex-1 h-10 rounded-xl bg-success-500 text-white text-sm font-semibold hover:bg-success-600 transition-colors">
                  Mark Paid
                </button>
                <button className="flex-1 h-10 rounded-xl border border-danger-200 text-danger-600 text-sm font-semibold hover:bg-danger-50 transition-colors">
                  Mark Failed
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
