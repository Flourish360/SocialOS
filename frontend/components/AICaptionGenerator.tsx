"use client";
import { useState } from "react";
import { Sparkles, X, Loader2, Copy, Check, ChevronRight } from "lucide-react";
import { aiApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const TONES = [
  { value: "casual", label: "Casual", emoji: "😎" },
  { value: "professional", label: "Professional", emoji: "💼" },
  { value: "funny", label: "Funny", emoji: "😂" },
  { value: "inspirational", label: "Inspirational", emoji: "✨" },
  { value: "educational", label: "Educational", emoji: "🎓" },
];

const PLATFORMS = [
  { value: "instagram", emoji: "📸" },
  { value: "twitter", emoji: "🐦" },
  { value: "linkedin", emoji: "💼" },
  { value: "tiktok", emoji: "🎵" },
  { value: "facebook", emoji: "🔵" },
];

interface AICaptionGeneratorProps {
  onUse: (caption: string) => void;
  onClose: () => void;
}

export default function AICaptionGenerator({ onUse, onClose }: AICaptionGeneratorProps) {
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("casual");
  const [platform, setPlatform] = useState("instagram");
  const [generating, setGenerating] = useState(false);
  const [captions, setCaptions] = useState<string[]>([]);
  const [copied, setCopied] = useState<number | null>(null);

  const generate = async () => {
    if (!topic.trim()) { toast.error("Enter a topic first"); return; }
    setGenerating(true);
    setCaptions([]);
    try {
      const data = await aiApi.captions({ topic, tone, platform });
      setCaptions(data.captions);
    } catch {
      toast.error("Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const copy = async (text: string, idx: number) => {
    await navigator.clipboard.writeText(text);
    setCopied(idx);
    setTimeout(() => setCopied(null), 1500);
    toast.success("Copied!");
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 animate-slide-up flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-violet-600/20 rounded-lg">
              <Sparkles className="w-4 h-4 text-violet-400" />
            </div>
            <span className="text-sm font-semibold text-white">AI Caption Generator</span>
            <span className="text-xs bg-violet-500/20 text-violet-400 border border-violet-500/30 rounded-full px-2 py-0.5">3 variants</span>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {/* Controls */}
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">What's your post about?</label>
              <input
                className="input w-full"
                placeholder="e.g. our new product launch, Monday motivation, behind-the-scenes…"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && generate()}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-2">Tone</label>
                <div className="flex flex-wrap gap-1.5">
                  {TONES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setTone(t.value)}
                      className={cn(
                        "flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-all",
                        tone === t.value
                          ? "border-violet-500/60 bg-violet-500/10 text-violet-300"
                          : "border-slate-700 text-slate-400 hover:border-slate-600",
                      )}
                    >
                      <span>{t.emoji}</span> {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-2">Platform</label>
                <div className="flex flex-wrap gap-1.5">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setPlatform(p.value)}
                      className={cn(
                        "w-9 h-9 rounded-lg border text-base transition-all capitalize",
                        platform === p.value
                          ? "border-violet-500/60 bg-violet-500/10"
                          : "border-slate-700 bg-slate-800/50 hover:border-slate-600",
                      )}
                    >
                      {p.emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={generate}
              disabled={generating || !topic.trim()}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {generating ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Generating 3 captions…</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Generate captions</>
              )}
            </button>
          </div>

          {/* Results */}
          {captions.length > 0 && (
            <div className="px-5 pb-5 space-y-3">
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <span className="text-violet-400">✦</span> Pick a caption to use in your post
              </p>
              {captions.map((caption, idx) => (
                <div key={idx} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 group hover:border-violet-500/30 transition-all">
                  <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line mb-3">{caption}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600">{caption.length} chars</span>
                    <div className="flex gap-2 ml-auto">
                      <button
                        onClick={() => copy(caption, idx)}
                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors px-2 py-1 rounded-lg hover:bg-slate-700"
                      >
                        {copied === idx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copied === idx ? "Copied" : "Copy"}
                      </button>
                      <button
                        onClick={() => { onUse(caption); onClose(); }}
                        className="flex items-center gap-1 text-xs bg-violet-600 hover:bg-violet-500 text-white px-3 py-1 rounded-lg transition-colors"
                      >
                        Use this <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
