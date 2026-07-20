"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Phone, MapPin, Calendar, CreditCard,
  ShoppingCart, Package, TrendingUp, Clock,
  Bell, AlertTriangle, Download, ChevronRight,
  CheckCircle2, Pencil, MessageSquare,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatPHP } from "@/lib/utils";

// Mock retailer data — in production, fetch from API by params.id
const MOCK_RETAILERS = [
  {
    id: "r1",
    name: "Santos Sari-Sari Store",
    owner: "Maria Santos",
    phone: "+63 917 123 4567",
    location: "Brgy. San Jose, Caloocan City, Metro Manila",
    memberSince: "February 1, 2024",
    subscriptionPlan: "Free Trial (Year 1)",
    subscriptionPrice: "Free → PHP 200/month from Year 2",
    subscriptionPaidOn: "February 1, 2025",
    subscriptionPaidVia: "—",
    subscriptionRenews: "February 1, 2026",
    initials: "MS",
  },
  {
    id: "r2",
    name: "Reyes General Store",
    owner: "Lourdes Reyes",
    phone: "+63 918 234 5678",
    location: "Brgy. Poblacion, Quezon City, Metro Manila",
    memberSince: "March 15, 2024",
    subscriptionPlan: "Monthly",
    subscriptionPrice: "PHP 200/month",
    subscriptionPaidOn: "March 15, 2025",
    subscriptionPaidVia: "Maya",
    subscriptionRenews: "April 15, 2026",
    initials: "LR",
  },
  {
    id: "r3",
    name: "Cruz Mini Mart",
    owner: "Jose Cruz",
    phone: "+63 919 345 6789",
    location: "Brgy. Bagumbayan, Marikina City, Metro Manila",
    memberSince: "April 5, 2024",
    subscriptionPlan: "Monthly",
    subscriptionPrice: "PHP 200/month",
    subscriptionPaidOn: "June 5, 2025",
    subscriptionPaidVia: "GCash",
    subscriptionRenews: "July 5, 2025",
    initials: "JC",
  },
  {
    id: "r4",
    name: "Dela Cruz Tindahan",
    owner: "Ana Dela Cruz",
    phone: "+63 920 456 7890",
    location: "Brgy. San Antonio, Pasig City, Metro Manila",
    memberSince: "January 10, 2024",
    subscriptionPlan: "Free Trial (Year 1)",
    subscriptionPrice: "Free → PHP 200/month from Year 2",
    subscriptionPaidOn: "January 10, 2025",
    subscriptionPaidVia: "—",
    subscriptionRenews: "January 10, 2026",
    initials: "AD",
  },
];

const STATS = [
  { label: "Total Orders",  value: "24",          icon: ShoppingCart },
  { label: "Total Spent",   value: "PHP 45,280",  icon: TrendingUp },
  { label: "Average Order", value: "PHP 1,887",   icon: Package },
  { label: "Last Order",    value: "Jan 20, 2025", icon: Clock },
];

const RECENT_ORDERS = [
  { id: "KSS-2025-00142", date: "Jan 20", amount: 1500, status: "out_for_delivery", payment: "GCash" },
  { id: "KSS-2025-00141", date: "Jan 17", amount: 2320, status: "delivered",        payment: "COD"   },
  { id: "KSS-2025-00138", date: "Jan 12", amount: 1970, status: "delivered",        payment: "GCash" },
  { id: "KSS-2025-00135", date: "Jan 8",  amount: 890,  status: "delivered",        payment: "Maya"  },
  { id: "KSS-2025-00130", date: "Jan 3",  amount: 3200, status: "delivered",        payment: "GCash" },
];

const ORDER_STATUS_LABEL: Record<string, string> = {
  out_for_delivery: "Out for Delivery",
  delivered:        "Delivered",
  pending:          "Pending",
  confirmed:        "Confirmed",
};

const ORDER_STATUS_STYLE: Record<string, string> = {
  out_for_delivery: "bg-brand-50 text-brand-600 border-brand-500/25",
  delivered:        "bg-success-50 text-success-700 border-success-500/25",
  pending:          "bg-warning-50 text-warning-700 border-warning-500/25",
  confirmed:        "bg-blue-50 text-blue-600 border-blue-200",
};

const PAYMENT_CHIP: Record<string, string> = {
  GCash: "bg-blue-50 text-blue-700",
  COD:   "bg-surface-100 text-surface-700",
  Maya:  "bg-green-50 text-green-700",
};

export default function AdminRetailerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [retailerOverride, setRetailerOverride] = useState<typeof MOCK_RETAILERS[0] | null>(null);
  const retailer = retailerOverride ?? MOCK_RETAILERS.find((r) => r.id === id) ?? MOCK_RETAILERS[0];

  useEffect(() => {
    if (!id) return;
    fetch(`/api/admin/retailers/${id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.retailer) setRetailerOverride(data.retailer);
      })
      .catch(() => {});
  }, [id]);

  const [suspendConfirm, setSuspendConfirm] = useState(false);
  const [suspended, setSuspended] = useState(false);
  const [suspending, setSuspending] = useState(false);
  const [suspendError, setSuspendError] = useState<string | null>(null);

  async function handleConfirmSuspend() {
    setSuspending(true);
    setSuspendError(null);
    try {
      const res = await fetch(`/api/admin/retailers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "suspend" }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSuspended(true);
      setSuspendConfirm(false);
    } catch (err) {
      setSuspendError(err instanceof Error ? err.message : "Failed to suspend account");
    } finally {
      setSuspending(false);
    }
  }

  return (
    <div className="p-6 space-y-5 max-w-4xl mx-auto">

      {/* 1. Back link */}
      <Link
        href="/admin/retailers"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Retailers
      </Link>

      {/* 2. Profile header card */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-5">

          {/* Avatar */}
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand-100 dark:bg-brand-700 text-brand-600 dark:text-white text-xl font-bold font-display select-none">
            {retailer.initials}
          </div>

          {/* Core details */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <h1 className="font-display text-xl font-bold text-foreground leading-tight text-balance">
                  {retailer.name}
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">{retailer.owner}</p>
              </div>
              {suspended ? (
                <Badge variant="danger" className="shrink-0 self-start">
                  Suspended
                </Badge>
              ) : (
                <Badge variant="success" className="shrink-0 self-start">
                  <CheckCircle2 className="h-3 w-3" /> Active
                </Badge>
              )}
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-y-2.5 gap-x-8 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                <span>{retailer.phone}</span>
              </div>
              <div className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>{retailer.location}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span>Member since {retailer.memberSince}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CreditCard className="h-3.5 w-3.5 shrink-0" />
                <span>
                  Subscription renews{" "}
                  <span className="text-foreground font-medium">{retailer.subscriptionRenews}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-border">
          <button className="flex items-center gap-1.5 rounded-xl bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800 transition-colors">
            <Pencil className="h-3.5 w-3.5" /> Edit Profile
          </button>
          <button className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors">
            <MessageSquare className="h-3.5 w-3.5" /> Contact
          </button>
          <button
            onClick={() => setSuspendConfirm(true)}
            className="flex items-center gap-1.5 rounded-xl border border-danger-200 bg-danger-50 px-4 py-2 text-sm font-medium text-danger-700 dark:text-danger-500 hover:bg-danger-100 transition-colors"
          >
            <AlertTriangle className="h-3.5 w-3.5" /> Suspend Account
          </button>
        </div>

        {/* Inline suspend confirmation */}
        {suspendConfirm && (
          <div className="mt-4 rounded-xl border border-danger-200 bg-danger-50 p-4">
            <p className="text-sm font-semibold text-danger-700 mb-1">
              Suspend {retailer.name}?
            </p>
            <p className="text-sm text-danger-700 dark:text-danger-500">
              The retailer will lose app access and cannot place orders. This action can be reversed.
            </p>
            {suspendError && (
              <p className="text-xs text-danger-700 mt-2 font-medium">{suspendError}</p>
            )}
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleConfirmSuspend}
                disabled={suspending}
                className="rounded-xl bg-danger-600 px-4 py-2 text-xs font-semibold text-white hover:bg-danger-700 transition-colors disabled:opacity-50"
              >
                {suspending ? "Suspending…" : "Yes, Suspend"}
              </button>
              <button
                onClick={() => { setSuspendConfirm(false); setSuspendError(null); }}
                disabled={suspending}
                className="rounded-xl border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* 3. Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATS.map((s) => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
            <p className="font-display text-lg font-bold text-foreground tabular-nums leading-tight">
              {s.value}
            </p>
          </Card>
        ))}
      </div>

      {/* 4. Order History */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-display text-base font-semibold text-foreground">Order History</h2>
          <span className="text-xs text-muted-foreground">Latest 5 orders</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Order #</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Date</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Amount</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Payment</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {RECENT_ORDERS.map((order) => (
                <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-mono text-xs font-semibold text-foreground">{order.id}</p>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground hidden sm:table-cell">
                    {order.date}
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold text-foreground tabular-nums">
                    {formatPHP(order.amount)}
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <span className={cn(
                      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                      ORDER_STATUS_STYLE[order.status] ?? "bg-surface-100 text-muted-foreground border-surface-200"
                    )}>
                      {ORDER_STATUS_LABEL[order.status] ?? order.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      PAYMENT_CHIP[order.payment] ?? "bg-surface-100 text-surface-700"
                    )}>
                      {order.payment}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="text-xs text-brand-500 hover:text-brand-600 font-medium transition-colors"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3.5 border-t border-border">
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1 text-sm text-brand-500 hover:text-brand-600 font-medium transition-colors"
          >
            View All Orders
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </Card>

      {/* 5. Subscription & Payment */}
      <Card className="p-5">
        <h2 className="font-display text-base font-semibold text-foreground mb-4">
          Subscription &amp; Payment
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-4">
            <div>
              <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground mb-1">
                Current Plan
              </p>
              <p className="text-sm font-semibold text-foreground">
                {retailer.subscriptionPlan} ({retailer.subscriptionPrice})
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground mb-1">
                Status
              </p>
              <Badge variant="success">Active</Badge>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground mb-1">
                Paid On
              </p>
              <p className="text-sm text-foreground">
                {retailer.subscriptionPaidOn} via {retailer.subscriptionPaidVia}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground mb-1">
                Renews
              </p>
              <p className="text-sm text-foreground">{retailer.subscriptionRenews}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* 6. Account Actions (danger zone) */}
      <Card className="p-5">
        <h2 className="font-display text-base font-semibold text-foreground mb-1">Account Actions</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Manage this retailer&apos;s account notifications, access, and data export.
        </p>
        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors">
            <Bell className="h-4 w-4 text-muted-foreground" />
            Send Notification
          </button>
          <button
            onClick={() => setSuspendConfirm(true)}
            className="flex items-center gap-2 rounded-xl border border-danger-200 px-4 py-2.5 text-sm font-medium text-danger-700 dark:text-danger-500 hover:bg-danger-50 transition-colors"
          >
            <AlertTriangle className="h-4 w-4" />
            Suspend Account
          </button>
          <button className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors">
            <Download className="h-4 w-4 text-muted-foreground" />
            Export Data
          </button>
        </div>
      </Card>

    </div>
  );
}
