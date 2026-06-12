import type { Metadata } from "next";
import fs from "fs";
import path from "path";
import { getAllDailyStatusesSorted, type DailyStatus } from "@/data/statusServer";
import { type FuturePlan } from "@/app/api/future-plans/route";
import StatusDashboardClient from "./StatusDashboardClient";

export const metadata: Metadata = {
  title: "Live Status Dashboard",
  description: "See what Nishant Kumar is building today. Live daily status logs, accomplishments, and roadmap focus.",
};

function getFuturePlans(): FuturePlan[] {
  const DATA_FILE = path.join(process.cwd(), "src/data/future_plans.json");
  if (!fs.existsSync(DATA_FILE)) return [];
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    console.error("Error loading future plans for status page:", error);
    return [];
  }
}

export default function StatusPage() {
  const initialStatuses = getAllDailyStatusesSorted();
  const futurePlans = getFuturePlans();

  return (
    <StatusDashboardClient
      initialStatuses={initialStatuses}
      futurePlans={futurePlans}
    />
  );
}
