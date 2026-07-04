"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ScanLine, PackageCheck, Package, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/warehouse", icon: LayoutDashboard, label: "Home", exact: true },
  { href: "/warehouse/picking", icon: ScanLine, label: "Picking", exact: false },
  { href: "/warehouse/receiving", icon: PackageCheck, label: "Receiving", exact: false },
  { href: "/warehouse/inventory", icon: Package, label: "Inventory", exact: false },
  { href: "/warehouse/scan", icon: QrCode, label: "Scan", exact: false },
];

export function WarehouseNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-50 bg-card border-t border-border">
      <div className="flex items-stretch">
        {NAV_ITEMS.map(({ href, icon: Icon, label, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 py-3 px-2 transition-colors",
                isActive
                  ? "text-brand-500"
                  : "text-muted-foreground hover:text-brand-500"
              )}
            >
              <Icon
                className={cn(
                  "h-7 w-7",
                  isActive ? "text-brand-500" : ""
                )}
              />
              <span className={cn("text-xs font-medium", isActive ? "font-semibold" : "")}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
