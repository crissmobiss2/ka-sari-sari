"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function DriverError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => { console.error("[Driver] Error:", error); }, [error]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-50 mb-4">
        <AlertTriangle className="h-7 w-7 text-danger-500" />
      </div>
      <h2 className="font-display text-lg font-bold text-foreground mb-2">Something went wrong</h2>
      <p className="text-muted-foreground text-sm max-w-xs mb-6">
        An error occurred in the driver app. Please try again.
      </p>
      <button
        onClick={reset}
        className="inline-flex items-center gap-2 rounded-2xl bg-brand-700 hover:bg-brand-800 text-white text-sm font-semibold px-6 py-3 transition-colors"
      >
        <RefreshCw className="h-4 w-4" /> Try again
      </button>
    </div>
  );
}
