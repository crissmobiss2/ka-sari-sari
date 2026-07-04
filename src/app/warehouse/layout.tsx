import { ShoppingBasket } from "lucide-react";
import { WarehouseNav } from "@/components/warehouse/warehouse-nav";
import { LogoutButton } from "@/components/ui/logout-button";

export default function WarehouseLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between bg-card border-b border-border px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-500/10">
            <ShoppingBasket className="h-6 w-6 text-brand-500" />
          </div>
          <div>
            <p className="font-display font-bold text-base text-foreground leading-tight">Ka Sari-Sari</p>
            <p className="text-xs text-muted-foreground leading-tight">Warehouse</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-foreground leading-tight">Juan Dela Cruz</p>
            <p className="text-xs text-muted-foreground leading-tight">Warehouse Staff</p>
          </div>
          <LogoutButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>

      {/* Bottom Navigation — client component for active state */}
      <WarehouseNav />
    </div>
  );
}
