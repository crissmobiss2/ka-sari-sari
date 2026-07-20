"use client";

import { useEffect, useRef } from "react";
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from "lucide-react";
import { useToastStore, type Toast } from "@/store/toast";
import { cn } from "@/lib/utils";

const CONFIG = {
  success: {
    icon: CheckCircle2,
    borderColor: "bg-success-500",
    iconColor: "text-success-700 dark:text-success-500",
  },
  error: {
    icon: XCircle,
    borderColor: "bg-danger-500",
    iconColor: "text-danger-600 dark:text-danger-500",
  },
  info: {
    icon: Info,
    borderColor: "bg-blue-500",
    iconColor: "text-blue-500",
  },
  warning: {
    icon: AlertTriangle,
    borderColor: "bg-warning-500",
    iconColor: "text-warning-700 dark:text-warning-500",
  },
} as const;

function ToastItem({ toast }: { toast: Toast }) {
  const removeToast = useToastStore((s) => s.removeToast);
  const { icon: Icon, borderColor, iconColor } = CONFIG[toast.type];
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const duration = toast.duration ?? 3500;
    timerRef.current = setTimeout(() => {
      removeToast(toast.id);
    }, duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast.id, toast.duration, removeToast]);

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl bg-card border border-border shadow-lg overflow-hidden",
        "animate-in slide-in-from-bottom-2 fade-in duration-300"
      )}
    >
      {/* Left colored accent bar */}
      <div className={cn("w-[3px] self-stretch shrink-0", borderColor)} />

      {/* Icon */}
      <div className="pt-3 pb-3 pl-0 shrink-0">
        <Icon className={cn("h-5 w-5", iconColor)} />
      </div>

      {/* Message */}
      <p className="flex-1 py-3 text-sm font-medium text-foreground">
        {toast.message}
      </p>

      {/* Close button */}
      <button
        onClick={() => removeToast(toast.id)}
        className="p-3 shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div
      className={cn(
        "fixed z-50 flex flex-col gap-2",
        // Mobile: above bottom nav (bottom nav ~80px)
        "bottom-20 left-4 right-4",
        // Desktop: bottom-right, fixed width
        "sm:bottom-6 sm:left-auto sm:right-6 sm:w-80"
      )}
    >
      {[...toasts].reverse().map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
