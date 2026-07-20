"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Bell,
  Package,
  CreditCard,
  AlertTriangle,
  CheckCheck,
  Tag,
  Truck,
  ShieldCheck,
  Info,
} from "lucide-react";
import { RetailerTopBar, RetailerBottomNav } from "@/components/layout/retailer-nav";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MOCK_NOTIFICATIONS } from "@/lib/mock-data";
import type { Notification } from "@/types";
import { cn } from "@/lib/utils";

// ─── Seed extra realistic notifications so there are at least 8 ───────────────

const EXTRA_NOTIFICATIONS: Notification[] = [
  {
    id: "notif-x1",
    userId: "user-1",
    type: "payment_received",
    title: "Payment confirmed",
    message: "GCash payment of ₱1,920 for order #KSS-2025-00142 has been received.",
    isRead: false,
    orderId: "ord-001",
    createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
  },
  {
    id: "notif-x2",
    userId: "user-1",
    type: "order_delivered",
    title: "Order delivered",
    message: "Order #KSS-2025-00139 was delivered at 3:12 PM. Leave a review!",
    isRead: false,
    orderId: "ord-002",
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: "notif-x3",
    userId: "user-1",
    type: "order_picked",
    title: "Warehouse picking started",
    message: "Your order #KSS-2025-00143 is now being picked at the warehouse.",
    isRead: true,
    orderId: "ord-003",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: "notif-x4",
    userId: "user-1",
    type: "low_stock",
    title: "Low stock alert",
    message: "Lucky Me! Pancit Canton Original is almost out. Reorder now to avoid stockout.",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  },
  {
    id: "notif-x5",
    userId: "user-1",
    type: "system",
    title: "Deal alert: 15% off San Miguel",
    message: "Limited-time promo on San Miguel Pale Pilsen 330ml — ends midnight tonight.",
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
  },
  {
    id: "notif-x6",
    userId: "user-1",
    type: "order_out_for_delivery",
    title: "Delivery ETA updated",
    message:
      "Your driver is 3 stops away. Expected arrival: 4:30–5:00 PM today.",
    isRead: true,
    orderId: "ord-004",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
  },
  {
    id: "notif-x7",
    userId: "user-1",
    type: "order_packed",
    title: "Order packed and ready",
    message: "Order #KSS-2025-00140 is packed and waiting for driver assignment.",
    isRead: true,
    orderId: "ord-005",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
  },
  {
    id: "notif-x8",
    userId: "user-1",
    type: "system",
    title: "System maintenance tonight",
    message:
      "Ka Sari-Sari will be briefly unavailable on Jul 7 from 1–2 AM for scheduled maintenance.",
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
];

function buildSeedNotifications(): Notification[] {
  const base = [...MOCK_NOTIFICATIONS];
  const existingIds = new Set(base.map((n) => n.id));
  for (const n of EXTRA_NOTIFICATIONS) {
    if (!existingIds.has(n.id)) base.push(n);
  }
  // Ensure at least 8
  const extra = EXTRA_NOTIFICATIONS.filter((n) => !existingIds.has(n.id));
  let i = 0;
  while (base.length < 8 && i < extra.length) {
    base.push(extra[i++]);
  }
  // Sort newest first
  return base.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function isToday(date: string) {
  const d = new Date(date);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

type FilterTab = "all" | "unread" | "orders" | "promotions" | "system";

function getTabFilter(tab: FilterTab) {
  switch (tab) {
    case "unread":
      return (n: Notification) => !n.isRead;
    case "orders":
      return (n: Notification) => n.type.startsWith("order_") || n.type === "payment_received";
    case "promotions":
      return (n: Notification) =>
        n.type === "system" && /deal|promo|discount|off/i.test(n.title + n.message);
    case "system":
      return (n: Notification) =>
        n.type === "system" || n.type === "subscription_expiring" || n.type === "low_stock";
    default:
      return () => true;
  }
}

function notifIcon(notif: Notification) {
  if (notif.type === "payment_received") return CreditCard;
  if (notif.type === "subscription_expiring") return CreditCard;
  if (notif.type === "low_stock") return AlertTriangle;
  if (notif.type === "order_delivered") return ShieldCheck;
  if (notif.type === "order_out_for_delivery") return Truck;
  if (notif.type.startsWith("order_")) return Package;
  if (/deal|promo|discount/i.test(notif.title + notif.message)) return Tag;
  if (notif.type === "system") return Info;
  return Bell;
}

function iconColors(notif: Notification, unread: boolean) {
  if (!unread) return "bg-surface-100 dark:bg-surface-800 text-muted-foreground";
  if (notif.type === "payment_received" || notif.type === "order_delivered")
    return "bg-success-50 dark:bg-success-500/10 text-success-700 dark:text-foreground";
  if (notif.type === "low_stock") return "bg-warning-50 dark:bg-warning-500/10 text-warning-600 dark:text-foreground";
  if (/deal|promo/i.test(notif.title + notif.message))
    return "bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-foreground";
  return "bg-brand-100 dark:bg-brand-500/20 text-brand-600 dark:text-foreground";
}

// ─── Tabs config ──────────────────────────────────────────────────────────────

const TABS: { id: FilterTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "orders", label: "Orders" },
  { id: "promotions", label: "Promotions" },
  { id: "system", label: "System" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [notifsLoading, setNotifsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  // Load real notifications from the API on mount
  useEffect(() => {
    fetch("/api/user/notifications")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        if (Array.isArray(data?.notifications)) {
          setNotifs(data.notifications);
        }
      })
      .catch(() => {})
      .finally(() => setNotifsLoading(false));
  }, []);

  const unreadCount = useMemo(() => notifs.filter((n) => !n.isRead).length, [notifs]);

  const filtered = useMemo(
    () => notifs.filter(getTabFilter(activeTab)),
    [notifs, activeTab]
  );

  const todayItems = useMemo(() => filtered.filter((n) => isToday(n.createdAt)), [filtered]);
  const earlierItems = useMemo(() => filtered.filter((n) => !isToday(n.createdAt)), [filtered]);

  function markAllRead() {
    // Persist to server
    fetch("/api/user/notifications/read-all", { method: "POST" }).catch(() => {});
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  function toggleRead(id: string) {
    const notif = notifs.find((n) => n.id === id);
    if (!notif) return;
    const newIsRead = !notif.isRead;
    // Persist to server
    fetch(`/api/user/notifications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isRead: newIsRead }),
    }).catch(() => {});
    setNotifs((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: newIsRead } : n))
    );
  }

  const emptyMessages: Record<FilterTab, { title: string; description: string }> = {
    all: {
      title: "No notifications",
      description: "We'll let you know when something important happens with your orders.",
    },
    unread: {
      title: "All caught up!",
      description: "You have no unread notifications right now.",
    },
    orders: {
      title: "No order updates",
      description: "Order status notifications will appear here.",
    },
    promotions: {
      title: "No promotions",
      description: "Deal alerts and special offers will appear here.",
    },
    system: {
      title: "No system alerts",
      description: "Stock alerts, subscription reminders, and system messages will appear here.",
    },
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <RetailerTopBar title="Notifications" />

      <div className="px-4 py-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-lg font-bold text-foreground">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 text-sm text-brand-700 dark:text-brand-400 font-medium hover:text-brand-600 transition-colors"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="-mx-4 px-4 overflow-x-auto">
          <div className="flex gap-2 pb-0.5 w-max">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors whitespace-nowrap",
                    isActive
                      ? "bg-brand-700 dark:bg-brand-500 text-white"
                      : "bg-surface-100 dark:bg-surface-800 text-muted-foreground hover:bg-surface-200"
                  )}
                >
                  {tab.label}
                  {tab.id === "unread" && unreadCount > 0 && (
                    <span
                      className={cn(
                        "inline-flex items-center justify-center rounded-full text-xs font-semibold min-w-[18px] h-[18px] px-1",
                        isActive
                          ? "bg-white/25 text-white"
                          : "bg-brand-700 dark:bg-brand-500 text-white"
                      )}
                    >
                      {unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Notification list */}
        {notifsLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Bell className="h-8 w-8" />}
            title={emptyMessages[activeTab].title}
            description={emptyMessages[activeTab].description}
            className="min-h-[40vh]"
          />
        ) : (
          <div className="space-y-5">
            {todayItems.length > 0 && (
              <NotifGroup label="Today" items={todayItems} onToggleRead={toggleRead} />
            )}
            {earlierItems.length > 0 && (
              <NotifGroup label="Earlier" items={earlierItems} onToggleRead={toggleRead} />
            )}
          </div>
        )}
      </div>

      <RetailerBottomNav />
    </div>
  );
}

// ─── Notification group ───────────────────────────────────────────────────────

function NotifGroup({
  label,
  items,
  onToggleRead,
}: {
  label: string;
  items: Notification[];
  onToggleRead: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
        {label}
      </p>
      <Card className="overflow-hidden divide-y divide-border">
        {items.map((notif) => (
          <NotifRow key={notif.id} notif={notif} onToggleRead={onToggleRead} />
        ))}
      </Card>
    </div>
  );
}

// ─── Notification row ─────────────────────────────────────────────────────────

function NotifRow({
  notif,
  onToggleRead,
}: {
  notif: Notification;
  onToggleRead: (id: string) => void;
}) {
  const Icon = notifIcon(notif);
  const unread = !notif.isRead;

  return (
    <button
      onClick={() => onToggleRead(notif.id)}
      className={cn(
        "w-full flex items-start gap-3 px-4 py-4 text-left hover:bg-muted transition-all duration-200",
        unread ? "bg-brand-50 dark:bg-brand-500/10/40" : "bg-card opacity-80 hover:opacity-100"
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl mt-0.5 transition-colors duration-200",
          iconColors(notif, unread)
        )}
      >
        <Icon className="h-4 w-4" />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-sm leading-snug transition-all duration-200",
              unread ? "font-semibold text-foreground" : "font-medium text-foreground/80"
            )}
          >
            {notif.title}
          </p>
          <p className="text-xs text-muted-foreground shrink-0 mt-0.5">
            {timeAgo(notif.createdAt)}
          </p>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{notif.message}</p>

        {/* Order badge */}
        {notif.orderId && (
          <Badge variant="neutral" className="mt-1.5 text-[10px] px-1.5 py-0">
            {notif.orderId.replace("ord-00", "#KSS-2025-001")}
          </Badge>
        )}
      </div>

      {/* Unread dot with smooth transition */}
      <div
        className={cn(
          "h-2 w-2 shrink-0 rounded-full mt-1.5 transition-all duration-300",
          unread ? "bg-brand-700 dark:bg-brand-500 scale-100 opacity-100" : "scale-0 opacity-0"
        )}
      />
    </button>
  );
}
