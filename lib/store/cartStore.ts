import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FoodItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  prepTimeMins: number;
  isCooked: boolean;
  stock: number;
  discount: {
    percent: number;
    validFrom: string;
    validTo: string;
    effectivePrice: number;
  } | null;
}

export interface CartItem extends FoodItem {
  quantity: number;
}

interface CartState {
  vendorId: string | null;
  items: { [itemId: string]: CartItem };
  
  // Actions
  addItem: (item: FoodItem, vendorId: string) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  setVendorId: (vendorId: string) => void;
  
  // Getters
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      vendorId: null,
      items: {},

      addItem: (item, vendorId) => {
        set((state) => {
          // If the cart is empty or it's the same vendor, proceed normally
          if (!state.vendorId || state.vendorId === vendorId) {
            const currentItem = state.items[item.id];
            return {
              vendorId, // Set vendor ID if it was null
              items: {
                ...state.items,
                [item.id]: currentItem
                  ? { ...currentItem, quantity: currentItem.quantity + 1 }
                  : { ...item, quantity: 1 },
              },
            };
          }
          // The component should handle preventing this branch if the user hasn't confirmed clearing.
          // If we reach here, it means we overwrite.
          return {
            vendorId,
            items: {
              [item.id]: { ...item, quantity: 1 },
            },
          };
        });
      },

      removeItem: (itemId) => {
        set((state) => {
          const currentItem = state.items[itemId];
          if (!currentItem) return state;

          if (currentItem.quantity === 1) {
            const newItems = { ...state.items };
            delete newItems[itemId];
            
            // If the cart is empty, clear vendorId
            if (Object.keys(newItems).length === 0) {
              return { vendorId: null, items: {} };
            }
            
            return { items: newItems };
          }

          return {
            items: {
              ...state.items,
              [itemId]: { ...currentItem, quantity: currentItem.quantity - 1 },
            },
          };
        });
      },

      clearCart: () => {
        set({ vendorId: null, items: {} });
      },
      
      setVendorId: (vendorId) => {
        set({ vendorId });
      },

      getTotalItems: () => {
        const state = get();
        return Object.values(state.items).reduce((acc, item) => acc + item.quantity, 0);
      },

      getTotalPrice: () => {
        const state = get();
        return Object.values(state.items).reduce((acc, item) => {
          const price = item.discount ? item.discount.effectivePrice : item.price;
          return acc + price * item.quantity;
        }, 0);
      },
    }),
    {
      name: 'foodzie-cart', // key in local storage
    }
  )
);
