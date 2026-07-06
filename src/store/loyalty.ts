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
  addEarnTransaction: (orderTotal: number, orderNumber: string) => number;
  addRedeemTransaction: (points: number, label: string) => boolean;
}

export const useLoyaltyStore = create<LoyaltyStore>()(
  persist(
    (set, get) => ({
      balance: 2450,
      transactions: [
        {
          id: "h1",
          type: "earn",
          points: 125,
          label: "Order KSS-2025-00142",
          date: "Jan 20, 2025",
          orderNumber: "KSS-2025-00142",
        },
        {
          id: "h2",
          type: "earn",
          points: 87,
          label: "Order KSS-2025-00141",
          date: "Jan 17, 2025",
          orderNumber: "KSS-2025-00141",
        },
        {
          id: "h3",
          type: "earn",
          points: 98,
          label: "Order KSS-2025-00138",
          date: "Jan 12, 2025",
          orderNumber: "KSS-2025-00138",
        },
        {
          id: "h4",
          type: "earn",
          points: 65,
          label: "Order KSS-2025-00135",
          date: "Jan 8, 2025",
          orderNumber: "KSS-2025-00135",
        },
        {
          id: "h5",
          type: "redeem",
          points: 500,
          label: "Redeemed for ₱50 off",
          date: "Jan 5, 2025",
        },
      ],

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
    { name: "kss-loyalty" }
  )
);

export const earnPoints = (orderTotal: number, orderNumber: string): number =>
  useLoyaltyStore.getState().addEarnTransaction(orderTotal, orderNumber);
