"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  BookOpen,
  Code2,
  GraduationCap,
  Heart,
  Compass,
  Rocket,
  Flame,
  Music,
  Video,
  Camera,
  ShoppingBag,
  Activity,
  ArrowRight,
  Send,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { socialLinks } from "@/data/site";

export default function AboutClientPage() {
  const websiteSections = [
    {
      title: "My Journey & Story",
      href: "/journey",
      desc: "Timeline of major milestones from school and college to building 2 AM Study and beyond.",
      icon: Compass,
      color: "from-amber-500/20 to-amber-500/5 text-amber-400 border-amber-500/20",
      tag: "Timeline",
    },
    {
      title: "Projects & Code",
      href: "/projects",
      desc: "Software applications, startup initiatives, tools, and technical experiments built with modern stacks.",
      icon: Rocket,
      color: "from-blue-500/20 to-blue-500/5 text-blue-400 border-blue-500/20",
      tag: "Engineering",
    },
    {
      title: "Learning & Blog",
      href: "/blog",
      desc: "Articles and insights on coding, study strategies, productivity hacks, and personal reflections.",
      icon: BookOpen,
      color: "from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/20",
      tag: "Articles",
    },
    {
      title: "Daily Status Logs",
      href: "/status",
      desc: "Reverse-chronological daily updates on what I am building, learning, and shipping each day.",
      icon: Activity,
      color: "from-purple-500/20 to-purple-500/5 text-purple-400 border-purple-500/20",
      tag: "Daily Logs",
    },
    {
      title: "Daily Quiz & Practice",
      href: "/quiz",
      desc: "Interactive daily programming & conceptual questions with streaks and a student leaderboard.",
      icon: Flame,
      color: "from-orange-500/20 to-orange-500/5 text-orange-400 border-orange-500/20",
      tag: "Interactive",
    },
    {
      title: "Life Vlogs & Stories",
      href: "/vlogs",
      desc: "Raw, authentic video diaries, campus life moments, and creative documentaries on YouTube.",
      icon: Video,
      color: "from-red-500/20 to-red-500/5 text-red-400 border-red-500/20",
      tag: "YouTube",
    },
    {
      title: "Curated Music & Playlists",
      href: "/music",
      desc: "Handpicked official soundtrack playlists designed for deep study flow and late-night coding sessions.",
      icon: Music,
      color: "from-cyan-500/20 to-cyan-500/5 text-cyan-400 border-cyan-500/20",
      tag: "Playlists",
    },
    {
      title: "Gallery & Memories",
      href: "/gallery",
      desc: "A curated photo gallery of campus events, achievements, behind-the-scenes, and motivational snapshots.",
      icon: Camera,
      color: "from-pink-500/20 to-pink-500/5 text-pink-400 border-pink-500/20",
      tag: "Memories",
    },
    {
      title: "Nishant's Picks & Gear",
      href: "/amazon-feed",
      desc: "Handpicked study essentials, desk setup gear, books, and productivity tools that I personally recommend.",
      icon: ShoppingBag,
      color: "from-yellow-500/20 to-yellow-500/5 text-yellow-400 border-yellow-500/20",
      tag: "Curated Gear",
    },
  ];

  const corePillars = [
    {
      title: "Building in Public",
      desc: "Sharing progress, daily logs, successes, and lessons learned openly with the community.",
    },
    {
      title: "Consistency Over Intensity",
      desc: "Showing up every day, writing clean code, solving daily challenges, and improving step by step.",
    },
    {
      title: "Student-First Education",
      desc: "Creating accessible, practical resources through 2 AM Study to empower learners across India.",
    },
  ];

  return (
    <main className="min-h-screen pt-10 sm:pt-14 pb-24 px-5 sm:px-8 relative overflow-hidden">
      {/* Background ambient glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-amber-500/6 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-amber-500/4 rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto space-y-14 sm:space-y-16">
        
        {/* ─── 1. HERO HEADER ─── */}
        <section className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/10 border border-accent/25 text-accent text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            Digital Home &amp; Personal Space
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
            About <span className="text-gradient">Hiii Nishant</span>
          </h1>

          <p className="text-brand-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed font-normal">
            Welcome to my personal corner on the web — a space dedicated to my journey, projects, learning, 2 AM Study, and everything I create along the way.
          </p>
        </section>

        {/* ─── 2. WHO IS NISHANT? (Personal Bio Card) ─── */}
        <section className="relative rounded-3xl border border-white/10 bg-zinc-950/70 p-6 sm:p-10 backdrop-blur-xl shadow-xl overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl pointer-events-none -z-10" />

          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Profile Avatar */}
            <div className="relative shrink-0">
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl overflow-hidden border-2 border-white/15 shadow-[0_0_30px_rgba(245,158,11,0.2)] relative">
                <Image
                  src="/profile.jpg"
                  alt="Nishant Kumar"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <div className="absolute -bottom-2 -right-2 px-2.5 py-1 rounded-xl bg-accent text-black text-[11px] font-extrabold tracking-wider uppercase shadow-lg">
                Founder
              </div>
            </div>

            {/* Bio Content */}
            <div className="flex-1 space-y-4 text-center md:text-left">
              <div>
                <span className="text-xs font-mono font-semibold uppercase tracking-widest text-accent">
                  The Person Behind Hiii Nishant
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                  Nishant Kumar
                </h2>
                <p className="text-xs sm:text-sm text-brand-400 font-mono mt-0.5">
                  Computer Science &amp; Engineering · Chandigarh University
                </p>
              </div>

              <div className="space-y-3 text-brand-200 text-sm sm:text-base leading-relaxed">
                <p>
                  Hi, I&apos;m <strong className="text-white font-semibold">Nishant Kumar</strong> (known online as <strong className="text-accent font-semibold">hiiinishant</strong>). I am an engineering student, software builder, educator, and digital creator with a deep passion for technology and empowering people through education.
                </p>
                <p>
                  With a background in <strong className="text-white">Computer Science &amp; Engineering</strong> from Chandigarh University, I spend my time programming modern web applications, building educational tools, producing study content, and documenting my day-to-day journey in tech and life.
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5 justify-center md:justify-start pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-brand-300">
                  <GraduationCap className="w-3.5 h-3.5 text-accent" /> CSE Student
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-brand-300">
                  <Code2 className="w-3.5 h-3.5 text-accent" /> Full-Stack Builder
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-brand-300">
                  <Heart className="w-3.5 h-3.5 text-rose-400" /> Educator &amp; Mentor
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 3. WHAT IS HIII NISHANT & 2 AM STUDY ─── */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* What is Hiii Nishant */}
          <div className="rounded-3xl border border-white/10 bg-zinc-950/60 p-6 sm:p-8 space-y-4 relative overflow-hidden backdrop-blur-md">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-white">
              What is <span className="text-accent">Hiii Nishant</span>?
            </h3>
            <p className="text-sm text-brand-300 leading-relaxed">
              <strong className="text-white">hiiinishant.com</strong> is my personal platform and digital identity on the web. Rather than relying solely on social media algorithms, this website serves as a permanent, independent space where I share my genuine journey, software projects, daily logs, study materials, and curated recommendations directly with you.
            </p>
          </div>

          {/* 2 AM Study */}
          <div className="rounded-3xl border border-white/10 bg-zinc-950/60 p-6 sm:p-8 space-y-4 relative overflow-hidden backdrop-blur-md">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-white">
              About <span className="text-cyan-400">2 AM Study</span>
            </h3>
            <p className="text-sm text-brand-300 leading-relaxed">
              <strong className="text-white">2 AM Study</strong> is my education-first initiative and brand. Born out of late-night study sessions and a desire to make learning simpler, 2 AM Study focuses on structured study resources, exam preparation guidance, student productivity tips, and daily motivation for learners across India.
            </p>
          </div>
        </section>

        {/* ─── 4. WHAT YOU'LL FIND HERE (Guide to the Website) ─── */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <span className="text-xs font-mono font-semibold uppercase tracking-widest text-accent">
              Explore The Platform
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              What You&apos;ll Find on This Website
            </h2>
            <p className="text-xs sm:text-sm text-brand-400 max-w-lg mx-auto">
              Everything I build and curate is organized into dedicated sections for easy navigation:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {websiteSections.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group rounded-2xl border border-white/8 bg-zinc-950/50 p-5 hover:border-accent/30 hover:bg-white/4 transition-all duration-300 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`w-9 h-9 rounded-xl border flex items-center justify-center bg-gradient-to-br ${item.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-mono text-brand-500 uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/4">
                        {item.tag}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-accent transition-colors flex items-center gap-1.5">
                        {item.title}
                        <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-accent" />
                      </h4>
                      <p className="text-xs text-brand-400 mt-1 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono text-brand-500 group-hover:text-brand-300 transition-colors pt-2 border-t border-white/5">
                    Visit {item.href} →
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ─── 5. MY PHILOSOPHY ─── */}
        <section className="rounded-3xl border border-amber-500/20 bg-gradient-to-b from-amber-500/10 via-zinc-950/80 to-zinc-950 p-6 sm:p-10 text-center space-y-6 relative overflow-hidden shadow-[0_10px_35px_rgba(245,158,11,0.08)]">
          <div className="space-y-2">
            <span className="text-xs font-mono font-semibold uppercase tracking-widest text-accent">
              Core Principles
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              My Philosophy
            </h2>
          </div>

          <blockquote className="text-lg sm:text-xl font-medium text-white italic max-w-xl mx-auto leading-relaxed">
            &ldquo;Success isn&apos;t just my dream; it&apos;s the <span className="text-amber-300 font-semibold not-italic">smile I want to see on my parents&apos; faces.</span>&rdquo;
          </blockquote>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left pt-4 border-t border-white/10">
            {corePillars.map((pillar) => (
              <div key={pillar.title} className="p-4 rounded-2xl bg-white/3 border border-white/5 space-y-1.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">{pillar.title}</h4>
                </div>
                <p className="text-xs text-brand-400 leading-relaxed">{pillar.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── 6. STAY CONNECTED & REACH OUT ─── */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <span className="text-xs font-mono font-semibold uppercase tracking-widest text-accent">
              Let&apos;s Connect
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Stay Connected
            </h2>
            <p className="text-xs sm:text-sm text-brand-400 max-w-md mx-auto">
              Follow my daily updates on social media, or send a direct inquiry through the contact page:
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {socialLinks.slice(0, 8).map((link) => (
              <a
                key={link.platform}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 rounded-2xl border border-white/8 bg-zinc-950/60 hover:border-accent/30 hover:bg-white/4 transition-all duration-300 flex items-center justify-between group"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white group-hover:text-accent transition-colors truncate">
                    {link.label}
                  </p>
                  <p className="text-[11px] text-brand-500 font-mono truncate">{link.handle}</p>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-brand-500 group-hover:text-accent transition-colors shrink-0 ml-2" />
              </a>
            ))}
          </div>

          <div className="text-center pt-2">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-accent hover:bg-accent-hover text-black font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:-translate-y-0.5"
            >
              <Send className="w-4 h-4" />
              Send a Direct Message
            </Link>
          </div>
        </section>

      </div>
    </main>
  );
}
