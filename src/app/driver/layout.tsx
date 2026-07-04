import Link from "next/link";
import type { ReactNode, FC } from "react";

// Icons as inline SVG components for zero-dep
function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  );
}
function PackageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}
function MapIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" y1="3" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="21" />
    </svg>
  );
}
function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function WalletIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7H5a2 2 0 010-4h14a1 1 0 011 1v4" />
      <path d="M3 5v14a2 2 0 002 2h16v-4" />
      <path d="M18 12a2 2 0 000 4h4v-4z" />
    </svg>
  );
}

const NAV_ITEMS = [
  { href: "/driver",            label: "Home",       Icon: HomeIcon },
  { href: "/driver/deliveries", label: "Deliveries", Icon: PackageIcon },
  { href: "/driver/route",      label: "Route",      Icon: MapIcon },
  { href: "/driver/earnings",   label: "Earnings",   Icon: WalletIcon },
  { href: "/driver/profile",    label: "Profile",    Icon: UserIcon },
];

export default function DriverLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Brand mark */}
            <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 20 20" fill="white" className="w-4 h-4">
                <path d="M3 5a2 2 0 012-2h10a2 2 0 012 2v2H3V5zM3 9h14v6a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              </svg>
            </div>
            <div className="leading-none">
              <p className="font-display text-sm font-bold text-foreground">Ka Sari-Sari</p>
              <p className="text-2xs text-muted-foreground tracking-wide uppercase">Driver App</p>
            </div>
          </div>
          {/* Driver avatar */}
          <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold tracking-wide">RD</span>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 max-w-md mx-auto w-full pb-24">
        {children}
      </main>

      {/* Bottom navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="max-w-md mx-auto flex">
          {NAV_ITEMS.map(({ href, label, Icon }) => (
            <NavItem key={href} href={href} label={label} Icon={Icon} />
          ))}
        </div>
      </nav>
    </div>
  );
}

// NavItem is a server component that relies on pathname matching via
// a client wrapper. We make it a simple anchor-based approach.
function NavItem({
  href,
  label,
  Icon,
}: {
  href: string;
  label: string;
  Icon: FC<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className="flex-1 flex flex-col items-center justify-center gap-1 py-3 text-muted-foreground hover:text-brand-500 transition-colors group"
    >
      <Icon className="w-5 h-5 group-[.active]:text-brand-500" />
      <span className="text-2xs font-medium">{label}</span>
    </Link>
  );
}
