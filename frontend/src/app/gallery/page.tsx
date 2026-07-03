import type { Metadata } from "next";
import GalleryClientPage from "./GalleryClientPage";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Daily moments, school days, college life, and key milestones and achievements of Nishant Kumar.",
  alternates: {
    canonical: "/gallery",
  },
};

export default function GalleryPage() {
  return <GalleryClientPage />;
}
