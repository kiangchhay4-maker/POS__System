import { create } from 'zustand';
import type { CartItem, OrderType } from '../types';

interface CartState {
  items: CartItem[];
  orderType: OrderType;
  customerId?: string;
  customerName?: string;
  discountId?: string;
  notes?: string;

  // Cart operations
  addItem: (item: Omit<CartItem, 'subtotal'>) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateNotes: (productId: string, notes: string) => void;
  clearCart: () => void;

  // Order metadata
  setOrderType: (orderType: OrderType) => void;
  setCustomer: (customerId?: string, customerName?: string) => void;
  setDiscount: (discountId?: string) => void;
  setNotes: (notes: string) => void;

  // Computed values
  getSubtotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  orderType: 'TAKEAWAY',
  customerId: undefined,
  customerName: 'Walk-in Customer',
  discountId: undefined,
  notes: undefined,

  addItem: (item) => {
    const { items } = get();
    const existingItem = items.find((i) => i.productId === item.productId);

    if (existingItem) {
      // Update quantity if item exists
      set({
        items: items.map((i) =>
          i.productId === item.productId
            ? {
                ...i,
                quantity: i.quantity + item.quantity,
                subtotal: (i.quantity + item.quantity) * i.unitPrice,
              }
            : i
        ),
      });
    } else {
      // Add new item
      set({
        items: [
          ...items,
          {
            ...item,
            subtotal: item.quantity * item.unitPrice,
          },
        ],
      });
    }
  },

  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter((item) => item.productId !== productId),
    }));
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }

    set((state) => ({
      items: state.items.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity,
              subtotal: quantity * item.unitPrice,
            }
          : item
      ),
    }));
  },

  updateNotes: (productId, notes) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.productId === productId ? { ...item, notes } : item
      ),
    }));
  },

  clearCart: () => {
    set({
      items: [],
      orderType: 'TAKEAWAY',
      customerId: undefined,
      customerName: 'Walk-in Customer',
      discountId: undefined,
      notes: undefined,
    });
  },

  setOrderType: (orderType) => set({ orderType }),

  setCustomer: (customerId, customerName) => {
    set({ 
      customerId, 
      customerName: customerName || 'Walk-in Customer' 
    });
  },

  setDiscount: (discountId) => set({ discountId }),

  setNotes: (notes) => set({ notes }),

  getSubtotal: () => {
    const { items } = get();
    return items.reduce((sum, item) => sum + item.subtotal, 0);
  },

  getItemCount: () => {
    const { items } = get();
    return items.reduce((sum, item) => sum + item.quantity, 0);
  },
}));
