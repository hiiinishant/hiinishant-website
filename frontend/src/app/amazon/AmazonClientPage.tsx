"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { AmazonPick } from "@/types";
import { API_BASE, LIVE_BACKEND_URL } from "@/lib/api";

const getBackendUrl = () => {
  if (process.env.NEXT_PUBLIC_BACKEND_URL) return process.env.NEXT_PUBLIC_BACKEND_URL;
  if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
    return "http://localhost:5000";
  }
  return API_BASE || LIVE_BACKEND_URL;
};

const OFFICIAL_STORE_URL = "https://www.amazon.in/shop/2amstudy";

const DEFAULT_CATEGORIES = [
  "All",
  "Tech & Desk Setup",
  "Study Essentials",
  "Books & Learning",
  "Audio & Accessories",
  "Productivity & Tools",
  "Lifestyle & Health",
];

interface AmazonClientPageProps {
  initialPicks?: AmazonPick[];
}

export default function AmazonClientPage({ initialPicks = [] }: AmazonClientPageProps) {
  const [picks, setPicks] = useState<AmazonPick[]>(initialPicks);
  const [loading, setLoading] = useState(initialPicks.length === 0);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchPicks = async () => {
      try {
        const res = await fetch(`${getBackendUrl()}/api/amazon-picks`, {
          signal: AbortSignal.timeout(8000),
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setPicks(data);
          }
        }
      } catch (err) {
        console.warn("Could not fetch Amazon picks from backend:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPicks();
  }, []);

  // Compute available categories dynamically
  const uniqueCategories = [
    "All",
    ...Array.from(new Set(picks.map((p) => p.category).filter(Boolean))),
  ];
  const activeCategories = uniqueCategories.length > 1 ? uniqueCategories : DEFAULT_CATEGORIES;

  const filteredPicks = picks.filter((pick) => {
    const matchesCat = selectedCategory === "All" || pick.category === selectedCategory;
    const matchesSearch = !searchQuery.trim() ||
      pick.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pick.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pick.description && pick.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const featuredCount = picks.filter((p) => p.isFeatured).length;

  const handleImageError = (pickId: string) => {
    setFailedImages((prev) => ({ ...prev, [pickId]: true }));
  };

  return (
    <main className="min-h-screen bg-background relative overflow-hidden pt-12 pb-24 lg:pt-16 lg:pb-32 noise">
      {/* Background ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] rounded-full bg-amber-500/5 blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] rounded-full bg-blue-500/3 blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto px-5 sm:px-8 relative z-10">
        {/* Back Link */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-brand-400 hover:text-white transition-colors group"
          >
            <span className="group-hover:-translate-x-1 transition-transform duration-200">←</span>
            Back to Home
          </Link>
        </div>

        {/* ─── HERO HEADER ─── */}
        <div className="text-center max-w-3xl mx-auto space-y-5 mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/25 bg-amber-500/5 text-amber-400 text-xs font-mono uppercase tracking-widest font-bold backdrop-blur-sm animate-fade-in">
            <span>🛍️</span>
            <span>Nishant&apos;s Picks · Amazon Storefront</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-tight animate-slide-up">
            Gear, Books & <span className="text-gradient">Essentials</span> I Use
          </h1>

          <p className="text-sm sm:text-base text-brand-300 leading-relaxed max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: "0.1s" }}>
            Handpicked recommendations for students, creators, and developers. Every product listed here is something I personally use or find high-value for productivity, late-night study sessions, and desk setups.
          </p>

          {/* Official Storefront Button */}
          <div className="pt-2 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <a
              href={OFFICIAL_STORE_URL}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs sm:text-sm uppercase tracking-wider shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:shadow-[0_0_40px_rgba(245,158,11,0.5)] transition-all duration-300 hover:-translate-y-0.5 group"
            >
              <span>🛍️ Shop My Amazon Feed </span>
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>

        {/* ─── CONTROLS: CATEGORIES & SEARCH ─── */}
        <div className="space-y-4 mb-10">
          {/* Category Chips Scrollbar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-hide -mx-5 px-5 sm:mx-0 sm:px-0">
            {activeCategories.map((cat) => {
              const count = cat === "All" ? picks.length : picks.filter((p) => p.category === cat).length;
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold shrink-0 transition-all duration-300 ${isActive
                    ? "bg-amber-500 text-black border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)] scale-[1.02]"
                    : "bg-white/4 border-white/8 text-brand-300 hover:bg-white/8 hover:text-white"
                    }`}
                >
                  <span>{cat}</span>
                  {count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isActive ? "bg-black/20 text-black" : "bg-white/10 text-brand-400"}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search & Counter Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search tech, books, setup essentials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-950/60 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder-brand-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
              />
              <span className="absolute left-3.5 top-3.5 text-brand-500 text-sm">🔍</span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-3 text-xs text-brand-500 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-brand-400">
              <span>Showing <strong className="text-white font-bold">{filteredPicks.length}</strong> items</span>
              {featuredCount > 0 && (
                <span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  ⭐ {featuredCount} Featured
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ─── PRODUCT GRID ─── */}
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-3 border border-white/5 rounded-3xl bg-zinc-950/30">
            <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
            <p className="text-xs font-mono text-brand-400 animate-pulse">Loading Nishant&apos;s recommendations...</p>
          </div>
        ) : filteredPicks.length === 0 ? (
          <div className="p-12 sm:p-16 text-center border border-white/5 rounded-3xl bg-zinc-950/30 space-y-4 max-w-lg mx-auto">
            <span className="text-5xl block">🛍️</span>
            <h3 className="text-lg font-bold text-white">No products found</h3>
            <p className="text-xs text-brand-400 leading-relaxed">
              {picks.length === 0
                ? "No products have been added to Nishant's Picks yet. Check out the official storefront below."
                : "No products matched your search or category filter. Try clearing the filter."}
            </p>
            <div className="pt-2">
              <a
                href={OFFICIAL_STORE_URL}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-amber-400 transition-colors"
              >
                Browse on Amazon ↗
              </a>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPicks.map((pick) => {
              const isImageBroken = failedImages[pick.id] || !pick.imageUrl;

              return (
                <div
                  key={pick.id}
                  className={`group relative flex flex-col justify-between rounded-3xl border transition-all duration-500 overflow-hidden card-spotlight hover:-translate-y-1 ${pick.isFeatured
                    ? "border-amber-500/40 bg-zinc-950/80 shadow-[0_10px_35px_rgba(245,158,11,0.1)] hover:shadow-[0_20px_50px_rgba(245,158,11,0.2)]"
                    : "border-white/8 bg-zinc-950/60 hover:border-white/20 hover:shadow-2xl"
                    }`}
                >
                  {/* Hover shimmer */}
                  <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer pointer-events-none" />

                  <div className="p-5 sm:p-6 flex flex-col flex-1">
                    {/* Top Category Badge & Featured Tag */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-brand-300 uppercase tracking-wider font-semibold">
                        {pick.category}
                      </span>

                      {pick.isFeatured && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] font-bold text-amber-300 flex items-center gap-1 shadow-sm font-mono">
                          <span>⭐</span>
                          <span>TOP PICK</span>
                        </span>
                      )}
                    </div>

                    {/* Image or Graceful Stylized Fallback */}
                    <a
                      href={pick.affiliateUrl}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      className="w-full aspect-square rounded-2xl bg-white/3 border border-white/5 flex items-center justify-center p-6 mb-5 overflow-hidden group-hover:bg-white/5 transition-colors relative block"
                    >
                      {!isImageBroken ? (
                        <img
                          src={pick.imageUrl}
                          alt={pick.title}
                          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                          onError={() => handleImageError(pick.id)}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 bg-gradient-to-br from-amber-500/5 to-transparent rounded-xl border border-white/5">
                          <span className="text-4xl mb-2">🛍️</span>
                          <span className="text-xs font-mono font-bold text-amber-400/80 uppercase tracking-wider line-clamp-1">
                            {pick.category}
                          </span>
                          <span className="text-[11px] text-brand-400 mt-1 line-clamp-2">
                            {pick.title}
                          </span>
                        </div>
                      )}
                    </a>

                    {/* Title */}
                    <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug mb-2">
                      <a href={pick.affiliateUrl} target="_blank" rel="noopener noreferrer sponsored">
                        {pick.title}
                      </a>
                    </h3>

                    {/* Price if available — omitted cleanly if not specified */}
                    {pick.price ? (
                      <div className="mb-3">
                        <span className="text-sm font-mono font-bold text-amber-400">
                          {pick.price}
                        </span>
                      </div>
                    ) : null}

                    {/* Recommendation note / quote if provided */}
                    {pick.description ? (
                      <p className="text-xs text-brand-400 line-clamp-3 leading-relaxed mb-4 p-3 rounded-2xl bg-white/2 border border-white/5 italic">
                        &ldquo;{pick.description}&rdquo;
                      </p>
                    ) : null}
                  </div>

                  {/* High-Converting CTA Button */}
                  <div className="p-5 sm:p-6 pt-0">
                    <a
                      href={pick.affiliateUrl}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(245,158,11,0.25)] hover:shadow-[0_6px_28px_rgba(245,158,11,0.4)] hover:-translate-y-0.5 group/btn"
                    >
                      <span>View on Amazon</span>
                      <svg className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}


      </div>
    </main>
  );
}
