"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import AIAssistant from "@/components/AIAssistant";
import Onboarding from "@/components/Onboarding";
import { useAuthStore } from "@/store/auth";
import { useUIStore } from "@/store/ui";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { loadFromStorage } = useAuthStore();
  const { toggleAIPanel } = useUIStore();
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    loadFromStorage();
    const t = localStorage.getItem("token");
    if (!t) {
      router.push("/login");
    } else {
      setChecked(true);
      if (!localStorage.getItem("onboarding_done")) {
        setShowOnboarding(true);
      }
    }
  }, [loadFromStorage, router]);

  const completeOnboarding = () => {
    localStorage.setItem("onboarding_done", "1");
    setShowOnboarding(false);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggleAIPanel();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleAIPanel]);

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-auto">
        {children}
      </main>
      <AIAssistant />
      {showOnboarding && <Onboarding onComplete={completeOnboarding} />}
    </div>
  );
}
