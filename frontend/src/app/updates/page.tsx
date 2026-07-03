import type { Metadata } from "next";
import LatestUpdatesSection from "@/components/sections/LatestUpdatesSection";
import { getAllUpdates } from "@/data/updatesServer";

export const metadata: Metadata = {
  title: "Latest Updates",
  description: "Follow the newest videos and Instagram posts from Nishant Kumar and 2 AM Study.",
  alternates: {
    canonical: "/updates",
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
