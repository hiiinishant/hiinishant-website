import type { Metadata } from "next";
import BlogClientPage from "./BlogClientPage";
import { getAllBlogPosts } from "@/data/blog";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Thoughts on education, entrepreneurship, community building, and the journey of building 2 AM Study.",
  alternates: {
    canonical: "/blog",
  },
};

export default async function BlogPage() {
  const blogPosts = await getAllBlogPosts();
  return <BlogClientPage posts={blogPosts} />;
}
