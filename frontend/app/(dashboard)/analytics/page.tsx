"use client";
import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import { analyticsApi, postsApi } from "@/lib/api";
import { Sparkles, Send, Loader2, Download, TrendingUp, TrendingDown, BarChart2 } from "lucide-react";
import PostAnalyticsModal from "@/components/PostAnalyticsModal";
import { formatNumber, formatPct, PLATFORM_COLORS } from "@/lib/utils";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, Cell, PieChart, Pie, Legend,
} from "recharts";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const CHART_COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"];
const DATE_RANGES = [
  { label: "7d", days: 7 },
  { label: "14d", days: 14 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
];

const PLATFORM_EMOJI: Record<string, string> = {
  instagram: "📸", twitter: "🐦", linkedin: "💼", tiktok: "🎵", facebook: "🔵",
};

export default function AnalyticsPage() {
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [followerSeries, setFollowerSeries] = useState<any[]>([]);
  const [engSeries, setEngSeries] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [nlqQuestion, setNlqQuestion] = useState("");
  const [nlqAnswer, setNlqAnswer] = useState<any>(null);
  const [nlqLoading, setNlqLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [exporting, setExporting] = useState(false);
  const [analyticsPost, setAnalyticsPost] = useState<any | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      analyticsApi.platforms(),
      analyticsApi.followerSeries(days),
      analyticsApi.engagementSeries(days),
      postsApi.list(),
    ])
      .then(([p, fs, es, ps]) => {
        setPlatforms(p);
        setFollowerSeries(fs);
        setEngSeries(es);
        setPosts(ps);
      })
      .finally(() => setLoading(false));
  }, [days]);

  const askNLQ = async () => {
    if (!nlqQuestion.trim()) return;
    setNlqLoading(true);
    try {
      const data = await analyticsApi.ask(nlqQuestion);
      setNlqAnswer(data);
    } catch {
      toast.error("Query failed");
    } finally {
      setNlqLoading(false);
    }
  };

  const exportCSV = () => {
    setExporting(true);
    try {
      // Platform summary CSV
      const platformRows = [
        ["Platform", "Followers", "Growth %", "Engagement Rate %", "Total Reach", "Total Impressions"],
        ...platforms.map((p) => [
          p.platform, p.followers, p.follower_growth, p.engagement_rate,
          p.total_reach ?? "", p.total_impressions ?? "",
        ]),
      ];

      const postRows = [
        ["", ""],
        ["Top Posts", ""],
        ["Caption", "Platform", "Status", "Scheduled At", "Engagement Score"],
        ...topPosts.map((p) => [
          `"${(p.caption ?? "").replace(/"/g, "'").slice(0, 80)}"`,
          p.platform_account_ids?.[0] ?? "",
          p.status,
          p.scheduled_at ?? p.published_at ?? "",
          p.predicted_engagement_score ?? "",
        ]),
      ];

      const csv = [...platformRows, ...postRows]
        .map((row) => row.join(","))
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `socialos-analytics-${format(new Date(), "yyyy-MM-dd")}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV exported!");
    } finally {
      setExporting(false);
    }
  };

  const pieData = platforms.map((p) => ({ name: p.platform, value: p.followers }));
  const formatted = followerSeries.map((d) => ({
    ...d, label: format(parseISO(d.date), days <= 14 ? "MMM d" : "MMM d"),
  }));

  const topPosts = [...posts]
    .filter((p) => p.predicted_engagement_score)
    .sort((a, b) => (b.predicted_engagement_score ?? 0) - (a.predicted_engagement_score ?? 0))
    .slice(0, 8);

  return (
    <div className="flex flex-col flex-1">
      <Header title="Analytics" subtitle="Deep intelligence across all your platforms" />
      <div className="flex-1 p-6 space-y-6">

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
            {DATE_RANGES.map(({ label, days: d }) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  days === d ? "bg-violet-600 text-white" : "text-slate-400 hover:text-slate-200",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={exportCSV}
            disabled={exporting || loading}
            className="btn-secondary flex items-center gap-1.5 text-xs"
          >
            {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Export CSV
          </button>
        </div>

        {/* Platform cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {platforms.map((p, i) => (
            <div key={p.platform} className="card">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-slate-400 capitalize">{p.platform}</p>
                <span className="text-sm">{PLATFORM_EMOJI[p.platform] ?? "📱"}</span>
              </div>
              <p className="text-xl font-bold text-white">{formatNumber(p.followers)}</p>
              <div className={cn("flex items-center gap-1 text-xs mt-1 font-medium", p.follower_growth >= 0 ? "text-emerald-400" : "text-red-400")}>
                {p.follower_growth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {formatPct(p.follower_growth)}
              </div>
              <div className="mt-2 w-full bg-slate-800 h-1 rounded-full">
                <div className="h-1 rounded-full" style={{ width: `${p.engagement_rate * 10}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} />
              </div>
              <p className="text-xs text-slate-500 mt-1">{p.engagement_rate}% eng.</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card lg:col-span-2">
            <h2 className="text-sm font-semibold text-white mb-4">Follower Growth - {days} Days</h2>
            {loading ? (
              <div className="h-[220px] flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={formatted} margin={{ left: -20, right: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} axisLine={false} interval={Math.floor(formatted.length / 6)} />
                  <YAxis tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
                  {["instagram", "twitter", "linkedin", "tiktok"].map((key, i) => (
                    <Line key={key} type="monotone" dataKey={key} name={key.charAt(0).toUpperCase() + key.slice(1)} stroke={CHART_COLORS[i]} strokeWidth={2} dot={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="card">
            <h2 className="text-sm font-semibold text-white mb-4">Audience by Platform</h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={50}>
                  {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatNumber(v as number)} contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Engagement bar chart */}
        <div className="card">
          <h2 className="text-sm font-semibold text-white mb-4">Engagement Rate by Platform</h2>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={platforms} margin={{ left: -20, right: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="platform" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(v) => [`${v as number}%`, "Engagement Rate"]} contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="engagement_rate" radius={[4, 4, 0, 0]}>
                {platforms.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top posts table */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Top Posts by Predicted Engagement</h2>
            <span className="text-xs text-slate-500">{topPosts.length} posts</span>
          </div>

          {topPosts.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">No posts yet - start composing!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-500 border-b border-slate-800">
                    <th className="text-left pb-3 font-medium">Caption</th>
                    <th className="text-left pb-3 font-medium">Platform</th>
                    <th className="text-left pb-3 font-medium">Status</th>
                    <th className="text-right pb-3 font-medium">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {topPosts.map((post) => (
                    <tr key={post.id} className="hover:bg-slate-800/30 transition-colors cursor-pointer group" onClick={() => setAnalyticsPost(post)}>
                      <td className="py-3 pr-4 max-w-[280px]">
                        <div className="flex items-center gap-1.5">
                          <p className="text-slate-200 truncate">{post.caption}</p>
                          <BarChart2 className="w-3 h-3 text-slate-600 group-hover:text-violet-400 transition-colors shrink-0" />
                        </div>
                        {post.hashtags?.length > 0 && (
                          <p className="text-xs text-blue-400 truncate mt-0.5">{post.hashtags.slice(0, 3).join(" ")}</p>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex gap-1">
                          {(post.platform_account_ids ?? []).slice(0, 3).map((p: string) => (
                            <span key={p} className="text-base">{PLATFORM_EMOJI[p] ?? "📱"}</span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full border capitalize",
                          post.status === "published" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" :
                          post.status === "scheduled" ? "bg-violet-500/15 text-violet-400 border-violet-500/30" :
                          "bg-slate-700 text-slate-400 border-slate-600",
                        )}>
                          {post.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-slate-800 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full bg-violet-500"
                              style={{ width: `${post.predicted_engagement_score ?? 0}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-violet-400 w-8 text-right">
                            {post.predicted_engagement_score ?? "-"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* NLQ */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-violet-600/20 rounded-lg">
              <Sparkles className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Ask Your Data</h2>
              <p className="text-xs text-slate-400">Natural language analytics queries</p>
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <input
              className="input flex-1"
              placeholder="e.g. Which platform grew the most last month?"
              value={nlqQuestion}
              onChange={(e) => setNlqQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && askNLQ()}
            />
            <button onClick={askNLQ} disabled={nlqLoading} className="btn-primary flex items-center gap-1.5">
              {nlqLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Ask
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {[
              "Which platform grew the most?",
              "What content gets the most saves on Instagram?",
              "Show me top posts by engagement rate",
            ].map((q) => (
              <button key={q} onClick={() => setNlqQuestion(q)} className="text-xs bg-slate-800 text-slate-300 border border-slate-700 rounded-full px-3 py-1.5 hover:border-violet-500/50 hover:text-violet-300 transition-all">
                {q}
              </button>
            ))}
          </div>

          {nlqAnswer && (
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 animate-slide-up">
              <p className="text-sm text-slate-200 leading-relaxed mb-3">{nlqAnswer.answer}</p>
              {nlqAnswer.chart_type === "bar" && nlqAnswer.chart_data && (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={nlqAnswer.chart_data} margin={{ left: -20, right: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey={nlqAnswer.chart_labels?.[0]} tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey={nlqAnswer.chart_labels?.[1]} fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                      {nlqAnswer.chart_data.map((_: any, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          )}
        </div>
      </div>

      {analyticsPost && (
        <PostAnalyticsModal
          postId={analyticsPost.id}
          caption={analyticsPost.caption}
          onClose={() => setAnalyticsPost(null)}
        />
      )}
    </div>
  );
}
