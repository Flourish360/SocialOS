"use client";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from "recharts";
import { format, parseISO } from "date-fns";

interface EngagementChartProps {
  data: Array<Record<string, string | number>>;
}

const SERIES = [
  { key: "tiktok", color: "#ff0050", label: "TikTok" },
  { key: "instagram", color: "#e1306c", label: "Instagram" },
  { key: "linkedin", color: "#0a66c2", label: "LinkedIn" },
  { key: "twitter", color: "#1da1f2", label: "Twitter/X" },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
      <p className="text-xs text-slate-400 mb-2">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="text-sm font-medium" style={{ color: p.color }}>
          {p.name}: {p.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

export default function EngagementChart({ data }: EngagementChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    label: typeof d.date === "string" ? format(parseISO(d.date), "MMM d") : d.date,
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={formatted} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <defs>
          {SERIES.map(({ key, color }) => (
            <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} axisLine={false} interval={6} />
        <YAxis tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
        {SERIES.map(({ key, color, label }) => (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            name={label}
            stroke={color}
            strokeWidth={2}
            fill={`url(#grad-${key})`}
            dot={false}
            activeDot={{ r: 4, fill: color }}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
