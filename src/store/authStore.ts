import { create } from 'zustand';
import { Doctor } from '../types';

interface AuthState {
  doctor: Doctor | null;
  token: string | null;
  isLoggedIn: boolean;
  login: (doctor: Doctor, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  doctor: null,
  token: null,
  isLoggedIn: false,
  login: (doctor, token) => set({ doctor, token, isLoggedIn: true }),
  logout: () => set({ doctor: null, token: null, isLoggedIn: false }),
}));
