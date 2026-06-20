"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import { Upload, Search, Image, Film, FileText, Sparkles, Plus, X, Download, ExternalLink, Trash2, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { mediaApi } from "@/lib/api";
import toast from "react-hot-toast";

const MOCK_MEDIA = [
  { id: "1", name: "product-hero.jpg", type: "image", size: "2.4 MB", sizeBytes: 2516582, tags: ["product", "hero"], url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop" },
  { id: "2", name: "team-photo.jpg", type: "image", size: "3.1 MB", sizeBytes: 3250586, tags: ["team", "bts"], url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=400&fit=crop" },
  { id: "3", name: "launch-video.mp4", type: "video", size: "48 MB", sizeBytes: 50331648, tags: ["launch", "video"], url: null },
  { id: "4", name: "infographic.png", type: "image", size: "1.8 MB", sizeBytes: 1887437, tags: ["educational", "infographic"], url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=400&fit=crop" },
  { id: "5", name: "brand-logo.svg", type: "image", size: "24 KB", sizeBytes: 24576, tags: ["brand", "logo"], url: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&h=400&fit=crop" },
  { id: "6", name: "q3-report.pdf", type: "document", size: "890 KB", sizeBytes: 911360, tags: ["report", "q3"], url: null },
  { id: "7", name: "campaign-banner.jpg", type: "image", size: "1.2 MB", sizeBytes: 1258291, tags: ["campaign", "banner"], url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=400&fit=crop" },
  { id: "8", name: "product-demo.mp4", type: "video", size: "72 MB", sizeBytes: 75497472, tags: ["product", "demo"], url: null },
];

const TOTAL_STORAGE = 500 * 1024 * 1024;
const TYPE_ICONS: Record<string, any> = { image: Image, video: Film, document: FileText };

interface MediaItem {
  id: string; name: string; type: string; size: string; sizeBytes: number; tags: string[]; url: string | null;
}

interface PreviewModalProps {
  item: MediaItem;
  onClose: () => void;
  onDelete: (id: string) => void;
  onUseInCompose: (item: MediaItem) => void;
}

function PreviewModal({ item, onClose, onDelete, onUseInCompose }: PreviewModalProps) {
  const Icon = TYPE_ICONS[item.type] ?? Image;
  return (
    <>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 animate-slide-up overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <Icon className="w-4 h-4 text-slate-400 shrink-0" />
            <p className="text-sm font-medium text-white truncate">{item.name}</p>
            <span className="text-xs text-slate-500 shrink-0">{item.size}</span>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors shrink-0 ml-3">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Preview area */}
        <div className="bg-slate-950 flex items-center justify-center" style={{ minHeight: 320 }}>
          {item.url && item.type === "video" ? (
            <video src={item.url} controls playsInline className="max-w-full max-h-80" />
          ) : item.url ? (
            <img src={item.url} alt={item.name} className="max-w-full max-h-80 object-contain" />
          ) : (
            <div className="flex flex-col items-center gap-3 text-slate-600">
              <Icon className="w-16 h-16" />
              <p className="text-sm">Preview not available</p>
            </div>
          )}
        </div>

        {/* Meta + actions */}
        <div className="p-5">
          <div className="flex flex-wrap gap-1.5 mb-4">
            {item.tags.map((tag) => (
              <span key={tag} className="text-xs bg-slate-800 text-slate-400 border border-slate-700 rounded-full px-2.5 py-0.5">
                #{tag}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {item.url && (
              <a
                href={item.url}
                download={item.name}
                className="btn-ghost flex items-center gap-1.5 text-sm"
              >
                <Download className="w-3.5 h-3.5" /> Download
              </a>
            )}
            {item.url && (
              <a href={item.url} target="_blank" rel="noreferrer" className="btn-ghost flex items-center gap-1.5 text-sm">
                <ExternalLink className="w-3.5 h-3.5" /> Open
              </a>
            )}
            <button
              onClick={() => { onDelete(item.id); onClose(); toast.success("Deleted"); }}
              className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg border border-red-500/20 hover:border-red-500/40 transition-all ml-auto"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
            <button
              onClick={() => { onUseInCompose(item); }}
              className="btn-primary flex items-center gap-1.5 text-sm"
            >
              <Check className="w-3.5 h-3.5" /> Use in Compose
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function MediaPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const router = useRouter();

  const useInCompose = (item: MediaItem) => {
    if (!item.url) { toast.error("No URL for this media"); return; }
    sessionStorage.setItem("compose_prefill_media", JSON.stringify({ id: item.id, url: item.url, type: item.type }));
    toast.success(`${item.name} attached`);
    router.push("/compose");
  };

  const [aiPrompt, setAiPrompt] = useState("");
  const [generating, setGenerating] = useState(false);

  const generateImage = async () => {
    if (!aiPrompt.trim()) { toast.error("Describe what you want"); return; }
    setGenerating(true);
    const loadingToast = toast.loading("Generating image…");
    try {
      const res = await mediaApi.generate(aiPrompt);
      const newItem: MediaItem = {
        id: res.id || `ai-${Date.now()}`,
        name: res.name || `AI: ${aiPrompt.slice(0, 40)}`,
        type: "image",
        sizeBytes: res.size_bytes || 0,
        size: res.size_bytes > 1048576 ? `${(res.size_bytes / 1048576).toFixed(1)} MB` : `${Math.round((res.size_bytes || 0) / 1024)} KB`,
        tags: ["ai"],
        url: res.public_url,
      };
      setMedia((prev) => [newItem, ...prev]);
      setAiPrompt("");
      toast.success("Image generated!", { id: loadingToast });
    } catch {
      toast.error("Generation failed — try again", { id: loadingToast });
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    mediaApi.list().then((items: any[]) => {
      setMedia(items.map((m) => ({
        id: m.id,
        name: m.name,
        type: m.type,
        sizeBytes: m.size_bytes || 0,
        size: m.size_bytes > 1048576 ? `${(m.size_bytes / 1048576).toFixed(1)} MB` : `${Math.round((m.size_bytes || 0) / 1024)} KB`,
        tags: [m.type],
        url: m.public_url,
      })));
    }).catch(() => {});
  }, []);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string | null>(null);
  const [preview, setPreview] = useState<MediaItem | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = media.filter((m) => {
    const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.tags.some((t) => t.includes(search.toLowerCase()));
    const matchFilter = !filter || m.type === filter;
    return matchSearch && matchFilter;
  });

  const usedBytes = media.reduce((s, m) => s + m.sizeBytes, 0);
  const usedPct = Math.round((usedBytes / TOTAL_STORAGE) * 100);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const arr = Array.from(files);
    const uploadingToast = toast.loading(`Uploading ${arr.length} file${arr.length > 1 ? "s" : ""}…`);
    try {
      const results = await Promise.all(arr.map((file) => mediaApi.upload(file)));
      results.forEach((res, i) => {
        const file = arr[i];
        const type = res.type || (file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "document");
        const newItem: MediaItem = {
          id: res.id || res.key || `local-${Date.now()}-${i}`,
          name: file.name,
          type,
          size: file.size > 1048576 ? `${(file.size / 1048576).toFixed(1)} MB` : `${Math.round(file.size / 1024)} KB`,
          sizeBytes: file.size,
          tags: [type],
          url: res.public_url,
        };
        setMedia((prev) => [newItem, ...prev]);
      });
      toast.success(`${arr.length} file${arr.length > 1 ? "s" : ""} uploaded`, { id: uploadingToast });
    } catch (e) {
      toast.error("Upload failed - check Cloudinary credentials", { id: uploadingToast });
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <Header title="Media Library" subtitle="All your brand assets in one place" />
      <div className="flex-1 p-6 space-y-5 overflow-y-auto">

        {/* AI Image Generator */}
        <div className="card border-violet-500/20">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <h2 className="text-sm font-semibold text-white">AI Image Generator</h2>
            <span className="text-xs bg-violet-500/20 text-violet-400 border border-violet-500/30 rounded-full px-2 py-0.5">Pollinations</span>
          </div>
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="Describe the image you want to generate…"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !generating) generateImage(); }}
              disabled={generating}
            />
            <button
              onClick={generateImage}
              disabled={generating || !aiPrompt.trim()}
              className="btn-primary flex items-center gap-1.5"
            >
              {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {generating ? "Generating…" : "Generate"}
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2">Free AI image generation. Takes 10-30s. Saved to your Media library and Cloudinary.</p>
        </div>

        {/* Upload zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer transition-all",
            dragging ? "border-violet-500 bg-violet-500/5" : "border-slate-700 hover:border-violet-500/50 hover:bg-slate-800/30",
          )}
        >
          <Upload className={cn("w-6 h-6 transition-colors", dragging ? "text-violet-400" : "text-slate-500")} />
          <p className="text-sm text-slate-400">
            {dragging ? "Drop files here" : "Drag & drop files or click to upload"}
          </p>
          <p className="text-xs text-slate-600">Images, videos, PDFs - up to 100 MB each</p>
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        </div>

        {/* Storage bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", usedPct > 80 ? "bg-red-500" : usedPct > 60 ? "bg-amber-500" : "bg-violet-500")}
              style={{ width: `${usedPct}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 shrink-0">
            {(usedBytes / 1048576).toFixed(0)} MB / {(TOTAL_STORAGE / 1048576).toFixed(0)} MB used
          </p>
        </div>

        {/* Filter + search row */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              className="input pl-8 w-52 text-sm"
              placeholder="Search assets…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-1.5 ml-auto">
            {[null, "image", "video", "document"].map((t) => (
              <button
                key={t ?? "all"}
                onClick={() => setFilter(t)}
                className={cn(
                  "text-xs capitalize px-2.5 py-1.5 rounded-lg border transition-all",
                  filter === t
                    ? "bg-violet-600/20 text-violet-300 border-violet-500/30"
                    : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200",
                )}
              >
                {t ?? "All"} {t && `(${media.filter((m) => m.type === t).length})`}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Add placeholder */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="aspect-square rounded-xl border-2 border-dashed border-slate-700 hover:border-violet-500/50 flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-violet-400 transition-all"
          >
            <Plus className="w-6 h-6" />
            <span className="text-xs">Add media</span>
          </button>

          {filtered.map((item) => {
            const Icon = TYPE_ICONS[item.type] ?? Image;
            return (
              <button
                key={item.id}
                onClick={() => setPreview(item)}
                className="group relative aspect-square rounded-xl border border-slate-700 overflow-hidden bg-slate-800 hover:border-violet-500/50 transition-all"
              >
                {item.url && item.type === "video" ? (
                  <video src={item.url} muted playsInline preload="metadata" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : item.url ? (
                  <img src={item.url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Icon className="w-8 h-8 text-slate-500" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                  <p className="text-white text-[10px] font-medium truncate">{item.name}</p>
                  <p className="text-slate-400 text-[10px]">{item.size}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {item.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="text-[9px] bg-violet-600/40 text-violet-200 rounded px-1">#{tag}</span>
                    ))}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <Image className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No assets match your search</p>
          </div>
        )}
      </div>

      {preview && (
        <PreviewModal
          item={preview}
          onClose={() => setPreview(null)}
          onUseInCompose={useInCompose}
          onDelete={async (id) => {
            try { await mediaApi.delete(id); } catch {}
            setMedia((prev) => prev.filter((m) => m.id !== id));
          }}
        />
      )}
    </div>
  );
}
