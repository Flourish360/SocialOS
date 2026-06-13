"use client";
import { useState, useEffect } from "react";
import { Clock, Zap } from "lucide-react";
import { aiApi } from "@/lib/api";
import { cn } from "@/lib/utils";

interface BestTimeWidgetProps {
  platform?: string;
}

const SCORE_COLOR = (score: number) =>
  score >= 90 ? "text-emerald-400 bg-emerald-400/10 border-emerald-500/20" :
  score >= 80 ? "text-amber-400 bg-amber-400/10 border-amber-500/20" :
                "text-blue-400 bg-blue-400/10 border-blue-500/20";

export default function BestTimeWidget({ platform = "instagram" }: BestTimeWidgetProps) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    aiApi.bestTime(platform).then(setData).catch(() => null);
  }, [platform]);

  if (!data) return null;

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-violet-400" />
        <span className="text-sm font-semibold text-white">Best Times to Post</span>
      </div>

      <div className="flex items-center gap-2 mb-3 p-2.5 bg-violet-500/10 border border-violet-500/20 rounded-lg">
        <Zap className="w-3.5 h-3.5 text-violet-400 shrink-0" />
        <p className="text-xs text-violet-300">Next optimal: <span className="font-semibold">{data.next_optimal}</span></p>
      </div>

      <div className="space-y-2">
        {data.windows.map((w: any, i: number) => (
          <div key={i} className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-200">{w.day}</p>
              <p className="text-xs text-slate-500">{w.time}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-20 bg-slate-800 rounded-full h-1.5">
                <div
                  className={cn("h-1.5 rounded-full", w.score >= 90 ? "bg-emerald-500" : w.score >= 80 ? "bg-amber-500" : "bg-blue-500")}
                  style={{ width: `${w.score}%` }}
                />
              </div>
              <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded border", SCORE_COLOR(w.score))}>
                {w.label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
