"use client";
import { useState, useRef, useEffect } from "react";
import { Bell, Search, Plus, Zap, TrendingDown, Hash, Calendar, CheckCheck, Menu } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui";
import { notificationsApi } from "@/lib/api";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

interface Notification {
  id: string;
  icon_key: string;
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string | null;
}

// Mirrors the trigger icon/color pairing used in the automation rule builder,
// keyed by AutomationRule.trigger_type since that's what the backend stamps
// onto each generated notification.
const ICON_STYLES: Record<string, { icon: typeof Bell; color: string }> = {
  post_likes:      { icon: Zap,          color: "bg-violet-600/20 text-violet-400" },
  follower_drop:   { icon: TrendingDown, color: "bg-amber-600/20 text-amber-400" },
  comment_keyword: { icon: Hash,         color: "bg-blue-600/20 text-blue-400" },
  schedule:        { icon: Calendar,     color: "bg-emerald-600/20 text-emerald-400" },
};
const DEFAULT_STYLE = { icon: Bell, color: "bg-slate-700 text-slate-300" };

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const { toggleSidebar } = useUIStore();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  const unread = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    notificationsApi.list().then(setNotifications).catch(() => {});
  }, []);

  const markRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    notificationsApi.markRead(id).catch(() => {});
  };

  const markAllRead = () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    unreadIds.forEach((id) => notificationsApi.markRead(id).catch(() => {}));
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    if (notifOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [notifOpen]);

  return (
    <header className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="md:hidden text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-white">{title}</h1>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            className="bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-4 py-1.5 text-sm text-slate-300 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500 w-48"
            placeholder="Search..."
          />
        </div>

        {/* Notification bell */}
        <div className="relative" ref={panelRef}>
          <button
            onClick={() => setNotifOpen((o) => !o)}
            className="relative text-slate-400 hover:text-slate-200 p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-violet-600 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                {unread}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 animate-slide-up overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                <span className="text-sm font-semibold text-white">Notifications</span>
                {unread > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors"
                  >
                    <CheckCheck className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800">
                {notifications.length === 0 && (
                  <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                    <Bell className="w-6 h-6 text-slate-600 mb-2" />
                    <p className="text-xs text-slate-400">You're all caught up</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">No new notifications</p>
                  </div>
                )}
                {notifications.map((n) => {
                  const style = ICON_STYLES[n.icon_key] ?? DEFAULT_STYLE;
                  const Icon = style.icon;
                  return (
                    <button
                      key={n.id}
                      onClick={() => markRead(n.id)}
                      className={cn(
                        "w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-slate-800/50 transition-colors",
                        !n.is_read && "bg-violet-600/5"
                      )}
                    >
                      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5", style.color)}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={cn("text-xs font-semibold truncate", n.is_read ? "text-slate-300" : "text-white")}>
                            {n.title}
                          </p>
                          <span className="text-[10px] text-slate-500 shrink-0">{timeAgo(n.created_at)}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{n.body}</p>
                      </div>
                      {!n.is_read && <div className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0 mt-1.5" />}
                    </button>
                  );
                })}
              </div>

              {notifications.length > 0 && (
                <div className="px-4 py-2.5 border-t border-slate-800">
                  <button className="text-xs text-violet-400 hover:text-violet-300 transition-colors w-full text-center">
                    View all notifications
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <Link
          href="/compose"
          className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          New Post
        </Link>
      </div>
    </header>
  );
}
