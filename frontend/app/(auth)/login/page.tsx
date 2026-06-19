"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { getErrorMessage } from "@/lib/api";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success("Welcome back!");
      router.push("/dashboard");
    } catch (err) {
      toast.error(getErrorMessage(err, "Invalid email or password"));
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-2.5 mb-8 justify-center">
        <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold text-white">SocialOS</span>
      </div>

      <div className="card">
        <h1 className="text-lg font-bold text-white mb-1">Sign in</h1>
        <p className="text-sm text-slate-400 mb-6">Welcome back to your AI social hub</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Email</label>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="input" placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Password</label>
            <input
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="input" placeholder="••••••••"
            />
          </div>

          <button type="submit" disabled={isLoading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Sign in
          </button>
        </form>

        {/* Demo shortcut */}
        <div className="mt-4 p-3 bg-slate-800 rounded-lg border border-slate-700">
          <p className="text-xs text-slate-400 mb-2">Demo - no backend needed:</p>
          <button
            onClick={() => { setEmail("demo@socialos.app"); setPassword("demo1234"); }}
            className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
          >
            Fill demo credentials →
          </button>
        </div>
      </div>

      <p className="text-center text-sm text-slate-500 mt-5">
        No account?{" "}
        <Link href="/register" className="text-violet-400 hover:text-violet-300 transition-colors">
          Create one
        </Link>
      </p>
    </div>
  );
}
