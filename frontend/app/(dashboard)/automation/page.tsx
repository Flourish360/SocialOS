"use client";
import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import { automationApi } from "@/lib/api";
import {
  Zap, Plus, Power, Clock, Hash, TrendingDown, Calendar, X, Loader2,
  ArrowRight, Bell, RefreshCw, MessageSquare, Mail, Trash2, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const TRIGGER_OPTIONS = [
  { value: "post_likes", label: "Post reaches X likes", icon: Zap, description: "Trigger when a post hits a like threshold" },
  { value: "follower_drop", label: "Followers drop by X%", icon: TrendingDown, description: "Alert when follower count decreases" },
  { value: "comment_keyword", label: "Comment contains keyword", icon: Hash, description: "React to specific words in comments" },
  { value: "schedule", label: "Scheduled / recurring", icon: Calendar, description: "Run on a time-based schedule" },
];

const ACTION_OPTIONS = [
  { value: "auto_reply", label: "Send auto-reply", icon: MessageSquare },
  { value: "repost", label: "Repost to another platform", icon: RefreshCw },
  { value: "notify", label: "Send notification", icon: Bell },
  { value: "email", label: "Send email digest", icon: Mail },
];

const TRIGGER_ICONS: Record<string, any> = {
  post_likes: Zap, follower_drop: TrendingDown, comment_keyword: Hash, schedule: Calendar,
};
const ACTION_ICONS: Record<string, any> = {
  auto_reply: MessageSquare, repost: RefreshCw, notify: Bell, email: Mail,
};

const DEFAULT_RULE = { name: "", trigger_type: "post_likes", action_type: "notify", description: "" };

export default function AutomationPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState(DEFAULT_RULE);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    automationApi.rules().then(setRules).finally(() => setLoading(false));
  }, []);

  const createRule = async () => {
    if (!form.name.trim()) { toast.error("Rule name is required"); return; }
    setSaving(true);
    try {
      const created = await automationApi.createRule({ ...form, is_active: true, run_count: 0, last_run: null });
      setRules((prev) => [...prev, created]);
      setShowNew(false);
      setForm(DEFAULT_RULE);
      toast.success("Rule created!");
    } catch {
      toast.error("Failed to create rule");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (id: string) => {
    try {
      const updated = await automationApi.toggleRule(id);
      setRules((prev) => prev.map((r) => r.id === id ? updated : r));
    } catch {
      toast.error("Failed to update");
    }
  };

  const deleteRule = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
    toast.success("Rule deleted");
  };

  const triggerInfo = TRIGGER_OPTIONS.find((t) => t.value === form.trigger_type);
  const actionInfo = ACTION_OPTIONS.find((a) => a.value === form.action_type);

  return (
    <div className="flex flex-col flex-1">
      <Header title="Automation" subtitle="Workflows that run while you sleep" />
      <div className="flex-1 p-6 overflow-y-auto">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Active rules", value: rules.filter((r) => r.is_active).length, color: "text-emerald-400" },
            { label: "Total runs", value: rules.reduce((s, r) => s + (r.run_count ?? 0), 0), color: "text-blue-400" },
            { label: "Time saved est.", value: `${rules.filter((r) => r.is_active).length * 2}h`, color: "text-violet-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="card">
              <p className={cn("text-2xl font-bold", color)}>{value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Rule builder preview (when creating) */}
        {showNew && (
          <div className="card border-violet-500/20 mb-5">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-violet-400" />
              <span className="text-sm font-semibold text-white">If / Then — Rule Builder</span>
            </div>

            {/* Visual preview */}
            <div className="flex items-center gap-3 mb-5 p-3 bg-slate-800/50 rounded-xl border border-slate-700">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="p-2 bg-violet-600/20 rounded-lg shrink-0">
                  {triggerInfo && <triggerInfo.icon className="w-4 h-4 text-violet-400" />}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">When</p>
                  <p className="text-xs text-slate-200 font-medium">{triggerInfo?.label}</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 shrink-0" />
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="p-2 bg-emerald-600/20 rounded-lg shrink-0">
                  {actionInfo && <actionInfo.icon className="w-4 h-4 text-emerald-400" />}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Then</p>
                  <p className="text-xs text-slate-200 font-medium">{actionInfo?.label}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Rule name</label>
                <input
                  className="input w-full"
                  placeholder="e.g. Viral Post Boost"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Trigger (When)</label>
                  <div className="space-y-1.5">
                    {TRIGGER_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setForm((f) => ({ ...f, trigger_type: opt.value }))}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left transition-all",
                          form.trigger_type === opt.value
                            ? "border-violet-500/60 bg-violet-500/10 text-violet-300"
                            : "border-slate-700 text-slate-400 hover:border-slate-600",
                        )}
                      >
                        <opt.icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-xs">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Action (Then)</label>
                  <div className="space-y-1.5">
                    {ACTION_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setForm((f) => ({ ...f, action_type: opt.value }))}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left transition-all",
                          form.action_type === opt.value
                            ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-300"
                            : "border-slate-700 text-slate-400 hover:border-slate-600",
                        )}
                      >
                        <opt.icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-xs">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Notes (optional)</label>
                <textarea
                  className="input w-full resize-none min-h-[60px] text-sm"
                  placeholder="Any extra context for this rule…"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>

              <div className="flex justify-end gap-2">
                <button onClick={() => { setShowNew(false); setForm(DEFAULT_RULE); }} className="btn-ghost text-sm">Cancel</button>
                <button onClick={createRule} disabled={saving} className="btn-primary flex items-center gap-1.5 text-sm">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Create Rule
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rules list */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Workflow Rules</h2>
            {!showNew && (
              <button onClick={() => setShowNew(true)} className="btn-primary flex items-center gap-1.5 text-xs">
                <Plus className="w-3.5 h-3.5" /> New Rule
              </button>
            )}
          </div>

          <div className="space-y-2">
            {loading ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />Loading…
              </div>
            ) : rules.length === 0 ? (
              <div className="text-center py-10 text-slate-600">
                <Zap className="w-8 h-8 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No rules yet. Create your first workflow.</p>
              </div>
            ) : rules.map((rule) => {
              const TriggerIcon = TRIGGER_ICONS[rule.trigger_type] ?? Zap;
              const ActionIcon = ACTION_ICONS[rule.action_type] ?? Bell;
              const isExpanded = expanded === rule.id;
              return (
                <div
                  key={rule.id}
                  className={cn(
                    "rounded-xl border transition-all",
                    rule.is_active ? "border-slate-700 bg-slate-800/40" : "border-slate-800 bg-slate-900/40 opacity-60",
                  )}
                >
                  {/* Rule row */}
                  <div className="flex items-center gap-3 p-3.5">
                    {/* If/Then visual */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className={cn("p-1.5 rounded-lg shrink-0", rule.is_active ? "bg-violet-600/20" : "bg-slate-800")}>
                        <TriggerIcon className={cn("w-3.5 h-3.5", rule.is_active ? "text-violet-400" : "text-slate-500")} />
                      </div>
                      <ArrowRight className="w-3 h-3 text-slate-700 shrink-0" />
                      <div className={cn("p-1.5 rounded-lg shrink-0", rule.is_active ? "bg-emerald-600/20" : "bg-slate-800")}>
                        <ActionIcon className={cn("w-3.5 h-3.5", rule.is_active ? "text-emerald-400" : "text-slate-500")} />
                      </div>
                      <div className="flex-1 min-w-0 ml-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-white truncate">{rule.name}</p>
                          {rule.is_active && (
                            <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full shrink-0">active</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">
                          {rule.run_count ?? 0} runs
                          {rule.last_run && ` · last run ${rule.last_run}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => setExpanded(isExpanded ? null : rule.id)}
                        className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", isExpanded && "rotate-180")} />
                      </button>
                      <button
                        onClick={() => toggle(rule.id)}
                        className={cn(
                          "flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg border transition-all",
                          rule.is_active
                            ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
                            : "border-slate-700 text-slate-400 bg-slate-800 hover:text-slate-200",
                        )}
                      >
                        <Power className="w-3 h-3" />
                        {rule.is_active ? "On" : "Off"}
                      </button>
                      <button
                        onClick={() => deleteRule(rule.id)}
                        className="p-1.5 text-slate-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-slate-800/50 pt-3">
                      <div className="flex items-stretch gap-3">
                        <div className="flex-1 bg-slate-900 rounded-lg p-3 border border-slate-800">
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">When</p>
                          <div className="flex items-center gap-2">
                            <TriggerIcon className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                            <p className="text-xs text-slate-200">
                              {TRIGGER_OPTIONS.find((t) => t.value === rule.trigger_type)?.label ?? rule.trigger_type}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <ArrowRight className="w-4 h-4 text-slate-600" />
                        </div>
                        <div className="flex-1 bg-slate-900 rounded-lg p-3 border border-slate-800">
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">Then</p>
                          <div className="flex items-center gap-2">
                            <ActionIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <p className="text-xs text-slate-200">
                              {ACTION_OPTIONS.find((a) => a.value === rule.action_type)?.label ?? (rule.description || "Execute action")}
                            </p>
                          </div>
                        </div>
                      </div>
                      {rule.description && (
                        <p className="text-xs text-slate-500 mt-2">{rule.description}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
