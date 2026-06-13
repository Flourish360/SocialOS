"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { register, isLoading } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(email, password, name);
      toast.success("Account created!");
      router.push("/");
    } catch {
      toast.error("Could not create account. Try a different email.");
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
        <h1 className="text-lg font-bold text-white mb-1">Create account</h1>
        <p className="text-sm text-slate-400 mb-6">Start managing all your social media with AI</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Full name</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="Jane Smith" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="jane@example.com" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Password</label>
            <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="input" placeholder="Min 8 characters" />
          </div>
          <button type="submit" disabled={isLoading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Create account
          </button>
        </form>
      </div>

      <p className="text-center text-sm text-slate-500 mt-5">
        Already have an account?{" "}
        <Link href="/login" className="text-violet-400 hover:text-violet-300 transition-colors">Sign in</Link>
      </p>
    </div>
  );
}
