"use client";
import { useState } from "react";
import { Sparkles, CheckCircle, ArrowRight, Users, Target, Zap, X } from "lucide-react";
import { cn } from "@/lib/utils";

const PLATFORMS = [
  { id: "instagram", label: "Instagram", emoji: "📸" },
  { id: "twitter", label: "Twitter/X", emoji: "🐦" },
  { id: "linkedin", label: "LinkedIn", emoji: "💼" },
  { id: "tiktok", label: "TikTok", emoji: "🎵" },
  { id: "facebook", label: "Facebook", emoji: "🔵" },
  { id: "youtube", label: "YouTube", emoji: "▶️" },
];

const GOALS = [
  { id: "brand", label: "Build brand awareness", icon: Sparkles },
  { id: "leads", label: "Generate leads", icon: Target },
  { id: "community", label: "Grow a community", icon: Users },
  { id: "automation", label: "Automate posting", icon: Zap },
];

const FREQ_OPTIONS = ["1–3 posts/week", "4–7 posts/week", "2+ posts/day"];

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [postFreq, setPostFreq] = useState("4–7 posts/week");
  const [teamEmail, setTeamEmail] = useState("");

  const togglePlatform = (id: string) =>
    setSelectedPlatforms((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  const toggleGoal = (id: string) =>
    setSelectedGoals((g) => g.includes(id) ? g.filter((x) => x !== id) : [...g, id]);

  const steps = [
    {
      title: "Welcome to SocialOS",
      subtitle: "Let's get you set up in under a minute.",
      icon: <div className="w-14 h-14 bg-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Sparkles className="w-7 h-7 text-white" />
      </div>,
      content: (
        <div className="text-center space-y-3">
          <p className="text-slate-300 text-sm leading-relaxed">
            SocialOS manages all your social accounts in one place — scheduling, analytics, AI writing, and automation.
          </p>
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { label: "Platforms", value: "8+" },
              { label: "AI tools", value: "12" },
              { label: "Time saved", value: "10h/wk" },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-800 rounded-xl p-3 border border-slate-700">
                <p className="text-xl font-bold text-violet-400">{value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      ),
      canContinue: true,
    },
    {
      title: "Which platforms do you manage?",
      subtitle: "Select all that apply — you can add more later.",
      icon: null,
      content: (
        <div className="grid grid-cols-2 gap-2">
          {PLATFORMS.map((p) => {
            const selected = selectedPlatforms.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => togglePlatform(p.id)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                  selected
                    ? "border-violet-500/60 bg-violet-500/10"
                    : "border-slate-700 bg-slate-800/50 hover:border-slate-600",
                )}
              >
                <span className="text-xl leading-none">{p.emoji}</span>
                <span className="text-sm font-medium text-white">{p.label}</span>
                {selected && <CheckCircle className="w-4 h-4 text-violet-400 ml-auto" />}
              </button>
            );
          })}
        </div>
      ),
      canContinue: selectedPlatforms.length > 0,
    },
    {
      title: "What are your goals?",
      subtitle: "We'll tailor your AI recommendations.",
      icon: null,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {GOALS.map(({ id, label, icon: Icon }) => {
              const selected = selectedGoals.includes(id);
              return (
                <button
                  key={id}
                  onClick={() => toggleGoal(id)}
                  className={cn(
                    "flex flex-col items-start gap-2 p-4 rounded-xl border text-left transition-all",
                    selected
                      ? "border-violet-500/60 bg-violet-500/10"
                      : "border-slate-700 bg-slate-800/50 hover:border-slate-600",
                  )}
                >
                  <Icon className={cn("w-5 h-5", selected ? "text-violet-400" : "text-slate-400")} />
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
      canContinue: selectedGoals.length > 0,
    },
    {
      title: "Invite your team",
      subtitle: "Skip this if you're flying solo.",
      icon: null,
      content: (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="colleague@example.com"
              value={teamEmail}
              onChange={(e) => setTeamEmail(e.target.value)}
            />
            <button
              className="btn-secondary text-sm shrink-0"
              onClick={() => { if (teamEmail.includes("@")) setTeamEmail(""); }}
            >
              Add
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Your teammates will get an email invite to join this workspace.
          </p>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <p className="text-xs text-slate-400 font-medium mb-2">Your workspace is ready with:</p>
            <ul className="space-y-1.5">
              {[
                `${selectedPlatforms.length} platform${selectedPlatforms.length !== 1 ? "s" : ""} connected`,
                `Goal: ${selectedGoals[0] ? GOALS.find(g => g.id === selectedGoals[0])?.label : "—"}`,
                `Posting frequency: ${postFreq}`,
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ),
      canContinue: true,
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;
  const progress = ((step + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-slate-800">
          <div
            className="h-1 bg-gradient-to-r from-violet-600 to-blue-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-6">
          {/* Step indicator */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex gap-1.5">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i <= step ? "bg-violet-500" : "bg-slate-700",
                    i === step ? "w-6" : "w-1.5",
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-slate-500">
              {step + 1} of {steps.length}
            </span>
          </div>

          {/* Header */}
          {current.icon}
          <h2 className="text-lg font-bold text-white mb-1">{current.title}</h2>
          <p className="text-sm text-slate-400 mb-5">{current.subtitle}</p>

          {/* Content */}
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
              <X className="w-3.5 h-3.5" /> Skip setup
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
            {isLast ? "Get started" : "Continue"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
