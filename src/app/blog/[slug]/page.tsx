import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { blogPosts, getBlogPost } from "@/data/blog";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return { title: "Post Not Found" };

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.date,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  return (
    <>
      <section className="relative py-24 lg:py-32 overflow-hidden noise">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full bg-accent/8 blur-[120px]"></div>
        </div>
        <div className="max-w-3xl mx-auto px-5 sm:px-8 relative z-10">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-brand-400 hover:text-accent transition-colors mb-8"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
            Back to Blog
          </Link>
          <div className="flex items-center gap-3 mb-6">
            <time className="text-xs text-brand-500">
              {new Date(post.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
            <span className="text-brand-600">·</span>
            <span className="text-xs text-brand-500">{post.readTime}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
            {post.title}
          </h1>
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-lg bg-accent/10 text-xs text-accent font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      <article className="py-12 lg:py-16">
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <div 
            className="space-y-6"
            dangerouslySetInnerHTML={{ __html: post.html || "" }}
          />

          <div className="mt-16 pt-8 border-t border-white/5">
            <p className="text-sm text-brand-400 mb-4">
              Enjoyed this? Share it or subscribe to the newsletter for more.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/blog"
                className="px-6 py-3 rounded-xl glass hover:glass-strong text-sm font-medium text-brand-200 hover:text-white transition-all"
              >
                More Posts
              </Link>
              <Link
                href="/#newsletter"
                className="px-6 py-3 rounded-xl bg-accent hover:bg-accent-hover text-black font-semibold text-sm transition-all"
              >
                Subscribe
              </Link>
            </div>
          </div>
        </div>
      </article>
    </>
  );
}
