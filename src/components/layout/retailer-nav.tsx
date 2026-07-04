"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ShoppingCart, ClipboardList,
  User, ShoppingBasket, Bell, BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const navItems = [
  { href: "/dashboard", label: "Home",    icon: LayoutDashboard },
  { href: "/catalog",   label: "Shop",    icon: ShoppingBasket },
  { href: "/cart",      label: "Cart",    icon: ShoppingCart, isCart: true },
  { href: "/orders",    label: "Orders",  icon: ClipboardList },
  { href: "/account",   label: "Account", icon: User },
];

export function RetailerBottomNav() {
  const pathname = usePathname();
  const totalItems = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-md md:hidden">
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map(({ href, label, icon: Icon, isCart }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/")) || (href === "/dashboard" && pathname === href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors min-w-[56px]",
                active ? "text-brand-500" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.8} />
                {isCart && totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
                    {totalItems > 9 ? "9+" : totalItems}
                  </span>
                )}
              </div>
              <span className={cn("text-[10px] font-medium", active ? "text-brand-500" : "text-muted-foreground")}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
      <div className="pb-safe" style={{ paddingBottom: "env(safe-area-inset-bottom)" }} />
    </nav>
  );
}

export function RetailerTopBar({ title }: { title?: string }) {
  const totalItems = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500">
            <ShoppingBasket className="h-4 w-4 text-white" />
          </div>
          <span className="font-display text-sm font-bold text-foreground">
            {title || "Ka Sari-Sari"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Link href="/notifications" className="relative flex h-9 w-9 items-center justify-center rounded-xl hover:bg-muted transition-colors">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-brand-500" />
          </Link>
          <Link href="/cart" className="relative flex h-9 w-9 items-center justify-center rounded-xl hover:bg-muted transition-colors">
            <ShoppingCart className="h-5 w-5 text-muted-foreground" />
            {totalItems > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
                {totalItems > 9 ? "9+" : totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
