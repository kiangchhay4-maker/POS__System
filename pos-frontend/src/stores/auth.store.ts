import { create } from 'zustand';
import type { User } from '../types';
import { authApi } from '../api/auth.api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  setUser: (user: User | null) => void;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: authApi.getCurrentUser(),
  isAuthenticated: authApi.isAuthenticated(),
  isLoading: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  logout: () => {
    authApi.logout();
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: () => {
    const user = authApi.getCurrentUser();
    const isAuthenticated = authApi.isAuthenticated();
    set({ user, isAuthenticated });
  },
}));
