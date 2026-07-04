"use client";
import { useState } from "react";
import { Bell, Package, CreditCard, AlertTriangle, CheckCheck } from "lucide-react";
import { RetailerTopBar, RetailerBottomNav } from "@/components/layout/retailer-nav";
import { EmptyState } from "@/components/ui/empty-state";
import { MOCK_NOTIFICATIONS } from "@/lib/mock-data";
import type { Notification } from "@/types";
import { cn } from "@/lib/utils";

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function notifIcon(type: Notification["type"]) {
  if (type.startsWith("order_")) return Package;
  if (type === "payment_received") return CreditCard;
  if (type === "subscription_expiring") return CreditCard;
  if (type === "low_stock") return AlertTriangle;
  return Bell;
}

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState(MOCK_NOTIFICATIONS);
  const unread = notifs.filter((n) => !n.isRead).length;

  function markAllRead() {
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  function markRead(id: string) {
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <RetailerTopBar title="Notifications" />

      <div className="px-4 py-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-lg font-bold text-foreground">Notifications</h1>
            {unread > 0 && <p className="text-xs text-muted-foreground">{unread} unread</p>}
          </div>
          {unread > 0 && (
            <button onClick={markAllRead} className="flex items-center gap-1.5 text-sm text-brand-500 font-medium">
              <CheckCheck className="h-4 w-4" /> Mark all read
            </button>
          )}
        </div>

        {notifs.length === 0 ? (
          <EmptyState
            icon={<Bell className="h-8 w-8" />}
            title="No notifications"
            description="We'll let you know when something important happens with your orders."
            className="min-h-[50vh]"
          />
        ) : (
          <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden divide-y divide-border">
            {notifs.map((notif) => {
              const Icon = notifIcon(notif.type);
              return (
                <button
                  key={notif.id}
                  onClick={() => markRead(notif.id)}
                  className={cn(
                    "w-full flex items-start gap-3 px-4 py-4 text-left hover:bg-muted transition-colors",
                    !notif.isRead && "bg-brand-50/40"
                  )}
                >
                  <div className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl mt-0.5",
                    !notif.isRead ? "bg-brand-100 text-brand-600" : "bg-surface-100 text-muted-foreground"
                  )}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn("text-sm leading-snug", !notif.isRead ? "font-semibold text-foreground" : "font-medium text-foreground")}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-muted-foreground shrink-0">{timeAgo(notif.createdAt)}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{notif.message}</p>
                  </div>
                  {!notif.isRead && (
                    <div className="h-2 w-2 shrink-0 rounded-full bg-brand-500 mt-1.5" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <RetailerBottomNav />
    </div>
  );
}
