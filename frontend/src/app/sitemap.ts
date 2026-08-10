import type { MetadataRoute } from "next";
import { siteConfig } from "@/data/site";
import { getAllBlogPosts } from "@/data/blog";
import { getAllStatuses } from "@/data/statusServer";
import { getAllQuizDates } from "@/data/quizServer";
import { getAllVlogVideos } from "@/data/vlogsServer";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url;

  // 1. Define all static paths
  const staticRoutes = [
    "",
    "/vlogs",
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
    "/quiz",
  ].map((route) => {
    // Determine priority and change frequency based on the page
    let changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never" = "monthly";
    let priority = 0.5;

    if (route === "") {
      changeFrequency = "daily";
      priority = 1.0;
    } else if (route === "/updates" || route === "/status" || route === "/quiz" || route === "/vlogs") {
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
  const dynamicBlogRoutes = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // 3. Fetch dynamic daily status logs and append them
  const statuses = await getAllStatuses();
  const dynamicStatusRoutes = statuses.map((status) => ({
    url: `${baseUrl}/status/${encodeURIComponent(status.date || status.id)}`,
    lastModified: status.updatedAt ? new Date(status.updatedAt) : new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // 4. Fetch all published quiz dates and append them
  const quizDates = await getAllQuizDates();
  const dynamicQuizRoutes = quizDates.map((date) => ({
    url: `${baseUrl}/quiz/${date}`,
    lastModified: new Date(date),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // 5. Fetch dynamic vlog videos and append them
  const vlogVideos = await getAllVlogVideos();
  const dynamicVlogRoutes = vlogVideos.map((video) => ({
    url: `${baseUrl}/vlogs/${video.videoId}`,
    lastModified: video.uploadDate ? new Date(video.uploadDate) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...dynamicBlogRoutes, ...dynamicStatusRoutes, ...dynamicQuizRoutes, ...dynamicVlogRoutes];
}
