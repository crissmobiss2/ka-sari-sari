"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ShoppingCart, ClipboardList,
  User, ShoppingBasket, Bell, BarChart3, MonitorSmartphone, MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart";
import { LogoMark } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useLanguageStore } from "@/store/language";

export function RetailerBottomNav() {
  const pathname = usePathname();
  const totalItems = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const { t } = useLanguageStore();

  const navItems = [
    { href: "/dashboard", label: t("Home", "Tahanan"),    icon: LayoutDashboard },
    { href: "/catalog",   label: t("Shop", "Pamimili"),   icon: ShoppingBasket },
    { href: "/cart",      label: t("Cart", "Basket"),     icon: ShoppingCart, isCart: true },
    { href: "/pos",       label: "POS",                   icon: MonitorSmartphone },
    { href: "/orders",    label: t("Orders", "Orders"),   icon: ClipboardList },
    { href: "/account",   label: t("Account", "Account"), icon: User },
  ];

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
                "relative flex flex-col items-center gap-0.5 px-1 py-2 rounded-xl transition-colors flex-1 min-w-0",
                active ? "text-brand-700 dark:text-brand-400" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.8} />
                {isCart && totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-700 text-[10px] font-bold text-white">
                    {totalItems > 9 ? "9+" : totalItems}
                  </span>
                )}
              </div>
              <span className={cn("text-[10px] font-medium", active ? "text-brand-700 dark:text-brand-400" : "text-muted-foreground")}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
      <p className="text-center text-[9px] text-muted-foreground/40 leading-none pb-0.5">
        Powered by <span className="font-semibold">NexoFlow</span>
      </p>
      <div className="pb-safe" style={{ paddingBottom: "env(safe-area-inset-bottom)" }} />
    </nav>
  );
}

export function RetailerTopBar({ title }: { title?: string }) {
  const pathname = usePathname();
  const totalItems = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const { lang, setLang, t } = useLanguageStore();

  const navItems = [
    { href: "/dashboard", label: t("Home", "Tahanan"),     icon: LayoutDashboard },
    { href: "/catalog",   label: t("Shop", "Pamimili"),    icon: ShoppingBasket },
    { href: "/orders",    label: t("Orders", "Mga Order"), icon: ClipboardList },
    { href: "/pos",       label: t("POS", "POS"),          icon: MonitorSmartphone },
    { href: "/account",   label: t("Account", "Account"),  icon: User },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-md">
      <div className="flex h-14 items-center gap-4 px-4 md:px-6">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
          <LogoMark size={32} />
          <span className="font-display text-sm font-bold text-foreground hidden md:block">
            {title || "Ka Sari-Sari"}
          </span>
          <span className="font-display text-sm font-bold text-foreground md:hidden">
            {title || "Ka Sari-Sari"}
          </span>
        </Link>

        {/* Desktop nav links — hidden on mobile (BottomNav handles mobile) */}
        <nav className="hidden md:flex items-center gap-1 ml-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/"));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-brand-500/10 text-brand-700 dark:text-brand-400"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={active ? 2.2 : 1.8} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right-side icons */}
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            onClick={() => setLang(lang === "en" ? "tl" : "en")}
            title={lang === "tl" ? "Switch to English" : "Switch to Filipino"}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl hover:bg-muted transition-colors text-xs font-bold",
              lang === "tl" ? "text-brand-700 dark:text-brand-400" : "text-muted-foreground"
            )}
          >
            {lang === "tl" ? "TL" : "EN"}
          </button>
          <Link href="/chat" className="relative flex h-9 w-9 items-center justify-center rounded-xl hover:bg-muted transition-colors" title="Voice Order">
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
          </Link>
          <Link href="/notifications" className="relative flex h-9 w-9 items-center justify-center rounded-xl hover:bg-muted transition-colors">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-brand-500" />
          </Link>
          <Link href="/cart" className="relative flex h-9 w-9 items-center justify-center rounded-xl hover:bg-muted transition-colors">
            <ShoppingCart className="h-5 w-5 text-muted-foreground" />
            {totalItems > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-700 text-[10px] font-bold text-white">
                {totalItems > 9 ? "9+" : totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
