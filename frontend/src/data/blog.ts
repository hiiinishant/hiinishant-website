import type { BlogPost } from "@/types";
import { apiUrl } from "@/lib/api";

export function markdownToHtml(markdown: string): string {
  const lines = markdown.split("\n");
  let html = "";
  let inList = false;
  let listType: "ul" | "ol" | null = null;

  const parseInline = (text: string) => {
    let result = text;
    result = result.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    result = result.replace(/__(.*?)__/g, "<strong>$1</strong>");
    result = result.replace(/\*(.*?)\*/g, "<em>$1</em>");
    result = result.replace(/_(.*?)_/g, "<em>$1</em>");
    result = result.replace(/`(.*?)`/g, '<code class="px-1.5 py-0.5 rounded bg-white/10 text-accent font-mono text-sm">$1</code>');
    return result;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (inList && (!trimmed || (!trimmed.startsWith("- ") && !/^\d+\.\s/.test(trimmed)))) {
      html += listType === "ul" ? "</ul>\n" : "</ol>\n";
      inList = false;
      listType = null;
    }

    if (!trimmed) continue;

    if (trimmed.startsWith("# ")) {
      html += `<h1 class="text-3xl sm:text-4xl font-extrabold text-white mt-8 mb-4">${parseInline(trimmed.substring(2))}</h1>\n`;
    } else if (trimmed.startsWith("## ")) {
      html += `<h2 class="text-2xl sm:text-3xl font-bold text-white mt-8 mb-4">${parseInline(trimmed.substring(3))}</h2>\n`;
    } else if (trimmed.startsWith("### ")) {
      html += `<h3 class="text-xl sm:text-2xl font-bold text-white mt-6 mb-3">${parseInline(trimmed.substring(4))}</h3>\n`;
    } else if (trimmed.startsWith("#### ")) {
      html += `<h4 class="text-lg sm:text-xl font-bold text-white mt-6 mb-2">${parseInline(trimmed.substring(5))}</h4>\n`;
    } else if (trimmed.startsWith("> ")) {
      html += `<blockquote class="border-l-4 border-accent bg-white/5 pl-4 py-2 my-4 text-brand-300 italic">${parseInline(trimmed.substring(2))}</blockquote>\n`;
    } else if (trimmed.startsWith("- ")) {
      if (!inList || listType !== "ul") {
        if (inList) html += listType === "ul" ? "</ul>\n" : "</ol>\n";
        html += '<ul class="list-disc pl-6 my-4 space-y-2 text-brand-300">\n';
        inList = true;
        listType = "ul";
      }
      html += `  <li>${parseInline(trimmed.substring(2))}</li>\n`;
    } else if (/^\d+\.\s/.test(trimmed)) {
      const match = trimmed.match(/^(\d+)\.\s(.*)/);
      if (match) {
        if (!inList || listType !== "ol") {
          if (inList) html += listType === "ul" ? "</ul>\n" : "</ol>\n";
          html += '<ol class="list-decimal pl-6 my-4 space-y-2 text-brand-300">\n';
          inList = true;
          listType = "ol";
        }
        html += `  <li>${parseInline(match[2])}</li>\n`;
      }
    } else {
      html += `<p class="text-brand-300 leading-relaxed text-lg mb-6">${parseInline(trimmed)}</p>\n`;
    }
  }

  if (inList) {
    html += listType === "ul" ? "</ul>\n" : "</ol>\n";
  }

  return html;
}

export async function getAllBlogPosts(): Promise<BlogPost[]> {
  try {
    // Avoid caching so blogs update immediately
    const res = await fetch(apiUrl("/api/blog"), { cache: 'no-store' });
    if (!res.ok) return [];
    
    const blogs = await res.json();
    return blogs.map((b: any) => ({
      ...b,
      content: [b.content],
      html: markdownToHtml(b.content)
    }));
  } catch (error) {
    console.error("Error reading blog posts:", error);
    return [];
  }
}

export async function getBlogPost(slug: string): Promise<BlogPost | undefined> {
  const blogs = await getAllBlogPosts();
  return blogs.find((post) => post.slug === slug);
}

export async function getFeaturedPosts(): Promise<BlogPost[]> {
  const blogs = await getAllBlogPosts();
  return blogs.filter((post) => post.featured);
}
