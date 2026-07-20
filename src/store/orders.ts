"use client";
import { create } from "zustand";
import type { Order, OrderStatus } from "@/types";

export interface FulfillOrder extends Order {
  driverName?: string;
  eta?: string;
  failReason?: string;
}

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  confirmed: "picking",
  picking: "packed",
  packed: "out_for_delivery",
  out_for_delivery: "delivered",
};

interface OrdersStore {
  orders: FulfillOrder[];
  setOrders: (orders: FulfillOrder[]) => void;
  advance: (id: string) => void;
  dispatch: (id: string, driverName: string, eta?: string) => void;
  markDelivered: (id: string) => void;
  markFailed: (id: string, reason: string) => void;
}

export const useOrdersStore = create<OrdersStore>()((set) => ({
  orders: [],

  setOrders(orders) {
    set({ orders });
  },

  advance(id) {
    set((s) => ({
      orders: s.orders.map((o) => {
        if (o.id !== id) return o;
        const next = NEXT_STATUS[o.status];
        return next ? { ...o, status: next, updatedAt: new Date().toISOString() } : o;
      }),
    }));
  },

  dispatch(id, driverName, eta) {
    set((s) => ({
      orders: s.orders.map((o) =>
        o.id === id
          ? { ...o, status: "out_for_delivery" as OrderStatus, driverName, eta, updatedAt: new Date().toISOString() }
          : o
      ),
    }));
  },

  markDelivered(id) {
    set((s) => ({
      orders: s.orders.map((o) =>
        o.id === id
          ? { ...o, status: "delivered" as OrderStatus, updatedAt: new Date().toISOString() }
          : o
      ),
    }));
  },

  markFailed(id, reason) {
    set((s) => ({
      orders: s.orders.map((o) =>
        o.id === id
          ? { ...o, status: "failed_delivery" as OrderStatus, failReason: reason, updatedAt: new Date().toISOString() }
          : o
      ),
    }));
  },
}));

export { NEXT_STATUS };
