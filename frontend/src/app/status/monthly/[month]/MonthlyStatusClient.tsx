"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Terminal,
  Video,
  Moon,
  Star,
  Lightbulb,
  Calendar,
  IndianRupee,
  ChevronDown,
  ArrowLeft,
  Share2,
  Check,
  TrendingUp,
} from "lucide-react";
import type { MonthlyStats } from "@/data/statusServer";
import type { DailyStatus } from "@/types";
import TrendCharts, { TREND_OPTIONS, type TrendKey } from "./TrendCharts";

interface Props {
  monthKey: string;
  stats: MonthlyStats;
  availableMonths: { key: string; label: string; count: number }[];
  dailyRecords: DailyStatus[];
}

function moodEmoji(m: number) {
  return m >= 9 ? "🤩" : m >= 7 ? "😊" : m >= 5 ? "😐" : "😔";
}

function renderEatStars(r: number) {
  const active = Math.min(Math.max(0, Math.round(r)), 5);
  const inactive = 5 - active;
  return (
    <span className="inline-flex items-center leading-none select-none text-[13px] tracking-tight">
      <span className="text-amber-400">{"★".repeat(active)}</span>
      <span className="text-zinc-700">{"★".repeat(inactive)}</span>
    </span>
  );
}

export default function MonthlyStatusClient({
  monthKey,
  stats,
  availableMonths,
  dailyRecords,
}: Props) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [trendsOpen, setTrendsOpen] = useState(false);
  const [activeTrend, setActiveTrend] = useState<TrendKey>("study");
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const trendsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (trendsRef.current && !trendsRef.current.contains(event.target as Node)) {
        setTrendsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Pick one single best moment and one single lesson for the month
  const singleBestMoment = stats.bestMoments && stats.bestMoments.length > 0
    ? stats.bestMoments[0]?.moment
    : null;

  const singleBestLesson = stats.bestLessons && stats.bestLessons.length > 0
    ? stats.bestLessons[0]?.lesson
    : null;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden pt-16 lg:pt-20 pb-16 lg:pb-24">
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-accent/3 rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse-slow" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.005)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.005)_1px,transparent_1px)] bg-[size:72px_72px] pointer-events-none -z-20 opacity-30" />

      <div className="max-w-2xl mx-auto px-5 relative z-10 space-y-6">

        {/* ── Top Navigation & Actions ── */}
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/status"
            className="inline-flex items-center gap-1.5 text-xs text-brand-400 hover:text-white transition-colors font-mono group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to Status Dashboard
          </Link>

          <div className="flex items-center gap-2">
            {/* Share / Copy Button */}
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 text-xs text-brand-400 hover:text-white border border-white/8 bg-white/2 hover:bg-white/5 px-3 py-1.5 rounded-xl transition-all font-mono"
              title="Copy link"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400 text-[11px]">Copied</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3 h-3 text-brand-400" />
                  <span className="text-[11px]">Share</span>
                </>
              )}
            </button>

            {/* Month Switcher Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="inline-flex items-center justify-between gap-2 text-xs text-brand-300 hover:text-white border border-white/8 bg-white/2 hover:bg-white/5 px-3.5 py-1.5 rounded-xl transition-all font-semibold hover:border-accent/30 cursor-pointer"
                aria-haspopup="true"
                aria-expanded={dropdownOpen}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-yellow-400" />
                  {stats.monthLabel}
                </span>
                <ChevronDown className={`w-3 h-3 text-brand-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-48 rounded-xl border border-zinc-700/80 bg-[#09090b]/95 backdrop-blur-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 divide-y divide-white/5">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-brand-400 px-2.5 py-1">
                    Select Month
                  </div>
                  <div className="pt-1 max-h-60 overflow-y-auto space-y-0.5">
                    {availableMonths.map((m) => (
                      <Link
                        key={m.key}
                        href={`/status/monthly/${m.key}`}
                        onClick={() => setDropdownOpen(false)}
                        className={`flex items-center justify-between px-2.5 py-2 text-xs rounded-lg transition-colors group ${
                          m.key === monthKey
                            ? "bg-accent/15 text-accent font-bold"
                            : "text-zinc-300 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        <span className="font-medium group-hover:text-yellow-400 transition-colors">{m.label}</span>
                        <span className="text-[10px] text-zinc-500 font-mono group-hover:text-zinc-400">
                          {m.count} {m.count === 1 ? "log" : "logs"}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Monthly Trends Dropdown */}
            <div className="relative" ref={trendsRef}>
              <button
                type="button"
                onClick={() => setTrendsOpen((prev) => !prev)}
                className="inline-flex items-center justify-between gap-2 text-xs text-brand-300 hover:text-white border border-white/8 bg-white/2 hover:bg-white/5 px-3.5 py-1.5 rounded-xl transition-all font-semibold hover:border-accent/30 cursor-pointer"
                aria-haspopup="true"
                aria-expanded={trendsOpen}
              >
                <span className="inline-flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  {TREND_OPTIONS.find((t) => t.key === activeTrend)?.icon}{" "}
                  {TREND_OPTIONS.find((t) => t.key === activeTrend)?.label ?? "Monthly Trends"}
                </span>
                <ChevronDown className={`w-3 h-3 text-brand-400 transition-transform duration-200 ${trendsOpen ? "rotate-180" : ""}`} />
              </button>

              {trendsOpen && (
                <div className="absolute right-0 mt-1.5 w-52 rounded-xl border border-zinc-700/80 bg-[#09090b]/95 backdrop-blur-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 divide-y divide-white/5">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-brand-400 px-2.5 py-1">
                    Monthly Trends
                  </div>
                  <div className="pt-1 space-y-0.5">
                    {TREND_OPTIONS.map((t) => (
                      <button
                        key={t.key}
                        onClick={() => { setActiveTrend(t.key); setTrendsOpen(false); }}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-xs rounded-lg transition-colors text-left ${
                          t.key === activeTrend
                            ? "bg-accent/15 text-accent font-bold"
                            : "text-zinc-300 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        <span className="text-sm leading-none">{t.icon}</span>
                        <span className="font-medium">{t.label}</span>
                        {t.key === activeTrend && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Single Box (Exact Daily Logs Style) ── */}
        <div className="rounded-2xl border border-zinc-700/70 bg-[#09090b]/90 backdrop-blur-xl transition-all duration-300 shadow-lg shadow-black/50 overflow-hidden">
          <article>
            {/* Card Header */}
            <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-white/5 bg-white/2">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-accent shrink-0" />
                <span className="text-sm font-bold text-white">
                  {stats.monthLabel}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {stats.avgMood > 0 && (
                  <span className="text-xs font-semibold text-amber-400">
                    {moodEmoji(Math.round(stats.avgMood))} {stats.avgMood.toFixed(1)}/10
                  </span>
                )}
                <span className="text-[10px] text-zinc-300 font-mono shrink-0">
                  {stats.daysLogged} {stats.daysLogged === 1 ? "day" : "days"} logged
                </span>
              </div>
            </div>

            {/* Card Body */}
            <div className="px-5 py-4 space-y-4">
              {/* Focus summary */}
              <p className="text-sm text-white font-medium leading-snug border-l-2 border-accent/50 pl-3">
                Monthly Activity Log &amp; Performance Overview for {stats.monthLabel}.
              </p>

              {/* Flat rows — exact single daily log style */}
              <div className="divide-y divide-white/[0.06]">

                {/* 1. Study */}
                <div className="py-2.5 grid grid-cols-[6.5rem_0.75rem_1fr] gap-x-2 gap-y-0 items-start">
                  <span className="text-[10.5px] font-bold text-yellow-400 uppercase tracking-wider font-mono flex items-center gap-1 pt-0.5">
                    <BookOpen className="w-3.5 h-3.5 shrink-0" /> Study
                  </span>
                  <span className="text-zinc-600 font-bold text-sm leading-none flex items-center justify-center pt-0.5">→</span>
                  <div className="space-y-1.5 text-xs text-zinc-300 leading-relaxed">
                    <div>
                      Total Study Hours - <span className="font-bold text-white">{stats.totalStudyHours}h</span>
                    </div>
                    <div>
                      Average Study Hours - <span className="font-bold text-white">{stats.avgStudyHoursPerDay.toFixed(1)}h</span> <span className="text-zinc-500 text-[11px]">(per day)</span>
                    </div>
                    <div>
                      Total Practice Questions - <span className="font-bold text-white">{stats.totalQuestions} Qs</span> <span className="text-zinc-500 text-[11px]">({stats.avgQuestionsPerDay.toFixed(1)} Qs/day)</span>
                    </div>
                    <div>
                      No. Mock Tests - <span className="font-bold text-white">{stats.mockCount}</span>
                    </div>
                    <div>
                      Subjects studied - <span className="text-white uppercase font-semibold">{stats.subjectsStudied.length > 0 ? stats.subjectsStudied.join(", ") : "—"}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Dev */}
                <div className="py-2.5 grid grid-cols-[6.5rem_0.75rem_1fr] gap-x-2 gap-y-0 items-start">
                  <span className="text-[10.5px] font-bold text-yellow-400 uppercase tracking-wider font-mono flex items-center gap-1 pt-0.5">
                    <Terminal className="w-3.5 h-3.5 shrink-0" /> Dev
                  </span>
                  <span className="text-zinc-600 font-bold text-sm leading-none flex items-center justify-center pt-0.5">→</span>
                  <div className="space-y-1.5 text-xs text-zinc-300 leading-relaxed">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span>Total Dev Hours - <span className="font-bold text-white">{stats.totalDevHours}h</span></span>
                      <span>Average Dev Hours - <span className="font-bold text-white">{stats.avgDevHoursPerDay.toFixed(1)}h</span> <span className="text-zinc-500 text-[11px]">(per day)</span></span>
                    </div>
                    <div>
                      Tasks Shipped - <span className="font-bold text-white">{stats.devTasksCount}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Content */}
                <div className="py-2.5 grid grid-cols-[6.5rem_0.75rem_1fr] gap-x-2 gap-y-0 items-start">
                  <span className="text-[10.5px] font-bold text-yellow-400 uppercase tracking-wider font-mono flex items-center gap-1 pt-0.5">
                    <Video className="w-3.5 h-3.5 shrink-0" /> Content
                  </span>
                  <span className="text-zinc-600 font-bold text-sm leading-none flex items-center justify-center pt-0.5">→</span>
                  <div className="space-y-1.5 text-xs text-zinc-300 leading-relaxed">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span>Youtube video - <span className="font-bold text-white">{stats.totalVideos}</span></span>
                      <span>Blog - <span className="font-bold text-white">{stats.totalBlogs}</span></span>
                      <span>Insta post - <span className="font-bold text-white">{stats.totalPosts}</span></span>
                    </div>
                    <div>
                      Total Content Published - <span className="font-bold text-white">{stats.totalVideos + stats.totalBlogs + stats.totalPosts}</span>
                    </div>
                  </div>
                </div>

                {/* 4. Health */}
                <div className="py-2.5 grid grid-cols-[6.5rem_0.75rem_1fr] gap-x-2 gap-y-0 items-start">
                  <span className="text-[10.5px] font-bold text-yellow-400 uppercase tracking-wider font-mono flex items-center gap-1 pt-0.5">
                    <Moon className="w-3.5 h-3.5 shrink-0" /> Health
                  </span>
                  <span className="text-zinc-600 font-bold text-sm leading-none flex items-center justify-center pt-0.5">→</span>
                  <div className="space-y-1.5 text-xs text-zinc-300 leading-relaxed">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span>Average Sleep Hours - <span className="font-bold text-white">{stats.avgSleep > 0 ? `${stats.avgSleep.toFixed(1)}h` : "—"}</span></span>
                      <span className="flex items-center gap-1.5">
                        Average Healthy Diet - {renderEatStars(stats.avgDiet || 5)} <span className="text-white font-semibold">({stats.avgDiet > 0 ? `${stats.avgDiet.toFixed(1)}/5` : "—"})</span>
                      </span>
                    </div>
                    <div>
                      Average Mood - <span className="font-bold text-amber-400">{moodEmoji(Math.round(stats.avgMood || 8))} {stats.avgMood > 0 ? `${stats.avgMood.toFixed(1)}/10` : "—"}</span>
                    </div>
                  </div>
                </div>

                {/* 5. Finance */}
                <div className="py-2.5 grid grid-cols-[6.5rem_0.75rem_1fr] gap-x-2 gap-y-0 items-start">
                  <span className="text-[10.5px] font-bold text-yellow-400 uppercase tracking-wider font-mono flex items-center gap-1 pt-0.5">
                    <IndianRupee className="w-3.5 h-3.5 shrink-0" /> Finance
                  </span>
                  <span className="text-zinc-600 font-bold text-sm leading-none flex items-center justify-center pt-0.5">→</span>
                  <div className="space-y-1.5 text-xs text-zinc-300 leading-relaxed">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span>Total Income - <span className="font-bold text-emerald-400">+₹{stats.totalIncome.toLocaleString("en-IN")}</span></span>
                      <span>Average Income - <span className="font-bold text-emerald-400">₹{Math.round(stats.avgIncomePerDay).toLocaleString("en-IN")}</span> <span className="text-zinc-500 text-[11px]">(per day)</span></span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span>Total Expense - <span className="font-bold text-red-400">−₹{stats.totalExpense.toLocaleString("en-IN")}</span></span>
                      <span>Average Expense - <span className="font-bold text-red-400">₹{Math.round(stats.avgExpensePerDay).toLocaleString("en-IN")}</span> <span className="text-zinc-500 text-[11px]">(per day)</span></span>
                    </div>
                    <div>
                      Net Savings - <span className={`font-bold ${stats.netSavings >= 0 ? "text-emerald-400" : "text-red-400"}`}>{stats.netSavings >= 0 ? "+" : ""}₹{stats.netSavings.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>

                {/* 6. Best Moment (1 Best Moment) */}
                {singleBestMoment && (
                  <div className="py-2.5 grid grid-cols-[6.5rem_0.75rem_1fr] gap-x-2 gap-y-0 items-start">
                    <span className="text-[10.5px] font-bold text-yellow-400 uppercase tracking-wider font-mono flex items-center gap-1 pt-0.5">
                      <Star className="w-3.5 h-3.5 shrink-0" /> Best Moment of the Month
                    </span>
                    <span className="text-zinc-600 font-bold text-sm leading-none flex items-center justify-center pt-0.5">→</span>
                    <p className="text-xs text-zinc-300 leading-relaxed italic">&ldquo;{singleBestMoment}&rdquo;</p>
                  </div>
                )}

                {/* 7. Lesson (1 Lesson) */}
                {singleBestLesson && (
                  <div className="py-2.5 grid grid-cols-[6.5rem_0.75rem_1fr] gap-x-2 gap-y-0 items-start">
                    <span className="text-[10.5px] font-bold text-yellow-400 uppercase tracking-wider font-mono flex items-center gap-1 pt-0.5">
                      <Lightbulb className="w-3.5 h-3.5 shrink-0" /> Best Lesson of the Month
                    </span>
                    <span className="text-zinc-600 font-bold text-sm leading-none flex items-center justify-center pt-0.5">→</span>
                    <p className="text-xs text-zinc-400 leading-relaxed italic">{singleBestLesson}</p>
                  </div>
                )}

              </div>
            </div>
          </article>
        </div>

        {/* ── Trend Chart Panel ── */}
        <TrendCharts trendKey={activeTrend} records={dailyRecords} />

      </div>
    </div>
  );
}
