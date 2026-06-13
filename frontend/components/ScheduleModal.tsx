"use client";
import { useState } from "react";
import { X, Calendar, Clock, Send, Loader2 } from "lucide-react";
import { postsApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  caption: string;
  hashtags: string[];
  platforms: string[];
  onScheduled: () => void;
}

const PLATFORM_EMOJI: Record<string, string> = {
  instagram: "📸", twitter: "🐦", linkedin: "💼", tiktok: "🎵", facebook: "🔵",
};

function pad(n: number) { return String(n).padStart(2, "0"); }

function defaultDateTime() {
  const d = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

export default function ScheduleModal({ isOpen, onClose, caption, hashtags, platforms, onScheduled }: Props) {
  const def = defaultDateTime();
  const [date, setDate] = useState(def.date);
  const [time, setTime] = useState(def.time);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const scheduledAt = new Date(`${date}T${time}`);
  const isValid = caption.trim().length > 0 && scheduledAt > new Date();

  const handleSchedule = async () => {
    if (!isValid) { toast.error("Write a caption and pick a future time"); return; }
    setLoading(true);
    try {
      await postsApi.create({
        caption,
        hashtags,
        platform_account_ids: platforms,
        media_type: "none",
        status: "scheduled",
        scheduled_at: scheduledAt.toISOString(),
      });
      toast.success("Post scheduled!");
      onScheduled();
      onClose();
    } catch {
      toast.error("Failed to schedule post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-semibold text-white">Schedule Post</span>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Caption preview */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Caption preview</label>
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-slate-300 leading-relaxed max-h-24 overflow-y-auto">
              {caption || <span className="text-slate-500">No caption yet</span>}
              {hashtags.length > 0 && (
                <span className="text-blue-400 ml-1">{hashtags.join(" ")}</span>
              )}
            </div>
          </div>

          {/* Date + time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3 h-3" /> Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="input w-full text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3 h-3" /> Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="input w-full text-sm"
              />
            </div>
          </div>

          {/* Platforms */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Publishing to</label>
            <div className="flex flex-wrap gap-2">
              {platforms.length > 0 ? platforms.map((p) => (
                <span key={p} className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-full px-2.5 py-1 text-xs text-slate-300">
                  <span>{PLATFORM_EMOJI[p] ?? "📱"}</span>
                  <span className="capitalize">{p}</span>
                </span>
              )) : <span className="text-xs text-slate-500">No platforms selected</span>}
            </div>
          </div>

          {/* Scheduled time summary */}
          {isValid && (
            <div className="bg-violet-600/10 border border-violet-500/20 rounded-xl p-3 text-xs text-violet-300">
              Publishes{" "}
              <span className="font-semibold">
                {scheduledAt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </span>{" "}
              at{" "}
              <span className="font-semibold">
                {scheduledAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-800">
          <button onClick={onClose} className="btn-ghost text-sm">Cancel</button>
          <button
            onClick={handleSchedule}
            disabled={loading || !isValid}
            className={cn("btn-primary flex items-center gap-1.5 text-sm", (!isValid || loading) && "opacity-50 cursor-not-allowed")}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Schedule Post
          </button>
        </div>
      </div>
    </>
  );
}
