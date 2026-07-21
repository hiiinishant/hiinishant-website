"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Link from "next/link";

const getApiBase = () => {
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "http://localhost:5000";
  }
  return process.env.NEXT_PUBLIC_BACKEND_URL || "https://hiinishant-backend.onrender.com";
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
  }, []);

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

  const loadQuiz = async (subject: string) => {
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
  };

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

          {/* Stat pills */}
          {stats && stats.totalAttempts > 0 ? (
            <div className="flex items-center gap-2">
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
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-brand-600 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Live Challenge
            </div>
          )}
        </div>
      </div>

      {/* ─── BODY ─── */}
      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-10 sm:py-14">

        {/* ─── TWO-COLUMN GRID ─── */}
        <div className="flex flex-col lg:flex-row lg:gap-12 xl:gap-16 items-start">

          {/* ══ LEFT COLUMN: Subject logos / menus (Sticky & Scrollable) ══ */}
          <div className="w-full lg:w-[280px] shrink-0 space-y-6 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto pr-2 scrollbar-thin">
            <div>
              <h2 className="text-xs font-mono text-brand-500 uppercase tracking-widest mb-3">Quiz Categories</h2>
              <div className="space-y-2">
                {/* Daily Challenge Option */}
                <button
                  onClick={() => handleSubjectClick("Daily Challenge")}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl border text-left text-xs sm:text-sm transition-all duration-300 ${
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

                {/* Individual Subjects — dynamically reflecting admin entries */}
                {subjectsList.map((subjectName) => {
                  const style = getSubjectStyle(subjectName);
                  return (
                    <button
                      key={subjectName}
                      onClick={() => handleSubjectClick(subjectName)}
                      className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl border text-left text-xs sm:text-sm transition-all duration-300 ${
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

          {/* ══ RIGHT COLUMN: quiz question + options ══ */}
          <div className="flex-1 min-w-0 space-y-10 mt-8 lg:mt-0 w-full">

            {quizLoading ? (
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
                        let textState = "text-brand-300";

                        if (isPastQuiz) {
                          // Past challenge — reveal correct answer, all options locked
                          if (opt === quiz.correctOption) {
                            cardState = "border-emerald-500/35 bg-emerald-500/8 shadow-[0_0_24px_rgba(16,185,129,0.08)] cursor-default";
                            labelState = "bg-emerald-500/20 text-emerald-400";
                            textState = "text-emerald-200 font-medium";
                          } else {
                            cardState = "border-white/4 bg-white/1 opacity-40 cursor-default";
                            labelState = "bg-white/5 text-brand-600";
                            textState = "text-brand-500";
                          }
                        } else if (!hasAnswered) {
                          cardState = "border-white/8 bg-white/2 hover:bg-amber-500/5 hover:border-amber-500/25 hover:shadow-[0_0_20px_rgba(245,158,11,0.06)] cursor-pointer";
                          labelState = "bg-amber-500/10 text-amber-400 group-hover/opt:bg-amber-500/20 group-hover/opt:text-amber-300";
                          textState = "text-brand-300 group-hover/opt:text-white";
                        } else if (isCorrectOpt) {
                          cardState = "border-emerald-500/35 bg-emerald-500/8 shadow-[0_0_24px_rgba(16,185,129,0.08)] cursor-default";
                          labelState = "bg-emerald-500/20 text-emerald-400";
                          textState = "text-emerald-200 font-medium";
                        } else if (isSelected) {
                          cardState = "border-red-500/35 bg-red-500/8 cursor-default";
                          labelState = "bg-red-500/20 text-red-400";
                          textState = "text-red-200 font-medium";
                        } else {
                          cardState = "border-white/4 bg-white/1 opacity-40 cursor-default";
                          labelState = "bg-white/5 text-brand-600";
                          textState = "text-brand-500";
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
                          href="/nsgram"
                          className="flex items-center justify-center gap-2 w-full py-3 bg-amber-500 text-black text-xs font-bold rounded-xl hover:bg-amber-400 transition-colors uppercase tracking-wider"
                        >
                          Join Nsgram / Sign In →
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })
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
