import type { Metadata } from "next";
import MusicClientPage from "./MusicClientPage";

export const metadata: Metadata = {
  title: "Music Corner",
  description:
    "Listen to Nishant Kumar's curated YouTube playlist — play songs directly on the website without leaving the page.",
  alternates: {
    canonical: "/music",
  },
};

export default function MusicPage() {
  return <MusicClientPage />;
}
