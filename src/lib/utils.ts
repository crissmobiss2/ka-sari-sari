import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPHP(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-PH").format(n);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function truncate(str: string, n: number): string {
  return str.length > n ? str.slice(0, n - 1) + "…" : str;
}

export function slugify(str: string): string {
  return str.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]+/g, "");
}

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "picking",
  "packed",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "failed_delivery",
  "returned",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending:           "Pending",
  confirmed:         "Confirmed",
  picking:           "Picking",
  packed:            "Packed",
  out_for_delivery:  "Out for Delivery",
  delivered:         "Delivered",
  cancelled:         "Cancelled",
  failed_delivery:   "Failed Delivery",
  returned:          "Returned",
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending:           "bg-warning-50 text-warning-600 border-warning-500/30",
  confirmed:         "bg-info-50 text-info-600 border-info-500/30",
  picking:           "bg-purple-50 text-purple-600 border-purple-500/30",
  packed:            "bg-blue-50 text-blue-600 border-blue-500/30",
  out_for_delivery:  "bg-brand-50 text-brand-600 border-brand-500/30",
  delivered:         "bg-success-50 text-success-600 border-success-500/30",
  cancelled:         "bg-surface-100 text-surface-500 border-surface-300/30",
  failed_delivery:   "bg-danger-50 text-danger-600 border-danger-500/30",
  returned:          "bg-danger-50 text-danger-600 border-danger-500/30",
};
