import type { Metadata } from "next";
import BlogClientPage from "./BlogClientPage";
import { getAllBlogPosts } from "@/data/blog";

export const metadata: Metadata = {
  title: "Blog — Nishant Kumar | Thoughts on Education & Entrepreneurship",
  description:
    "Read blogs by Nishant Kumar (hiiinishant) — founder of 2 AM Study. Articles on education, entrepreneurship, student life, Chandigarh University experiences, and building edtech startups in India.",
  keywords: [
    "Nishant Kumar blog",
    "hiiinishant blog",
    "2 AM Study blog",
    "nishant kumar articles",
    "edtech blog India",
    "student entrepreneur blog",
    "education entrepreneurship blog",
  ],
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "Blog by Nishant Kumar — hiiinishant",
    description: "Insights on education, entrepreneurship, and student life by Nishant Kumar, founder of 2 AM Study.",
    url: "https://hiiinishant.com/blog",
  },
};

export default async function BlogPage() {
  const blogPosts = await getAllBlogPosts();
  return <BlogClientPage posts={blogPosts} />;
}
