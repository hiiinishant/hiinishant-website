"use client";

import { useState, useEffect } from "react";
import type { AmazonPick, StudyPick } from "@/types";
import { API_BASE, LIVE_BACKEND_URL } from "@/lib/api";

const getBackendUrl = () => {
  if (process.env.NEXT_PUBLIC_BACKEND_URL) return process.env.NEXT_PUBLIC_BACKEND_URL;
  if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
    return "http://localhost:5000";
  }
  return API_BASE || LIVE_BACKEND_URL;
};

const OFFICIAL_STORE_URL = "https://www.amazon.in/shop/2amstudy";
const STUDY_STORE_URL = "https://2amstudy.online";

export interface UnifiedPick {
  id: string;
  title: string;
  category: string;
  url: string;
  imageUrl?: string;
  price?: string;
  salePrice?: string;
  availability?: string;
  description?: string;
  isFeatured?: boolean;
  inStock?: boolean;
  source: "amazon" | "2amstudy";
  asin?: string;
  createdAt?: string;
}

const DEFAULT_CATEGORIES = [
  "All",
  "2 AM Study",
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
  const [picks, setPicks] = useState<UnifiedPick[]>(() =>
    initialPicks.map((p) => ({
      id: p.id,
      title: p.title,
      category: p.category || "Tech & Desk Setup",
      url: p.affiliateUrl,
      imageUrl: p.imageUrl,
      price: p.price,
      description: p.description,
      isFeatured: p.isFeatured,
      inStock: p.inStock !== false,
      source: "amazon" as const,
      asin: p.asin,
      createdAt: p.createdAt,
    }))
  );
  const [loading, setLoading] = useState(initialPicks.length === 0);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 9;

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const fetchAllPicks = async () => {
      try {
        setLoading(true);
        const backend = getBackendUrl();

        const [amazonRes, studyRes] = await Promise.allSettled([
          fetch(`${backend}/api/amazon-picks`, { signal: controller.signal }),
          fetch(`${backend}/api/study-picks`, { signal: controller.signal }),
        ]);

        if (!isMounted) return;

        const combined: UnifiedPick[] = [];

        // Parse Amazon Picks
        if (amazonRes.status === "fulfilled" && amazonRes.value.ok) {
          const data: AmazonPick[] = await amazonRes.value.json();
          if (Array.isArray(data)) {
            data.forEach((p) => {
              combined.push({
                id: `amz-${p.id}`,
                title: p.title,
                category: p.category || "Tech & Desk Setup",
                url: p.affiliateUrl,
                imageUrl: p.imageUrl,
                price: p.price,
                description: p.description,
                isFeatured: p.isFeatured,
                inStock: p.inStock !== false,
                source: "amazon",
                asin: p.asin,
                createdAt: p.createdAt,
              });
            });
          }
        }

        // Parse 2 AM Study Picks
        if (studyRes.status === "fulfilled" && studyRes.value.ok) {
          const data: StudyPick[] = await studyRes.value.json();
          if (Array.isArray(data)) {
            data.forEach((p) => {
              const cleanDescription =
                p.description &&
                !p.description.toLowerCase().includes("official 2 am study")
                  ? p.description
                  : "";
              const cleanPrice = p.price === "₹199" ? "" : p.price || "";

              combined.push({
                id: `study-${p.id}`,
                title: p.title,
                category: p.category || "2 AM Study",
                url: p.productUrl,
                imageUrl: p.imageUrl,
                price: cleanPrice,
                salePrice: p.salePrice,
                availability: p.availability || "In Stock",
                description: cleanDescription,
                isFeatured: p.isFeatured,
                source: "2amstudy",
                createdAt: p.createdAt,
              });
            });
          }
        }

        if (combined.length > 0 && isMounted) {
          // Sort: featured first, then latest
          combined.sort((a, b) => {
            if (a.isFeatured && !b.isFeatured) return -1;
            if (!a.isFeatured && b.isFeatured) return 1;
            const timeA = new Date(a.createdAt || 0).getTime();
            const timeB = new Date(b.createdAt || 0).getTime();
            return timeB - timeA;
          });
          setPicks(combined);
        }
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.warn("Could not fetch product picks:", err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAllPicks();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  // Dynamic Categories computation
  const rawCategories = Array.from(new Set(picks.map((p) => p.category).filter(Boolean)));
  const orderedCategories = ["All"];
  if (rawCategories.includes("2 AM Study") || picks.some((p) => p.source === "2amstudy")) {
    orderedCategories.push("2 AM Study");
  }
  rawCategories.forEach((c) => {
    if (c !== "2 AM Study" && !orderedCategories.includes(c)) {
      orderedCategories.push(c);
    }
  });

  const activeCategories = orderedCategories.length > 1 ? orderedCategories : DEFAULT_CATEGORIES;

  const filteredPicks = picks.filter((pick) => {
    const matchesCat =
      selectedCategory === "All" ||
      pick.category === selectedCategory ||
      (selectedCategory === "2 AM Study" && pick.source === "2amstudy");

    const matchesSearch =
      !searchQuery.trim() ||
      pick.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pick.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pick.source === "2amstudy" && "2 am study".includes(searchQuery.toLowerCase())) ||
      (pick.description && pick.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCat && matchesSearch;
  });

  // Pagination
  const totalItems = filteredPicks.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageEnd = Math.min(pageStart + PAGE_SIZE, totalItems);
  const pagedPicks = filteredPicks.slice(pageStart, pageEnd);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Reset to page 1 when filter/search changes
  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    setCurrentPage(1);
  };

  const handleImageError = (pickId: string) => {
    setFailedImages((prev) => ({ ...prev, [pickId]: true }));
  };

  return (
    <main className="min-h-screen bg-background relative overflow-hidden pt-6 pb-24 lg:pt-8 lg:pb-32 noise">
      {/* Background ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] rounded-full bg-amber-500/5 blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] rounded-full bg-blue-500/3 blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto px-5 sm:px-8 relative z-10">
        {/* ─── HERO HEADER ─── */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-mono tracking-widest uppercase text-amber-400 font-semibold animate-fade-in">
            <span>Nishant&apos;s Picks</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-tight animate-slide-up">
            Gear, Books & <span className="text-gradient">Essentials</span> I Use
          </h1>

          <p className="text-sm sm:text-base text-brand-300 leading-relaxed max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: "0.1s" }}>
            Official 2 AM Study learning materials and handpicked recommendations for students, creators, and developers. Everything here is personally curated for late-night productivity, study sessions, and high-performance desk setups.
          </p>

          {/* Action Buttons: 2 AM Study Store & Amazon Storefront */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <a
              href={STUDY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs sm:text-sm uppercase tracking-wider shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:shadow-[0_0_40px_rgba(245,158,11,0.5)] transition-all duration-300 hover:-translate-y-0.5 group"
            >
              <span>📚 2 AM Study Store</span>
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>

            <a
              href={OFFICIAL_STORE_URL}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs sm:text-sm uppercase tracking-wider transition-all duration-300 hover:-translate-y-0.5 group"
            >
              <span>🛍️ Amazon Storefront</span>
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
              const count =
                cat === "All"
                  ? picks.length
                  : cat === "2 AM Study"
                  ? picks.filter((p) => p.category === "2 AM Study" || p.source === "2amstudy").length
                  : picks.filter((p) => p.category === cat).length;

              const isActive = selectedCategory === cat;
              const isStudyCat = cat === "2 AM Study";

              return (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold shrink-0 transition-all duration-300 ${
                    isActive
                      ? "bg-amber-500 text-black border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)] scale-[1.02]"
                      : isStudyCat
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20"
                      : "bg-white/4 border-white/8 text-brand-300 hover:bg-white/8 hover:text-white"
                  }`}
                >
                  {isStudyCat && <span>📚</span>}
                  <span>{cat}</span>
                  {count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isActive
                          ? "bg-black/20 text-black font-bold"
                          : isStudyCat
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-white/10 text-brand-400"
                      }`}
                    >
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
                placeholder="Search 2 AM Study gear, books, tech essentials..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full bg-zinc-950/60 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder-brand-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
              />
              <span className="absolute left-3.5 top-3.5 text-brand-500 text-sm">🔍</span>
              {searchQuery && (
                <button
                  onClick={() => handleSearchChange("")}
                  className="absolute right-3.5 top-3 text-xs text-brand-500 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

          </div>
        </div>

        {/* ─── PRODUCT GRID ─── */}
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-3 border border-white/5 rounded-3xl bg-zinc-950/30">
            <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
            <p className="text-xs font-mono text-brand-400 animate-pulse">
              Loading curated recommendations & 2 AM Study gear...
            </p>
          </div>
        ) : filteredPicks.length === 0 ? (
          <div className="p-12 sm:p-16 text-center border border-white/5 rounded-3xl bg-zinc-950/30 space-y-4 max-w-lg mx-auto">
            <span className="text-5xl block">🛍️</span>
            <h3 className="text-lg font-bold text-white">No products found</h3>
            <p className="text-xs text-brand-400 leading-relaxed">
              {picks.length === 0
                ? "No products have been added yet. Explore the official storefronts below."
                : "No products matched your search or category filter. Try clearing the filter."}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <a
                href={STUDY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-colors"
              >
                2 AM Study Store ↗
              </a>
              <a
                href={OFFICIAL_STORE_URL}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-amber-400 transition-colors"
              >
                Amazon Store ↗
              </a>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-6">
            {pagedPicks.map((pick) => {
              const isImageBroken = failedImages[pick.id] || !pick.imageUrl;
              const isStudy = pick.source === "2amstudy";

              return (
                <div
                  key={pick.id}
                  className={`group relative flex flex-col justify-between rounded-xl lg:rounded-2xl border transition-all duration-300 overflow-hidden shadow-lg hover:-translate-y-1 ${
                    pick.isFeatured
                      ? "border-amber-500/40 bg-zinc-900/90 shadow-[0_10px_30px_rgba(245,158,11,0.15)] hover:border-amber-400/60"
                      : "border-white/10 bg-zinc-900/70 hover:border-amber-500/30 hover:shadow-[0_15px_30px_rgba(0,0,0,0.6)]"
                  }`}
                >
                  {/* Top Image Showcase Banner (h-44 profound-impact style) */}
                  <a
                    href={pick.url}
                    target="_blank"
                    rel={isStudy ? "noopener noreferrer" : "noopener noreferrer sponsored"}
                    className="relative flex items-center justify-center h-44 sm:h-48 overflow-hidden bg-zinc-950/80 rounded-t-xl lg:rounded-t-2xl border-b border-white/8 p-3 block"
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
                      <div className="w-full h-full flex flex-col items-center justify-center text-center p-3 bg-zinc-900/50 rounded-lg">
                        <span className="text-3xl mb-1">{isStudy ? "📚" : "🛍️"}</span>
                        <span className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider line-clamp-1">
                          {isStudy ? "2 AM Study" : pick.category}
                        </span>
                      </div>
                    )}

                    {/* Top Floating Category Badge */}
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-black/75 backdrop-blur-md border border-white/15 text-[10px] font-mono text-brand-200 uppercase tracking-wider font-semibold shadow-sm">
                      {isStudy ? "2 AM Study" : pick.category}
                    </span>

                    {/* Top Right Status Tag */}
                    {pick.isFeatured ? (
                      <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-amber-500/90 text-black text-[9px] font-bold flex items-center gap-1 shadow-sm font-mono uppercase tracking-wider">
                        <span>⭐ TOP PICK</span>
                      </span>
                    ) : (pick.availability === "Out of Stock" || pick.inStock === false) ? (
                      <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-red-500/90 text-white text-[9px] font-bold flex items-center gap-1 shadow-sm font-mono uppercase tracking-wider">
                        <span>OUT OF STOCK</span>
                      </span>
                    ) : null}
                  </a>

                  {/* Body Text Section */}
                  <div className="p-4 sm:p-5 flex flex-col justify-between flex-1">
                    <div>
                      {/* Title (2 lines clamp) */}
                      <h3 className="font-bold text-base sm:text-lg leading-6 line-clamp-2 mb-2 text-white group-hover:text-amber-300 transition-colors">
                        <a
                          href={pick.url}
                          target="_blank"
                          rel={isStudy ? "noopener noreferrer" : "noopener noreferrer sponsored"}
                        >
                          {pick.title}
                        </a>
                      </h3>

                      {/* Description (2 lines clamp) */}
                      {pick.description ? (
                        <p className="text-sm text-brand-400 leading-5 line-clamp-2 mb-3">
                          {pick.description}
                        </p>
                      ) : (
                        <p className="text-sm text-brand-400 leading-5 line-clamp-2 mb-3">
                          Curated recommendation from Nishant Kumar&apos;s personal collection.
                        </p>
                      )}
                    </div>

                    {/* Footer Row: Price + CTA Button */}
                    <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/8 mt-auto">
                      <div className="flex items-baseline gap-1.5">
                        {pick.salePrice ? (
                          <>
                            <span className="text-base font-bold font-mono text-amber-400">
                              {pick.salePrice}
                            </span>
                            {pick.price && (
                              <span className="text-xs font-mono text-brand-500 line-through">
                                {pick.price}
                              </span>
                            )}
                          </>
                        ) : pick.price ? (
                          <span className="text-base font-bold font-mono text-amber-400">
                            {pick.price}
                          </span>
                        ) : (
                          <span className="text-xs font-mono text-brand-400 font-medium">
                            Check Price
                          </span>
                        )}
                      </div>

                      <a
                        href={pick.url}
                        target="_blank"
                        rel={isStudy ? "noopener noreferrer" : "noopener noreferrer sponsored"}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-[0_2px_12px_rgba(245,158,11,0.25)] hover:shadow-[0_4px_18px_rgba(245,158,11,0.4)] hover:-translate-y-0.5 shrink-0"
                      >
                        <span>{isStudy ? "Store" : "Amazon"}</span>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ─── PAGINATION BAR ─── */}
        {!loading && totalItems > 0 && (
          <div className="mt-10 pt-6 border-t border-white/10 mb-6">
            <div className="flex justify-between items-center text-sm text-brand-400">
              {/* Left: Page nav */}
              {totalPages > 1 ? (
                <nav className="flex items-center gap-1.5" aria-label="Pagination">
                  {/* Prev */}
                  <button
                    onClick={() => goToPage(safePage - 1)}
                    disabled={safePage === 1}
                    className="px-3 py-1.5 rounded bg-white/5 border border-white/10 text-brand-300 hover:text-white hover:bg-white/10 hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium"
                    aria-label="Previous page"
                  >
                    ← Prev
                  </button>

                  {/* Page Numbers */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                    .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, idx) =>
                      p === "..." ? (
                        <span
                          key={`ellipsis-${idx}`}
                          className="px-2 py-1 text-sm text-brand-500"
                        >
                          &hellip;
                        </span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => goToPage(p as number)}
                          aria-current={p === safePage ? "page" : undefined}
                          className={`px-3 py-1.5 rounded text-sm font-medium transition-all duration-200 ${
                            p === safePage
                              ? "bg-amber-500 text-black font-bold shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                              : "bg-white/5 border border-white/10 text-brand-300 hover:text-white hover:bg-white/10 hover:border-white/20"
                          }`}
                        >
                          {p}
                        </button>
                      )
                    )}

                  {/* Next */}
                  <button
                    onClick={() => goToPage(safePage + 1)}
                    disabled={safePage === totalPages}
                    className="px-3 py-1.5 rounded bg-white/5 border border-white/10 text-brand-300 hover:text-white hover:bg-white/10 hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium"
                    aria-label="Next page"
                  >
                    Next →
                  </button>
                </nav>
              ) : (
                <div />
              )}

              {/* Right: Results count */}
              <p className="text-sm text-brand-400">
                Showing{" "}
                <span className="font-semibold text-white">{pageStart + 1}</span>
                {" "}to{" "}
                <span className="font-semibold text-white">{pageEnd}</span>
                {" "}of{" "}
                <span className="font-semibold text-white">{totalItems}</span>
                {" "}results
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}


