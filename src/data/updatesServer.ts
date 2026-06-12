import fs from "fs";
import path from "path";
import { latestUpdates as initialUpdates, type UpdateItem } from "./updates";

const DATA_FILE = path.join(process.cwd(), "src/data/updates.json");

export function getUpdates(): UpdateItem[] {
  if (!fs.existsSync(DATA_FILE)) {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(initialUpdates, null, 2), "utf-8");
    } catch (e) {
      console.error("Failed to write initial updates.json:", e);
    }
    return initialUpdates;
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    console.error("Error reading updates.json, returning initial:", error);
    return initialUpdates;
  }
}

export function getAllUpdates(): UpdateItem[] {
  return getUpdates().sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function getUpdatesByCategory(
  category: UpdateItem["category"]
): UpdateItem[] {
  return getUpdates()
    .filter((item) => item.category === category)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
