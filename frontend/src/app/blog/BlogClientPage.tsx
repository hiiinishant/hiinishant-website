"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { BlogPost } from "@/types";
import BlogCard from "@/components/BlogCard";

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

export default function BlogClientPage({ posts }: Props) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return posts.filter((p) => {
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
  }, [posts, search, activeCategory]);

  const featured = useMemo(() => filtered.find((p) => p.featured) || filtered[0], [filtered]);
  const rest = useMemo(() => filtered.filter((p) => p.slug !== featured?.slug), [filtered, featured]);
  const popularPosts = useMemo(() => posts.filter((p) => p.slug !== featured?.slug).slice(0, 3), [posts, featured]);

  return (
    <>
      {/* ─── HERO HEADER & FILTERS ──────────────────────────────────── */}
      <section className="relative pt-12 pb-8 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full opacity-20"
            style={{
              background: "radial-gradient(ellipse at center, rgba(245,158,11,0.35) 0%, transparent 70%)",
              filter: "blur(60px)",
            }}
          />
        </div>

        <div className="max-w-5xl mx-auto px-5 sm:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-4">
            Thoughts &amp; <span className="text-gradient">Stories</span>
          </h1>
          <p className="text-brand-400 text-lg max-w-2xl mx-auto mb-10">
            Writing about edtech, entrepreneurship, study tips, and building in public.
          </p>

          {/* Search */}
          <div className="relative max-w-xl mx-auto mb-8">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
            </div>
            <input
              id="blog-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search posts…"
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl glass border border-white/8 text-white placeholder-brand-500 text-sm focus:outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/20 transition-all duration-300"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute inset-y-0 right-4 flex items-center text-brand-500 hover:text-white transition-colors"
                aria-label="Clear search"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap justify-center gap-2 mb-2">
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
        </div>
      </section>

      {/* ─── CONTENT ────────────────────────────────────────────────── */}
      <section className="pb-24">
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
              </div>
              <p className="text-white font-semibold text-lg mb-1">No posts found</p>
              <p className="text-brand-400 text-sm">Try a different search term or tag</p>
            </div>
          ) : (
            <>
              {/* ─── FEATURED POST — full width, tall cover image ─── */}
              {featured && (
                <div className="mb-10">
                  <p className="text-xs font-semibold text-accent uppercase tracking-widest mb-3">
                    ★ Featured Post
                  </p>
                  <Link
                    href={`/blog/${featured.slug}`}
                    className="group block rounded-2xl glass border border-accent/20 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:glass-strong card-spotlight"
                  >
                    {/* Tall cover image with title overlaid */}
                    {(featured.imageUrl || featured.imagePath) ? (
                      <div className="relative w-full h-64 sm:h-80 overflow-hidden bg-zinc-900">
                        <img
                          src={featured.imageUrl || featured.imagePath}
                          alt={featured.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        {/* Deep gradient for text readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/95 via-zinc-950/40 to-transparent pointer-events-none" />
                        {/* ★ Featured badge */}
                        <div className="absolute top-4 left-4 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent text-[10px] font-bold text-black uppercase tracking-wide shadow-lg">
                          ★ Featured
                        </div>
                        {/* Title + meta overlaid on image bottom */}
                        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <time className="text-[11px] text-white/60">
                              {new Date(featured.date.includes("T") ? featured.date : `${featured.date}T00:00:00`).toLocaleDateString("en-US", {
                                year: "numeric", month: "short", day: "numeric",
                              })}
                            </time>
                            <span className="text-white/30">·</span>
                            <span className="text-[11px] text-white/60">{featured.readTime}</span>
                            {featured.category && (
                              <>
                                <span className="text-white/30">·</span>
                                <span className="text-[11px] text-accent font-semibold">{featured.category}</span>
                              </>
                            )}
                          </div>
                          <h2 className="text-xl sm:text-2xl font-extrabold text-white group-hover:text-accent transition-colors duration-300 leading-snug line-clamp-2">
                            {featured.title}
                          </h2>
                        </div>
                      </div>
                    ) : (
                      /* No image fallback */
                      <>
                        <div className="h-0.5 bg-gradient-to-r from-accent/70 via-accent/30 to-transparent" />
                        <div className="px-6 pt-5">
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <time className="text-[11px] text-brand-500">
                              {new Date(featured.date.includes("T") ? featured.date : `${featured.date}T00:00:00`).toLocaleDateString("en-US", {
                                year: "numeric", month: "short", day: "numeric",
                              })}
                            </time>
                            <span className="text-brand-700">·</span>
                            <span className="text-[11px] text-brand-500">{featured.readTime}</span>
                          </div>
                          <h2 className="text-xl sm:text-2xl font-extrabold text-white group-hover:text-accent transition-colors duration-300 leading-snug line-clamp-2 mb-1">
                            {featured.title}
                          </h2>
                        </div>
                      </>
                    )}

                    {/* Excerpt + tags + read more */}
                    <div className="p-5 sm:p-6">
                      <p className="text-sm text-brand-400 leading-relaxed line-clamp-2 mb-4">
                        {featured.excerpt}
                      </p>
                      <div className="flex items-center justify-between gap-4">
                        {featured.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {featured.tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="px-2.5 py-0.5 rounded-md bg-white/5 text-[10px] text-brand-400">
                                {tag}
                              </span>
                            ))}
                            {featured.tags.length > 3 && (
                              <span className="px-2.5 py-0.5 rounded-md bg-white/5 text-[10px] text-brand-500">
                                +{featured.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-500 group-hover:text-accent transition-colors duration-300 ml-auto shrink-0">
                          Read more
                          <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              )}

              {/* ─── LATEST ARTICLES ────────────────────────────────── */}
              {rest.length > 0 && (
                <div className="mb-16">
                  <h2 className="text-xl font-extrabold text-white mb-6">Latest Articles</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {rest.map((post) => (
                      <BlogCard key={post.slug} post={post} />
                    ))}
                  </div>
                </div>
              )}

              {/* ─── POPULAR READS ──────────────────────────────────── */}
              {popularPosts.length > 0 && (
                <div className="border-t border-white/10 pt-12">
                  <h3 className="text-xl font-extrabold text-white mb-6 flex items-center gap-2">
                    <span>🔥</span> Popular Reads
                  </h3>
                  <ul className="space-y-5 max-w-2xl">
                    {popularPosts.map((post, idx) => (
                      <li key={post.slug} className="flex items-start gap-4 group">
                        <span className="text-accent font-mono font-bold text-lg mt-0.5">{idx + 1}.</span>
                        <div className="flex-1">
                          <Link
                            href={`/blog/${post.slug}`}
                            className="text-base font-semibold text-white group-hover:text-accent transition-colors line-clamp-1"
                          >
                            {post.title}
                          </Link>
                          <span className="text-xs text-brand-500 block mt-1">
                            {new Date(post.date.includes("T") ? post.date : `${post.date}T00:00:00`).toLocaleDateString("en-US", {
                              month: "short", day: "numeric", year: "numeric",
                            })}{" "}
                            · {post.readTime}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
