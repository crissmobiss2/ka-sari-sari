import Link from "next/link";
import { PackageSearch } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-50 dark:bg-brand-500/10 mb-6">
        <PackageSearch className="h-10 w-10 text-brand-700 dark:text-brand-400" />
      </div>

      <p className="text-sm font-bold tracking-widest text-brand-700 dark:text-brand-400 uppercase mb-3">404</p>
      <h1 className="font-display text-2xl font-bold text-foreground mb-2">Page not found</h1>
      <p className="text-muted-foreground text-sm max-w-xs mb-8">
        Ay naku! We couldn&apos;t find that page. It may have been moved or the link is incorrect.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-700 hover:bg-brand-800 text-white text-sm font-semibold px-6 py-3 transition-colors"
        >
          Go to Homepage
        </Link>
        <Link
          href="/catalog"
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card hover:bg-muted text-foreground text-sm font-semibold px-6 py-3 transition-colors"
        >
          Browse Catalog
        </Link>
      </div>
    </div>
  );
}
