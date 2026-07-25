"use client";
import { useState, useEffect, useCallback } from "react";
import Header from "@/components/layout/Header";
import { ecommerceApi, getErrorMessage } from "@/lib/api";
import {
  ShoppingBag, Key, Plus, Trash2, Copy, Check,
  Clock, PackageCheck, Sparkles, RefreshCw, Eye, EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface ApiKey {
  id: string;
  name: string;
  key_preview: string;
  created_at: string | null;
  last_used_at: string | null;
}

interface FeedPost {
  id: string;
  caption: string;
  media_urls: string[];
  status: string;
  event: string;
  platforms: string[];
  created_at: string | null;
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  tiktok:    "bg-slate-500/20 text-slate-300 border-slate-500/30",
  twitter:   "bg-sky-500/20 text-sky-300 border-sky-500/30",
  linkedin:  "bg-blue-500/20 text-blue-300 border-blue-500/30",
  facebook:  "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
};

const EVENT_STYLES: Record<string, { label: string; color: string }> = {
  product_listed: { label: "New Product",   color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  product_sold:   { label: "Sold",          color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
};

function timeAgo(iso: string | null): string {
  if (!iso) return "never";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── API Keys panel ────────────────────────────────────────────────────────────

function KeysPanel() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [revealed, setRevealed] = useState<{ id: string; key: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await ecommerceApi.listKeys();
      setKeys(data);
    } catch {
      toast.error("Failed to load API keys");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!newName.trim()) { toast.error("Enter a store name"); return; }
    setCreating(true);
    try {
      const data = await ecommerceApi.createKey(newName.trim());
      setRevealed({ id: data.id, key: data.key });
      setNewName("");
      await load();
      toast.success("API key created");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to create key"));
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: string, name: string) => {
    if (!confirm(`Revoke key for "${name}"? Any website using it will stop working immediately.`)) return;
    try {
      await ecommerceApi.revokeKey(id);
      setKeys((prev) => prev.filter((k) => k.id !== id));
      toast.success("Key revoked");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to revoke key"));
    }
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* New key form */}
      <div className="flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          placeholder="Store name (e.g. My Fashion Store)"
          className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
        />
        <button
          onClick={handleCreate}
          disabled={creating}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          {creating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          Generate Key
        </button>
      </div>

      {/* Revealed key banner */}
      {revealed && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-2">
          <p className="text-amber-300 text-sm font-semibold flex items-center gap-2">
            <Eye className="w-4 h-4" /> Copy this key now. It will not be shown again.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-emerald-300 font-mono break-all">
              {revealed.key}
            </code>
            <button
              onClick={() => handleCopy(revealed.key)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium rounded-lg transition-colors shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <button
            onClick={() => setRevealed(null)}
            className="text-slate-500 hover:text-slate-400 text-xs transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Key list */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-5 h-5 text-slate-500 animate-spin" />
        </div>
      ) : keys.length === 0 ? (
        <div className="text-center py-10 text-slate-500 text-sm">
          No API keys yet. Generate one above to connect your first store.
        </div>
      ) : (
        <div className="space-y-2">
          {keys.map((k) => (
            <div key={k.id} className="flex items-center gap-4 bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3">
              <div className="w-8 h-8 bg-violet-600/20 rounded-lg flex items-center justify-center shrink-0">
                <ShoppingBag className="w-4 h-4 text-violet-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-200 truncate">{k.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Last used: {timeAgo(k.last_used_at)} · Created: {timeAgo(k.created_at)}
                </p>
              </div>
              <code className="text-xs text-slate-400 font-mono bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700 shrink-0">
                {k.key_preview}
              </code>
              <button
                onClick={() => handleRevoke(k.id, k.name)}
                className="text-slate-600 hover:text-red-400 transition-colors p-1 shrink-0"
                title="Revoke key"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Feed panel ────────────────────────────────────────────────────────────────

function FeedPanel() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "product_listed" | "product_sold">("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ecommerceApi.feed();
      setPosts(data);
    } catch {
      toast.error("Failed to load store feed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = filter === "all" ? posts : posts.filter((p) => p.event === filter);

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["all", "product_listed", "product_sold"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
              filter === f
                ? "bg-violet-600 text-white"
                : "bg-slate-800 text-slate-400 hover:text-slate-200",
            )}
          >
            {f === "all" ? "All" : f === "product_listed" ? "Products" : "Sales"}
          </button>
        ))}
        <button onClick={load} className="ml-auto text-slate-500 hover:text-slate-300 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-5 h-5 text-slate-500 animate-spin" />
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-16 space-y-2">
          <PackageCheck className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-slate-500 text-sm">No store posts yet.</p>
          <p className="text-slate-600 text-xs">Connect a store and send your first product or sale event.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visible.map((post) => {
            const style = EVENT_STYLES[post.event] ?? EVENT_STYLES["product_listed"];
            const thumb = post.media_urls?.[0];
            return (
              <div key={post.id} className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
                {/* Thumbnail */}
                <div className="relative h-28 bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center">
                  {thumb ? (
                    <img src={thumb} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <ShoppingBag className="w-8 h-8 text-slate-600" />
                  )}
                  <span className={cn("absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full border", style.color)}>
                    {style.label}
                  </span>
                  <span className={cn(
                    "absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full border font-medium",
                    post.status === "published"
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      : "bg-amber-500/20 text-amber-300 border-amber-500/30",
                  )}>
                    {post.status}
                  </span>
                </div>

                {/* Body */}
                <div className="p-3 space-y-2.5">
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">{post.caption}</p>

                  {/* Platforms */}
                  <div className="flex flex-wrap gap-1.5">
                    {post.platforms.map((p) => (
                      <span key={p} className={cn("text-xs px-2 py-0.5 rounded-full border font-medium capitalize", PLATFORM_COLORS[p] ?? "bg-slate-700 text-slate-300 border-slate-600")}>
                        {p}
                      </span>
                    ))}
                  </div>

                  <p className="text-xs text-slate-600 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {timeAgo(post.created_at)}
                    {post.event === "product_listed" && <span className="flex items-center gap-1 ml-2 text-violet-400"><Sparkles className="w-3 h-3" /> AI generated</span>}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type Tab = "feed" | "keys";

export default function StorePage() {
  const [tab, setTab] = useState<Tab>("feed");

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-slate-950">
      <Header title="Store Feed" subtitle="Auto-post products and sales from your connected stores" />

      <div className="flex-1 p-6 space-y-6 max-w-5xl mx-auto w-full">
        {/* Tab bar */}
        <div className="flex gap-1 bg-slate-800/50 border border-slate-700 rounded-xl p-1 w-fit">
          {([
            { id: "feed", icon: ShoppingBag, label: "Store Feed" },
            { id: "keys", icon: Key,         label: "API Keys" },
          ] as { id: Tab; icon: React.ElementType; label: string }[]).map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                tab === id
                  ? "bg-violet-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200",
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
          {tab === "feed" ? <FeedPanel /> : <KeysPanel />}
        </div>

        {/* Integration guide */}
        {tab === "keys" && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Key className="w-4 h-4 text-violet-400" /> How to connect your store
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Generate an API key above, then add it to your store's environment variables as{" "}
              <code className="bg-slate-800 px-1.5 py-0.5 rounded text-violet-300">SOCIALOS_API_KEY</code>.
              Call the two endpoints below whenever a product is listed or an item sells.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-slate-800/60 rounded-xl p-3 space-y-1">
                <p className="text-xs font-semibold text-slate-300">New product listed</p>
                <code className="text-xs text-emerald-400 font-mono">POST /api/ecommerce/product</code>
                <p className="text-xs text-slate-500">Announces the product across all connected platforms with an AI-generated caption.</p>
              </div>
              <div className="bg-slate-800/60 rounded-xl p-3 space-y-1">
                <p className="text-xs font-semibold text-slate-300">Item sold</p>
                <code className="text-xs text-emerald-400 font-mono">POST /api/ecommerce/sale</code>
                <p className="text-xs text-slate-500">Posts a sale announcement using the right template: scarcity, social proof, unique item, and more.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
