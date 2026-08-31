import { create } from 'zustand';

export interface CartItem {
  foodItemId: string;
  name: string;
  price: number;
  quantity: number;
  isVeg: boolean;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (foodItemId: string) => void;
  updateQuantity: (foodItemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: (item) => {
    const existing = get().items.find((i) => i.foodItemId === item.foodItemId);
    if (existing) {
      set({
        items: get().items.map((i) =>
          i.foodItemId === item.foodItemId ? { ...i, quantity: i.quantity + 1 } : i
        ),
      });
    } else {
      set({ items: [...get().items, { ...item, quantity: 1 }] });
    }
  },

  removeItem: (foodItemId) => {
    set({ items: get().items.filter((i) => i.foodItemId !== foodItemId) });
  },

  updateQuantity: (foodItemId, quantity) => {
    if (quantity <= 0) {
      set({ items: get().items.filter((i) => i.foodItemId !== foodItemId) });
    } else {
      set({
        items: get().items.map((i) =>
          i.foodItemId === foodItemId ? { ...i, quantity } : i
        ),
      });
    }
  },

  clearCart: () => set({ items: [] }),

  getTotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

  getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
}));
