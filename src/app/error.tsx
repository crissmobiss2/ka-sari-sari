"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Ka Sari-Sari] Route error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger-50 dark:bg-danger-500/10 mb-5">
        <AlertTriangle className="h-8 w-8 text-danger-500" />
      </div>

      <h1 className="font-display text-xl font-bold text-foreground mb-2">Something went wrong</h1>
      <p className="text-muted-foreground text-sm max-w-xs mb-8 leading-relaxed">
        An unexpected error occurred. You can try again or return to the home page.
        {error?.digest && (
          <span className="block text-xs text-muted-foreground/60 mt-1">Ref: {error.digest}</span>
        )}
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-700 hover:bg-brand-800 text-white text-sm font-semibold px-6 py-3 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card hover:bg-muted text-foreground text-sm font-semibold px-6 py-3 transition-colors"
        >
          <Home className="h-4 w-4" />
          Go home
        </Link>
      </div>
    </div>
  );
}
