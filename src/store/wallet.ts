import { create } from "zustand";

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
  hydrate: (balance: number, transactions: WalletTransaction[]) => void;
  credit: (amount: number, description: string, reference?: string) => void;
  debit: (amount: number, description: string, reference?: string) => boolean;
}

function makeId() {
  return "txn-" + Date.now().toString(36);
}

export const useWalletStore = create<WalletStore>((set, get) => ({
  balance: 0,
  transactions: [],
  hydrate: (balance, transactions) => set({ balance, transactions }),
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
}));
