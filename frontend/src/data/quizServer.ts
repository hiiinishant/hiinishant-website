/**
 * quizServer.ts
 * Server-side data fetchers for quiz pages.
 * These run at build/request time — NOT in the browser.
 * Used by /quiz/[date]/page.tsx and sitemap.ts
 */

const LIVE_BACKEND = "https://hiinishant-backend.onrender.com";

function getApiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL || LIVE_BACKEND;
}

export interface QuizItem {
  id: string;
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

/**
 * Fetch all published quizzes for a specific date (YYYY-MM-DD).
 * correctOption is exposed — used for FAQPage SEO schema.
 */
export async function getQuizByDate(date: string): Promise<QuizItem[]> {
  try {
    const res = await fetch(`${getApiBase()}/api/quiz/date/${date}`, {
      next: { revalidate: 3600 }, // revalidate every hour
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.quizzes) ? data.quizzes : [];
  } catch {
    return [];
  }
}

/**
 * Fetch all distinct publishDates that have at least one published quiz.
 * Used by sitemap.ts to auto-generate quiz date URLs.
 * Returns dates sorted descending (newest first).
 */
export async function getAllQuizDates(): Promise<string[]> {
  try {
    const res = await fetch(`${getApiBase()}/api/quiz/dates`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.dates) ? data.dates : [];
  } catch {
    return [];
  }
}
