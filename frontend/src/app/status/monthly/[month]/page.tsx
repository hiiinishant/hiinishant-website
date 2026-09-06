import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MonthlyStatusClient from "./MonthlyStatusClient";
import {
  getAllStatuses,
  getStatusesByMonth,
  getAvailableMonths,
  calculateMonthlyStats,
  formatMonthKeyToLabel,
} from "@/data/statusServer";

export const revalidate = 60;

interface Props {
  params: Promise<{ month: string }>;
}

export async function generateStaticParams() {
  const months = await getAvailableMonths();
  return months.map((m) => ({
    month: encodeURIComponent(m.key),
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { month: rawMonth } = await params;
  const monthKey = decodeURIComponent(rawMonth);
  const monthLabel = formatMonthKeyToLabel(monthKey);
  const statuses = await getStatusesByMonth(monthKey);
  const stats = calculateMonthlyStats(monthKey, statuses);

  const title = `${monthLabel} Monthly Summary — Nishant Kumar | Live Activity Logs`;
  const description = `Monthly performance log for ${monthLabel}. Total ${stats.totalStudyHours}h study (Avg ${stats.avgStudyHoursPerDay.toFixed(1)}h/day), ${stats.totalDevHours}h dev, ₹${stats.totalIncome} income, ${stats.totalVideos} videos, and building in public.`;

  return {
    title,
    description,
    keywords: [
      `Nishant Kumar ${monthLabel}`,
      `hiiinishant monthly status`,
      `2 AM Study ${monthLabel}`,
      `Nishant Kumar monthly performance`,
      `study logs ${monthLabel}`,
      `building in public ${monthLabel}`,
    ],
    alternates: {
      canonical: `/status/monthly/${encodeURIComponent(monthKey)}`,
    },
    openGraph: {
      title,
      description,
      url: `https://hiiinishant.com/status/monthly/${encodeURIComponent(monthKey)}`,
      type: "article",
    },
  };
}

export default async function MonthlyStatusPage({ params }: Props) {
  const { month: rawMonth } = await params;
  const monthKey = decodeURIComponent(rawMonth);

  const [monthStatuses, availableMonths] = await Promise.all([
    getStatusesByMonth(monthKey),
    getAvailableMonths(),
  ]);

  const isMonthFormat = /^\d{4}-\d{2}$/.test(monthKey);
  if (!isMonthFormat) {
    notFound();
  }

  const stats = calculateMonthlyStats(monthKey, monthStatuses);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: `${stats.monthLabel} Monthly Activity Summary — Nishant Kumar`,
    description: `Monthly performance log for ${stats.monthLabel}. Total ${stats.totalStudyHours}h study, ${stats.totalDevHours}h dev, and daily activity logs.`,
    datePublished: `${monthKey}-01`,
    dateModified: new Date().toISOString(),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://hiiinishant.com/status/monthly/${encodeURIComponent(monthKey)}`,
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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MonthlyStatusClient
        monthKey={monthKey}
        stats={stats}
        availableMonths={availableMonths}
        dailyRecords={monthStatuses}
      />
    </>
  );
}
