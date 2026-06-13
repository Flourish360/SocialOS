"use client";
import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import { postsApi } from "@/lib/api";
import { ChevronLeft, ChevronRight, Plus, Clock, AlertTriangle, X, Trash2, Edit3, Calendar, TrendingUp } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, parseISO, isToday, startOfWeek, endOfWeek, addWeeks, subWeeks, getHours, getMinutes } from "date-fns";
import PostAnalyticsModal from "@/components/PostAnalyticsModal";
import { cn } from "@/lib/utils";
import Link from "next/link";
import toast from "react-hot-toast";

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-violet-500",
  published: "bg-emerald-500",
  draft: "bg-slate-600",
  failed: "bg-red-500",
};

const STATUS_BADGE: Record<string, string> = {
  scheduled: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  published: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  draft: "bg-slate-700 text-slate-400 border-slate-600",
  failed: "bg-red-500/15 text-red-400 border-red-500/30",
};

const PLATFORM_EMOJI: Record<string, string> = {
  instagram: "📸", twitter: "🐦", linkedin: "💼", tiktok: "🎵", facebook: "🔵",
};

const HOURS = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

function WeekView({ currentWeek, posts, onSelectPost }: { currentWeek: Date; posts: any[]; onSelectPost: (p: any) => void }) {
  const weekStart = startOfWeek(currentWeek);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  return (
    <div className="card p-0 overflow-hidden overflow-x-auto">
      <div className="grid border-b border-slate-800" style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}>
        <div className="border-r border-slate-800" />
        {weekDays.map((d) => (
          <div key={d.toISOString()} className={cn("text-center py-2.5 border-r border-slate-800 last:border-r-0", isToday(d) && "bg-violet-500/5")}>
            <p className="text-[10px] text-slate-500 uppercase">{format(d, "EEE")}</p>
            <p className={cn("text-sm font-semibold mt-0.5", isToday(d) ? "text-violet-400" : "text-white")}>{format(d, "d")}</p>
          </div>
        ))}
      </div>
      <div className="max-h-[520px] overflow-y-auto">
        {HOURS.map((hour) => (
          <div key={hour} className="grid border-b border-slate-800/50" style={{ gridTemplateColumns: "56px repeat(7, 1fr)", minHeight: "52px" }}>
            <div className="border-r border-slate-800 px-2 py-1 flex items-start">
              <span className="text-[10px] text-slate-600">{hour % 12 || 12}{hour < 12 ? "am" : "pm"}</span>
            </div>
            {weekDays.map((d) => {
              const slotPosts = posts.filter((p) => {
                const dt = p.scheduled_at || p.published_at;
                if (!dt) return false;
                const parsed = parseISO(dt);
                return isSameDay(parsed, d) && getHours(parsed) === hour;
              });
              return (
                <div key={d.toISOString()} className={cn("border-r border-slate-800/50 last:border-r-0 p-0.5", isToday(d) && "bg-violet-500/5")}>
                  {slotPosts.map((post) => (
                    <button
                      key={post.id}
                      onClick={() => onSelectPost(post)}
                      className={cn(
                        "w-full text-left text-[10px] px-1.5 py-1 rounded mb-0.5 truncate leading-tight border",
                        post.status === "scheduled" ? "bg-violet-500/20 text-violet-300 border-violet-500/30" :
                        post.status === "published" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" :
                        "bg-slate-700 text-slate-300 border-slate-600",
                      )}
                    >
                      {format(parseISO(post.scheduled_at || post.published_at), "h:mma")} · {post.caption?.slice(0, 20)}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [posts, setPosts] = useState<any[]>([]);
  const [view, setView] = useState<"month" | "week">("month");
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [analyticsPostId, setAnalyticsPostId] = useState<string | null>(null);

  useEffect(() => { postsApi.list().then(setPosts); }, []);

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const firstDayOfWeek = startOfMonth(currentMonth).getDay();

  const getPostsForDay = (day: Date) =>
    posts.filter((p) => {
      const d = p.scheduled_at || p.published_at;
      return d && isSameDay(parseISO(d), day);
    });

  const scheduled = posts.filter((p) => p.status === "scheduled").length;
  const published = posts.filter((p) => p.status === "published").length;

  const deletePost = async () => {
    if (!selectedPost) return;
    setDeleting(true);
    try {
      await postsApi.delete(selectedPost.id);
      setPosts((prev) => prev.filter((p) => p.id !== selectedPost.id));
      setSelectedPost(null);
      toast.success("Post deleted");
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <Header title="Calendar" subtitle={`${scheduled} scheduled • ${published} published this month`} />
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-6 overflow-y-auto">

          {/* Nav */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <button onClick={() => view === "month" ? setCurrentMonth(subMonths(currentMonth, 1)) : setCurrentWeek(subWeeks(currentWeek, 1))} className="btn-ghost p-2">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h2 className="text-lg font-semibold text-white">
                {view === "month"
                  ? format(currentMonth, "MMMM yyyy")
                  : `${format(startOfWeek(currentWeek), "MMM d")} – ${format(endOfWeek(currentWeek), "MMM d, yyyy")}`}
              </h2>
              <button onClick={() => view === "month" ? setCurrentMonth(addMonths(currentMonth, 1)) : setCurrentWeek(addWeeks(currentWeek, 1))} className="btn-ghost p-2">
                <ChevronRight className="w-4 h-4" />
              </button>
              <button onClick={() => { setCurrentMonth(new Date()); setCurrentWeek(new Date()); }} className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded-lg hover:bg-slate-800 transition-all">
                Today
              </button>
            </div>
            <div className="flex items-center gap-2">
              {(["month", "week"] as const).map((v) => (
                <button key={v} onClick={() => setView(v)} className={cn("text-xs capitalize px-3 py-1.5 rounded-lg transition-all",
                  view === v ? "bg-violet-600/20 text-violet-300 border border-violet-500/30" : "text-slate-400 hover:text-slate-200")}>
                  {v}
                </button>
              ))}
              <Link href="/compose" className="btn-primary flex items-center gap-1.5 text-xs">
                <Plus className="w-3.5 h-3.5" /> Schedule post
              </Link>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mb-4">
            {Object.entries(STATUS_COLORS).map(([status, color]) => (
              <div key={status} className="flex items-center gap-1.5 text-xs text-slate-400 capitalize">
                <div className={cn("w-2 h-2 rounded-full", color)} />{status}
              </div>
            ))}
          </div>

          {/* Week view */}
          {view === "week" && (
            <WeekView currentWeek={currentWeek} posts={posts} onSelectPost={setSelectedPost} />
          )}

          {/* Month Grid */}
          {view === "month" && <div className="card p-0 overflow-hidden">
            <div className="grid grid-cols-7 border-b border-slate-800">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="text-center text-xs font-medium text-slate-500 py-3">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {Array.from({ length: firstDayOfWeek }, (_, i) => (
                <div key={`empty-${i}`} className="border-b border-r border-slate-800 min-h-[100px] bg-slate-950/50" />
              ))}
              {days.map((day, i) => {
                const dayPosts = getPostsForDay(day);
                const today = isToday(day);
                const isLast = (firstDayOfWeek + i + 1) % 7 === 0;
                return (
                  <div key={day.toISOString()} className={cn(
                    "border-b border-slate-800 min-h-[100px] p-2 transition-colors hover:bg-slate-800/30",
                    !isLast && "border-r", today && "bg-violet-500/5",
                  )}>
                    <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mb-1",
                      today ? "bg-violet-600 text-white" : "text-slate-400")}>
                      {format(day, "d")}
                    </div>
                    <div className="space-y-1">
                      {dayPosts.slice(0, 3).map((post) => (
                        <button
                          key={post.id}
                          onClick={() => setSelectedPost(post)}
                          className="w-full flex items-center gap-1 group text-left"
                        >
                          <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", STATUS_COLORS[post.status] ?? "bg-slate-600")} />
                          <p className="text-[10px] text-slate-300 truncate group-hover:text-violet-300 transition-colors leading-tight">
                            {post.caption?.slice(0, 28)}…
                          </p>
                        </button>
                      ))}
                      {dayPosts.length > 3 && <p className="text-[10px] text-slate-500">+{dayPosts.length - 3} more</p>}
                      {dayPosts.length === 0 && today && (
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
                          <p className="text-[10px] text-amber-400">No posts</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>}

          {/* Upcoming */}
          <div className="mt-5 card">
            <h3 className="text-sm font-semibold text-white mb-3">Upcoming Scheduled</h3>
            <div className="space-y-2">
              {posts.filter((p) => p.status === "scheduled").slice(0, 5).map((post) => (
                <button key={post.id} onClick={() => setSelectedPost(post)}
                  className="w-full flex items-center gap-3 p-2.5 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors text-left">
                  <div className="w-2 h-2 rounded-full bg-violet-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 truncate">{post.caption}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
                    <Clock className="w-3 h-3" />
                    {post.scheduled_at ? format(parseISO(post.scheduled_at), "MMM d, h:mm a") : "—"}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Post detail panel */}
        {selectedPost && (
          <>
            <div className="fixed inset-0 z-40 md:hidden" onClick={() => setSelectedPost(null)} />
            <div className="w-80 border-l border-slate-800 flex flex-col shrink-0 bg-slate-900 animate-slide-in-right">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                <span className="text-sm font-semibold text-white">Post detail</span>
                <button onClick={() => setSelectedPost(null)} className="text-slate-500 hover:text-slate-300 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                {/* Status */}
                <div className="flex items-center gap-2">
                  <span className={cn("text-xs px-2.5 py-1 rounded-full border capitalize font-medium", STATUS_BADGE[selectedPost.status])}>
                    {selectedPost.status}
                  </span>
                  {selectedPost.platform_account_ids?.map((p: string) => (
                    <span key={p} className="text-sm">{PLATFORM_EMOJI[p] ?? "📱"}</span>
                  ))}
                </div>

                {/* Caption */}
                <div>
                  <p className="text-xs text-slate-400 mb-1.5">Caption</p>
                  <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 leading-relaxed">
                    {selectedPost.caption}
                    {selectedPost.hashtags?.length > 0 && (
                      <p className="mt-2 text-blue-400 text-xs">{selectedPost.hashtags.join(" ")}</p>
                    )}
                  </div>
                </div>

                {/* Scheduled time */}
                {selectedPost.scheduled_at && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1.5">Scheduled for</p>
                    <div className="flex items-center gap-2 text-sm text-slate-200">
                      <Calendar className="w-4 h-4 text-violet-400" />
                      {format(parseISO(selectedPost.scheduled_at), "EEEE, MMM d 'at' h:mm a")}
                    </div>
                  </div>
                )}

                {/* Engagement score */}
                {selectedPost.predicted_engagement_score && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1.5">Predicted engagement</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-slate-800 rounded-full h-2">
                        <div className="h-2 rounded-full bg-violet-500" style={{ width: `${selectedPost.predicted_engagement_score}%` }} />
                      </div>
                      <span className="text-sm font-semibold text-violet-400">{selectedPost.predicted_engagement_score}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="p-4 border-t border-slate-800 space-y-2">
                {selectedPost.status === "published" && (
                  <button
                    onClick={() => setAnalyticsPostId(selectedPost.id)}
                    className="btn-secondary w-full flex items-center justify-center gap-1.5 text-sm"
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-violet-400" /> View Analytics
                  </button>
                )}
                <Link
                  href="/compose"
                  className="btn-secondary w-full flex items-center justify-center gap-1.5 text-sm"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit in Compose
                </Link>
                <button
                  onClick={deletePost}
                  disabled={deleting}
                  className="w-full flex items-center justify-center gap-1.5 text-sm px-3 py-2 rounded-lg text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {deleting ? "Deleting…" : "Delete post"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {analyticsPostId && (
        <PostAnalyticsModal
          postId={analyticsPostId}
          caption={selectedPost?.caption}
          onClose={() => setAnalyticsPostId(null)}
        />
      )}
    </div>
  );
}
