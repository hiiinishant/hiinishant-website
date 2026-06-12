import type { Metadata } from "next";
import LatestUpdatesSection from "@/components/sections/LatestUpdatesSection";
import Newsletter from "@/components/Newsletter";
import { getAllUpdates } from "@/data/updatesServer";

export const metadata: Metadata = {
  title: "Latest Updates",
  description:
    "Follow the newest videos, blog articles, announcements, and achievements from Nishant Kumar and 2 AM Study.",
};

export default function UpdatesPage() {
  const initialUpdates = getAllUpdates();

  return (
    <>
      <LatestUpdatesSection initialUpdates={initialUpdates} />
      <Newsletter />
    </>
  );
}
