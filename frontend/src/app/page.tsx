import type { Metadata } from "next";
import Link from "next/link";
import AuroraBackground from "@/components/AuroraBackground";

export const metadata: Metadata = {
  title: "Nishant Kumar — Founder of 2 AM Study | Entrepreneur & Educator",
  description:
    "Official website of Nishant Kumar (hiiinishant) — founder of 2 AM Study, student entrepreneur from Chandigarh University, and digital educator empowering 100,000+ students across India.",
  keywords: [
    "Nishant Kumar",
    "nishant",
    "nishant kumar",
    "hiiinishant",
    "2 AM Study founder",
    "2 am study founder",
    "founder of 2 AM Study",
    "Nishant Kumar Chandigarh University",
    "Chandigarh University entrepreneur",
    "nishant kumar entrepreneur",
    "nishant kumar edtech",
    "nishant kumar educator",
    "2amstudy",
    "nishant kumar portfolio",
    "hi Nishant",
    "Hii Nishant",
    "hiii nishant",
    "hiiinishant.com",
    "student entrepreneur India",
    "edtech founder India",
  ],
  alternates: {
    canonical: "https://hiiinishant.com",
  },
  openGraph: {
    title: "Nishant Kumar — Founder of 2 AM Study | hiiinishant",
    description:
      "Official website of Nishant Kumar (hiiinishant) — founder of 2 AM Study. Student entrepreneur from Chandigarh University empowering 100,000+ learners.",
    url: "https://hiiinishant.com",
  },
};

export default function Home() {
  return (
    <>
      {/* ─── HERO & PROFILE ─── */}
      <section
        id="hero"
        className="relative min-h-screen lg:min-h-[95vh] flex flex-col pt-16 lg:pt-20 pb-16 lg:pb-24 overflow-clip noise"
      >
        {/* Aurora background */}
        <AuroraBackground />

        {/* Animated grid */}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:72px_72px]" />


        {/* Floating orbit particles */}
        <div className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none">
          <div className="relative w-0 h-0">
            <div className="absolute animate-orbit opacity-25">
              <div className="w-2 h-2 rounded-full bg-accent" />
            </div>
            <div className="absolute animate-orbit-reverse opacity-15" style={{ animationDuration: "22s" }}>
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            </div>
            <div className="absolute animate-orbit opacity-10" style={{ animationDuration: "32s", animationDelay: "-10s" }}>
              <div className="w-1 h-1 rounded-full bg-emerald-400" />
            </div>
          </div>
        </div>

        {/* Scan line */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-accent/2 to-transparent animate-scan opacity-30" />
        </div>

        <div className="max-w-6xl mx-auto px-5 sm:px-8 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">

            {/* Profile Photo - shows first on mobile */}
            <div className="lg:col-span-5 mt-0 lg:mt-8 animate-slide-in-right flex flex-col items-center mx-auto order-1 lg:order-2 lg:sticky lg:top-24 lg:self-start">

              {/* Picture Card */}
              <div className="w-full max-w-[220px] sm:max-w-[260px] lg:max-w-[280px] aspect-[4/5] rounded-3xl overflow-hidden glass-strong relative group card-spotlight shadow-2xl border border-white/8 mx-auto">
                {/* Subtle overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/50 z-10 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-blue-500/5 z-10 pointer-events-none" />
                {/* Profile photo — fills the whole card */}
                <img
                  src="/profile.jpg"
                  alt="Nishant Kumar — Founder of 2 AM Study"
                  width={280}
                  height={350}
                  fetchPriority="high"
                  decoding="async"
                  className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                />
              </div>

              {/* Text info below card */}
              <div className="mt-4 sm:mt-5 w-full max-w-[280px] text-center space-y-2">

                {/* Name + title */}
                <div>
                  <p className="text-white font-bold text-xl sm:text-2xl tracking-tight">Nishant Kumar</p>
                  <p className="text-brand-400 text-sm sm:text-base mt-1 font-medium">Founder · 2 AM Study</p>
                </div>

                {/* Elegant Quote Block */}
                <div className="relative pt-1">
                  <p className="text-base sm:text-lg font-caveat leading-tight font-medium italic relative z-10 px-3 sm:px-4 animate-pulse-slow text-gradient-static">
                    <span className="text-xl sm:text-2xl text-accent/40 absolute -top-1 left-1 font-serif animate-float">&ldquo;</span>
                    The best ideas come at 2 AM — when the world is asleep and your mind is on fire.
                    <span className="text-xl sm:text-2xl text-accent/40 absolute -bottom-3 right-3 font-serif animate-float" style={{ animationDelay: '1s' }}>&rdquo;</span>
                  </p>
                </div>

              </div>
            </div>

            {/* Left Content (Hero + Narrative) */}
            <div className="lg:col-span-7 space-y-8 text-left order-2 lg:order-1">
              {/* Live badge */}
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-accent/25 bg-accent/5 animate-fade-in backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-live-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
                </span>
                <span className="text-[11px] font-semibold text-accent tracking-widest uppercase">
                  Student · Educator · Founder
                </span>
              </div>

              {/* Heading */}
              <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-none animate-slide-up">
                <span className="block font-caveat text-xl sm:text-2xl md:text-3xl text-accent/85 mb-2 tracking-wide normal-case font-medium">
                  Hiii, this is
                </span>
                <span className="text-gradient-white">Nishant</span>{" "}
                <span className="text-gradient">Kumar</span>
              </h1>

              {/* Combined narrative */}
              <div className="space-y-4 text-brand-300 leading-relaxed text-sm sm:text-base max-w-2xl animate-slide-up" style={{ animationDelay: "0.1s" }}>
                <p>
                  I recently completed my B.E. in Computer Science and Engineering and am currently focused on building education-driven products that help students learn more effectively, stay consistent, and achieve their academic and career goals.
                </p>
                <p>
                  I am the founder of <span className="text-white font-semibold">2 AM Study</span> —— an education-first platform built to support students through structured learning resources, practical guidance, and community-driven learning experiences. Within this ecosystem, I am actively developing 2 AM Study GATE CSE and 2 AM Study Store, designed to provide focused exam preparation support and high-value educational resources.
                </p>
                <p>
                  Alongside this, I run <span className="text-accent font-semibold">Hiii Nishant</span> — a personal vlog platform where I document my journey as a student, creator, and builder. Through this channel, I share insights from college life, study routines, productivity systems, travel experiences, and the real behind-the-scenes process of building 2 AM Study from the ground up.
                </p>
                <p>
                  I believe in learning in public, building consistently, and documenting both progress and failures as an essential part of the journey.
                </p>
                <p className="text-white/90 font-medium">
                  Creating for students. Learning continuously. Creating with purpose.
                </p>

                {/* Current Initiatives — vertical column */}
                <div className="pt-2">
                  <p className="text-xs text-brand-500 uppercase tracking-widest font-semibold mb-2.5">Current Initiatives</p>
                  <div className="flex flex-col gap-2 w-fit">
                    {["2 AM Study", "2 AM Study GATE CSE", "2 AM Study Store", "Hiii Nishant (Vlogs & Student Journey)"].map((init) => (
                      <span key={init} className="px-4 py-2 rounded-xl bg-white/4 border border-white/8 text-xs text-brand-200 font-medium w-fit">
                        {init}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 pt-2 animate-slide-up" style={{ animationDelay: "0.24s" }}>
                <Link
                  href="/nsgram"
                  className="group relative w-full sm:w-auto px-8 py-4 rounded-xl bg-accent text-black font-bold transition-all duration-300 hover:shadow-[0_0_40px_rgba(245,158,11,0.5)] hover:-translate-y-1 overflow-hidden flex items-center justify-center gap-2"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Visit Nsgram
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                  <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer" />
                </Link>
                <Link
                  href="/projects"
                  className="group w-full sm:w-auto px-8 py-4 rounded-xl glass-strong text-white font-medium hover:bg-white/10 transition-all duration-300 hover:-translate-y-1 flex items-center justify-center gap-2"
                >
                  Explore Startups
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── EXPLORE PORTAL ─── */}
      <section id="explore" className="py-20 lg:py-28 relative overflow-hidden border-t border-white/5 bg-brand-950/10">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-accent/3 blur-[140px] pointer-events-none -z-10" />

        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent/20 bg-accent/5 text-[11px] font-bold text-accent uppercase tracking-widest mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-slow" />
              Explore Nishant's World
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold leading-tight">
              Dive into the <span className="text-gradient">universe</span> of building
            </h2>
            <p className="text-brand-400 text-sm mt-4 max-w-xl mx-auto">
              Select a portal below to explore the timeline, gallery, favourite songs, ventures, social channels, or latest posts.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-5 sm:gap-6 lg:gap-8">
            {/* Card 1: Journey */}
            <Link
              href="/journey"
              className="group relative overflow-hidden rounded-3xl border border-white/5 bg-brand-900/10 hover:border-violet-500/30 p-6 sm:p-8 flex flex-col justify-between min-h-[240px] sm:min-h-[260px] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(139,92,246,0.12)] card-spotlight"
            >
              {/* Card accent gradient glow */}
              <div className="absolute -right-16 -top-16 w-36 h-36 rounded-full bg-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl pointer-events-none" />
              <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer pointer-events-none" />

              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 text-2xl group-hover:scale-110 transition-transform duration-500">
                    ⏳
                  </div>
                  <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center text-brand-400 group-hover:text-white group-hover:border-white/20 transition-all duration-300 group-hover:translate-x-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-violet-400 transition-colors">
                  Nishant's Journey
                </h3>
                <p className="text-sm text-brand-400 leading-relaxed max-w-sm">
                  The chronological timeline from 2003 to now — school days, late-night study sessions, and edtech growth.
                </p>
              </div>

              <div className="mt-8 flex items-center gap-1.5 text-xs font-bold text-violet-400 uppercase tracking-wider">
                Explore Journey
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </Link>

            {/* Card: Gallery */}
            <Link
              href="/gallery"
              className="group relative overflow-hidden rounded-3xl border border-white/5 bg-brand-900/10 hover:border-sky-500/30 p-6 sm:p-8 flex flex-col justify-between min-h-[240px] sm:min-h-[260px] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(14,165,233,0.12)] card-spotlight"
            >
              <div className="absolute -right-16 -top-16 w-36 h-36 rounded-full bg-sky-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl pointer-events-none" />
              <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer pointer-events-none" />

              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 text-2xl group-hover:scale-110 transition-transform duration-500">
                    📸
                  </div>
                  <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center text-brand-400 group-hover:text-white group-hover:border-white/20 transition-all duration-300 group-hover:translate-x-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-sky-400 transition-colors">
                  Nishant&apos;s Gallery
                </h3>
                <p className="text-sm text-brand-400 leading-relaxed max-w-sm">
                  Daily moments, school days, college life, and milestones — captured memories from the journey so far.
                </p>
              </div>

              <div className="mt-8 flex items-center gap-1.5 text-xs font-bold text-sky-400 uppercase tracking-wider">
                Visit Nishant&apos;s Gallery
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </Link>

            {/* Card: Music Corner */}
            <Link
              href="/music"
              className="group relative overflow-hidden rounded-3xl border border-white/5 bg-brand-900/10 hover:border-fuchsia-500/30 p-6 sm:p-8 flex flex-col justify-between min-h-[240px] sm:min-h-[260px] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(217,70,239,0.12)] card-spotlight"
            >
              <div className="absolute -right-16 -top-16 w-36 h-36 rounded-full bg-fuchsia-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl pointer-events-none" />
              <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer pointer-events-none" />

              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center text-fuchsia-400 text-2xl group-hover:scale-110 transition-transform duration-500">
                    🎵
                  </div>
                  <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center text-brand-400 group-hover:text-white group-hover:border-white/20 transition-all duration-300 group-hover:translate-x-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-fuchsia-400 transition-colors">
                  Nishant&apos;s Favourite Songs
                </h3>
                <p className="text-sm text-brand-400 leading-relaxed max-w-sm">
                  A curated playlist of songs to study, vibe, and unwind — play directly on the site, no tab switching.
                </p>
              </div>

              <div className="mt-8 flex items-center gap-1.5 text-xs font-bold text-fuchsia-400 uppercase tracking-wider">
                Play Nishant&apos;s Favourite Songs
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </Link>

            {/* Card 2: Projects */}
            <Link
              href="/projects"
              className="group relative overflow-hidden rounded-3xl border border-white/5 bg-brand-900/10 hover:border-amber-500/30 p-6 sm:p-8 flex flex-col justify-between min-h-[240px] sm:min-h-[260px] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(245,158,11,0.12)] card-spotlight"
            >
              {/* Card accent gradient glow */}
              <div className="absolute -right-16 -top-16 w-36 h-36 rounded-full bg-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl pointer-events-none" />
              <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer pointer-events-none" />

              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-2xl group-hover:scale-110 transition-transform duration-500">
                    🚀
                  </div>
                  <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center text-brand-400 group-hover:text-white group-hover:border-white/20 transition-all duration-300 group-hover:translate-x-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-amber-400 transition-colors">
                  Nishant's Startups
                </h3>
                <p className="text-sm text-brand-400 leading-relaxed max-w-sm">
                  Deep dive into 2 AM Study, the Student Store, GATE CSE prep portals, and digital tools built for learners.
                </p>
              </div>

              <div className="mt-8 flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
                View Projects
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </Link>

            {/* Card 3: Universe */}
            <Link
              href="/universe"
              className="group relative overflow-hidden rounded-3xl border border-white/5 bg-brand-900/10 hover:border-emerald-500/30 p-6 sm:p-8 flex flex-col justify-between min-h-[240px] sm:min-h-[260px] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(16,185,129,0.12)] card-spotlight"
            >
              {/* Card accent gradient glow */}
              <div className="absolute -right-16 -top-16 w-36 h-36 rounded-full bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl pointer-events-none" />
              <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer pointer-events-none" />

              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-2xl group-hover:scale-110 transition-transform duration-500">
                    🌐
                  </div>
                  <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center text-brand-400 group-hover:text-white group-hover:border-white/20 transition-all duration-300 group-hover:translate-x-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors">
                  Follow Nishant
                </h3>
                <p className="text-sm text-brand-400 leading-relaxed max-w-sm">
                  Connect across social media platforms, communities, and creators.
                </p>
              </div>

              <div className="mt-8 flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Enter Universe
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </Link>

            {/* Card 4: Updates */}
            <Link
              href="/updates"
              className="group relative overflow-hidden rounded-3xl border border-white/5 bg-brand-900/10 hover:border-rose-500/30 p-6 sm:p-8 flex flex-col justify-between min-h-[240px] sm:min-h-[260px] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(244,63,94,0.12)] card-spotlight"
            >
              {/* Card accent gradient glow */}
              <div className="absolute -right-16 -top-16 w-36 h-36 rounded-full bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl pointer-events-none" />
              <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer pointer-events-none" />

              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 text-2xl group-hover:scale-110 transition-transform duration-500">
                    🔔
                  </div>
                  <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center text-brand-400 group-hover:text-white group-hover:border-white/20 transition-all duration-300 group-hover:translate-x-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-rose-400 transition-colors">
                  Latest Updates
                </h3>
                <p className="text-sm text-brand-400 leading-relaxed max-w-sm">
                  Stay updated with new YouTube video releases and Instagram posts.
                </p>
              </div>

              <div className="mt-8 flex items-center gap-1.5 text-xs font-bold text-rose-400 uppercase tracking-wider">
                Read Updates
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </Link>


            <Link
              href="/resume"
              className="group relative overflow-hidden rounded-3xl border border-white/5 bg-brand-900/10 hover:border-accent/30 p-6 sm:p-8 flex flex-col justify-between min-h-[240px] sm:min-h-[260px] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(245,158,11,0.12)] card-spotlight"
            >
              <div className="absolute -right-16 -top-16 w-36 h-36 rounded-full bg-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl pointer-events-none" />
              <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer pointer-events-none" />
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-2xl group-hover:scale-110 transition-transform duration-500">
                    📄
                  </div>
                  <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center text-brand-400 group-hover:text-white group-hover:border-white/20 transition-all duration-300 group-hover:translate-x-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-accent transition-colors">
                  Nishant's Resume
                </h3>
                <p className="text-sm text-brand-400 leading-relaxed max-w-sm">
                  View my educational credentials, core initiatives, skillsets, and download a print-ready version of my CV.
                </p>
              </div>
              <div className="mt-8 flex items-center gap-1.5 text-xs font-bold text-accent uppercase tracking-wider">
                Open Resume
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </Link>
          </div>
        </div>
      </section >

    </>
  );
}
