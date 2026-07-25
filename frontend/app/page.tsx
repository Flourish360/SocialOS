import Link from "next/link";
import {
  Sparkles, BarChart2, Calendar, Inbox, Zap, Image, ArrowRight,
  TrendingUp, Users, Clock, CheckCircle, ShoppingBag, ChevronRight,
} from "lucide-react";
import FeatureCarousel from "@/components/FeatureCarousel";

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI Caption Generator",
    desc: "Generate platform-native captions in any tone: casual, professional, funny, or inspirational. Done in seconds.",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "group-hover:border-violet-500/20",
  },
  {
    icon: Calendar,
    title: "Smart Scheduling",
    desc: "Auto-queue posts to publish at your peak engagement windows across every platform simultaneously.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "group-hover:border-blue-500/20",
  },
  {
    icon: BarChart2,
    title: "Deep Analytics",
    desc: "Track impressions, reach, engagement rate, and ROI. Ask questions in plain English, get instant chart answers.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "group-hover:border-emerald-500/20",
  },
  {
    icon: Inbox,
    title: "Unified Inbox",
    desc: "All your DMs, comments, and mentions in one place. AI suggests replies so you respond 5x faster.",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "group-hover:border-amber-500/20",
  },
  {
    icon: Zap,
    title: "Automation Rules",
    desc: "Build if/then workflows: auto-reply to comments, repost top content, trigger email alerts. No code needed.",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "group-hover:border-rose-500/20",
  },
  {
    icon: Image,
    title: "Media Library",
    desc: "Centralised asset management with drag-and-drop upload, type filtering, and one-click use in posts.",
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "group-hover:border-sky-500/20",
  },
];

const STATS = [
  { icon: TrendingUp, value: "3.2x",  label: "Average engagement lift" },
  { icon: Clock,      value: "8 hrs", label: "Saved per week" },
  { icon: Users,      value: "10+",   label: "Platforms supported" },
  { icon: CheckCircle,value: "100%",  label: "Free to self-host" },
];

const PLATFORMS = [
  "Instagram", "TikTok", "LinkedIn", "Twitter / X",
  "Facebook", "YouTube", "Threads", "Pinterest",
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Connect your platforms",
    desc: "Link Instagram, TikTok, Twitter, LinkedIn, Facebook, and more in under two minutes. No developer needed.",
    color: "text-violet-400",
  },
  {
    step: "02",
    title: "Let AI handle the content",
    desc: "SocialOS writes your captions, picks the best time to post, and queues everything automatically.",
    color: "text-blue-400",
  },
  {
    step: "03",
    title: "Watch your audience grow",
    desc: "Track what is working with real-time analytics. Ask questions in plain English, get chart answers in seconds.",
    color: "text-emerald-400",
  },
];

const TESTIMONIALS = [
  {
    quote: "SocialOS replaced three separate tools. Our engagement went up 40% in the first month alone.",
    name: "Maya R.",
    role: "Brand Manager",
    initials: "MR",
    bg: "bg-violet-500/20",
    text: "text-violet-300",
  },
  {
    quote: "The AI captions save me two hours every morning. I just review, approve, and schedule. Done.",
    name: "James O.",
    role: "Content Creator",
    initials: "JO",
    bg: "bg-blue-500/20",
    text: "text-blue-300",
  },
  {
    quote: "Our Shopify store now auto-posts every sale and new product drop. Zero manual work involved.",
    name: "Priya K.",
    role: "E-commerce Founder",
    initials: "PK",
    bg: "bg-emerald-500/20",
    text: "text-emerald-300",
  },
];

const ECOM_BULLETS = [
  "New product listings posted automatically on publish",
  "Sale announcements with 7 smart caption templates",
  "Duplicate-safe: the same order never posts twice",
  "Works with any stack via two REST endpoints",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0b0f1a] text-white">

      {/* Announcement bar */}
      <div className="bg-violet-600/10 border-b border-violet-500/15 text-center py-2 px-4">
        <span className="text-xs text-violet-300">
          <span className="font-semibold">New:</span> E-commerce API: auto-post products and sales from any store.{" "}
          <Link href="/docs/ecommerce" className="underline underline-offset-2 hover:text-white transition-colors font-medium">
            View docs
          </Link>
        </span>
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-[#0b0f1a]/90 backdrop-blur-md border-b border-white/[0.05]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/icon.svg" alt="SocialOS" className="w-7 h-7 rounded-lg" />
            <span className="font-semibold text-white tracking-tight">SocialOS</span>
          </div>
          <div className="hidden sm:flex items-center gap-7 text-sm text-slate-400">
            <Link href="#how-it-works" className="hover:text-white transition-colors">How it works</Link>
            <Link href="#features" className="hover:text-white transition-colors">Features</Link>
            <Link href="/docs/ecommerce" className="hover:text-white transition-colors">API Docs</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors px-4 py-2">
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
      <section className="pt-20 pb-24 px-6 relative overflow-hidden">
        {/* Background glows */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_-5%,rgba(124,58,237,0.18),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_80%_60%,rgba(79,70,229,0.08),transparent)]" />

        <div className="relative max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center min-h-[520px]">

          {/* Left: copy */}
          <div>
            <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-3 py-1 text-xs text-violet-300 font-medium mb-6">
              <Sparkles className="w-3 h-3" />
              Powered by Claude AI
            </div>

            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-white mb-6 leading-[1.08]">
              Your entire
              <br />
              social media
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-violet-300 to-indigo-400">
                run by AI
              </span>
            </h1>

            <p className="text-lg text-slate-400 mb-8 leading-relaxed max-w-lg">
              SocialOS writes your captions, schedules posts at peak hours, replies to DMs, and shows you exactly
              what is working, all from one dashboard.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-6 py-3.5 rounded-xl font-medium transition-colors text-base shadow-lg shadow-violet-600/20"
              >
                Start free, no credit card
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 bg-white/[0.05] hover:bg-white/10 border border-white/[0.09] text-slate-300 px-6 py-3.5 rounded-xl font-medium transition-colors text-base"
              >
                Sign in to dashboard
              </Link>
            </div>
            <p className="text-xs text-slate-600">Open source. MIT license. Self-hostable.</p>
          </div>

          {/* Right: product mock */}
          <div className="relative hidden lg:block">

            {/* Main card: caption generator */}
            <div className="relative bg-[#111827] border border-white/[0.09] rounded-2xl p-5 shadow-2xl shadow-black/40">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-violet-500/20 rounded-md flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                </div>
                <span className="text-xs font-semibold text-violet-400 tracking-wide">AI Caption Generator</span>
              </div>

              <div className="bg-[#0d1117] border border-white/[0.05] rounded-lg px-3 py-2.5 mb-3 text-sm text-slate-300">
                Limited drop: handmade ceramic mugs ✦
              </div>

              <div className="flex gap-2 mb-4">
                {["Instagram", "TikTok", "LinkedIn"].map((p) => (
                  <span key={p} className="text-xs bg-violet-500/10 border border-violet-500/20 text-violet-300 rounded-full px-2.5 py-1">
                    {p}
                  </span>
                ))}
              </div>

              <div className="space-y-2.5">
                <div className="bg-white/[0.03] border border-white/[0.07] rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Instagram</span>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Poured with intention. Each mug is one of a kind. Once it is gone, it is gone. Link in bio.
                  </p>
                  <p className="text-xs text-violet-400 mt-1">#ceramics #handmade #limitededition</p>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.07] rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">TikTok</span>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    POV: you finally found the perfect morning mug. limited batch, grab yours before it sells out.
                  </p>
                </div>
              </div>

              <div className="mt-3 bg-violet-600/15 border border-violet-500/25 text-violet-300 text-xs py-2 rounded-lg text-center font-medium animate-pulse">
                ✦ Generating LinkedIn caption...
              </div>
            </div>

            {/* Floating: engagement stats */}
            <div className="absolute -bottom-5 -left-10 bg-[#0f172a] border border-white/[0.08] rounded-xl p-4 shadow-xl">
              <p className="text-[10px] text-slate-500 mb-2.5 uppercase tracking-wider">This week</p>
              <div className="flex items-end gap-1 mb-2.5" style={{ height: "32px" }}>
                {[30, 42, 36, 55, 50, 68, 72].map((h, i) => (
                  <div
                    key={i}
                    style={{ height: `${(h / 72) * 100}%` }}
                    className={`w-4 rounded-sm ${i === 6 ? "bg-emerald-500" : "bg-white/[0.08]"}`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                <span className="text-xs text-emerald-400 font-semibold">+28% reach</span>
              </div>
            </div>

            {/* Floating: best time */}
            <div className="absolute -top-4 -right-5 bg-[#0f172a] border border-white/[0.08] rounded-xl p-3.5 shadow-xl">
              <div className="flex items-center gap-2 mb-1.5">
                <Clock className="w-3 h-3 text-blue-400" />
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Next post</span>
              </div>
              <p className="text-sm font-bold text-white">Wed 11 AM</p>
              <p className="text-xs text-blue-400 mt-0.5">Engagement score: 94</p>
            </div>

          </div>
        </div>
      </section>

      {/* Platform strip */}
      <section className="py-10 px-6 border-y border-white/[0.04] bg-white/[0.015]">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs text-slate-600 uppercase tracking-widest mb-5">Works with every platform</p>
          <div className="flex flex-wrap justify-center gap-2">
            {PLATFORMS.map((p) => (
              <span
                key={p}
                className="px-4 py-1.5 bg-white/[0.04] border border-white/[0.07] rounded-full text-sm text-slate-400 hover:text-slate-200 hover:border-white/15 transition-colors cursor-default"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Feature carousel */}
      <FeatureCarousel />

      {/* Stats */}
      <section className="py-20 px-6 border-y border-white/[0.04] bg-white/[0.015]">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6">
          {STATS.map(({ icon: Icon, value, label }) => (
            <div key={label} className="text-center group">
              <div className="w-11 h-11 bg-violet-500/10 group-hover:bg-violet-500/18 rounded-xl flex items-center justify-center mx-auto mb-3 transition-colors">
                <Icon className="w-5 h-5 text-violet-400" />
              </div>
              <div className="text-4xl font-extrabold text-white mb-1 tracking-tight">{value}</div>
              <div className="text-sm text-slate-500">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white mb-3">Up and running in minutes</h2>
            <p className="text-slate-400 max-w-md mx-auto">
              No complex setup. No developer required. Just connect, configure, and go.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-10">
            {HOW_IT_WORKS.map(({ step, title, desc, color }) => (
              <div key={step}>
                <div className="text-6xl font-black text-white/[0.05] mb-3 leading-none select-none">{step}</div>
                <h3 className={`text-base font-bold mb-2 ${color}`}>{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section id="features" className="pb-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white mb-3">Everything you need. Nothing you don&apos;t.</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              One platform to compose, schedule, analyse, and automate your entire social presence.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc, color, bg, border }) => (
              <div
                key={title}
                className={`bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 hover:bg-white/[0.04] transition-all group ${border}`}
              >
                <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <h3 className="font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* E-commerce integration */}
      <section className="py-24 px-6 border-y border-white/[0.04] bg-white/[0.015]">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1 text-xs text-emerald-400 font-medium mb-5">
              <ShoppingBag className="w-3 h-3" />
              E-commerce Integration
            </div>
            <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
              Auto-post every product drop and sale
            </h2>
            <p className="text-slate-400 mb-6 leading-relaxed">
              Connect your Shopify, WooCommerce, or any custom store via two API endpoints. When a product goes
              live or an order is confirmed, SocialOS generates the caption and posts across all platforms instantly.
            </p>
            <ul className="space-y-3 mb-8">
              {ECOM_BULLETS.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-slate-300">
                  <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/docs/ecommerce"
              className="inline-flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
            >
              View API docs
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Code preview */}
          <div className="bg-[#080f1a] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl shadow-black/30">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.05] bg-white/[0.02]">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
              </div>
              <span className="text-xs text-slate-500 ml-1 font-mono">webhook.js</span>
            </div>
            <pre className="p-6 text-xs leading-7 font-mono overflow-x-auto">
              <span className="text-slate-600">{"// Fires when an order is confirmed"}</span>{"\n"}
              <span className="text-blue-400">await</span>
              <span className="text-slate-200"> fetch(</span>
              <span className="text-emerald-400">"/api/ecommerce/sale"</span>
              <span className="text-slate-200">, {"{"}</span>{"\n"}
              {"  "}
              <span className="text-violet-300">order_id</span>
              <span className="text-slate-500">:     </span>
              <span className="text-slate-200">order.id,</span>{"\n"}
              {"  "}
              <span className="text-violet-300">order_status</span>
              <span className="text-slate-500">: </span>
              <span className="text-emerald-400">"confirmed"</span>
              <span className="text-slate-200">,</span>{"\n"}
              {"  "}
              <span className="text-violet-300">product_name</span>
              <span className="text-slate-500">: </span>
              <span className="text-slate-200">item.name,</span>{"\n"}
              {"  "}
              <span className="text-violet-300">price</span>
              <span className="text-slate-500">:        </span>
              <span className="text-slate-200">item.price,</span>{"\n"}
              {"  "}
              <span className="text-violet-300">action</span>
              <span className="text-slate-500">:       </span>
              <span className="text-emerald-400">"post_now"</span>
              <span className="text-slate-200">,</span>{"\n"}
              <span className="text-slate-200">{"}"});</span>{"\n\n"}
              <span className="text-slate-600">{"// SocialOS handles the rest:"}</span>{"\n"}
              <span className="text-slate-600">{"// generates caption, posts to all platforms"}</span>
            </pre>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white mb-3">Loved by creators and brands</h2>
            <p className="text-slate-400">From solo creators to growing e-commerce brands.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map(({ quote, name, role, initials, bg, text }) => (
              <div key={name} className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 flex flex-col">
                <p className="text-sm text-slate-300 leading-relaxed mb-6 flex-1">&ldquo;{quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${bg} ${text}`}>
                    {initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{name}</p>
                    <p className="text-xs text-slate-500">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div
            className="relative rounded-3xl overflow-hidden p-12 text-center border border-violet-500/20"
            style={{
              background: "linear-gradient(135deg, rgba(124,58,237,0.14) 0%, rgba(79,70,229,0.10) 50%, rgba(16,185,129,0.07) 100%)",
            }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(124,58,237,0.12),transparent)]" />
            <div className="relative">
              <h2 className="text-4xl font-bold text-white mb-4">Ready to grow smarter?</h2>
              <p className="text-slate-400 mb-8 max-w-md mx-auto leading-relaxed">
                Create your account in 30 seconds. Free to use, open source, and self-hostable.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-8 py-4 rounded-xl font-medium transition-colors text-base shadow-xl shadow-violet-600/25"
              >
                Create your free account
                <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-xs text-slate-600 mt-5">No credit card. MIT license. Self-hostable.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.05] py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <img src="/icon.svg" alt="SocialOS" className="w-5 h-5 rounded" />
            SocialOS, MIT License
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <Link href="/docs/ecommerce" className="hover:text-slate-300 transition-colors">API Docs</Link>
            <Link href="/login"          className="hover:text-slate-300 transition-colors">Sign in</Link>
            <Link href="/register"       className="hover:text-slate-300 transition-colors">Register</Link>
            <Link href="/terms"          className="hover:text-slate-300 transition-colors">Terms</Link>
            <Link href="/privacy"        className="hover:text-slate-300 transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
