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

/** Decode JWT payload without verifying — only used to read the `exp` claim client-side. */
function jwtExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

function isTokenValid(token: string): boolean {
  const exp = jwtExpiry(token);
  if (!exp) return false;
  // Treat as expired 60 seconds early to avoid edge-case races
  return exp * 1000 > Date.now() + 60_000;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,

  loadFromStorage: () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("token");
    const user  = localStorage.getItem("user");
    if (token && user && isTokenValid(token)) {
      set({ token, user: JSON.parse(user) });
    } else if (token) {
      // Token present but expired — clear it so the dashboard redirects to login
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const data = await authApi.login(email, password);
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify({
        id: data.user_id,
        email: data.email,
        full_name: data.full_name,
      }));
      set({ token: data.access_token, user: { id: data.user_id, email: data.email, full_name: data.full_name } });
    } finally {
      set({ isLoading: false });
    }
    // Errors propagate to the caller — login page catches and shows toast
  },

  register: async (email, password, name) => {
    set({ isLoading: true });
    try {
      const data = await authApi.register(email, password, name);
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify({
        id: data.user_id,
        email: data.email,
        full_name: data.full_name,
      }));
      set({ token: data.access_token, user: { id: data.user_id, email: data.email, full_name: data.full_name } });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ token: null, user: null });
    if (typeof window !== "undefined") window.location.href = "/login";
  },
}));
