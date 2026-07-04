import { create } from "zustand";

type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts.slice(-3), { ...toast, id }] }));
  },
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

// Helpers callable outside React (e.g., from store actions)
export const toastSuccess = (message: string, duration = 3500) =>
  useToastStore.getState().addToast({ type: "success", message, duration });
export const toastError = (message: string, duration = 5000) =>
  useToastStore.getState().addToast({ type: "error", message, duration });
export const toastInfo = (message: string, duration = 3500) =>
  useToastStore.getState().addToast({ type: "info", message, duration });
export const toastWarning = (message: string, duration = 4000) =>
  useToastStore.getState().addToast({ type: "warning", message, duration });
