"use client";
import { useState, useEffect } from "react";
import { CreditCard, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPHP, formatDate } from "@/lib/utils";

const MOCK_SUBSCRIPTIONS = [
  { id: "s1", retailer: "Maria Santos", store: "Santos Sari-Sari Store", status: "active", paid: 0, startDate: "2025-07-01", endDate: "2026-07-01", method: "—", plan: "Free Trial" },
  { id: "s2", retailer: "Jun Dela Cruz", store: "Dela Cruz Tindahan", status: "active", paid: 200, startDate: "2024-09-15", endDate: "2025-10-15", method: "Maya", plan: "Monthly" },
  { id: "s3", retailer: "Nena Reyes", store: "Ate Nena Store", status: "active", paid: 200, startDate: "2024-07-20", endDate: "2025-08-20", method: "GCash", plan: "Monthly" },
  { id: "s4", retailer: "Lito Garcia", store: "Garcia Grocery", status: "expired", paid: 200, startDate: "2024-06-01", endDate: "2025-07-01", method: "COD", plan: "Monthly" },
  { id: "s5", retailer: "Elena Cruz", store: "Cruz Corner Store", status: "pending_payment", paid: 0, startDate: "", endDate: "", method: "", plan: "Monthly" },
];

const statusMap = {
  active:          { label: "Active",          variant: "success"  as const, icon: CheckCircle2 },
  expired:         { label: "Expired",         variant: "danger"   as const, icon: XCircle },
  pending_payment: { label: "Pending Payment", variant: "warning"  as const, icon: Clock },
  cancelled:       { label: "Cancelled",       variant: "neutral"  as const, icon: XCircle },
};

type Subscription = typeof MOCK_SUBSCRIPTIONS[0];

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(MOCK_SUBSCRIPTIONS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/subscriptions")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (Array.isArray(data?.subscriptions) && data.subscriptions.length > 0) {
          setSubscriptions(data.subscriptions);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalRevenue = subscriptions.reduce((s, r) => s + r.paid, 0);
  const active = subscriptions.filter((s) => s.status === "active").length;
  const pending = subscriptions.filter((s) => s.status === "pending_payment").length;

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Subscriptions</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Platform access fee management</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Revenue", value: formatPHP(totalRevenue), icon: CreditCard, color: "text-success-700 bg-success-50" },
          { label: "Active", value: active.toString(), icon: CheckCircle2, color: "text-brand-600 bg-brand-50" },
          { label: "Pending", value: pending.toString(), icon: Clock, color: "text-warning-700 bg-warning-50" },
        ].map((s) => (
          <Card key={s.label} className="p-5">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${s.color} mb-3`}>
              <s.icon className="h-4.5 w-4.5" />
            </div>
            <p className="font-display text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Retailer</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Period</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">Method</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Amount</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && subscriptions.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-muted-foreground">Loading subscriptions…</td>
                </tr>
              )}
              {subscriptions.map((sub) => {
                const { label, variant, icon: Icon } = statusMap[sub.status as keyof typeof statusMap];
                return (
                  <tr key={sub.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-foreground">{sub.retailer}</p>
                      <p className="text-xs text-muted-foreground">{sub.store}</p>
                      <p className="text-xs text-brand-500 font-medium mt-0.5">{sub.plan}</p>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground hidden md:table-cell">
                      {sub.startDate ? `${formatDate(sub.startDate)} - ${formatDate(sub.endDate)}` : "-"}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground hidden lg:table-cell">{sub.method || "-"}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-foreground">{sub.paid > 0 ? formatPHP(sub.paid) : "-"}</td>
                    <td className="px-5 py-3.5 text-right">
                      <Badge variant={variant}>
                        <Icon className="h-3 w-3" /> {label}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
