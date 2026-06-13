"use client";
import { CheckCircle, XCircle, ExternalLink, Calendar, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface PlatformResult {
  platform: string;
  success: boolean;
  error?: string;
  postUrl?: string;
}

interface PublishResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: PlatformResult[];
}

const PLATFORM_META: Record<string, { emoji: string; label: string }> = {
  instagram: { emoji: "📸", label: "Instagram" },
  twitter:   { emoji: "🐦", label: "Twitter/X" },
  linkedin:  { emoji: "💼", label: "LinkedIn" },
  tiktok:    { emoji: "🎵", label: "TikTok" },
  facebook:  { emoji: "🔵", label: "Facebook" },
};

export default function PublishResultModal({ isOpen, onClose, results }: PublishResultModalProps) {
  if (!isOpen) return null;

  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  const allGood = failed === 0;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            {allGood
              ? <CheckCircle className="w-4 h-4 text-emerald-400" />
              : <XCircle className="w-4 h-4 text-amber-400" />}
            <span className="text-sm font-semibold text-white">
              {allGood ? "Published successfully!" : `${succeeded} published, ${failed} failed`}
            </span>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Summary banner */}
        <div className={cn(
          "mx-5 mt-4 px-4 py-3 rounded-xl text-sm",
          allGood
            ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
            : "bg-amber-500/10 border border-amber-500/20 text-amber-300",
        )}>
          {allGood
            ? `Your post is live on ${succeeded} platform${succeeded > 1 ? "s" : ""}. Analytics will update within a few minutes.`
            : `${failed} platform${failed > 1 ? "s" : ""} failed to publish — you can retry from the Calendar page.`}
        </div>

        {/* Per-platform results */}
        <div className="p-5 space-y-2">
          {results.map((r) => {
            const meta = PLATFORM_META[r.platform] ?? { emoji: "📱", label: r.platform };
            return (
              <div
                key={r.platform}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border",
                  r.success
                    ? "border-emerald-500/20 bg-emerald-500/5"
                    : "border-red-500/20 bg-red-500/5",
                )}
              >
                <span className="text-lg leading-none">{meta.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{meta.label}</p>
                  {!r.success && r.error && (
                    <p className="text-xs text-red-400 mt-0.5">{r.error}</p>
                  )}
                </div>
                {r.success ? (
                  r.postUrl ? (
                    <a
                      href={r.postUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors shrink-0"
                    >
                      View <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  )
                ) : (
                  <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-800">
          <Link
            href="/calendar"
            onClick={onClose}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Calendar className="w-4 h-4" /> View in Calendar
          </Link>
          <button onClick={onClose} className="btn-primary text-sm">
            Done
          </button>
        </div>
      </div>
    </>
  );
}
