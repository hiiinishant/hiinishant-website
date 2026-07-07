import type { Metadata } from "next";
import ProjectsSection from "@/components/sections/ProjectsSection";
import WindCanvas from "@/components/WindCanvas";

export const metadata: Metadata = {
  title: "Startups & Projects — Nishant Kumar | 2 AM Study Founder",
  description:
    "Explore ventures and platforms built by Nishant Kumar (hiiinishant) — including 2 AM Study, student tools, and edtech initiatives. Founder, builder, and entrepreneur from Chandigarh University.",
  keywords: [
    "Nishant Kumar projects",
    "2 AM Study startup",
    "nishant kumar ventures",
    "hiiinishant startups",
    "edtech startup India",
    "Chandigarh University startup",
    "student startup India",
  ],
  alternates: { canonical: "/projects" },
  openGraph: {
    title: "Startups & Projects by Nishant Kumar — hiiinishant",
    description: "Ventures and platforms built by Nishant Kumar, founder of 2 AM Study.",
    url: "https://hiiinishant.com/projects",
  },
};

export default function ProjectsPage() {
  return (
    <>
      {/* ─── HERO HEADER ─── */}
      <section className="pt-28 pb-2 relative overflow-hidden">
        {/* Canvas-based 60fps wind particle engine */}
        <WindCanvas />

        {/* Central amber glow blob */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"
          style={{ zIndex: 0 }}
        />

        {/* Text */}
        <div className="max-w-6xl mx-auto px-5 sm:px-8 relative" style={{ zIndex: 1 }}>
          <div className="text-center mb-8 animate-slide-up">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight mb-4">
              Building the <span className="text-gradient underline-ray">future</span> of education
            </h1>
            <p className="text-brand-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
              From late-night study communities to full-scale edtech ventures — platforms built to empower the next generation of learners.
            </p>
          </div>
        </div>
      </section>

      {/* ─── PROJECTS GRID ─── */}
      <ProjectsSection />
    </>
  );
}
