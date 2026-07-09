"use client";

import { useState, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { LogoMark } from "@/components/ui/logo";
import { DriverBottomNav } from "@/components/driver/driver-bottom-nav";
import { LogoutButton } from "@/components/ui/logout-button";
import { NexoflowFooter } from "@/components/ui/nexoflow-footer";

export default function DriverLayout({ children }: { children: ReactNode }) {
  const [userName, setUserName] = useState("Driver");
  const [initials, setInitials] = useState("DR");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.name) {
          setUserName(data.name);
          const parts = (data.name as string).split(" ");
          setInitials(
            ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase(),
          );
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <LogoMark size={28} className="rounded-lg" />
            <div className="leading-none">
              <p className="font-display text-sm font-bold text-foreground">Ka Sari-Sari</p>
              <p className="text-[10px] text-muted-foreground tracking-wide uppercase">Driver App</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:block">{userName}</span>
            <Link
              href="/driver/deliveries"
              aria-label="Notifications"
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground"
            >
              <Bell className="w-4 h-4" />
            </Link>
            <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold tracking-wide">{initials}</span>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 max-w-md mx-auto w-full pb-24">
        {children}
      </main>

      <NexoflowFooter className="max-w-md mx-auto w-full" />
      <DriverBottomNav />
    </div>
  );
}
