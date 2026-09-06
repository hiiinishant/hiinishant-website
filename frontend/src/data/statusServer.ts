import type { DailyStatus } from "@/types";
import { apiUrl } from "@/lib/api";
import fallbackDailyStatus from "@/data/daily_status.json";

export interface MonthlyStats {
  monthKey: string;
  monthLabel: string;
  daysLogged: number;
  totalStudyHours: number;
  avgStudyHoursPerDay: number;
  totalQuestions: number;
  avgQuestionsPerDay: number;
  subjectsStudied: string[];
  mockCount: number;
  totalDevHours: number;
  avgDevHoursPerDay: number;
  devTasksCount: number;
  totalIncome: number;
  totalExpense: number;
  avgIncomePerDay: number;
  avgExpensePerDay: number;
  netSavings: number;
  totalVideos: number;
  totalPosts: number;
  totalBlogs: number;
  avgMood: number;
  avgDiet: number;
  avgSleep: number;
  bestLessons: { date: string; lesson: string }[];
  bestMoments: { date: string; moment: string }[];
}

export async function getAllStatuses(): Promise<DailyStatus[]> {
  try {
    const res = await fetch(apiUrl("/api/status"), { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (error) {
    console.warn("Failed to fetch status logs from backend API, using fallback data:", error);
  }
  return (fallbackDailyStatus as DailyStatus[]) || [];
}

export async function getStatusByDate(dateOrId: string): Promise<DailyStatus | null> {
  const statuses = await getAllStatuses();
  const normalized = dateOrId.trim().toLowerCase();
  return (
    statuses.find(
      (s) =>
        (s.date && s.date.trim().toLowerCase() === normalized) ||
        (s.id && s.id.trim().toLowerCase() === normalized)
    ) || null
  );
}

export function formatMonthKeyToLabel(monthKey: string): string {
  try {
    const [yearStr, monthStr] = monthKey.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    if (!isNaN(year) && !isNaN(month)) {
      const d = new Date(year, month - 1, 1);
      return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }
  } catch {
    // fallback
  }
  return monthKey;
}

export async function getStatusesByMonth(monthKey: string): Promise<DailyStatus[]> {
  const statuses = await getAllStatuses();
  return statuses.filter((s) => s.date && s.date.startsWith(monthKey));
}

export function calculateMonthlyStats(monthKey: string, monthStatuses: DailyStatus[]): MonthlyStats {
  const daysLogged = monthStatuses.length;
  const monthLabel = formatMonthKeyToLabel(monthKey);

  let totalStudyHours = 0;
  let totalQuestions = 0;
  let mockCount = 0;
  const subjectsSet = new Set<string>();

  let totalDevHours = 0;
  let devTasksCount = 0;

  let totalIncome = 0;
  let totalExpense = 0;

  let totalVideos = 0;
  let totalPosts = 0;
  let totalBlogs = 0;

  let moodSum = 0;
  let moodCount = 0;

  let dietSum = 0;
  let dietCount = 0;

  let sleepSum = 0;
  let sleepCount = 0;

  const bestLessons: { date: string; lesson: string }[] = [];
  const bestMoments: { date: string; moment: string }[] = [];

  monthStatuses.forEach((s) => {
    // Study
    if (s.study) {
      if (typeof s.study.hours === "number") totalStudyHours += s.study.hours;
      if (typeof s.study.questions === "number") totalQuestions += s.study.questions;
      if (s.study.subject && s.study.subject.trim()) {
        s.study.subject.split(",").forEach((sub) => {
          const trimmed = sub.trim();
          if (trimmed) subjectsSet.add(trimmed);
        });
      }
      if (s.study.mock && s.study.mock !== "N/A" && s.study.mock.trim()) mockCount += 1;
    }

    // Dev
    if (s.project) {
      if (typeof s.project.hours === "number") totalDevHours += s.project.hours;
      if (Array.isArray(s.project.tasks)) devTasksCount += s.project.tasks.length;
    }

    // Content
    if (s.content) {
      if (typeof s.content.videos === "number") totalVideos += s.content.videos;
      if (typeof s.content.posts === "number") totalPosts += s.content.posts;
      if (typeof s.content.blogs === "number") totalBlogs += s.content.blogs;
    }

    // Health
    if (s.health) {
      if (typeof s.health.sleep === "number" && s.health.sleep > 0) {
        sleepSum += s.health.sleep;
        sleepCount += 1;
      }
      if (typeof s.health.healthyEating === "number" && s.health.healthyEating > 0) {
        dietSum += s.health.healthyEating;
        dietCount += 1;
      }
    }

    // Finance
    if (s.finance) {
      if (typeof s.finance.income === "number") totalIncome += s.finance.income;
      if (typeof s.finance.expense === "number") totalExpense += s.finance.expense;
    }

    // Mood
    if (typeof s.mood === "number" && s.mood > 0) {
      moodSum += s.mood;
      moodCount += 1;
    }

    // Reflections
    if (s.bestMoment && s.bestMoment.trim()) {
      bestMoments.push({ date: s.date, moment: s.bestMoment.trim() });
    }
    if (s.lessonLearned && s.lessonLearned.trim()) {
      bestLessons.push({ date: s.date, lesson: s.lessonLearned.trim() });
    }
  });

  const avgStudyHoursPerDay = daysLogged > 0 ? totalStudyHours / daysLogged : 0;
  const avgQuestionsPerDay = daysLogged > 0 ? totalQuestions / daysLogged : 0;
  const avgDevHoursPerDay = daysLogged > 0 ? totalDevHours / daysLogged : 0;
  const avgIncomePerDay = daysLogged > 0 ? totalIncome / daysLogged : 0;
  const avgExpensePerDay = daysLogged > 0 ? totalExpense / daysLogged : 0;
  const netSavings = totalIncome - totalExpense;

  const avgMood = moodCount > 0 ? moodSum / moodCount : 0;
  const avgDiet = dietCount > 0 ? dietSum / dietCount : 0;
  const avgSleep = sleepCount > 0 ? sleepSum / sleepCount : 0;

  return {
    monthKey,
    monthLabel,
    daysLogged,
    totalStudyHours,
    avgStudyHoursPerDay,
    totalQuestions,
    avgQuestionsPerDay,
    subjectsStudied: Array.from(subjectsSet),
    mockCount,
    totalDevHours,
    avgDevHoursPerDay,
    devTasksCount,
    totalIncome,
    totalExpense,
    avgIncomePerDay,
    avgExpensePerDay,
    netSavings,
    totalVideos,
    totalPosts,
    totalBlogs,
    avgMood,
    avgDiet,
    avgSleep,
    bestLessons,
    bestMoments,
  };
}

export async function getAvailableMonths(): Promise<{ key: string; label: string; count: number }[]> {
  const statuses = await getAllStatuses();
  const map = new Map<string, number>();

  statuses.forEach((s) => {
    if (s.date && s.date.length >= 7) {
      const key = s.date.slice(0, 7); // e.g. "2026-06"
      map.set(key, (map.get(key) || 0) + 1);
    }
  });

  // If no dates, add current month
  if (map.size === 0) {
    const nowKey = new Date().toISOString().slice(0, 7);
    map.set(nowKey, 0);
  }

  const sortedKeys = Array.from(map.keys()).sort((a, b) => b.localeCompare(a));
  return sortedKeys.map((key) => ({
    key,
    label: formatMonthKeyToLabel(key),
    count: map.get(key) || 0,
  }));
}

