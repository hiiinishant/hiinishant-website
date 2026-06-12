import type { Metadata } from "next";
import BlogClientPage from "./BlogClientPage";
import { blogPosts } from "@/data/blog";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Thoughts on education, entrepreneurship, community building, and the journey of building 2 AM Study.",
};

export default function BlogPage() {
  return <BlogClientPage posts={blogPosts} />;
}
