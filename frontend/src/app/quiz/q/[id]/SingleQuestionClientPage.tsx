"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { API_BASE } from "@/lib/api";
import Link from "next/link";
import type { QuizItem } from "@/data/quizServer";

const getApiBase = () => {
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "http://localhost:5000";
  }
  return API_BASE || "http://localhost:5000";
};

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

export default function SingleQuestionClientPage({ initialQuiz }: { initialQuiz: QuizItem }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [quiz, setQuiz] = useState<QuizItem>(initialQuiz);
  const [response, setResponse] = useState<UserResponse | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  // Fetch user response for this quiz question
  useEffect(() => {
    if (!user) { setResponse(null); return; }
    (async () => {
      try {
        const apiBase = getApiBase();
        const idToken = await user.getIdToken();
        const res = await fetch(`${apiBase}/api/quiz/response`, {
          headers: { Authorization: `Bearer ${idToken}` },
          signal: AbortSignal.timeout(8000),
        });
        if (res.ok) {
          const data = await res.json();
          const qId = quiz.id || quiz.date;
          if (data.responses?.[qId]) {
            setResponse(data.responses[qId]);
          }
        }
      } catch { /* silent */ }
    })();
  }, [user, quiz.id, quiz.date]);

  // Fetch stats once auth resolves
  useEffect(() => {
    if (!user) { setStats(null); return; }
    (async () => {
      try {
        const apiBase = getApiBase();
        const res = await fetch(`${apiBase}/api/quiz/stats/${user.uid}`, { signal: AbortSignal.timeout(8000) });
        if (res.ok) setStats((await res.json()).stats ?? null);
      } catch { /* silent */ }
    })();
  }, [user]);

  const handleOptionClick = async (option: "A" | "B" | "C" | "D") => {
    if (!user) { setShowLoginPrompt(true); return; }
    if (response || submitting) return;

    const quizId = quiz.id || quiz.date;
    setSubmitting(true);
    try {
      const apiBase = getApiBase();
      const idToken = await user.getIdToken();
      const res = await fetch(`${apiBase}/api/quiz/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ selectedOption: option, quizId, quizDate: quiz.date }),
      });
      if (res.ok) {
        const result = await res.json();
        setResponse({
          selectedOption: option,
          isCorrect: result.isCorrect,
          xpEarned: result.xpEarned,
          correctOption: result.correctOption,
        });
        if (result.stats) setStats(result.stats);
        setQuiz((prev) => ({ ...prev, attemptsCount: (prev.attemptsCount || 0) + 1 }));
      }
    } catch {
      /* silent */
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const todayIST = new Date(Date.now() + (5 * 60 + 30) * 60 * 1000).toISOString().slice(0, 10);
  const isPastQuiz = !!quiz.correctOption && quiz.date < todayIST;

  return (
    <div className="min-h-screen bg-background relative overflow-x-clip py-8 px-5 sm:px-8">
      {/* Background glow */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-amber-500/6 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Header Nav */}
      <div className="max-w-3xl mx-auto flex items-center justify-between mb-8">
        <Link href="/quiz" className="flex items-center gap-2 text-brand-400 hover:text-white transition-colors group">
          <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
          </svg>
          <span className="text-xs font-mono uppercase tracking-widest">All Quizzes</span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-brand-300 hover:text-white text-xs font-mono transition-colors"
          >
            {copied ? "✓ Copied Link" : "🔗 Share Question"}
          </button>

          {stats && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
              💎 {stats.totalXP} XP
            </div>
          )}
        </div>
      </div>

      {/* Main Question Card */}
      <div className="max-w-3xl mx-auto p-6 sm:p-10 rounded-3xl border border-white/8 bg-brand-900/20 shadow-2xl space-y-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] font-bold text-amber-400 uppercase tracking-widest">
              🧠 {quiz.subject || "General"}
            </span>
            <span className="px-3 py-1 rounded-full bg-white/4 border border-white/8 text-[10px] font-mono text-brand-500">
              Published: {quiz.date}
            </span>
            <span className="px-3 py-1 rounded-full bg-white/4 border border-white/8 text-[10px] font-mono text-brand-500">
              👥 {quiz.attemptsCount || 0} attempts
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-snug tracking-tight">
            {quiz.question}
          </h1>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {(["A", "B", "C", "D"] as const).map((opt) => {
            const optKey = `option${opt}` as keyof QuizItem;
            const optVal = quiz[optKey] as string;
            const isSelected = response?.selectedOption === opt;
            const isCorrectOpt = isPastQuiz ? quiz.correctOption === opt : response?.correctOption === opt;

            let cardState = "";
            let labelState = "";
            let textState = "text-brand-200";

            if (isPastQuiz) {
              if (opt === quiz.correctOption) {
                cardState = "border-emerald-500/50 bg-emerald-500/12 shadow-[0_0_24px_rgba(16,185,129,0.15)] cursor-default";
                labelState = "bg-emerald-500/25 text-emerald-300 font-extrabold";
                textState = "text-emerald-100 font-semibold";
              } else {
                cardState = "border-white/10 bg-white/4 cursor-default";
                labelState = "bg-white/10 text-brand-300 font-bold";
                textState = "text-brand-200 font-normal";
              }
            } else if (!response) {
              cardState = "border-white/12 bg-white/4 hover:bg-amber-500/10 hover:border-amber-500/40 cursor-pointer";
              labelState = "bg-amber-500/15 text-amber-300 font-bold";
              textState = "text-brand-100 hover:text-white font-medium";
            } else if (isCorrectOpt) {
              cardState = "border-emerald-500/50 bg-emerald-500/12 shadow-[0_0_24px_rgba(16,185,129,0.15)] cursor-default";
              labelState = "bg-emerald-500/25 text-emerald-300 font-extrabold";
              textState = "text-emerald-100 font-semibold";
            } else if (isSelected) {
              cardState = "border-red-500/50 bg-red-500/12 shadow-[0_0_24px_rgba(239,68,68,0.15)] cursor-default";
              labelState = "bg-red-500/25 text-red-300 font-extrabold";
              textState = "text-red-100 font-semibold";
            } else {
              cardState = "border-white/10 bg-white/4 cursor-default";
              labelState = "bg-white/10 text-brand-300 font-bold";
              textState = "text-brand-200 font-normal";
            }

            return (
              <button
                key={opt}
                disabled={!!response || submitting || isPastQuiz}
                onClick={() => handleOptionClick(opt)}
                className={`relative flex items-center gap-4 w-full text-left px-5 py-4 rounded-2xl border transition-all duration-300 ${cardState}`}
              >
                <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold font-mono shrink-0 ${labelState}`}>
                  {isPastQuiz
                    ? (opt === quiz.correctOption ? "✓" : opt)
                    : isCorrectOpt && response
                      ? "✓"
                      : isSelected && !isCorrectOpt && response
                        ? "✗"
                        : opt}
                </span>
                <span className={`flex-1 text-sm sm:text-base leading-snug ${textState}`}>
                  {optVal}
                </span>
              </button>
            );
          })}
        </div>

        {submitting && (
          <p className="text-center text-xs font-mono text-amber-400 animate-pulse">Saving your answer...</p>
        )}

        {/* Result banner */}
        {response && (
          <div className={`p-5 rounded-2xl border space-y-2 ${
            response.isCorrect ? "border-emerald-500/30 bg-emerald-500/10" : "border-red-500/30 bg-red-500/10"
          }`}>
            <p className={`font-bold text-base ${response.isCorrect ? "text-emerald-400" : "text-red-400"}`}>
              {response.isCorrect ? "✅ Correct Answer!" : "❌ Incorrect"}
            </p>
            <p className="text-xs text-brand-300">
              Correct Option: <span className="font-bold text-emerald-400">{response.correctOption}</span> (+{response.xpEarned} XP)
            </p>
          </div>
        )}

        {/* Login prompt */}
        {showLoginPrompt && !response && !isPastQuiz && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center space-y-3">
            <p className="text-xs text-amber-300 font-semibold">Sign in to save your answer and earn XP!</p>
            <Link
              href={`/login?redirect=${encodeURIComponent(`/quiz/q/${quiz.id}`)}`}
              className="inline-block px-5 py-2.5 bg-amber-500 text-black text-xs font-bold rounded-xl hover:bg-amber-400 transition-colors"
            >
              Sign In to Save Answer →
            </Link>
          </div>
        )}

        {/* Footer links */}
        <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs font-mono text-brand-500">
          <Link href={`/quiz/${quiz.date}`} className="hover:text-amber-400 transition-colors">
            📅 View all questions for {quiz.date}
          </Link>
          <Link href="/quiz" className="hover:text-white transition-colors">
            Explore All Subjects →
          </Link>
        </div>
      </div>
    </div>
  );
}
