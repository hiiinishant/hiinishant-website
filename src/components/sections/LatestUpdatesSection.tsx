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

function PenIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
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

function ArrowIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
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

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  grid: GridIcon,
  play: PlayIcon,
  pen: PenIcon,
  trophy: TrophyIcon,
  megaphone: MegaphoneIcon,
};

const categoryColors: Record<UpdateItem["category"], string> = {
  video: "from-red-500/20 to-red-600/5 border-red-500/20 text-red-400",
  blog: "from-blue-500/20 to-blue-600/5 border-blue-500/20 text-blue-400",
  achievement: "from-amber-500/20 to-amber-600/5 border-amber-500/20 text-amber-400",
  announcement: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/20 text-emerald-400",
};

const categoryIconColors: Record<UpdateItem["category"], string> = {
  video: "bg-red-500/10 text-red-400 group-hover:bg-red-500/20",
  blog: "bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20",
  achievement: "bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20",
  announcement: "bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20",
};

const categoryBadgeColors: Record<UpdateItem["category"], string> = {
  video: "bg-red-500/10 text-red-400 border-red-500/20",
  blog: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  achievement: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  announcement: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const categoryGlowColors: Record<UpdateItem["category"], string> = {
  video: "rgba(239,68,68,0.15)",
  blog: "rgba(59,130,246,0.15)",
  achievement: "rgba(245,158,11,0.15)",
  announcement: "rgba(16,185,129,0.15)",
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
  const { ref, isVisible } = useScrollReveal(0.15);
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  const IconComponent = iconMap[
    item.category === "video" ? "play" :
    item.category === "blog" ? "pen" :
    item.category === "achievement" ? "trophy" : "megaphone"
  ];

  const cardContent = (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-1.5"
      style={{
        transitionDelay: `${index * 80}ms`,
      }}
    >
      {/* Spotlight gradient follow cursor */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0"
        style={{
          background: isHovered
            ? `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, ${categoryGlowColors[item.category]}, transparent 50%)`
            : "none",
        }}
      />

      {/* Glass card body */}
      <div className="relative z-10 glass hover:glass-strong transition-all duration-500 p-6 sm:p-7 h-full flex flex-col">
        {/* Top row: category icon + badge + date */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-300 ${categoryIconColors[item.category]}`}>
              <IconComponent className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {item.badge && (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${categoryBadgeColors[item.category]}`}>
                  {item.badge}
                </span>
              )}
              {item.isNew && (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent"></span>
                </span>
              )}
            </div>
          </div>
          <time className="text-[11px] text-brand-500 font-medium whitespace-nowrap ml-2">
            {new Date(item.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </time>
        </div>

        {/* Video thumbnail placeholder for video items */}
        {item.category === "video" && (
          <div className="relative mb-5 rounded-xl overflow-hidden aspect-video bg-gradient-to-br from-brand-800 to-brand-900 group/thumb">
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover/thumb:scale-110 transition-transform duration-300 group-hover:bg-red-500/30">
                <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
            {/* Animated scan line */}
            <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-400/30 to-transparent animate-scan" />
            </div>
            {/* Category-colored grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(239,68,68,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(239,68,68,0.03)_1px,transparent_1px)] bg-[size:24px_24px]" />
          </div>
        )}

        {/* Title */}
        <h3 className="text-base sm:text-lg font-bold text-white mb-2 group-hover:text-accent transition-colors duration-300 leading-snug">
          {item.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-brand-400 leading-relaxed mb-5 flex-grow line-clamp-2">
          {item.description}
        </p>

        {/* Bottom meta + action */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          {item.meta && (
            <span className="text-xs text-brand-500 font-medium">{item.meta}</span>
          )}
          {!item.meta && <span />}
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
            {item.href?.startsWith("http") ? (
              <>View <ExternalIcon className="w-3.5 h-3.5" /></>
            ) : item.href ? (
              <>Read <ArrowIcon className="w-3.5 h-3.5" /></>
            ) : (
              <>Details <ArrowIcon className="w-3.5 h-3.5" /></>
            )}
          </span>
        </div>
      </div>
    </div>
  );

  const wrapperClasses = `transform transition-all duration-700 ${
    isVisible
      ? "opacity-100 translate-y-0"
      : "opacity-0 translate-y-10"
  }`;

  return (
    <div ref={ref} className={wrapperClasses} style={{ transitionDelay: `${index * 80}ms` }}>
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
  const [updatesList, setUpdatesList] = useState<UpdateItem[]>(initialUpdates || latestUpdates);
  const [filteredItems, setFilteredItems] = useState<UpdateItem[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { ref: sectionRef, isVisible: sectionVisible } = useScrollReveal(0.05);
  const { ref: statsRef, isVisible: statsVisible } = useScrollReveal(0.3);

  // Fetch updates at runtime
  useEffect(() => {
    fetch("/api/updates")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setUpdatesList(data);
        }
      })
      .catch((err) => console.error("Error fetching updates:", err));
  }, []);

  // Sort items by date (newest first) and filter by category
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
    }, 300);
    return () => clearTimeout(timer);
  }, [activeCategory, updatesList]);

  // Stats
  const totalVideos = updatesList.filter((i) => i.category === "video").length;
  const totalBlog = updatesList.filter((i) => i.category === "blog").length;
  const totalAchievements = updatesList.filter((i) => i.category === "achievement").length;
  const totalAnnouncements = updatesList.filter((i) => i.category === "announcement").length;

  return (
    <section
      id="latest-updates"
      className="py-14 lg:py-[72px] relative overflow-hidden"
    >
      {/* Background effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-accent/5 blur-[140px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-emerald-500/3 blur-[160px]" />
      </div>

      {/* Animated grid background */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:48px_48px]" />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 relative z-10">
        {/* ── SECTION HEADER ── */}
        <div
          ref={sectionRef}
          className={`text-center mb-16 transition-all duration-1000 ${
            sectionVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-accent/20 bg-accent/5 mb-6">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse-slow" />
            <span className="text-xs font-medium text-accent tracking-wide uppercase">
              What&apos;s New
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-5 leading-tight">
            Latest{" "}
            <span className="text-gradient">Updates</span>
          </h2>

          <p className="text-brand-300 max-w-2xl mx-auto leading-relaxed text-lg">
            Stay in the loop — new videos, articles, milestones, and announcements
            from Nishant and{" "}
            <span className="text-accent font-medium">2 AM Study</span>.
          </p>
        </div>

        {/* ── QUICK STATS BAR ── */}
        <div
          ref={statsRef}
          className={`grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-12 transition-all duration-1000 delay-200 ${
            statsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {[
            { value: totalVideos, label: "Videos", color: "text-red-400", bg: "bg-red-500/5 border-red-500/10" },
            { value: totalBlog, label: "Articles", color: "text-blue-400", bg: "bg-blue-500/5 border-blue-500/10" },
            { value: totalAchievements, label: "Milestones", color: "text-amber-400", bg: "bg-amber-500/5 border-amber-500/10" },
            { value: totalAnnouncements, label: "Announcements", color: "text-emerald-400", bg: "bg-emerald-500/5 border-emerald-500/10" },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`p-4 sm:p-5 rounded-xl border text-center transition-all duration-300 hover:scale-[1.02] ${stat.bg}`}
            >
              <p className={`text-2xl sm:text-3xl font-bold ${stat.color} mb-0.5`}>
                <AnimatedCounter target={stat.value} duration={1500} />+
              </p>
              <p className="text-[11px] text-brand-400 uppercase tracking-wider font-medium">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* ── CATEGORY TABS ── */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center gap-1 p-1.5 rounded-2xl glass-strong overflow-x-auto max-w-full scrollbar-hide">
            {categories.map((cat) => {
              const Icon = iconMap[cat.icon];
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`relative flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                    isActive
                      ? "bg-accent text-black shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                      : "text-brand-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{cat.label}</span>
                  {isActive && (
                    <span className="absolute -bottom-px left-1/2 -translate-x-1/2 w-8 h-0.5 bg-black/30 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── CARDS GRID ── */}
        <div
          className={`transition-all duration-300 ${
            isTransitioning ? "opacity-0 scale-[0.98]" : "opacity-100 scale-100"
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
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

        {/* ── BOTTOM CTA ── */}
        <div className="mt-16 text-center">
          <div className="glass-strong p-8 sm:p-10 rounded-2xl relative overflow-hidden max-w-3xl mx-auto">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
            <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-accent/5 blur-[60px] pointer-events-none" />

            <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">
              Never miss an update
            </h3>
            <p className="text-brand-400 text-sm sm:text-base mb-6 max-w-md mx-auto">
              Follow Nishant on social media or subscribe to the newsletter to stay connected.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="https://youtube.com/@2amstudy"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-accent hover:bg-accent-hover text-black font-semibold transition-all duration-300 hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:-translate-y-0.5"
              >
                <PlayIcon className="w-4 h-4" />
                Subscribe on YouTube
              </a>
              <Link
                href="/contact"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl glass-strong text-white font-medium hover:bg-white/10 transition-all duration-300 hover:-translate-y-0.5"
              >
                Get in Touch
                <ArrowIcon className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
