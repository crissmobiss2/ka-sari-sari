import type { ReactNode } from "react";
import { DriverBottomNav } from "@/components/driver/driver-bottom-nav";
import { LogoutButton } from "@/components/ui/logout-button";

export default function DriverLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 20 20" fill="white" className="w-4 h-4">
                <path d="M3 5a2 2 0 012-2h10a2 2 0 012 2v2H3V5zM3 9h14v6a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              </svg>
            </div>
            <div className="leading-none">
              <p className="font-display text-sm font-bold text-foreground">Ka Sari-Sari</p>
              <p className="text-[10px] text-muted-foreground tracking-wide uppercase">Driver App</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold tracking-wide">RD</span>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 max-w-md mx-auto w-full pb-24">
        {children}
      </main>

      <DriverBottomNav />
    </div>
  );
}
