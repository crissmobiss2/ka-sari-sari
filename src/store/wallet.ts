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
  _hydrated: boolean;
  hydrate: (balance: number, transactions: WalletTransaction[]) => void;
  credit: (amount: number, description: string, reference?: string) => void;
  debit: (amount: number, description: string, reference?: string) => boolean;
}

function makeId() {
  return "txn-" + Date.now().toString(36);
}

export const useWalletStore = create<WalletStore>()(
  persist(
    (set, get) => ({
      balance: 0,
      transactions: [],
      _hydrated: false,
      hydrate: (balance, transactions) => set({ balance, transactions, _hydrated: true }),
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
    {
      name: "kss-wallet",
      onRehydrateStorage: () => (state) => {
        if (state) state._hydrated = true;
      },
    }
  )
);
