"use client";
import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import { automationApi } from "@/lib/api";
import { TrendingUp, TrendingDown, Users, BarChart3, Plus, X, Loader2 } from "lucide-react";
import { formatNumber, formatPct } from "@/lib/utils";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b"];
const PLATFORMS = ["instagram", "twitter", "linkedin", "tiktok", "facebook", "youtube"];
const PLATFORM_EMOJI: Record<string, string> = {
  instagram: "📸", twitter: "🐦", linkedin: "💼", tiktok: "🎵", facebook: "🔵", youtube: "▶️",
};

export default function CompetitorsPage() {
  const [competitors, setCompetitors] = useState<any[]>([]);
  const [myEngagement, setMyEngagement] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", handle: "", platform: "instagram" });

  useEffect(() => {
    automationApi.competitors().then(setCompetitors);
    import("@/lib/api").then(({ analyticsApi }) =>
      analyticsApi.summary().then((s: any) => setMyEngagement(s?.avg_engagement_rate ?? null))
    );
  }, []);

  const addCompetitor = async () => {
    if (!form.name.trim() || !form.handle.trim()) { toast.error("Name and handle are required"); return; }
    setAdding(true);
    await new Promise((r) => setTimeout(r, 900));
    const newComp = {
      id: `comp-${Date.now()}`,
      name: form.name,
      handle: form.handle.startsWith("@") ? form.handle : `@${form.handle}`,
      platform: form.platform,
      followers: Math.floor(Math.random() * 50000) + 5000,
      follower_growth_pct: (Math.random() * 10 - 2).toFixed(1),
      posts_per_week: Math.floor(Math.random() * 10) + 1,
      avg_engagement: (Math.random() * 5 + 1).toFixed(1),
    };
    setCompetitors((prev) => [...prev, newComp]);
    setShowAdd(false);
    setForm({ name: "", handle: "", platform: "instagram" });
    toast.success(`Now tracking ${form.name}!`);
    setAdding(false);
  };

  return (
    <div className="flex flex-col flex-1">
      <Header title="Competitors" subtitle="Track and benchmark competitor accounts" />
      <div className="flex-1 p-6 space-y-5">

        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">Tracking {competitors.length} competitor{competitors.length !== 1 ? "s" : ""}</p>
          <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-1.5 text-sm">
            <Plus className="w-4 h-4" /> Track competitor
          </button>
        </div>

        {/* Competitor cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {competitors.map((comp, i) => (
            <div key={comp.id} className="card hover:border-slate-600 transition-colors">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm shrink-0" style={{ background: COLORS[i % COLORS.length] }}>
                  {comp.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white">{comp.name}</p>
                  <p className="text-xs text-slate-400">
                    {comp.handle} · {PLATFORM_EMOJI[comp.platform] ?? "📱"} {comp.platform}
                  </p>
                </div>
                <button
                  onClick={() => { setCompetitors((p) => p.filter((c) => c.id !== comp.id)); toast.success("Removed"); }}
                  className="text-slate-600 hover:text-slate-400 transition-colors shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-slate-800/50 rounded-lg p-2.5">
                  <p className="text-sm font-bold text-white">{formatNumber(comp.followers)}</p>
                  <p className="text-[10px] text-slate-400">Followers</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-2.5">
                  <p className={cn("text-sm font-bold flex items-center justify-center gap-0.5", parseFloat(comp.follower_growth_pct) >= 0 ? "text-emerald-400" : "text-red-400")}>
                    {parseFloat(comp.follower_growth_pct) >= 0
                      ? <TrendingUp className="w-3 h-3" />
                      : <TrendingDown className="w-3 h-3" />}
                    {formatPct(parseFloat(comp.follower_growth_pct))}
                  </p>
                  <p className="text-[10px] text-slate-400">Growth</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-2.5">
                  <p className="text-sm font-bold text-white">{comp.posts_per_week}×</p>
                  <p className="text-[10px] text-slate-400">Posts/week</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-2.5">
                  <p className="text-sm font-bold text-blue-400">{comp.avg_engagement}%</p>
                  <p className="text-[10px] text-slate-400">Eng. rate</p>
                </div>
              </div>
            </div>
          ))}

          {competitors.length === 0 && (
            <div className="lg:col-span-3 text-center py-12 text-slate-500">
              <Users className="w-8 h-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No competitors tracked yet.</p>
              <p className="text-xs mt-1">Click "Track competitor" to add one.</p>
            </div>
          )}
        </div>

        {/* Comparison chart */}
        {competitors.length > 0 && (
          <div className="card">
            <h2 className="text-sm font-semibold text-white mb-4">Engagement Rate Comparison</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[
                ...(myEngagement !== null ? [{ name: "You", engagement: myEngagement }] : []),
                ...competitors.map((c) => ({ name: c.name, engagement: parseFloat(c.avg_engagement) }))
              ]} margin={{ left: -20, right: 4 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v: number) => [`${v}%`, "Eng. Rate"]} contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="engagement" radius={[4, 4, 0, 0]}>
                  {[...(myEngagement !== null ? [{ name: "You" }] : []), ...competitors].map((_, i) => (
                    <Cell key={i} fill={i === 0 ? "#8b5cf6" : COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="card border-dashed border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <BarChart3 className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-400">Weekly Competitive Digest</h2>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            AI-generated weekly summary comparing your performance against tracked competitors. Enable email delivery in Settings → Notifications.
          </p>
        </div>
      </div>

      {/* Add competitor modal */}
      {showAdd && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setShowAdd(false)} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 animate-slide-up">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-violet-400" />
                <span className="text-sm font-semibold text-white">Track Competitor</span>
              </div>
              <button onClick={() => setShowAdd(false)} className="text-slate-500 hover:text-slate-300 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Brand / Account name</label>
                <input
                  className="input w-full"
                  placeholder="e.g. Nike"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Handle / Username</label>
                <input
                  className="input w-full"
                  placeholder="e.g. @nike"
                  value={form.handle}
                  onChange={(e) => setForm((f) => ({ ...f, handle: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Platform</label>
                <div className="grid grid-cols-3 gap-2">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setForm((f) => ({ ...f, platform: p }))}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all capitalize",
                        form.platform === p
                          ? "border-violet-500/60 bg-violet-500/10 text-violet-300"
                          : "border-slate-700 text-slate-400 hover:border-slate-600",
                      )}
                    >
                      <span>{PLATFORM_EMOJI[p]}</span> {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-800">
              <button onClick={() => setShowAdd(false)} className="btn-ghost text-sm">Cancel</button>
              <button onClick={addCompetitor} disabled={adding} className="btn-primary flex items-center gap-1.5 text-sm">
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Start tracking
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
