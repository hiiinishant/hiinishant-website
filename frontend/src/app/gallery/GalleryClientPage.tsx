"use client";

import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/layout/PageHeader";
import { isConfigured } from "@/lib/firebase";
import type { GalleryPhoto } from "@/types";

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
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Fetch photos from backend API
  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
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
  }, []);

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
      {/* Background decoration */}
      <div className={`absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[130px] pointer-events-none -z-10 transition-colors duration-300 ${isDark ? "bg-accent/3" : "bg-accent/10"}`} />
      <div className={`absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none -z-10 transition-colors duration-300 ${isDark ? "bg-blue-500/2" : "bg-blue-500/5"}`} />

      <PageHeader
        label="Nishant's Gallery"
        title={
          <>
            Memories & <span className="text-gradient">Milestones</span>
          </>
        }
        description="A curated visual log of daily moments, academic highlights, startup achievements, and travel blogs."
      />

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
          <div className="flex gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none font-mono">
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
                    onClick={() => setLightboxIndex(index)}
                    className={`group cursor-pointer rounded-2xl overflow-hidden border transition-all duration-300 hover:-translate-y-1 ${
                      isDark
                        ? "bg-zinc-950/30 border-white/5 hover:border-white/10 hover:bg-zinc-950/50"
                        : "bg-white border-slate-200/80 hover:border-slate-300 shadow-sm hover:shadow-md"
                    }`}
                  >
                    {/* Image Area */}
                    <div className="aspect-[4/3] overflow-hidden relative bg-black/10">
                      <img
                        src={photo.imageUrl}
                        alt={photo.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white bg-black/60 px-4 py-2 rounded-full text-xs font-mono border border-white/10 shadow-lg scale-90 group-hover:scale-100 transition-transform">
                          Expand View 🔎
                        </span>
                      </div>
                      {/* Tag Badge */}
                      <span className="absolute top-3 left-3 bg-black/75 backdrop-blur-md border border-white/10 text-accent text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg">
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
      </div>

      {/* Fullscreen Lightbox Overlay */}
      {lightboxIndex !== null && filteredPhotos[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/96 backdrop-blur-md"
          onClick={handleClose}
        >
          {/* Fixed top bar – close + counter */}
          <div className="fixed top-0 left-0 right-0 z-20 flex justify-between items-center px-4 md:px-8 py-4 max-w-6xl mx-auto font-mono text-white text-xs">
            <span className="text-accent font-bold uppercase tracking-widest text-[10px] bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
              {filteredPhotos[lightboxIndex].category}
            </span>
            <div className="flex items-center gap-4">
              <span className="text-brand-400">
                {lightboxIndex + 1} / {filteredPhotos.length}
              </span>
              <button
                onClick={handleClose}
                className="w-9 h-9 rounded-full bg-white/8 hover:bg-white/15 border border-white/10 flex items-center justify-center text-base transition-all cursor-pointer"
                title="Close (Esc)"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Fixed left / right nav arrows */}
          <button
            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
            className="fixed left-3 md:left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/50 hover:bg-black/70 border border-white/10 flex items-center justify-center text-white text-base transition-all cursor-pointer hover:scale-105 active:scale-95"
            title="Previous (← Arrow)"
          >
            ◀
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
            className="fixed right-3 md:right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/50 hover:bg-black/70 border border-white/10 flex items-center justify-center text-white text-base transition-all cursor-pointer hover:scale-105 active:scale-95"
            title="Next (→ Arrow)"
          >
            ▶
          </button>

          {/* Scrollable body – image + full caption */}
          <div
            className="h-full overflow-y-auto pt-16 pb-10 px-4 md:px-16 flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image */}
            <div className="w-full max-w-4xl flex justify-center mt-4">
              <img
                src={filteredPhotos[lightboxIndex].imageUrl}
                alt={filteredPhotos[lightboxIndex].title}
                className="max-h-[52vh] md:max-h-[58vh] w-auto h-auto object-contain rounded-2xl shadow-2xl border border-white/10"
              />
            </div>

            {/* Caption — always fully visible, never clipped */}
            <div className="w-full max-w-2xl mx-auto text-center mt-8 space-y-3 select-text px-2">
              <span className="inline-block text-[10px] font-mono text-accent uppercase tracking-widest font-bold bg-accent/10 border border-accent/20 px-3 py-1 rounded-full">
                {formatDate(filteredPhotos[lightboxIndex].date)}
              </span>
              <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight leading-snug">
                {filteredPhotos[lightboxIndex].title}
              </h2>
              <p className="text-sm md:text-base text-brand-300 leading-relaxed font-light">
                {filteredPhotos[lightboxIndex].story}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
