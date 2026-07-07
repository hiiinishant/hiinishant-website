import type { Metadata } from "next";
import LatestUpdatesSection from "@/components/sections/LatestUpdatesSection";
import { getAllUpdates } from "@/data/updatesServer";

export const metadata: Metadata = {
  title: "Latest Updates — Nishant Kumar | 2 AM Study",
  description: "Stay updated with the latest content from Nishant Kumar (hiiinishant) and 2 AM Study — new videos, Instagram posts, milestones, and announcements.",
  keywords: ["Nishant Kumar updates", "hiiinishant news", "2 AM Study updates", "nishant kumar latest"],
  alternates: { canonical: "/updates" },
  openGraph: {
    title: "Latest Updates — Nishant Kumar",
    description: "Latest content, videos, and posts from Nishant Kumar, founder of 2 AM Study.",
    url: "https://hiiinishant.com/updates",
  },
};

export default async function UpdatesPage() {
  const initialUpdates = await getAllUpdates();

  return (
    <>
      <LatestUpdatesSection initialUpdates={initialUpdates} />
    </>
  );
}
