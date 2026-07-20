"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => { console.error("[Admin] Error:", error); }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-50 dark:bg-danger-500/10 mb-4">
        <AlertTriangle className="h-7 w-7 text-danger-500" />
      </div>
      <h2 className="font-display text-lg font-bold text-foreground mb-1">Admin panel error</h2>
      <p className="text-muted-foreground text-sm max-w-xs mb-6">
        Something went wrong loading this page.
        {error?.digest && <span className="block text-xs mt-1 text-muted-foreground/60">Ref: {error.digest}</span>}
      </p>
      <button
        onClick={reset}
        className="inline-flex items-center gap-2 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-sm font-semibold px-5 py-2.5 transition-colors"
      >
        <RefreshCw className="h-4 w-4" /> Reload page
      </button>
    </div>
  );
}
