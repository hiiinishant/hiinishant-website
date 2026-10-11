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
      <div className="text-center pb-12">
        <Link
          href="/links"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/10 bg-white/5 text-xs sm:text-sm text-brand-300 hover:text-white hover:border-accent/40 transition-colors"
        >
          <span>Looking for the mobile link-in-bio page?</span>
          <span className="text-accent font-semibold">Open Bio Links Hub &rarr;</span>
        </Link>
      </div>

      {/* ─── BOTTOM CTA & NAVIGATION ─── */}
      <div className="max-w-6xl mx-auto px-5 sm:px-8 pb-20">
        <div className="pt-10 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div>
            <h3 className="text-lg font-bold text-white">Have feedback or want to collaborate?</h3>
            <p className="text-xs sm:text-sm text-brand-400 mt-1">
              Reach out directly with project proposals, sponsorship inquiries, or questions.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/contact"
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs sm:text-sm border border-white/10 transition-all hover:-translate-y-0.5"
            >
              Contact Nishant
            </Link>
            <Link
              href="/"
              className="px-5 py-2.5 rounded-xl border border-accent/30 text-accent font-semibold text-xs sm:text-sm hover:bg-accent/10 transition-all hover:-translate-y-0.5"
            >
              &larr; Main Profile
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
