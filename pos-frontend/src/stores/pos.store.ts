import { create } from 'zustand';

interface PosState {
  selectedCategoryId?: string;
  searchQuery: string;
  isOnline: boolean;

  setSelectedCategory: (categoryId?: string) => void;
  setSearchQuery: (query: string) => void;
  setOnlineStatus: (isOnline: boolean) => void;
}

export const usePosStore = create<PosState>((set) => ({
  selectedCategoryId: undefined,
  searchQuery: '',
  isOnline: navigator.onLine,

  setSelectedCategory: (categoryId) => set({ selectedCategoryId: categoryId }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setOnlineStatus: (isOnline) => set({ isOnline }),
}));

// Listen to online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    usePosStore.getState().setOnlineStatus(true);
  });

  window.addEventListener('offline', () => {
    usePosStore.getState().setOnlineStatus(false);
  });
}
