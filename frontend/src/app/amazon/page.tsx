import type { Metadata } from "next";
import AmazonClientPage from "./AmazonClientPage";
import { API_BASE, LIVE_BACKEND_URL } from "@/lib/api";
import type { AmazonPick } from "@/types";

export const metadata: Metadata = {
  title: "Nishant's Picks — Amazon Storefront | Curated Gear & Recommendations",
  description:
    "Explore desk setup essentials, tech gadgets, study resources, productivity tools, and books handpicked and recommended by Nishant Kumar (Founder, 2 AM Study).",
  keywords: [
    "Nishant Kumar Amazon",
    "Nishant picks",
    "2 AM study amazon",
    "2amstudy amazon storefront",
    "hiiinishant amazon",
    "study setup essentials",
    "student productivity tools",
    "tech recommendations",
  ],
  alternates: {
    canonical: "https://hiiinishant.com/amazon",
  },
  openGraph: {
    title: "Nishant's Picks — Amazon Storefront | Curated Gear & Recommendations",
    description:
      "Explore desk setup gear, tech gadgets, study resources, and books handpicked by Nishant Kumar.",
    url: "https://hiiinishant.com/amazon",
    type: "website",
  },
};

async function getInitialPicks(): Promise<AmazonPick[]> {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || API_BASE || LIVE_BACKEND_URL;
    const res = await fetch(`${backendUrl}/api/amazon-picks`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Graceful fallback to client fetch
  }
  return [];
}

export default async function AmazonPage() {
  const initialPicks = await getInitialPicks();
  return <AmazonClientPage initialPicks={initialPicks} />;
}