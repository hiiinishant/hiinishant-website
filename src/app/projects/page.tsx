import type { Metadata } from "next";
import ProjectsSection from "@/components/sections/ProjectsSection";

export const metadata: Metadata = {
  title: "Startups",
  description:
    "Explore the ventures, platforms, and initiatives built by Nishant Kumar — from 2 AM Study to the Student Store and GATE CSE prep.",
};

export default function ProjectsPage() {
  return (
    <>
      {/* ─── HERO HEADER ─── */}
      <section className="pt-32 pb-4 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-amber-500/4 rounded-full blur-[130px] pointer-events-none -z-10" />
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent/20 bg-accent/5 text-[11px] font-bold text-accent uppercase tracking-widest mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-slow" />
              Startups &amp; Ventures
            </span>
            <h1 className="text-4xl sm:text-6xl font-extrabold leading-tight mb-5">
              Building the <span className="text-gradient">future</span> of<br className="hidden sm:block" /> education
            </h1>
            <p className="text-brand-400 text-base max-w-2xl mx-auto leading-relaxed">
              From a late-night study community to full-scale edtech ventures — here are the projects and platforms I&apos;ve built to empower the next generation of learners.
            </p>
          </div>
        </div>
      </section>

      {/* ─── PROJECTS GRID ─── */}
      <ProjectsSection />
    </>
  );
}
