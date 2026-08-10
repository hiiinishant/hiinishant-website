import { apiUrl } from "@/lib/api";
import { defaultVlogSettings, type VlogVideo } from "@/data/vlogs";

export interface VlogVideoServerItem {
  id?: string;
  videoId: string;
  title: string;
  description?: string;
  uploadDate?: string;
  tags?: string[];
}

export async function getAllVlogVideos(): Promise<VlogVideoServerItem[]> {
  try {
    const res = await fetch(apiUrl("/api/vlogs/videos"), {
      next: { revalidate: 300 },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (error) {
    console.warn("Failed to fetch vlog videos from backend for sitemap:", error);
  }
  // Fallback to default initial videos if backend list is empty
  return defaultVlogSettings.initialVideos.map((v) => ({
    videoId: v.videoId,
    title: v.title,
    description: v.description,
    uploadDate: new Date().toISOString().split("T")[0],
  }));
}
