import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllStatuses, getStatusByDate } from "@/data/statusServer";
import PageHeader from "@/components/layout/PageHeader";

export const revalidate = 60; // Revalidate every 60s

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
    return {
      title: "Daily Status Log Not Found | Nishant Kumar",
    };
  }

  const formattedDate = status.date;
  const studyInfo = status.study
    ? `Studied ${status.study.subject} (${status.study.hours}h, ${status.study.questions} Qs)`
    : "";
  const devInfo = status.project ? `Dev: ${status.project.tasks.join(", ")}` : "";
  const lesson = status.lessonLearned ? `Lesson: "${status.lessonLearned}"` : "";

  const title = `Daily Log: ${formattedDate} — Nishant Kumar | 2 AM Study`;
  const description = [
    `Daily status log for ${formattedDate} by Nishant Kumar (hiiinishant).`,
    studyInfo,
    devInfo,
    status.statusText,
    lesson,
  ]
    .filter(Boolean)
    .join(" · ");

  const keywords = [
    `Nishant Kumar ${formattedDate}`,
    `hiiinishant ${formattedDate}`,
    `2 AM Study ${formattedDate}`,
    status.study?.subject ? `Nishant ${status.study.subject}` : "",
    "Nishant Kumar daily log",
    "building in public",
    "daily study log",
  ].filter(Boolean);

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: `/status/${encodeURIComponent(formattedDate)}`,
    },
    openGraph: {
      title,
      description,
      url: `https://hiiinishant.com/status/${encodeURIComponent(formattedDate)}`,
      type: "article",
    },
  };
}

export default async function StatusDatePage({ params }: Props) {
  const { date: rawDate } = await params;
  const decodedDate = decodeURIComponent(rawDate);
  const status = await getStatusByDate(decodedDate);

  if (!status) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": `Daily Status Log: ${status.date} — Nishant Kumar`,
    "description": status.statusText || status.lessonLearned || `Daily log entry for ${status.date}`,
    "datePublished": status.updatedAt || status.date,
    "dateModified": status.updatedAt || status.date,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://hiiinishant.com/status/${encodeURIComponent(status.date)}`,
    },
    "author": {
      "@type": "Person",
      "name": "Nishant Kumar",
      "url": "https://hiiinishant.com",
    },
    "publisher": {
      "@type": "Organization",
      "name": "2 AM Study",
      "url": "https://2amstudy.com",
    },
  };

  const netFinance = status.finance
    ? status.finance.income - status.finance.expense
    : null;

  return (
    <div className="min-h-screen py-16 sm:py-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Back Link */}
        <div className="mb-8">
          <Link
            href="/status"
            className="inline-flex items-center gap-2 text-xs text-brand-400 hover:text-white transition-colors duration-300 font-mono"
          >
            ← Back to Status Dashboard
          </Link>
        </div>

        <PageHeader
          label="Daily Log Entry"
          title={status.date}
          description="Detailed breakdown of study hours, development progress, health metrics, and key takeaways for this day."
        />

        {/* Main Status Log Card */}
        <div className="mt-8 space-y-8">
          {/* Header Badge & Rating */}
          <div className="glass-strong p-6 sm:p-8 rounded-2xl border border-white/10 relative overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/5">
              <div>
                <span className="text-xs font-mono text-accent uppercase tracking-widest block mb-1">
                  Log Summary
                </span>
                <h2 className="text-2xl font-bold text-white">{status.date}</h2>
              </div>
              {status.mood !== undefined && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-xs text-brand-400">Day Rating:</span>
                  <span className="text-sm font-bold text-accent">
                    {status.mood}/10
                  </span>
                </div>
              )}
            </div>

            {status.statusText && (
              <p className="mt-6 text-base text-brand-200 leading-relaxed italic">
                “{status.statusText}”
              </p>
            )}

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              {/* Study Section */}
              {status.study && (
                <div className="glass p-5 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent mb-3 font-mono">
                    <span>📚</span> Study
                  </div>
                  <div className="space-y-2 text-xs text-brand-300">
                    <div className="flex justify-between">
                      <span className="text-brand-400">Subject:</span>
                      <span className="font-semibold text-white">
                        {status.study.subject}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-brand-400">Hours:</span>
                      <span className="font-semibold text-white">
                        {status.study.hours}h
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-brand-400">Questions:</span>
                      <span className="font-semibold text-white">
                        {status.study.questions} Qs
                      </span>
                    </div>
                    {status.study.mock && (
                      <div className="flex justify-between">
                        <span className="text-brand-400">Mock Score:</span>
                        <span className="font-semibold text-white">
                          {status.study.mock}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Development Section */}
              {status.project && (
                <div className="glass p-5 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent mb-3 font-mono">
                    <span>💻</span> Development
                  </div>
                  <div className="space-y-2 text-xs text-brand-300">
                    <div className="flex justify-between mb-2">
                      <span className="text-brand-400">Dev Time:</span>
                      <span className="font-semibold text-white">
                        {status.project.hours}h
                      </span>
                    </div>
                    {status.project.tasks && status.project.tasks.length > 0 && (
                      <div>
                        <span className="text-brand-400 block mb-1">Tasks Completed:</span>
                        <ul className="space-y-1 pl-3">
                          {status.project.tasks.map((task, idx) => (
                            <li key={idx} className="text-white list-disc">
                              {task}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Content Section */}
              {status.content && (
                <div className="glass p-5 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent mb-3 font-mono">
                    <span>🎥</span> Content Created
                  </div>
                  <div className="space-y-2 text-xs text-brand-300">
                    {status.content.videos !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-brand-400">YouTube Videos:</span>
                        <span className="font-semibold text-white">
                          {status.content.videos}
                        </span>
                      </div>
                    )}
                    {status.content.blogs !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-brand-400">Blogs Published:</span>
                        <span className="font-semibold text-white">
                          {status.content.blogs}
                        </span>
                      </div>
                    )}
                    {status.content.posts !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-brand-400">Instagram Posts:</span>
                        <span className="font-semibold text-white">
                          {status.content.posts}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Health Section */}
              {status.health && (
                <div className="glass p-5 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent mb-3 font-mono">
                    <span>😴</span> Health & Lifestyle
                  </div>
                  <div className="space-y-2 text-xs text-brand-300">
                    <div className="flex justify-between">
                      <span className="text-brand-400">Sleep:</span>
                      <span className="font-semibold text-white">
                        {status.health.sleep}h
                      </span>
                    </div>
                    {status.health.healthyEating !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-brand-400">Diet Rating:</span>
                        <span className="font-semibold text-white">
                          {status.health.healthyEating}/5
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Finance Section */}
              {status.finance && (
                <div className="glass p-5 rounded-xl border border-white/5 md:col-span-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent mb-3 font-mono">
                    <span>💸</span> Daily Financials
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-xs text-brand-300 text-center">
                    <div className="bg-white/5 p-3 rounded-lg">
                      <span className="text-brand-400 block text-[10px]">Income</span>
                      <span className="font-semibold text-emerald-400 text-sm">
                        +₹{status.finance.income}
                      </span>
                    </div>
                    <div className="bg-white/5 p-3 rounded-lg">
                      <span className="text-brand-400 block text-[10px]">Expense</span>
                      <span className="font-semibold text-red-400 text-sm">
                        −₹{status.finance.expense}
                      </span>
                    </div>
                    <div className="bg-white/5 p-3 rounded-lg">
                      <span className="text-brand-400 block text-[10px]">Net</span>
                      <span
                        className={`font-semibold text-sm ${
                          (netFinance ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {netFinance !== null && netFinance >= 0 ? "+" : ""}₹{netFinance}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Takeaways Section */}
            {(status.bestMoment || status.lessonLearned) && (
              <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
                {status.bestMoment && (
                  <div className="flex items-start gap-3">
                    <span className="text-base">⭐</span>
                    <div>
                      <span className="text-xs font-bold text-accent uppercase tracking-wider block font-mono">
                        Best Moment
                      </span>
                      <p className="text-xs text-brand-200 mt-0.5">
                        “{status.bestMoment}”
                      </p>
                    </div>
                  </div>
                )}
                {status.lessonLearned && (
                  <div className="flex items-start gap-3">
                    <span className="text-base">💡</span>
                    <div>
                      <span className="text-xs font-bold text-accent uppercase tracking-wider block font-mono">
                        Key Lesson Learned
                      </span>
                      <p className="text-xs text-brand-200 mt-0.5">
                        “{status.lessonLearned}”
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
