import type { Metadata } from "next";
import SocialSection from "@/components/sections/SocialSection";

export const metadata: Metadata = {
  title: "Social Media",
  description:
    "Connect with Nishant Kumar across developer communities, startup channels, educational platforms, and social media networks.",
  alternates: {
    canonical: "/universe",
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
