import type { Metadata } from "next";
import JourneySection from "@/components/sections/JourneySection";

export const metadata: Metadata = {
  title: "Journey & Story — Nishant Kumar | Chandigarh University Entrepreneur",
  description:
    "The complete journey of Nishant Kumar — from school to founding 2 AM Study at Chandigarh University and empowering 100,000+ students. Discover how hiiinishant built an edtech brand from scratch.",
  keywords: [
    "Nishant Kumar journey",
    "nishant kumar story",
    "2 AM Study founder story",
    "Nishant Kumar Chandigarh University",
    "hiiinishant journey",
    "student entrepreneur story India",
  ],
  alternates: {
    canonical: "/journey",
  },
  openGraph: {
    title: "Journey of Nishant Kumar — From Student to Founder",
    description: "How Nishant Kumar went from a student at Chandigarh University to founding 2 AM Study, empowering 100,000+ learners.",
    url: "https://hiiinishant.com/journey",
  },
};

export default function JourneyPage() {
  return (
    <>
      {/* ─── TIMELINE SECTION ─── */}
      <JourneySection />
    </>
  );
}
