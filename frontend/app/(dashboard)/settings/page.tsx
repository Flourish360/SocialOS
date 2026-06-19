"use client";
import { useState } from "react";
import Header from "@/components/layout/Header";
import { accountsApi } from "@/lib/api";
import { CheckCircle, ExternalLink, Palette, Bell, Shield, Users, Mail, Loader2, Eye, EyeOff, Trash2, RefreshCw, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const MOCK_MEMBERS = [
  { id: "1", name: "Demo User", email: "demo@socialos.app", role: "Admin", avatar: "D", joined: "Jan 2026" },
  { id: "2", name: "Alex Kim", email: "alex@socialos.app", role: "Editor", avatar: "A", joined: "Feb 2026" },
  { id: "3", name: "Sam Rivera", email: "sam@socialos.app", role: "Viewer", avatar: "S", joined: "Mar 2026" },
];

function TeamSection() {
  const [members, setMembers] = useState(MOCK_MEMBERS);
  const [invite, setInvite] = useState("");
  const [role, setRole] = useState("Editor");
  const [sending, setSending] = useState(false);

  const sendInvite = async () => {
    if (!invite.includes("@")) { toast.error("Enter a valid email"); return; }
    setSending(true);
    await new Promise((r) => setTimeout(r, 800));
    toast.success(`Invite sent to ${invite}`);
    setInvite("");
    setSending(false);
  };

  return (
    <div className="max-w-xl space-y-6">
      <h2 className="text-base font-semibold text-white">Team Members</h2>

      {/* Member list */}
      <div className="space-y-2">
        {members.map((m) => (
          <div key={m.id} className="flex items-center gap-3 p-3 bg-slate-800/50 border border-slate-700 rounded-xl">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
              {m.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{m.name}</p>
              <p className="text-xs text-slate-400 truncate">{m.email}</p>
            </div>
            <select
              value={m.role}
              onChange={(e) => setMembers((prev) => prev.map((x) => x.id === m.id ? { ...x, role: e.target.value } : x))}
              className="bg-slate-700 border border-slate-600 text-slate-300 text-xs rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-violet-500"
            >
              {["Admin", "Editor", "Viewer"].map((r) => <option key={r}>{r}</option>)}
            </select>
            {m.id !== "1" && (
              <button onClick={() => { setMembers((p) => p.filter((x) => x.id !== m.id)); toast.success("Member removed"); }}
                className="text-slate-600 hover:text-red-400 transition-colors p-1">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Invite */}
      <div className="border-t border-slate-800 pt-5">
        <h3 className="text-sm font-semibold text-white mb-3">Invite teammate</h3>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input className="input pl-8 w-full" placeholder="colleague@example.com"
              value={invite} onChange={(e) => setInvite(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendInvite()} />
          </div>
          <select value={role} onChange={(e) => setRole(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-violet-500">
            {["Admin", "Editor", "Viewer"].map((r) => <option key={r}>{r}</option>)}
          </select>
          <button onClick={sendInvite} disabled={sending} className="btn-primary flex items-center gap-1.5 text-sm shrink-0">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            Invite
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2">Teammates can be invited by email. They'll receive a link to join your workspace.</p>
      </div>
    </div>
  );
}

function SecuritySection() {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [current, setCurrent] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [twoFA, setTwoFA] = useState(false);

  const changePassword = async () => {
    if (!current) { toast.error("Enter current password"); return; }
    if (newPw.length < 8) { toast.error("New password must be at least 8 characters"); return; }
    if (newPw !== confirm) { toast.error("Passwords don't match"); return; }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    toast.success("Password updated!");
    setCurrent(""); setNewPw(""); setConfirm("");
    setSaving(false);
  };

  return (
    <div className="max-w-xl space-y-6">
      <h2 className="text-base font-semibold text-white">Security</h2>

      {/* Change password */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white">Change password</h3>
        <div className="relative">
          <input type={showCurrent ? "text" : "password"} className="input w-full pr-10"
            placeholder="Current password" value={current} onChange={(e) => setCurrent(e.target.value)} />
          <button onClick={() => setShowCurrent((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
            {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <div className="relative">
          <input type={showNew ? "text" : "password"} className="input w-full pr-10"
            placeholder="New password (min 8 chars)" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
          <button onClick={() => setShowNew((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
            {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <input type="password" className="input w-full" placeholder="Confirm new password"
          value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        {newPw && confirm && newPw !== confirm && (
          <p className="text-xs text-red-400">Passwords don't match</p>
        )}
        <button onClick={changePassword} disabled={saving} className="btn-primary flex items-center gap-1.5 text-sm">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Update password
        </button>
      </div>

      {/* 2FA */}
      <div className="border-t border-slate-800 pt-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Two-factor authentication</h3>
            <p className="text-xs text-slate-400 mt-0.5">Add an extra layer of security to your account</p>
          </div>
          <button
            onClick={() => { setTwoFA((v) => !v); toast.success(twoFA ? "2FA disabled" : "2FA enabled"); }}
            className={cn("relative w-10 h-5 rounded-full transition-all shrink-0", twoFA ? "bg-violet-600" : "bg-slate-700")}
          >
            <div className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all", twoFA ? "left-5" : "left-0.5")} />
          </button>
        </div>
      </div>

      {/* Active sessions */}
      <div className="border-t border-slate-800 pt-5">
        <h3 className="text-sm font-semibold text-white mb-3">Active sessions</h3>
        <div className="space-y-2">
          {[
            { device: "Chrome on Windows - Current", location: "Lagos, NG", time: "Now", current: true },
            { device: "Safari on iPhone", location: "Lagos, NG", time: "2h ago", current: false },
          ].map((s) => (
            <div key={s.device} className="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700 rounded-xl">
              <div>
                <p className="text-sm text-white flex items-center gap-2">
                  {s.device}
                  {s.current && <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full">current</span>}
                </p>
                <p className="text-xs text-slate-400">{s.location} · {s.time}</p>
              </div>
              {!s.current && (
                <button onClick={() => toast.success("Session revoked")} className="text-xs text-red-400 hover:text-red-300 transition-colors">
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const PLATFORMS_CONNECT = [
  { id: "instagram", label: "Instagram", emoji: "📸", description: "Meta Graph API", username: "@yourbrand", followers: "24.3K", health: "healthy", lastSync: "2 min ago" },
  { id: "twitter", label: "Twitter/X", emoji: "🐦", description: "Twitter API v2", username: "@yourbrand_x", followers: "11.8K", health: "healthy", lastSync: "5 min ago" },
  { id: "linkedin", label: "LinkedIn", emoji: "💼", description: "LinkedIn Marketing API", username: "Your Brand Co.", followers: "4.2K", health: "expiring", lastSync: "1h ago" },
  { id: "tiktok", label: "TikTok", emoji: "🎵", description: "TikTok for Developers", username: "@yourbrand_tt", followers: "62.1K", health: "healthy", lastSync: "8 min ago" },
  { id: "youtube", label: "YouTube", emoji: "▶️", description: "YouTube Data API v3", username: "Your Brand Channel", followers: "8.9K", health: "healthy", lastSync: "30 min ago" },
  { id: "facebook", label: "Facebook", emoji: "🔵", description: "Meta Graph API", username: "Your Brand Page", followers: "15.7K", health: "expired", lastSync: "3d ago" },
  { id: "pinterest", label: "Pinterest", emoji: "📌", description: "Pinterest API v5", username: null, followers: null, health: null, lastSync: null },
  { id: "threads", label: "Threads", emoji: "🧵", description: "Threads API", username: null, followers: null, health: null, lastSync: null },
];

const TONES = [
  { id: "professional", label: "Professional", desc: "Formal, authoritative, expert tone" },
  { id: "casual", label: "Casual", desc: "Friendly, conversational, relatable" },
  { id: "humorous", label: "Humorous", desc: "Witty, playful, entertaining" },
  { id: "inspirational", label: "Inspirational", desc: "Motivating, uplifting, visionary" },
];

const ACCENT_COLORS = [
  { name: "Violet", value: "violet", hex: "#8b5cf6" },
  { name: "Blue", value: "blue", hex: "#3b82f6" },
  { name: "Emerald", value: "emerald", hex: "#10b981" },
  { name: "Rose", value: "rose", hex: "#f43f5e" },
  { name: "Amber", value: "amber", hex: "#f59e0b" },
];

function AccentColorPicker() {
  const [accent, setAccent] = useState(() => localStorage.getItem("socialos_accent") ?? "violet");

  const apply = (value: string, hex: string) => {
    setAccent(value);
    localStorage.setItem("socialos_accent", value);
    document.documentElement.style.setProperty("--accent", hex);
    toast.success(`Theme updated to ${value}`);
  };

  return (
    <div>
      <label className="block text-xs text-slate-400 mb-2">UI Accent Color</label>
      <div className="flex gap-2 flex-wrap">
        {ACCENT_COLORS.map((c) => (
          <button
            key={c.value}
            onClick={() => apply(c.value, c.hex)}
            title={c.name}
            className={cn(
              "w-9 h-9 rounded-xl border-2 transition-all hover:scale-110",
              accent === c.value ? "border-white scale-110" : "border-transparent",
            )}
            style={{ background: c.hex }}
          />
        ))}
      </div>
      <p className="text-xs text-slate-500 mt-2">Accent color is applied globally across the dashboard.</p>
    </div>
  );
}

const SECTIONS = ["Accounts", "Brand Kit", "Notifications", "Team", "Security"] as const;

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<typeof SECTIONS[number]>("Accounts");
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
  const [brandTone, setBrandTone] = useState("casual");
  const [brandName, setBrandName] = useState("Your Brand");

  const connectPlatform = async (platform: string) => {
    try {
      const { url } = await accountsApi.oauthUrl(platform);
      window.location.href = url;
    } catch {
      toast.error("OAuth not configured for this platform yet");
    }
  };

  const disconnectPlatform = (platform: string) => {
    setConnectedPlatforms((prev) => prev.filter((p) => p !== platform));
    toast.success(`${platform} disconnected`);
  };

  const reconnectPlatform = async (platform: string) => {
    toast.success(`Reconnecting ${platform}…`);
    await new Promise((r) => setTimeout(r, 1000));
    toast.success(`${platform} token refreshed!`);
  };

  return (
    <div className="flex flex-col flex-1">
      <Header title="Settings" subtitle="Accounts, brand kit, notifications, and team" />
      <div className="flex-1 flex overflow-hidden">

        {/* Section nav */}
        <div className="w-52 border-r border-slate-800 p-3 space-y-1 shrink-0">
          {SECTIONS.map((s) => {
            const icons: Record<typeof SECTIONS[number], any> = {
              Accounts: ExternalLink, "Brand Kit": Palette, Notifications: Bell, Team: Users, Security: Shield,
            };
            const Icon = icons[s];
            return (
              <button key={s} onClick={() => setActiveSection(s)} className={cn("w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all text-left",
                activeSection === s ? "bg-violet-600/20 text-violet-300 font-medium" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800")}>
                <Icon className="w-4 h-4 shrink-0" />
                {s}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">

          {activeSection === "Accounts" && (
            <div className="max-w-xl space-y-3">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-white">Connected Platforms</h2>
                <span className="text-xs text-slate-500">{connectedPlatforms.length} connected</span>
              </div>
              {PLATFORMS_CONNECT.map((p) => {
                const connected = connectedPlatforms.includes(p.id);
                const healthColor =
                  p.health === "healthy" ? "text-emerald-400" :
                  p.health === "expiring" ? "text-amber-400" :
                  p.health === "expired" ? "text-red-400" : "";
                const HealthIcon =
                  p.health === "healthy" ? CheckCircle :
                  p.health === "expiring" ? AlertTriangle :
                  XCircle;

                return (
                  <div key={p.id} className={cn("p-4 rounded-xl border transition-all",
                    connected
                      ? p.health === "expired" ? "border-red-500/20 bg-red-500/5"
                      : p.health === "expiring" ? "border-amber-500/20 bg-amber-500/5"
                      : "border-emerald-500/20 bg-emerald-500/5"
                      : "border-slate-700 bg-slate-800/40")}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl leading-none">{p.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{p.label}</p>
                        {connected && p.username ? (
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-slate-400">{p.username}</span>
                            <span className="text-slate-700">·</span>
                            <span className="text-xs text-slate-400">{p.followers} followers</span>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500">{p.description}</p>
                        )}
                      </div>

                      {connected ? (
                        <div className="flex items-center gap-2 shrink-0">
                          {p.health && p.health !== "healthy" && (
                            <button
                              onClick={() => reconnectPlatform(p.id)}
                              className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors"
                            >
                              <RefreshCw className="w-3 h-3" />
                              {p.health === "expired" ? "Reconnect" : "Refresh"}
                            </button>
                          )}
                          <button
                            onClick={() => disconnectPlatform(p.id)}
                            className="text-xs text-slate-500 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-red-500/10"
                          >
                            Disconnect
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => connectPlatform(p.id)} className="btn-secondary text-xs flex items-center gap-1.5 shrink-0">
                          <ExternalLink className="w-3.5 h-3.5" /> Connect
                        </button>
                      )}
                    </div>

                    {connected && p.health && (
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800/60">
                        <HealthIcon className={cn("w-3 h-3", healthColor)} />
                        <span className={cn("text-xs capitalize", healthColor)}>
                          {p.health === "healthy" ? "Token healthy" :
                           p.health === "expiring" ? "Token expiring soon" : "Token expired"}
                        </span>
                        {p.lastSync && (
                          <>
                            <span className="text-slate-700">·</span>
                            <span className="text-xs text-slate-500">Last synced {p.lastSync}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeSection === "Brand Kit" && (
            <div className="max-w-xl space-y-5">
              <h2 className="text-base font-semibold text-white mb-4">Brand Kit</h2>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Brand Name</label>
                <input className="input" value={brandName} onChange={(e) => setBrandName(e.target.value)} />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Brand Tone of Voice</label>
                <div className="grid grid-cols-2 gap-2">
                  {TONES.map((t) => (
                    <button key={t.id} onClick={() => setBrandTone(t.id)} className={cn("text-left p-3 rounded-xl border transition-all",
                      brandTone === t.id ? "border-violet-500/50 bg-violet-500/10" : "border-slate-700 bg-slate-800/50 hover:border-slate-600")}>
                      <p className="text-sm font-medium text-white mb-0.5">{t.label}</p>
                      <p className="text-xs text-slate-400">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <AccentColorPicker />

              <button className="btn-primary" onClick={() => toast.success("Brand kit saved!")}>Save Brand Kit</button>
            </div>
          )}

          {activeSection === "Notifications" && (
            <div className="max-w-xl space-y-4">
              <h2 className="text-base font-semibold text-white mb-4">Notification Preferences</h2>
              {[
                { label: "Post published", desc: "When a scheduled post goes live", enabled: true },
                { label: "Post failed", desc: "When a post fails to publish", enabled: true },
                { label: "Urgent inbox messages", desc: "When a high-priority DM arrives", enabled: true },
                { label: "Weekly analytics report", desc: "AI-generated weekly performance summary", enabled: true },
                { label: "Viral alert", desc: "When a post exceeds 5× normal engagement velocity", enabled: false },
                { label: "Competitor digest", desc: "Weekly competitor performance summary", enabled: false },
              ].map(({ label, desc, enabled }) => (
                <div key={label} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                  <div>
                    <p className="text-sm font-medium text-white">{label}</p>
                    <p className="text-xs text-slate-400">{desc}</p>
                  </div>
                  <button className={cn("relative w-10 h-5 rounded-full transition-all shrink-0",
                    enabled ? "bg-violet-600" : "bg-slate-700")}>
                    <div className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all",
                      enabled ? "left-5" : "left-0.5")} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeSection === "Team" && <TeamSection />}
          {activeSection === "Security" && <SecuritySection />}
        </div>
      </div>
    </div>
  );
}
