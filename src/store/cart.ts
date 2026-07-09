import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Product } from "@/types";
import { toastSuccess } from "@/store/toast";

interface CartStore {
  items: CartItem[];
  _hasHydrated: boolean;
  setHasHydrated: (val: boolean) => void;
  addItem: (product: Product, qty?: number) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      _hasHydrated: false,
      setHasHydrated(val: boolean) {
        set({ _hasHydrated: val });
      },
      addItem(product, qty = product.minOrderQty) {
        set((s) => {
          const existing = s.items.find((i) => i.productId === product.id);
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.productId === product.id ? { ...i, quantity: i.quantity + qty } : i
              ),
            };
          }
          return { items: [...s.items, { productId: product.id, product, quantity: qty }] };
        });
        toastSuccess(`${product.name} added to cart`);
      },
      removeItem(productId) {
        set((s) => ({ items: s.items.filter((i) => i.productId !== productId) }));
      },
      updateQty(productId, qty) {
        if (qty <= 0) {
          get().removeItem(productId);
          return;
        }
        set((s) => ({
          items: s.items.map((i) => (i.productId === productId ? { ...i, quantity: qty } : i)),
        }));
      },
      clearCart() {
        set({ items: [] });
      },
    }),
    {
      name: "kss-cart",
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
