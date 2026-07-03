import type { Metadata } from "next";
import JourneySection from "@/components/sections/JourneySection";

export const metadata: Metadata = {
  title: "Journey",
  description:
    "Follow the chronological journey of Nishant Kumar from 2003 to present — from coding in school to founding 2 AM Study and scaling it to 100K+ learners.",
  alternates: {
    canonical: "/journey",
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
