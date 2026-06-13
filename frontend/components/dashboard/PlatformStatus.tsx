"use client";
import { CheckCircle, AlertTriangle, Wifi } from "lucide-react";
import { cn, formatNumber, PLATFORM_COLORS, PLATFORM_LABELS } from "@/lib/utils";

interface Account {
  id: string;
  platform: string;
  handle: string;
  display_name: string;
  follower_count: number;
  avg_engagement_rate: number;
  health_score: number;
  is_connected: boolean;
}

const PLATFORM_EMOJI: Record<string, string> = {
  instagram: "📸", facebook: "🔵", twitter: "🐦", tiktok: "🎵",
  linkedin: "💼", youtube: "▶️", pinterest: "📌", threads: "🧵", snapchat: "👻",
};

export default function PlatformStatus({ accounts }: { accounts: Account[] }) {
  return (
    <div className="space-y-2">
      {accounts.map((acc) => (
        <div key={acc.id} className="flex items-center gap-3 p-3 bg-slate-800/60 rounded-lg border border-slate-700/50 hover:border-slate-600 transition-colors">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0"
            style={{ backgroundColor: `${PLATFORM_COLORS[acc.platform]}18`, border: `1px solid ${PLATFORM_COLORS[acc.platform]}30` }}
          >
            {PLATFORM_EMOJI[acc.platform]}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium text-slate-200 truncate">{PLATFORM_LABELS[acc.platform]}</p>
              {acc.is_connected
                ? <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                : <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />}
            </div>
            <p className="text-xs text-slate-500">{acc.handle}</p>
          </div>

          <div className="text-right shrink-0">
            <p className="text-sm font-semibold text-white">{formatNumber(acc.follower_count)}</p>
            <p className="text-xs text-slate-500">{acc.avg_engagement_rate}% eng.</p>
          </div>

          <div className="shrink-0 w-8">
            <div className="relative w-8 h-8">
              <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="12" fill="none" stroke="#1e293b" strokeWidth="3" />
                <circle
                  cx="16" cy="16" r="12" fill="none"
                  stroke={acc.health_score >= 80 ? "#10b981" : acc.health_score >= 60 ? "#f59e0b" : "#ef4444"}
                  strokeWidth="3"
                  strokeDasharray={`${(acc.health_score / 100) * 75.4} 75.4`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-slate-300">{acc.health_score}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
