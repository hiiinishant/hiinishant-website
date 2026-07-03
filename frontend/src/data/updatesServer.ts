import type { UpdateItem } from "./updates";
import { apiUrl } from "@/lib/api";

export async function getAllUpdates(): Promise<UpdateItem[]> {
  try {
    // Fetch directly from the Express backend
    const res = await fetch(apiUrl("/api/updates"), { cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch updates from backend:", error);
    return [];
  }
}

export async function getUpdatesByCategory(category: UpdateItem["category"]): Promise<UpdateItem[]> {
  const updates = await getAllUpdates();
  return updates.filter((item) => item.category === category);
}
