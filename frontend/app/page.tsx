import Link from "next/link";
import {
  Sparkles, BarChart2, Calendar, Inbox, Zap, Image, ArrowRight,
  TrendingUp, Users, Clock, CheckCircle,
} from "lucide-react";

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI Caption Generator",
    desc: "Generate platform-native captions in any tone - casual, professional, funny, or inspirational - in seconds.",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
  },
  {
    icon: Calendar,
    title: "Smart Scheduling",
    desc: "Auto-queue posts to publish at your peak engagement windows across every platform simultaneously.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: BarChart2,
    title: "Deep Analytics",
    desc: "Track impressions, reach, engagement rate, and ROI. Ask questions in plain English - get instant data answers.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    icon: Inbox,
    title: "Unified Inbox",
    desc: "All your DMs, comments, and mentions in one place. AI suggests replies so you respond 5× faster.",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    icon: Zap,
    title: "Automation Rules",
    desc: "Build if/then workflows: auto-reply to comments, repost top content, trigger email alerts - no code needed.",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
  },
  {
    icon: Image,
    title: "Media Library",
    desc: "Centralised asset management with drag-and-drop upload, type filtering, and one-click use in posts.",
    color: "text-sky-400",
    bg: "bg-sky-500/10",
  },
];

const STATS = [
  { icon: TrendingUp, value: "3.2×", label: "Average engagement lift" },
  { icon: Clock, value: "8 hrs", label: "Saved per week" },
  { icon: Users, value: "10+", label: "Platforms supported" },
  { icon: CheckCircle, value: "100%", label: "Free to self-host" },
];

const PLATFORMS = ["Instagram", "TikTok", "LinkedIn", "Twitter / X", "Facebook", "YouTube", "Threads", "Pinterest"];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0b0f1a] text-white">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-[#0b0f1a]/80 backdrop-blur border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-white tracking-tight">SocialOS</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-slate-400 hover:text-white transition-colors px-4 py-2"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-sm bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg transition-colors font-medium"
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(124,58,237,0.15),transparent)]" />
        <div className="relative max-w-4xl mx-auto">
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-white mb-6 leading-[1.1]">
            Your entire social media
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-blue-400">
              run by AI
            </span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            SocialOS is the open-source AI platform that writes your captions, schedules your posts,
            replies to your DMs, and tells you exactly what's working - all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 rounded-xl font-medium transition-colors text-base"
            >
              Start free - no credit card
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 px-6 py-3 rounded-xl font-medium transition-colors text-base"
            >
              Sign in to dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8">
          {STATS.map(({ icon: Icon, value, label }) => (
            <div key={label} className="text-center">
              <div className="w-10 h-10 bg-violet-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Icon className="w-5 h-5 text-violet-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{value}</div>
              <div className="text-sm text-slate-500">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Everything you need. Nothing you don't.</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              One platform to compose, schedule, analyse, and automate your entire social presence.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc, color, bg }) => (
              <div
                key={title}
                className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors"
              >
                <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <h3 className="font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platforms */}
      <section className="py-16 px-6 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-slate-500 uppercase tracking-widest mb-8">Works with</p>
          <div className="flex flex-wrap justify-center gap-3">
            {PLATFORMS.map((p) => (
              <span
                key={p}
                className="px-4 py-2 bg-white/5 border border-white/8 rounded-full text-sm text-slate-300"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to grow smarter?
          </h2>
          <p className="text-slate-400 mb-8">
            Create your account in 30 seconds. No credit card required. Self-hostable and open source.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-8 py-4 rounded-xl font-medium transition-colors text-base"
          >
            Create your free account
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <div className="w-5 h-5 bg-violet-600 rounded flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            SocialOS - MIT License
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <Link href="/login" className="hover:text-slate-300 transition-colors">Sign in</Link>
            <Link href="/register" className="hover:text-slate-300 transition-colors">Register</Link>
            <Link href="/terms" className="hover:text-slate-300 transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-slate-300 transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
