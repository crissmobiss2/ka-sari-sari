"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ScanLine, PackageCheck, CheckCircle2, ClipboardList, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PICK_LISTS, GOODS_RECEIPTS } from "@/lib/mock-data";

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-PH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function timeAgo(isoString: string) {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function WarehouseDashboard() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Derive stats from mock data
  const openPickLists = PICK_LISTS.filter((pl) => pl.status === "open").length;
  const inProgressPickLists = PICK_LISTS.filter((pl) => pl.status === "in_progress");
  const completedPickLists = PICK_LISTS.filter((pl) => pl.status === "completed");

  const itemsToPick = PICK_LISTS.filter((pl) => pl.status === "open" || pl.status === "in_progress")
    .flatMap((pl) => pl.items)
    .filter((item) => item.status === "pending" || item.status === "partial")
    .reduce((sum, item) => sum + (item.quantity - item.pickedQty), 0);

  const receivingQueue = GOODS_RECEIPTS.filter((gr) => gr.status === "pending").length;
  const completedToday = completedPickLists.length;

  // Recent activity: completed pick lists + in-progress, sorted by most recent
  const recentActivity = [...PICK_LISTS]
    .sort((a, b) => {
      const aTime = a.completedAt ?? a.createdAt;
      const bTime = b.completedAt ?? b.createdAt;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    })
    .slice(0, 5);

  const stats = [
    {
      label: "Open Pick Lists",
      value: openPickLists,
      icon: ClipboardList,
      color: "text-brand-500",
      bg: "bg-brand-500/10",
    },
    {
      label: "Items to Pick",
      value: itemsToPick,
      icon: ScanLine,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Receiving Queue",
      value: receivingQueue,
      icon: PackageCheck,
      color: "text-warning-600",
      bg: "bg-warning-50",
    },
    {
      label: "Completed Today",
      value: completedToday,
      icon: CheckCircle2,
      color: "text-success-700",
      bg: "bg-success-50",
    },
  ];

  const statusBadge = (status: string) => {
    if (status === "completed") return <Badge variant="success">Completed</Badge>;
    if (status === "in_progress") return <Badge variant="default">In Progress</Badge>;
    return <Badge variant="neutral">Open</Badge>;
  };

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          {greeting}, Juan!
        </h1>
        <div className="flex items-center gap-2 mt-1 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span className="text-base">{formatTime(now)}</span>
          <span className="text-sm">&mdash; {formatDate(now)}</span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground leading-snug">{label}</p>
                  <p className={cn("text-3xl font-display font-bold mt-1", color)}>{value}</p>
                </div>
                <div className={cn("flex items-center justify-center w-10 h-10 rounded-xl", bg)}>
                  <Icon className={cn("h-5 w-5", color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-foreground">Quick Actions</h2>
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex flex-col gap-2">
              <p className="text-base font-medium text-foreground">Start Picking</p>
              <p className="text-sm text-muted-foreground">
                {openPickLists} open list{openPickLists !== 1 ? "s" : ""} waiting
                {inProgressPickLists.length > 0 &&
                  `, ${inProgressPickLists.length} in progress`}
              </p>
              <Link href="/warehouse/picking" className="block">
                <Button className="w-full py-4 text-lg" size="lg">
                  <ScanLine className="h-5 w-5" />
                  Go to Picking
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex flex-col gap-2">
              <p className="text-base font-medium text-foreground">Receive Goods</p>
              <p className="text-sm text-muted-foreground">
                {receivingQueue} purchase order{receivingQueue !== 1 ? "s" : ""} pending receipt
              </p>
              <Link href="/warehouse/receiving" className="block">
                <Button variant="outline" className="w-full py-4 text-lg" size="lg">
                  <PackageCheck className="h-5 w-5" />
                  Go to Receiving
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-foreground">Recent Activity</h2>
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {recentActivity.map((pl, idx) => (
                <li
                  key={pl.id}
                  className={cn(
                    "flex items-center justify-between px-4 py-4 gap-3",
                    idx === 0 && "rounded-t-2xl",
                    idx === recentActivity.length - 1 && "rounded-b-2xl"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-base font-semibold text-foreground truncate">
                      {pl.orderNumber}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {pl.items.length} item{pl.items.length !== 1 ? "s" : ""}
                      {pl.assignedTo && ` · ${pl.assignedTo}`}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {statusBadge(pl.status)}
                    <span className="text-xs text-muted-foreground">
                      {timeAgo(pl.completedAt ?? pl.createdAt)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
