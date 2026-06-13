"use client";
import { create } from "zustand";

interface UIState {
  aiPanelOpen: boolean;
  setAIPanelOpen: (open: boolean) => void;
  toggleAIPanel: () => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  aiPanelOpen: false,
  setAIPanelOpen: (open) => set({ aiPanelOpen: open }),
  toggleAIPanel: () => set((s) => ({ aiPanelOpen: !s.aiPanelOpen })),
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));
