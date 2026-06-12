import fs from "fs";
import { getDataFilePath } from "@/lib/db";

export interface DailyStatus {
  id: string;
  date: string;       // YYYY-MM-DD
  statusText: string; // e.g. "Coding 🚀"
  tasks: string[];    // Array of strings
  updatedAt: string;  // ISO timestamp
}

const DATA_FILE = getDataFilePath("daily_status.json");

export function getDailyStatuses(): DailyStatus[] {
  if (!fs.existsSync(DATA_FILE)) {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), "utf-8");
    } catch (e) {
      console.error("Failed to write initial daily_status.json:", e);
    }
    return [];
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    console.error("Error reading daily_status.json, returning empty:", error);
    return [];
  }
}

export function getAllDailyStatusesSorted(): DailyStatus[] {
  return getDailyStatuses().sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function saveDailyStatuses(statuses: DailyStatus[]): void {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(statuses, null, 2), "utf-8");
  } catch (e) {
    console.error("Error writing daily_status.json:", e);
    throw new Error("Failed to write status updates to disk");
  }
}

export function addOrUpdateDailyStatus(
  date: string,
  statusText: string,
  tasks: string[]
): DailyStatus {
  const statuses = getDailyStatuses();
  const existingIndex = statuses.findIndex((s) => s.date === date);

  let updatedStatus: DailyStatus;

  if (existingIndex > -1) {
    // Update existing status for this date
    updatedStatus = {
      ...statuses[existingIndex],
      statusText,
      tasks,
      updatedAt: new Date().toISOString(),
    };
    statuses[existingIndex] = updatedStatus;
  } else {
    // Add new status
    updatedStatus = {
      id: `status-${Date.now()}`,
      date,
      statusText,
      tasks,
      updatedAt: new Date().toISOString(),
    };
    statuses.push(updatedStatus);
  }

  saveDailyStatuses(statuses);
  return updatedStatus;
}

export function deleteDailyStatus(id: string): boolean {
  const statuses = getDailyStatuses();
  const filtered = statuses.filter((s) => s.id !== id);

  if (filtered.length === statuses.length) {
    return false;
  }

  saveDailyStatuses(filtered);
  return true;
}
