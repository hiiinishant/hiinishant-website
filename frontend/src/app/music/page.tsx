import type { Metadata } from "next";
import MusicClientPage from "./MusicClientPage";
import { defaultMusicPlaylist } from "@/data/music";
import { apiUrl } from "@/lib/api";
import type { MusicSettings } from "@/lib/youtube";

export const metadata: Metadata = {
  title: "Music Corner — Nishant Kumar | Curated Playlist",
  description: "Listen to Nishant Kumar's curated YouTube playlist — play songs directly on the website without leaving the page. Study music, focus tracks, and personal favorites from the founder of 2 AM Study.",
  keywords: [
    "Nishant Kumar music",
    "hiiinishant playlist",
    "2 AM Study music",
    "study music playlist",
    "focus music",
    "YouTube playlist",
  ],
  alternates: {
    canonical: "/music",
  },
  openGraph: {
    title: "Music Corner — Nishant Kumar | Curated Playlist",
    description: "Listen to Nishant Kumar's curated YouTube playlist — study music, focus tracks, and personal favorites.",
    url: "https://hiiinishant.com/music",
  },
};

async function fetchMusicSettings(): Promise<MusicSettings> {
  try {
    const res = await fetch(apiUrl("/api/music"), {
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
