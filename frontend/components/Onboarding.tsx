"use client";

import { useState } from "react";
import {
  CheckCircle, ArrowRight, Users, Target, Zap, X,
  Sparkles, Calendar, BarChart2, Inbox, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PLATFORMS = [
  { id: "instagram", label: "Instagram", emoji: "📸" },
  { id: "twitter",   label: "Twitter / X", emoji: "🐦" },
  { id: "linkedin",  label: "LinkedIn",    emoji: "💼" },
  { id: "tiktok",    label: "TikTok",      emoji: "🎵" },
  { id: "facebook",  label: "Facebook",    emoji: "🔵" },
  { id: "youtube",   label: "YouTube",     emoji: "▶️" },
];

const GOALS = [
  { id: "brand",      label: "Build brand awareness", icon: Sparkles },
  { id: "leads",      label: "Generate leads",        icon: Target   },
  { id: "community",  label: "Grow a community",      icon: Users    },
  { id: "automation", label: "Automate posting",      icon: Zap      },
];

const FREQ_OPTIONS = ["1–3 posts/week", "4–7 posts/week", "2+ posts/day"];

const TOUR_ITEMS = [
  {
    icon: Sparkles,
    color: "#7c3aed",
    bg: "rgba(124,58,237,0.12)",
    title: "AI Compose",
    desc: "Describe your idea and SocialOS writes platform-native captions, hashtags, and hooks in seconds.",
    href: "/compose",
  },
  {
    icon: Calendar,
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.12)",
    title: "Smart Queue",
    desc: "Posts are auto-scheduled to your peak engagement windows. No guessing required.",
    href: "/queue",
  },
  {
    icon: BarChart2,
    color: "#10b981",
    bg: "rgba(16,185,129,0.12)",
    title: "Analytics",
    desc: "Track follower growth, reach, and engagement. Ask anything in plain English.",
    href: "/analytics",
  },
  {
    icon: Inbox,
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.12)",
    title: "Unified Inbox",
    desc: "All comments and mentions from every platform in one place, with AI-suggested replies.",
    href: "/inbox",
  },
];

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedGoals, setSelectedGoals]         = useState<string[]>([]);
  const [postFreq, setPostFreq]                   = useState("4–7 posts/week");
  const [activeTour, setActiveTour]               = useState(0);

  const togglePlatform = (id: string) =>
    setSelectedPlatforms((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  const toggleGoal = (id: string) =>
    setSelectedGoals((g) => g.includes(id) ? g.filter((x) => x !== id) : [...g, id]);

  const STEPS = [
    // ── 0: Welcome ────────────────────────────────────────────────
    {
      title: "Welcome to SocialOS",
      subtitle: "Your AI-powered social media command centre.",
      canContinue: true,
      content: (
        <div className="text-center space-y-5">
          <div className="flex justify-center">
            <img src="/icon.svg" alt="SocialOS" className="w-16 h-16 rounded-2xl shadow-lg shadow-violet-900/40" />
          </div>
          <p className="text-slate-300 text-sm leading-relaxed max-w-xs mx-auto">
            Write captions, schedule posts, read analytics, and manage every comment — all from one place.
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Platforms",  value: "8+"    },
              { label: "AI tools",   value: "12"    },
              { label: "Time saved", value: "10h/wk" },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-800 rounded-xl p-3 border border-slate-700/60">
                <p className="text-xl font-bold text-violet-400">{value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },

    // ── 1: Platforms ──────────────────────────────────────────────
    {
      title: "Which platforms do you manage?",
      subtitle: "Select all that apply — you can add more later.",
      canContinue: selectedPlatforms.length > 0,
      content: (
        <div className="grid grid-cols-2 gap-2">
          {PLATFORMS.map((p) => {
            const sel = selectedPlatforms.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => togglePlatform(p.id)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                  sel ? "border-violet-500/60 bg-violet-500/10" : "border-slate-700 bg-slate-800/50 hover:border-slate-600",
                )}
              >
                <span className="text-xl leading-none">{p.emoji}</span>
                <span className="text-sm font-medium text-white">{p.label}</span>
                {sel && <CheckCircle className="w-4 h-4 text-violet-400 ml-auto" />}
              </button>
            );
          })}
        </div>
      ),
    },

    // ── 2: Goals ──────────────────────────────────────────────────
    {
      title: "What are your goals?",
      subtitle: "We'll tailor your AI recommendations.",
      canContinue: selectedGoals.length > 0,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {GOALS.map(({ id, label, icon: Icon }) => {
              const sel = selectedGoals.includes(id);
              return (
                <button
                  key={id}
                  onClick={() => toggleGoal(id)}
                  className={cn(
                    "flex flex-col items-start gap-2 p-4 rounded-xl border text-left transition-all",
                    sel ? "border-violet-500/60 bg-violet-500/10" : "border-slate-700 bg-slate-800/50 hover:border-slate-600",
                  )}
                >
                  <Icon className={cn("w-5 h-5", sel ? "text-violet-400" : "text-slate-400")} />
                  <span className="text-sm font-medium text-white leading-tight">{label}</span>
                </button>
              );
            })}
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-2">How often do you post?</p>
            <div className="flex gap-2 flex-wrap">
              {FREQ_OPTIONS.map((f) => (
                <button
                  key={f}
                  onClick={() => setPostFreq(f)}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-lg border transition-all",
                    postFreq === f
                      ? "bg-violet-600 text-white border-violet-600"
                      : "border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600",
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>
      ),
    },

    // ── 3: Feature tour ───────────────────────────────────────────
    {
      title: "Here's what you can do",
      subtitle: "A quick look at the tools waiting for you.",
      canContinue: true,
      content: (
        <div className="space-y-2">
          {TOUR_ITEMS.map((item, i) => {
            const Icon = item.icon;
            const isActive = activeTour === i;
            return (
              <button
                key={item.title}
                onClick={() => setActiveTour(i)}
                className={cn(
                  "w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all",
                  isActive ? "border-slate-600 bg-slate-800" : "border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/60",
                )}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: item.bg }}
                >
                  <Icon style={{ width: "15px", height: "15px", color: item.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white mb-0.5">{item.title}</p>
                  <p
                    className={cn(
                      "text-xs text-slate-400 leading-relaxed overflow-hidden transition-all duration-300",
                      isActive ? "max-h-20 opacity-100" : "max-h-0 opacity-0",
                    )}
                  >
                    {item.desc}
                  </p>
                </div>
                <ChevronRight
                  className={cn(
                    "w-4 h-4 text-slate-500 shrink-0 mt-1 transition-transform",
                    isActive && "rotate-90",
                  )}
                />
              </button>
            );
          })}
        </div>
      ),
    },

    // ── 4: All set ────────────────────────────────────────────────
    {
      title: "You're all set!",
      subtitle: "Your workspace is ready. Let's grow.",
      canContinue: true,
      content: (
        <div className="text-center space-y-5">
          <div className="flex justify-center">
            <div className="relative">
              <img src="/icon.svg" alt="SocialOS" className="w-16 h-16 rounded-2xl" />
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-3 h-3 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 text-left space-y-2">
            <p className="text-xs text-slate-400 font-medium mb-3">Your setup summary</p>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              {selectedPlatforms.length > 0
                ? `${selectedPlatforms.length} platform${selectedPlatforms.length > 1 ? "s" : ""} selected`
                : "Platforms — connect from Settings"}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              {selectedGoals.length > 0
                ? `Goal: ${GOALS.find(g => g.id === selectedGoals[0])?.label}`
                : "No goal set yet"}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              Posting {postFreq}
            </div>
          </div>
          <p className="text-xs text-slate-500">
            First step: head to <span className="text-violet-400">Settings</span> to connect your social accounts.
          </p>
        </div>
      ),
    },
  ];

  const current   = STEPS[step];
  const isLast    = step === STEPS.length - 1;
  const progress  = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden">

        {/* Progress bar */}
        <div className="h-0.5 bg-slate-800">
          <div
            className="h-0.5 bg-gradient-to-r from-violet-600 to-blue-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-6">
          {/* Step dots + counter */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    i < step  ? "bg-violet-500 w-1.5" :
                    i === step ? "bg-violet-500 w-6"   : "bg-slate-700 w-1.5",
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-slate-500">{step + 1} of {STEPS.length}</span>
          </div>

          {/* Title */}
          <h2 className="text-lg font-bold text-white mb-1">{current.title}</h2>
          <p className="text-sm text-slate-400 mb-5">{current.subtitle}</p>

          {/* Body */}
          {current.content}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800">
          {step > 0 ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              Back
            </button>
          ) : (
            <button
              onClick={onComplete}
              className="text-sm text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Skip
            </button>
          )}

          <button
            onClick={isLast ? onComplete : () => setStep((s) => s + 1)}
            disabled={!current.canContinue}
            className={cn(
              "btn-primary flex items-center gap-1.5 text-sm",
              !current.canContinue && "opacity-40 cursor-not-allowed",
            )}
          >
            {isLast ? "Go to dashboard" : "Continue"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
