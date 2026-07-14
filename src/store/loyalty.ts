import { create } from "zustand";
import { persist } from "zustand/middleware";

// Point rate: 1 point per ₱10 spent
export const POINTS_PER_PESO = 0.1; // 0.1 pts per ₱1 = 1pt per ₱10

export interface LoyaltyTransaction {
  id: string;
  type: "earn" | "redeem";
  points: number;
  label: string;
  date: string;
  orderNumber?: string;
}

interface LoyaltyStore {
  balance: number;
  transactions: LoyaltyTransaction[];
  _hydrated: boolean;
  hydrate: (balance: number, transactions: LoyaltyTransaction[]) => void;
  addEarnTransaction: (orderTotal: number, orderNumber: string) => number;
  addRedeemTransaction: (points: number, label: string) => boolean;
}

export const useLoyaltyStore = create<LoyaltyStore>()(
  persist(
    (set, get) => ({
  balance: 0,
  transactions: [],
  _hydrated: false,
  hydrate: (balance, transactions) => set({ balance, transactions, _hydrated: true }),

  addEarnTransaction: (orderTotal: number, orderNumber: string): number => {
    const pts = Math.floor(orderTotal * POINTS_PER_PESO);
    const now = new Date();
    const date = now.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
    const newTx: LoyaltyTransaction = {
      id: `earn-${Date.now()}`,
      type: "earn",
      points: pts,
      label: `Order ${orderNumber}`,
      date,
      orderNumber,
    };
    set((state) => ({
      balance: state.balance + pts,
      transactions: [newTx, ...state.transactions],
    }));
    return pts;
  },

  addRedeemTransaction: (points: number, label: string): boolean => {
    const { balance } = get();
    if (balance < points) return false;
    const now = new Date();
    const date = now.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
    const newTx: LoyaltyTransaction = {
      id: `redeem-${Date.now()}`,
      type: "redeem",
      points,
      label,
      date,
    };
    set((state) => ({
      balance: state.balance - points,
      transactions: [newTx, ...state.transactions],
    }));
    return true;
  },
    }),
    {
      name: "kss-loyalty",
      onRehydrateStorage: () => (state) => {
        if (state) state._hydrated = true;
      },
    }
  )
);

export const earnPoints = (orderTotal: number, orderNumber: string): number =>
  useLoyaltyStore.getState().addEarnTransaction(orderTotal, orderNumber);
