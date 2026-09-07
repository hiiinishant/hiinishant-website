import type { Metadata } from "next";
import Link from "next/link";
import SocialSection from "@/components/sections/SocialSection";

export const metadata: Metadata = {
  title: "Social Media — Nishant Kumar | hiiinishant",
  description:
    "Follow Nishant Kumar (hiiinishant) across all social platforms — Instagram, YouTube, Twitter, LinkedIn, and Facebook. Founder of 2 AM Study and student entrepreneur.",
  keywords: ["nishant kumar instagram", "nishant kumar youtube", "hiiinishant social media", "2 AM Study social", "nishant kumar twitter", "nishant kumar linkedin"],
  alternates: { canonical: "/universe" },
  openGraph: {
    title: "Follow Nishant Kumar — hiiinishant on Social Media",
    description: "Connect with Nishant Kumar across Instagram, YouTube, LinkedIn, Twitter, and more.",
    url: "https://hiiinishant.com/universe",
  },
};

export default function UniversePage() {
  return (
    <>
      {/* ─── SOCIAL GRID ─── */}
      <SocialSection />
      <div className="text-center pb-16">
        <Link
          href="/links"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/10 bg-white/5 text-xs sm:text-sm text-brand-300 hover:text-white hover:border-accent/40 transition-colors"
        >
          <span>Looking for the mobile link-in-bio page?</span>
          <span className="text-accent font-semibold">Open Bio Links Hub &rarr;</span>
        </Link>
      </div>
    </>
  );
}
