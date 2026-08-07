import type { Metadata } from "next";
import GalleryClientPage from "./GalleryClientPage";

export const metadata: Metadata = {
  title: "Gallery — Nishant Kumar | Life Moments & Achievements",
  description: "Photo gallery of Nishant Kumar (hiiinishant) — daily moments, school days, college life at Chandigarh University, hackathons, achievements, and the journey building 2 AM Study.",
  keywords: [
    "Nishant Kumar gallery",
    "hiiinishant photos",
    "2 AM Study founder photos",
    "Chandigarh University gallery",
    "student entrepreneur photos",
    "edtech founder gallery",
    "Nishant Kumar achievements",
  ],
  alternates: {
    canonical: "/gallery",
  },
  openGraph: {
    title: "Gallery — Nishant Kumar | Life Moments & Achievements",
    description: "Photo gallery of Nishant Kumar — daily moments, college life, achievements, and the journey building 2 AM Study.",
    url: "https://hiiinishant.com/gallery",
    images: [
      {
        url: "/profile.jpg",
        width: 1200,
        height: 630,
        alt: "Nishant Kumar — Gallery",
      },
    ],
  },
};

export default function GalleryPage() {
  return <GalleryClientPage />;
}
