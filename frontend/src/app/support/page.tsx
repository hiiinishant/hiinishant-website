import type { Metadata } from "next";
import SupportSection from "@/components/sections/SupportSection";

export const metadata: Metadata = {
  title: "Support Hiii Nishant for Students — Nishant Kumar & 2 AM Study",
  description:
    "Support Nishant Kumar's journey in building free educational resources, tools, and projects for students and aspirants across India.",
  keywords: [
    "Support Nishant Kumar",
    "Support 2 AM Study",
    "Donate 2 AM Study",
    "Free student resources support",
    "Education contributor",
    "Hiii Nishant support",
  ],
  alternates: {
    canonical: "https://hiiinishant.com/support",
  },
  openGraph: {
    title: "Support Hiii Nishant for Students — Nishant Kumar & 2 AM Study",
    description:
      "Support Nishant Kumar's journey in building free educational resources, tools, and projects for students across India.",
    url: "https://hiiinishant.com/support",
  },
};

export default function SupportPage() {
  return (
    <main className="min-h-screen pt-14 lg:pt-16 pb-12">
      <SupportSection />
    </main>
  );
}
