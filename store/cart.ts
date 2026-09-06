import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware";

import type { MenuItem } from "@/lib/types/database";

const MAX_QTY = 10;

export type CartItem = MenuItem & { quantity: number };

type CartStore = {
  items: CartItem[];
  cartDrawerOpen: boolean;
  addItem: (item: MenuItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
  setCartDrawerOpen: (open: boolean) => void;
};

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      cartDrawerOpen: false,
      addItem: (item) =>
        set((state) => {
          const idx = state.items.findIndex((i) => i.id === item.id);
          if (idx >= 0) {
            const next = [...state.items];
            const q = Math.min(MAX_QTY, next[idx].quantity + 1);
            next[idx] = { ...next[idx], quantity: q };
            return { items: next };
          }
          return { items: [...state.items, { ...item, quantity: 1 }] };
        }),
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),
      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        const q = Math.min(MAX_QTY, quantity);
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, quantity: q } : i,
          ),
        }));
      },
      clearCart: () => set({ items: [] }),
      openCartDrawer: () => set({ cartDrawerOpen: true }),
      closeCartDrawer: () => set({ cartDrawerOpen: false }),
      setCartDrawerOpen: (open) => set({ cartDrawerOpen: open }),
    }),
    {
      name: "noq-cart",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? sessionStorage : noopStorage,
      ),
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

export function useCartTotal(): number {
  return useCartStore((s) =>
    s.items.reduce((sum, i) => sum + i.price * i.quantity, 0),
  );
}

export function useCartItemCount(): number {
  return useCartStore((s) =>
    s.items.reduce((sum, i) => sum + i.quantity, 0),
  );
}

export default useCartStore;
