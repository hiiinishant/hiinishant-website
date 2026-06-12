import type { Metadata } from "next";
import StatusDashboardClient from "./StatusDashboardClient";

export const metadata: Metadata = {
  title: "Live Status Dashboard",
  description: "See what Nishant Kumar is building today. Live daily status logs, accomplishments, and roadmap focus.",
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
  statusText: string;
  tasks: string[];
  updatedAt: string;
}

async function getFuturePlans(): Promise<FuturePlan[]> {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    console.warn("⚠️ BACKEND_URL is not set. Unable to fetch plans.");
    return [];
  }
  try {
    const res = await fetch(`${backendUrl}/api/future-plans`, {
      next: { revalidate: 10 }, // cache for 10 seconds
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Error loading future plans for status page:", error);
    return [];
  }
}

async function getDailyStatuses(): Promise<DailyStatus[]> {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    console.warn("⚠️ BACKEND_URL is not set. Unable to fetch daily status.");
    return [];
  }
  try {
    const res = await fetch(`${backendUrl}/api/status`, {
      next: { revalidate: 10 }, // cache for 10 seconds
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Error loading daily statuses for status page:", error);
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
