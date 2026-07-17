import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllBlogPosts, getBlogPost } from "@/data/blog";
import ShareButtons from "@/components/ShareButtons";
import BlogCard from "@/components/BlogCard";
import Newsletter from "@/components/Newsletter";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const blogPosts = await getAllBlogPosts();
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return { title: "Post Not Found" };

  return {
    title: post.seoTitle || post.title,
    description: post.excerpt,
    openGraph: {
      title: post.seoTitle || post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.date,
    },
    alternates: {
      canonical: `/blog/${slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const allPosts = await getAllBlogPosts();
  const post = allPosts.find((p) => p.slug === slug);
  if (!post) notFound();

  // Find previous and next articles chronologically
  const currentIndex = allPosts.findIndex((p) => p.slug === post.slug);
  const nextPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
  const prevPost = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;

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

  return (
    <article className="pt-8 pb-24 lg:pt-10 lg:pb-32 relative overflow-hidden noise">
      {/* Background glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full bg-accent/5 blur-[120px]"></div>
      </div>
      
      <div className="max-w-3xl mx-auto px-5 sm:px-8 relative z-10">
        {/* ← Back to Blog */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-brand-400 hover:text-accent transition-colors mb-8 group"
        >
          <span className="group-hover:-translate-x-1 transition-transform duration-200">←</span>
          Back to Blog
        </Link>

        {/* Article meta header — author left, date right */}
        <div className="flex items-start justify-between gap-4 mb-8">
          {/* Left: author */}
          <div className="shrink-0">
            <p className="text-[11px] uppercase tracking-widest text-brand-600 font-semibold">written by</p>
            <p className="text-base font-bold text-white mt-0.5">{post.writtenBy || "Nishant Kumar"}</p>
          </div>

          {/* Right: date & read time */}
          <div className="text-right space-y-1">
            <p className="text-sm text-brand-400">
              Published on{" "}
              {new Date(post.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            <p className="text-sm text-brand-400">
              {post.readTime} · {post.category || post.tags[0] || "General"}
            </p>
          </div>
        </div>

        {/* Divider 1 */}
        <hr className="border-white/10 my-8" />


        {/* Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-8 text-white leading-tight">
          {post.title}
        </h1>

        {/* Article Content */}
        <div 
          className="prose prose-invert prose-brand max-w-none space-y-6 text-brand-300 leading-relaxed text-lg"
          dangerouslySetInnerHTML={{ __html: post.html || "" }}
        />

        {/* Divider 2 */}
        <hr className="border-white/10 my-10" />

        {/* Share Section */}
        <div className="mb-8">
          <ShareButtons title={post.title} />
        </div>

        {/* Previous / Next Article Navigation */}
        <div className="flex justify-between items-stretch gap-6 py-4">
          {prevPost ? (
            <Link
              href={`/blog/${prevPost.slug}`}
              className="flex-1 group text-left p-4 rounded-xl glass border border-white/5 hover:border-accent/25 hover:glass-strong transition-all duration-300"
            >
              <span className="text-xs text-brand-500 block mb-1">Previous Article</span>
              <span className="text-sm font-semibold text-white group-hover:text-accent transition-colors line-clamp-2">
                ← {prevPost.title}
              </span>
            </Link>
          ) : (
            <div className="flex-1" />
          )}
          {nextPost ? (
            <Link
              href={`/blog/${nextPost.slug}`}
              className="flex-1 group text-right p-4 rounded-xl glass border border-white/5 hover:border-accent/25 hover:glass-strong transition-all duration-300"
            >
              <span className="text-xs text-brand-500 block mb-1">Next Article</span>
              <span className="text-sm font-semibold text-white group-hover:text-accent transition-colors line-clamp-2">
                {nextPost.title} →
              </span>
            </Link>
          ) : (
            <div className="flex-1" />
          )}
        </div>

        {/* Divider 3 */}
        <hr className="border-white/10 my-10" />

        {/* You may also like Section */}
        {relatedPosts.length > 0 && (
          <div className="mb-10">
            <h3 className="text-lg font-bold text-white mb-6">You may also like</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {relatedPosts.map((relatedPost) => (
                <BlogCard key={relatedPost.slug} post={relatedPost} />
              ))}
            </div>
          </div>
        )}

        {/* Divider 4 */}
        <hr className="border-white/10 my-10" />

        {/* Weekly Study Newsletter */}
        <div className="p-8 rounded-2xl glass border border-white/5 relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-accent/5 to-transparent"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h3 className="text-lg font-bold text-white mb-1.5 flex items-center gap-2">
                <span>📬</span> Weekly Study Newsletter
              </h3>
              <p className="text-brand-400 text-sm">
                Get one useful study email every week.
              </p>
            </div>
            <div className="w-full md:w-auto md:min-w-[280px]">
              <Newsletter variant="inline" />
            </div>
          </div>
        </div>

      </div>
    </article>
  );
}
