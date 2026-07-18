"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, PenSquare, Calendar, Zap, BarChart3,
  Inbox, Image, Users, Settings, Sparkles, ChevronRight,
  LogOut, ListOrdered,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import { useUIStore } from "@/store/ui";
import { useRouter } from "next/navigation";

const NAV = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Compose", href: "/compose", icon: PenSquare },
  { label: "Queue", href: "/queue", icon: ListOrdered },
  { label: "Calendar", href: "/calendar", icon: Calendar },
  { label: "Automation", href: "/automation", icon: Zap },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Inbox", href: "/inbox", icon: Inbox },
  { label: "Media", href: "/media", icon: Image },
  { label: "Competitors", href: "/competitors", icon: Users },
  { label: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { toggleAIPanel, sidebarOpen, setSidebarOpen } = useUIStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    <aside className={cn(
      "flex flex-col w-60 min-h-screen bg-slate-900 border-r border-slate-800 shrink-0 transition-transform duration-300",
      "fixed md:relative inset-y-0 left-0 z-40",
      sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
    )}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-800">
        <img src="/icon.svg" alt="SocialOS" className="w-8 h-8 rounded-lg shrink-0" />
        <span className="font-bold text-white tracking-tight">SocialOS</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ label, href, icon: Icon }) => {
          const active = href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                active
                  ? "bg-violet-600/20 text-violet-300 border border-violet-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800",
              )}
            >
              <Icon className={cn("w-4 h-4 shrink-0", active ? "text-violet-400" : "text-slate-500 group-hover:text-slate-300")} />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="w-3 h-3 text-violet-400" />}
            </Link>
          );
        })}
      </nav>

      {/* AI Assistant Button */}
      <div className="px-3 py-3 border-t border-slate-800">
        <button
          onClick={toggleAIPanel}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-violet-600/10 border border-violet-500/20 text-violet-300 hover:bg-violet-600/20 transition-all text-sm font-medium group"
        >
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>AI Assistant</span>
          <span className="ml-auto text-xs text-violet-400 opacity-60">⌘K</span>
        </button>
      </div>

      {/* User */}
      <div className="px-3 py-3 border-t border-slate-800">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
            {user?.full_name?.[0] ?? "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">{user?.full_name ?? "User"}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email ?? ""}</p>
          </div>
          <button onClick={handleLogout} className="text-slate-600 hover:text-slate-300 transition-colors p-1">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
    </>
  );
}
