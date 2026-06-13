"use client";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn, formatNumber, formatPct } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface MetricsCardProps {
  label: string;
  value: string | number;
  change: number;
  icon: LucideIcon;
  iconColor?: string;
  suffix?: string;
}

export default function MetricsCard({ label, value, change, icon: Icon, iconColor = "text-violet-400", suffix }: MetricsCardProps) {
  const isPositive = change >= 0;
  return (
    <div className="card flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className={cn("p-2 rounded-lg bg-slate-800", iconColor)}>
          <Icon className="w-4 h-4" />
        </div>
        <div className={cn("flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full", isPositive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400")}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {formatPct(Math.abs(change))}
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-white">
          {typeof value === "number" ? formatNumber(value) : value}
          {suffix && <span className="text-lg text-slate-400 ml-0.5">{suffix}</span>}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}
