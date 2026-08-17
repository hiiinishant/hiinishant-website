import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getAllBlogPosts, getBlogPost } from "@/data/blog";
import BlogCard from "@/components/BlogCard";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const blogPosts = await getAllBlogPosts();
    return blogPosts.map((post) => ({ slug: post.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return { title: "Post Not Found" };

  const title = post.seoTitle || post.title;
  const image = post.imageUrl || post.imagePath || "/profile.jpg";
  const author = post.writtenBy || "Nishant Kumar";

  return {
    title,
    description: post.excerpt,
    keywords: [
      post.title,
      title,
      author,
      "Nishant Kumar blog",
      "hiiinishant blog",
      ...(post.category ? [post.category] : []),
      ...post.tags,
    ],
    authors: [{ name: author }],
    openGraph: {
      title,
      description: post.excerpt,
      url: `/blog/${slug}`,
      type: "article",
      publishedTime: post.date,
      authors: [author],
      section: post.category || "Blog",
      tags: post.tags,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: post.excerpt,
      images: [image],
      creator: "@hiiinishant",
    },
    alternates: {
      canonical: `/blog/${slug}`,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const allPosts = await getAllBlogPosts();
  const post = allPosts.find((p) => p.slug === slug);
  if (!post) notFound();

  // Find 3 related articles based on shared tags, defaulting to newest posts
  const relatedPosts = allPosts
    .filter((p) => p.slug !== post.slug)
    .map((p) => {
      const commonTags = p.tags.filter((t) => post.tags.includes(t)).length;
      return { post: p, commonTags };
    })
    .sort((a, b) => {
      if (b.commonTags !== a.commonTags) {
        return b.commonTags - a.commonTags;
      }
      return new Date(b.post.date).getTime() - new Date(a.post.date).getTime();
    })
    .slice(0, 3)
    .map((item) => item.post);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "alternativeHeadline": post.seoTitle || post.title,
    "description": post.excerpt,
    "image": post.imageUrl || post.imagePath || "https://hiiinishant.com/profile.jpg",
    "datePublished": post.date,
    "dateModified": post.date,
    "author": {
      "@type": "Person",
      "name": post.writtenBy || "Nishant Kumar",
      "url": "https://hiiinishant.com",
    },
    "publisher": {
      "@type": "Person",
      "name": "Nishant Kumar",
      "url": "https://hiiinishant.com",
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://hiiinishant.com/blog/${post.slug}`,
    },
    "keywords": post.tags.join(", "),
    "articleSection": post.category || "Blog",
  };

  const heroImage = post.imageUrl || post.imagePath;

  return (
    <article className="pb-10 lg:pb-14 relative overflow-hidden noise">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      {/* Background glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-accent/5 blur-[120px]" />
      </div>

      {/* ── Header: Title + Meta + Tags (centered, narrow) ── */}
      <header className="pt-10 pb-6 text-center max-w-3xl mx-auto px-5 sm:px-8">
        {/* Category + tags as pills */}
        {(post.category || post.tags.length > 0) && (
          <div className="flex flex-wrap items-center justify-center gap-2 mb-5">
            {post.category && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-accent/15 text-accent border border-accent/25">
                {post.category}
              </span>
            )}
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-brand-400 border border-white/8"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight mb-5">
          {post.title}
        </h1>

        {/* Author · Date · Read time */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-brand-400">
          <span className="font-semibold text-brand-300">{post.writtenBy || "Nishant Kumar"}</span>
          <span className="text-brand-600">·</span>
          <span>
            {new Date(post.date.includes("T") ? post.date : `${post.date}T00:00:00`).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
          <span className="text-brand-600">·</span>
          <span>{post.readTime}</span>
        </div>
      </header>

      {/* ── Full-width Hero Image ── */}
      {heroImage && (
        <div className="w-full max-w-5xl mx-auto px-5 sm:px-8 mb-10">
          <div className="relative w-full aspect-[16/7] rounded-2xl overflow-hidden shadow-2xl border border-white/8">
            <Image
              src={heroImage}
              alt={post.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 1024px"
            />
          </div>
        </div>
      )}

      {/* ── Article Body ── */}
      <div className="max-w-4xl mx-auto px-5 sm:px-8">
        <div
          className="prose prose-invert prose-brand max-w-none text-brand-300 leading-relaxed text-xl"
          dangerouslySetInnerHTML={{ __html: post.html || "" }}
        />
      </div>

      {/* ── Latest Blog Posts ── */}
      {relatedPosts.length > 0 && (
        <div className="max-w-6xl mx-auto px-5 sm:px-8 mt-4">
          <h2 className="text-2xl font-bold text-white mb-8">Latest Blog posts</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {relatedPosts.map((relatedPost) => (
              <BlogCard key={relatedPost.slug} post={relatedPost} />
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
