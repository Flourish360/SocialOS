"use client";
import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import { automationApi } from "@/lib/api";
import { Send, Loader2, MessageCircle, AlertTriangle, Star, Ban, Mail, MailOpen, AtSign, MessageSquare, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const PLATFORM_EMOJI: Record<string, string> = {
  instagram: "📸", twitter: "🐦", linkedin: "💼", tiktok: "🎵", facebook: "🔵",
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  urgent: { label: "Urgent", color: "badge-negative" },
  opportunity: { label: "Opportunity", color: "badge-positive" },
  general: { label: "General", color: "badge-neutral" },
  spam: { label: "Spam", color: "badge-warning" },
};

const TYPE_TABS = [
  { key: "all", label: "All", icon: MessageCircle },
  { key: "dm", label: "DMs", icon: Mail },
  { key: "comment", label: "Comments", icon: MessageSquare },
  { key: "mention", label: "Mentions", icon: AtSign },
];

const AI_SUGGESTIONS: Record<string, string[]> = {
  urgent: [
    "Hi! We're looking into this right away and will have an update for you shortly. Thank you for your patience.",
    "Thanks for flagging this - our team is on it. We'll get back to you within the hour.",
    "We hear you and we're sorry for the trouble. Let us make this right. Can you DM us your details?",
  ],
  opportunity: [
    "Thanks for reaching out! We'd love to chat. DM us for pricing details.",
    "Hi! Great question. Check out our website for all the details - and let us know if you have more questions!",
    "Hey, thanks for your interest! Our team will be in touch within 24 hours. 🙌",
  ],
  general: [
    "Thanks for your message! We appreciate you reaching out.",
    "Hi there! Thanks so much - this made our day 😊",
    "Hey! We really appreciate you taking the time to write this.",
  ],
  spam: [
    "Thanks for reaching out. We'll review your message.",
  ],
};

export default function InboxPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | undefined>(undefined);
  const [typeTab, setTypeTab] = useState("all");
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    automationApi.inbox(priorityFilter).then(setMessages).finally(() => setLoading(false));
  }, [priorityFilter]);

  const visible = messages.filter((m) => {
    if (typeTab === "dm") return m.type === "dm" || !m.type;
    if (typeTab === "comment") return m.type === "comment";
    if (typeTab === "mention") return m.type === "mention";
    return true;
  });

  const sendReply = async () => {
    if (!reply.trim() || !selected) return;
    setSending(true);
    try {
      await automationApi.reply(selected.id, reply);
      setMessages((prev) => prev.map((m) => m.id === selected.id ? { ...m, replied: true } : m));
      setSelected((s: any) => s ? { ...s, replied: true } : s);
      setReply("");
      toast.success("Reply sent!");
    } catch {
      toast.error("Failed to send");
    } finally {
      setSending(false);
    }
  };

  const toggleRead = (msg: any) => {
    setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, replied: !m.replied } : m));
    if (selected?.id === msg.id) setSelected((s: any) => s ? { ...s, replied: !s.replied } : s);
  };

  const unread = messages.filter((m) => !m.replied).length;
  const urgent = messages.filter((m) => m.priority === "urgent").length;
  const suggestions = AI_SUGGESTIONS[selected?.priority ?? "general"] ?? AI_SUGGESTIONS.general;

  return (
    <div className="flex flex-col flex-1">
      <Header title="Inbox" subtitle={`${unread} unread • ${urgent} urgent`} />
      <div className="flex-1 flex overflow-hidden">

        {/* Left: message list */}
        <div className="w-80 border-r border-slate-800 flex flex-col shrink-0">
          {/* Type tabs */}
          <div className="flex border-b border-slate-800 shrink-0">
            {TYPE_TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTypeTab(key)}
                className={cn(
                  "flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] transition-colors border-b-2",
                  typeTab === key
                    ? "border-violet-500 text-violet-400"
                    : "border-transparent text-slate-500 hover:text-slate-300",
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Priority filters */}
          <div className="p-2.5 border-b border-slate-800 flex flex-wrap gap-1.5">
            {([undefined, "urgent", "opportunity", "general", "spam"] as const).map((f) => (
              <button
                key={f ?? "all"}
                onClick={() => setPriorityFilter(f)}
                className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full border capitalize transition-all",
                  priorityFilter === f
                    ? "bg-violet-600/20 text-violet-300 border-violet-500/40"
                    : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200",
                )}
              >
                {f ?? "All"}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
              </div>
            ) : visible.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-slate-600 gap-2">
                <MessageCircle className="w-6 h-6 opacity-40" />
                <p className="text-xs">No messages</p>
              </div>
            ) : visible.map((msg) => {
              const { color } = PRIORITY_CONFIG[msg.priority] ?? PRIORITY_CONFIG.general;
              return (
                <button
                  key={msg.id}
                  onClick={() => setSelected(msg)}
                  className={cn(
                    "w-full text-left p-3 hover:bg-slate-800/50 transition-colors relative",
                    selected?.id === msg.id && "bg-slate-800/50 border-l-2 border-violet-500",
                    !msg.replied && "bg-slate-800/20",
                  )}
                >
                  {!msg.replied && (
                    <span className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-violet-500" />
                  )}
                  <div className="flex items-start gap-2.5">
                    <span className="text-lg leading-none shrink-0 mt-0.5">{PLATFORM_EMOJI[msg.platform] ?? "💬"}</span>
                    <div className="flex-1 min-w-0 pr-3">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className={cn("text-xs font-semibold truncate", !msg.replied ? "text-white" : "text-slate-400")}>
                          @{msg.sender}
                        </p>
                        <p className="text-[10px] text-slate-600 shrink-0 ml-1">{msg.time}</p>
                      </div>
                      <p className="text-xs text-slate-400 truncate">{msg.message}</p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full border", color)}>{msg.priority}</span>
                        {msg.replied && <span className="text-[10px] text-emerald-400">✓ replied</span>}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Stats bar */}
          <div className="p-3 border-t border-slate-800 flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Users className="w-3 h-3" />
              <span>{messages.length} total</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-violet-400 ml-auto">
              <MailOpen className="w-3 h-3" />
              <span>{messages.filter((m) => m.replied).length} replied</span>
            </div>
          </div>
        </div>

        {/* Right: message detail */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selected ? (
            <>
              {/* Message header */}
              <div className="p-5 border-b border-slate-800 shrink-0">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl shrink-0">
                    {PLATFORM_EMOJI[selected.platform] ?? "💬"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-white">@{selected.sender}</p>
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full border capitalize", PRIORITY_CONFIG[selected.priority]?.color)}>
                        {selected.priority}
                      </span>
                      {selected.replied && (
                        <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                          ✓ replied
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 capitalize">
                      {selected.platform} · {selected.time}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleRead(selected)}
                    className="text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-700 hover:border-slate-600 transition-all shrink-0 flex items-center gap-1.5"
                  >
                    {selected.replied ? <Mail className="w-3 h-3" /> : <MailOpen className="w-3 h-3" />}
                    {selected.replied ? "Mark unread" : "Mark read"}
                  </button>
                </div>
                <div className="mt-3 bg-slate-800/50 rounded-xl p-4 text-sm text-slate-200 leading-relaxed border border-slate-700">
                  {selected.message}
                </div>
              </div>

              {/* AI suggestions */}
              <div className="p-4 border-b border-slate-800 shrink-0">
                <p className="text-xs text-slate-500 mb-2 flex items-center gap-1.5">
                  <span className="text-violet-400">✦</span> Quick reply templates
                </p>
                <div className="space-y-1.5">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => setReply(s)}
                      className="w-full text-left text-xs text-slate-300 bg-slate-800 border border-slate-700 hover:border-violet-500/40 rounded-lg p-2.5 transition-all leading-relaxed"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reply composer */}
              <div className="p-4 mt-auto">
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <textarea
                      className="input w-full resize-none min-h-[80px] text-sm"
                      placeholder={`Reply to @${selected.sender}…`}
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                    />
                    <p className="text-[10px] text-slate-600 mt-1">{reply.length} chars</p>
                  </div>
                  <button
                    onClick={sendReply}
                    disabled={sending || !reply.trim()}
                    className="btn-primary self-end flex items-center gap-1.5 mb-5"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center flex-col gap-3 text-slate-600">
              <MessageCircle className="w-12 h-12 opacity-30" />
              <p className="text-sm">Select a message to view and reply</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
