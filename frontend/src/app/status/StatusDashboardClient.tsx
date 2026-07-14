"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  BookOpen, 
  Terminal, 
  Video, 
  TrendingUp, 
  Heart, 
  Smile, 
  Award, 
  Lightbulb, 
  Calendar, 
  Search, 
  Sparkles, 
  Clock, 
  Utensils,
  PlusCircle,
  RefreshCw
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
    healthyEating: number; // 1-5 rating
  };
  finance?: {
    expense: number;
    income: number;
  };
  mood?: number; // 1-10 rating
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

export default function StatusDashboardClient({ initialStatuses, futurePlans }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  // Start with SSR snapshot, then refresh from API on client mount for live data
  const [statuses, setStatuses] = useState<DailyStatus[]>(initialStatuses);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLatest = async (showIndicator = false) => {
    if (showIndicator) setRefreshing(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
      const res = await fetch(`${backendUrl}/api/status`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setStatuses(data);
      }
    } catch {
      // Silently keep existing data on failure
    } finally {
      if (showIndicator) setRefreshing(false);
    }
  };

  // Refresh on client mount to get latest (SSR snapshot may be stale)
  useEffect(() => {
    fetchLatest();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredStatuses = statuses.filter((s) => {
    const query = searchQuery.toLowerCase();
    const matchesVibe = (s.statusText || '').toLowerCase().includes(query);
    const matchesTasks = (s.tasks || []).some((t) => (t || '').toLowerCase().includes(query));
    const matchesDate = (s.date || '').toLowerCase().includes(query);
    const matchesSubject = (s.study?.subject || '').toLowerCase().includes(query);
    const matchesBest = (s.bestMoment || '').toLowerCase().includes(query);
    const matchesLesson = (s.lessonLearned || '').toLowerCase().includes(query);
    const matchesProjTasks = (s.project?.tasks || []).some((t) => (t || '').toLowerCase().includes(query));
    return matchesVibe || matchesTasks || matchesDate || matchesSubject || matchesBest || matchesLesson || matchesProjTasks;
  });

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const getHealthyEatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`text-xs ${i < rating ? "text-amber-400" : "text-zinc-700"}`}>
        ★
      </span>
    ));
  };

  // Stats aggregation — always use live `statuses`
  const totalStudyHours = statuses.reduce((acc, curr) => acc + (curr.study?.hours || 0), 0);
  const totalProjectHours = statuses.reduce((acc, curr) => acc + (curr.project?.hours || 0), 0);
  
  const sleepStatuses = statuses.filter(s => s.health && s.health.sleep > 0);
  const avgSleep = sleepStatuses.length > 0 
    ? (sleepStatuses.reduce((acc, curr) => acc + (curr.health?.sleep || 0), 0) / sleepStatuses.length).toFixed(1)
    : "0";

  const moodStatuses = statuses.filter(s => s.mood && s.mood > 0);
  const avgMood = moodStatuses.length > 0
    ? (moodStatuses.reduce((acc, curr) => acc + (curr.mood || 0), 0) / moodStatuses.length).toFixed(1)
    : "0";

  return (
    <div className="min-h-screen bg-background relative overflow-hidden py-20 lg:py-28">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-accent/3 rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse-slow" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.005)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.005)_1px,transparent_1px)] bg-[size:72px_72px] pointer-events-none -z-20 opacity-30" />

      <div className="max-w-4xl mx-auto px-5 relative z-10 space-y-12">
        
        {/* Top Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-accent/25 bg-accent/5 text-[10px] font-bold text-accent uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-accent animate-spin-slow" />
              Nishant Live Updates
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Daily Workspace <span className="text-gradient">Activity Log</span>
            </h1>
            <p className="text-brand-400 text-sm max-w-xl leading-relaxed">
              Real-time daily status tracker detailing studies, coding commits, content metrics, habits, and lessons. Inspired by Apple Journal & Notion.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => fetchLatest(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 text-xs text-brand-400 hover:text-white border border-white/8 bg-white/2 hover:bg-white/5 px-3 py-2.5 rounded-xl transition-all font-semibold hover:border-white/20 disabled:opacity-50 cursor-pointer"
              title="Refresh logs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-accent" : ""}`} />
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
            <Link 
              href="/admin" 
              className="group relative inline-flex items-center gap-2 text-xs text-brand-300 hover:text-white border border-white/8 bg-white/2 hover:bg-white/5 px-4 py-2.5 rounded-xl transition-all font-semibold hover:border-accent/30 shadow-lg"
            >
              <PlusCircle className="w-3.5 h-3.5 text-accent" />
              Admin Access
            </Link>
          </div>
        </div>

        {/* Aggregate Metrics Panel (Premium Widget Layout) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
          <div className="p-4 rounded-2xl bg-zinc-950/40 border border-white/5 hover:border-white/10 hover:bg-zinc-950/60 transition-all font-mono">
            <span className="text-xs text-brand-500 uppercase tracking-widest font-semibold flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-violet-400" />
              Study Time
            </span>
            <div className="mt-2 text-2xl font-bold text-white tracking-tight">
              {totalStudyHours} hrs
            </div>
            <span className="text-[9px] text-brand-400 font-sans">Total exam preparation logged</span>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-950/40 border border-white/5 hover:border-white/10 hover:bg-zinc-950/60 transition-all font-mono">
            <span className="text-xs text-brand-500 uppercase tracking-widest font-semibold flex items-center gap-1">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              Startup Code
            </span>
            <div className="mt-2 text-2xl font-bold text-white tracking-tight">
              {totalProjectHours} hrs
            </div>
            <span className="text-[9px] text-brand-400 font-sans">Dedicated to 2 AM Study dev</span>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-950/40 border border-white/5 hover:border-white/10 hover:bg-zinc-950/60 transition-all font-mono">
            <span className="text-xs text-brand-500 uppercase tracking-widest font-semibold flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-rose-400" />
              Sleep Rest
            </span>
            <div className="mt-2 text-2xl font-bold text-white tracking-tight">
              {avgSleep} hrs
            </div>
            <span className="text-[9px] text-brand-400 font-sans">Average night sleep block</span>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-950/40 border border-white/5 hover:border-white/10 hover:bg-zinc-950/60 transition-all font-mono">
            <span className="text-xs text-brand-500 uppercase tracking-widest font-semibold flex items-center gap-1">
              <Smile className="w-3.5 h-3.5 text-amber-400" />
              Mood Average
            </span>
            <div className="mt-2 text-2xl font-bold text-white tracking-tight">
              {avgMood} / 10
            </div>
            <span className="text-[9px] text-brand-400 font-sans">Average happiness score</span>
          </div>
        </div>

        {/* Search Bar Widget */}
        <div className="relative animate-fade-in">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-brand-500" />
          </div>
          <input
            type="text"
            placeholder="Search subjects, logs, lessons, best moments, or code commits..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950/30 hover:bg-zinc-950/50 focus:bg-zinc-950/70 border border-white/5 focus:border-accent/40 rounded-2xl pl-11 pr-4 py-3 text-xs text-white placeholder-brand-500 focus:outline-none focus:ring-1 focus:ring-accent/20 transition-all font-mono shadow-inner"
          />
        </div>

        {/* Timeline Log Feed */}
        <div className="space-y-6">
          {filteredStatuses.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-white/5 rounded-3xl font-mono glass-strong">
              <Search className="w-6 h-6 text-brand-600 mx-auto mb-3" />
              <p className="text-brand-400 text-xs uppercase tracking-wider">No matching logs found.</p>
              <p className="text-brand-600 text-[10px] mt-1 font-sans">Try searching another keyword or subject.</p>
            </div>
          ) : (
            filteredStatuses.map((status) => {
              const hasNewStructuredSchema = !!(
                (status.study && (status.study.hours > 0 || status.study.subject || status.study.questions > 0 || (status.study.mock && status.study.mock !== "N/A"))) ||
                (status.project && (status.project.hours > 0 || (status.project.tasks && status.project.tasks.length > 0))) ||
                (status.content && ((status.content.videos || 0) > 0 || (status.content.posts || 0) > 0)) ||
                (status.health && (status.health.sleep > 0 || status.health.healthyEating > 0)) ||
                (status.finance && ((status.finance.expense || 0) > 0 || (status.finance.income || 0) > 0)) ||
                status.bestMoment ||
                status.lessonLearned
              );

              return (
                <div 
                  key={status.id} 
                  className="group relative rounded-3xl border border-white/5 bg-zinc-900/10 hover:border-accent/15 p-6 space-y-4 hover:-translate-y-0.5 transition-all duration-300 hover:shadow-[0_15px_30px_rgba(245,158,11,0.02)] glass-strong"
                >
                  {/* Top Bar: Date and Indicators */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-accent" />
                      <span className="text-xs sm:text-sm font-bold text-white tracking-tight">
                        {formatDate(status.date)}
                      </span>
                    </div>

                    <div className="flex items-center flex-wrap gap-2">
                      <span className="text-[9px] text-brand-500 font-mono">
                        {new Date(status.updatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} IST
                      </span>
                    </div>
                  </div>

                  {/* Backward Compatibility View for Legacy Logs */}
                  {!hasNewStructuredSchema ? (
                    <div className="space-y-3 font-sans">
                      {status.statusText && (
                        <p className="text-xs text-white font-medium italic">
                          Focus: {status.statusText}
                        </p>
                      )}
                      {status.tasks && status.tasks.length > 0 && (
                        <ul className="space-y-1.5 font-mono text-xs text-brand-300">
                          {status.tasks.map((task, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-brand-600 select-none">├─</span>
                              <span className="leading-relaxed">{task}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    /* Redesigned Structured Metrics Layout */
                    <div className="space-y-4">

                      {/* Focus / Activity Summary Headline */}
                      {status.statusText && (
                        <div className="flex items-start gap-2.5">
                          <span className="mt-0.5 text-accent text-sm shrink-0">⚡</span>
                          <p className="text-sm font-semibold text-white leading-snug tracking-tight">
                            {status.statusText}
                          </p>
                        </div>
                      )}

                      {/* Legacy tasks list (if any) */}
                      {status.tasks && status.tasks.length > 0 && (
                        <div className="space-y-1.5 pl-0.5">
                          {status.tasks.map((task, idx, arr) => {
                            const isLast = idx === arr.length - 1;
                            return (
                              <div key={idx} className="flex items-start gap-2 text-xs font-mono text-brand-300">
                                <span className="text-brand-600 select-none">{isLast ? "└─" : "├─"}</span>
                                <span className="leading-relaxed">{task}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Grid panel for structured logs (Perfect 3x2 Grid for 6 points) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        
                        {/* 1. STUDY BLOCK */}
                        {status.study && (
                          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-violet-500/5 to-violet-500/0 border border-violet-500/10 flex flex-col justify-between gap-1 hover:border-violet-500/20 transition-all font-mono">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] text-violet-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                <BookOpen className="w-3 h-3" /> Study Prep
                              </span>
                              <span className="text-xs font-black text-white">{status.study.hours || 0}h</span>
                            </div>
                            <div className="text-[10px] text-brand-300 truncate font-semibold mt-1">
                              {status.study.subject || "No Subject"}
                            </div>
                            <div className="text-[9px] text-brand-500 flex justify-between mt-1 pt-1 border-t border-white/5">
                              <span>Solved: {status.study.questions || 0} Qs</span>
                              {status.study.mock && status.study.mock !== "N/A" && status.study.mock !== "" && (
                                <span className="text-accent font-sans text-[8px] bg-accent/5 px-1 rounded border border-accent/15 max-w-[80px] truncate">Mock Logged</span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 2. STARTUP PROJECT BLOCK */}
                        {status.project && (
                          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-cyan-500/5 to-cyan-500/0 border border-cyan-500/10 flex flex-col justify-between gap-1 hover:border-cyan-500/20 transition-all font-mono">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                <Terminal className="w-3 h-3" /> Startup Dev
                              </span>
                              <span className="text-xs font-black text-white">{status.project.hours || 0}h</span>
                            </div>
                            <div className="text-[10px] text-brand-300 font-semibold mt-1 truncate">
                              Building 2 AM Study
                            </div>
                            <span className="text-[9px] text-brand-500 mt-1 pt-1 border-t border-white/5 block">
                              Commits/Tasks: {status.project.tasks?.length || 0} logged
                            </span>
                          </div>
                        )}

                        {/* 3. CONTENT RELEASE BLOCK */}
                        {status.content && (
                          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-rose-500/5 to-rose-500/0 border border-rose-500/10 flex flex-col justify-between gap-1 hover:border-rose-500/20 transition-all font-mono">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] text-rose-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                <Video className="w-3 h-3" /> Content Release
                              </span>
                              <span className="text-xs font-black text-white">
                                {((status.content.videos || 0) + (status.content.posts || 0))} items
                              </span>
                            </div>
                            <div className="text-[10px] text-brand-300 font-semibold mt-1">
                              Vlogs & Social Media
                            </div>
                            <div className="text-[9px] text-brand-500 flex gap-2 mt-1 pt-1 border-t border-white/5">
                              <span>🎥 {status.content.videos || 0} Video</span>
                              <span>📸 {status.content.posts || 0} Post</span>
                            </div>
                          </div>
                        )}

                        {/* 4. CIRCADIAN REST BLOCK */}
                        {status.health && (
                          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-orange-500/5 to-orange-500/0 border border-orange-500/10 flex flex-col justify-between gap-1 hover:border-orange-500/20 transition-all font-mono">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] text-orange-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Circadian Rest
                              </span>
                              <span className="text-xs font-black text-white">{status.health.sleep || 0} hrs</span>
                            </div>
                            <div className="text-[10px] text-brand-300 font-semibold mt-1">
                              Night Sleep Block
                            </div>
                            <span className="text-[9px] text-brand-500 mt-1 pt-1 border-t border-white/5 block">
                              Target sleep rhythm: 7-8h
                            </span>
                          </div>
                        )}

                        {/* 5. DAILY LEDGER BLOCK */}
                        {status.finance && (
                          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500/5 to-emerald-500/0 border border-emerald-500/10 flex flex-col justify-between gap-1 hover:border-emerald-500/20 transition-all font-mono">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" /> Daily Ledger
                              </span>
                              <span className="text-xs font-black text-white">Ledger</span>
                            </div>
                            <div className="text-[10px] text-brand-300 mt-1 flex justify-between font-semibold">
                              <span>In: ₹{status.finance.income || 0}</span>
                              <span className="text-red-400">Out: ₹{status.finance.expense || 0}</span>
                            </div>
                            <div className="text-[9px] text-brand-500 mt-1 pt-1 border-t border-white/5 flex justify-between">
                              <span>Net Flow:</span>
                              <span className={(status.finance.income || 0) >= (status.finance.expense || 0) ? "text-emerald-400" : "text-red-400"}>
                                ₹{(status.finance.income || 0) - (status.finance.expense || 0)}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* 6. HEALTH & VIBE BLOCK */}
                        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/5 to-amber-500/0 border border-amber-500/10 flex flex-col justify-between gap-1 hover:border-amber-500/20 transition-all font-mono">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                              <Smile className="w-3 h-3 text-amber-400" /> Daily Vibe
                            </span>
                            <span className="text-xs font-black text-white">{status.mood || 8}/10</span>
                          </div>
                          <div className="text-[10px] text-brand-300 font-semibold mt-1">
                            Nutrition & Mood Index
                          </div>
                          <div className="text-[9px] text-brand-500 mt-1 pt-1 border-t border-white/5 flex justify-between">
                            <span>Eating:</span>
                            <span className="font-sans">{getHealthyEatingStars(status.health?.healthyEating || 5)}</span>
                          </div>
                        </div>

                      </div>

                      {/* Mock log (Special Sunday/Custom card) */}
                      {status.study?.mock && status.study.mock !== "N/A" && status.study.mock !== "" && (
                        <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/15 font-mono text-[10px] text-brand-300 space-y-1">
                          <div className="font-bold text-amber-400 flex items-center gap-1 uppercase tracking-wider text-[9px]">
                            🏆 Exam Mock Assessment Logged
                          </div>
                          <p>{status.study.mock}</p>
                        </div>
                      )}

                      {/* Project Tasks details list */}
                      {status.project?.tasks && status.project.tasks.length > 0 && (
                        <div className="space-y-1.5 pl-0.5">
                          <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest font-mono">Project Tasks Completed:</p>
                          {status.project.tasks.map((task, idx, arr) => {
                            const isLast = idx === arr.length - 1;
                            return (
                              <div key={idx} className="flex items-start gap-2 text-xs font-mono text-brand-300">
                                <span className="text-brand-600 select-none">{isLast ? "└─" : "├─"}</span>
                                <span className="text-cyan-400 font-semibold shrink-0">[CODE]</span>
                                <span className="leading-relaxed">{task}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Text Highlights: Best Moment and Lesson Learned */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                        <div className="p-4 rounded-2xl bg-white/2 border border-white/5 relative group hover:bg-white/4 transition-all">
                          <span className="absolute right-4 top-4 text-xs">⭐</span>
                          <span className="text-[9px] uppercase font-mono tracking-widest text-brand-400 block mb-1">Best Moment</span>
                          <p className="text-xs text-white leading-relaxed font-caveat text-brand-200">
                            {status.bestMoment ? `“${status.bestMoment}”` : "No highlight recorded."}
                          </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-white/2 border border-white/5 relative group hover:bg-white/4 transition-all">
                          <span className="absolute right-4 top-4 text-xs">💡</span>
                          <span className="text-[9px] uppercase font-mono tracking-widest text-brand-400 block mb-1">Lesson Learned</span>
                          <p className="text-xs text-brand-300 leading-relaxed italic font-sans font-medium">
                            {status.lessonLearned || "No lesson logged today."}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
