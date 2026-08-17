import type { Metadata } from "next";
import VlogClientPage from "./VlogClientPage";
import { defaultVlogSettings } from "@/data/vlogs";
import { apiUrl } from "@/lib/api";
import type { VlogSettings } from "@/data/vlogs";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Vlog Corner — Nishant Kumar | Official Vlogs & Stories",
  description:
    "Watch Nishant Kumar's official YouTube vlogs directly on the website without leaving the page — behind the scenes, college life, startup journey, and personal stories.",
  keywords: [
    "Nishant Kumar vlogs",
    "hiiinishant vlogs",
    "2 AM Study vlogs",
    "Nishant Kumar YouTube vlogs",
    "student founder vlogs",
    "Chandigarh University vlog",
  ],
  alternates: {
    canonical: "/vlogs",
  },
  openGraph: {
    title: "Vlog Corner — Nishant Kumar | Official Vlogs & Stories",
    description:
      "Watch Nishant Kumar's official YouTube vlogs directly on the website without leaving the page.",
    url: "https://hiiinishant.com/vlogs",
  },
};

async function fetchVlogSettings(): Promise<VlogSettings> {
  try {
    const res = await fetch(apiUrl("/api/vlogs"), {
      cache: "no-store",
    });
    if (!res.ok) return defaultVlogSettings;
    const contentType = res.headers.get("content-type");
    if (!contentType?.includes("application/json")) return defaultVlogSettings;
    const data: VlogSettings = await res.json();
    return data.initialVideos ? data : defaultVlogSettings;
  } catch {
    return defaultVlogSettings;
  }
}

export default async function VlogsPage() {
  const initialSettings = await fetchVlogSettings();
  return <VlogClientPage initialSettings={initialSettings} />;
}
// Dynamic 14-video playlist sync enabled
