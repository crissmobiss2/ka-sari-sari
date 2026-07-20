"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Package, Map, Wallet, User } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/driver",            label: "Home",       Icon: Home },
  { href: "/driver/deliveries", label: "Deliveries", Icon: Package },
  { href: "/driver/route",      label: "Route",      Icon: Map },
  { href: "/driver/earnings",   label: "Earnings",   Icon: Wallet },
  { href: "/driver/profile",    label: "Profile",    Icon: User },
];

export function DriverBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="max-w-md mx-auto flex">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active =
            href === "/driver" ? pathname === "/driver" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors",
                active ? "text-brand-700 dark:text-brand-400" : "text-muted-foreground hover:text-brand-700"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}