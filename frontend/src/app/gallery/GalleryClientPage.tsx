"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import AuroraBackground from "@/components/AuroraBackground";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { auth, isConfigured } from "@/lib/firebase";
import type { GalleryPhoto } from "@/types";
import { API_BASE } from "@/lib/api";

const CATEGORIES = ["All", "Daily Moments", "School", "College", "Achievements"];

const MOCK_PHOTOS: GalleryPhoto[] = [
  {
    id: "mock1",
    imageUrl: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=800",
    imagePath: "",
    title: "Hackathon Brainstorming Session",
    story: "Collaborating with friends during our annual college hackathon. We stayed up until 3 AM drafting the architecture and drinking coffee. It was intense, tiring, but incredibly rewarding.",
    date: "2025-05-15",
    category: "College",
    createdAt: Date.now()
  },
  {
    id: "mock2",
    imageUrl: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=800",
    imagePath: "",
    title: "First Day at High School",
    story: "Remembering the early days of high school. Meeting my favorite teachers and setting up the foundations for computer science. A major turning point in my academic journey.",
    date: "2024-04-10",
    category: "School",
    createdAt: Date.now() - 1000
  },
  {
    id: "mock3",
    imageUrl: "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=800",
    imagePath: "",
    title: "Founder Keynote Session",
    story: "Presenting 2 AM Study at the regional EdTech forum. Proud moment to share our vision with 500+ attendees and discuss the future of digital learning platforms.",
    date: "2025-06-20",
    category: "Achievements",
    createdAt: Date.now() - 2000
  },
  {
    id: "mock4",
    imageUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=800",
    imagePath: "",
    title: "Sunrise Study Routine",
    story: "A quiet, peaceful moment captured during an early morning study session. Building consistency and self-discipline one morning at a time before the rest of the world wakes up.",
    date: "2025-06-01",
    category: "Daily Moments",
    createdAt: Date.now() - 3000
  }
];

export default function GalleryClientPage() {
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Monitor Firebase Auth status
  useEffect(() => {
    if (!isConfigured || !auth) {
      setAuthChecking(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      setAuthChecking(false);
    });

    return () => unsubscribe();
  }, []);

  // Open native fullscreen on the entire page
  const openFullscreen = useCallback(() => {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
  }, []);

  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  // Fetch photos from backend API
  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const backendUrl = API_BASE || "http://localhost:5000";
        const res = await fetch(`${backendUrl}/api/gallery`);
        if (!res.ok) {
          throw new Error("Failed to fetch gallery photos");
        }
        const fetched = await res.json();
        setPhotos(fetched);
      } catch (err) {
        console.error("Failed to load gallery photos:", err);
        // Fallback to mocks on error
        setPhotos(MOCK_PHOTOS);
      } finally {
        setLoading(false);
      }
    };

    fetchPhotos();
  }, []);

  // Filtered photos matching category & search query
  const filteredPhotos = photos.filter((photo) => {
    const matchesCategory =
      selectedCategory === "All" || photo.category === selectedCategory;
    const matchesSearch =
      photo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      photo.story.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Lightbox handlers
  const handlePrev = useCallback(() => {
    if (lightboxIndex === null || filteredPhotos.length === 0) return;
    setLightboxIndex((prevIndex) =>
      prevIndex === null ? 0 : (prevIndex - 1 + filteredPhotos.length) % filteredPhotos.length
    );
  }, [lightboxIndex, filteredPhotos]);

  const handleNext = useCallback(() => {
    if (lightboxIndex === null || filteredPhotos.length === 0) return;
    setLightboxIndex((prevIndex) =>
      prevIndex === null ? 0 : (prevIndex + 1) % filteredPhotos.length
    );
  }, [lightboxIndex, filteredPhotos]);

  const handleClose = useCallback(() => {
    setLightboxIndex(null);
    exitFullscreen();
  }, [exitFullscreen]);

  const touchStartXRef = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    touchStartXRef.current = null;
    if (Math.abs(deltaX) < 40) return; // too small, ignore
    if (deltaX < 0) handleNext(); // swipe left → next
    else handlePrev();             // swipe right → prev
  }, [handleNext, handlePrev]);

  // Keyboard navigation
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, handleClose, handlePrev, handleNext]);

  // Format dates
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const isDark = typeof document !== "undefined"
    ? !document.documentElement.classList.contains("light")
    : true;

  return (
    <div className={`min-h-screen pb-24 relative overflow-hidden transition-colors duration-300 ${isDark ? "bg-background" : "bg-slate-50"}`}>

      {/* ── JSON-LD ImageGallery Schema — auto-built from loaded photos ── */}
      {photos.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ImageGallery",
              name: "Nishant Kumar — Gallery",
              description: "Photo gallery of Nishant Kumar (hiiinishant) — daily moments, school days, college life, achievements, and the journey building 2 AM Study.",
              url: "https://hiiinishant.com/gallery",
              author: {
                "@type": "Person",
                name: "Nishant Kumar",
                url: "https://hiiinishant.com",
                sameAs: ["https://instagram.com/hiiinishant"],
              },
              image: photos.map((photo) => ({
                "@type": "ImageObject",
                name: photo.title,
                description: photo.story,
                contentUrl: photo.imageUrl,
                url: photo.imageUrl,
                datePublished: photo.date,
                keywords: `Nishant Kumar, hiiinishant, ${photo.category}, ${photo.title}`,
                author: {
                  "@type": "Person",
                  name: "Nishant Kumar",
                },
                copyrightHolder: {
                  "@type": "Person",
                  name: "Nishant Kumar",
                },
                representativeOfPage: false,
              })),
            }),
          }}
        />
      )}

      {/* Dynamic Aurora & Grid background effects (same as homepage) */}
      {/* Dynamic Aurora background without grid lines */}
      <AuroraBackground />

      <PageHeader
        label="Nishant's Gallery"
        title={
          <>
            Memories & <span className="text-gradient">Milestones</span>
          </>
        }
        description="A curated visual log of daily moments, academic highlights, startup achievements, and travel blogs."
      />

      {/* ── Auth Checking Loading State ── */}
      {authChecking ? (
        <div className="max-w-md mx-auto px-5 py-24 text-center">
          <div className="w-10 h-10 border-3 border-accent/20 border-t-accent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs font-mono text-brand-400">Verifying access...</p>
        </div>
      ) : (!authUser || !authUser.emailVerified) ? (
        /* ── Login / Signup Required Wall ── */
        <div className="max-w-xl mx-auto px-5 sm:px-8 mt-10">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-8 sm:p-10 text-center shadow-2xl relative overflow-hidden">
            {/* Lock Icon */}
            <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/30 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
              <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-accent/10 border border-accent/20 text-accent mb-4 font-mono">
              🔒 Members-Only Gallery
            </span>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 tracking-tight">
              Log In to View Nishant&apos;s Gallery
            </h2>
            <p className="text-brand-300 text-sm sm:text-base leading-relaxed mb-8">
              Nishant&apos;s personal photo memories, college milestones, and behind-the-scenes stories are available exclusively for logged-in members.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
              <Link
                href="/login?redirect=/gallery"
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-accent hover:bg-accent-hover text-black font-bold text-sm transition-all shadow-[0_0_25px_rgba(245,158,11,0.25)] hover:scale-[1.02]"
              >
                Log In to View Gallery →
              </Link>
              <Link
                href="/login?mode=signup&redirect=/gallery"
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm transition-all hover:scale-[1.02]"
              >
                Create Free Account
              </Link>
            </div>

            <div className="pt-6 border-t border-white/5 flex items-center justify-center gap-4 text-xs font-mono text-brand-400">
              <span>✨ 100% Free</span>
              <span className="text-white/20">•</span>
              <span>⚡ Instant Access</span>
              <span className="text-white/20">•</span>
              <span>📸 Full HD Memories</span>
            </div>
          </div>
        </div>
      ) : (
        /* ── Logged-in Member Gallery View ── */
        <div className="max-w-6xl mx-auto px-5 sm:px-8 mt-12">
          {/* Firestore Alert if not configured */}
          {!isConfigured && (
            <div className={`mb-8 p-4 rounded-xl border font-mono text-xs text-center ${isDark ? "bg-amber-950/20 border-amber-500/30 text-amber-300" : "bg-amber-50 border-amber-200 text-amber-800"}`}>
              ⚠️ <strong>Admin Notice:</strong> Firebase API keys are not configured. Currently rendering sample memories. Please set up your `.env.local` to sync with Firestore.
            </div>
          )}

        {/* Filters and Search Panel */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          {/* Categories Tab list */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-hide font-mono">
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setLightboxIndex(null);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? "bg-accent text-black font-bold shadow-[0_0_15px_rgba(245,158,11,0.25)]"
                      : isDark
                      ? "text-brand-300 hover:text-white bg-white/3 border border-white/5 hover:bg-white/5"
                      : "text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80 font-mono">
            <input
              type="text"
              placeholder="Search memories..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setLightboxIndex(null);
              }}
              className={`w-full rounded-xl px-4 py-2.5 pl-10 text-xs focus:outline-none focus:ring-1 transition-all ${
                isDark
                  ? "bg-zinc-950/40 border border-white/5 text-white placeholder-brand-600 focus:border-accent/40 focus:ring-accent/20"
                  : "bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-accent/50 focus:ring-accent/30"
              }`}
            />
            <span className="absolute left-3.5 top-3 text-[10px] text-brand-500 select-none">
              🔍
            </span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className={`absolute right-3 top-2 text-[9px] px-2 py-0.5 rounded cursor-pointer transition-colors ${
                  isDark ? "bg-white/5 hover:bg-white/10 text-brand-400" : "bg-slate-100 hover:bg-slate-200 text-slate-500"
                }`}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 font-mono text-xs">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mb-4" />
            <span className={isDark ? "text-brand-400" : "text-slate-500"}>SYNCING MEMORIES GALLERY...</span>
          </div>
        ) : (
          <>
            {/* Grid Layout */}
            {filteredPhotos.length === 0 ? (
              <div className={`text-center py-20 rounded-2xl border border-dashed font-mono ${isDark ? "border-white/5 bg-zinc-950/10" : "border-slate-200 bg-white"}`}>
                <p className={`text-xs ${isDark ? "text-brand-500" : "text-slate-400"}`}>NO PHOTOS FOUND IN THIS CATEGORY.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPhotos.map((photo, index) => (
                  <div
                    key={photo.id}
                    onClick={() => { setLightboxIndex(index); openFullscreen(); }}
                    className={`group cursor-pointer rounded-2xl overflow-hidden border transition-all duration-300 hover:-translate-y-1 ${
                      isDark
                        ? "bg-zinc-950/30 border-white/5 hover:border-white/10 hover:bg-zinc-950/50"
                        : "bg-white border-slate-200/80 hover:border-slate-300 shadow-sm hover:shadow-md"
                    }`}
                  >
                    {/* Image Area with 4 Protections */}
                    <div
                      className="aspect-[4/3] overflow-hidden relative bg-black/10 select-none"
                      onContextMenu={(e) => e.preventDefault()}
                    >
                      <img
                        src={photo.imageUrl}
                        alt={`${photo.title} — Nishant Kumar (hiiinishant) ${photo.category}`}
                        title={photo.title}
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                        onDragStart={(e) => e.preventDefault()}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 select-none pointer-events-none"
                      />

                      {/* Transparent Protection Overlay */}
                      <div
                        className="absolute inset-0 z-10 select-none"
                        onContextMenu={(e) => e.preventDefault()}
                      />

                      {/* Visible Watermark — Hii Nishant */}
                      <div className="absolute bottom-2.5 right-2.5 z-20 pointer-events-none select-none flex items-center gap-1 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-mono font-semibold text-white/80 tracking-wider border border-white/10 shadow-sm">
                        <span className="text-accent text-[9px]">✦</span>
                        <span>Hii Nishant</span>
                      </div>

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 z-10 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <span className="text-white bg-black/60 px-4 py-2 rounded-full text-xs font-mono border border-white/10 shadow-lg scale-90 group-hover:scale-100 transition-transform">
                          Expand View 🔎
                        </span>
                      </div>
                      {/* Tag Badge */}
                      <span className="absolute top-3 left-3 z-20 bg-black/75 backdrop-blur-md border border-white/10 text-accent text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg pointer-events-none select-none">
                        {photo.category}
                      </span>
                    </div>

                    {/* Metadata Content */}
                    <div className="p-5 space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className={isDark ? "text-brand-400" : "text-slate-500"}>
                          {formatDate(photo.date)}
                        </span>
                      </div>
                      <h3 className={`text-base font-bold tracking-tight leading-snug line-clamp-1 transition-colors ${
                        isDark ? "text-white group-hover:text-accent" : "text-slate-900 group-hover:text-accent-hover"
                      }`}>
                        {photo.title}
                      </h3>
                      <p className={`text-xs leading-relaxed line-clamp-3 ${
                        isDark ? "text-brand-300" : "text-slate-600"
                      }`}>
                        {photo.story}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        {/* Fullscreen Lightbox Overlay */}
      {lightboxIndex !== null && filteredPhotos[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black flex flex-col select-none"
          style={{ height: "100dvh" }}
          onClick={handleClose}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* ── Top Bar ── */}
          <div
            className="shrink-0 flex justify-between items-center px-4 md:px-8 py-3 bg-black/80 backdrop-blur-md w-full border-b border-white/5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="text-accent font-bold uppercase tracking-widest text-[10px] bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg font-mono">
                {filteredPhotos[lightboxIndex].category}
              </span>
              <span className="text-brand-400 text-xs hidden sm:block font-mono">
                {formatDate(filteredPhotos[lightboxIndex].date)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-brand-500 text-xs font-mono mr-2">
                {lightboxIndex + 1} / {filteredPhotos.length}
              </span>
              {/* Close */}
              <button
                onClick={handleClose}
                className="w-9 h-9 rounded-full bg-white/8 hover:bg-red-500/30 hover:text-red-400 border border-white/10 flex items-center justify-center text-white text-base transition-all cursor-pointer"
                title="Close (Esc)"
              >
                ✕
              </button>
            </div>
          </div>

          {/* ── Image with 4 Protections — fills ALL remaining height ── */}
          <div
            className="flex-1 relative flex items-center justify-center overflow-hidden px-12 md:px-20 py-4 select-none"
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
          >
            <img
              key={filteredPhotos[lightboxIndex].id}
              src={filteredPhotos[lightboxIndex].imageUrl}
              alt={`${filteredPhotos[lightboxIndex].title} — Nishant Kumar (hiiinishant) ${filteredPhotos[lightboxIndex].category}`}
              title={filteredPhotos[lightboxIndex].title}
              decoding="async"
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
              className="max-h-full max-w-full w-auto h-auto object-contain select-none pointer-events-none"
              style={{ display: "block" }}
            />

            {/* Transparent Protection Overlay */}
            <div
              className="absolute inset-0 z-20 pointer-events-auto"
              onContextMenu={(e) => e.preventDefault()}
              onClick={(e) => e.stopPropagation()}
            />

            {/* Visible Watermark — Hii Nishant */}
            <div className="absolute bottom-6 right-6 md:right-24 z-30 pointer-events-none select-none flex items-center gap-1.5 bg-black/65 backdrop-blur-md px-3.5 py-1.5 rounded-xl text-xs font-mono font-semibold text-white/90 tracking-widest border border-white/15 shadow-2xl">
              <span className="text-accent">✦</span>
              <span>Hii Nishant</span>
            </div>

            {/* Left arrow */}
            <button
              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-40 w-11 h-11 rounded-full bg-black/60 hover:bg-accent hover:text-black border border-white/15 flex items-center justify-center text-white text-sm transition-all cursor-pointer hover:scale-110 active:scale-95 shadow-2xl"
              title="Previous (← Arrow)"
            >
              ◀
            </button>

            {/* Right arrow */}
            <button
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-40 w-11 h-11 rounded-full bg-black/60 hover:bg-accent hover:text-black border border-white/15 flex items-center justify-center text-white text-sm transition-all cursor-pointer hover:scale-110 active:scale-95 shadow-2xl"
              title="Next (→ Arrow)"
            >
              ▶
            </button>
          </div>

          {/* ── Bottom Caption & Story ── */}
          <div
            className="shrink-0 bg-black/90 backdrop-blur-xl border-t border-white/10 px-5 sm:px-8 py-4 max-h-[38vh] overflow-y-auto text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-w-3xl mx-auto space-y-2">
              <h2 className="text-base sm:text-lg font-bold text-white leading-snug">
                {filteredPhotos[lightboxIndex].title}
              </h2>
              {filteredPhotos[lightboxIndex].story && (
                <p className="text-xs sm:text-sm text-brand-200 leading-relaxed font-normal whitespace-pre-line">
                  {filteredPhotos[lightboxIndex].story}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
        </div>
      )}
    </div>
  );
}
