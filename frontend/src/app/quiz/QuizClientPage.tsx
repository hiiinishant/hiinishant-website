"use client";

import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { API_BASE } from "@/lib/api";
import Link from "next/link";

const getApiBase = () => {
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "http://localhost:5000";
  }
  return API_BASE || "http://localhost:5000";
};

interface Quiz {
  id?: string;
  date: string;
  subject: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption?: "A" | "B" | "C" | "D";
  attemptsCount?: number;
}

interface UserResponse {
  selectedOption: "A" | "B" | "C" | "D";
  isCorrect: boolean;
  xpEarned: number;
  correctOption: "A" | "B" | "C" | "D";
}

interface UserStats {
  totalXP: number;
  totalCorrect: number;
  totalAttempts: number;
  currentStreak: number;
  longestStreak: number;
}

interface LeaderboardUser {
  rank: number;
  userId: string;
  displayName: string;
  username: string;
  photoURL?: string;
  totalXP: number;
  totalCorrect: number;
  totalAttempts: number;
  currentStreak: number;
  longestStreak: number;
  lastAnsweredDate?: string | null;
}

interface SubjectItem {
  name: string;
  logo: string;
  color: string;
  glow: string;
  border: string;
}

// Subject visual config — fallback used for any subject not listed here
const SUBJECT_STYLES: Record<string, { logo: string; color: string }> = {
  "JavaScript":      { logo: "JS", color: "text-yellow-400 bg-yellow-400/10 border-yellow-500/20" },
  "React":           { logo: "⚛",  color: "text-cyan-400 bg-cyan-400/10 border-cyan-500/20" },
  "HTML & CSS":      { logo: "🎨", color: "text-orange-400 bg-orange-400/10 border-orange-500/20" },
  "SQL & Databases": { logo: "💾", color: "text-purple-400 bg-purple-400/10 border-purple-500/20" },
  "Data Structures": { logo: "🌳", color: "text-emerald-400 bg-emerald-400/10 border-emerald-500/20" },
  "Algorithms":      { logo: "⚙",  color: "text-pink-400 bg-pink-400/10 border-pink-500/20" },
  "Python":          { logo: "🐍", color: "text-green-400 bg-green-400/10 border-green-500/20" },
  "Node.js":         { logo: "🟢", color: "text-lime-400 bg-lime-400/10 border-lime-500/20" },
  "TypeScript":      { logo: "TS", color: "text-blue-400 bg-blue-400/10 border-blue-500/20" },
  "System Design":   { logo: "🏗",  color: "text-violet-400 bg-violet-400/10 border-violet-500/20" },
};

const getSubjectStyle = (name: string) =>
  SUBJECT_STYLES[name] ?? { logo: "📚", color: "text-brand-400 bg-white/5 border-white/10" };

export default function QuizClientPage() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [activeSubject, setActiveSubject] = useState<string>("Daily Challenge");
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [responses, setResponses] = useState<Record<string, UserResponse>>({});
  const [stats, setStats] = useState<UserStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [quizLoading, setQuizLoading] = useState(false);
  const [submittingMap, setSubmittingMap] = useState<Record<string, boolean>>({});
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [subjectsList, setSubjectsList] = useState<string[]>([]);

  useEffect(() => {
    if (!auth) return;
    const firebaseAuth = auth;
    const unsubscribe = onAuthStateChanged(firebaseAuth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    setLeaderboardLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/api/quiz/leaderboard`, {
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
      }
    } catch {
      /* silent */
    } finally {
      setLeaderboardLoading(false);
    }
  }, []);

  // Initial leaderboard fetch
  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Fetch subjects from backend (reflects what admin has entered)
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await fetch(`${getApiBase()}/api/quiz/subjects`, {
          signal: AbortSignal.timeout(8000),
        });
        if (res.ok) {
          const data = await res.json();
          setSubjectsList(data.subjects || []);
        }
      } catch { /* silent */ }
    };
    fetchSubjects();
  }, []);

  const loadQuiz = useCallback(async (subject: string) => {
    if (subject === "Leaderboard") {
      fetchLeaderboard();
      setLoading(false);
      return;
    }
    setQuizLoading(true);
    setShowLoginPrompt(false);
    const apiBase = getApiBase();
    try {
      if (subject === "Daily Challenge") {
        const res = await fetch(`${apiBase}/api/quiz/today`, { signal: AbortSignal.timeout(8000) });
        if (res.ok) {
          const data = await res.json();
          setQuizzes(data.quizzes || (data.quiz ? [data.quiz] : []));
        }
      } else {
        const res = await fetch(`${apiBase}/api/quiz/subject/${encodeURIComponent(subject)}`, { signal: AbortSignal.timeout(8000) });
        if (res.ok) {
          const data = await res.json();
          setQuizzes(data.quizzes || (data.quiz ? [data.quiz] : []));
        }
      }
    } catch {
      setQuizzes([]);
    } finally {
      setQuizLoading(false);
      setLoading(false);
    }
  }, [fetchLeaderboard]);

  // Fetch stats once auth resolves
  useEffect(() => {
    if (!user) { setStats(null); return; }
    (async () => {
      const apiBase = getApiBase();
      try {
        const statsRes = await fetch(`${apiBase}/api/quiz/stats/${user.uid}`, { signal: AbortSignal.timeout(8000) });
        if (statsRes.ok) setStats((await statsRes.json()).stats ?? null);
      } catch { /* silent */ }
    })();
  }, [user]);

  // Load default Daily Challenge on startup
  useEffect(() => {
    loadQuiz("Daily Challenge");
  }, [loadQuiz]);

  // Fetch responses whenever user or activeSubject changes
  useEffect(() => {
    if (!user) { setResponses({}); return; }
    (async () => {
      const apiBase = getApiBase();
      try {
        const idToken = await user.getIdToken();
        const responseRes = await fetch(`${apiBase}/api/quiz/response`, {
          headers: { Authorization: `Bearer ${idToken}` },
          signal: AbortSignal.timeout(8000)
        });
        if (responseRes.ok) {
          const data = await responseRes.json();
          setResponses(data.responses || {});
        }
      } catch {
        /* silent */
      }
    })();
  }, [user, activeSubject]);

  const handleSubjectClick = (subject: string) => {
    setActiveSubject(subject);
    loadQuiz(subject);
  };

  const handleOptionClick = async (quizId: string, option: "A" | "B" | "C" | "D", targetDate?: string, quizObj?: Quiz) => {
    if (!user) { setShowLoginPrompt(true); return; }
    if (responses[quizId] || submittingMap[quizId]) return;

    // Determine correct option (from quiz object or existing responses)
    const correctOpt = quizObj?.correctOption || "A";
    const isCorrect = option === correctOpt;
    const xpEarned = isCorrect ? 10 : 2;

    // ⚡ INSTANT OPTIMISTIC RESPONSE (0ms delay!)
    const respItem: UserResponse = {
      selectedOption: option,
      isCorrect,
      xpEarned,
      correctOption: correctOpt,
    };

    setResponses((prev) => ({ ...prev, [quizId]: respItem, [targetDate || ""]: respItem }));

    // Optimistically bump stats & attempt count
    setStats((prev) => {
      if (!prev) return { totalXP: xpEarned, totalCorrect: isCorrect ? 1 : 0, totalAttempts: 1, currentStreak: 1, longestStreak: 1 };
      return {
        ...prev,
        totalXP: prev.totalXP + xpEarned,
        totalCorrect: prev.totalCorrect + (isCorrect ? 1 : 0),
        totalAttempts: prev.totalAttempts + 1,
      };
    });

    setQuizzes((prev) =>
      prev.map((q) => (q.id === quizId || q.date === targetDate ? { ...q, attemptsCount: (q.attemptsCount || 0) + 1 } : q))
    );

    // Silent background sync to Firestore
    setSubmittingMap((prev) => ({ ...prev, [quizId]: true }));
    try {
      const apiBase = getApiBase();
      const idToken = await user.getIdToken();
      const res = await fetch(`${apiBase}/api/quiz/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ selectedOption: option, quizId, quizDate: targetDate }),
      });
      if (res.ok) {
        const result = await res.json();
        const serverRespItem: UserResponse = {
          selectedOption: option,
          isCorrect: result.isCorrect,
          xpEarned: result.xpEarned,
          correctOption: result.correctOption,
        };
        setResponses((prev) => ({ ...prev, [quizId]: serverRespItem, [targetDate || ""]: serverRespItem }));
        if (result.stats) setStats(result.stats);
      }
    } catch {
      /* silent background catch */
    } finally {
      setSubmittingMap((prev) => ({ ...prev, [quizId]: false }));
    }
  };

  const todayLabel = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
  // IST date string (YYYY-MM-DD) — matches publishDate format on backend
  const todayIST = new Date(Date.now() + (5 * 60 + 30) * 60 * 1000).toISOString().slice(0, 10);

  /* ─── LOADING ─── */
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-4xl">
              🧠
            </div>
            <div className="absolute inset-0 rounded-3xl animate-ping bg-amber-500/10 pointer-events-none" />
          </div>
          <p className="text-brand-500 font-mono text-[11px] uppercase tracking-[0.2em] animate-pulse">
            Loading today&apos;s challenge...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-x-clip">
      {/* Ambient glows */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-amber-500/6 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-amber-500/4 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none -z-20 opacity-40" />

      {/* ─── NAV BAR ─── */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-brand-400 hover:text-white transition-colors group">
            <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
            <span className="text-xs font-mono uppercase tracking-widest">Back</span>
          </Link>

          {/* Stat pills & Leaderboard Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSubjectClick("Leaderboard")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 border cursor-pointer ${
                activeSubject === "Leaderboard"
                  ? "bg-amber-500 text-black border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)] scale-[1.02]"
                  : "bg-white/5 border-white/10 text-brand-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <span>🏆</span>
              <span className="hidden sm:inline">Leaderboard</span>
            </button>

            {stats && stats.totalAttempts > 0 ? (
              <>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold">
                  🔥 <span>{stats.currentStreak}</span>
                  <span className="text-orange-500/60 font-normal hidden sm:inline"> day streak</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold">
                  💎 <span>{stats.totalXP}</span>
                  <span className="text-cyan-500/60 font-normal hidden sm:inline"> XP</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold hidden sm:flex">
                  🎯 <span>{Math.round((stats.totalCorrect / stats.totalAttempts) * 100)}%</span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-brand-600 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Live Challenge
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── BODY ─── */}
      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-10 sm:py-14">

        {/* ─── TWO-COLUMN GRID ─── */}
        <div className="flex flex-col lg:flex-row lg:gap-12 xl:gap-16 items-start">

          {/* ══ LEFT COLUMN: Subject logos / menus (Horizontal Chips on Mobile, Vertical Sidebar on Desktop) ══ */}
          <div className="w-full lg:w-[280px] shrink-0 space-y-4 lg:space-y-6 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-2">
            
            {/* 📱 Mobile Subject Chips (Horizontal Scroll Bar) */}
            <div className="lg:hidden">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs font-mono text-brand-400 uppercase tracking-widest flex items-center gap-1.5">
                  <span>📚</span> Quiz Navigation
                </h2>
                <span className="text-[10px] text-amber-400 font-mono bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 font-bold">
                  {subjectsList.length + 2}
                </span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-hide -mx-5 px-5">
                {/* Daily Challenge Chip */}
                <button
                  onClick={() => handleSubjectClick("Daily Challenge")}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold shrink-0 transition-all duration-300 ${
                    activeSubject === "Daily Challenge"
                      ? "bg-amber-500 text-black border-amber-400 shadow-[0_0_16px_rgba(245,158,11,0.3)] scale-[1.02]"
                      : "bg-white/4 border-white/10 text-brand-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span>🔥</span>
                  <span>Daily Challenge</span>
                </button>

                {/* Leaderboard Chip */}
                <button
                  onClick={() => handleSubjectClick("Leaderboard")}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold shrink-0 transition-all duration-300 ${
                    activeSubject === "Leaderboard"
                      ? "bg-amber-500 text-black border-amber-400 shadow-[0_0_16px_rgba(245,158,11,0.3)] scale-[1.02]"
                      : "bg-white/4 border-white/10 text-brand-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span>🏆</span>
                  <span>Leaderboard</span>
                </button>

                {/* Dynamic Subject Chips */}
                {subjectsList.map((subjectName) => {
                  const style = getSubjectStyle(subjectName);
                  const isActive = activeSubject === subjectName;
                  return (
                    <button
                      key={subjectName}
                      onClick={() => handleSubjectClick(subjectName)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold shrink-0 transition-all duration-300 ${
                        isActive
                          ? "bg-amber-500 text-black border-amber-400 shadow-[0_0_16px_rgba(245,158,11,0.3)] scale-[1.02]"
                          : "bg-white/4 border-white/10 text-brand-300 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] ${isActive ? "bg-black/20 text-black" : style.color}`}>
                        {style.logo}
                      </span>
                      <span>{subjectName}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 💻 Desktop Subject List (Vertical Sidebar) */}
            <div className="hidden lg:block">
              <h2 className="text-xs font-mono text-brand-500 uppercase tracking-widest mb-3">Quiz Categories</h2>
              <div className="space-y-2">
                {/* Daily Challenge Option */}
                <button
                  onClick={() => handleSubjectClick("Daily Challenge")}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl border text-left text-xs sm:text-sm transition-all duration-300 cursor-pointer ${
                    activeSubject === "Daily Challenge"
                      ? "border-amber-500/40 bg-amber-500/10 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.08)]"
                      : "border-white/5 bg-white/2 text-brand-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-base shrink-0">
                    🔥
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">Daily Challenge</p>
                    <p className="text-[10px] text-brand-500 font-mono">Today&apos;s Quiz</p>
                  </div>
                </button>

                {/* Leaderboard Option */}
                <button
                  onClick={() => handleSubjectClick("Leaderboard")}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl border text-left text-xs sm:text-sm transition-all duration-300 cursor-pointer ${
                    activeSubject === "Leaderboard"
                      ? "border-amber-500/40 bg-amber-500/10 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.08)]"
                      : "border-white/5 bg-white/2 text-brand-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="w-8 h-8 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-base shrink-0">
                    🏆
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">Leaderboard</p>
                    <p className="text-[10px] text-brand-500 font-mono">Top Students & Streaks</p>
                  </div>
                </button>

                {/* Individual Subjects — dynamically reflecting admin entries */}
                {subjectsList.map((subjectName) => {
                  const style = getSubjectStyle(subjectName);
                  return (
                    <button
                      key={subjectName}
                      onClick={() => handleSubjectClick(subjectName)}
                      className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl border text-left text-xs sm:text-sm transition-all duration-300 cursor-pointer ${
                        activeSubject === subjectName
                          ? "border-amber-500/40 bg-amber-500/10 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.08)]"
                          : "border-white/5 bg-white/2 text-brand-400 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${style.color}`}>
                        {style.logo}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold truncate">{subjectName}</p>
                        <p className="text-[10px] text-brand-500 font-mono">Practice Quiz</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ══ RIGHT COLUMN: quiz question + options OR Leaderboard view ══ */}
          <div className="flex-1 min-w-0 space-y-8 mt-4 lg:mt-0 w-full">

            {activeSubject === "Leaderboard" ? (
              /* ══ FULL LEADERBOARD VIEW ══ */
              <div className="space-y-8 animate-fade-in">
                {/* Header Card */}
                <div className="p-6 sm:p-8 rounded-3xl border border-amber-500/20 bg-gradient-to-b from-amber-500/10 via-zinc-950/80 to-zinc-950 relative overflow-hidden shadow-[0_10px_35px_rgba(245,158,11,0.08)]">
                  <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-amber-400 font-bold mb-2">
                        <span>🏆</span>
                        <span>Hall of Fame</span>
                        <span className="text-brand-600">·</span>
                        <span className="text-brand-400">Live Rankings</span>
                      </div>
                      <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                        Student Leaderboard
                      </h1>
                      <p className="text-xs sm:text-sm text-brand-300 mt-1 max-w-xl leading-relaxed">
                        Rankings are updated live based on total XP earned, quiz accuracy, and unbroken daily streaks. Answer daily to climb the ranks!
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={fetchLeaderboard}
                        disabled={leaderboardLoading}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-brand-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <span className={leaderboardLoading ? "animate-spin" : ""}>🔄</span>
                        <span>Refresh</span>
                      </button>
                    </div>
                  </div>
                </div>

                {leaderboardLoading ? (
                  <div className="h-64 flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 border-2 border-amber-400/40 border-t-amber-400 rounded-full animate-spin" />
                    <p className="text-xs font-mono text-brand-500 uppercase tracking-wider">Loading rankings...</p>
                  </div>
                ) : leaderboard.length === 0 ? (
                  <div className="p-10 sm:p-14 text-center border border-white/8 rounded-3xl bg-white/2 space-y-4">
                    <span className="text-5xl block">🥇</span>
                    <h3 className="text-lg font-bold text-white">Be the First on the Leaderboard!</h3>
                    <p className="text-xs text-brand-400 max-w-md mx-auto leading-relaxed">
                      No students have scored on the leaderboard yet. Solve today&apos;s Daily Challenge to claim the #1 spot!
                    </p>
                    <button
                      onClick={() => handleSubjectClick("Daily Challenge")}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] cursor-pointer"
                    >
                      <span>🔥 Solve Today&apos;s Challenge</span>
                    </button>
                  </div>
                ) : (
                  <>
                    {/* ─── TOP 3 PODIUM ─── */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 items-end pt-4 pb-2">
                      {/* #2 Rank - Silver (Left on Desktop) */}
                      {leaderboard[1] && (
                        <div className="order-2 sm:order-1 p-5 rounded-2xl border border-slate-300/30 bg-gradient-to-b from-slate-400/10 to-zinc-950 text-center relative overflow-hidden shadow-[0_8px_25px_rgba(148,163,184,0.1)] hover:-translate-y-1 transition-all">
                          <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-slate-300/20 text-slate-200 text-[10px] font-bold font-mono border border-slate-300/30">
                            #2 SILVER
                          </div>
                          <div className="w-16 h-16 rounded-full mx-auto mb-3 bg-slate-400/20 border-2 border-slate-300/60 flex items-center justify-center text-2xl shadow-inner">
                            {leaderboard[1].photoURL ? (
                              <img src={leaderboard[1].photoURL} alt={leaderboard[1].displayName} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <span>🥈</span>
                            )}
                          </div>
                          <h3 className="font-bold text-white text-sm sm:text-base truncate mb-0.5">
                            {leaderboard[1].displayName}
                          </h3>
                          {leaderboard[1].username && (
                            <p className="text-[11px] font-mono text-brand-400 truncate mb-3">@{leaderboard[1].username}</p>
                          )}
                          <div className="flex items-center justify-center gap-2 pt-2 border-t border-white/8 text-xs">
                            <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 font-mono font-bold">
                              💎 {leaderboard[1].totalXP} XP
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-orange-500/15 text-orange-400 font-mono font-bold">
                              🔥 {leaderboard[1].currentStreak}d
                            </span>
                          </div>
                        </div>
                      )}

                      {/* #1 Rank - Gold (Center, Elevated) */}
                      {leaderboard[0] && (
                        <div className="order-1 sm:order-2 p-6 rounded-3xl border-2 border-amber-400/60 bg-gradient-to-b from-amber-500/20 via-zinc-900 to-zinc-950 text-center relative overflow-hidden shadow-[0_0_40px_rgba(245,158,11,0.25)] sm:-translate-y-3 hover:sm:-translate-y-4 transition-all">
                          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-400 text-black text-[10px] font-extrabold font-mono uppercase tracking-widest shadow-md">
                            👑 #1 CHAMPION
                          </div>
                          <div className="w-20 h-20 rounded-full mx-auto mt-4 mb-3 bg-amber-500/25 border-2 border-amber-400 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(245,158,11,0.4)]">
                            {leaderboard[0].photoURL ? (
                              <img src={leaderboard[0].photoURL} alt={leaderboard[0].displayName} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <span>🥇</span>
                            )}
                          </div>
                          <h3 className="font-extrabold text-white text-base sm:text-lg truncate mb-0.5">
                            {leaderboard[0].displayName}
                          </h3>
                          {leaderboard[0].username && (
                            <p className="text-xs font-mono text-amber-300/80 truncate mb-3">@{leaderboard[0].username}</p>
                          )}
                          <div className="flex items-center justify-center gap-2 pt-3 border-t border-amber-500/20 text-xs">
                            <span className="px-2.5 py-1 rounded-lg bg-amber-400 text-black font-mono font-extrabold shadow-sm">
                              💎 {leaderboard[0].totalXP} XP
                            </span>
                            <span className="px-2.5 py-1 rounded-lg bg-orange-500/20 text-orange-300 font-mono font-bold border border-orange-500/30">
                              🔥 {leaderboard[0].currentStreak}d Streak
                            </span>
                          </div>
                        </div>
                      )}

                      {/* #3 Rank - Bronze (Right on Desktop) */}
                      {leaderboard[2] && (
                        <div className="order-3 p-5 rounded-2xl border border-amber-700/40 bg-gradient-to-b from-amber-700/15 to-zinc-950 text-center relative overflow-hidden shadow-[0_8px_25px_rgba(180,83,9,0.1)] hover:-translate-y-1 transition-all">
                          <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-amber-700/30 text-amber-300 text-[10px] font-bold font-mono border border-amber-600/30">
                            #3 BRONZE
                          </div>
                          <div className="w-16 h-16 rounded-full mx-auto mb-3 bg-amber-800/20 border-2 border-amber-600/50 flex items-center justify-center text-2xl shadow-inner">
                            {leaderboard[2].photoURL ? (
                              <img src={leaderboard[2].photoURL} alt={leaderboard[2].displayName} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <span>🥉</span>
                            )}
                          </div>
                          <h3 className="font-bold text-white text-sm sm:text-base truncate mb-0.5">
                            {leaderboard[2].displayName}
                          </h3>
                          {leaderboard[2].username && (
                            <p className="text-[11px] font-mono text-brand-400 truncate mb-3">@{leaderboard[2].username}</p>
                          )}
                          <div className="flex items-center justify-center gap-2 pt-2 border-t border-white/8 text-xs">
                            <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 font-mono font-bold">
                              💎 {leaderboard[2].totalXP} XP
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-orange-500/15 text-orange-400 font-mono font-bold">
                              🔥 {leaderboard[2].currentStreak}d
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ─── YOUR RANK CARD ─── */}
                    {user && stats && (
                      <div className="p-4 sm:p-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_0_20px_rgba(245,158,11,0.05)]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 font-bold font-mono">
                            {leaderboard.findIndex((u) => u.userId === user.uid) !== -1
                              ? `#${leaderboard.findIndex((u) => u.userId === user.uid) + 1}`
                              : "🎯"}
                          </div>
                          <div>
                            <p className="text-xs font-mono text-amber-400 uppercase tracking-wider font-bold">Your Ranking</p>
                            <p className="text-sm font-bold text-white">
                              {user.displayName || "You"} {leaderboard.findIndex((u) => u.userId === user.uid) !== -1 ? `(Rank #${leaderboard.findIndex((u) => u.userId === user.uid) + 1})` : "• Unranked"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-3 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-mono font-bold">
                            💎 {stats.totalXP} XP
                          </span>
                          <span className="px-3 py-1 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-mono font-bold">
                            🔥 {stats.currentStreak} Day Streak
                          </span>
                          <span className="px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold">
                            🎯 {stats.totalAttempts > 0 ? Math.round((stats.totalCorrect / stats.totalAttempts) * 100) : 0}% Accuracy
                          </span>
                        </div>
                      </div>
                    )}

                    {/* ─── FULL RANKINGS LIST ─── */}
                    <div className="rounded-3xl border border-white/8 bg-zinc-950/70 overflow-hidden shadow-xl">
                      <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between text-xs font-mono text-brand-400 uppercase tracking-wider">
                        <span>Rank & Student</span>
                        <div className="flex items-center gap-6 sm:gap-10">
                          <span className="hidden sm:inline">Streak</span>
                          <span className="hidden sm:inline">Accuracy</span>
                          <span>Total Score</span>
                        </div>
                      </div>

                      <div className="divide-y divide-white/5">
                        {leaderboard.map((item, idx) => {
                          const isCurrentUser = user && item.userId === user.uid;
                          const accuracy = item.totalAttempts > 0 ? Math.round((item.totalCorrect / item.totalAttempts) * 100) : 0;

                          return (
                            <div
                              key={item.userId || idx}
                              className={`px-5 py-4 flex items-center justify-between transition-colors ${
                                isCurrentUser
                                  ? "bg-amber-500/10 hover:bg-amber-500/15"
                                  : "hover:bg-white/3"
                              }`}
                            >
                              {/* Left: Rank + Avatar + Name */}
                              <div className="flex items-center gap-3.5 min-w-0">
                                <span
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold font-mono shrink-0 ${
                                    idx === 0
                                      ? "bg-amber-400 text-black shadow-sm font-extrabold"
                                      : idx === 1
                                      ? "bg-slate-300 text-black font-extrabold"
                                      : idx === 2
                                      ? "bg-amber-700 text-white font-extrabold"
                                      : "bg-white/5 text-brand-400"
                                  }`}
                                >
                                  {idx + 1}
                                </span>

                                <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-sm font-bold text-amber-300 shrink-0 overflow-hidden">
                                  {item.photoURL ? (
                                    <img src={item.photoURL} alt={item.displayName} className="w-full h-full object-cover" />
                                  ) : (
                                    <span>{item.displayName.charAt(0).toUpperCase()}</span>
                                  )}
                                </div>

                                <div className="min-w-0">
                                  <p className={`text-sm font-bold truncate ${isCurrentUser ? "text-amber-300" : "text-white"}`}>
                                    {item.displayName} {isCurrentUser && <span className="text-[10px] text-amber-400 font-mono font-normal">(You)</span>}
                                  </p>
                                  <p className="text-[11px] font-mono text-brand-500 truncate">
                                    {item.username ? `@${item.username}` : `${item.totalAttempts} quizzes solved`}
                                  </p>
                                </div>
                              </div>

                              {/* Right: Streak + Accuracy + XP */}
                              <div className="flex items-center gap-4 sm:gap-8 shrink-0">
                                <div className="hidden sm:flex items-center gap-1 text-xs font-mono text-orange-400">
                                  <span>🔥</span>
                                  <span>{item.currentStreak}d</span>
                                </div>

                                <div className="hidden sm:flex items-center gap-1 text-xs font-mono text-emerald-400">
                                  <span>🎯</span>
                                  <span>{accuracy}%</span>
                                </div>

                                <div className="px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono font-bold">
                                  💎 {item.totalXP} XP
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* Normal Quiz Questions rendering */
              quizLoading ? (
                <div className="h-64 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-2 border-amber-400/40 border-t-amber-400 rounded-full animate-spin" />
                  <p className="text-xs font-mono text-brand-500 uppercase tracking-wider">Fetching quizzes...</p>
                </div>
              ) : quizzes.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center gap-4 text-center border border-white/5 rounded-3xl bg-white/2 p-6">
                  <p className="text-2xl">⚠️</p>
                  <div>
                    <h3 className="text-base font-bold text-white">No Quiz Available</h3>
                    <p className="text-xs text-brand-500 mt-1">There are no published quizzes for {activeSubject} yet.</p>
                  </div>
                </div>
              ) : (
                quizzes.map((quiz, qIdx) => {
                  const quizId = quiz.id || quiz.date;
                  const response = responses[quizId] || responses[quiz.date];
                  const hasAnswered = !!response;
                  const submitting = !!submittingMap[quizId];
                  // Past quiz: backend only returns correctOption for past subject quizzes (publishDate < today)
                  const isPastQuiz = !!quiz.correctOption && activeSubject !== "Daily Challenge" && quiz.date < todayIST;

                  return (
                    <div key={quizId || qIdx} className="p-6 sm:p-8 rounded-3xl border border-white/6 bg-brand-900/10 space-y-6">
                      {/* ─── HERO HEADER ─── */}
                      <div className="space-y-4">
                        {/* Date + subject + question index badges */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                            Question {qIdx + 1} of {quizzes.length}
                          </span>
                          <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                            🧠 {quiz.subject || "General"}
                          </span>
                          <span className="px-3 py-1 rounded-full bg-white/4 border border-white/8 text-[10px] font-mono text-brand-500">
                            {activeSubject === "Daily Challenge" ? todayLabel : `Date: ${quiz.date}`}
                          </span>
                          <span className="px-3 py-1 rounded-full bg-white/4 border border-white/8 text-[10px] font-mono text-brand-500">
                            👥 {quiz.attemptsCount || 0} attempts
                          </span>
                        </div>

                        {/* Question */}
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-[1.35] tracking-tight">
                          {quiz.question}
                        </h2>
                      </div>

                      {/* ─── OPTIONS ─── */}
                      <div className="space-y-3">
                        {(["A", "B", "C", "D"] as const).map((opt) => {
                          const optKey = `option${opt}` as keyof Quiz;
                          const optVal = quiz[optKey] as string;
                          const isSelected = response?.selectedOption === opt;
                          // For past quizzes use quiz.correctOption (returned by backend); for live use user's response
                          const isCorrectOpt = isPastQuiz ? quiz.correctOption === opt : response?.correctOption === opt;

                          let cardBase = "relative group/opt flex items-center gap-4 w-full text-left px-5 py-4 lg:py-5 rounded-2xl border text-sm lg:text-base transition-all duration-300";
                          let cardState = "";
                          let labelBase = "w-9 h-9 lg:w-11 lg:h-11 rounded-xl flex items-center justify-center text-xs lg:text-sm font-bold font-mono shrink-0 transition-all duration-300";
                          let labelState = "";
                          let textState = "text-brand-200";

                          if (isPastQuiz) {
                            // Past challenge — reveal correct answer, all options clearly visible
                            if (opt === quiz.correctOption) {
                              cardState = "border-emerald-500/50 bg-emerald-500/12 shadow-[0_0_24px_rgba(16,185,129,0.15)] cursor-default";
                              labelState = "bg-emerald-500/25 text-emerald-300 font-extrabold";
                              textState = "text-emerald-100 font-semibold";
                            } else {
                              cardState = "border-white/10 bg-white/4 cursor-default";
                              labelState = "bg-white/10 text-brand-300 font-bold";
                              textState = "text-brand-200 font-normal";
                            }
                          } else if (!hasAnswered) {
                            // Unanswered live quiz option — clear contrast and glowing hover state
                            cardState = "border-white/12 bg-white/4 hover:bg-amber-500/10 hover:border-amber-500/40 hover:shadow-[0_0_24px_rgba(245,158,11,0.12)] cursor-pointer";
                            labelState = "bg-amber-500/15 text-amber-300 group-hover/opt:bg-amber-500/30 group-hover/opt:text-amber-200 font-bold";
                            textState = "text-brand-100 group-hover/opt:text-white font-medium";
                          } else if (isCorrectOpt) {
                            // Correct option revealed
                            cardState = "border-emerald-500/50 bg-emerald-500/12 shadow-[0_0_24px_rgba(16,185,129,0.15)] cursor-default";
                            labelState = "bg-emerald-500/25 text-emerald-300 font-extrabold";
                            textState = "text-emerald-100 font-semibold";
                          } else if (isSelected) {
                            // User selected wrong option
                            cardState = "border-red-500/50 bg-red-500/12 shadow-[0_0_24px_rgba(239,68,68,0.15)] cursor-default";
                            labelState = "bg-red-500/25 text-red-300 font-extrabold";
                            textState = "text-red-100 font-semibold";
                          } else {
                            // Other unselected options after answering — fully visible and readable
                            cardState = "border-white/10 bg-white/4 cursor-default";
                            labelState = "bg-white/10 text-brand-300 font-bold";
                            textState = "text-brand-200 font-normal";
                          }

                          return (
                            <button
                              key={opt}
                              disabled={hasAnswered || submitting || isPastQuiz}
                              onClick={() => handleOptionClick(quizId, opt, quiz.date, quiz)}
                              className={`${cardBase} ${cardState}`}
                            >
                              <span className={`${labelBase} ${labelState}`}>
                                {isPastQuiz
                                  ? (opt === quiz.correctOption ? "✓" : opt)
                                  : isCorrectOpt && hasAnswered
                                    ? "✓"
                                    : isSelected && !isCorrectOpt && hasAnswered
                                      ? "✗"
                                      : opt}
                              </span>
                              <span className={`flex-1 leading-snug ${textState} transition-colors duration-300`}>
                                {optVal}
                              </span>
                              {!hasAnswered && !isPastQuiz && (
                                <svg className="w-4 h-4 text-amber-400/0 group-hover/opt:text-amber-400/70 transition-all duration-300 shrink-0 -translate-x-1 group-hover/opt:translate-x-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* ─── SUBMITTING SPINNER ─── */}
                      {submitting && (
                        <div className="flex items-center justify-center gap-2 text-brand-500 text-xs font-mono">
                          <div className="w-3.5 h-3.5 border-2 border-amber-400/40 border-t-amber-400 rounded-full animate-spin" />
                          Saving your answer...
                        </div>
                      )}

                      {/* ─── PAST QUIZ CLOSED BANNER ─── */}
                      {isPastQuiz && !hasAnswered && (
                        <div className="p-4 rounded-2xl border border-white/10 bg-white/3 flex items-start gap-3 animate-fade-in">
                          <span className="text-lg mt-0.5">🔒</span>
                          <div>
                            <p className="text-sm font-bold text-brand-200">Challenge Closed</p>
                            <p className="text-xs text-brand-500 mt-0.5 leading-relaxed">
                              This was the Daily Challenge on{" "}
                              <span className="text-brand-300 font-mono">{quiz.date}</span>. The window to answer has passed — correct answer is shown above.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* ─── RESULT CARD (user answered this quiz when it was live) ─── */}
                      {hasAnswered && (
                        <div className={`p-5 rounded-2xl border space-y-4 animate-fade-in ${
                          response.isCorrect
                            ? "border-emerald-500/25 bg-emerald-500/5"
                            : "border-red-500/20 bg-red-500/5"
                        }`}>
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className={`text-sm font-bold ${response.isCorrect ? "text-emerald-400" : "text-red-400"}`}>
                              {response.isCorrect ? "✅ Correct!" : "❌ Incorrect"}
                            </span>
                            <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                              response.isCorrect ? "bg-amber-500/15 text-amber-400" : "bg-white/5 text-brand-400"
                            }`}>
                              +{response.xpEarned} XP {response.isCorrect ? "Earned" : "Participation"}
                            </span>
                          </div>

                          <p className="text-sm text-brand-300 leading-relaxed font-medium">
                            {response.isCorrect
                              ? "You earned +10 XP"
                              : "Better luck next time!"}
                          </p>

                          <div className="flex items-center gap-2 text-xs font-mono text-brand-500">
                            Correct answer:
                            <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-400 font-bold">
                              {response.correctOption}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* ─── LOGIN PROMPT (only for live today's quiz) ─── */}
                      {showLoginPrompt && !hasAnswered && !isPastQuiz && (
                        <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-3 animate-fade-in">
                          <div className="flex items-start gap-3">
                            <span className="text-xl">🔒</span>
                            <div>
                              <p className="text-sm font-semibold text-white mb-1">Sign in to save your answer</p>
                              <p className="text-xs text-brand-400 leading-relaxed">
                                Join Nsgram to answer today&apos;s quiz, earn XP, and build your daily streak.
                              </p>
                            </div>
                          </div>
                          <Link
                            href="/login?redirect=/quiz"
                            className="flex items-center justify-center gap-2 w-full py-3 bg-amber-500 text-black text-xs font-bold rounded-xl hover:bg-amber-400 transition-colors uppercase tracking-wider"
                          >
                            Sign In to Save Answer →
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                })
              )
            )}

            {/* ─── CLOSE QUIZ (mobile/tablet only) ─── */}
            <div className="flex justify-center pt-4 lg:hidden">
              <Link
                href="/"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/8 bg-white/3 text-sm font-semibold text-brand-300 hover:bg-white/6 hover:text-white hover:border-white/15 transition-all duration-300"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Close Quiz
              </Link>
            </div>

          </div>{/* end RIGHT COLUMN */}

        </div>{/* end two-column grid */}
      </div>
    </div>
  );
}
