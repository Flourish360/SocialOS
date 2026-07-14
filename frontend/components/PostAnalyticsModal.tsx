"use client";
import { useState, useEffect } from "react";
import { X, Eye, Heart, MessageCircle, Bookmark, Share2, MousePointer, UserCheck, TrendingUp, Globe } from "lucide-react";
import { postsApi } from "@/lib/api";
import { formatNumber } from "@/lib/utils";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, Cell } from "recharts";

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "#e1306c", twitter: "#1da1f2", linkedin: "#0a66c2",
  tiktok: "#ff0050", facebook: "#1877f2",
};

const STAT_COLORS = ["text-blue-400", "text-violet-400", "text-pink-400", "text-amber-400", "text-emerald-400", "text-cyan-400"];

interface Props {
  postId: string;
  caption?: string;
  onClose: () => void;
}

export default function PostAnalyticsModal({ postId, caption, onClose }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    postsApi.analytics(postId).then(setData).finally(() => setLoading(false));
  }, [postId]);

  const stats = data ? [
    { label: "Impressions", value: data.impressions, icon: Eye },
    { label: "Reach", value: data.reach, icon: TrendingUp },
    { label: "Likes", value: data.likes, icon: Heart },
    { label: "Comments", value: data.comments, icon: MessageCircle },
    { label: "Saves", value: data.saves, icon: Bookmark },
    { label: "Shares", value: data.shares, icon: Share2 },
    { label: "Link clicks", value: data.link_clicks, icon: MousePointer },
    { label: "Profile visits", value: data.profile_visits, icon: UserCheck },
  ] : [];

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 animate-slide-up flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-semibold text-white">Post Analytics</span>
            {data && (
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                data.engagement_rate >= 5 ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" :
                data.engagement_rate >= 3 ? "bg-amber-500/15 text-amber-400 border-amber-500/30" :
                "bg-slate-700 text-slate-400 border-slate-600"
              }`}>
                {data.engagement_rate}% engagement
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : data ? (
            <div className="p-5 space-y-5">
              {/* Caption preview */}
              {caption && (
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                  {caption}
                </p>
              )}

              {/* Key metrics grid */}
              <div className="grid grid-cols-4 gap-3">
                {stats.map(({ label, value, icon: Icon }, i) => (
                  <div key={label} className="bg-slate-800/50 rounded-xl p-3 border border-slate-800 text-center">
                    <Icon className={`w-3.5 h-3.5 mx-auto mb-1.5 ${STAT_COLORS[i % STAT_COLORS.length]}`} />
                    <p className="text-sm font-bold text-white">{formatNumber(value)}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Performance over time */}
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Performance - 7 Days</h3>
                <div className="bg-slate-800/30 rounded-xl p-3 border border-slate-800">
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={data.daily_series} margin={{ left: -20, right: 4 }}>
                      <defs>
                        <linearGradient id="gradImpr" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradEng" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} axisLine={false} tickFormatter={(v) => formatNumber(v)} />
                      <Tooltip
                        contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 11 }}
                        formatter={(v, name) => [formatNumber(v as number), name === "impressions" ? "Impressions" : "Engagements"]}
                      />
                      <Area type="monotone" dataKey="impressions" stroke="#8b5cf6" strokeWidth={2} fill="url(#gradImpr)" />
                      <Area type="monotone" dataKey="engagements" stroke="#10b981" strokeWidth={2} fill="url(#gradEng)" />
                    </AreaChart>
                  </ResponsiveContainer>
                  <div className="flex items-center gap-4 justify-center mt-1">
                    {[{ color: "#8b5cf6", label: "Impressions" }, { color: "#10b981", label: "Engagements" }].map(({ color, label }) => (
                      <div key={label} className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                        <span className="text-[10px] text-slate-500">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Platform split */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Platform Split</h3>
                  <div className="bg-slate-800/30 rounded-xl p-3 border border-slate-800">
                    <ResponsiveContainer width="100%" height={120}>
                      <BarChart data={data.platform_split} layout="vertical" margin={{ left: -10, right: 4 }}>
                        <XAxis type="number" tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                        <YAxis type="category" dataKey="platform" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} width={64} />
                        <Tooltip formatter={(v) => [`${v as number}%`, "Share"]} contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 11 }} />
                        <Bar dataKey="pct" radius={[0, 4, 4, 0]}>
                          {data.platform_split.map((p: any) => (
                            <Cell key={p.platform} fill={PLATFORM_COLORS[p.platform] ?? "#8b5cf6"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Audience</h3>
                  <div className="bg-slate-800/30 rounded-xl p-3 border border-slate-800 space-y-3 h-[calc(100%-28px)]">
                    {[
                      { label: "Top country", value: data.top_country, icon: Globe },
                      { label: "Top age group", value: data.top_age_group, icon: UserCheck },
                      { label: "Reach rate", value: `${Math.round(data.reach / data.impressions * 100)}%`, icon: TrendingUp },
                    ].map(({ label, value, icon: Icon }) => (
                      <div key={label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-xs text-slate-500">{label}</span>
                        </div>
                        <span className="text-xs font-medium text-slate-200">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-slate-500 text-sm">No analytics data</div>
          )}
        </div>
      </div>
    </>
  );
}
