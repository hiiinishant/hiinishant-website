import type { MetadataRoute } from "next";
import { siteConfig } from "@/data/site";
import { getAllBlogPosts } from "@/data/blog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url;

  // 1. Define all static paths
  const staticRoutes = [
    "",
    "/journey",
    "/links",
    "/universe",
    "/resume",
    "/updates",
    "/blog",
    "/projects",
    "/contact",
    "/privacy",
    "/status",
    "/gallery",
    "/music",
  ].map((route) => {
    // Determine priority and change frequency based on the page
    let changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never" = "monthly";
    let priority = 0.5;

    if (route === "") {
      changeFrequency = "daily";
      priority = 1.0;
    } else if (route === "/updates" || route === "/status") {
      changeFrequency = "daily";
      priority = 0.8;
    } else if (route === "/blog" || route === "/projects" || route === "/journey") {
      changeFrequency = "weekly";
      priority = 0.8;
    } else if (route === "/contact" || route === "/resume" || route === "/universe" || route === "/links" || route === "/music" || route === "/gallery") {
      changeFrequency = "monthly";
      priority = 0.7;
    }

    return {
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency,
      priority,
    };
  });

  // 2. Fetch dynamic blog posts and append them
  const blogPosts = await getAllBlogPosts();
  const dynamicRoutes = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...dynamicRoutes];
}
