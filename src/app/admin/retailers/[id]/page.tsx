"use client";

import { useState, useMemo } from "react";
import {
  TrendingUp, ShoppingCart, Users, Package, Download, CheckCircle2,
  Clock, RefreshCw, UserPlus, Wallet, Printer, FileText, BarChart2,
  Truck, Activity, ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPHP, formatNumber } from "@/lib/utils";
import { ADMIN_STATS, MOCK_ORDERS, PRODUCTS } from "@/lib/mock-data";

// --- Static chart / summary data ---------------------------------------------

const MONTHLY_REVENUE = [890000, 1020000, 1150000, 1340000, 1480000, 1250000];
const MONTHS = ["Aug '25", "Sep '25", "Oct '25", "Nov '25", "Dec '25", "Jan '26"];
const maxRevenue = Math.max(...MONTHLY_REVENUE);

const TOP_CATEGORIES = [
  { name: "Beverages",       revenue: 420000, pct: 32, color: "bg-blue-500" },
  { name: "Instant Noodles", revenue: 285000, pct: 22, color: "bg-yellow-500" },
  { name: "Snacks",          revenue: 210000, pct: 16, color: "bg-red-500" },
  { name: "Canned Goods",    revenue: 195000, pct: 15, color: "bg-orange-500" },
  { name: "Others",          revenue: 196000, pct: 15, color: "bg-slate-400" },
];

const KEY_METRICS = [
  { label: "Order Fulfillment Rate",  value: "96.8%", icon: CheckCircle2, color: "text-success-700 dark:text-foreground bg-success-50 dark:bg-success-500/10" },
  { label: "Avg. Delivery Time",      value: "1.8 days", icon: Clock,      color: "text-info-600 dark:text-foreground bg-info-50 dark:bg-info-500/10" },
  { label: "Customer Retention",      value: "87%",   icon: RefreshCw,   color: "text-brand-700 dark:text-foreground bg-brand-50 dark:bg-brand-500/10" },
  { label: "New Retailer Conversion", value: "68%",   icon: UserPlus,    color: "text-purple-600 bg-purple-50" },
  { label: "Payment Collection Rate", value: "98.2%", icon: Wallet,      color: "text-emerald-600 bg-emerald-50" },
];

const TOP_RETAILERS = [
  { name: "Aling Nena's Store",      orders: 48, revenue: 184200, status: "Active" },
  { name: "Mang Tony Sari-Sari",     orders: 41, revenue: 156800, status: "Active" },
  { name: "JB General Merchandise",  orders: 37, revenue: 142500, status: "Active" },
  { name: "Rose Convenience Store",  orders: 32, revenue: 118400, status: "Active" },
  { name: "Dela Cruz Store",         orders: 28, revenue: 97600,  status: "Active" },
];

const STATUS_COLORS: Record<string, string> = {
  Active:   "bg-success-50 dark:bg-success-500/10 text-success-700 dark:text-foreground",
  Inactive: "bg-surface-100 dark:bg-surface-800 text-muted-foreground",
};

// --- Generate-report types ----------------------------------------------------

type ReportType = "sales" | "inventory" | "delivery" | "retailer";
type DateRange = "7d" | "30d" | "90d" | "all";

const REPORT_OPTIONS: { value: ReportType; label: string; icon: React.ElementType }[] = [
  { value: "sales",     label: "Sales Summary",         icon: BarChart2 },
  { value: "inventory", label: "Inventory Status",      icon: Package },
  { value: "delivery",  label: "Delivery Performance",  icon: Truck },
  { value: "retailer",  label: "Retailer Activity",     icon: Activity },
];

const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: "7d",  label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "all", label: "All time" },
];

function getCutoff(range: DateRange): Date | null {
  if (range === "all") return null;
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

// --- Report computation helpers -----------------------------------------------

function computeSalesSummary(cutoff: Date | null) {
  const orders = cutoff
    ? MOCK_ORDERS.filter((o) => new Date(o.createdAt) >= cutoff)
    : MOCK_ORDERS;

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Tally product revenue from order items
  const productRevMap: Record<string, number> = {};
  for (const order of orders) {
    for (const item of order.items) {
      productRevMap[item.productId] = (productRevMap[item.productId] ?? 0) + item.totalPrice;
    }
  }

  const top5 = Object.entries(productRevMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([pid, rev]) => {
      const p = PRODUCTS.find((x) => x.id === pid);
      return { name: p?.name ?? pid, revenue: rev, sku: p?.sku ?? "" };
    });

  return { totalOrders, totalRevenue, avgOrderValue, top5 };
}

function computeInventoryStatus() {
  const totalSKUs = PRODUCTS.length;
  const outOfStock = PRODUCTS.filter((p) => p.stock === 0).length;
  const lowStock = PRODUCTS.filter((p) => p.stock > 0 && p.stock <= p.lowStockThreshold).length;
  const needReorder = outOfStock + lowStock;

  const items = PRODUCTS.map((p) => ({
    name: p.name,
    sku: p.sku,
    stock: p.stock,
    threshold: p.lowStockThreshold,
    status: p.stock === 0 ? "Out of Stock" : p.stock <= p.lowStockThreshold ? "Low Stock" : "OK",
  }))
    .sort((a, b) => {
      const rank = (s: string) => (s === "Out of Stock" ? 0 : s === "Low Stock" ? 1 : 2);
      return rank(a.status) - rank(b.status);
    })
    .slice(0, 15);

  return { totalSKUs, outOfStock, lowStock, needReorder, items };
}

function computeDeliveryPerformance(cutoff: Date | null) {
  const orders = cutoff
    ? MOCK_ORDERS.filter((o) => new Date(o.createdAt) >= cutoff)
    : MOCK_ORDERS;

  const total = orders.length;
  const delivered = orders.filter((o) => o.status === "delivered").length;
  const failed = orders.filter((o) => o.status === "failed_delivery").length;
  const deliveredPct = total > 0 ? (delivered / total) * 100 : 0;
  const failedRate = total > 0 ? (failed / total) * 100 : 0;
  // Mock avg delivery time based on status distribution
  const avgDeliveryTime = 1.8;

  const rows = orders.slice(0, 10).map((o) => ({
    orderNumber: o.orderNumber,
    status: o.status,
    total: o.total,
    createdAt: new Date(o.createdAt).toLocaleDateString("en-PH"),
  }));

  return { deliveredPct, avgDeliveryTime, failedRate, delivered, failed, total, rows };
}

function computeRetailerActivity(cutoff: Date | null) {
  const orders = cutoff
    ? MOCK_ORDERS.filter((o) => new Date(o.createdAt) >= cutoff)
    : MOCK_ORDERS;

  // Group by storeId
  const storeMap: Record<string, { orders: number; revenue: number }> = {};
  for (const o of orders) {
    if (!storeMap[o.storeId]) storeMap[o.storeId] = { orders: 0, revenue: 0 };
    storeMap[o.storeId].orders += 1;
    storeMap[o.storeId].revenue += o.total;
  }

  const activeRetailers = Object.keys(storeMap).length;
  const avgOrdersPerRetailer =
    activeRetailers > 0
      ? Object.values(storeMap).reduce((s, v) => s + v.orders, 0) / activeRetailers
      : 0;

  const rows = Object.entries(storeMap)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 10)
    .map(([storeId, v]) => ({
      storeId,
      orders: v.orders,
      revenue: v.revenue,
    }));

  return { activeRetailers, avgOrdersPerRetailer, rows };
}

// --- CSV generation -----------------------------------------------------------

function downloadCSV(filename: string, rows: string[][], headers: string[]) {
  const escape = (v: string) =>
    /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  const lines = [headers, ...rows].map((r) => r.map(escape).join(","));
  const csv = lines.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// --- Sub-components -----------------------------------------------------------

function StatusPill({ status }: { status: string }) {
  const cls =
    status === "Out of Stock"
      ? "bg-red-50 text-red-700"
      : status === "Low Stock"
      ? "bg-yellow-50 text-yellow-700"
      : "bg-success-50 dark:bg-success-500/10 text-success-700 dark:text-foreground";
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${cls}`}>
      {status}
    </span>
  );
}

function OrderStatusPill({ status }: { status: string }) {
  const labels: Record<string, string> = {
    pending: "Pending", confirmed: "Confirmed", picking: "Picking",
    packed: "Packed", out_for_delivery: "Out for Delivery",
    delivered: "Delivered", cancelled: "Cancelled",
    failed_delivery: "Failed", returned: "Returned",
  };
  const cls =
    status === "delivered"
      ? "bg-success-50 dark:bg-success-500/10 text-success-700 dark:text-foreground"
      : status === "failed_delivery" || status === "cancelled"
      ? "bg-red-50 text-red-700"
      : status === "out_for_delivery"
      ? "bg-blue-50 text-blue-700"
      : "bg-surface-100 dark:bg-surface-800 text-muted-foreground";
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${cls}`}>
      {labels[status] ?? status}
    </span>
  );
}

// --- Generate Report Section --------------------------------------------------

function GenerateReportSection() {
  const [reportType, setReportType] = useState<ReportType | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>("30d");

  const cutoff = useMemo(() => getCutoff(dateRange), [dateRange]);

  const salesData = useMemo(
    () => (reportType === "sales" ? computeSalesSummary(cutoff) : null),
    [reportType, cutoff],
  );
  const invData = useMemo(
    () => (reportType === "inventory" ? computeInventoryStatus() : null),
    [reportType],
  );
  const delivData = useMemo(
    () => (reportType === "delivery" ? computeDeliveryPerformance(cutoff) : null),
    [reportType, cutoff],
  );
  const retailData = useMemo(
    () => (reportType === "retailer" ? computeRetailerActivity(cutoff) : null),
    [reportType, cutoff],
  );

  function handleDownload() {
    if (!reportType) return;
    const rangeLabel = DATE_RANGE_OPTIONS.find((d) => d.value === dateRange)?.label ?? dateRange;

    if (salesData) {
      const headers = ["Product", "SKU", "Revenue (PHP)"];
      const rows = salesData.top5.map((r) => [r.name, r.sku, String(r.revenue)]);
      rows.unshift(
        ["Total Orders", "", String(salesData.totalOrders)],
        ["Total Revenue", "", String(salesData.totalRevenue)],
        ["Avg Order Value", "", String(Math.round(salesData.avgOrderValue))],
        ["---", "", "---"],
      );
      downloadCSV(`sales-summary-${rangeLabel.replace(/\s+/g, "-").toLowerCase()}.csv`, rows, headers);
    } else if (invData) {
      const headers = ["Product", "SKU", "Stock", "Threshold", "Status"];
      const rows = invData.items.map((r) => [
        r.name, r.sku, String(r.stock), String(r.threshold), r.status,
      ]);
      downloadCSV("inventory-status.csv", rows, headers);
    } else if (delivData) {
      const headers = ["Order #", "Status", "Total (PHP)", "Date"];
      const rows = delivData.rows.map((r) => [r.orderNumber, r.status, String(r.total), r.createdAt]);
      downloadCSV(`delivery-performance-${rangeLabel.replace(/\s+/g, "-").toLowerCase()}.csv`, rows, headers);
    } else if (retailData) {
      const headers = ["Store ID", "Orders", "Revenue (PHP)"];
      const rows = retailData.rows.map((r) => [r.storeId, String(r.orders), String(r.revenue)]);
      downloadCSV(`retailer-activity-${rangeLabel.replace(/\s+/g, "-").toLowerCase()}.csv`, rows, headers);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-brand-700" />
              Generate Report
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Select a report type and date range, then download as CSV
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Date range selector */}
            <div className="relative">
              <select
                className="appearance-none rounded-lg border border-border bg-surface-50 dark:bg-surface-900 pl-3 pr-8 py-2 text-sm font-medium text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-700 cursor-pointer"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as DateRange)}
              >
                {DATE_RANGE_OPTIONS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>

            {reportType && (
              <Button size="md" variant="outline" onClick={handleDownload}>
                <Download className="h-4 w-4" /> Download CSV
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-0">
        {/* Report type selector */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {REPORT_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const selected = reportType === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setReportType(selected ? null : opt.value)}
                className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all text-left
                  ${selected
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-foreground shadow-sm"
                    : "border-border bg-surface-50 dark:bg-surface-900 text-surface-900 hover:border-brand-300 hover:bg-brand-50 dark:bg-brand-500/10/50"
                  }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${selected ? "text-brand-700" : "text-muted-foreground"}`} />
                <span className="leading-tight">{opt.label}</span>
              </button>
            );
          })}
        </div>

        {/* Preview table � Sales Summary */}
        {salesData && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Total Orders",    value: formatNumber(salesData.totalOrders) },
                { label: "Total Revenue",   value: formatPHP(salesData.totalRevenue) },
                { label: "Avg Order Value", value: formatPHP(Math.round(salesData.avgOrderValue)) },
              ].map((kpi) => (
                <div key={kpi.label} className="rounded-xl border border-border bg-surface-50 dark:bg-surface-900 px-4 py-3">
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className="font-display text-xl font-bold text-surface-900 mt-0.5">{kpi.value}</p>
                </div>
              ))}
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Top 5 Products by Revenue
              </p>
              {salesData.top5.length === 0 ? (
                <p className="text-sm text-muted-foreground italic py-4 text-center">
                  No order line-item data in this period.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-surface-50 dark:bg-surface-900">
                        <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">#</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">Product</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">SKU</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesData.top5.map((row, i) => (
                        <tr key={i} className="border-b border-border last:border-0">
                          <td className="px-4 py-2.5 text-xs font-bold text-muted-foreground">{i + 1}</td>
                          <td className="px-4 py-2.5 font-medium text-foreground max-w-[220px] truncate">{row.name}</td>
                          <td className="px-4 py-2.5 text-xs text-muted-foreground font-mono">{row.sku}</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-foreground">{formatPHP(row.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Preview table � Inventory Status */}
        {invData && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Total SKUs",      value: invData.totalSKUs.toString() },
                { label: "Out of Stock",    value: invData.outOfStock.toString() },
                { label: "Low Stock",       value: invData.lowStock.toString() },
                { label: "Needs Reorder",   value: invData.needReorder.toString() },
              ].map((kpi) => (
                <div key={kpi.label} className="rounded-xl border border-border bg-surface-50 dark:bg-surface-900 px-4 py-3">
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className="font-display text-xl font-bold text-surface-900 mt-0.5">{kpi.value}</p>
                </div>
              ))}
            </div>

            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Items Needing Attention (top 15)
            </p>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-50 dark:bg-surface-900">
                    <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">Product</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">SKU</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">Stock</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">Threshold</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invData.items.map((row, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="px-4 py-2.5 font-medium text-foreground max-w-[200px] truncate">{row.name}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground font-mono">{row.sku}</td>
                      <td className="px-4 py-2.5 text-right text-foreground">{row.stock}</td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground">{row.threshold}</td>
                      <td className="px-4 py-2.5 text-right"><StatusPill status={row.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Preview table � Delivery Performance */}
        {delivData && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Total Orders",    value: delivData.total.toString() },
                { label: "Delivered",       value: `${delivData.deliveredPct.toFixed(1)}%` },
                { label: "Avg Delivery",    value: `${delivData.avgDeliveryTime} days` },
                { label: "Failed Rate",     value: `${delivData.failedRate.toFixed(1)}%` },
              ].map((kpi) => (
                <div key={kpi.label} className="rounded-xl border border-border bg-surface-50 dark:bg-surface-900 px-4 py-3">
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className="font-display text-xl font-bold text-surface-900 mt-0.5">{kpi.value}</p>
                </div>
              ))}
            </div>

            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Recent Orders
            </p>
            {delivData.rows.length === 0 ? (
              <p className="text-sm text-muted-foreground italic py-4 text-center">
                No orders in this period.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-50 dark:bg-surface-900">
                      <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">Order #</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">Status</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">Total</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {delivData.rows.map((row, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        <td className="px-4 py-2.5 font-mono text-xs text-foreground">{row.orderNumber}</td>
                        <td className="px-4 py-2.5"><OrderStatusPill status={row.status} /></td>
                        <td className="px-4 py-2.5 text-right font-semibold text-foreground">{formatPHP(row.total)}</td>
                        <td className="px-4 py-2.5 text-right text-muted-foreground">{row.createdAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Preview table � Retailer Activity */}
        {retailData && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Active Retailers",       value: retailData.activeRetailers.toString() },
                { label: "Avg Orders / Retailer",  value: retailData.avgOrdersPerRetailer.toFixed(1) },
              ].map((kpi) => (
                <div key={kpi.label} className="rounded-xl border border-border bg-surface-50 dark:bg-surface-900 px-4 py-3">
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className="font-display text-xl font-bold text-surface-900 mt-0.5">{kpi.value}</p>
                </div>
              ))}
            </div>

            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Top Retailers by Revenue
            </p>
            {retailData.rows.length === 0 ? (
              <p className="text-sm text-muted-foreground italic py-4 text-center">
                No retailer activity in this period.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-50 dark:bg-surface-900">
                      <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">#</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">Store ID</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">Orders</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {retailData.rows.map((row, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        <td className="px-4 py-2.5 text-xs font-bold text-muted-foreground">{i + 1}</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-foreground">{row.storeId}</td>
                        <td className="px-4 py-2.5 text-right text-foreground">{row.orders}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-foreground">{formatPHP(row.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {!reportType && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Select a report type above to preview data</p>
            <p className="text-xs text-muted-foreground mt-1">Then download as CSV for offline use</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- Page ---------------------------------------------------------------------

export default function AdminReportsPage() {
  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto print:p-0 print:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Business Intelligence</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Performance overview � Jan 2026</p>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <Button variant="outline" size="md" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Monthly Revenue",  value: formatPHP(ADMIN_STATS.revenueMonth),     icon: TrendingUp,   color: "text-success-700 dark:text-foreground bg-success-50 dark:bg-success-500/10",  delta: "+12.4%" },
          { label: "Total Orders",     value: formatNumber(ADMIN_STATS.totalOrders),   icon: ShoppingCart, color: "text-info-600 dark:text-foreground bg-info-50 dark:bg-info-500/10",        delta: "+8.1%" },
          { label: "Active Retailers", value: ADMIN_STATS.activeRetailers.toString(),  icon: Users,        color: "text-brand-700 dark:text-foreground bg-brand-50 dark:bg-brand-500/10",       delta: "+5" },
          { label: "New Retailers",    value: ADMIN_STATS.newRetailersMonth.toString(),icon: Package,      color: "text-purple-600 bg-purple-50",     delta: "This month" },
        ].map((s) => (
          <Card key={s.label} className="p-5 h-28 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <span className="text-[11px] font-medium text-success-700 dark:text-foreground bg-success-50 dark:bg-success-500/10 rounded-full px-2 py-0.5">{s.delta}</span>
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-foreground leading-none">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Revenue Overview + Category breakdown */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Horizontal bar chart */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle>Revenue Overview</CardTitle>
            <p className="text-xs text-muted-foreground">Aug 2025 � Jan 2026</p>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {MONTHLY_REVENUE.map((v, i) => {
              const pct = (v / maxRevenue) * 100;
              const label = v >= 1_000_000
                ? `?${(v / 1_000_000).toFixed(2)}M`
                : `?${(v / 1000).toFixed(0)}k`;
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-14 shrink-0">{MONTHS[i]}</span>
                  <div className="flex-1 h-8 bg-surface-100 dark:bg-surface-800 rounded-lg overflow-hidden relative">
                    <div
                      className="h-full bg-brand-700 dark:bg-brand-500 rounded-lg flex items-center px-2 transition-all"
                      style={{ width: `${pct}%` }}
                    >
                      {pct > 25 && (
                        <span className="text-[11px] font-semibold text-white whitespace-nowrap">{label}</span>
                      )}
                    </div>
                    {pct <= 25 && (
                      <span
                        className="absolute top-1/2 -translate-y-1/2 text-[11px] font-semibold text-foreground whitespace-nowrap"
                        style={{ left: `${pct + 1}%` }}
                      >{label}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Top categories */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle>Revenue by Category</CardTitle>
            <p className="text-xs text-muted-foreground">Jan 2026</p>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {TOP_CATEGORIES.map((cat) => (
              <div key={cat.name}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${cat.color}`} />
                    <p className="text-xs font-medium text-foreground truncate">{cat.name}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-2 shrink-0">
                    <span className="text-[11px] text-muted-foreground">{cat.pct}%</span>
                    <span className="text-xs font-semibold text-foreground">{formatPHP(cat.revenue)}</span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-surface-100 dark:bg-surface-800">
                  <div className={`h-2 rounded-full ${cat.color}`} style={{ width: `${cat.pct}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Key Metrics + Top Retailers */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Key metrics */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle>Key Metrics</CardTitle>
            <p className="text-xs text-muted-foreground">Operational health indicators</p>
          </CardHeader>
          <CardContent className="space-y-1 pt-0">
            {KEY_METRICS.map((m) => (
              <div key={m.label} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${m.color}`}>
                    <m.icon className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-sm text-foreground">{m.label}</p>
                </div>
                <span className="text-sm font-bold text-foreground">{m.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Top retailers */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle>Top Retailers This Month</CardTitle>
            <p className="text-xs text-muted-foreground">By revenue � Jan 2026</p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-2 text-left text-xs font-semibold text-muted-foreground w-8">#</th>
                    <th className="pb-2 text-left text-xs font-semibold text-muted-foreground">Store</th>
                    <th className="pb-2 text-right text-xs font-semibold text-muted-foreground">Orders</th>
                    <th className="pb-2 text-right text-xs font-semibold text-muted-foreground">Revenue</th>
                    <th className="pb-2 text-right text-xs font-semibold text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {TOP_RETAILERS.map((r, i) => (
                    <tr key={r.name} className="border-b border-border last:border-0">
                      <td className="py-3 text-xs font-bold text-muted-foreground">{i + 1}</td>
                      <td className="py-3">
                        <p className="text-sm font-medium text-foreground">{r.name}</p>
                      </td>
                      <td className="py-3 text-right text-sm text-foreground">{r.orders}</td>
                      <td className="py-3 text-right text-sm font-semibold text-foreground">{formatPHP(r.revenue)}</td>
                      <td className="py-3 text-right">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_COLORS[r.status] ?? ""}`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generate Report Section */}
      <GenerateReportSection />
    </div>
  );
}
