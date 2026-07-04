import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface WalletTransaction {
  id: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  date: string;
  reference?: string;
}

interface WalletStore {
  balance: number;
  transactions: WalletTransaction[];
  credit: (amount: number, description: string, reference?: string) => void;
  debit: (amount: number, description: string, reference?: string) => boolean;
}

const INITIAL_TRANSACTIONS: WalletTransaction[] = [
  { id: "txn-001", type: "credit", amount: 500, description: "Welcome bonus", date: "2024-12-15T10:00:00Z", reference: "BONUS-001" },
  { id: "txn-002", type: "credit", amount: 200, description: "Referral reward - Aling Nena", date: "2025-01-03T14:30:00Z", reference: "REF-002" },
  { id: "txn-003", type: "debit", amount: 150, description: "Partial payment - Order KSS-250103-4821", date: "2025-01-03T15:00:00Z", reference: "KSS-250103-4821" },
];

function makeId() {
  return "txn-" + Date.now().toString(36);
}

export const useWalletStore = create<WalletStore>()(
  persist(
    (set, get) => ({
      balance: 550,
      transactions: INITIAL_TRANSACTIONS,
      credit: (amount, description, reference) => {
        const txn: WalletTransaction = {
          id: makeId(),
          type: "credit",
          amount,
          description,
          date: new Date().toISOString(),
          reference,
        };
        set({ balance: get().balance + amount, transactions: [txn, ...get().transactions] });
      },
      debit: (amount, description, reference) => {
        if (get().balance < amount) return false;
        const txn: WalletTransaction = {
          id: makeId(),
          type: "debit",
          amount,
          description,
          date: new Date().toISOString(),
          reference,
        };
        set({ balance: get().balance - amount, transactions: [txn, ...get().transactions] });
        return true;
      },
    }),
    { name: "kss-wallet" }
  )
);
