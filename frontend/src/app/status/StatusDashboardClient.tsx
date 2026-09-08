"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { apiUrl } from "@/lib/api";
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
  CalendarX,
  Quote,
  Search,
  Sparkles,
  RefreshCw,
  PlusCircle,
  Trophy,
  Utensils,
  IndianRupee,
  ChevronDown,
  X,
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
    blogs?: number;
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

const MONTHS_FULL = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];
const MONTHS_SHORT = [
  "jan", "feb", "mar", "apr", "may", "jun",
  "jul", "aug", "sep", "oct", "nov", "dec",
];

function getOrdinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function normalizeDateQuery(q: string): string {
  let normalized = q.toLowerCase();

  // Replace compound number words (e.g. "twenty two", "twenty-second")
  const compoundWords: [RegExp, string][] = [
    [/\b(twenty[- ]first|twenty[- ]one)\b/g, "21"],
    [/\b(twenty[- ]second|twenty[- ]two)\b/g, "22"],
    [/\b(twenty[- ]third|twenty[- ]three)\b/g, "23"],
    [/\b(twenty[- ]fourth|twenty[- ]four)\b/g, "24"],
    [/\b(twenty[- ]fifth|twenty[- ]five)\b/g, "25"],
    [/\b(twenty[- ]sixth|twenty[- ]six)\b/g, "26"],
    [/\b(twenty[- ]seventh|twenty[- ]seven)\b/g, "27"],
    [/\b(twenty[- ]eighth|twenty[- ]eight)\b/g, "28"],
    [/\b(twenty[- ]ninth|twenty[- ]nine)\b/g, "29"],
    [/\b(thirty[- ]first|thirty[- ]one)\b/g, "31"],
  ];
  for (const [pattern, repl] of compoundWords) {
    normalized = normalized.replace(pattern, repl);
  }

  // Replace single number words (e.g. "twelve", "twelfth", "one", "second")
  const singleWords: [RegExp, string][] = [
    [/\b(first|one)\b/g, "1"],
    [/\b(second|two)\b/g, "2"],
    [/\b(third|three)\b/g, "3"],
    [/\b(fourth|four)\b/g, "4"],
    [/\b(fifth|five)\b/g, "5"],
    [/\b(sixth|six)\b/g, "6"],
    [/\b(seventh|seven)\b/g, "7"],
    [/\b(eighth|eight)\b/g, "8"],
    [/\b(ninth|nine)\b/g, "9"],
    [/\b(tenth|ten)\b/g, "10"],
    [/\b(eleventh|eleven)\b/g, "11"],
    [/\b(twelfth|twelve)\b/g, "12"],
    [/\b(thirteenth|thirteen)\b/g, "13"],
    [/\b(fourteenth|fourteen)\b/g, "14"],
    [/\b(fifteenth|fifteen)\b/g, "15"],
    [/\b(sixteenth|sixteen)\b/g, "16"],
    [/\b(seventeenth|seventeen)\b/g, "17"],
    [/\b(eighteenth|eighteen)\b/g, "18"],
    [/\b(nineteenth|nineteen)\b/g, "19"],
    [/\b(twentieth|twenty)\b/g, "20"],
    [/\b(thirtieth|thirty)\b/g, "30"],
  ];
  for (const [pattern, repl] of singleWords) {
    normalized = normalized.replace(pattern, repl);
  }

  // Normalize numbers with excessive leading zeros: e.g. "012" -> "12", "005" -> "5"
  normalized = normalized.replace(/\b0+(\d+)\b/g, (match, digits) => {
    if (digits.length <= 2) {
      return String(parseInt(digits, 10));
    }
    return match;
  });

  // Common month abbreviations and spelling variants (e.g. "spt" / "sept" -> "sep")
  const monthAliases: [RegExp, string][] = [
    [/\b(spt|sept)\b/g, "sep"],
    [/\b(agust|augst)\b/g, "aug"],
    [/\b(feburary|febr)\b/g, "feb"],
    [/\b(janurary)\b/g, "jan"],
  ];
  for (const [pattern, repl] of monthAliases) {
    normalized = normalized.replace(pattern, repl);
  }

  return normalized;
}

function checkDateMatchSingle(dateStr: string, q: string): boolean {
  // 1. Raw match (e.g. "2026-08-12", "08-12", "2026")
  if (dateStr.toLowerCase().includes(q)) return true;

  // 2. Parse YYYY-MM-DD or standard ISO date
  const cleanDate = dateStr.split("T")[0].trim();
  const parts = cleanDate.split("-");
  let year = 0;
  let month = 0;
  let day = 0;

  if (parts.length === 3) {
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    day = parseInt(parts[2], 10);
  } else {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      year = parsed.getFullYear();
      month = parsed.getMonth() + 1;
      day = parsed.getDate();
    }
  }

  if (!year || !month || !day || month < 1 || month > 12) {
    return false;
  }

  const fullMonth = MONTHS_FULL[month - 1];
  const shortMonth = MONTHS_SHORT[month - 1];
  const dayStr = String(day);
  const dayPadded = day < 10 ? `0${day}` : dayStr;
  const ordinalDay = getOrdinal(day).toLowerCase();
  const monthPadded = month < 10 ? `0${month}` : String(month);
  const yearStr = String(year);

  // Weekday
  const dateObj = new Date(year, month - 1, day);
  const weekday = dateObj.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
  const shortWeekday = dateObj.toLocaleDateString("en-US", { weekday: "short" }).toLowerCase();

  // Single word checks: "august", "july", "aug", "jul", "wednesday", "12th", "22nd"
  if (
    fullMonth === q ||
    fullMonth.includes(q) ||
    shortMonth === q ||
    weekday === q ||
    weekday.includes(q) ||
    shortWeekday === q ||
    ordinalDay === q
  ) {
    return true;
  }

  // Pre-assembled date format variations
  const variations = [
    `${dayStr} ${fullMonth}`,
    `${ordinalDay} ${fullMonth}`,
    `${fullMonth} ${dayStr}`,
    `${fullMonth} ${ordinalDay}`,
    `${dayStr} ${shortMonth}`,
    `${ordinalDay} ${shortMonth}`,
    `${shortMonth} ${dayStr}`,
    `${shortMonth} ${ordinalDay}`,
    `${dayStr} ${fullMonth} ${yearStr}`,
    `${ordinalDay} ${fullMonth} ${yearStr}`,
    `${fullMonth} ${dayStr} ${yearStr}`,
    `${fullMonth} ${ordinalDay} ${yearStr}`,
    `${dayStr} ${shortMonth} ${yearStr}`,
    `${shortMonth} ${dayStr} ${yearStr}`,
    `${dayPadded}-${monthPadded}-${yearStr}`,
    `${dayPadded}/${monthPadded}/${yearStr}`,
    `${dayStr}/${month}/${yearStr}`,
    `${dayStr}-${month}-${yearStr}`,
  ];

  if (variations.some((v) => v.includes(q) || q.includes(v))) {
    return true;
  }

  // Multi-word checks: ensure every query term corresponds to a date token
  const terms = q.replace(/[,/.-]/g, " ").split(/\s+/).filter(Boolean);
  if (terms.length > 1) {
    const tokens = [
      yearStr,
      dayStr,
      dayPadded,
      ordinalDay,
      monthPadded,
      String(month),
      fullMonth,
      shortMonth,
      weekday,
      shortWeekday,
    ];
    const allMatch = terms.every((t) =>
      tokens.some((token) => token === t || token.startsWith(t))
    );
    if (allMatch) return true;
  }

  return false;
}

function matchesDateSearch(dateStr: string | undefined, query: string): boolean {
  if (!dateStr || !query) return false;
  const rawQ = query.trim().toLowerCase();
  if (!rawQ) return false;

  const normalizedQ = normalizeDateQuery(rawQ);
  return checkDateMatchSingle(dateStr, rawQ) || checkDateMatchSingle(dateStr, normalizedQ);
}

const UNLOGGED_DATE_QUOTES = [
  {
    quote: "Not every day of hard work is recorded in a database. Some of the most transformative breakthroughs happen in complete silence away from the screen.",
    author: "2 AM Study Philosophy",
  },
  {
    quote: "Quiet focus is still progress. Consistency isn’t just about broadcasting every hour, but showing up with unshakeable intent every single day.",
    author: "Building in Silence",
  },
  {
    quote: "The work you put in when no one is watching, and when no dashboard is tracking, is the work that compounds into real mastery.",
    author: "Deep Work Mindset",
  },
  {
    quote: "Some days are for relentless execution, some for deep contemplation, and both are necessary for the climb.",
    author: "Founder's Journey",
  },
  {
    quote: "Work with patience and discipline. When you are genuinely building, the results will eventually speak louder than daily logs.",
    author: "Nishant Kumar",
  },
];

function isDateQuery(query: string): boolean {
  if (!query) return false;
  const rawQ = query.trim().toLowerCase();
  if (!rawQ) return false;

  const check = (q: string) => {
    // Check month names (full or short)
    const hasMonth =
      MONTHS_FULL.some((m) => q.includes(m)) ||
      MONTHS_SHORT.some((m) => new RegExp(`\\b${m}\\b`).test(q));
    if (hasMonth) return true;

    // Check weekdays
    const weekdays = [
      "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
      "mon", "tue", "wed", "thu", "fri", "sat", "sun",
    ];
    if (weekdays.some((w) => new RegExp(`\\b${w}\\b`).test(q))) return true;

    // Check date-like patterns (e.g. 2026-08-12, 12-08-2026, 12/08)
    if (/\b\d{4}[-/.]\d{1,2}([-/.]\d{1,2})?\b/.test(q)) return true;
    if (/\b\d{1,2}[-/.]\d{1,2}([-/.]\d{2,4})?\b/.test(q)) return true;
    if (/\b\d{1,2}(st|nd|rd|th)\b/.test(q)) return true;
    if (/\b(today|yesterday|tomorrow)\b/.test(q)) return true;

    // Multi-word with a day number
    const words = q.split(/\s+/).filter(Boolean);
    if (words.length >= 2 && words.some((w) => /^\d{1,2}$/.test(w))) {
      return true;
    }

    return false;
  };

  const normalized = normalizeDateQuery(rawQ);
  return check(rawQ) || check(normalized);
}

function getQuoteForQuery(q: string) {
  let hash = 0;
  for (let i = 0; i < q.length; i++) {
    hash = (hash << 5) - hash + q.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % UNLOGGED_DATE_QUOTES.length;
  return UNLOGGED_DATE_QUOTES[index];
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
  const [visibleCount, setVisibleCount] = useState(5);
  const [refreshing, setRefreshing] = useState(false);
  const [monthlyDropdownOpen, setMonthlyDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchLatest = async (showIndicator = false) => {
    if (showIndicator) setRefreshing(true);
    try {
      const res = await fetch(apiUrl("/api/status"), { cache: "no-store" });
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
    const loadLatest = async () => {
      await fetchLatest();
    };

    loadLatest();
    const interval = setInterval(() => {
      void fetchLatest();
    }, 30_000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMonthlyDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const availableMonths = useMemo(() => {
    const map = new Map<string, number>();
    statuses.forEach((s) => {
      if (s.date && s.date.length >= 7) {
        const key = s.date.slice(0, 7);
        map.set(key, (map.get(key) || 0) + 1);
      }
    });

    if (map.size === 0) {
      const nowKey = new Date().toISOString().slice(0, 7);
      map.set(nowKey, 0);
    }

    const sortedKeys = Array.from(map.keys()).sort((a, b) => b.localeCompare(a));
    return sortedKeys.map((key) => {
      let label = key;
      try {
        const [yearStr, monthStr] = key.split("-");
        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10);
        if (!isNaN(year) && !isNaN(month)) {
          label = new Date(year, month - 1, 1).toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          });
        }
      } catch {
        // fallback
      }
      return {
        key,
        label,
        count: map.get(key) || 0,
      };
    });
  }, [statuses]);

  const filteredStatuses = statuses.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return (
      matchesDateSearch(s.date, q) ||
      (s.statusText || "").toLowerCase().includes(q) ||
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
    <div className="min-h-screen bg-background relative overflow-hidden pt-16 lg:pt-20 pb-16 lg:pb-24">
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-accent/3 rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse-slow" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.005)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.005)_1px,transparent_1px)] bg-[size:72px_72px] pointer-events-none -z-20 opacity-30" />

      <div className="max-w-2xl mx-auto px-5 relative z-10 space-y-6">

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

          <div className="flex items-center sm:flex-col sm:items-end gap-2 shrink-0 w-auto sm:w-auto">
            <Link
              href="/admin"
              className="inline-flex items-center justify-center gap-1.5 text-[11px] sm:text-xs text-brand-300 hover:text-white border border-white/8 bg-white/2 hover:bg-white/5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl transition-all font-semibold hover:border-accent/30 w-auto"
            >
              <PlusCircle className="w-3.5 h-3.5 text-accent" />
              Admin
            </Link>

            {/* See Monthly button — located just below admin button */}
            <div className="relative w-auto sm:w-auto" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setMonthlyDropdownOpen((prev) => !prev)}
                className="inline-flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-brand-300 hover:text-white border border-white/8 bg-white/2 hover:bg-white/5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl transition-all font-semibold hover:border-accent/30 w-auto cursor-pointer"
                aria-haspopup="true"
                aria-expanded={monthlyDropdownOpen}
              >
                <span className="inline-flex items-center gap-1.5 sm:gap-2">
                  <Calendar className="w-3.5 h-3.5 text-yellow-400" />
                  See Monthly
                </span>
                <ChevronDown className={`w-3 h-3 text-brand-400 transition-transform duration-200 ${monthlyDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {monthlyDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-48 rounded-xl border border-zinc-700/80 bg-[#09090b]/95 backdrop-blur-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 divide-y divide-white/5">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-brand-400 px-2.5 py-1">
                    Select Month
                  </div>
                  <div className="pt-1 max-h-60 overflow-y-auto space-y-0.5">
                    {availableMonths.map((m) => (
                      <Link
                        key={m.key}
                        href={`/status/monthly/${m.key}`}
                        onClick={() => setMonthlyDropdownOpen(false)}
                        className="flex items-center justify-between px-2.5 py-2 text-xs text-zinc-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors group"
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
          </div>
        </div>


        {/* ── Search ── */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by date (e.g. 12 August, July 22), subject, task, moment…"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setVisibleCount(5);
            }}
            className="w-full bg-zinc-950/30 border border-white/5 focus:border-accent/40 rounded-2xl pl-11 pr-11 py-3 text-sm text-white placeholder-brand-500 focus:outline-none focus:ring-1 focus:ring-accent/20 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setVisibleCount(5);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-brand-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ── Log Feed ── */}
        <div className="space-y-5">
          {filteredStatuses.length === 0 ? (
            (() => {
              const isDate = isDateQuery(searchQuery);
              const activeQuote = getQuoteForQuery(searchQuery);
              return isDate ? (
                <div className="rounded-3xl border border-amber-500/25 bg-gradient-to-b from-amber-500/10 via-[#09090b]/95 to-[#09090b] backdrop-blur-2xl p-6 sm:p-8 text-center space-y-5 shadow-2xl shadow-amber-950/20 animate-in fade-in zoom-in-95 duration-200">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-semibold font-mono tracking-wide">
                    <CalendarX className="w-3.5 h-3.5 text-amber-400" />
                    <span>Workspace Log Notice</span>
                  </div>

                  <div className="space-y-2 max-w-lg mx-auto">
                    <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                      Nishant&apos;s work is not stored for this date
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                      No activity log exists for <span className="text-amber-300 font-semibold">&ldquo;{searchQuery}&rdquo;</span> in our database. Some days are dedicated to deep offline focus, solving tough problems away from the keyboard, exam preparation, or well-deserved rest.
                    </p>
                  </div>

                  {/* Motivational Quote Block */}
                  <div className="relative max-w-md mx-auto p-4 sm:p-5 rounded-2xl border border-amber-500/20 bg-black/50 backdrop-blur-md text-left shadow-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <Quote className="w-5 h-5 text-amber-400/80 rotate-180" />
                      <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400/90 font-semibold flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-400" /> Thought For The Day
                      </span>
                    </div>
                    <blockquote className="text-xs sm:text-sm text-zinc-100 italic leading-relaxed font-sans">
                      &ldquo;{activeQuote.quote}&rdquo;
                    </blockquote>
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                      <span className="text-amber-300 font-medium">— {activeQuote.author}</span>
                      <span className="text-zinc-500">2 AM Study</span>
                    </div>
                  </div>

                  {/* Navigation Actions */}
                  <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setVisibleCount(5);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-zinc-950 hover:bg-accent/90 text-xs font-bold transition-all shadow-md shadow-accent/20 cursor-pointer"
                    >
                      <span>View Available Logs</span>
                      <span aria-hidden="true">→</span>
                    </button>
                    {availableMonths.length > 0 && (
                      <Link
                        href={`/status/monthly/${availableMonths[0].key}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold transition-all"
                      >
                        <Calendar className="w-3.5 h-3.5 text-yellow-400" />
                        <span>Browse Monthly Summaries</span>
                      </Link>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 border border-dashed border-white/5 rounded-3xl glass-strong space-y-3">
                  <Search className="w-6 h-6 text-brand-600 mx-auto" />
                  <div className="space-y-1">
                    <p className="text-brand-300 text-sm font-medium">No matching logs found for &ldquo;{searchQuery}&rdquo;</p>
                    <p className="text-brand-500 text-xs max-w-sm mx-auto">Try searching by date (e.g. 12 August, July 22), subject name, or task keywords.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setVisibleCount(5);
                    }}
                    className="text-xs text-accent hover:underline font-mono inline-block pt-1 cursor-pointer"
                  >
                    Clear search
                  </button>
                </div>
              );
            })()
          ) : (
            filteredStatuses.slice(0, visibleCount).map((status) => {
              const structured = isStructured(status);
              const net = (status.finance?.income || 0) - (status.finance?.expense || 0);

              return (
                <div
                  key={status.id}
                  className="rounded-2xl border border-zinc-700/70 hover:border-zinc-500/80 bg-[#09090b]/90 backdrop-blur-xl transition-all duration-300 shadow-lg shadow-black/50 overflow-hidden"
                >
                  <article>
                  {/* ── Card Header ── */}
                  <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 sm:py-3.5 border-b border-white/5 bg-white/2">
                    <Link
                      href={`/status/${encodeURIComponent(status.date || status.id)}`}
                      className="flex items-center gap-2 group transition-colors min-w-0"
                      title={`Permalink for ${status.date}`}
                    >
                      <Calendar className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5 sm:mt-0" />
                      {/* Laptop / Desktop: 1 line */}
                      <span className="hidden sm:inline text-sm font-bold text-white group-hover:text-accent transition-colors">
                        {formatDate(status.date)}
                      </span>
                      {/* Phone user: 2 lines */}
                      <span className="sm:hidden flex flex-col leading-tight text-left">
                        <span className="text-xs font-bold text-white group-hover:text-accent transition-colors">
                          {status.date ? new Date(status.date).toLocaleDateString("en-US", { weekday: "long" }) : ""}
                        </span>
                        <span className="text-[10.5px] text-zinc-400 font-medium">
                          {status.date ? new Date(status.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : status.date}
                        </span>
                      </span>
                    </Link>

                    {/* Right side: 2 lines on phone, 1 line on desktop */}
                    <div className="flex flex-col items-end sm:flex-row sm:items-center gap-0.5 sm:gap-2 text-right shrink-0">
                      {status.mood != null && (
                        <span className="text-[11px] sm:text-xs font-semibold text-amber-400 leading-tight">
                          {moodEmoji(status.mood)} {status.mood}/10
                        </span>
                      )}
                      <span className="text-[10px] text-zinc-400 sm:text-zinc-300 font-mono shrink-0 leading-tight">
                        {formatTime(status.updatedAt)}
                      </span>
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
                              <span>Blog - <span className="font-bold text-white">{status.content.blogs || 0}</span></span>
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

          {/* ── View More Button ── */}
          {filteredStatuses.length > visibleCount && (
            <div className="text-center pt-4">
              <button
                onClick={() => setVisibleCount((prev) => prev + 5)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 hover:border-accent/40 text-xs font-bold text-white hover:text-accent transition-all duration-300 shadow-lg hover:bg-white/8 group font-mono"
              >
                <span>View More Logs ({filteredStatuses.length - visibleCount} remaining)</span>
                <span className="text-accent text-sm group-hover:translate-y-0.5 transition-transform">↓</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
