"use client";
import { useEffect, useState } from "react";
import { Users, Eye, TrendingUp, CalendarCheck, Sparkles, Send, Loader2 } from "lucide-react";
import Header from "@/components/layout/Header";
import MetricsCard from "@/components/dashboard/MetricsCard";
import EngagementChart from "@/components/dashboard/EngagementChart";
import PlatformStatus from "@/components/dashboard/PlatformStatus";
import AIInsightPanel from "@/components/dashboard/AIInsightPanel";
import BestTimeWidget from "@/components/BestTimeWidget";
import { analyticsApi, accountsApi, postsApi } from "@/lib/api";
import { formatNumber, cn } from "@/lib/utils";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
} from "recharts";
import toast from "react-hot-toast";

const QUICK_PLATFORMS = [
  { id: "instagram", emoji: "📸" },
  { id: "twitter", emoji: "🐦" },
  { id: "linkedin", emoji: "💼" },
  { id: "tiktok", emoji: "🎵" },
];

const PLATFORM_COLORS_CHART = ["#e1306c", "#1da1f2", "#0a66c2", "#ff0050", "#ff0000"];

export default function DashboardPage() {
  const [summary, setSummary] = useState<any>(null);
  const [engSeries, setEngSeries] = useState<any[]>([]);
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickCaption, setQuickCaption] = useState("");
  const [quickPlatforms, setQuickPlatforms] = useState<string[]>(["instagram"]);
  const [quickPosting, setQuickPosting] = useState(false);

  const quickPost = async () => {
    if (!quickCaption.trim()) { toast.error("Write something first"); return; }
    setQuickPosting(true);
    try {
      await postsApi.create({ caption: quickCaption, hashtags: [], platform_account_ids: quickPlatforms, media_type: "none" });
      toast.success("Post published!");
      setQuickCaption("");
    } catch { toast.error("Post failed"); }
    finally { setQuickPosting(false); }
  };

  const toggleQuickPlatform = (id: string) =>
    setQuickPlatforms((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  useEffect(() => {
    Promise.all([
      analyticsApi.summary(),
      analyticsApi.engagementSeries(30),
      analyticsApi.platforms(),
      accountsApi.list(),
    ])
      .then(([s, eng, plat, acc]) => {
        setSummary(s);
        setEngSeries(eng);
        setPlatforms(plat);
        setAccounts(acc);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      <Header
        title="Dashboard"
        subtitle={`${accounts.length} platforms connected • ${summary?.posts_scheduled ?? 0} posts scheduled`}
      />

      <div className="flex-1 p-6 space-y-6">
        {/* Metrics row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricsCard
            label="Total Followers"
            value={summary?.total_followers ?? 0}
            change={summary?.followers_change_pct ?? 0}
            icon={Users}
            iconColor="text-violet-400"
          />
          <MetricsCard
            label="Total Reach"
            value={summary?.total_reach ?? 0}
            change={summary?.reach_change_pct ?? 0}
            icon={Eye}
            iconColor="text-blue-400"
          />
          <MetricsCard
            label="Avg Engagement"
            value={`${summary?.avg_engagement_rate ?? 0}`}
            change={summary?.engagement_change_pct ?? 0}
            icon={TrendingUp}
            iconColor="text-emerald-400"
            suffix="%"
          />
          <MetricsCard
            label="Posts Scheduled"
            value={summary?.posts_scheduled ?? 0}
            change={0}
            icon={CalendarCheck}
            iconColor="text-amber-400"
          />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Engagement over time */}
          <div className="card lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-white">Engagement - Last 30 Days</h2>
                <p className="text-xs text-slate-400 mt-0.5">Total engagements per platform</p>
              </div>
              <select className="bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 px-2 py-1 focus:outline-none">
                <option>30 days</option>
                <option>14 days</option>
                <option>7 days</option>
              </select>
            </div>
            <EngagementChart data={engSeries} />
          </div>

          {/* Platform comparison */}
          <div className="card">
            <h2 className="text-sm font-semibold text-white mb-1">Platform Performance</h2>
            <p className="text-xs text-slate-400 mb-4">Engagement rate by platform</p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={platforms} layout="vertical" margin={{ left: -10, right: 10 }}>
                <XAxis type="number" tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="platform" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} width={68} />
                <Tooltip
                  formatter={(v: number) => [`${v}%`, "Eng. Rate"]}
                  contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="engagement_rate" radius={[0, 4, 4, 0]}>
                  {platforms.map((_, i) => (
                    <Cell key={i} fill={PLATFORM_COLORS_CHART[i % PLATFORM_COLORS_CHART.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick compose */}
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Send className="w-4 h-4 text-violet-400" />
            <h2 className="text-sm font-semibold text-white">Quick Post</h2>
            <span className="text-xs text-slate-500 ml-auto">No AI, just publish fast</span>
          </div>
          <textarea
            className="w-full bg-transparent text-slate-100 placeholder:text-slate-600 text-sm leading-relaxed resize-none focus:outline-none min-h-[72px]"
            placeholder="What's on your mind? Post it to all your platforms in one click…"
            value={quickCaption}
            onChange={(e) => setQuickCaption(e.target.value)}
          />
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-800">
            <div className="flex gap-1.5">
              {QUICK_PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => toggleQuickPlatform(p.id)}
                  className={cn(
                    "w-8 h-8 rounded-lg border text-base transition-all",
                    quickPlatforms.includes(p.id)
                      ? "border-violet-500/50 bg-violet-500/10"
                      : "border-slate-700 bg-slate-800/50 opacity-40",
                  )}
                >
                  {p.emoji}
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-500 flex-1">{quickCaption.length} chars</span>
            <button
              onClick={quickPost}
              disabled={quickPosting || !quickCaption.trim()}
              className="btn-primary flex items-center gap-1.5 text-sm"
            >
              {quickPosting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Post now
            </button>
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* AI Insights */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-violet-600/20 rounded-lg">
                <Sparkles className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">AI Insights</h2>
                <p className="text-xs text-slate-400">Updated just now</p>
              </div>
            </div>
            <AIInsightPanel insights={summary?.ai_insights ?? []} />
          </div>

          {/* Connected accounts */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-white">Connected Accounts</h2>
                <p className="text-xs text-slate-400">{accounts.length} platforms • health scores</p>
              </div>
              <button className="text-xs text-violet-400 hover:text-violet-300 transition-colors">+ Add</button>
            </div>
            <PlatformStatus accounts={accounts} />
          </div>
        </div>

        {/* Best time to post */}
        <BestTimeWidget platform={quickPlatforms[0] ?? "instagram"} />
      </div>
    </div>
  );
}
