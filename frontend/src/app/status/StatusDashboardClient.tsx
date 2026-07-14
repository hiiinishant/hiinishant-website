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

  const eatStars = (r: number) =>
    "★".repeat(Math.min(r, 5)) + "☆".repeat(Math.max(0, 5 - r));

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

      <div className="max-w-3xl mx-auto px-5 relative z-10 space-y-10">

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
            <button
              onClick={() => fetchLatest(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 text-xs text-brand-400 hover:text-white border border-white/8 bg-white/2 hover:bg-white/5 px-3 py-2 rounded-xl transition-all font-semibold disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-accent" : ""}`} />
              {refreshing ? "Syncing…" : "Refresh"}
            </button>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-xs text-brand-300 hover:text-white border border-white/8 bg-white/2 hover:bg-white/5 px-4 py-2 rounded-xl transition-all font-semibold hover:border-accent/30"
            >
              <PlusCircle className="w-3.5 h-3.5 text-accent" />
              Admin
            </Link>
          </div>
        </div>

        {/* ── Aggregate Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatPill
            icon={<BookOpen className="w-3.5 h-3.5 text-violet-400" />}
            label="Study Hrs"
            value={`${totalStudyHours}h`}
            color="border-violet-500/15"
          />
          <StatPill
            icon={<Terminal className="w-3.5 h-3.5 text-cyan-400" />}
            label="Dev Hrs"
            value={`${totalDevHours}h`}
            color="border-cyan-500/15"
          />
          <StatPill
            icon={<Moon className="w-3.5 h-3.5 text-orange-400" />}
            label="Avg Sleep"
            value={`${avgSleep}h`}
            color="border-orange-500/15"
          />
          <StatPill
            icon={<Smile className="w-3.5 h-3.5 text-amber-400" />}
            label="Avg Mood"
            value={`${avgMood}/10`}
            color="border-amber-500/15"
          />
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
                  className="relative p-[1px] rounded-3xl bg-gradient-to-b from-white/12 via-white/5 to-transparent hover:from-accent/30 hover:via-white/12 hover:to-transparent transition-all duration-500 shadow-xl shadow-black/40 group/card"
                >
                  <article className="bg-[#09090b]/90 backdrop-blur-xl rounded-[23px] overflow-hidden">
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
                      <span className="text-[10px] text-zinc-400 font-mono shrink-0">{formatTime(status.updatedAt)}</span>
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
                      /* Modern Premium dashboard view */
                      <div className="space-y-4">
                        
                        {/* ── The 3 Key Trackers Grid (Study, Project, Content) ── */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          
                          {/* Study Widget */}
                          {status.study && (
                            <div className="p-4 rounded-2xl bg-zinc-950/40 border border-violet-500/10 hover:border-violet-500/20 transition-all space-y-3 relative overflow-hidden group">
                              <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 blur-2xl rounded-full group-hover:bg-violet-500/10 transition-colors pointer-events-none" />
                              
                              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest flex items-center gap-1.5">
                                  <BookOpen className="w-3.5 h-3.5" /> Study Tracker
                                </span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-violet-500/10 text-violet-300">
                                  {status.study.hours} hrs
                                </span>
                              </div>

                              <div className="space-y-2">
                                <div>
                                  <div className="text-[9px] text-brand-500 uppercase tracking-wider font-mono">Subject</div>
                                  <div className="text-xs font-bold text-white truncate">{status.study.subject || "—"}</div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <div className="text-[9px] text-brand-500 uppercase tracking-wider font-mono">Solved</div>
                                    <div className="text-xs font-bold text-brand-200">{status.study.questions} Qs</div>
                                  </div>
                                  {status.study.mock && status.study.mock !== "N/A" && status.study.mock !== "" && (
                                    <div>
                                      <div className="text-[9px] text-brand-500 uppercase tracking-wider font-mono">Mock Score</div>
                                      <div className="text-xs font-bold text-amber-400 truncate">{status.study.mock}</div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Project Widget */}
                          {status.project && (
                            <div className="p-4 rounded-2xl bg-zinc-950/40 border border-cyan-500/10 hover:border-cyan-500/20 transition-all space-y-3 relative overflow-hidden group">
                              <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 blur-2xl rounded-full group-hover:bg-cyan-500/10 transition-colors pointer-events-none" />
                              
                              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                                  <Terminal className="w-3.5 h-3.5" /> Startup Dev
                                </span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300">
                                  {status.project.hours} hrs
                                </span>
                              </div>

                              <div className="space-y-1.5">
                                <div className="text-[9px] text-brand-500 uppercase tracking-wider font-mono">Tasks Completed</div>
                                {status.project.tasks && status.project.tasks.length > 0 ? (
                                  <ul className="space-y-1">
                                    {status.project.tasks.slice(0, 3).map((t, idx) => (
                                      <li key={idx} className="text-xs text-brand-300 truncate flex items-center gap-1.5">
                                        <span className="w-1 h-1 rounded-full bg-cyan-400 shrink-0" />
                                        {t}
                                      </li>
                                    ))}
                                    {status.project.tasks.length > 3 && (
                                      <li className="text-[10px] text-brand-500 font-mono pl-2.5">
                                        + {status.project.tasks.length - 3} more logs
                                      </li>
                                    )}
                                  </ul>
                                ) : (
                                  <div className="text-xs text-brand-500 italic">No task description logged</div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Content Widget */}
                          {status.content && (
                            <div className="p-4 rounded-2xl bg-zinc-950/40 border border-rose-500/10 hover:border-rose-500/20 transition-all space-y-3 relative overflow-hidden group">
                              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 blur-2xl rounded-full group-hover:bg-rose-500/10 transition-colors pointer-events-none" />
                              
                              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
                                  <Video className="w-3.5 h-3.5" /> Media Push
                                </span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/10 text-rose-300">
                                  {((status.content.videos || 0) + (status.content.posts || 0))} items
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-3 pt-1">
                                <div className="text-center p-2 rounded-xl bg-white/2 border border-white/5">
                                  <div className="text-xs font-bold text-white">{status.content.videos || 0}</div>
                                  <div className="text-[9px] text-brand-500 uppercase tracking-wider font-mono">Videos</div>
                                </div>
                                <div className="text-center p-2 rounded-xl bg-white/2 border border-white/5">
                                  <div className="text-xs font-bold text-white">{status.content.posts || 0}</div>
                                  <div className="text-[9px] text-brand-500 uppercase tracking-wider font-mono">Posts</div>
                                </div>
                              </div>
                            </div>
                          )}

                        </div>

                        {/* ── Habits & Finance (Horizontal Split) ── */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          
                          {/* Habits Card */}
                          {status.health && (
                            <div className="p-4 rounded-2xl bg-zinc-950/30 border border-white/5 flex flex-col justify-between gap-3">
                              <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest flex items-center gap-1.5">
                                <Moon className="w-3.5 h-3.5" /> Habits & Rest
                              </span>
                              <div className="grid grid-cols-2 gap-4 pt-1">
                                <div className="flex items-center gap-2">
                                  <div className="text-sm font-bold text-white">{status.health.sleep} hrs</div>
                                  <div className="text-[10px] text-brand-500">Sleep</div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-amber-400 text-xs font-mono">{eatStars(status.health.healthyEating || 5)}</span>
                                  <div className="text-[10px] text-brand-500">Eating</div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Ledger Card */}
                          {status.finance && (
                            <div className="p-4 rounded-2xl bg-zinc-950/30 border border-white/5 flex flex-col justify-between gap-3">
                              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                                <IndianRupee className="w-3.5 h-3.5" /> Finance Ledger
                              </span>
                              <div className="flex items-center justify-between pt-1">
                                <div className="flex gap-4">
                                  <div>
                                    <div className="text-[8px] text-brand-500 uppercase tracking-wider font-mono">Income</div>
                                    <div className="text-xs font-bold text-emerald-400">+₹{status.finance.income || 0}</div>
                                  </div>
                                  <div>
                                    <div className="text-[8px] text-brand-500 uppercase tracking-wider font-mono">Expense</div>
                                    <div className="text-xs font-bold text-red-400">−₹{status.finance.expense || 0}</div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-[8px] text-brand-500 uppercase tracking-wider font-mono">Net Flow</div>
                                  <div className={`text-xs font-black ${net >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                    {net >= 0 ? "+" : ""}₹{net}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                        </div>

                        {/* ── Reflections (Best Moment & Lesson Learned) ── */}
                        {(status.bestMoment || status.lessonLearned) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-white/5">
                            {status.bestMoment && (
                              <div className="p-3.5 rounded-2xl bg-white/2 border border-white/5 space-y-1">
                                <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-amber-400 uppercase tracking-widest font-mono">
                                  <Star className="w-3 h-3" /> Best Moment
                                </span>
                                <p className="text-xs text-brand-200 leading-relaxed font-medium italic">
                                  &ldquo;{status.bestMoment}&rdquo;
                                </p>
                              </div>
                            )}
                            {status.lessonLearned && (
                              <div className="p-3.5 rounded-2xl bg-white/2 border border-white/5 space-y-1">
                                <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-sky-400 uppercase tracking-widest font-mono">
                                  <Lightbulb className="w-3 h-3" /> Lesson Learned
                                </span>
                                <p className="text-xs text-brand-300 leading-relaxed italic">
                                  {status.lessonLearned}
                                </p>
                              </div>
                            )}
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
