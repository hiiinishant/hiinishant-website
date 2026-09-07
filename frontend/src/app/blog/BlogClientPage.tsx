"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { BlogPost } from "@/types";
import BlogCard from "@/components/BlogCard";
import AuroraBackground from "@/components/AuroraBackground";

interface Props {
  posts: BlogPost[];
}

const CATEGORIES = [
  { label: "All", tag: null },
  { label: "📖 Biography", tag: "Biography" },
  { label: "📚 Learning", tag: "Learning" },
  { label: "🌍 Lifestyle", tag: "Lifestyle" },
  { label: "💡 Guides", tag: "Guides" },
  { label: "💻 Technology", tag: "Technology" },
  { label: "✍️ Thoughts", tag: "Thoughts" },
];

type SortOption = "featured" | "latest" | "oldest";

export default function BlogClientPage({ posts }: Props) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<SortOption>("featured");
  const [page, setPage] = useState(1);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Sync page state with URL query parameter
  useEffect(() => {
    const queryPage = searchParams?.get('page');
    const pageNum = queryPage ? parseInt(queryPage, 10) : 1;
    if (!isNaN(pageNum) && pageNum !== page) {
      setPage(pageNum);
    }
  }, [searchParams]);

  const handlePageChange = (num: number) => {
    setPage(num);
    router.push(`/blog?page=${num}`);
  };


  const filtered = useMemo(() => {
    const base = posts.filter((p) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q));

      let matchesCat = true;
      if (activeCategory) {
        const normalizedCat = activeCategory.toLowerCase();
        const synonymMap: Record<string, string[]> = {
          biography: ["biography", "bio", "life", "story", "journey", "about", "profile", "autobiography"],
          learning: ["learning", "study", "education", "books", "student", "gate", "jee", "upsc"],
          lifestyle: ["lifestyle", "personal", "travel", "vlog", "fitness"],
          guides: ["guides", "guide", "tutorial", "how-to", "tips"],
          technology: ["technology", "tech", "coding", "programming", "web dev", "development", "software", "ai"],
          thoughts: ["thoughts", "mindset", "opinions", "general", "philosophy"],
        };
        const allowedTags = synonymMap[normalizedCat] || [normalizedCat];
        matchesCat =
          (!!p.category && p.category.toLowerCase() === normalizedCat) ||
          p.tags.some((t) => allowedTags.includes(t.toLowerCase()));
      }

      return matchesSearch && matchesCat;
    });

    // Apply sort
    if (sort === "latest") {
      return [...base].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    if (sort === "oldest") {
      return [...base].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
    // "featured" — featured posts first, then by date desc
    return [...base].sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [posts, search, activeCategory, sort]);

  const POSTS_PER_PAGE = 9;
  const paginatedPosts = useMemo(() => {
    const start = (page - 1) * POSTS_PER_PAGE;
    return filtered.slice(start, start + POSTS_PER_PAGE);
  }, [filtered, page]);

  const popularPosts = useMemo(() => posts.slice(0, 3), [posts]);

  const isDark = typeof document !== "undefined"
    ? !document.documentElement.classList.contains("light")
    : true;

  return (
    <div className={`min-h-screen pb-24 relative overflow-hidden transition-colors duration-300 ${isDark ? "bg-background" : "bg-slate-50"}`}>
      {/* Dynamic Aurora background (smooth lighting without grid lines) */}
      <AuroraBackground />

      <header className="relative pt-16 lg:pt-20 py-4 lg:py-6 text-center max-w-4xl mx-auto px-5 sm:px-8 z-10">
        <span className="text-xs font-semibold text-accent uppercase tracking-widest mb-4 block">
          Nishant&apos;s Articles
        </span>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-4 text-white">
          Thoughts &amp; <span className="text-gradient">Stories</span>
        </h1>
        <p className="text-base sm:text-lg text-brand-300 max-w-2xl mx-auto font-light leading-relaxed">
          Writing about edtech, entrepreneurship, study tips, and building in public.
        </p>
      </header>

      <div className="max-w-6xl mx-auto px-5 sm:px-8 mt-6">
        {/* ── Filter Box ─────────────────────────────────────────── */}
        <div className="max-w-2xl mx-auto mb-5 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md shadow-xl shadow-black/20 p-3">

          {/* Row: Search | Sort | Count */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-2">

            {/* Search input */}
            <div className="relative flex-1">
              {/* Search icon */}
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
              </div>
              <input
                id="blog-search"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search blog by topic, title, or keyword..."
                className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-white/5 border border-white/8 text-white placeholder-brand-600 text-sm focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-all duration-200"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute inset-y-0 right-3 flex items-center text-brand-500 hover:text-white transition-colors"
                  aria-label="Clear search"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Controls group: Sort + Article count (cleanly organized on mobile, inline on desktop) */}
            <div className="flex items-center justify-between sm:justify-start gap-2 shrink-0">
              {/* Desktop divider */}
              <div className="hidden sm:block h-7 w-px bg-white/10 shrink-0" />

              {/* Sort dropdown */}
              <div className="relative shrink-0">
                <select
                  id="blog-sort"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortOption)}
                  className="appearance-none bg-white/5 border border-white/8 text-white text-xs font-medium rounded-xl pl-3 pr-8 py-2.5 focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-all duration-200 cursor-pointer"
                >
                  <option value="featured" className="bg-zinc-900">Sort: Featured</option>
                  <option value="latest" className="bg-zinc-900">Sort: Latest</option>
                  <option value="oldest" className="bg-zinc-900">Sort: Oldest</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-brand-500">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Divider */}
              <div className="h-7 w-px bg-white/10 shrink-0" />

              {/* Article count */}
              <span className="shrink-0 text-[11px] font-mono text-brand-500 whitespace-nowrap pr-1">
                <span className="text-accent font-bold text-sm">{filtered.length}</span>{" "}
                {filtered.length === 1 ? "article" : "articles"} found
              </span>
            </div>
          </div>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              onClick={() => setActiveCategory(cat.tag)}
              className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all duration-200 ${
                activeCategory === cat.tag
                  ? "bg-accent text-brand-900 border-accent shadow-md shadow-accent/15"
                  : "glass border-white/8 text-brand-400 hover:text-white hover:border-white/20"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* ─── CONTENT ────────────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
            </div>
            <p className="text-white font-semibold text-lg">No posts found</p>
          </div>
        ) : (
          <>
            {/* ─── GRID OF POSTS (Uniform size for all cards) ─── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {paginatedPosts.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>

            {/* ─── PAGINATION */}
            {filtered.length > POSTS_PER_PAGE && (
              <div className="flex justify-between items-center mb-6 text-sm text-brand-400">
                <div className="flex gap-1">
                  {Array.from({ length: Math.ceil(filtered.length / POSTS_PER_PAGE) }, (_, i) => i + 1).map((num) => (
                    <Link
                      key={num}
                      href={`/blog?page=${num}`}
                      className={`px-3 py-1 rounded ${num === page ? 'bg-accent text-black font-semibold' : 'bg-white/5 hover:bg-white/10'}`}
                    >
                      {num}
                    </Link>
                  ))}
                </div>
                <div>
                  Showing {Math.min((page - 1) * POSTS_PER_PAGE + 1, filtered.length)} to {Math.min(page * POSTS_PER_PAGE, filtered.length)} of {filtered.length} results
                </div>
              </div>
            )}

            {/* ─── POPULAR READS ─── */}
            {popularPosts.length > 0 && (
              <div className="border-t border-white/10 pt-12">
                <h3 className="text-xl font-extrabold text-white mb-6 flex items-center gap-2"><span>🔥</span> Popular Reads</h3>
                <ul className="space-y-5 max-w-2xl">
                  {popularPosts.map((post, idx) => (
                    <li key={post.slug} className="flex items-start gap-4 group">
                      <span className="text-accent font-mono font-bold text-lg mt-0.5">{idx + 1}.</span>
                      <div className="flex-1">
                        <Link href={`/blog/${post.slug}`} className="text-base font-semibold text-white group-hover:text-accent transition-colors line-clamp-1">{post.title}</Link>
                        <span className="text-xs text-brand-500 block mt-1">{new Date(post.date.includes("T") ? post.date : `${post.date}T00:00:00`).toLocaleDateString("en-US", {month: "short", day: "numeric", year: "numeric"})} · {post.readTime}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

