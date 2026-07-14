import type { Metadata } from "next";
import MusicClientPage from "./MusicClientPage";
import { defaultMusicPlaylist } from "@/data/music";
import type { MusicSettings } from "@/lib/youtube";

export const metadata: Metadata = {
  title: "Music Corner",
  description:
    "Listen to Nishant Kumar's curated YouTube playlist — play songs directly on the website without leaving the page.",
  alternates: {
    canonical: "/music",
  },
};

async function fetchMusicSettings(): Promise<MusicSettings> {
  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "https://hiinishant-backend.onrender.com";
  try {
    const res = await fetch(`${backendUrl}/api/music`, {
      next: { revalidate: 300 }, // cache for 5 minutes
    });
    if (!res.ok) return defaultMusicPlaylist;
    const contentType = res.headers.get("content-type");
    if (!contentType?.includes("application/json")) return defaultMusicPlaylist;
    const data: MusicSettings = await res.json();
    return data.playlistId ? data : defaultMusicPlaylist;
  } catch {
    return defaultMusicPlaylist;
  }
}

export default async function MusicPage() {
  const initialSettings = await fetchMusicSettings();
  return <MusicClientPage initialSettings={initialSettings} />;
}
