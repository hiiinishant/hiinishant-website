import type { DailyStatus } from "@/types";
import { apiUrl } from "@/lib/api";

export async function getAllStatuses(): Promise<DailyStatus[]> {
  try {
    const res = await fetch(apiUrl("/api/status"), { cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch status logs from backend:", error);
    return [];
  }
}

export async function getStatusByDate(dateOrId: string): Promise<DailyStatus | null> {
  const statuses = await getAllStatuses();
  const normalized = dateOrId.trim().toLowerCase();
  return (
    statuses.find(
      (s) =>
        s.date.trim().toLowerCase() === normalized ||
        s.id.trim().toLowerCase() === normalized
    ) || null
  );
}
