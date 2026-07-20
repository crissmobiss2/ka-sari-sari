import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/types";

interface FavoritesStore {
  items: Product[];
  isFavorite: (productId: string) => boolean;
  toggle: (product: Product) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      items: [],
      isFavorite: (productId) => get().items.some((p) => p.id === productId),
      toggle: (product) => {
        const exists = get().isFavorite(product.id);
        if (exists) {
          set({ items: get().items.filter((p) => p.id !== product.id) });
        } else {
          set({ items: [...get().items, product] });
        }
      },
      remove: (productId) => set({ items: get().items.filter((p) => p.id !== productId) }),
      clear: () => set({ items: [] }),
    }),
    { name: "kss-favorites" }
  )
);
