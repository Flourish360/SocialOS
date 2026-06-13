"use client";
import { Sparkles, ChevronRight } from "lucide-react";

const INSIGHT_ICONS = ["📉", "🎥", "💬", "📅"];

export default function AIInsightPanel({ insights }: { insights: string[] }) {
  return (
    <div className="space-y-2.5">
      {insights.map((insight, i) => (
        <div
          key={i}
          className="flex gap-3 p-3.5 bg-slate-800/40 rounded-lg border border-slate-700/40 hover:border-violet-500/30 hover:bg-violet-500/5 transition-all cursor-pointer group"
        >
          <span className="text-lg shrink-0 leading-none mt-0.5">{INSIGHT_ICONS[i % INSIGHT_ICONS.length]}</span>
          <p className="text-sm text-slate-300 leading-relaxed flex-1">{insight}</p>
          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-violet-400 shrink-0 transition-colors mt-0.5" />
        </div>
      ))}
    </div>
  );
}
