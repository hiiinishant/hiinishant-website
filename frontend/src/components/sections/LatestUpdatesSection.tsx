"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  latestUpdates,
  categories,
  type UpdateItem,
} from "@/data/updates";

/* ────────────────────────────────────────────
   ICON COMPONENTS
   ──────────────────────────────────────────── */

function PlayIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function TrophyIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0116.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.04 6.04 0 01-2.77.854m0 0a6.04 6.04 0 01-2.77-.854" />
    </svg>
  );
}

function MegaphoneIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" />
    </svg>
  );
}

function GridIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  );
}

function ExternalIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}

function InstagramIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  grid: GridIcon,
  play: PlayIcon,
  youtube: PlayIcon,
  instagram: InstagramIcon,
  trophy: TrophyIcon,
  megaphone: MegaphoneIcon,
};

const categoryColors: Record<UpdateItem["category"], string> = {
  video: "from-red-500/20 to-red-600/5 border-red-500/20 text-red-400",
  instagram: "from-[#E1306C]/20 to-[#E1306C]/5 border-[#E1306C]/20 text-[#E1306C]",
};

const categoryIconColors: Record<UpdateItem["category"], string> = {
  video: "bg-red-500/10 text-red-400 group-hover:bg-red-500/20",
  instagram: "bg-[#E1306C]/10 text-[#E1306C] group-hover:bg-[#E1306C]/20",
};

const categoryBadgeColors: Record<UpdateItem["category"], string> = {
  video: "bg-red-500/10 text-red-400 border-red-500/20",
  instagram: "bg-[#E1306C]/10 text-[#E1306C] border-[#E1306C]/20",
};

const categoryGlowColors: Record<UpdateItem["category"], string> = {
  video: "rgba(239,68,68,0.18)",
  instagram: "rgba(225,48,108,0.18)",
};

const categoryBorderColors: Record<UpdateItem["category"], string> = {
  video: "rgba(239, 68, 68, 0.45)",
  instagram: "rgba(225, 48, 108, 0.45)",
};

/* ────────────────────────────────────────────
   ANIMATED NUMBER COUNTER
   ──────────────────────────────────────────── */

function AnimatedCounter({ target, duration = 2000 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const startTime = performance.now();
          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{count}</span>;
}

/* ────────────────────────────────────────────
   SCROLL REVEAL HOOK
   ──────────────────────────────────────────── */

function useScrollReveal(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}

/* ────────────────────────────────────────────
   ANIMATED CARD COMPONENT
   ──────────────────────────────────────────── */

function UpdateCard({ item, index }: { item: UpdateItem; index: number }) {
  const { ref, isVisible } = useScrollReveal(0.1);
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  const isVideo = item.category === "video";
  const isInstagram = item.category === "instagram";
  const IconComponent = isVideo ? PlayIcon : isInstagram ? InstagramIcon : GridIcon;

  const thumbHoverColor = isVideo ? "group-hover/thumb:bg-red-500/80" : "group-hover/thumb:bg-[#ee2a7b]/70";
  const scanColor = isVideo ? "via-red-400/40" : "via-[#ee2a7b]/40";

  const cardContent = (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="group relative rounded-2xl p-[1.5px] overflow-hidden h-full flex flex-col bg-white/5 transition-all duration-500 hover:bg-transparent"
      style={{
        transform: isHovered
          ? "translateY(-6px) scale(1.015)"
          : "translateY(0) scale(1)",
        transition: "transform 0.5s cubic-bezier(0.25, 1, 0.5, 1), background-color 0.5s ease",
      }}
    >
      {/* Dynamic glowing border spotlight */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0"
        style={{
          background: isHovered
            ? `radial-gradient(180px circle at ${mousePos.x}px ${mousePos.y}px, ${categoryBorderColors[item.category]}, transparent 80%)`
            : "none",
        }}
      />

      {/* Cursor-following internal glow spotlight */}
      <div
        className="absolute inset-[1.5px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-0 rounded-[15px]"
        style={{
          background: isHovered
            ? `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, ${categoryGlowColors[item.category]}, transparent 60%)`
            : "none",
        }}
      />

      {/* Glass surface wrapper */}
      <div className="relative z-10 glass hover:glass-strong transition-all duration-500 rounded-[15px] h-full flex flex-col overflow-hidden border border-white/5">

        {/* ── THUMBNAIL ── */}
        <div className="relative w-full aspect-video flex-shrink-0 overflow-hidden bg-gradient-to-br from-brand-800 to-brand-900 group/thumb">
          {item.thumbnail ? (
            <img
              src={item.thumbnail}
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover/thumb:scale-105"
            />
          ) : (
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px]" />
          )}

          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent z-10" />

          {/* Instagram color wash */}
          {isInstagram && (
            <div className="absolute inset-0 bg-gradient-to-tr from-[#f9ce34]/12 via-[#ee2a7b]/18 to-[#6228d7]/12 z-10 pointer-events-none" />
          )}

          {/* Center action button */}
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div
              className={`w-14 h-14 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/20 transition-all duration-300 group-hover/thumb:scale-110 group-hover/thumb:border-white/40 ${thumbHoverColor}`}
            >
              {isVideo ? (
                <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              ) : (
                <InstagramIcon className="w-6 h-6 text-white" />
              )}
            </div>
          </div>

          {/* Premium animated scan line */}
          <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
            <div className={`absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent ${scanColor} to-transparent animate-scan`} />
          </div>

          {/* Interactive shimmer sweep on hover */}
          <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden">
            <div className="absolute top-0 -left-full h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 group-hover:translate-x-[350%] transition-all duration-1000 ease-in-out" />
          </div>

          {/* Instagram handle badge */}
          {isInstagram && (
            <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5 bg-black/65 backdrop-blur-md rounded-full px-2.5 py-1 border border-white/10">
              <div className="w-4 h-4 rounded-full overflow-hidden">
                <img src="/profilee.jpg" alt="hiiinishant" className="w-full h-full object-cover object-top" />
              </div>
              <span className="text-[10px] font-semibold text-white font-mono">hiiinishant</span>
            </div>
          )}
        </div>

        {/* ── CARD BODY ── */}
        <div className="flex flex-col flex-1 p-5 sm:p-6">

          {/* Header Row: category + date */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-300 ${categoryIconColors[item.category]}`}>
                <IconComponent className="w-4 h-4" />
              </div>
              {item.badge && (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${categoryBadgeColors[item.category]}`}>
                  {item.badge}
                </span>
              )}
              {item.isNew && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
                </span>
              )}
            </div>
            <time className="text-[10px] text-brand-500 font-medium whitespace-nowrap ml-2">
              {new Date(item.date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </time>
          </div>

          {/* Title */}
          <h3 className="text-sm sm:text-base font-bold text-white mb-2 group-hover:text-accent transition-colors duration-300 leading-snug line-clamp-2 min-h-[2.6rem]">
            {item.title}
          </h3>

          {/* Description */}
          <p className="text-xs sm:text-sm text-brand-400 leading-relaxed line-clamp-2 flex-grow min-h-[2.6rem]">
            {item.description}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/5">
            <span className="text-[11px] text-brand-500 font-medium truncate max-w-[65%]">
              {item.meta ?? ""}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
              View <ExternalIcon className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div
      ref={ref}
      className="h-full"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0) scale(1)" : "translateY(40px) scale(0.95)",
        transition: "opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1)",
        transitionDelay: `${index * 80}ms`,
      }}
    >
      {item.href ? (
        item.href.startsWith("http") ? (
          <a href={item.href} target="_blank" rel="noopener noreferrer" className="block h-full">
            {cardContent}
          </a>
        ) : (
          <Link href={item.href} className="block h-full">
            {cardContent}
          </Link>
        )
      ) : (
        cardContent
      )}
    </div>
  );
}

/* ────────────────────────────────────────────
   MAIN SECTION
   ──────────────────────────────────────────── */

type CategoryId = "all" | UpdateItem["category"];

export default function LatestUpdatesSection({ initialUpdates }: { initialUpdates?: UpdateItem[] }) {
  const [activeCategory, setActiveCategory] = useState<CategoryId>("all");
  const [updatesList, setUpdatesList] = useState<UpdateItem[]>(
    (initialUpdates && initialUpdates.length > 0) ? initialUpdates : latestUpdates
  );
  const [filteredItems, setFilteredItems] = useState<UpdateItem[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { ref: sectionRef, isVisible: sectionVisible } = useScrollReveal(0.05);
  const { ref: statsRef, isVisible: statsVisible } = useScrollReveal(0.3);

  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const [tabStyle, setTabStyle] = useState<{ width: number; left: number }>({ width: 0, left: 0 });

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || ""}/api/updates`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setUpdatesList(data);
      })
      .catch((err) => console.error("Error fetching updates:", err));
  }, []);

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => {
      const sorted = [...updatesList].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      if (activeCategory === "all") {
        setFilteredItems(sorted);
      } else {
        setFilteredItems(sorted.filter((item) => item.category === activeCategory));
      }
      setIsTransitioning(false);
    }, 280);
    return () => clearTimeout(timer);
  }, [activeCategory, updatesList]);

  useEffect(() => {
    const activeIndex = categories.findIndex((cat) => cat.id === activeCategory);
    const activeTab = tabsRef.current[activeIndex];
    if (activeTab) {
      setTabStyle({ width: activeTab.offsetWidth, left: activeTab.offsetLeft });
    }
  }, [activeCategory, updatesList]);

  useEffect(() => {
    const handleResize = () => {
      const activeIndex = categories.findIndex((cat) => cat.id === activeCategory);
      const activeTab = tabsRef.current[activeIndex];
      if (activeTab) {
        setTabStyle({ width: activeTab.offsetWidth, left: activeTab.offsetLeft });
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeCategory]);

  const totalVideos = updatesList.filter((i) => i.category === "video").length;
  const totalInstagram = updatesList.filter((i) => i.category === "instagram").length;

  return (
    <section id="latest-updates" className="py-10 lg:py-16 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-accent/5 blur-[140px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-emerald-500/3 blur-[160px]" />
      </div>
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:48px_48px]" />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 relative z-10">

        {/* ── HERO HEADER ── */}
        <div
          ref={sectionRef}
          className={`transition-all duration-1000 ${
            sectionVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          {/* Giant title */}
          <h1 className="text-center text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight mb-4">
            <span className="text-gradient underline-ray">Latest Updates</span>
          </h1>

          {/* Subtitle */}
          <p className="text-center text-brand-300 max-w-xl mx-auto leading-relaxed text-sm sm:text-base mb-6">
            Stay in the loop — fresh videos and Instagram posts from Nishant &amp;{" "}
            <span className="text-accent font-semibold">2 AM Study</span>, updated automatically.
          </p>

          {/* ── INLINE METRICS STRIP ── */}
          <div
            ref={statsRef}
            className={`flex items-center justify-center mb-8 transition-all duration-1000 delay-200 ${
              statsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            {/* YouTube stat */}
            <div className="flex items-center gap-3.5">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </div>
              <div>
                <p className="text-2xl font-black text-red-400 leading-none tabular-nums">
                  <AnimatedCounter target={totalVideos} duration={1600} />+
                </p>
                <p className="text-xs text-brand-400 mt-0.5">
                  <span className="text-white/70 font-medium">Videos</span>
                  <span className="mx-1.5 opacity-40">·</span>YouTube
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="w-px h-10 bg-white/10 mx-8" />

            {/* Instagram stat */}
            <div className="flex items-center gap-3.5">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#E1306C]/10 border border-[#E1306C]/20 text-[#E1306C]">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
                </svg>
              </div>
              <div>
                <p className="text-2xl font-black text-[#E1306C] leading-none tabular-nums">
                  <AnimatedCounter target={totalInstagram} duration={1600} />+
                </p>
                <p className="text-xs text-brand-400 mt-0.5">
                  <span className="text-white/70 font-medium">Posts</span>
                  <span className="mx-1.5 opacity-40">·</span>Instagram
                </p>
              </div>
            </div>
          </div>

          {/* ── CATEGORY TABS ── */}
          <div className="flex justify-center border-b border-white/8 mb-10 pb-0">
            <div className="relative inline-flex items-center gap-1 p-1.5 rounded-2xl glass-strong overflow-x-auto max-w-full scrollbar-hide mb-[-1px]">
              {tabStyle.width > 0 && (
                <span
                  className="absolute top-1.5 bottom-1.5 bg-accent rounded-xl transition-all duration-300 ease-out shadow-[0_0_20px_rgba(245,158,11,0.3)] pointer-events-none"
                  style={{
                    width: `${tabStyle.width}px`,
                    left: `${tabStyle.left}px`,
                  }}
                />
              )}
              {categories.map((cat, idx) => {
                const Icon = iconMap[cat.icon];
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    ref={(el) => { tabsRef.current[idx] = el; }}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`relative z-10 flex items-center gap-2 px-5 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-colors duration-300 ${
                      isActive ? "text-black font-semibold" : "text-brand-300 hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── CARDS GRID ── */}
        <div
          className={`transition-all duration-300 ${
            isTransitioning ? "opacity-0 scale-[0.98] translate-y-2" : "opacity-100 scale-100 translate-y-0"
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 items-stretch">
            {filteredItems.map((item, index) => (
              <UpdateCard key={item.id} item={item} index={index} />
            ))}
          </div>

          {filteredItems.length === 0 && !isTransitioning && (
            <div className="text-center py-16">
              <p className="text-brand-400 text-lg">No updates in this category yet.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
