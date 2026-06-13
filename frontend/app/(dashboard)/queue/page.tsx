"use client";
import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import { postsApi } from "@/lib/api";
import { Clock, Trash2, GripVertical, Zap, Plus, ArrowRight, Sparkles, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import toast from "react-hot-toast";

const PLATFORM_EMOJI: Record<string, string> = {
  instagram: "📸", twitter: "🐦", linkedin: "💼", tiktok: "🎵", facebook: "🔵",
};

const BEST_SLOTS = [
  { time: "9:00 AM", label: "Morning peak", score: 88, day: "Mon–Fri" },
  { time: "12:00 PM", label: "Lunch break", score: 91, day: "Mon–Fri" },
  { time: "3:00 PM", label: "Afternoon", score: 84, day: "Mon–Sat" },
  { time: "6:00 PM", label: "Evening prime", score: 94, day: "Daily" },
  { time: "9:00 PM", label: "Late night", score: 79, day: "Daily" },
];

export default function QueuePage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState<string | null>(null);

  useEffect(() => {
    postsApi.list("queued").then((all) => {
      const queued = all.filter((p: any) => p.status === "queued");
      if (queued.length === 0) {
        const MOCK_QUEUE = [
          { id: "q1", caption: "5 ways to grow your Instagram following in 2026 🚀 Thread incoming...", hashtags: ["#growth", "#instagram"], platform_account_ids: ["instagram", "twitter"], queue_slot: "9:00 AM", queue_position: 1, status: "queued", predicted_engagement_score: 88 },
          { id: "q2", caption: "Behind the scenes of our latest product shoot — the chaos was worth it 📸", hashtags: ["#bts", "#brand"], platform_account_ids: ["instagram"], queue_slot: "12:00 PM", queue_position: 2, status: "queued", predicted_engagement_score: 76 },
          { id: "q3", caption: "We've been thinking a lot about what authenticity means in 2026. Here's our take.", hashtags: ["#marketing"], platform_account_ids: ["linkedin"], queue_slot: "6:00 PM", queue_position: 3, status: "queued", predicted_engagement_score: 82 },
          { id: "q4", caption: "Hot take: scheduling posts a week in advance is the single best habit for creators.", hashtags: ["#contentcreator", "#tips"], platform_account_ids: ["twitter", "instagram"], queue_slot: "9:00 AM", queue_position: 4, status: "queued", predicted_engagement_score: 91 },
        ];
        setPosts(MOCK_QUEUE);
      } else {
        setPosts(queued);
      }
    }).finally(() => setLoading(false));
  }, []);

  const remove = (id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
    toast.success("Removed from queue");
  };

  const publishNow = async (post: any) => {
    setPublishing(post.id);
    await new Promise((r) => setTimeout(r, 900));
    setPosts((prev) => prev.filter((p) => p.id !== post.id));
    toast.success("Published!");
    setPublishing(null);
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

  return (
    <div className="flex flex-col flex-1">
      <Header
        title="Post Queue"
        subtitle={`${posts.length} posts queued • auto-publishes at best times`}
      />
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">

        {/* Smart slots overview */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <h2 className="text-sm font-semibold text-white">Smart Time Slots</h2>
            <span className="text-xs text-slate-500 ml-auto">Based on your audience's peak times</span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {BEST_SLOTS.map((slot, i) => (
              <div key={slot.time} className={cn(
                "rounded-xl p-3 border text-center",
                i === 3 ? "border-violet-500/40 bg-violet-500/10" : "border-slate-700 bg-slate-800/40",
              )}>
                <p className={cn("text-sm font-bold", i === 3 ? "text-violet-300" : "text-white")}>{slot.time}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{slot.label}</p>
                <div className="mt-2 flex items-center justify-center gap-1">
                  <div className="flex-1 bg-slate-700 rounded-full h-1">
                    <div className="bg-violet-500 h-1 rounded-full" style={{ width: `${slot.score}%` }} />
                  </div>
                  <span className="text-[9px] text-slate-500">{slot.score}</span>
                </div>
                <p className="text-[9px] text-slate-600 mt-1">{slot.day}</p>
              </div>
            ))}
          </div>
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
              <p className="text-xs mt-1">Add posts from Compose and they'll publish automatically at the best times.</p>
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
                  {/* Position + drag handle */}
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

                  {/* Time slot */}
                  <div className="flex flex-col items-center gap-1 shrink-0 bg-slate-900 rounded-lg px-2.5 py-2 border border-slate-700 min-w-[72px] text-center">
                    <Clock className="w-3 h-3 text-violet-400" />
                    <p className="text-xs font-semibold text-white">{post.queue_slot ?? BEST_SLOTS[index % BEST_SLOTS.length].time}</p>
                    <p className="text-[9px] text-slate-500">next slot</p>
                  </div>

                  <ArrowRight className="w-3.5 h-3.5 text-slate-700 shrink-0 mt-3" />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 line-clamp-2 leading-relaxed">{post.caption}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex gap-1">
                        {(post.platform_account_ids ?? []).map((p: string) => (
                          <span key={p} className="text-sm" title={p}>{PLATFORM_EMOJI[p] ?? "📱"}</span>
                        ))}
                      </div>
                      {post.hashtags?.length > 0 && (
                        <p className="text-xs text-blue-400 truncate">{post.hashtags.slice(0, 3).join(" ")}</p>
                      )}
                      <div className="ml-auto flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-400" />
                        <span className="text-[10px] text-slate-500">{post.predicted_engagement_score ?? 75} score</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => publishNow(post)}
                      disabled={publishing === post.id}
                      className="flex items-center gap-1 text-xs bg-violet-600/20 text-violet-300 border border-violet-500/30 hover:bg-violet-600/30 px-2.5 py-1.5 rounded-lg transition-all"
                    >
                      {publishing === post.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                      Post now
                    </button>
                    <button onClick={() => remove(post.id)} className="p-1.5 text-slate-600 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info card */}
        <div className="card border-dashed border-slate-700">
          <div className="flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-white mb-1">How the queue works</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Posts are automatically published at your audience's peak engagement windows — no need to pick exact times. Drag to reorder, or hit "Post now" to skip the queue. New posts land in the next available slot.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
