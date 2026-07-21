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

interface UserStats {
  totalXP: number;
  currentStreak: number;
  longestStreak: number;
  totalAttempts: number;
  totalCorrect: number;
}

interface QuizToday {
  date: string;
  subject: string;
  attemptsCount?: number;
}

export default function DailyQuizCard() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [quiz, setQuiz] = useState<QuizToday | null>(null);
  const [hasAnsweredToday, setHasAnsweredToday] = useState(false);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Monitor auth state
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Check if a quiz exists today
  useEffect(() => {
    let retries = 0;
    const checkTodayQuiz = async () => {
      const apiBase = getApiBase();
      try {
        const res = await fetch(`${apiBase}/api/quiz/today`, {
          signal: AbortSignal.timeout(12000),
        });
        if (res.ok) {
          const data = await res.json();
          setQuiz(data.quiz || null);
        }
      } catch {
        // Retry once on timeout/network error
        if (retries === 0) {
          retries++;
          setTimeout(checkTodayQuiz, 3000);
          return;
        }
      } finally {
        setLoading(false);
      }
    };
    checkTodayQuiz();
  }, []);

  // Fetch user stats + today's response status
  useEffect(() => {
    if (!user) {
      setStats(null);
      setHasAnsweredToday(false);
      return;
    }

    const fetchUserData = async () => {
      const apiBase = getApiBase();
      try {
        const idToken = await user.getIdToken();
        const [responseRes, statsRes] = await Promise.all([
          fetch(`${apiBase}/api/quiz/response`, {
            headers: { Authorization: `Bearer ${idToken}` },
            signal: AbortSignal.timeout(6000),
          }),
          fetch(`${apiBase}/api/quiz/stats/${user.uid}`, {
            signal: AbortSignal.timeout(6000),
          }),
        ]);

        if (responseRes.ok) {
          const resData = await responseRes.json();
          setHasAnsweredToday(!!resData.response);
        }
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData.stats);
        }
      } catch {
        /* silent */
      }
    };

    fetchUserData();
  }, [user]);



  return (
    <Link
      href="/quiz"
      className="group relative overflow-hidden rounded-3xl border border-white/5 bg-brand-900/10 hover:border-violet-500/30 p-6 sm:p-8 flex flex-col justify-between min-h-[240px] sm:min-h-[260px] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(139,92,246,0.15)] card-spotlight"
    >
      {/* Glow & shimmer */}
      <div className="absolute -right-16 -top-16 w-36 h-36 rounded-full bg-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl pointer-events-none" />
      <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer pointer-events-none" />

      <div>
        {/* Top row: icon + arrow */}
        <div className="flex justify-between items-start mb-6">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 text-2xl group-hover:scale-110 transition-transform duration-500">
            🧠
          </div>
          <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center text-brand-400 group-hover:text-white group-hover:border-white/20 transition-all duration-300 group-hover:translate-x-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-violet-400 transition-colors">
          Daily Quiz
        </h3>
        <p className="text-sm text-brand-400 leading-relaxed max-w-sm">
          Challenge yourself daily, learn new concepts, maintain your streak, and earn XP!
        </p>
      </div>

      {/* Footer CTA */}
      <div className="mt-8 flex items-center gap-1.5 text-xs font-bold text-violet-400 uppercase tracking-wider">
        Solve Challenge
        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </div>
    </Link>
  );
}
