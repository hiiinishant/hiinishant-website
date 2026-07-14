import type { Metadata } from "next";
import StatusDashboardClient from "./StatusDashboardClient";
import { apiUrl } from "@/lib/api";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Live Status Dashboard",
  description: "See what Nishant Kumar is building today. Live daily status logs, accomplishments, and roadmap focus.",
  alternates: {
    canonical: "/status",
  },
};

interface FuturePlan {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  category: "academic" | "business" | "community" | "general";
  status: "planned" | "in-progress" | "completed";
}

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

async function getFuturePlans(): Promise<FuturePlan[]> {
  try {
    const res = await fetch(apiUrl("/api/future-plans"), { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function getDailyStatuses(): Promise<DailyStatus[]> {
  try {
    const res = await fetch(apiUrl("/api/status"), { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function StatusPage() {
  const [futurePlans, initialStatuses] = await Promise.all([
    getFuturePlans(),
    getDailyStatuses(),
  ]);

  return (
    <StatusDashboardClient
      initialStatuses={initialStatuses}
      futurePlans={futurePlans}
    />
  );
}
