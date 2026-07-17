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
        
        // Map category keys to potential tag synonyms in the posts database
        const synonymMap: Record<string, string[]> = {
          learning: ["learning", "study", "education", "books", "student"],
          lifestyle: ["lifestyle", "personal", "travel", "vlog", "fitness"],
          guides: ["guides", "guide", "tutorial", "how-to", "tips"],
          technology: ["technology", "tech", "coding", "programming", "web dev", "development", "software", "ai"],
          thoughts: ["thoughts", "mindset", "opinions", "general", "philosophy"]
        };
        
        const allowedTags = synonymMap[normalizedCat] || [normalizedCat];
        matchesCat = p.tags.some((t) => allowedTags.includes(t.toLowerCase()));
      }

      return matchesSearch && matchesCat;
    });
  }, [posts, search, activeCategory]);

  const featured = useMemo(() => {
    return filtered.find((p) => p.featured) || filtered[0];
  }, [filtered]);

  const rest = useMemo(() => {
    return filtered.filter((p) => p.slug !== featured?.slug);
  }, [filtered, featured]);

  const popularPosts = useMemo(() => {
    // Show 3 popular posts (excluding current featured post if possible)
    return posts.filter((p) => p.slug !== featured?.slug).slice(0, 3);
  }, [posts, featured]);

  return (
    <>
      {/* ─── HERO HEADER & FILTERS ─────────────────────────────────── */}
      <section className="relative pt-12 pb-8 overflow-hidden">
        {/* Background glow */}
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

          {/* Search Bar */}
          <div className="relative max-w-xl mx-auto mb-8">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <svg
                className="w-5 h-5 text-brand-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                />
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

          {/* Category buttons below search bar */}
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

      {/* ─── CONTENT ──────────────────────────────────────────────── */}
      <section className="pb-24">
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          {filtered.length === 0 ? (
            /* Empty state */
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
              {/* ─── FEATURED POST (Large Hero with Cover Image) ─── */}
              {featured && (
                <div className="mb-16">
                  <p className="text-xs font-semibold text-accent uppercase tracking-widest mb-4">
                    ★ Featured Post
                  </p>
                  <Link
                    href={`/blog/${featured.slug}`}
                    className="group block rounded-3xl glass border border-white/6 overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:border-accent/25 hover:glass-strong card-spotlight"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12 min-h-[300px]">
                      {/* Cover Image */}
                      <div className="relative md:col-span-6 aspect-video md:aspect-auto min-h-[220px] bg-brand-900 overflow-hidden">
                        {featured.imageUrl ? (
                          <img
                            src={featured.imageUrl}
                            alt={featured.title}
                            className="object-cover w-full h-full group-hover:scale-103 transition-transform duration-700"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-purple-900/40 flex items-center justify-center">
                            <span className="text-5xl opacity-40">🖼️</span>
                          </div>
                        )}
                        {/* Featured Badge */}
                        <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/90 text-[10px] font-bold text-black uppercase tracking-wider">
                          Featured
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-8 sm:p-10 md:col-span-6 flex flex-col justify-center border-t md:border-t-0 md:border-l border-white/6">
                        <div className="flex items-center gap-3 mb-4 text-xs text-brand-400">
                          <time>
                            {new Date(featured.date).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </time>
                          <span>·</span>
                          <span>{featured.readTime}</span>
                        </div>

                        <h2 className="text-2xl sm:text-3xl font-extrabold text-white group-hover:text-accent transition-colors duration-300 mb-4 leading-snug">
                          {featured.title}
                        </h2>
                        <p className="text-brand-300 leading-relaxed mb-6 line-clamp-3">
                          {featured.excerpt}
                        </p>

                        <span className="inline-flex items-center gap-2 text-sm font-semibold text-accent group-hover:gap-3 transition-all duration-300 mt-auto">
                          Read More →
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              )}

              {/* ─── LATEST ARTICLES (2-column Grid) ───────────────── */}
              {rest.length > 0 && (
                <div className="mb-16">
                  <h2 className="text-xl font-extrabold text-white mb-6">
                    Latest Articles
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {rest.map((post) => (
                      <BlogCard key={post.slug} post={post} />
                    ))}
                  </div>
                </div>
              )}

              {/* ─── POPULAR READS ─────────────────────────────────── */}
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
                            {new Date(post.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
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


