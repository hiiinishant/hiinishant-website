"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Link2 } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { API_BASE, LIVE_BACKEND_URL } from "@/lib/api";

interface FeaturedBio {
  bioUrl: string;
  bioHandle: string;
  bioTitle: string;
  bioDescription: string;
  buttonText: string;
}

const DEFAULT_FEATURED: FeaturedBio = {
  bioUrl: "/nishant",
  bioHandle: "nishant",
  bioTitle: "Nishant's Bio Link",
  bioDescription:
    "Explore all of Nishant's official links, social channels, and featured projects in one clean personal hub.",
  buttonText: "Visit Nishant's Bio",
};

export default function LinkInBioCard() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [featuredBio, setFeaturedBio] = useState<FeaturedBio>(DEFAULT_FEATURED);

  useEffect(() => {
    // 1. Fetch Nishant's featured bio settings
    let isMounted = true;

    const getBackendUrl = () => {
      if (process.env.NEXT_PUBLIC_BACKEND_URL) return process.env.NEXT_PUBLIC_BACKEND_URL;
      if (
        typeof window !== "undefined" &&
        (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
      ) {
        return "http://localhost:5000";
      }
      return API_BASE || LIVE_BACKEND_URL;
    };

    const fetchFeatured = async () => {
      try {
        const base = getBackendUrl();
        const res = await fetch(`${base}/api/bio/featured-link`).catch(() => null);
        if (res && res.ok && isMounted) {
          const data = await res.json();
          setFeaturedBio({
            bioUrl: data.bioUrl || DEFAULT_FEATURED.bioUrl,
            bioHandle: (data.bioHandle || DEFAULT_FEATURED.bioHandle).replace(/^@/, ""),
            bioTitle: data.bioTitle || DEFAULT_FEATURED.bioTitle,
            bioDescription: data.bioDescription || DEFAULT_FEATURED.bioDescription,
            buttonText: data.buttonText || DEFAULT_FEATURED.buttonText,
          });
        }
      } catch {
        // Fall back to DEFAULT_FEATURED
      }
    };

    fetchFeatured();

    // 2. Auth state & user's own bio profile check
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!isMounted) return;
      setUser(currentUser);
      if (currentUser && db) {
        try {
          const bioDoc = await getDoc(doc(db, "bio_pages", currentUser.uid));
          if (isMounted) {
            setHasProfile(bioDoc.exists() && !!bioDoc.data()?.username);
          }
        } catch {
          if (isMounted) setHasProfile(false);
        }
      } else {
        if (isMounted) setHasProfile(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const claimHref = user ? "/dashboard" : "/signup?redirect=/dashboard";

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/5 bg-brand-900/10 hover:border-cyan-500/30 p-6 sm:p-8 flex flex-col justify-between min-h-[240px] sm:min-h-[260px] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(6,182,212,0.12)] card-spotlight">
      {/* Accent gradient glow */}
      <div className="absolute -right-16 -top-16 w-36 h-36 rounded-full bg-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl pointer-events-none" />
      <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer pointer-events-none" />

      {/* Main card link overlay -> opens Nishant's Bio Link */}
      <Link
        href={featuredBio.bioUrl}
        className="absolute inset-0 z-10"
        aria-label={`${featuredBio.bioTitle} — ${featuredBio.bioDescription}`}
      />

      {/* Card Content */}
      <div className="relative z-0 pointer-events-none">
        <div className="flex justify-between items-start mb-6">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            <Link2 className="w-6 h-6" />
          </div>
          <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center text-brand-400 group-hover:text-white group-hover:border-white/20 transition-all duration-300 group-hover:translate-x-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">
            {featuredBio.bioTitle}
          </h3>
          {featuredBio.bioHandle && (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              @{featuredBio.bioHandle}
            </span>
          )}
        </div>

        <p className="text-sm text-brand-400 leading-relaxed max-w-sm line-clamp-3">
          {featuredBio.bioDescription}
        </p>
      </div>

      {/* Bottom Actions Row */}
      <div className="relative z-20 mt-6 pt-4 border-t border-white/5 flex items-center justify-between gap-3">
        {/* Visit Nishant's Bio */}
        <Link
          href={featuredBio.bioUrl}
          className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 uppercase tracking-wider group-hover:text-cyan-300 transition-colors pointer-events-auto"
        >
          <span>{featuredBio.buttonText}</span>
          <svg
            className="w-4 h-4 group-hover:translate-x-1 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>

        {/* Claim Your Handle / My Studio */}
        <Link
          href={claimHref}
          onClick={(e) => e.stopPropagation()}
          className="text-xs font-semibold px-3 py-1.5 rounded-full bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 transition-all hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(6,182,212,0.15)] flex items-center gap-1.5 pointer-events-auto whitespace-nowrap"
          title="Create or manage your personal link-in-bio page"
        >
          <span>✨</span>
          <span>{hasProfile ? "My Studio" : "Claim Your Handle"}</span>
        </Link>
      </div>
    </div>
  );
}
