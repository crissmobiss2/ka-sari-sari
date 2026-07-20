"use client";
import React, { useState, useMemo, useCallback } from "react";
import {
  Download, Search, TrendingUp, TrendingDown,
  AlertCircle, CheckCircle2, Clock, XCircle, ArrowUpRight,
  Package, RefreshCw, Banknote, Smartphone, Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPHP, formatDate } from "@/lib/utils";
import { MOCK_ORDERS, ADMIN_RECENT_ORDERS } from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toastSuccess } from "@/store/toast";

// ─── Types ────────────────────────────────────────────────────────────────────

type TxPaymentMethod = "gcash" | "maya" | "cod" | "bank" | "instapay" | "qrph" | "shopeepay" | "card" | "cash" | "palawan" | "cebuana" | "terms" | "wallet" | "credit";
type TxPaymentStatus = "completed" | "pending" | "failed" | "processing";
type MethodTab = "all" | "cod" | "gcash" | "maya";

interface Transaction {
  id: string;
  orderId: string;
  orderNumber: string;
  retailer: string;
  method: TxPaymentMethod;
  amount: number;
  status: TxPaymentStatus;
  reference?: string;
  date: string;
  notes?: string;
  reconciled?: boolean;
}

// ─── Store name lookup from storeId ──────────────────────────────────────────

const STORE_NAMES: Record<string, string> = {
  "store-1": "Santos Sari-Sari Store",
  "store-2": "Dela Cruz Store",
  "store-3": "Reyes General Mdse",
  "store-4": "Garcia Grocery",
  "store-5": "Lim Variety Store",
  "s1": "Mendoza Tindahan",
  "s2": "Torres Mini Mart",
  "s3": "Flores Sari-Sari",
  "s4": "Cruz Convenience",
  "s5": "Ramos Store",
};

// ─── Convert Order.paymentMethod to our TxPaymentMethod ──────────────────────

function orderMethodToTx(method: string): TxPaymentMethod {
  if (method === "bank_transfer") return "bank";
  if (method === "credit") return "terms";
  return method as TxPaymentMethod;
}

// ─── Build transaction list from MOCK_ORDERS + ADMIN_RECENT_ORDERS ────────────

const ALL_ORDERS = [...MOCK_ORDERS, ...ADMIN_RECENT_ORDERS];

function orderStatusToTxStatus(orderStatus: string, paymentStatus: string): TxPaymentStatus {
  if (paymentStatus === "failed" || paymentStatus === "refunded") return "failed";
  if (orderStatus === "failed_delivery") return "failed";
  if (orderStatus === "delivered" && paymentStatus === "paid") return "completed";
  if (orderStatus === "out_for_delivery" && paymentStatus === "paid") {
    // COD out for delivery is pending collection
    return "pending";
  }
  if (paymentStatus === "paid") return "completed";
  if (paymentStatus === "pending") return "pending";
  return "processing";
}

const ORDERS_AS_TXS: Transaction[] = ALL_ORDERS.map((order) => ({
  id: `tx-${order.id}`,
  orderId: order.id,
  orderNumber: order.orderNumber,
  retailer: order.store?.name ?? STORE_NAMES[order.storeId] ?? order.storeId,
  method: orderMethodToTx(order.paymentMethod),
  amount: order.total,
  status: orderStatusToTxStatus(order.status, order.paymentStatus),
  date: order.createdAt,
  notes: order.notes,
}));

// ─── Supplemental static transactions (richer dataset) ───────────────────────

const STATIC_TXS: Transaction[] = [
  { id: "txn-001", orderId: "ord-s001", orderNumber: "KSS-2025-00130", retailer: "Alvarez Tindahan",      method: "gcash",   amount: 4850, status: "completed", reference: "GC-20250101-001", date: "2025-01-10T08:23:00Z" },
  { id: "txn-002", orderId: "ord-s002", orderNumber: "KSS-2025-00129", retailer: "Bautista Store",        method: "cod",     amount: 2300, status: "pending",   date: "2025-01-10T09:10:00Z", notes: "Driver to collect on delivery" },
  { id: "txn-003", orderId: "ord-s003", orderNumber: "KSS-2025-00128", retailer: "Castillo Gen. Mdse",    method: "bank",    amount: 12500,status: "pending",   date: "2025-01-10T10:05:00Z", notes: "BPI transfer, awaiting confirmation" },
  { id: "txn-004", orderId: "ord-s004", orderNumber: "KSS-2025-00127", retailer: "Soriano Sari-Sari",     method: "maya",    amount: 3700, status: "completed", reference: "MY-20250101-004",date: "2025-01-10T11:45:00Z" },
  { id: "txn-005", orderId: "ord-s005", orderNumber: "KSS-2025-00126", retailer: "Ocampo Store",          method: "card",    amount: 8200, status: "completed", reference: "CARD-XXXX-1234",  date: "2025-01-10T12:30:00Z" },
  { id: "txn-006", orderId: "ord-s006", orderNumber: "KSS-2025-00125", retailer: "Aguilar Grocery",       method: "gcash",   amount: 1950, status: "failed",    reference: "GC-FAILED",       date: "2025-01-10T13:00:00Z", notes: "Payment timeout" },
  { id: "txn-007", orderId: "ord-s007", orderNumber: "KSS-2025-00124", retailer: "Villanueva Tindahan",   method: "instapay",amount: 6400, status: "completed", reference: "IP-202501-007",   date: "2025-01-10T14:20:00Z" },
  { id: "txn-008", orderId: "ord-s008", orderNumber: "KSS-2025-00123", retailer: "Perez Store",           method: "terms",   amount: 15000,status: "processing", date: "2025-01-10T15:00:00Z", notes: "30-day credit terms approved" },
  { id: "txn-009", orderId: "ord-s009", orderNumber: "KSS-2025-00122", retailer: "Aquino Variety",        method: "qrph",    amount: 2850, status: "completed", reference: "QR-20250101-009", date: "2025-01-09T08:00:00Z" },
  { id: "txn-010", orderId: "ord-s010", orderNumber: "KSS-2025-00121", retailer: "Navarro Store",         method: "shopeepay",amount:1200, status: "completed", reference: "SP-20250102-010", date: "2025-01-09T09:30:00Z" },
  { id: "txn-011", orderId: "ord-s011", orderNumber: "KSS-2025-00120", retailer: "Domingo Tindahan",      method: "cod",     amount: 3600, status: "pending",   date: "2025-01-09T10:15:00Z", notes: "Driver out for delivery" },
  { id: "txn-012", orderId: "ord-s012", orderNumber: "KSS-2025-00119", retailer: "Mercado Store",         method: "palawan", amount: 900,  status: "completed", reference: "PX-00129843",     date: "2025-01-09T11:00:00Z" },
  { id: "txn-013", orderId: "ord-s013", orderNumber: "KSS-2025-00118", retailer: "Dela Peña Gen. Mdse",   method: "bank",    amount: 9750, status: "completed", reference: "BDO-20250102",    date: "2025-01-08T12:45:00Z" },
  { id: "txn-014", orderId: "ord-s014", orderNumber: "KSS-2025-00117", retailer: "Evangelista Sari-Sari", method: "gcash",   amount: 5500, status: "processing", date: "2025-01-08T14:00:00Z" },
  { id: "txn-015", orderId: "ord-s015", orderNumber: "KSS-2025-00116", retailer: "Guevarra Store",        method: "maya",    amount: 2100, status: "completed", reference: "MY-20250102-015", date: "2025-01-08T15:30:00Z" },
  { id: "txn-016", orderId: "ord-s016", orderNumber: "KSS-2025-00115", retailer: "Hernandez Grocery",     method: "cash",    amount: 750,  status: "completed", date: "2025-01-07T08:20:00Z", notes: "Walk-in warehouse purchase" },
  { id: "txn-017", orderId: "ord-s017", orderNumber: "KSS-2025-00114", retailer: "Ibarra Tindahan",       method: "cebuana", amount: 1450, status: "completed", reference: "CB-00398421",     date: "2025-01-07T09:45:00Z" },
  { id: "txn-018", orderId: "ord-s018", orderNumber: "KSS-2025-00113", retailer: "Javier General Mdse",   method: "terms",   amount: 22000,status: "pending",   date: "2025-01-07T11:00:00Z", notes: "30-day terms, due Feb 7" },
  { id: "txn-019", orderId: "ord-s019", orderNumber: "KSS-2025-00112", retailer: "Katipunan Store",       method: "gcash",   amount: 3350, status: "completed", reference: "GC-20250103-019", date: "2025-01-06T13:20:00Z" },
  { id: "txn-020", orderId: "ord-s020", orderNumber: "KSS-2025-00111", retailer: "Luna Variety",          method: "cod",     amount: 4200, status: "pending",   date: "2025-01-06T14:10:00Z", notes: "Out for delivery" },
];

// Merge and deduplicate by orderNumber, sort newest first
const ALL_TXS: Transaction[] = [
  ...ORDERS_AS_TXS,
  ...STATIC_TXS,
].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

// ─── Config maps ─────────────────────────────────────────────────────────────

const METHOD_CONFIG: Record<TxPaymentMethod, { label: string; icon: React.ReactNode; badgeClass: string }> = {
  gcash:     { label: "GCash",        icon: <Smartphone className="h-3 w-3" />, badgeClass: "bg-green-50 text-green-700 border-green-200" },
  maya:      { label: "Maya",         icon: <Wallet className="h-3 w-3" />,     badgeClass: "bg-purple-50 text-purple-700 border-purple-200" },
  cod:       { label: "COD",          icon: <Package className="h-3 w-3" />,    badgeClass: "bg-amber-50 text-amber-700 border-amber-200" },
  bank:      { label: "Bank Transfer",icon: <Banknote className="h-3 w-3" />,   badgeClass: "bg-sky-50 text-sky-700 border-sky-200" },
  instapay:  { label: "InstaPay",     icon: <RefreshCw className="h-3 w-3" />,  badgeClass: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  qrph:      { label: "QR Ph",        icon: <Smartphone className="h-3 w-3" />, badgeClass: "bg-blue-50 text-blue-700 border-blue-200" },
  shopeepay: { label: "ShopeePay",    icon: <Smartphone className="h-3 w-3" />, badgeClass: "bg-orange-50 text-orange-700 border-orange-200" },
  card:      { label: "Card",         icon: <Banknote className="h-3 w-3" />,   badgeClass: "bg-slate-50 text-slate-700 border-slate-200" },
  cash:      { label: "Cash",         icon: <Banknote className="h-3 w-3" />,   badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  palawan:   { label: "Palawan",      icon: <Banknote className="h-3 w-3" />,   badgeClass: "bg-teal-50 text-teal-700 border-teal-200" },
  cebuana:   { label: "Cebuana",      icon: <Banknote className="h-3 w-3" />,   badgeClass: "bg-yellow-50 text-yellow-800 border-yellow-300" },
  terms:     { label: "Credit Terms", icon: <Banknote className="h-3 w-3" />,   badgeClass: "bg-gray-50 text-gray-700 border-gray-200" },
  wallet:    { label: "KSS Wallet",   icon: <Wallet className="h-3 w-3" />,     badgeClass: "bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-foreground border-brand-200 dark:border-brand-500/30" },
  credit:    { label: "Credit",       icon: <Banknote className="h-3 w-3" />,   badgeClass: "bg-gray-50 text-gray-700 border-gray-200" },
};

const STATUS_CONFIG: Record<TxPaymentStatus, { label: string; icon: React.ReactNode; badgeVariant: "success" | "warning" | "danger" | "info" }> = {
  completed:  { label: "Collected",  icon: <CheckCircle2 className="h-3 w-3" />, badgeVariant: "success" },
  pending:    { label: "Pending",    icon: <Clock className="h-3 w-3" />,         badgeVariant: "warning" },
  processing: { label: "Processing", icon: <AlertCircle className="h-3 w-3" />,  badgeVariant: "info" },
  failed:     { label: "Failed",     icon: <XCircle className="h-3 w-3" />,       badgeVariant: "danger" },
};

// ─── KPI computation helpers ──────────────────────────────────────────────────

function sumWhere(txs: Transaction[], pred: (t: Transaction) => boolean) {
  return txs.filter(pred).reduce((s, t) => s + t.amount, 0);
}

function countWhere(txs: Transaction[], pred: (t: Transaction) => boolean) {
  return txs.filter(pred).length;
}

// ─── Static color maps (replacing dynamic `bg-${accent}-*` interpolation) ─────
// Tailwind purges dynamic class names; these must be fully spelled out.

const METHOD_CARD_ACTIVE: Record<string, string> = {
  amber:  "ring-2 ring-amber-400 bg-amber-50 border-amber-200",
  green:  "ring-2 ring-green-400 bg-green-50 border-green-200",
  purple: "ring-2 ring-purple-400 bg-purple-50 border-purple-200",
};

const METHOD_CARD_ICON: Record<string, string> = {
  amber:  "bg-amber-100 text-amber-700",
  green:  "bg-green-100 text-green-700",
  purple: "bg-purple-100 text-purple-700",
};

const METHOD_CARD_PROGRESS: Record<string, string> = {
  amber:  "bg-amber-400",
  green:  "bg-green-400",
  purple: "bg-purple-400",
};

// ─── Method breakdown (COD, GCash, Maya) ─────────────────────────────────────

interface MethodStat {
  method: TxPaymentMethod;
  count: number;
  total: number;
  completed: number;
  pending: number;
}

function computeMethodStats(txs: Transaction[], method: TxPaymentMethod): MethodStat {
  const subset = txs.filter((t) => t.method === method);
  return {
    method,
    count: subset.length,
    total: subset.reduce((s, t) => s + t.amount, 0),
    completed: subset.filter((t) => t.status === "completed").reduce((s, t) => s + t.amount, 0),
    pending: subset.filter((t) => t.status === "pending" || t.status === "processing").reduce((s, t) => s + t.amount, 0),
  };
}

// ─── Tab config ───────────────────────────────────────────────────────────────

const METHOD_TABS: { id: MethodTab; label: string; icon: React.ReactNode }[] = [
  { id: "all",   label: "All Methods", icon: <TrendingUp className="h-3.5 w-3.5" /> },
  { id: "cod",   label: "COD",         icon: <Package className="h-3.5 w-3.5" /> },
  { id: "gcash", label: "GCash",       icon: <Smartphone className="h-3.5 w-3.5" /> },
  { id: "maya",  label: "Maya",        icon: <Wallet className="h-3.5 w-3.5" /> },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function PaymentsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>(ALL_TXS);
  const [methodTab, setMethodTab] = useState<MethodTab>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [reconciledIds, setReconciledIds] = useState<Set<string>>(new Set());

  // ── Derived KPIs ─────────────────────────────────────────────────────────
  const collected = useMemo(
    () => sumWhere(transactions, (t) => t.status === "completed"),
    [transactions]
  );
  const collectedCount = useMemo(
    () => countWhere(transactions, (t) => t.status === "completed"),
    [transactions]
  );
  const pendingCodTotal = useMemo(
    () => sumWhere(transactions, (t) => t.method === "cod" && (t.status === "pending" || t.status === "processing")),
    [transactions]
  );
  const pendingCodCount = useMemo(
    () => countWhere(transactions, (t) => t.method === "cod" && (t.status === "pending" || t.status === "processing")),
    [transactions]
  );
  const failedTotal = useMemo(
    () => sumWhere(transactions, (t) => t.status === "failed"),
    [transactions]
  );
  const failedCount = useMemo(
    () => countWhere(transactions, (t) => t.status === "failed"),
    [transactions]
  );
  const totalPending = useMemo(
    () => sumWhere(transactions, (t) => t.status === "pending" || t.status === "processing"),
    [transactions]
  );
  const totalPendingCount = useMemo(
    () => countWhere(transactions, (t) => t.status === "pending" || t.status === "processing"),
    [transactions]
  );

  // ── Method stats ─────────────────────────────────────────────────────────
  const codStats   = useMemo(() => computeMethodStats(transactions, "cod"),   [transactions]);
  const gcashStats = useMemo(() => computeMethodStats(transactions, "gcash"), [transactions]);
  const mayaStats  = useMemo(() => computeMethodStats(transactions, "maya"),  [transactions]);

  // ── Filtered transaction list ─────────────────────────────────────────────
  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const matchTab =
        methodTab === "all" ||
        t.method === (methodTab as TxPaymentMethod);
      const matchStatus =
        statusFilter === "all" || t.status === statusFilter;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        t.orderNumber.toLowerCase().includes(q) ||
        t.retailer.toLowerCase().includes(q) ||
        (t.reference ?? "").toLowerCase().includes(q);
      return matchTab && matchStatus && matchSearch;
    });
  }, [transactions, methodTab, statusFilter, search]);

  // ── Reconcile action ─────────────────────────────────────────────────────
  function reconcile(id: string) {
    fetch(`/api/admin/payments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reconciled: true }),
    }).catch(() => {});
    setReconciledIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }

  const needsReconcile = useMemo(
    () =>
      transactions.filter(
        (t) => t.method === "cod" && (t.status === "pending" || t.status === "processing") && !reconciledIds.has(t.id)
      ),
    [transactions, reconciledIds]
  );

  // ── Mark Paid / Mark Failed ───────────────────────────────────────────────
  const handleMarkPaid = useCallback((paymentId: string) => {
    fetch(`/api/admin/payments/${paymentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    }).catch(() => {});
    setTransactions((prev) =>
      prev.map((p) => p.id === paymentId ? { ...p, status: "completed" as TxPaymentStatus } : p)
    );
    setSelected((prev) => prev?.id === paymentId ? { ...prev, status: "completed" as TxPaymentStatus } : prev);
    toastSuccess("Marked as paid");
  }, []);

  const handleMarkFailed = useCallback((paymentId: string) => {
    fetch(`/api/admin/payments/${paymentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "failed" }),
    }).catch(() => {});
    setTransactions((prev) =>
      prev.map((p) => p.id === paymentId ? { ...p, status: "failed" as TxPaymentStatus } : p)
    );
    setSelected((prev) => prev?.id === paymentId ? { ...prev, status: "failed" as TxPaymentStatus } : prev);
    toastSuccess("Marked as failed");
  }, []);

  return (
    <div className="p-5 space-y-5">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-foreground">
            Payments & Reconciliation
          </h1>
          <p className="text-sm text-muted-foreground">
            Real-time payment status across all orders and methods
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
          <Download className="h-3.5 w-3.5" /> Export
        </button>
      </div>

      {/* ── KPI cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="h-8 w-8 rounded-xl flex items-center justify-center mb-3 bg-success-50 dark:bg-success-500/10 text-success-700 dark:text-foreground">
              <TrendingUp className="h-4 w-4" />
            </div>
            <p className="font-display text-lg font-bold text-foreground">{formatPHP(collected)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total Collected</p>
            <p className="text-[10px] text-muted-foreground mt-1">{collectedCount} completed transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="h-8 w-8 rounded-xl flex items-center justify-center mb-3 bg-warning-50 dark:bg-warning-500/10 text-warning-700 dark:text-foreground">
              <Clock className="h-4 w-4" />
            </div>
            <p className="font-display text-lg font-bold text-foreground">{formatPHP(totalPending)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Pending Collection</p>
            <p className="text-[10px] text-muted-foreground mt-1">{totalPendingCount} awaiting payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="h-8 w-8 rounded-xl flex items-center justify-center mb-3 bg-amber-50 text-amber-600">
              <Package className="h-4 w-4" />
            </div>
            <p className="font-display text-lg font-bold text-foreground">{formatPHP(pendingCodTotal)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">COD to Reconcile</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              {needsReconcile.length} of {pendingCodCount} unreconciled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="h-8 w-8 rounded-xl flex items-center justify-center mb-3 bg-danger-50 dark:bg-danger-500/10 text-danger-700 dark:text-foreground">
              <TrendingDown className="h-4 w-4" />
            </div>
            <p className="font-display text-lg font-bold text-foreground">{formatPHP(failedTotal)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Failed / Refund</p>
            <p className="text-[10px] text-muted-foreground mt-1">{failedCount} failed transactions</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Payment method breakdown: COD / GCash / Maya ────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { stats: codStats,   label: "COD",   accent: "amber",  icon: <Package className="h-5 w-5" />,    tab: "cod"   },
          { stats: gcashStats, label: "GCash",  accent: "green",  icon: <Smartphone className="h-5 w-5" />, tab: "gcash" },
          { stats: mayaStats,  label: "Maya",   accent: "purple", icon: <Wallet className="h-5 w-5" />,     tab: "maya"  },
        ].map(({ stats, label, accent, icon, tab }) => (
          <button
            key={label}
            onClick={() => setMethodTab(methodTab === tab ? "all" : (tab as MethodTab))}
            className={cn(
              "rounded-2xl border p-4 text-left transition-all hover:shadow-sm active:scale-[0.99]",
              methodTab === tab
                ? METHOD_CARD_ACTIVE[accent]
                : "bg-card border-border"
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={cn(
                "h-9 w-9 rounded-xl flex items-center justify-center",
                METHOD_CARD_ICON[accent]
              )}>
                {icon}
              </div>
              <span className="text-[11px] font-semibold text-muted-foreground">
                {stats.count} orders
              </span>
            </div>
            <p className="font-display text-base font-bold text-foreground">{label}</p>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Collected</span>
                <span className="font-semibold text-success-700 dark:text-foreground">{formatPHP(stats.completed)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Pending</span>
                <span className="font-semibold text-amber-600">{formatPHP(stats.pending)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Total</span>
                <span className="font-bold text-foreground">{formatPHP(stats.total)}</span>
              </div>
            </div>
            {stats.pending > 0 && (
              <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn("h-full rounded-full", METHOD_CARD_PROGRESS[accent])}
                  style={{ width: `${Math.round((stats.completed / (stats.total || 1)) * 100)}%` }}
                />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* ── COD reconciliation alert ─────────────────────────────────────── */}
      {needsReconcile.length > 0 && (
        <div className="rounded-2xl border border-warning-200 bg-warning-50 dark:bg-warning-500/10 dark:bg-surface-800 dark:border-warning-600/40 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-warning-700 dark:text-foreground shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-warning-800">
                {needsReconcile.length} COD {needsReconcile.length === 1 ? "order needs" : "orders need"} reconciliation
              </p>
              <p className="text-xs text-amber-700 dark:text-foreground mt-0.5">
                {formatPHP(needsReconcile.reduce((s, t) => s + t.amount, 0))} in cash collections awaiting driver confirmation.
              </p>
              <button
                onClick={() => setMethodTab("cod")}
                className="mt-2 text-[11px] font-semibold text-warning-800 underline underline-offset-2"
              >
                View COD transactions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {/* Method tabs */}
        <div className="flex gap-1 bg-surface-100 dark:bg-surface-800 rounded-xl p-1 w-full sm:w-auto sm:inline-flex">
          {METHOD_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setMethodTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                methodTab === tab.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.icon}
              {tab.label}
              <span className={cn(
                "text-[10px] rounded-full px-1.5 py-0.5 font-bold",
                methodTab === tab.id ? "bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-400" : "bg-muted text-muted-foreground"
              )}>
                {tab.id === "all"
                  ? transactions.length
                  : transactions.filter((t) => t.method === tab.id).length}
              </span>
            </button>
          ))}
        </div>

        {/* Search + status filter row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search order #, retailer, reference..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-xl border border-input bg-card pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-xl border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Collected</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* ── Transaction table ────────────────────────────────────────────── */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-50 dark:bg-surface-900">
                {["Order #", "Retailer", "Method", "Amount", "Status", "Date", "Action"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((tx) => {
                const method = METHOD_CONFIG[tx.method];
                const statusCfg = STATUS_CONFIG[tx.status];
                const isReconciled = reconciledIds.has(tx.id);
                const isCodPending =
                  tx.method === "cod" &&
                  (tx.status === "pending" || tx.status === "processing") &&
                  !isReconciled;

                return (
                  <tr
                    key={tx.id}
                    className={cn(
                      "hover:bg-muted/40 transition-colors cursor-pointer",
                      isReconciled && "opacity-60"
                    )}
                    onClick={() => setSelected(tx)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-medium text-foreground">
                          {tx.orderNumber}
                        </span>
                        {isReconciled && (
                          <Badge variant="success" className="text-[9px] px-1.5 py-0">
                            Reconciled
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-foreground font-medium truncate max-w-[160px] block">
                        {tx.retailer}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold",
                          method?.badgeClass
                        )}
                      >
                        {method?.icon}
                        {method?.label ?? tx.method}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-bold text-foreground">
                        {formatPHP(tx.amount)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusCfg.badgeVariant}>
                        {statusCfg.icon}
                        {statusCfg.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(tx.date)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {isCodPending && (
                          <button
                            onClick={() => reconcile(tx.id)}
                            className="inline-flex items-center gap-1 rounded-lg bg-amber-700 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-amber-800 transition-colors"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Reconcile
                          </button>
                        )}
                        <button
                          className="text-brand-500 hover:text-brand-600"
                          onClick={() => setSelected(tx)}
                        >
                          <ArrowUpRight className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-border px-4 py-3 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {filtered.length} of {transactions.length} transactions
          </p>
          <p className="text-xs font-semibold text-foreground">
            Filtered total: {formatPHP(filtered.reduce((s, t) => s + t.amount, 0))}
          </p>
        </div>
      </Card>

      {/* ── Transaction detail drawer ────────────────────────────────────── */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-card rounded-3xl shadow-card-md w-full max-w-md p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display text-base font-bold text-foreground">
                  {selected.orderNumber}
                </p>
                <p className="text-sm text-muted-foreground">{selected.retailer}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-muted-foreground hover:text-foreground text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="rounded-2xl bg-surface-50 dark:bg-surface-900 border border-border p-4 space-y-3">
              {[
                {
                  label: "Amount",
                  value: (
                    <span className="font-bold text-brand-500 text-base">
                      {formatPHP(selected.amount)}
                    </span>
                  ),
                },
                {
                  label: "Method",
                  value: (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold",
                        METHOD_CONFIG[selected.method]?.badgeClass
                      )}
                    >
                      {METHOD_CONFIG[selected.method]?.icon}
                      {METHOD_CONFIG[selected.method]?.label ?? selected.method}
                    </span>
                  ),
                },
                {
                  label: "Status",
                  value: (
                    <Badge variant={STATUS_CONFIG[selected.status].badgeVariant}>
                      {STATUS_CONFIG[selected.status].icon}
                      {STATUS_CONFIG[selected.status].label}
                    </Badge>
                  ),
                },
                {
                  label: "Reconciled",
                  value: reconciledIds.has(selected.id) ? (
                    <Badge variant="success">Yes</Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">No</span>
                  ),
                },
                {
                  label: "Reference",
                  value: (
                    <span className="font-mono text-xs">
                      {selected.reference ?? "No reference"}
                    </span>
                  ),
                },
                { label: "Date", value: formatDate(selected.date) },
                ...(selected.notes
                  ? [{ label: "Notes", value: <span className="text-xs">{selected.notes}</span> }]
                  : []),
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-4">
                  <span className="text-xs text-muted-foreground shrink-0">{row.label}</span>
                  <span className="text-sm text-foreground text-right">{row.value}</span>
                </div>
              ))}
            </div>

            {selected.method === "cod" &&
              (selected.status === "pending" || selected.status === "processing") &&
              !reconciledIds.has(selected.id) && (
                <button
                  onClick={() => {
                    reconcile(selected.id);
                    setSelected(null);
                  }}
                  className="w-full h-10 rounded-xl bg-amber-700 text-white text-sm font-semibold hover:bg-amber-800 transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Mark as Reconciled
                </button>
              )}

            {selected.method !== "cod" &&
              (selected.status === "pending" || selected.status === "processing") && (
                <div className="flex gap-2">
                  <button
                    onClick={() => { handleMarkPaid(selected.id); }}
                    className="flex-1 h-10 rounded-xl bg-success-700 text-white text-sm font-semibold hover:bg-success-800 transition-colors"
                  >
                    Mark Paid
                  </button>
                  <button
                    onClick={() => { handleMarkFailed(selected.id); }}
                    className="flex-1 h-10 rounded-xl border border-danger-200 text-danger-700 dark:text-foreground text-sm font-semibold hover:bg-danger-50 dark:bg-danger-500/10 transition-colors"
                  >
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
