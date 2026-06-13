"use client";
import { useState, useRef, useEffect } from "react";
import { Sparkles, X, Send, Loader2, RefreshCw } from "lucide-react";
import { analyticsApi, aiApi } from "@/lib/api";
import { useUIStore } from "@/store/ui";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const QUICK_PROMPTS = [
  "Which platform grew the most?",
  "What are my top posts?",
  "Generate an Instagram caption",
  "Best posting time today?",
];

export default function AIAssistant() {
  const { aiPanelOpen, setAIPanelOpen } = useUIStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I'm your AI social media analyst. Ask me about your performance, or say \"generate a caption\" to create content.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (aiPanelOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [aiPanelOpen]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", content: trimmed },
    ]);
    setInput("");
    setLoading(true);

    try {
      let response = "";

      const lower = trimmed.toLowerCase();
      if (
        lower.includes("caption") ||
        lower.includes("generate") ||
        lower.includes("write a post") ||
        lower.includes("create content")
      ) {
        const topic =
          trimmed
            .replace(/generate|write|create|a post|content|caption|for|about|an?/gi, "")
            .trim() || "our latest update";
        const data = await aiApi.generateCaption({
          topic,
          platform: "instagram",
          tone: "casual",
          include_hashtags: true,
          keywords: [],
        });
        response = `Here's a caption:\n\n"${data.caption}"\n\n${data.hashtags?.join(" ")}\n\n✦ Predicted engagement: ${data.predicted_engagement_score}/100`;
      } else if (lower.includes("hashtag")) {
        const data = await aiApi.hashtags({
          caption: trimmed,
          platform: "instagram",
          count: 10,
        });
        response = `Suggested hashtags:\n\n${data.hashtags?.join(" ")}\n\nTrending: ${data.trending?.join(" ")}`;
      } else {
        const data = await analyticsApi.ask(trimmed);
        response = data.answer;
      }

      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: "assistant", content: response },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "Something went wrong. Make sure the backend is running and try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!aiPanelOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
        onClick={() => setAIPanelOpen(false)}
      />

      <div className="fixed right-0 top-0 h-full w-[380px] bg-slate-900 border-l border-slate-800 flex flex-col z-50 shadow-2xl animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800 shrink-0">
          <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">AI Assistant</p>
            <p className="text-xs text-slate-400">Analytics &amp; content copilot</p>
          </div>
          <button
            onClick={() => {
              setMessages([
                {
                  id: "welcome",
                  role: "assistant",
                  content:
                    "Hi! I'm your AI social media analyst. Ask me about your performance, or say \"generate a caption\" to create content.",
                },
              ]);
            }}
            className="text-slate-600 hover:text-slate-400 transition-colors p-1"
            title="Clear conversation"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setAIPanelOpen(false)}
            className="text-slate-600 hover:text-slate-300 transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn("flex gap-2.5", msg.role === "user" ? "flex-row-reverse" : "")}
            >
              {msg.role === "assistant" && (
                <div className="w-6 h-6 bg-violet-600/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-3 h-3 text-violet-400" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
                  msg.role === "user"
                    ? "bg-violet-600 text-white rounded-tr-sm"
                    : "bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700",
                )}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-2.5">
              <div className="w-6 h-6 bg-violet-600/20 rounded-full flex items-center justify-center shrink-0">
                <Sparkles className="w-3 h-3 text-violet-400 animate-pulse" />
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1 items-center">
                  {[0, 150, 300].map((delay) => (
                    <div
                      key={delay}
                      className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Quick prompts — only when conversation is fresh */}
        {messages.length <= 1 && !loading && (
          <div className="px-4 pb-3 flex flex-wrap gap-1.5 shrink-0">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => sendMessage(p)}
                className="text-xs bg-slate-800 border border-slate-700 hover:border-violet-500/40 hover:text-violet-300 text-slate-400 rounded-full px-3 py-1.5 transition-all"
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-slate-800 shrink-0">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              className="input flex-1 text-sm"
              placeholder="Ask about analytics or generate content…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              className="btn-primary p-2.5 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
