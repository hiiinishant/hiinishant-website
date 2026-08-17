import Link from "next/link";
import type { BlogPost } from "@/types";

interface BlogCardProps {
  post: BlogPost;
}

export default function BlogCard({ post }: BlogCardProps) {
  const coverImage = post.imageUrl || post.imagePath || null;

  return (
    <Link
      href={post.slug === 'amazon' ? '/amazon-feed' : `/blog/${post.slug}`}
      className="group flex flex-col rounded-2xl glass border border-white/6 overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:border-accent/25 hover:glass-strong card-spotlight"
    >
      {/* Top accent strip */}
      <div className="h-0.5 bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:via-accent/50 transition-all duration-500" />

      {/* Cover Image */}
      {coverImage ? (
        <div className="relative w-full h-44 overflow-hidden bg-zinc-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverImage}
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* subtle gradient overlay at bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 via-transparent to-transparent pointer-events-none" />
        </div>
      ) : (
        /* Thin accent bar when no image */
        <div className="w-full h-1.5 bg-gradient-to-r from-accent/30 via-accent/10 to-transparent" />
      )}

      <div className="flex flex-col flex-1 p-6">
        {/* Meta */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <time className="text-[11px] text-brand-500">
            {new Date(post.date.includes("T") ? post.date : `${post.date}T00:00:00`).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </time>
          <span className="text-brand-700">·</span>
          <span className="text-[11px] text-brand-500">{post.readTime}</span>
          {post.category && (
            <>
              <span className="text-brand-700">·</span>
              <span className="text-[11px] text-accent/80 font-medium">{post.category}</span>
            </>
          )}
        </div>

        {/* Title */}
        <h2 className="text-base font-bold text-white group-hover:text-accent transition-colors duration-300 mb-2 leading-snug line-clamp-2">
          {post.title}
        </h2>

        {/* Excerpt */}
        <p className="text-sm text-brand-400 leading-relaxed line-clamp-3 flex-1 mb-4">
          {post.excerpt}
        </p>

        

        
      </div>
    </Link>
  );
}
