"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { BlogPost } from "@/types";

interface Props {
  posts: BlogPost[];
}

export default function BlogClientPage({ posts }: Props) {
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // Collect all unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    posts.forEach((p) => p.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [posts]);

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q));
      const matchesTag = !activeTag || p.tags.includes(activeTag);
      return matchesSearch && matchesTag;
    });
  }, [posts, search, activeTag]);

  const featured = filtered.find((p) => p.featured);
  const rest = filtered.filter((p) => p !== featured);

  return (
    <>
      {/* ─── HERO HEADER ──────────────────────────────────────────── */}
      <section className="relative pt-8 pb-4 overflow-hidden">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full opacity-20"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(245,158,11,0.35) 0%, transparent 70%)",
              filter: "blur(60px)",
            }}
          />
        </div>

        <div className="max-w-5xl mx-auto px-5 sm:px-8 text-center">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-accent/20 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-xs font-semibold text-accent uppercase tracking-widest">
              Writing
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-4">
            Thoughts &amp;{" "}
            <span className="text-gradient">Stories</span>
          </h1>
          <p className="text-brand-400 text-lg max-w-2xl mx-auto mb-10">
            Writing about edtech, entrepreneurship, study tips, and building in public.
          </p>

          {/* ─── SEARCH BAR ─────────────────────────────────────────── */}
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

          {/* ─── TAG FILTERS ────────────────────────────────────────── */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-2">
              <button
                onClick={() => setActiveTag(null)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                  activeTag === null
                    ? "bg-accent text-brand-900 border-accent"
                    : "glass border-white/8 text-brand-400 hover:text-white hover:border-white/20"
                }`}
              >
                All
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                    activeTag === tag
                      ? "bg-accent text-brand-900 border-accent"
                      : "glass border-white/8 text-brand-400 hover:text-white hover:border-white/20"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
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
              {/* ─── FEATURED POST ─────────────────────────────────── */}
              {featured && (
                <div className="mb-10">
                  <p className="text-xs font-semibold text-accent uppercase tracking-widest mb-4">
                    ★ Featured Post
                  </p>
                  <Link
                    href={`/blog/${featured.slug}`}
                    className="group relative block rounded-3xl glass-strong border border-white/8 overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:border-accent/30 card-spotlight gradient-border"
                  >
                    <div className="p-8 sm:p-10">
                      {/* Meta row */}
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 border border-accent/25 text-[10px] font-bold text-accent uppercase tracking-wider">
                          <span className="w-1 h-1 rounded-full bg-accent" />
                          Featured
                        </span>
                        <time className="text-xs text-brand-400">
                          {new Date(featured.date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </time>
                        <span className="text-brand-600">·</span>
                        <span className="text-xs text-brand-400">{featured.readTime}</span>
                      </div>

                      <h2 className="text-2xl sm:text-3xl font-extrabold text-white group-hover:text-accent transition-colors duration-300 mb-3 leading-snug">
                        {featured.title}
                      </h2>
                      <p className="text-brand-300 leading-relaxed mb-6 max-w-2xl line-clamp-3">
                        {featured.excerpt}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-6">
                        {featured.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-3 py-1 rounded-lg bg-white/5 text-xs text-brand-300 border border-white/6"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* CTA */}
                      <span className="inline-flex items-center gap-2 text-sm font-semibold text-accent group-hover:gap-3 transition-all duration-300">
                        Read article
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                        </svg>
                      </span>
                    </div>

                    {/* Accent line */}
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent opacity-60" />
                  </Link>
                </div>
              )}

              {/* ─── GRID OF CARDS ─────────────────────────────────── */}
              {rest.length > 0 && (
                <>
                  {featured && (
                    <p className="text-xs font-semibold text-brand-500 uppercase tracking-widest mb-4">
                      All Posts
                    </p>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {rest.map((post) => (
                      <BlogCard key={post.slug} post={post} />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}

/* ─── BLOG CARD ─────────────────────────────────────────────────── */

function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col rounded-2xl glass border border-white/6 overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:border-accent/25 hover:glass-strong card-spotlight"
    >
      {/* Top accent strip */}
      <div className="h-0.5 bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:via-accent/50 transition-all duration-500" />

      <div className="flex flex-col flex-1 p-6">
        {/* Meta */}
        <div className="flex items-center gap-2 mb-4">
          <time className="text-[11px] text-brand-500">
            {new Date(post.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </time>
          <span className="text-brand-700">·</span>
          <span className="text-[11px] text-brand-500">{post.readTime}</span>
        </div>

        {/* Title */}
        <h2 className="text-base font-bold text-white group-hover:text-accent transition-colors duration-300 mb-2 leading-snug line-clamp-2">
          {post.title}
        </h2>

        {/* Excerpt */}
        <p className="text-sm text-brand-400 leading-relaxed line-clamp-3 flex-1 mb-4">
          {post.excerpt}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {post.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-0.5 rounded-md bg-white/5 text-[10px] text-brand-400"
            >
              {tag}
            </span>
          ))}
          {post.tags.length > 3 && (
            <span className="px-2.5 py-0.5 rounded-md bg-white/5 text-[10px] text-brand-500">
              +{post.tags.length - 3}
            </span>
          )}
        </div>

        {/* Read link */}
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-500 group-hover:text-accent transition-colors duration-300 mt-auto">
          Read more
          <svg
            className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </span>
      </div>
    </Link>
  );
}
