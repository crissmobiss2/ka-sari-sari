"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { LogoMark } from "@/components/ui/logo";
import { WarehouseNav } from "@/components/warehouse/warehouse-nav";
import { LogoutButton } from "@/components/ui/logout-button";
import { NexoflowFooter } from "@/components/ui/nexoflow-footer";

export default function WarehouseLayout({ children }: { children: React.ReactNode }) {
  const [userName, setUserName] = useState("Warehouse Staff");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.user?.name) setUserName(data.user.name);
      })
      .catch(() => {/* keep default */});
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between bg-card border-b border-border px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <LogoMark size={40} />
          <div>
            <p className="font-display font-bold text-base text-foreground leading-tight">Ka Sari-Sari</p>
            <p className="text-xs text-muted-foreground leading-tight">Warehouse</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <div className="text-right">
            <p className="text-sm font-semibold truncate max-w-[120px] text-foreground leading-tight">{userName}</p>
            <p className="text-xs text-muted-foreground leading-tight">Warehouse Staff</p>
          </div>
          <LogoutButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>

      <NexoflowFooter />
      {/* Bottom Navigation — client component for active state */}
      <WarehouseNav />
    </div>
  );
}
