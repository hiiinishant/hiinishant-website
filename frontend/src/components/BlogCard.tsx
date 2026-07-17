import Link from "next/link";
import type { BlogPost } from "@/types";

interface BlogCardProps {
  post: BlogPost;
}

export default function BlogCard({ post }: BlogCardProps) {
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
