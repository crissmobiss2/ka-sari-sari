"use client";
import { useState } from "react";
import { CreditCard, AlertTriangle, CheckCircle2, Clock, TrendingUp, Search, Filter, ChevronRight, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatPHP, formatDate } from "@/lib/utils";
import { toastSuccess, toastError } from "@/store/toast";

type CreditStatus = "good" | "overdue" | "at_limit" | "suspended";

interface CreditAccount {
  id: string;
  retailer: string;
  store: string;
  city: string;
  creditLimit: number;
  outstanding: number;
  oldestInvoiceDays: number;
  terms: 7 | 14 | 30 | 45;
  status: CreditStatus;
  lastPayment: string;
  nextDue?: string;
}

const CREDIT_ACCOUNTS: CreditAccount[] = [
  { id: "ca-01", retailer: "Maria Santos",    store: "Santos Sari-Sari",     city: "Caloocan",    creditLimit: 30000, outstanding: 8500,  oldestInvoiceDays: 5,  terms: 30, status: "good",      lastPayment: "2025-12-01", nextDue: "2026-01-01" },
  { id: "ca-02", retailer: "Nena Reyes",      store: "Ate Nena Store",        city: "Quezon City", creditLimit: 50000, outstanding: 48200, oldestInvoiceDays: 12, terms: 30, status: "at_limit",   lastPayment: "2025-11-15", nextDue: "2025-12-15" },
  { id: "ca-03", retailer: "Rodrigo Aquino",  store: "Aquino Mini-Mart",      city: "Antipolo",    creditLimit: 20000, outstanding: 21500, oldestInvoiceDays: 38, terms: 30, status: "overdue",    lastPayment: "2025-10-10", nextDue: "2025-11-10" },
  { id: "ca-04", retailer: "Elena Cruz",      store: "Cruz Corner Store",     city: "Mandaluyong", creditLimit: 25000, outstanding: 3000,  oldestInvoiceDays: 2,  terms: 14, status: "good",      lastPayment: "2025-12-03", nextDue: "2025-12-17" },
  { id: "ca-05", retailer: "Lito Garcia",     store: "Garcia Grocery",        city: "Pasig",       creditLimit: 15000, outstanding: 15000, oldestInvoiceDays: 62, terms: 30, status: "suspended",  lastPayment: "2025-09-01", nextDue: undefined },
  { id: "ca-06", retailer: "Jun Dela Cruz",   store: "Dela Cruz Tindahan",    city: "Marikina",    creditLimit: 20000, outstanding: 12300, oldestInvoiceDays: 8,  terms: 30, status: "good",      lastPayment: "2025-11-30", nextDue: "2025-12-30" },
  { id: "ca-07", retailer: "Bernard Tan",     store: "Tan Variety",           city: "Iloilo City", creditLimit: 30000, outstanding: 0,     oldestInvoiceDays: 0,  terms: 30, status: "good",      lastPayment: "2025-12-02", nextDue: "2026-01-02" },
  { id: "ca-08", retailer: "Amelia Flores",   store: "Flores Corner",         city: "Calamba",     creditLimit: 20000, outstanding: 17000, oldestInvoiceDays: 25, terms: 30, status: "overdue",   lastPayment: "2025-11-05", nextDue: "2025-12-05" },
];

const STATUS_CONFIG: Record<CreditStatus, { label: string; color: string; badge: string; icon: typeof CheckCircle2 }> = {
  good:      { label: "Good Standing",  color: "text-success-600 bg-success-50 border-success-200",  badge: "success",  icon: CheckCircle2 },
  overdue:   { label: "Overdue",        color: "text-danger-600 bg-danger-50 border-danger-200",      badge: "danger",   icon: AlertTriangle },
  at_limit:  { label: "At Limit",       color: "text-warning-700 bg-warning-50 border-warning-200",   badge: "warning",  icon: TrendingUp },
  suspended: { label: "Suspended",      color: "text-muted-foreground bg-surface-100 border-border",  badge: "neutral",  icon: Clock },
};

function UtilizationBar({ used, limit }: { used: number; limit: number }) {
  const pct = Math.min(100, Math.round((used / limit) * 100));
  const color = pct >= 100 ? "bg-danger-500" : pct >= 80 ? "bg-warning-400" : "bg-success-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-surface-100 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] tabular-nums text-muted-foreground shrink-0">{pct}%</span>
    </div>
  );
}

export default function AdminCreditPage() {
  const [accounts, setAccounts] = useState(CREDIT_ACCOUNTS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CreditStatus | "all">("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [paymentModal, setPaymentModal] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [createModal, setCreateModal] = useState(false);
  const [newRetailer, setNewRetailer] = useState("");
  const [newLimit, setNewLimit] = useState("");
  const [newTerms, setNewTerms] = useState<7 | 14 | 30 | 45>(30);

  const filtered = accounts.filter((a) => {
    const matchSearch = !search ||
      a.retailer.toLowerCase().includes(search.toLowerCase()) ||
      a.store.toLowerCase().includes(search.toLowerCase()) ||
      a.city.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalOutstanding = accounts.reduce((s, a) => s + a.outstanding, 0);
  const totalLimit       = accounts.reduce((s, a) => s + a.creditLimit, 0);
  const overdueCount     = accounts.filter((a) => a.status === "overdue" || a.status === "suspended").length;
  const atRiskAmount     = accounts.filter((a) => a.status === "overdue" || a.status === "suspended").reduce((s, a) => s + a.outstanding, 0);

  const selectedAccount = selected ? accounts.find((a) => a.id === selected) : null;

  function handleRecordPayment() {
    if (!paymentModal) return;
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) return;
    const account = accounts.find((a) => a.id === paymentModal);
    if (!account) return;
    setAccounts((prev) =>
      prev.map((a) =>
        a.id === paymentModal
          ? {
              ...a,
              outstanding: Math.max(0, a.outstanding - amount),
              status: a.outstanding - amount <= 0 ? "good" : a.status,
            }
          : a
      )
    );
    toastSuccess(`Payment of ₱${amount.toLocaleString()} recorded for ${account.retailer}`);
    setPaymentModal(null);
    setPaymentAmount("");
  }

  function handleSuspend(account: CreditAccount) {
    if (window.confirm(`Suspend ${account.retailer}? They will lose ordering access.`)) {
      setAccounts((prev) =>
        prev.map((a) => (a.id === account.id ? { ...a, status: "suspended" } : a))
      );
      toastError("Account suspended");
    }
  }

  function handleReactivate(account: CreditAccount) {
    setAccounts((prev) =>
      prev.map((a) => (a.id === account.id ? { ...a, status: "good" } : a))
    );
    toastSuccess("Account reactivated");
  }

  function handleCreateCreditLine() {
    const retailerName = newRetailer.trim();
    const limitAmount = Number(newLimit);
    if (!retailerName) return;
    if (!limitAmount || limitAmount <= 0) return;
    const newId = `ca-${String(accounts.length + 1).padStart(2, "0")}`;
    const newAccount: CreditAccount = {
      id: newId,
      retailer: retailerName,
      store: `${retailerName} Store`,
      city: "—",
      creditLimit: limitAmount,
      outstanding: 0,
      oldestInvoiceDays: 0,
      terms: newTerms,
      status: "good",
      lastPayment: "2026-07-06",
      nextDue: undefined,
    };
    setAccounts((prev) => [...prev, newAccount]);
    toastSuccess(`Credit line created for ${retailerName}`);
    setCreateModal(false);
    setNewRetailer("");
    setNewLimit("");
    setNewTerms(30);
  }

  function handleCloseCreateModal() {
    setCreateModal(false);
    setNewRetailer("");
    setNewLimit("");
    setNewTerms(30);
  }

  const paymentModalAccount = paymentModal ? accounts.find((a) => a.id === paymentModal) : null;

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* Payment Modal */}
      {paymentModal && paymentModalAccount && (
        <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setPaymentModal(null)}>
          <div
            className="max-w-sm mx-auto mt-24 bg-card rounded-2xl p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-lg font-bold text-foreground mb-1">Record Payment</h2>
            <p className="text-sm text-muted-foreground mb-4">{paymentModalAccount.retailer}</p>
            <input
              type="number"
              placeholder="Amount (PHP)"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="w-full h-10 rounded-xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 mb-4"
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") handleRecordPayment(); }}
            />
            <div className="flex gap-2">
              <button
                onClick={handleRecordPayment}
                disabled={!paymentAmount || Number(paymentAmount) <= 0}
                className="flex-1 rounded-xl bg-brand-500 text-white py-2.5 text-sm font-semibold hover:bg-brand-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Confirm Payment
              </button>
              <button
                onClick={() => { setPaymentModal(null); setPaymentAmount(""); }}
                className="flex-1 rounded-xl border border-border text-foreground py-2.5 text-sm font-semibold hover:bg-muted/40 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Credit Line Modal */}
      {createModal && (
        <div className="fixed inset-0 bg-black/40 z-50" onClick={handleCloseCreateModal}>
          <div
            className="max-w-sm mx-auto mt-24 bg-card rounded-2xl p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold text-foreground">New Credit Line</h2>
              <button
                onClick={handleCloseCreateModal}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Retailer Name</label>
                <input
                  type="text"
                  placeholder="e.g. Juan dela Cruz"
                  value={newRetailer}
                  onChange={(e) => setNewRetailer(e.target.value)}
                  className="w-full h-10 rounded-xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Credit Limit (PHP)</label>
                <input
                  type="number"
                  placeholder="e.g. 20000"
                  value={newLimit}
                  onChange={(e) => setNewLimit(e.target.value)}
                  min={1}
                  className="w-full h-10 rounded-xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Payment Terms</label>
                <select
                  value={newTerms}
                  onChange={(e) => setNewTerms(Number(e.target.value) as 7 | 14 | 30 | 45)}
                  className="w-full h-10 rounded-xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days</option>
                  <option value={45}>45 days</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreateCreditLine}
                disabled={!newRetailer.trim() || !newLimit || Number(newLimit) <= 0}
                className="flex-1 rounded-xl bg-brand-500 text-white py-2.5 text-sm font-semibold hover:bg-brand-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Create Credit Line
              </button>
              <button
                onClick={handleCloseCreateModal}
                className="flex-1 rounded-xl border border-border text-foreground py-2.5 text-sm font-semibold hover:bg-muted/40 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500">
              <CreditCard className="h-4 w-4 text-white" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">Credit Terms</h1>
          </div>
          <p className="text-sm text-muted-foreground">Buy-now-pay-later accounts for trusted retailers</p>
        </div>
        <button
          onClick={() => setCreateModal(true)}
          className="flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-600 hover:bg-brand-100 transition-colors"
        >
          + New Credit Line
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Outstanding",  value: formatPHP(totalOutstanding), sub: `of ${formatPHP(totalLimit)} limit`, color: "text-brand-600 bg-brand-50", icon: CreditCard },
          { label: "Utilization Rate",   value: `${Math.round((totalOutstanding / totalLimit) * 100)}%`, sub: "across all accounts", color: "text-info-600 bg-info-50", icon: TrendingUp },
          { label: "Overdue Accounts",   value: overdueCount.toString(), sub: `${formatPHP(atRiskAmount)} at risk`, color: overdueCount > 0 ? "text-danger-600 bg-danger-50" : "text-success-600 bg-success-50", icon: AlertTriangle },
          { label: "Avg Terms",          value: "30 days", sub: "payment window", color: "text-muted-foreground bg-surface-100", icon: Clock },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl mb-3", s.color)}>
              <s.icon className="h-4 w-4" />
            </div>
            <p className="font-display text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            <p className="text-[11px] text-muted-foreground/70 mt-0.5">{s.sub}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search retailer or city…"
            className="h-10 w-full rounded-xl border border-input bg-card pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="flex gap-1.5">
          {(["all", "good", "at_limit", "overdue", "suspended"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "rounded-xl border px-3 py-2 text-xs font-semibold transition-colors",
                statusFilter === s ? "bg-brand-500 text-white border-brand-500" : "border-border bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              {s === "all" ? "All" : s === "at_limit" ? "At Limit" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Account list */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <CardHeader className="py-3 px-5 border-b border-border bg-muted/20">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-foreground">Credit Accounts</CardTitle>
                <span className="text-xs text-muted-foreground">{filtered.length} accounts</span>
              </div>
            </CardHeader>
            <div className="divide-y divide-border">
              {filtered.map((a) => {
                const cfg = STATUS_CONFIG[a.status];
                const isSelected = selected === a.id;
                return (
                  <div
                    key={a.id}
                    onClick={() => setSelected(isSelected ? null : a.id)}
                    className={cn("px-5 py-4 cursor-pointer transition-colors", isSelected ? "bg-brand-50" : "hover:bg-muted/30")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold", a.status === "good" ? "bg-brand-100 text-brand-600" : "bg-surface-200 text-foreground")}>
                          {a.retailer.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{a.retailer}</p>
                          <p className="text-xs text-muted-foreground truncate">{a.store} · {a.city}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold tabular-nums text-foreground">{formatPHP(a.outstanding)}</p>
                        <p className="text-[11px] text-muted-foreground">of {formatPHP(a.creditLimit)}</p>
                      </div>
                    </div>
                    <div className="mt-2.5 space-y-1.5">
                      <UtilizationBar used={a.outstanding} limit={a.creditLimit} />
                      <div className="flex items-center justify-between">
                        <span className={cn("text-[11px] font-semibold rounded-full border px-2 py-0.5", cfg.color)}>
                          {cfg.label}
                          {a.status === "overdue" && ` · ${a.oldestInvoiceDays}d overdue`}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {a.terms}-day terms
                          {a.nextDue && ` · Due ${formatDate(a.nextDue)}`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="py-12 text-center text-sm text-muted-foreground">No accounts match.</div>
              )}
            </div>
          </Card>
        </div>

        {/* Detail panel */}
        <div>
          {selectedAccount ? (
            <Card className="p-5 space-y-4 sticky top-6">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Account Detail</p>
                <p className="font-display text-lg font-bold text-foreground mt-1">{selectedAccount.retailer}</p>
                <p className="text-sm text-muted-foreground">{selectedAccount.store}</p>
              </div>

              <div className="space-y-2 text-sm">
                {[
                  { label: "Credit Limit",      value: formatPHP(selectedAccount.creditLimit) },
                  { label: "Outstanding",        value: formatPHP(selectedAccount.outstanding), bold: true },
                  { label: "Available Credit",   value: formatPHP(Math.max(0, selectedAccount.creditLimit - selectedAccount.outstanding)) },
                  { label: "Terms",              value: `${selectedAccount.terms} days` },
                  { label: "Last Payment",       value: formatDate(selectedAccount.lastPayment) },
                  { label: "Next Due",           value: selectedAccount.nextDue ? formatDate(selectedAccount.nextDue) : "Suspended" },
                  { label: "Oldest Invoice",     value: selectedAccount.oldestInvoiceDays > 0 ? `${selectedAccount.oldestInvoiceDays} days ago` : "None" },
                ].map(({ label, value, bold }) => (
                  <div key={label} className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0">
                    <span className="text-muted-foreground">{label}</span>
                    <span className={cn("font-semibold text-foreground tabular-nums", bold && "text-brand-600")}>{value}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => { setPaymentModal(selectedAccount.id); setPaymentAmount(""); }}
                  className="w-full rounded-xl bg-brand-500 text-white py-2.5 text-sm font-semibold hover:bg-brand-600 transition-colors"
                >
                  Record Payment
                </button>
                {selectedAccount.status !== "suspended" ? (
                  <button
                    onClick={() => handleSuspend(selectedAccount)}
                    className="w-full rounded-xl border border-danger-200 text-danger-600 py-2.5 text-sm font-semibold hover:bg-danger-50 transition-colors"
                  >
                    Suspend Account
                  </button>
                ) : (
                  <button
                    onClick={() => handleReactivate(selectedAccount)}
                    className="w-full rounded-xl border border-success-200 text-success-600 py-2.5 text-sm font-semibold hover:bg-success-50 transition-colors"
                  >
                    Reactivate Account
                  </button>
                )}
              </div>
            </Card>
          ) : (
            <Card className="p-8 text-center text-muted-foreground">
              <CreditCard className="h-8 w-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Select an account to view details</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
