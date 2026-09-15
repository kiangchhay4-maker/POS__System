import { create } from 'zustand';
import type { Shift } from '../types';

interface ShiftState {
  currentShift: Shift | null;
  
  setCurrentShift: (shift: Shift | null) => void;
  clearShift: () => void;
}

export const useShiftStore = create<ShiftState>((set) => ({
  currentShift: null,

  setCurrentShift: (shift) => set({ currentShift: shift }),

  clearShift: () => set({ currentShift: null }),
}));
