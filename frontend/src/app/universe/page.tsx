import type { Metadata } from "next";
import SocialSection from "@/components/sections/SocialSection";

export const metadata: Metadata = {
  title: "Social Media — Nishant Kumar | hiiinishant",
  description:
    "Follow Nishant Kumar (hiiinishant) across all social platforms — Instagram, YouTube, Twitter, LinkedIn, and Facebook. Founder of 2 AM Study and student entrepreneur.",
  keywords: ["nishant kumar instagram", "nishant kumar youtube", "hiiinishant social media", "2 AM Study social", "nishant kumar twitter", "nishant kumar linkedin"],
  alternates: { canonical: "/universe" },
  openGraph: {
    title: "Follow Nishant Kumar — hiiinishant on Social Media",
    description: "Connect with Nishant Kumar across Instagram, YouTube, LinkedIn, Twitter, and more.",
    url: "https://hiiinishant.com/universe",
  },
};

export default function UniversePage() {
  return (
    <>
      {/* ─── SOCIAL GRID ─── */}
      <SocialSection />
    </>
  );
}
