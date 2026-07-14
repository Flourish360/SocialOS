"use client";
import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import { postsApi, analyticsApi } from "@/lib/api";
import { Clock, Trash2, Zap, Plus, Sparkles, Send, Loader2, CalendarClock, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import toast from "react-hot-toast";

const PLATFORM_EMOJI: Record<string, string> = {
  instagram: "📸", twitter: "🐦", linkedin: "💼", tiktok: "🎵", facebook: "🔵",
};

interface BestSlot { day: string; hour: number; time: string; score: number; source: string; }
interface QueuedPost { id: string; caption: string; hashtags: string[]; platform_account_ids: string[]; status: string; queue_slot: string | null; queue_date_label: string | null; scheduled_at: string | null; predicted_engagement_score: number | null; }

export default function QueuePage() {
  const [posts, setPosts] = useState<QueuedPost[]>([]);
  const [bestSlots, setBestSlots] = useState<BestSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      postsApi.list("queued"),
      analyticsApi.bestSlots(["instagram"]),
    ]).then(([all, slots]) => {
      setPosts((all as QueuedPost[]).filter((p) => p.status === "queued"));
      setBestSlots(slots as BestSlot[]);
    }).catch(() => {
      postsApi.list("queued").then((all) => {
        setPosts((all as any[]).filter((p) => p.status === "queued"));
      });
    }).finally(() => setLoading(false));
  }, []);

  const remove = async (id: string) => {
    setDeleting(id);
    try {
      await postsApi.delete(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
      toast.success("Removed from queue");
    } catch {
      toast.error("Failed to remove post");
    } finally {
      setDeleting(null);
    }
  };

  const publishNow = async (post: QueuedPost) => {
    setPublishing(post.id);
    try {
      const result = await postsApi.retry(post.id);
      const results: any[] = result.publish_results ?? [];
      const successes = results.filter((r) => r.success);
      const failures = results.filter((r) => !r.success);
      if (successes.length > 0) {
        setPosts((prev) => prev.filter((p) => p.id !== post.id));
        toast.success(`Published to ${successes.map((r) => r.platform).join(", ")}!`);
      } else if (failures.length > 0) {
        toast.error(failures[0].error ?? "Publish failed");
      } else {
        toast.error("Publish failed — check your connected accounts");
      }
    } catch {
      toast.error("Publish failed — try again");
    } finally {
      setPublishing(null);
    }
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setPosts((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  };

  const moveDown = (index: number) => {
    setPosts((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  };

  const topScore = bestSlots.length ? Math.max(...bestSlots.map((s) => s.score)) : 100;

  return (
    <div className="flex flex-col flex-1">
      <Header
        title="Post Queue"
        subtitle={`${posts.length} post${posts.length === 1 ? "" : "s"} queued • auto-publishes at best times`}
      />
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">

        {/* Smart slots panel */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <h2 className="text-sm font-semibold text-white">Smart Time Slots</h2>
            <span className={cn(
              "text-[10px] px-2 py-0.5 rounded-full ml-1",
              bestSlots[0]?.source === "audience_data"
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                : "bg-slate-700 text-slate-400",
            )}>
              {bestSlots[0]?.source === "audience_data" ? "From your audience" : "Industry benchmarks"}
            </span>
            <span className="text-xs text-slate-500 ml-auto">Peak engagement windows</span>
          </div>
          {bestSlots.length === 0 ? (
            <div className="text-xs text-slate-500 text-center py-4">Loading slots…</div>
          ) : (
            <div className="grid grid-cols-5 gap-2">
              {bestSlots.map((slot, i) => (
                <div key={`${slot.day}-${slot.hour}`} className={cn(
                  "rounded-xl p-3 border text-center",
                  i === 0 ? "border-violet-500/40 bg-violet-500/10" : "border-slate-700 bg-slate-800/40",
                )}>
                  <p className={cn("text-xs font-bold", i === 0 ? "text-violet-300" : "text-slate-400")}>{slot.day}</p>
                  <p className={cn("text-sm font-bold mt-0.5", i === 0 ? "text-violet-200" : "text-white")}>{slot.time}</p>
                  <div className="mt-2 flex items-center justify-center gap-1">
                    <div className="flex-1 bg-slate-700 rounded-full h-1">
                      <div
                        className={cn("h-1 rounded-full", i === 0 ? "bg-violet-500" : "bg-slate-500")}
                        style={{ width: `${Math.round((slot.score / topScore) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-slate-500">{slot.score}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Queue list */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Queue ({posts.length})</h2>
            <Link href="/compose" className="btn-primary flex items-center gap-1.5 text-xs">
              <Plus className="w-3.5 h-3.5" /> Add post
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 text-slate-600">
              <Clock className="w-8 h-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Your queue is empty.</p>
              <p className="text-xs mt-1">Add posts from Compose and they&apos;ll publish automatically at the best times.</p>
              <Link href="/compose" className="btn-primary inline-flex items-center gap-1.5 text-sm mt-4">
                <Plus className="w-3.5 h-3.5" /> Add first post
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {posts.map((post, index) => (
                <div
                  key={post.id}
                  className="flex items-start gap-3 p-4 rounded-xl border border-slate-700 bg-slate-800/30 hover:border-slate-600 transition-colors group"
                >
                  {/* Position controls */}
                  <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                    <button
                      onClick={() => moveUp(index)}
                      className="text-slate-700 hover:text-slate-400 transition-colors opacity-0 group-hover:opacity-100 text-xs leading-none"
                    >▲</button>
                    <span className="text-xs text-slate-600 font-mono w-5 text-center">{index + 1}</span>
                    <button
                      onClick={() => moveDown(index)}
                      className="text-slate-700 hover:text-slate-400 transition-colors opacity-0 group-hover:opacity-100 text-xs leading-none"
                    >▼</button>
                  </div>

                  {/* Slot badge */}
                  <div className="flex flex-col items-center gap-1 shrink-0 bg-slate-900 rounded-lg px-2.5 py-2 border border-slate-700 min-w-[80px] text-center">
                    <CalendarClock className="w-3 h-3 text-violet-400" />
                    {post.queue_date_label ? (
                      <>
                        <p className="text-[10px] font-semibold text-white leading-tight">
                          {post.queue_date_label.split(" at ")[0]}
                        </p>
                        <p className="text-[9px] text-violet-300">
                          {post.queue_date_label.split(" at ")[1] ?? post.queue_slot}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs font-semibold text-white">{post.queue_slot ?? "—"}</p>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 line-clamp-2 leading-relaxed">{post.caption}</p>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <div className="flex gap-1">
                        {(post.platform_account_ids ?? []).map((p) => (
                          <span key={p} className="text-sm" title={p}>{PLATFORM_EMOJI[p] ?? "📱"}</span>
                        ))}
                      </div>
                      {post.hashtags?.length > 0 && (
                        <p className="text-xs text-blue-400 truncate max-w-[160px]">{post.hashtags.slice(0, 3).join(" ")}</p>
                      )}
                      <div className="ml-auto flex items-center gap-1">
                        <BarChart2 className="w-3 h-3 text-amber-400" />
                        <span className="text-[10px] text-slate-500">{post.predicted_engagement_score ?? 75} score</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => publishNow(post)}
                      disabled={publishing === post.id || deleting === post.id}
                      className="flex items-center gap-1 text-xs bg-violet-600/20 text-violet-300 border border-violet-500/30 hover:bg-violet-600/30 px-2.5 py-1.5 rounded-lg transition-all disabled:opacity-50"
                    >
                      {publishing === post.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                      Post now
                    </button>
                    <button
                      onClick={() => remove(post.id)}
                      disabled={deleting === post.id || publishing === post.id}
                      className="p-1.5 text-slate-600 hover:text-red-400 transition-colors disabled:opacity-50"
                    >
                      {deleting === post.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* How it works */}
        <div className="card border-dashed border-slate-700">
          <div className="flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-white mb-1">How the queue works</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Posts are automatically published at your audience&apos;s peak engagement windows — no need to pick exact times.
                Slots are chosen by day-of-week scoring from your audience data, with a 2-hour gap between posts.
                Reorder with the arrows, or hit &quot;Post now&quot; to skip the queue immediately.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
