"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Terminal,
  Video,
  TrendingUp,
  Moon,
  Smile,
  Star,
  Lightbulb,
  Calendar,
  Search,
  Sparkles,
  RefreshCw,
  PlusCircle,
  Trophy,
  Utensils,
  IndianRupee,
} from "lucide-react";

interface DailyStatus {
  id: string;
  date: string;
  statusText?: string;
  tasks?: string[];
  study?: {
    hours: number;
    subject: string;
    questions: number;
    mock?: string;
  };
  project?: {
    hours: number;
    tasks: string[];
  };
  content?: {
    videos?: number;
    posts?: number;
  };
  health?: {
    sleep: number;
    healthyEating: number;
  };
  finance?: {
    expense: number;
    income: number;
  };
  mood?: number;
  bestMoment?: string;
  lessonLearned?: string;
  updatedAt: string;
}

interface FuturePlan {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  category: "academic" | "business" | "community" | "general";
  status: "planned" | "in-progress" | "completed";
}

interface Props {
  initialStatuses: DailyStatus[];
  futurePlans: FuturePlan[];
}

// ─── Stat mini-card ────────────────────────────────────────────────────────────
function StatPill({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${color} bg-white/2`}>
      <span className="shrink-0">{icon}</span>
      <div className="min-w-0">
        <div className="text-[10px] text-brand-500 font-mono uppercase tracking-wider leading-none">{label}</div>
        <div className="text-sm font-bold text-white leading-tight mt-0.5">{value}</div>
      </div>
    </div>
  );
}

// ─── Log section row ───────────────────────────────────────────────────────────
function SectionRow({ icon, label, color, children }: { icon: React.ReactNode; label: string; color: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-[10px] font-mono uppercase tracking-widest text-brand-500 block mb-1">{label}</span>
        {children}
      </div>
    </div>
  );
}

export default function StatusDashboardClient({ initialStatuses, futurePlans }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statuses, setStatuses] = useState<DailyStatus[]>(initialStatuses);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLatest = async (showIndicator = false) => {
    if (showIndicator) setRefreshing(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://hiinishant-backend.onrender.com";
      const res = await fetch(`${backendUrl}/api/status`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setStatuses(data);
      }
    } catch {
      // Keep existing data on failure
    } finally {
      if (showIndicator) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLatest();
    const interval = setInterval(() => fetchLatest(), 30_000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredStatuses = statuses.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (s.statusText || "").toLowerCase().includes(q) ||
      (s.date || "").toLowerCase().includes(q) ||
      (s.study?.subject || "").toLowerCase().includes(q) ||
      (s.bestMoment || "").toLowerCase().includes(q) ||
      (s.lessonLearned || "").toLowerCase().includes(q) ||
      (s.tasks || []).some((t) => t.toLowerCase().includes(q)) ||
      (s.project?.tasks || []).some((t) => t.toLowerCase().includes(q))
    );
  });

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        weekday: "long", year: "numeric", month: "short", day: "numeric",
      });
    } catch { return dateStr; }
  };

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString("en-IN", {
        hour: "2-digit", minute: "2-digit", hour12: true,
      }) + " IST";
    } catch { return ""; }
  };

  const moodEmoji = (m: number) =>
    m >= 9 ? "🤩" : m >= 7 ? "😊" : m >= 5 ? "😐" : "😔";

  const renderEatStars = (r: number) => {
    const active = Math.min(Math.max(0, r), 5);
    const inactive = 5 - active;
    return (
      <span className="inline-flex items-center leading-none select-none text-[13px] tracking-tight">
        <span className="text-amber-400">{"★".repeat(active)}</span>
        <span className="text-zinc-700">{"★".repeat(inactive)}</span>
      </span>
    );
  };

  // Aggregate stats
  const totalStudyHours = statuses.reduce((a, s) => a + (s.study?.hours || 0), 0);
  const totalDevHours   = statuses.reduce((a, s) => a + (s.project?.hours || 0), 0);
  const sleepArr = statuses.filter((s) => s.health?.sleep);
  const avgSleep = sleepArr.length
    ? (sleepArr.reduce((a, s) => a + (s.health?.sleep || 0), 0) / sleepArr.length).toFixed(1)
    : "—";
  const moodArr = statuses.filter((s) => s.mood);
  const avgMood = moodArr.length
    ? (moodArr.reduce((a, s) => a + (s.mood || 0), 0) / moodArr.length).toFixed(1)
    : "—";

  const isStructured = (s: DailyStatus) =>
    !!(s.study || s.project || s.content || s.health || s.finance || s.bestMoment || s.lessonLearned);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden py-20 lg:py-28">
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-accent/3 rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse-slow" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.005)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.005)_1px,transparent_1px)] bg-[size:72px_72px] pointer-events-none -z-20 opacity-30" />

      <div className="max-w-2xl mx-auto px-5 relative z-10 space-y-8">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-accent/25 bg-accent/5 text-[10px] font-bold text-accent uppercase tracking-wider">
              <Sparkles className="w-3 h-3 animate-spin-slow" />
              Nishant Live Updates
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Daily Workspace <span className="text-gradient">Activity Log</span>
            </h1>
            <p className="text-brand-400 text-sm max-w-lg leading-relaxed">
              Real-time tracker — study blocks, coding commits, content, health habits &amp; reflections. Updated daily.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-xs text-brand-300 hover:text-white border border-white/8 bg-white/2 hover:bg-white/5 px-4 py-2 rounded-xl transition-all font-semibold hover:border-accent/30"
            >
              <PlusCircle className="w-3.5 h-3.5 text-accent" />
              Admin
            </Link>
          </div>
        </div>


        {/* ── Search ── */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search subjects, tasks, moments, lessons…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950/30 border border-white/5 focus:border-accent/40 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-brand-500 focus:outline-none focus:ring-1 focus:ring-accent/20 transition-all"
          />
        </div>

        {/* ── Log Feed ── */}
        <div className="space-y-5">
          {filteredStatuses.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-white/5 rounded-3xl glass-strong">
              <Search className="w-6 h-6 text-brand-600 mx-auto mb-3" />
              <p className="text-brand-400 text-sm">No matching logs found.</p>
              <p className="text-brand-600 text-xs mt-1">Try a different keyword.</p>
            </div>
          ) : (
            filteredStatuses.map((status) => {
              const structured = isStructured(status);
              const net = (status.finance?.income || 0) - (status.finance?.expense || 0);

              return (
                <div
                  key={status.id}
                  className="rounded-2xl border border-zinc-700/70 hover:border-zinc-500/80 bg-[#09090b]/90 backdrop-blur-xl transition-all duration-300 shadow-lg shadow-black/50 overflow-hidden"
                >
                  <article>
                  {/* ── Card Header ── */}
                  <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-white/5 bg-white/2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-accent shrink-0" />
                      <span className="text-sm font-bold text-white">{formatDate(status.date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {status.mood != null && (
                        <span className="text-xs font-semibold text-amber-400">
                          {moodEmoji(status.mood)} {status.mood}/10
                        </span>
                      )}
                      <span className="text-[10px] text-zinc-300 font-mono shrink-0">{formatTime(status.updatedAt)}</span>
                    </div>
                  </div>

                  {/* ── Card Body ── */}
                  <div className="px-5 py-4 space-y-4">

                    {/* Focus summary */}
                    {status.statusText && (
                      <p className="text-sm text-white font-medium leading-snug border-l-2 border-accent/50 pl-3">
                        {status.statusText}
                      </p>
                    )}

                    {!structured ? (
                      /* Legacy view: plain task list */
                      status.tasks && status.tasks.length > 0 && (
                        <ul className="space-y-1.5 pl-1">
                          {status.tasks.map((task, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-xs text-brand-300">
                              <span className="text-brand-600 mt-1 select-none">▪</span>
                              <span className="leading-relaxed">{task}</span>
                            </li>
                          ))}
                        </ul>
                      )
                    ) : (
                      /* Clean flat rows — no inner boxes */
                      <div className="divide-y divide-white/[0.06]">

                        {/* Study */}
                        {status.study && (
                          <div className="py-2.5 grid grid-cols-[6.5rem_0.75rem_1fr] gap-x-2 gap-y-0 items-center">
                            <span className="text-[10.5px] font-bold text-yellow-400 uppercase tracking-wider font-mono flex items-center gap-1">
                              <BookOpen className="w-3.5 h-3.5 shrink-0" /> Study
                            </span>
                            <span className="text-zinc-600 font-bold text-sm leading-none flex items-center justify-center">→</span>
                            <div className="text-xs text-zinc-300 flex flex-wrap gap-x-3 items-center leading-normal">
                              <span className="font-bold text-white">{status.study.hours}h</span>
                              <span>Subject - <span className="text-white uppercase font-semibold">{status.study.subject || "—"}</span></span>
                              {status.study.questions > 0 && (
                                <span>Practice Qs - <span className="text-white">{status.study.questions} Qs</span></span>
                              )}
                              {status.study.mock && status.study.mock !== "N/A" && status.study.mock !== "" && (
                                <span className="text-amber-400 font-mono font-semibold">Mock: {status.study.mock}</span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Project */}
                        {status.project && (
                          <div className="py-2.5 grid grid-cols-[6.5rem_0.75rem_1fr] gap-x-2 gap-y-0 items-center">
                            <span className="text-[10.5px] font-bold text-yellow-400 uppercase tracking-wider font-mono flex items-center gap-1">
                              <Terminal className="w-3.5 h-3.5 shrink-0" /> Dev
                            </span>
                            <span className="text-zinc-600 font-bold text-sm leading-none flex items-center justify-center">→</span>
                            <div className="text-xs text-zinc-300 flex flex-wrap gap-x-3 items-center leading-normal">
                              <span className="font-bold text-white">{status.project.hours}h</span>
                              {status.project.tasks && status.project.tasks.length > 0 && (
                                <span className="text-zinc-400 flex flex-wrap gap-x-2.5 items-center">
                                  {status.project.tasks.slice(0, 3).map((t, i) => (
                                    <span key={i} className="inline-flex items-center gap-1">
                                      <span className="text-cyan-400 font-bold">▸</span> {t}
                                    </span>
                                  ))}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Content */}
                        {status.content && (
                          <div className="py-2.5 grid grid-cols-[6.5rem_0.75rem_1fr] gap-x-2 gap-y-0 items-center">
                            <span className="text-[10.5px] font-bold text-yellow-400 uppercase tracking-wider font-mono flex items-center gap-1">
                              <Video className="w-3.5 h-3.5 shrink-0" /> Content
                            </span>
                            <span className="text-zinc-600 font-bold text-sm leading-none flex items-center justify-center">→</span>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-300 leading-normal">
                              <span>Youtube video - <span className="font-bold text-white">{status.content.videos || 0}</span></span>
                              <span>Blog - <span className="font-bold text-white">0</span></span>
                              <span>Insta post - <span className="font-bold text-white">{status.content.posts || 0}</span></span>
                            </div>
                          </div>
                        )}

                        {/* Health */}
                        {status.health && (
                          <div className="py-2.5 grid grid-cols-[6.5rem_0.75rem_1fr] gap-x-2 gap-y-0 items-center">
                            <span className="text-[10.5px] font-bold text-yellow-400 uppercase tracking-wider font-mono flex items-center gap-1">
                              <Moon className="w-3.5 h-3.5 shrink-0" /> Health
                            </span>
                            <span className="text-zinc-600 font-bold text-sm leading-none flex items-center justify-center">→</span>
                            <div className="flex items-center gap-4 text-xs">
                              <span><span className="font-bold text-white">{status.health.sleep}h</span> <span className="text-zinc-500">sleep</span></span>
                              <span className="flex items-center gap-1.5 text-zinc-400">Healthy Diet - {renderEatStars(status.health.healthyEating || 5)}</span>
                            </div>
                          </div>
                        )}

                        {/* Finance */}
                        {status.finance && (
                          <div className="py-2.5 grid grid-cols-[6.5rem_0.75rem_1fr] gap-x-2 gap-y-0 items-center">
                            <span className="text-[10.5px] font-bold text-yellow-400 uppercase tracking-wider font-mono flex items-center gap-1">
                              <IndianRupee className="w-3.5 h-3.5 shrink-0" /> Finance
                            </span>
                            <span className="text-zinc-600 font-bold text-sm leading-none flex items-center justify-center">→</span>
                            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs">
                              <span className="text-zinc-400">Income <span className="font-bold text-emerald-400">+₹{status.finance.income || 0}</span></span>
                              <span className="text-zinc-400">Expense <span className="font-bold text-red-400">−₹{status.finance.expense || 0}</span></span>
                              <span className="text-zinc-400">Net <span className={`font-bold ${net >= 0 ? "text-emerald-400" : "text-red-400"}`}>{net >= 0 ? "+" : ""}₹{net}</span></span>
                            </div>
                          </div>
                        )}

                        {/* Best Moment */}
                        {status.bestMoment && (
                          <div className="py-2.5 grid grid-cols-[6.5rem_0.75rem_1fr] gap-x-2 gap-y-0 items-start">
                            <span className="text-[10.5px] font-bold text-yellow-400 uppercase tracking-wider font-mono flex items-center gap-1 pt-0.5">
                              <Star className="w-3.5 h-3.5 shrink-0" /> Best Moments
                            </span>
                            <span className="text-zinc-600 font-bold text-sm leading-none flex items-center justify-center pt-0.5">→</span>
                            <p className="text-xs text-zinc-300 leading-relaxed italic">&ldquo;{status.bestMoment}&rdquo;</p>
                          </div>
                        )}

                        {/* Lesson */}
                        {status.lessonLearned && (
                          <div className="py-2.5 grid grid-cols-[6.5rem_0.75rem_1fr] gap-x-2 gap-y-0 items-start">
                            <span className="text-[10.5px] font-bold text-yellow-400 uppercase tracking-wider font-mono flex items-center gap-1 pt-0.5">
                              <Lightbulb className="w-3.5 h-3.5 shrink-0" /> Lesson
                            </span>
                            <span className="text-zinc-600 font-bold text-sm leading-none flex items-center justify-center pt-0.5">→</span>
                            <p className="text-xs text-zinc-400 leading-relaxed italic">{status.lessonLearned}</p>
                          </div>
                        )}

                      </div>
                    )}
                  </div>
                </article>
              </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
