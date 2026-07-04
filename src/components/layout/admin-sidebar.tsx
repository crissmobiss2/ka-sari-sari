"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Package, ShoppingCart, Users, BarChart3,
  Warehouse, Truck, CreditCard, Settings, ShoppingBasket,
  ClipboardList, Tag, ChevronRight, UserCheck, Navigation,
  Monitor, Banknote, Building2, ReceiptText, Megaphone, PackageSearch,
  PackageCheck, Boxes,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    label: "Operations",
    items: [
      { href: "/admin",             label: "Dashboard",   icon: LayoutDashboard },
      { href: "/admin/orders",      label: "Orders",      icon: ShoppingCart },
      { href: "/admin/fulfillment", label: "Fulfillment", icon: ClipboardList },
      { href: "/admin/delivery",    label: "Dispatch",    icon: Truck },
      { href: "/admin/pos",         label: "POS",         icon: Monitor },
    ],
  },
  {
    label: "Warehouse",
    items: [
      { href: "/admin/warehouse",           label: "Overview",  icon: Warehouse },
      { href: "/admin/warehouse/receiving", label: "Receiving", icon: PackageCheck },
      { href: "/admin/warehouse/picking",   label: "Picking",   icon: PackageSearch },
    ],
  },
  {
    label: "Logistics",
    items: [
      { href: "/admin/drivers", label: "Drivers", icon: UserCheck },
      { href: "/admin/routes",  label: "Routes",  icon: Navigation },
    ],
  },
  {
    label: "Catalog",
    items: [
      { href: "/admin/products",   label: "Products",   icon: Package },
      { href: "/admin/categories", label: "Categories", icon: Tag },
      { href: "/admin/inventory",  label: "Inventory",  icon: Boxes },
    ],
  },
  {
    label: "Business",
    items: [
      { href: "/admin/retailers",      label: "Retailers",      icon: Users },
      { href: "/admin/subscriptions",  label: "Subscriptions",  icon: CreditCard },
      { href: "/admin/suppliers",      label: "Suppliers",      icon: Building2 },
      { href: "/admin/purchase-orders",label: "Purchase Orders",icon: ReceiptText },
      { href: "/admin/promotions",     label: "Promotions",     icon: Megaphone },
      { href: "/admin/payments",       label: "Payments",       icon: Banknote },
      { href: "/admin/reports",        label: "Reports",        icon: BarChart3 },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-60 border-r border-border bg-card h-screen sticky top-0 overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500">
          <ShoppingBasket className="h-4 w-4 text-white" strokeWidth={2.2} />
        </div>
        <div>
          <p className="font-display text-sm font-bold text-foreground leading-tight">Ka Sari-Sari</p>
          <p className="text-[10px] text-muted-foreground">Admin Console</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-4">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={cn(
                        "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors",
                        active
                          ? "bg-brand-50 text-brand-600 font-medium"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom user */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-muted cursor-pointer transition-colors">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-brand-600 text-xs font-bold shrink-0">
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">Admin User</p>
            <p className="text-[11px] text-muted-foreground truncate">admin@kasarisari.ph</p>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        </div>
      </div>
    </aside>
  );
}
