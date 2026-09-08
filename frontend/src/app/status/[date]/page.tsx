import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BookOpen,
  Terminal,
  Video,
  Moon,
  Star,
  Lightbulb,
  Calendar,
  IndianRupee,
  CalendarX,
  Quote,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { getAllStatuses, getStatusByDate } from "@/data/statusServer";

export const revalidate = 60;

interface Props {
  params: Promise<{ date: string }>;
}

export async function generateStaticParams() {
  const statuses = await getAllStatuses();
  return statuses.map((status) => ({
    date: encodeURIComponent(status.date || status.id),
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { date: rawDate } = await params;
  const decodedDate = decodeURIComponent(rawDate);
  const status = await getStatusByDate(decodedDate);

  if (!status) {
    return { title: "Daily Log Not Found | Nishant Kumar" };
  }

  const studyInfo = status.study
    ? `Studied ${status.study.subject} for ${status.study.hours}h, ${status.study.questions} Qs`
    : "";
  const devInfo = status.project
    ? `Dev: ${status.project.tasks.slice(0, 2).join(", ")}`
    : "";
  const lesson = status.lessonLearned
    ? `Lesson: "${status.lessonLearned}"`
    : "";

  const title = `Daily Log: ${status.date} — Nishant Kumar`;
  const description = [
    `Daily activity log for ${status.date} by Nishant Kumar (hiiinishant).`,
    studyInfo,
    devInfo,
    status.statusText,
    lesson,
  ]
    .filter(Boolean)
    .join(" · ");

  const keywords = [
    `Nishant Kumar ${status.date}`,
    `hiiinishant ${status.date}`,
    `2 AM Study ${status.date}`,
    status.study?.subject ? `Nishant ${status.study.subject}` : "",
    "Nishant Kumar daily log",
    "building in public",
    "daily study log",
    "hiiinishant",
  ].filter(Boolean);

  return {
    title,
    description,
    keywords,
    alternates: { canonical: `/status/${encodeURIComponent(status.date)}` },
    openGraph: {
      title,
      description,
      url: `https://hiiinishant.com/status/${encodeURIComponent(status.date)}`,
      type: "article",
    },
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatTime(iso: string) {
  try {
    return (
      new Date(iso).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }) + " IST"
    );
  } catch {
    return "";
  }
}

function moodEmoji(m: number) {
  return m >= 9 ? "🤩" : m >= 7 ? "😊" : m >= 5 ? "😐" : "😔";
}

function renderEatStars(r: number) {
  const active = Math.min(Math.max(0, r), 5);
  const inactive = 5 - active;
  return (
    <span className="inline-flex items-center leading-none select-none text-[13px] tracking-tight">
      <span className="text-amber-400">{"★".repeat(active)}</span>
      <span className="text-zinc-700">{"★".repeat(inactive)}</span>
    </span>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function StatusDatePage({ params }: Props) {
  const { date: rawDate } = await params;
  const decodedDate = decodeURIComponent(rawDate);
  const status = await getStatusByDate(decodedDate);

  if (!status) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden pt-20 pb-20 flex items-center justify-center">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[450px] bg-accent/3 rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse-slow" />
        <div className="max-w-xl w-full mx-auto px-5 relative z-10 text-center space-y-6">
          <div className="rounded-3xl border border-amber-500/25 bg-gradient-to-b from-amber-500/10 via-[#09090b]/95 to-[#09090b] backdrop-blur-2xl p-6 sm:p-8 text-center space-y-5 shadow-2xl shadow-amber-950/20">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-semibold font-mono tracking-wide">
              <CalendarX className="w-3.5 h-3.5 text-amber-400" />
              <span>Workspace Log Notice</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Nishant&apos;s work is not stored for this date
              </h1>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                No activity log exists for <span className="text-amber-300 font-semibold">&ldquo;{decodedDate}&rdquo;</span> in our database. Some days are dedicated to deep offline study, intense coding sprints away from logging, or well-deserved rest.
              </p>
            </div>

            {/* Motivational Quote Block */}
            <div className="relative max-w-md mx-auto p-4 sm:p-5 rounded-2xl border border-amber-500/20 bg-black/50 backdrop-blur-md text-left shadow-lg space-y-2">
              <div className="flex items-center justify-between">
                <Quote className="w-5 h-5 text-amber-400/80 rotate-180" />
                <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400/90 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" /> Thought For The Day
                </span>
              </div>
              <blockquote className="text-xs sm:text-sm text-zinc-100 italic leading-relaxed font-sans">
                &ldquo;Not every day of hard work is recorded in a database. Some of the most transformative breakthroughs happen in complete silence away from the screen.&rdquo;
              </blockquote>
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                <span className="text-amber-300 font-medium">— 2 AM Study Philosophy</span>
                <span className="text-zinc-500">Mindset &amp; Focus</span>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/status"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-accent text-zinc-950 hover:bg-accent/90 text-xs font-bold transition-all shadow-md shadow-accent/20 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Live Status Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const net = (status.finance?.income || 0) - (status.finance?.expense || 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: `Daily Status Log: ${status.date} — Nishant Kumar`,
    description:
      status.statusText ||
      status.lessonLearned ||
      `Daily log entry for ${status.date}`,
    datePublished: status.updatedAt || status.date,
    dateModified: status.updatedAt || status.date,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://hiiinishant.com/status/${encodeURIComponent(status.date)}`,
    },
    author: {
      "@type": "Person",
      name: "Nishant Kumar",
      url: "https://hiiinishant.com",
    },
    publisher: {
      "@type": "Organization",
      name: "2 AM Study",
      url: "https://2amstudy.com",
    },
  };

  const isStructured = !!(
    status.study ||
    status.project ||
    status.content ||
    status.health ||
    status.finance ||
    status.bestMoment ||
    status.lessonLearned
  );

  return (
    <div className="min-h-screen bg-background relative overflow-hidden pt-16 lg:pt-20 pb-16 lg:pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-accent/3 rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse-slow" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.005)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.005)_1px,transparent_1px)] bg-[size:72px_72px] pointer-events-none -z-20 opacity-30" />

      <div className="max-w-2xl mx-auto px-5 relative z-10 space-y-6">
        {/* Back link */}
        <Link
          href="/status"
          className="inline-flex items-center gap-1.5 text-xs text-brand-500 hover:text-white transition-colors font-mono"
        >
          ← Back to Status Dashboard
        </Link>

        {/* ── The Card — identical to dashboard ── */}
        <div className="rounded-2xl border border-zinc-700/70 bg-[#09090b]/90 backdrop-blur-xl shadow-lg shadow-black/50 overflow-hidden">
          <article>
            {/* Card Header */}
            <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 sm:py-3.5 border-b border-white/5 bg-white/2">
              <div className="flex items-center gap-2 min-w-0">
                <Calendar className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5 sm:mt-0" />
                {/* Laptop / Desktop: 1 line */}
                <span className="hidden sm:inline text-sm font-bold text-white">
                  {formatDate(status.date)}
                </span>
                {/* Phone user: 2 lines */}
                <span className="sm:hidden flex flex-col leading-tight text-left">
                  <span className="text-xs font-bold text-white">
                    {status.date ? new Date(status.date).toLocaleDateString("en-US", { weekday: "long" }) : ""}
                  </span>
                  <span className="text-[10.5px] text-zinc-400 font-medium">
                    {status.date ? new Date(status.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : status.date}
                  </span>
                </span>
              </div>

              {/* Right side: 2 lines on phone, 1 line on desktop */}
              <div className="flex flex-col items-end sm:flex-row sm:items-center gap-0.5 sm:gap-2 text-right shrink-0">
                {status.mood != null && (
                  <span className="text-[11px] sm:text-xs font-semibold text-amber-400 leading-tight">
                    {moodEmoji(status.mood)} {status.mood}/10
                  </span>
                )}
                <span className="text-[10px] text-zinc-400 sm:text-zinc-300 font-mono shrink-0 leading-tight">
                  {formatTime(status.updatedAt)}
                </span>
              </div>
            </div>

            {/* Card Body */}
            <div className="px-5 py-4 space-y-4">
              {/* Focus summary */}
              {status.statusText && (
                <p className="text-sm text-white font-medium leading-snug border-l-2 border-accent/50 pl-3">
                  {status.statusText}
                </p>
              )}

              {!isStructured ? (
                /* Legacy: plain task list */
                status.tasks && status.tasks.length > 0 && (
                  <ul className="space-y-1.5 pl-1">
                    {status.tasks.map((task, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs text-brand-300">
                        <span className="text-brand-600 mt-1 select-none">▪</span>
                        <span className="leading-relaxed">{task}</span>
                      </li>
                    ))}
                  </ul>
                )
              ) : (
                /* Structured flat rows — exactly matching the dashboard */
                <div className="divide-y divide-white/[0.06]">

                  {/* Study */}
                  {status.study && (
                    <div className="py-2.5 grid grid-cols-[6.5rem_0.75rem_1fr] gap-x-2 gap-y-0 items-center">
                      <span className="text-[10.5px] font-bold text-yellow-400 uppercase tracking-wider font-mono flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5 shrink-0" /> Study
                      </span>
                      <span className="text-zinc-600 font-bold text-sm leading-none flex items-center justify-center">→</span>
                      <div className="text-xs text-zinc-300 flex flex-wrap gap-x-3 items-center leading-normal">
                        <span className="font-bold text-white">{status.study.hours}h</span>
                        <span>Subject - <span className="text-white uppercase font-semibold">{status.study.subject || "—"}</span></span>
                        {status.study.questions > 0 && (
                          <span>Practice Qs - <span className="text-white">{status.study.questions} Qs</span></span>
                        )}
                        {status.study.mock && status.study.mock !== "N/A" && status.study.mock !== "" && (
                          <span className="text-amber-400 font-mono font-semibold">Mock: {status.study.mock}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Dev */}
                  {status.project && (
                    <div className="py-2.5 grid grid-cols-[6.5rem_0.75rem_1fr] gap-x-2 gap-y-0 items-center">
                      <span className="text-[10.5px] font-bold text-yellow-400 uppercase tracking-wider font-mono flex items-center gap-1">
                        <Terminal className="w-3.5 h-3.5 shrink-0" /> Dev
                      </span>
                      <span className="text-zinc-600 font-bold text-sm leading-none flex items-center justify-center">→</span>
                      <div className="text-xs text-zinc-300 flex flex-wrap gap-x-3 items-center leading-normal">
                        <span className="font-bold text-white">{status.project.hours}h</span>
                        {status.project.tasks && status.project.tasks.length > 0 && (
                          <span className="text-zinc-400 flex flex-wrap gap-x-2.5 items-center">
                            {status.project.tasks.slice(0, 3).map((t, i) => (
                              <span key={i} className="inline-flex items-center gap-1">
                                <span className="text-cyan-400 font-bold">▸</span> {t}
                              </span>
                            ))}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Content */}
                  {status.content && (
                    <div className="py-2.5 grid grid-cols-[6.5rem_0.75rem_1fr] gap-x-2 gap-y-0 items-center">
                      <span className="text-[10.5px] font-bold text-yellow-400 uppercase tracking-wider font-mono flex items-center gap-1">
                        <Video className="w-3.5 h-3.5 shrink-0" /> Content
                      </span>
                      <span className="text-zinc-600 font-bold text-sm leading-none flex items-center justify-center">→</span>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-300 leading-normal">
                        <span>Youtube video - <span className="font-bold text-white">{status.content.videos || 0}</span></span>
                        <span>Blog - <span className="font-bold text-white">{status.content.blogs || 0}</span></span>
                        <span>Insta post - <span className="font-bold text-white">{status.content.posts || 0}</span></span>
                      </div>
                    </div>
                  )}

                  {/* Health */}
                  {status.health && (
                    <div className="py-2.5 grid grid-cols-[6.5rem_0.75rem_1fr] gap-x-2 gap-y-0 items-center">
                      <span className="text-[10.5px] font-bold text-yellow-400 uppercase tracking-wider font-mono flex items-center gap-1">
                        <Moon className="w-3.5 h-3.5 shrink-0" /> Health
                      </span>
                      <span className="text-zinc-600 font-bold text-sm leading-none flex items-center justify-center">→</span>
                      <div className="flex items-center gap-4 text-xs">
                        <span><span className="font-bold text-white">{status.health.sleep}h</span> <span className="text-zinc-500">sleep</span></span>
                        <span className="flex items-center gap-1.5 text-zinc-400">
                          Healthy Diet - {renderEatStars(status.health.healthyEating || 5)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Finance */}
                  {status.finance && (
                    <div className="py-2.5 grid grid-cols-[6.5rem_0.75rem_1fr] gap-x-2 gap-y-0 items-center">
                      <span className="text-[10.5px] font-bold text-yellow-400 uppercase tracking-wider font-mono flex items-center gap-1">
                        <IndianRupee className="w-3.5 h-3.5 shrink-0" /> Finance
                      </span>
                      <span className="text-zinc-600 font-bold text-sm leading-none flex items-center justify-center">→</span>
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs">
                        <span className="text-zinc-400">Income <span className="font-bold text-emerald-400">+₹{status.finance.income || 0}</span></span>
                        <span className="text-zinc-400">Expense <span className="font-bold text-red-400">−₹{status.finance.expense || 0}</span></span>
                        <span className="text-zinc-400">Net <span className={`font-bold ${net >= 0 ? "text-emerald-400" : "text-red-400"}`}>{net >= 0 ? "+" : ""}₹{net}</span></span>
                      </div>
                    </div>
                  )}

                  {/* Best Moment */}
                  {status.bestMoment && (
                    <div className="py-2.5 grid grid-cols-[6.5rem_0.75rem_1fr] gap-x-2 gap-y-0 items-start">
                      <span className="text-[10.5px] font-bold text-yellow-400 uppercase tracking-wider font-mono flex items-center gap-1 pt-0.5">
                        <Star className="w-3.5 h-3.5 shrink-0" /> Best Moments
                      </span>
                      <span className="text-zinc-600 font-bold text-sm leading-none flex items-center justify-center pt-0.5">→</span>
                      <p className="text-xs text-zinc-300 leading-relaxed italic">&ldquo;{status.bestMoment}&rdquo;</p>
                    </div>
                  )}

                  {/* Lesson */}
                  {status.lessonLearned && (
                    <div className="py-2.5 grid grid-cols-[6.5rem_0.75rem_1fr] gap-x-2 gap-y-0 items-start">
                      <span className="text-[10.5px] font-bold text-yellow-400 uppercase tracking-wider font-mono flex items-center gap-1 pt-0.5">
                        <Lightbulb className="w-3.5 h-3.5 shrink-0" /> Lesson
                      </span>
                      <span className="text-zinc-600 font-bold text-sm leading-none flex items-center justify-center pt-0.5">→</span>
                      <p className="text-xs text-zinc-400 leading-relaxed italic">{status.lessonLearned}</p>
                    </div>
                  )}

                </div>
              )}
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
