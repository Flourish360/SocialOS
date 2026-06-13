"use client";
import { create } from "zustand";
import { authApi } from "@/lib/api";

interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  loadFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,

  loadFromStorage: () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    if (token && user) set({ token, user: JSON.parse(user) });
  },

  login: async (email, password) => {
    set({ isLoading: true });
    const data = await authApi.login(email, password);
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("user", JSON.stringify({ id: data.user_id, email: data.email, full_name: data.full_name }));
    set({ token: data.access_token, user: { id: data.user_id, email: data.email, full_name: data.full_name }, isLoading: false });
  },

  register: async (email, password, name) => {
    set({ isLoading: true });
    const data = await authApi.register(email, password, name);
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("user", JSON.stringify({ id: data.user_id, email: data.email, full_name: data.full_name }));
    set({ token: data.access_token, user: { id: data.user_id, email: data.email, full_name: data.full_name }, isLoading: false });
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ token: null, user: null });
  },
}));
