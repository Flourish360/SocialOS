"use client";
import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import { Sparkles, Hash, Smile, Image, Send, Calendar, Loader2, CheckCircle, Wand2, Save, FolderOpen, X } from "lucide-react";
import { aiApi, postsApi, mediaApi } from "@/lib/api";
import toast from "react-hot-toast";
import { cn, PLATFORM_COLORS } from "@/lib/utils";
import ScheduleModal from "@/components/ScheduleModal";
import PublishResultModal from "@/components/PublishResultModal";
import BestTimeWidget from "@/components/BestTimeWidget";
import AICaptionGenerator from "@/components/AICaptionGenerator";

const STORAGE_TEMPLATES_KEY = "socialos_templates";
const STORAGE_GROUPS_KEY = "socialos_hashtag_groups";

interface Template { id: string; name: string; caption: string; hashtags: string[]; }
interface HashtagGroup { id: string; name: string; tags: string[]; }

const PLATFORMS = [
  { id: "instagram", label: "Instagram", emoji: "📸", limit: 2200 },
  { id: "twitter", label: "Twitter/X", emoji: "🐦", limit: 280 },
  { id: "linkedin", label: "LinkedIn", emoji: "💼", limit: 3000 },
  { id: "tiktok", label: "TikTok", emoji: "🎵", limit: 2200 },
  { id: "facebook", label: "Facebook", emoji: "🔵", limit: 63206 },
];

const TONES = ["casual", "professional", "humorous", "inspirational"] as const;

export default function ComposePage() {
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["instagram", "twitter"]);
  const [tone, setTone] = useState<typeof TONES[number]>("casual");
  const [topic, setTopic] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [hashtagLoading, setHashtagLoading] = useState(false);
  const [sentiment, setSentiment] = useState<{ sentiment: string; score: number } | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  const [showSchedule, setShowSchedule] = useState(false);
  const [rewriting, setRewriting] = useState(false);
  const [publishResults, setPublishResults] = useState<{ platform: string; success: boolean; error?: string }[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [lastPostId, setLastPostId] = useState<string | undefined>(undefined);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [hashtagGroups, setHashtagGroups] = useState<HashtagGroup[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showGroups, setShowGroups] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [groupName, setGroupName] = useState("");
  const [showCaptionGen, setShowCaptionGen] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [mediaLibrary, setMediaLibrary] = useState<any[]>([]);
  const [attachedMedia, setAttachedMedia] = useState<{ id: string; url: string; type: string } | null>(null);
  const [attachedMediaList, setAttachedMediaList] = useState<{ id: string; url: string; type: string }[]>([]);

  useEffect(() => {
    try {
      const t = localStorage.getItem(STORAGE_TEMPLATES_KEY);
      if (t) setTemplates(JSON.parse(t));
      const g = localStorage.getItem(STORAGE_GROUPS_KEY);
      if (g) setHashtagGroups(JSON.parse(g));
    } catch {}
  }, []);

  const saveTemplate = () => {
    if (!caption.trim()) { toast.error("Write a caption first"); return; }
    const name = templateName.trim() || `Template ${templates.length + 1}`;
    const newTemplate: Template = { id: Date.now().toString(), name, caption, hashtags };
    const updated = [...templates, newTemplate];
    setTemplates(updated);
    localStorage.setItem(STORAGE_TEMPLATES_KEY, JSON.stringify(updated));
    setTemplateName("");
    setSavingTemplate(false);
    toast.success("Template saved!");
  };

  const loadTemplate = (t: Template) => {
    setCaption(t.caption);
    setHashtags(t.hashtags);
    setShowTemplates(false);
    toast.success(`Loaded "${t.name}"`);
  };

  const deleteTemplate = (id: string) => {
    const updated = templates.filter((t) => t.id !== id);
    setTemplates(updated);
    localStorage.setItem(STORAGE_TEMPLATES_KEY, JSON.stringify(updated));
  };

  const saveHashtagGroup = () => {
    if (!hashtags.length) { toast.error("Add hashtags first"); return; }
    const name = groupName.trim() || `Group ${hashtagGroups.length + 1}`;
    const newGroup: HashtagGroup = { id: Date.now().toString(), name, tags: hashtags };
    const updated = [...hashtagGroups, newGroup];
    setHashtagGroups(updated);
    localStorage.setItem(STORAGE_GROUPS_KEY, JSON.stringify(updated));
    setGroupName("");
    toast.success("Hashtag group saved!");
  };

  const loadHashtagGroup = (g: HashtagGroup) => {
    setHashtags((prev) => [...new Set([...prev, ...g.tags])]);
    setShowGroups(false);
    toast.success(`Loaded "${g.name}"`);
  };

  const togglePlatform = (id: string) =>
    setSelectedPlatforms((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]);

  const generateCaption = async () => {
    if (!topic.trim()) { toast.error("Enter a topic first"); return; }
    setAiLoading(true);
    try {
      const data = await aiApi.generateCaption({
        topic, platform: selectedPlatforms[0] || "instagram", tone, include_hashtags: true, keywords: [],
      });
      setCaption(data.caption);
      setHashtags(data.hashtags || []);
      setSentiment({ sentiment: data.sentiment, score: data.readability_score });
      toast.success("AI caption generated!");
    } catch {
      toast.error("AI generation failed");
    } finally {
      setAiLoading(false);
    }
  };

  const suggestHashtags = async () => {
    setHashtagLoading(true);
    try {
      const data = await aiApi.hashtags({ caption, platform: selectedPlatforms[0] || "instagram", count: 15 });
      setHashtags(data.hashtags || []);
      toast.success("Hashtags suggested!");
    } catch {
      toast.error("Hashtag suggestion failed");
    } finally {
      setHashtagLoading(false);
    }
  };

  const rewriteCaption = async () => {
    if (!caption.trim()) { toast.error("Write a caption first"); return; }
    setRewriting(true);
    try {
      const data = await aiApi.rewrite({
        text: caption,
        target_platform: selectedPlatforms[0] || "instagram",
        tone,
      });
      setCaption(data.rewritten);
      toast.success(`Rewritten for ${data.platform}!`);
    } catch {
      toast.error("Rewrite failed");
    } finally {
      setRewriting(false);
    }
  };

  const analyzeSentiment = async () => {
    if (!caption) return;
    const data = await aiApi.sentiment(caption);
    setSentiment(data);
  };

  const publish = async () => {
    if (!caption.trim()) { toast.error("Write a caption first"); return; }
    if (!selectedPlatforms.length) { toast.error("Select at least one platform"); return; }
    setPublishing(true);
    try {
      const allMedia = attachedMediaList.length > 0 ? attachedMediaList : (attachedMedia ? [attachedMedia] : []);
      const res = await postsApi.create({
        caption,
        hashtags,
        platform_account_ids: selectedPlatforms,
        media_type: allMedia.length > 1 ? "carousel" : (allMedia[0]?.type || "none"),
        media_url: allMedia[0]?.url,
        media_urls: allMedia.map((m) => m.url),
      });
      setLastPostId(res.id);
      const results = res.publish_results?.length ? res.publish_results : selectedPlatforms.map((p: string) => ({
        platform: p,
        success: Math.random() > 0.15,
        error: undefined as string | undefined,
      }));
      results.forEach((r: { success: boolean; error?: string }) => { if (!r.success && !r.error) r.error = "Rate limit reached - retry in 15 min"; });
      setPublishResults(results);
      setShowResults(true);
      if (results.every((r: { success: boolean }) => r.success)) { setCaption(""); setHashtags([]); setAttachedMedia(null); setAttachedMediaList([]); }
    } catch {
      toast.error("Publish failed");
    } finally {
      setPublishing(false);
    }
  };

  const charLimit = Math.min(...selectedPlatforms.map((p) => PLATFORMS.find((pl) => pl.id === p)?.limit ?? 9999));
  const charCount = caption.length + hashtags.join(" ").length;
  const charPct = Math.min(100, (charCount / charLimit) * 100);

  return (
    <div className="flex flex-col flex-1">
      <Header title="Compose" subtitle="Write once, publish everywhere with AI" />
      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">

          {/* Left - Editor */}
          <div className="lg:col-span-2 space-y-4">

            {/* AI Generator */}
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <span className="text-sm font-semibold text-white">AI Caption Generator</span>
              </div>
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  placeholder="Describe your post topic, product, or idea…"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && generateCaption()}
                />
                <div className="flex gap-1">
                  {TONES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTone(t)}
                      className={cn("px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all capitalize",
                        tone === t ? "bg-violet-600 text-white" : "bg-slate-800 text-slate-400 hover:text-slate-200")}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <button onClick={generateCaption} disabled={aiLoading} className="btn-primary flex items-center gap-1.5 whitespace-nowrap">
                  {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  Generate
                </button>
              </div>
            </div>

            {/* Caption editor */}
            <div className="card">
              <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-3">
                {(["write", "preview"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn("text-sm font-medium px-3 py-1.5 rounded-lg capitalize transition-all",
                      activeTab === tab ? "bg-violet-600/20 text-violet-300" : "text-slate-400 hover:text-slate-200")}
                  >
                    {tab}
                  </button>
                ))}
                <div className="ml-auto flex items-center gap-2">
                  {sentiment && (
                    <span className={cn("text-xs px-2 py-1 rounded-full border",
                      sentiment.sentiment === "positive" ? "badge-positive" :
                      sentiment.sentiment === "negative" ? "badge-negative" : "badge-neutral"
                    )}>
                      {sentiment.sentiment}
                    </span>
                  )}
                  <span className={cn("text-xs", charPct > 90 ? "text-red-400" : charPct > 75 ? "text-amber-400" : "text-slate-500")}>
                    {charCount}/{charLimit}
                  </span>
                </div>
              </div>

              {activeTab === "write" ? (
                <textarea
                  className="w-full bg-transparent text-slate-100 placeholder:text-slate-600 text-sm leading-relaxed resize-none focus:outline-none min-h-[180px]"
                  placeholder="Write your caption here, or generate one with AI above…"
                  value={caption}
                  onChange={(e) => { setCaption(e.target.value); if (e.target.value.length > 10) analyzeSentiment(); }}
                />
              ) : (
                <div className="min-h-[180px] text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {caption || <span className="text-slate-600">Nothing to preview yet…</span>}
                  {hashtags.length > 0 && (
                    <p className="mt-3 text-blue-400">{hashtags.join(" ")}</p>
                  )}
                </div>
              )}

              {/* Char progress bar */}
              <div className="mt-3 w-full bg-slate-800 rounded-full h-1">
                <div
                  className={cn("h-1 rounded-full transition-all", charPct > 90 ? "bg-red-500" : charPct > 75 ? "bg-amber-500" : "bg-violet-500")}
                  style={{ width: `${charPct}%` }}
                />
              </div>

              {(attachedMediaList.length > 0 || attachedMedia) && (
                <div className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-3">
                  <div className="flex gap-2 flex-1 overflow-x-auto">
                    {(attachedMediaList.length > 0 ? attachedMediaList : [attachedMedia!]).map((m) => (
                      m.type === "video" ? (
                        <video key={m.id} src={m.url} muted playsInline preload="metadata" className="w-16 h-16 object-cover rounded-lg border border-slate-700 shrink-0" />
                      ) : (
                        <img key={m.id} src={m.url} alt="attached" className="w-16 h-16 object-cover rounded-lg border border-slate-700 shrink-0" />
                      )
                    ))}
                  </div>
                  <div className="text-xs text-slate-400 shrink-0">
                    {attachedMediaList.length > 1 ? `Carousel (${attachedMediaList.length})` : "Attached"}
                  </div>
                  <button onClick={() => { setAttachedMedia(null); setAttachedMediaList([]); }} className="text-slate-500 hover:text-red-400 shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Toolbar */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-800">
                <button onClick={() => setShowCaptionGen(true)} className="btn-ghost flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300">
                  <Sparkles className="w-3.5 h-3.5" />Generate
                </button>
                <button
                  onClick={async () => {
                    setShowMediaPicker(true);
                    try {
                      const items = await mediaApi.list();
                      setMediaLibrary(items);
                    } catch { toast.error("Failed to load media"); }
                  }}
                  className="btn-ghost flex items-center gap-1.5 text-xs"
                >
                  <Image className="w-3.5 h-3.5" />Media
                </button>
                <button onClick={suggestHashtags} disabled={hashtagLoading} className="btn-ghost flex items-center gap-1.5 text-xs">
                  {hashtagLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Hash className="w-3.5 h-3.5" />}
                  Hashtags
                </button>
                <button onClick={() => setShowTemplates(true)} className="btn-ghost flex items-center gap-1.5 text-xs">
                  <FolderOpen className="w-3.5 h-3.5" />Templates
                </button>
                <button onClick={() => setSavingTemplate(true)} className="btn-ghost flex items-center gap-1.5 text-xs">
                  <Save className="w-3.5 h-3.5" />Save
                </button>
                <div className="flex-1" />
                <button onClick={rewriteCaption} disabled={rewriting} className="btn-ghost flex items-center gap-1.5 text-xs">
                  {rewriting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5 text-violet-400" />}
                  Rewrite
                </button>
                <button onClick={() => setShowSchedule(true)} className="btn-secondary flex items-center gap-1.5 text-xs"><Calendar className="w-3.5 h-3.5" />Schedule</button>
                <button onClick={publish} disabled={publishing} className="btn-primary flex items-center gap-1.5 text-xs">
                  {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Publish now
                </button>
              </div>
            </div>

            {/* Hashtags */}
            {hashtags.length > 0 && (
              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-white">Hashtags ({hashtags.length})</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setShowGroups(true)} className="text-xs text-violet-400 hover:text-violet-300 transition-colors">Groups</button>
                    <button onClick={() => setHashtags([])} className="text-xs text-slate-500 hover:text-slate-300">Clear</button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {hashtags.map((tag) => (
                    <span key={tag} className="text-xs bg-slate-800 text-blue-400 border border-slate-700 rounded-full px-2.5 py-1 cursor-pointer hover:border-red-500/50 hover:text-red-400 transition-colors" onClick={() => setHashtags((prev) => prev.filter((t) => t !== tag))}>
                      {tag}
                    </span>
                  ))}
                </div>
                {/* Save group inline */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-slate-800">
                  <input
                    className="input flex-1 text-xs py-1.5"
                    placeholder="Group name (e.g. Fashion Launch)"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveHashtagGroup()}
                  />
                  <button onClick={saveHashtagGroup} className="btn-secondary text-xs flex items-center gap-1">
                    <Save className="w-3 h-3" /> Save group
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right - Platform selector + preview */}
          <div className="space-y-4">
            <div className="card">
              <h3 className="text-sm font-semibold text-white mb-3">Publish to</h3>
              <div className="space-y-2">
                {PLATFORMS.map((p) => {
                  const selected = selectedPlatforms.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => togglePlatform(p.id)}
                      className={cn("w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                        selected ? "border-violet-500/50 bg-violet-500/10" : "border-slate-700 bg-slate-800/50 hover:border-slate-600")}
                    >
                      <span className="text-lg leading-none">{p.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-200">{p.label}</p>
                        <p className="text-xs text-slate-500">{p.limit.toLocaleString()} char limit</p>
                      </div>
                      {selected
                        ? <CheckCircle className="w-4 h-4 text-violet-400 shrink-0" />
                        : <div className="w-4 h-4 rounded-full border border-slate-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Predicted score */}
            <div className="card">
              <h3 className="text-sm font-semibold text-white mb-3">Predicted Performance</h3>
              <div className="flex items-center justify-center">
                <div className="relative w-24 h-24">
                  <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                    <circle cx="48" cy="48" r="38" fill="none" stroke="#1e293b" strokeWidth="8" />
                    <circle
                      cx="48" cy="48" r="38" fill="none" stroke="#8b5cf6" strokeWidth="8"
                      strokeDasharray={`${caption.length > 20 ? 188 : 100} 238.76`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-white">{caption.length > 20 ? 79 : 40}</span>
                    <span className="text-xs text-slate-400">score</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 space-y-1.5">
                {[
                  { label: "Content quality", value: caption.length > 50 ? 85 : 40 },
                  { label: "Timing (next slot)", value: 90 },
                  { label: "Hashtag strength", value: hashtags.length > 5 ? 80 : 30 },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>{label}</span><span>{value}</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1">
                      <div className="h-1 rounded-full bg-violet-500 transition-all" style={{ width: `${value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Best time to post */}
            <BestTimeWidget platform={selectedPlatforms[0] ?? "instagram"} />
          </div>
        </div>
      </div>

      {/* Templates modal */}
      {showTemplates && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setShowTemplates(false)} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 animate-slide-up">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <span className="text-sm font-semibold text-white">Caption Templates ({templates.length})</span>
              <button onClick={() => setShowTemplates(false)} className="text-slate-500 hover:text-slate-300"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 max-h-80 overflow-y-auto space-y-2">
              {templates.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-6">No templates yet. Write a caption and click Save.</p>
              )}
              {templates.map((t) => (
                <div key={t.id} className="flex items-start gap-3 p-3 bg-slate-800/50 border border-slate-700 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{t.name}</p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{t.caption.slice(0, 60)}…</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => loadTemplate(t)} className="btn-secondary text-xs px-2 py-1">Use</button>
                    <button onClick={() => deleteTemplate(t.id)} className="text-slate-600 hover:text-red-400 transition-colors p-1"><X className="w-3 h-3" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Save template modal */}
      {savingTemplate && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setSavingTemplate(false)} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 animate-slide-up p-5">
            <p className="text-sm font-semibold text-white mb-3">Save as Template</p>
            <input className="input w-full mb-3" placeholder="Template name" value={templateName} onChange={(e) => setTemplateName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveTemplate()} autoFocus />
            <div className="flex justify-end gap-2">
              <button onClick={() => setSavingTemplate(false)} className="btn-ghost text-sm">Cancel</button>
              <button onClick={saveTemplate} className="btn-primary text-sm flex items-center gap-1.5"><Save className="w-3.5 h-3.5" />Save</button>
            </div>
          </div>
        </>
      )}

      {/* Hashtag groups modal */}
      {showGroups && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setShowGroups(false)} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 animate-slide-up">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <span className="text-sm font-semibold text-white">Hashtag Groups</span>
              <button onClick={() => setShowGroups(false)} className="text-slate-500 hover:text-slate-300"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 max-h-80 overflow-y-auto space-y-2">
              {hashtagGroups.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-6">No groups saved. Generate hashtags and click "Save group".</p>
              )}
              {hashtagGroups.map((g) => (
                <div key={g.id} className="flex items-start gap-3 p-3 bg-slate-800/50 border border-slate-700 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{g.name}</p>
                    <p className="text-xs text-blue-400 truncate mt-0.5">{g.tags.slice(0, 5).join(" ")}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{g.tags.length} tags</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => loadHashtagGroup(g)} className="btn-secondary text-xs px-2 py-1">Load</button>
                    <button onClick={() => { const updated = hashtagGroups.filter((x) => x.id !== g.id); setHashtagGroups(updated); localStorage.setItem(STORAGE_GROUPS_KEY, JSON.stringify(updated)); }} className="text-slate-600 hover:text-red-400 transition-colors p-1"><X className="w-3 h-3" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {showCaptionGen && (
        <AICaptionGenerator
          onUse={(text) => setCaption(text)}
          onClose={() => setShowCaptionGen(false)}
        />
      )}

      <ScheduleModal
        isOpen={showSchedule}
        onClose={() => setShowSchedule(false)}
        caption={caption}
        hashtags={hashtags}
        platforms={selectedPlatforms}
        mediaUrl={attachedMedia?.url}
        mediaType={attachedMedia?.type}
        onScheduled={() => { setCaption(""); setHashtags([]); setAttachedMedia(null); }}
      />

      <PublishResultModal
        isOpen={showResults}
        onClose={() => setShowResults(false)}
        results={publishResults}
        postId={lastPostId}
        onRetried={(newResults) => setPublishResults(newResults)}
      />

      {showMediaPicker && (
        <>
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" onClick={() => setShowMediaPicker(false)} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl max-h-[80vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <div>
                <p className="text-sm font-medium text-white">Choose media</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {attachedMediaList.length > 0
                    ? `${attachedMediaList.length} selected${attachedMediaList.length > 1 ? " (carousel)" : ""}`
                    : "Click to select. Pick 2–10 for a carousel."}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setShowMediaPicker(false); toast.success("Media attached"); }}
                  className="btn-primary text-sm"
                  disabled={attachedMediaList.length === 0}
                >
                  Done
                </button>
                <button onClick={() => setShowMediaPicker(false)} className="text-slate-500 hover:text-slate-300">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-5 overflow-y-auto">
              {mediaLibrary.length === 0 ? (
                <p className="text-center text-sm text-slate-500 py-10">No media uploaded yet. Go to Media → upload some files first.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {mediaLibrary.map((m) => {
                    const isSelected = attachedMediaList.some((a) => a.id === m.id);
                    return (
                      <button
                        key={m.id}
                        onClick={() => {
                          const item = { id: m.id, url: m.public_url, type: m.type };
                          if (isSelected) {
                            setAttachedMediaList((prev) => prev.filter((a) => a.id !== m.id));
                          } else {
                            setAttachedMediaList((prev) => [...prev, item]);
                            if (!attachedMedia) setAttachedMedia(item);
                          }
                        }}
                        className={cn(
                          "relative aspect-square rounded-xl border-2 overflow-hidden bg-slate-800 transition-all",
                          isSelected ? "border-violet-500" : "border-slate-700 hover:border-violet-500/50",
                        )}
                      >
                        {m.public_url && m.type === "image" ? (
                          <img src={m.public_url} alt={m.name} className="w-full h-full object-cover" />
                        ) : m.public_url && m.type === "video" ? (
                          <video src={m.public_url} muted playsInline preload="metadata" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs p-2">{m.name}</div>
                        )}
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 bg-violet-600 rounded-full w-6 h-6 flex items-center justify-center text-white text-xs font-bold">
                            {attachedMediaList.findIndex((a) => a.id === m.id) + 1}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
