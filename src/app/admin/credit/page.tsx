"use client";
import { useState, useEffect, useCallback } from "react";
import { CreditCard, AlertTriangle, CheckCircle2, Clock, TrendingUp, Search, X, FileText, RefreshCw } from "lucide-react";
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

// ── Credit Application types (from /api/user/credit) ─────────────────────────
interface CreditApplication {
  id: string;
  retailerId: string;
  retailerName: string;
  storeName?: string;
  requestedLimit: number;
  requestedTerms: number;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

const APPLICATION_STATUS_CONFIG = {
  pending:  { label: "Pending",   variant: "warning",  class: "bg-warning-50 text-warning-700 border border-warning-200"  },
  approved: { label: "Approved",  variant: "success",  class: "bg-success-50 text-success-700 border border-success-200"  },
  rejected: { label: "Rejected",  variant: "danger",   class: "bg-danger-50 text-danger-700 border border-danger-200"     },
} as const;

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

  useEffect(() => {
    fetch("/api/admin/credit")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (Array.isArray(data?.accounts) && data.accounts.length > 0) {
          setAccounts(data.accounts);
        }
      })
      .catch(() => {});
  }, []);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CreditStatus | "all">("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [paymentModal, setPaymentModal] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [createModal, setCreateModal] = useState(false);
  const [newRetailer, setNewRetailer] = useState("");
  const [newLimit, setNewLimit] = useState("");
  const [newTerms, setNewTerms] = useState<7 | 14 | 30 | 45>(30);

  // ── Credit applications ───────────────────────────────────────────────────
  const [applications, setApplications] = useState<CreditApplication[]>([]);
  const [appLoading, setAppLoading] = useState(true);

  // Approve modal
  const [approveApp, setApproveApp] = useState<CreditApplication | null>(null);
  const [approveLimit, setApproveLimit] = useState("");
  const [approving, setApproving] = useState(false);

  // Reject modal
  const [rejectApp, setRejectApp] = useState<CreditApplication | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);

  const fetchApplications = useCallback(async () => {
    setAppLoading(true);
    try {
      const res = await fetch("/api/user/credit");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setApplications((data.applications ?? []) as CreditApplication[]);
    } catch {
      // silently fail — no applications shown
    } finally {
      setAppLoading(false);
    }
  }, []);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  async function handleApprove() {
    if (!approveApp) return;
    const limit = Number(approveLimit);
    if (!limit || limit <= 0) return;
    setApproving(true);
    try {
      const res = await fetch("/api/user/credit", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: approveApp.id, decision: "approved", approvedLimit: limit }),
      });
      if (!res.ok) throw new Error("Failed");
      toastSuccess(`Credit approved for ${approveApp.retailerName}`);
      setApproveApp(null);
      setApproveLimit("");
      fetchApplications();
    } catch {
      toastError("Failed to approve application");
    } finally {
      setApproving(false);
    }
  }

  async function handleReject() {
    if (!rejectApp || !rejectReason.trim()) return;
    setRejecting(true);
    try {
      const res = await fetch("/api/user/credit", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: rejectApp.id, decision: "rejected", rejectionReason: rejectReason.trim() }),
      });
      if (!res.ok) throw new Error("Failed");
      toastError(`Application rejected for ${rejectApp.retailerName}`);
      setRejectApp(null);
      setRejectReason("");
      fetchApplications();
    } catch {
      toastError("Failed to reject application");
    } finally {
      setRejecting(false);
    }
  }

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

  async function handleRecordPayment() {
    if (!paymentModal) return;
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) return;
    const account = accounts.find((a) => a.id === paymentModal);
    if (!account) return;
    try {
      const res = await fetch(`/api/admin/credit/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: paymentModal, amount }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
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
    } catch {
      toastError("Failed to record payment. Please try again.");
    }
  }

  async function handleSuspend(account: CreditAccount) {
    if (!window.confirm(`Suspend ${account.retailer}? They will lose ordering access.`)) return;
    try {
      const res = await fetch(`/api/admin/credit/${account.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "suspended" }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setAccounts((prev) =>
        prev.map((a) => (a.id === account.id ? { ...a, status: "suspended" } : a))
      );
      toastError("Account suspended");
    } catch {
      toastError("Failed to suspend account. Please try again.");
    }
  }

  async function handleReactivate(account: CreditAccount) {
    try {
      const res = await fetch(`/api/admin/credit/${account.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "good" }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setAccounts((prev) =>
        prev.map((a) => (a.id === account.id ? { ...a, status: "good" } : a))
      );
      toastSuccess("Account reactivated");
    } catch {
      toastError("Failed to reactivate account. Please try again.");
    }
  }

  async function handleCreateCreditLine() {
    const retailerName = newRetailer.trim();
    const limitAmount = Number(newLimit);
    if (!retailerName) return;
    if (!limitAmount || limitAmount <= 0) return;
    try {
      const res = await fetch(`/api/admin/credit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ retailer: retailerName, creditLimit: limitAmount, terms: newTerms }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const newAccount: CreditAccount = data.account ?? {
        id: `ca-${String(accounts.length + 1).padStart(2, "0")}`,
        retailer: retailerName,
        store: `${retailerName} Store`,
        city: "—",
        creditLimit: limitAmount,
        outstanding: 0,
        oldestInvoiceDays: 0,
        terms: newTerms,
        status: "good",
        lastPayment: new Date().toISOString().split("T")[0],
        nextDue: undefined,
      };
      setAccounts((prev) => [...prev, newAccount]);
      toastSuccess(`Credit line created for ${retailerName}`);
      setCreateModal(false);
      setNewRetailer("");
      setNewLimit("");
      setNewTerms(30);
    } catch {
      toastError("Failed to create credit line. Please try again.");
    }
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
      {/* Approve Application Modal */}
      {approveApp && (
        <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setApproveApp(null)}>
          <div className="max-w-sm mx-auto mt-24 bg-card rounded-2xl p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold text-foreground">Approve Credit</h2>
              <button onClick={() => setApproveApp(null)} className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{approveApp.retailerName}{approveApp.storeName ? ` · ${approveApp.storeName}` : ""}</p>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Approved Limit (PHP)</label>
              <input
                type="number"
                value={approveLimit}
                onChange={(e) => setApproveLimit(e.target.value)}
                className="w-full h-10 rounded-xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") handleApprove(); }}
              />
              <p className="text-[11px] text-muted-foreground mt-1">Requested: {formatPHP(approveApp.requestedLimit)}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleApprove}
                disabled={!approveLimit || Number(approveLimit) <= 0 || approving}
                className="flex-1 rounded-xl bg-success-700 text-white py-2.5 text-sm font-semibold hover:bg-success-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {approving ? "Approving…" : "Approve"}
              </button>
              <button
                onClick={() => setApproveApp(null)}
                className="flex-1 rounded-xl border border-border text-foreground py-2.5 text-sm font-semibold hover:bg-muted/40 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Application Modal */}
      {rejectApp && (
        <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setRejectApp(null)}>
          <div className="max-w-sm mx-auto mt-24 bg-card rounded-2xl p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold text-foreground">Reject Application</h2>
              <button onClick={() => setRejectApp(null)} className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{rejectApp.retailerName}{rejectApp.storeName ? ` · ${rejectApp.storeName}` : ""}</p>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Rejection Reason</label>
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Insufficient order history"
                className="w-full h-10 rounded-xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-danger-500"
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") handleReject(); }}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || rejecting}
                className="flex-1 rounded-xl bg-danger-500 text-white py-2.5 text-sm font-semibold hover:bg-danger-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {rejecting ? "Rejecting…" : "Reject"}
              </button>
              <button
                onClick={() => setRejectApp(null)}
                className="flex-1 rounded-xl border border-border text-foreground py-2.5 text-sm font-semibold hover:bg-muted/40 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Credit Applications */}
      <Card>
        <CardHeader className="py-3 px-5 border-b border-border bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-semibold text-foreground">Credit Applications</CardTitle>
              {applications.filter((a) => a.status === "pending").length > 0 && (
                <span className="rounded-full bg-warning-100 text-warning-700 px-2 py-0.5 text-xs font-bold">
                  {applications.filter((a) => a.status === "pending").length} pending
                </span>
              )}
            </div>
            <button onClick={fetchApplications} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <RefreshCw className={cn("h-3.5 w-3.5", appLoading && "animate-spin")} />
              Refresh
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {appLoading ? (
            <div className="divide-y divide-border">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="px-5 py-4 flex items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 w-36 rounded animate-pulse bg-muted" />
                    <div className="h-3 w-24 rounded animate-pulse bg-muted" />
                  </div>
                  <div className="h-5 w-20 rounded-full animate-pulse bg-muted" />
                </div>
              ))}
            </div>
          ) : applications.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              <FileText className="h-6 w-6 mx-auto mb-2 opacity-30" />
              No credit applications yet
            </div>
          ) : (
            <div className="divide-y divide-border">
              {applications.map((app) => {
                const cfg = APPLICATION_STATUS_CONFIG[app.status];
                return (
                  <div key={app.id} className="px-5 py-4 flex items-center gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{app.retailerName}</p>
                      <p className="text-xs text-muted-foreground">
                        {app.storeName ? `${app.storeName} · ` : ""}
                        {formatPHP(app.requestedLimit)} requested · {app.requestedTerms}-day terms
                      </p>
                      <p className="text-[11px] text-muted-foreground/70 mt-0.5">{formatDate(app.createdAt)}</p>
                    </div>
                    <span className={cn("text-[11px] font-semibold rounded-full px-2.5 py-0.5 shrink-0", cfg.class)}>
                      {cfg.label}
                    </span>
                    {app.status === "pending" && (
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => { setApproveApp(app); setApproveLimit(app.requestedLimit.toString()); }}
                          className="rounded-lg bg-success-700 text-white px-3 py-1.5 text-xs font-semibold hover:bg-success-800 transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => { setRejectApp(app); setRejectReason(""); }}
                          className="rounded-lg border border-danger-200 text-danger-600 px-3 py-1.5 text-xs font-semibold hover:bg-danger-50 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

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
                        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold", a.status === "good" ? "bg-brand-100 dark:bg-brand-700 text-brand-600 dark:text-white" : "bg-surface-200 text-surface-900")}>
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
