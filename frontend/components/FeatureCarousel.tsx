"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Sparkles, Calendar, BarChart2, Inbox, Zap, Image,
  ChevronLeft, ChevronRight, TrendingUp, Heart, MessageCircle,
  Clock, CheckCircle, Send, Hash,
} from "lucide-react";

const SLIDES = [
  {
    tag: "AI Caption Generator",
    icon: Sparkles,
    color: "text-violet-400",
    accent: "#7c3aed",
    accentBg: "rgba(124,58,237,0.12)",
    headline: "Write once, publish everywhere",
    desc: "Describe your post in plain English and SocialOS generates platform-native captions — the right tone, length, and hashtags for each channel.",
    bullets: ["Casual, professional, or funny tones", "Platform-specific formatting", "Hashtag suggestions included"],
    mock: <CaptionMock />,
  },
  {
    tag: "Smart Scheduling",
    icon: Calendar,
    color: "text-blue-400",
    accent: "#3b82f6",
    accentBg: "rgba(59,130,246,0.12)",
    headline: "Post at the exact right moment",
    desc: "SocialOS analyses your audience's activity patterns and scores every time slot so your content lands when followers are most likely to engage.",
    bullets: ["Day-of-week scoring from real data", "Collision avoidance across queued posts", "Industry benchmarks as fallback"],
    mock: <ScheduleMock />,
  },
  {
    tag: "Deep Analytics",
    icon: BarChart2,
    color: "text-emerald-400",
    accent: "#10b981",
    accentBg: "rgba(16,185,129,0.12)",
    headline: "Ask questions, get instant answers",
    desc: "Track follower growth, impressions, reach, and engagement in one dashboard. Ask anything in plain English and get a chart in seconds.",
    bullets: ["Natural language analytics queries", "30-day follower growth history", "Engagement rate by platform"],
    mock: <AnalyticsMock />,
  },
  {
    tag: "Unified Inbox",
    icon: Inbox,
    color: "text-amber-400",
    accent: "#f59e0b",
    accentBg: "rgba(245,158,11,0.12)",
    headline: "Never miss a comment or DM",
    desc: "All your comments, replies, and mentions from every connected platform in a single inbox. AI drafts replies so you can respond in one click.",
    bullets: ["All platforms in one view", "AI-suggested replies", "Mark as done to stay organised"],
    mock: <InboxMock />,
  },
  {
    tag: "Automation Rules",
    icon: Zap,
    color: "text-rose-400",
    accent: "#f43f5e",
    accentBg: "rgba(244,63,94,0.12)",
    headline: "Run your social on autopilot",
    desc: "Build if/then workflows without writing code. Auto-reply to comments, repost top performers, trigger alerts — all while you sleep.",
    bullets: ["No-code rule builder", "Trigger on keywords or events", "Email and in-app alerts"],
    mock: <AutomationMock />,
  },
];

function CaptionMock() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "12px" }}>
        <p style={{ color: "#64748b", fontSize: "0.72rem", marginBottom: "6px" }}>Your topic</p>
        <p style={{ color: "#e2e8f0", fontSize: "0.82rem" }}>Launch day for our new product</p>
      </div>
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        {["Instagram", "TikTok", "LinkedIn"].map(p => (
          <span key={p} style={{ fontSize: "0.68rem", background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", color: "#a78bfa", borderRadius: "20px", padding: "2px 8px" }}>{p}</span>
        ))}
      </div>
      <div style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: "10px", padding: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
          <Sparkles style={{ width: "12px", height: "12px", color: "#a78bfa" }} />
          <span style={{ fontSize: "0.68rem", color: "#a78bfa", fontWeight: 600 }}>Generated caption</span>
        </div>
        <p style={{ color: "#e2e8f0", fontSize: "0.78rem", lineHeight: "1.6" }}>
          It&apos;s here. The thing we&apos;ve been building for months is finally live. Drop a comment if you want early access.
        </p>
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "8px" }}>
          {["#productlaunch", "#buildinpublic", "#startups"].map(h => (
            <span key={h} style={{ fontSize: "0.65rem", color: "#7c3aed" }}>{h}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ScheduleMock() {
  const slots = [
    { day: "Mon", time: "9 AM", score: 72, active: false },
    { day: "Wed", time: "11 AM", score: 94, active: true },
    { day: "Fri", time: "3 PM", score: 88, active: false },
    { day: "Sat", time: "7 PM", score: 61, active: false },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <p style={{ fontSize: "0.7rem", color: "#475569", marginBottom: "4px" }}>Best slots this week</p>
      {slots.map(s => (
        <div key={s.day + s.time} style={{
          display: "flex", alignItems: "center", gap: "10px",
          background: s.active ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.03)",
          border: `1px solid ${s.active ? "rgba(59,130,246,0.35)" : "rgba(255,255,255,0.06)"}`,
          borderRadius: "8px", padding: "8px 12px",
        }}>
          <Clock style={{ width: "12px", height: "12px", color: s.active ? "#60a5fa" : "#475569", flexShrink: 0 }} />
          <span style={{ fontSize: "0.78rem", color: s.active ? "#e2e8f0" : "#64748b", fontWeight: s.active ? 600 : 400, flex: 1 }}>{s.day} {s.time}</span>
          <div style={{ width: "80px", background: "rgba(255,255,255,0.06)", borderRadius: "4px", height: "4px", overflow: "hidden" }}>
            <div style={{ width: `${s.score}%`, height: "100%", background: s.active ? "#3b82f6" : "#334155", borderRadius: "4px" }} />
          </div>
          <span style={{ fontSize: "0.68rem", color: s.active ? "#60a5fa" : "#475569", minWidth: "28px", textAlign: "right" }}>{s.score}</span>
          {s.active && <CheckCircle style={{ width: "12px", height: "12px", color: "#3b82f6" }} />}
        </div>
      ))}
    </div>
  );
}

function AnalyticsMock() {
  const bars = [41, 55, 48, 62, 58, 73, 69, 84, 78, 91, 87, 95];
  const max = 95;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "flex", gap: "10px" }}>
        {[{ label: "Followers", value: "12.4K", delta: "+8.2%" }, { label: "Reach", value: "94.1K", delta: "+14%" }].map(s => (
          <div key={s.label} style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "8px", padding: "10px" }}>
            <p style={{ fontSize: "0.65rem", color: "#64748b", marginBottom: "4px" }}>{s.label}</p>
            <p style={{ fontSize: "1rem", fontWeight: 700, color: "#f1f5f9", marginBottom: "2px" }}>{s.value}</p>
            <p style={{ fontSize: "0.65rem", color: "#10b981" }}>{s.delta}</p>
          </div>
        ))}
      </div>
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "8px", padding: "10px" }}>
        <p style={{ fontSize: "0.65rem", color: "#64748b", marginBottom: "10px" }}>Follower growth (30 days)</p>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "3px", height: "48px" }}>
          {bars.map((v, i) => (
            <div key={i} style={{ flex: 1, height: `${(v / max) * 100}%`, background: i === bars.length - 1 ? "#10b981" : "rgba(16,185,129,0.3)", borderRadius: "2px 2px 0 0" }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function InboxMock() {
  const items = [
    { user: "alex_d", text: "This is exactly what I needed!", platform: "IG", time: "2m", icon: Heart },
    { user: "techblog", text: "How does the scheduling work?", platform: "TT", time: "5m", icon: MessageCircle },
    { user: "sarah.m", text: "Love the new update!", platform: "LI", time: "9m", icon: Heart },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {items.map((item) => (
        <div key={item.user} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "8px", padding: "10px 12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "rgba(245,158,11,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <item.icon style={{ width: "10px", height: "10px", color: "#f59e0b" }} />
              </div>
              <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#e2e8f0" }}>@{item.user}</span>
              <span style={{ fontSize: "0.62rem", background: "rgba(255,255,255,0.06)", borderRadius: "4px", padding: "1px 5px", color: "#64748b" }}>{item.platform}</span>
            </div>
            <span style={{ fontSize: "0.62rem", color: "#475569" }}>{item.time}</span>
          </div>
          <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: "6px" }}>{item.text}</p>
          <div style={{ display: "flex", gap: "6px" }}>
            <button style={{ fontSize: "0.62rem", background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)", color: "#fbbf24", borderRadius: "5px", padding: "2px 8px", cursor: "default" }}>AI Reply</button>
            <button style={{ fontSize: "0.62rem", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#64748b", borderRadius: "5px", padding: "2px 8px", cursor: "default" }}>Done</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function AutomationMock() {
  const rules = [
    { trigger: 'Comment contains "price"', action: "Send DM with pricing link", active: true },
    { trigger: "Post reaches 500 likes", action: "Repost to Stories", active: true },
    { trigger: "New follower gained", action: "Send welcome reply", active: false },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <p style={{ fontSize: "0.7rem", color: "#475569", marginBottom: "2px" }}>Active automations</p>
      {rules.map((r) => (
        <div key={r.trigger} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${r.active ? "rgba(244,63,94,0.2)" : "rgba(255,255,255,0.06)"}`, borderRadius: "8px", padding: "10px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: r.active ? "#f43f5e" : "#334155", flexShrink: 0 }} />
            <span style={{ fontSize: "0.65rem", color: "#64748b" }}>IF</span>
            <span style={{ fontSize: "0.72rem", color: "#e2e8f0", flex: 1 }}>{r.trigger}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "6px", flexShrink: 0 }} />
            <span style={{ fontSize: "0.65rem", color: "#64748b" }}>THEN</span>
            <span style={{ fontSize: "0.72rem", color: r.active ? "#fca5a5" : "#64748b" }}>{r.action}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FeatureCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setActive(a => (a + 1) % SLIDES.length), []);
  const prev = useCallback(() => setActive(a => (a - 1 + SLIDES.length) % SLIDES.length), []);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, 4500);
    return () => clearInterval(id);
  }, [paused, next]);

  const slide = SLIDES[active];
  const Icon = slide.icon;

  return (
    <section className="py-24 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-white mb-4">See how it works</h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Every tool you need to grow, schedule, and automate your social presence.
          </p>
        </div>

        {/* Tab strip */}
        <div className="flex gap-2 justify-center flex-wrap mb-10">
          {SLIDES.map((s, i) => {
            const TabIcon = s.icon;
            return (
              <button
                key={s.tag}
                onClick={() => { setActive(i); setPaused(true); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all"
                style={{
                  background: i === active ? s.accentBg : "rgba(255,255,255,0.04)",
                  border: `1px solid ${i === active ? s.accent + "55" : "rgba(255,255,255,0.08)"}`,
                  color: i === active ? s.accent : "#64748b",
                }}
              >
                <TabIcon style={{ width: "13px", height: "13px" }} />
                {s.tag}
              </button>
            );
          })}
        </div>

        {/* Slide */}
        <div
          className="relative rounded-2xl border border-white/8 overflow-hidden"
          style={{ background: "rgba(255,255,255,0.02)" }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* accent glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(ellipse 60% 50% at 70% 50%, ${slide.accent}18, transparent)` }}
          />

          <div className="relative grid md:grid-cols-2 gap-0 min-h-[360px]">
            {/* Left: text */}
            <div className="flex flex-col justify-center p-10 lg:p-14">
              <div className="flex items-center gap-2 mb-5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: slide.accentBg, border: `1px solid ${slide.accent}40` }}
                >
                  <Icon style={{ width: "16px", height: "16px", color: slide.accent }} />
                </div>
                <span className="text-sm font-semibold" style={{ color: slide.accent }}>{slide.tag}</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 leading-snug">{slide.headline}</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">{slide.desc}</p>
              <ul className="space-y-2">
                {slide.bullets.map(b => (
                  <li key={b} className="flex items-start gap-2 text-sm text-slate-400">
                    <CheckCircle style={{ width: "14px", height: "14px", color: slide.accent, flexShrink: 0, marginTop: "2px" }} />
                    {b}
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: mock UI */}
            <div className="flex items-center justify-center p-8 md:p-10 border-t md:border-t-0 md:border-l border-white/5">
              <div className="w-full max-w-xs">
                {slide.mock}
              </div>
            </div>
          </div>

          {/* Prev / Next */}
          <button
            onClick={() => { prev(); setPaused(true); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors"
          >
            <ChevronLeft style={{ width: "16px", height: "16px", color: "#94a3b8" }} />
          </button>
          <button
            onClick={() => { next(); setPaused(true); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors"
          >
            <ChevronRight style={{ width: "16px", height: "16px", color: "#94a3b8" }} />
          </button>
        </div>

        {/* Dot progress */}
        <div className="flex justify-center gap-2 mt-6">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => { setActive(i); setPaused(true); }}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === active ? "24px" : "6px",
                background: i === active ? slide.accent : "rgba(255,255,255,0.15)",
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
