import type { MetadataRoute } from "next";
import { siteConfig } from "@/data/site";
import { getAllBlogPosts } from "@/data/blog";
import { getAllQuizQuestions } from "@/data/quizServer";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url;

  // 1. Core indexable public pages with stable update timestamps
  // Note: We use stable dates reflecting real content updates instead of dynamic new Date()
  // to avoid misleading search engines with fake freshness signals on every request.
  const staticRoutes: {
    route: string;
    changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
    priority: number;
    lastModified: string;
  }[] = [
    { route: "", changeFrequency: "daily", priority: 1.0, lastModified: "2026-09-01" },
    { route: "/about", changeFrequency: "weekly", priority: 0.9, lastModified: "2026-09-01" },
    { route: "/blog", changeFrequency: "weekly", priority: 0.8, lastModified: "2026-09-01" },
    { route: "/projects", changeFrequency: "weekly", priority: 0.8, lastModified: "2026-08-20" },
    { route: "/journey", changeFrequency: "weekly", priority: 0.8, lastModified: "2026-08-20" },
    { route: "/updates", changeFrequency: "daily", priority: 0.8, lastModified: "2026-09-01" },
    { route: "/status", changeFrequency: "daily", priority: 0.8, lastModified: "2026-09-03" },
    { route: "/vlogs", changeFrequency: "weekly", priority: 0.8, lastModified: "2026-09-01" },
    { route: "/gallery", changeFrequency: "weekly", priority: 0.8, lastModified: "2026-08-15" },
    { route: "/quiz", changeFrequency: "daily", priority: 0.8, lastModified: "2026-09-01" },
    { route: "/music", changeFrequency: "monthly", priority: 0.7, lastModified: "2026-08-01" },
    { route: "/contact", changeFrequency: "monthly", priority: 0.7, lastModified: "2026-08-01" },
    { route: "/resume", changeFrequency: "monthly", priority: 0.7, lastModified: "2026-08-01" },
    { route: "/links", changeFrequency: "monthly", priority: 0.7, lastModified: "2026-08-01" },
    { route: "/universe", changeFrequency: "monthly", priority: 0.7, lastModified: "2026-08-01" },
    { route: "/nsgram", changeFrequency: "weekly", priority: 0.8, lastModified: "2026-09-01" },
    { route: "/faq", changeFrequency: "monthly", priority: 0.7, lastModified: "2026-08-01" },
    { route: "/support", changeFrequency: "monthly", priority: 0.7, lastModified: "2026-08-01" },
    { route: "/amazon-feed", changeFrequency: "weekly", priority: 0.7, lastModified: "2026-08-15" },
    { route: "/privacy", changeFrequency: "monthly", priority: 0.5, lastModified: "2026-08-01" },
    { route: "/terms", changeFrequency: "monthly", priority: 0.5, lastModified: "2026-08-01" },
  ];

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((item) => ({
    url: `${baseUrl}${item.route}`,
    lastModified: new Date(item.lastModified),
    changeFrequency: item.changeFrequency,
    priority: item.priority,
  }));

  // 2. Dynamic blog posts (valuable articles with actual publish dates)
  let dynamicBlogRoutes: MetadataRoute.Sitemap = [];
  try {
    const blogPosts = await getAllBlogPosts();
    dynamicBlogRoutes = blogPosts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.date ? new Date(post.date) : new Date("2026-08-01"),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.warn("Failed to fetch blog posts for sitemap:", error);
  }

  // 3. Dynamic quiz questions (SEO keyword pages with slugs for Google Search)
  let dynamicQuizRoutes: MetadataRoute.Sitemap = [];
  try {
    const quizQuestions = await getAllQuizQuestions();
    dynamicQuizRoutes = quizQuestions
      .filter((q) => q.slug && q.subjectSlug)
      .map((q) => ({
        url: `${baseUrl}/quiz/${encodeURIComponent(q.subjectSlug)}/${encodeURIComponent(q.slug)}`,
        lastModified: q.date ? new Date(q.date) : new Date("2026-09-01"),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));
  } catch (error) {
    console.warn("Failed to fetch quiz questions for sitemap:", error);
  }

  // NOTE: We intentionally exclude individual daily status micro-logs (/status/YYYY-MM-DD),
  // individual YouTube embed wrappers (/vlogs/[id]), and legacy ID URLs (/quiz/q/[id])
  // from the sitemap to prevent crawl budget dilution on thin content.
  // Their canonical keyword URLs (/quiz/[subject]/[slug]) and hub pages are included above.

  return [...staticEntries, ...dynamicBlogRoutes, ...dynamicQuizRoutes];
}
