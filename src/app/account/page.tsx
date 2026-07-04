"use client";
import Link from "next/link";
import {
  User, Store, CreditCard, Bell, HelpCircle, LogOut,
  ChevronRight, Shield, Check, Clock, Heart, Wallet, Tag
} from "lucide-react";
import { RetailerTopBar, RetailerBottomNav } from "@/components/layout/retailer-nav";
import { useWalletStore } from "@/store/wallet";
import { useFavoritesStore } from "@/store/favorites";
import { formatPHP } from "@/lib/utils";

export default function AccountPage() {
  const walletBalance = useWalletStore((s) => s.balance);
  const favCount = useFavoritesStore((s) => s.items.length);

  const menuItems = [
    { label: "Store Profile", description: "Manage your store details", href: "/account/store", icon: Store },
    { label: "Subscription", description: "Active · Renews Feb 1, 2026", href: "/account/subscription", icon: CreditCard },
    { label: "My Wallet", description: `Balance: ${formatPHP(walletBalance)}`, href: "/wallet", icon: Wallet },
    { label: "Saved Items", description: `${favCount} saved ${favCount === 1 ? "product" : "products"}`, href: "/favorites", icon: Heart },
    { label: "Today's Deals", description: "Exclusive discounts for you", href: "/deals", icon: Tag },
    { label: "Notifications", description: "Manage alerts and updates", href: "/notifications", icon: Bell },
    { label: "Help & Support", description: "FAQs, contact, and tickets", href: "/support", icon: HelpCircle },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <RetailerTopBar title="Account" />

      <div className="px-4 py-5 space-y-5">
        {/* Profile card */}
        <div className="rounded-2xl border border-border bg-card shadow-card p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-600 text-2xl font-black shrink-0">
              M
            </div>
            <div>
              <p className="font-display text-base font-bold text-foreground">Maria Santos</p>
              <p className="text-sm text-muted-foreground">+63 917 123 4567</p>
              <p className="text-sm text-muted-foreground">Santos Sari-Sari Store · Caloocan City</p>
            </div>
          </div>
        </div>

        {/* Quick stats row */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/wallet" className="rounded-2xl border border-border bg-card shadow-card p-4 hover:border-brand-200 active:scale-95 transition-all">
            <p className="text-xs text-muted-foreground mb-1">Wallet Balance</p>
            <p className="text-xl font-black text-brand-500">{formatPHP(walletBalance)}</p>
          </Link>
          <Link href="/favorites" className="rounded-2xl border border-border bg-card shadow-card p-4 hover:border-brand-200 active:scale-95 transition-all">
            <p className="text-xs text-muted-foreground mb-1">Saved Items</p>
            <p className="text-xl font-black text-foreground">{favCount}</p>
          </Link>
        </div>

        {/* Subscription status */}
        <div className="rounded-2xl border border-success-500/25 bg-success-50 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-success-100 text-success-600">
              <Shield className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-success-700">Active Subscription</p>
              <p className="text-xs text-success-600 mt-0.5">Platform access · Annual · PHP 1,000</p>
              <div className="flex items-center gap-2 mt-2">
                <Check className="h-3.5 w-3.5 text-success-500" />
                <span className="text-xs text-success-600">Unlimited orders</span>
                <span className="text-success-300">·</span>
                <Clock className="h-3 w-3 text-success-500" />
                <span className="text-xs text-success-600">211 days left</span>
              </div>
            </div>
          </div>
        </div>

        {/* Menu */}
        <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden divide-y divide-border">
          {menuItems.map(({ label, description, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-4 px-5 py-4 hover:bg-muted transition-colors active:bg-muted"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-100 text-muted-foreground">
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground truncate">{description}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </Link>
          ))}
        </div>

        {/* Sign out */}
        <Link
          href="/login"
          className="flex items-center gap-3 rounded-2xl border border-danger-500/20 bg-danger-50 px-5 py-4 text-danger-600 hover:bg-danger-100 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span className="text-sm font-semibold">Sign out</span>
        </Link>

        <p className="text-center text-xs text-muted-foreground pb-2">Ka Sari-Sari v1.0.0 · Made with ❤️ in the Philippines</p>
      </div>

      <RetailerBottomNav />
    </div>
  );
}
