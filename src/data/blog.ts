import fs from "fs";
import path from "path";
import type { BlogPost } from "@/types";

const CONTENT_DIR = path.join(process.cwd(), "src/content/blog");

function parseInline(text: string): string {
  let result = text;
  // Bold **text**
  result = result.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  result = result.replace(/__(.*?)__/g, "<strong>$1</strong>");
  // Italic *text*
  result = result.replace(/\*(.*?)\*/g, "<em>$1</em>");
  result = result.replace(/_(.*?)_/g, "<em>$1</em>");
  // Code `code`
  result = result.replace(/`(.*?)`/g, '<code class="px-1.5 py-0.5 rounded bg-white/10 text-accent font-mono text-sm">$1</code>');
  return result;
}

export function markdownToHtml(markdown: string): string {
  const lines = markdown.split("\n");
  let html = "";
  let inList = false;
  let listType: "ul" | "ol" | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Handle list termination
    if (inList && (!trimmed || (!trimmed.startsWith("- ") && !/^\d+\.\s/.test(trimmed)))) {
      html += listType === "ul" ? "</ul>\n" : "</ol>\n";
      inList = false;
      listType = null;
    }

    if (!trimmed) {
      continue;
    }

    // Headers
    if (trimmed.startsWith("# ")) {
      html += `<h1 class="text-3xl sm:text-4xl font-extrabold text-white mt-8 mb-4">${parseInline(trimmed.substring(2))}</h1>\n`;
    } else if (trimmed.startsWith("## ")) {
      html += `<h2 class="text-2xl sm:text-3xl font-bold text-white mt-8 mb-4">${parseInline(trimmed.substring(3))}</h2>\n`;
    } else if (trimmed.startsWith("### ")) {
      html += `<h3 class="text-xl sm:text-2xl font-bold text-white mt-6 mb-3">${parseInline(trimmed.substring(4))}</h3>\n`;
    } else if (trimmed.startsWith("#### ")) {
      html += `<h4 class="text-lg sm:text-xl font-bold text-white mt-6 mb-2">${parseInline(trimmed.substring(5))}</h4>\n`;
    }
    // Blockquote
    else if (trimmed.startsWith("> ")) {
      html += `<blockquote class="border-l-4 border-accent bg-white/5 pl-4 py-2 my-4 text-brand-300 italic">${parseInline(trimmed.substring(2))}</blockquote>\n`;
    }
    // Unordered List Item
    else if (trimmed.startsWith("- ")) {
      if (!inList || listType !== "ul") {
        if (inList) html += listType === "ul" ? "</ul>\n" : "</ol>\n";
        html += '<ul class="list-disc pl-6 my-4 space-y-2 text-brand-300">\n';
        inList = true;
        listType = "ul";
      }
      html += `  <li>${parseInline(trimmed.substring(2))}</li>\n`;
    }
    // Ordered List Item
    else if (/^\d+\.\s/.test(trimmed)) {
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
    }
    // Normal paragraph
    else {
      html += `<p class="text-brand-300 leading-relaxed text-lg mb-6">${parseInline(trimmed)}</p>\n`;
    }
  }

  // Close any open lists at the end
  if (inList) {
    html += listType === "ul" ? "</ul>\n" : "</ol>\n";
  }

  return html;
}

function parseMarkdownFile(filename: string): BlogPost {
  const filePath = path.join(CONTENT_DIR, filename);
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const slug = filename.replace(/\.md$/, "");

  let title = "";
  let excerpt = "";
  let date = "";
  let readTime = "";
  let tags: string[] = [];
  let featured = false;
  let rawBody = "";

  if (fileContent.startsWith("---")) {
    const parts = fileContent.split("---");
    if (parts.length >= 3) {
      const frontmatter = parts[1];
      rawBody = parts.slice(2).join("---").trim();

      const lines = frontmatter.split("\n");
      let currentKey = "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Check if line is a list item for tags
        if (trimmed.startsWith("-") && currentKey === "tags") {
          const val = trimmed.substring(1).trim().replace(/^['"]|['"]$/g, "");
          tags.push(val);
          continue;
        }

        const colonIndex = trimmed.indexOf(":");
        if (colonIndex !== -1) {
          const key = trimmed.substring(0, colonIndex).trim();
          let val = trimmed.substring(colonIndex + 1).trim();

          // Remove wrapping quotes if any
          val = val.replace(/^['"]|['"]$/g, "");

          if (key === "title") title = val;
          else if (key === "excerpt") excerpt = val;
          else if (key === "date") date = val;
          else if (key === "readTime") readTime = val;
          else if (key === "featured") featured = val === "true";
          else if (key === "tags") {
            currentKey = "tags";
            // Handle inline array like: [Study Tips, Mindset]
            if (val.startsWith("[") && val.endsWith("]")) {
              tags = val
                .substring(1, val.length - 1)
                .split(",")
                .map((t) => t.trim().replace(/^['"]|['"]$/g, ""))
                .filter(Boolean);
            }
          }
        }
      }
    } else {
      rawBody = fileContent;
    }
  } else {
    rawBody = fileContent;
  }

  // Fallback content parsing for paragraphs
  const content = rawBody
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const html = markdownToHtml(rawBody);

  return {
    slug,
    title: title || slug,
    excerpt: excerpt || "",
    date: date || new Date().toISOString().split("T")[0],
    readTime: readTime || "1 min read",
    tags,
    featured,
    content,
    html,
  };
}

export function getAllBlogPosts(): BlogPost[] {
  try {
    if (!fs.existsSync(CONTENT_DIR)) {
      return [];
    }
    const files = fs.readdirSync(CONTENT_DIR);
    const posts = files
      .filter((file) => file.endsWith(".md"))
      .map((file) => parseMarkdownFile(file));

    // Sort posts by date descending
    return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error("Error reading blog posts:", error);
    return [];
  }
}

export const blogPosts: BlogPost[] = getAllBlogPosts();

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

export function getFeaturedPosts(): BlogPost[] {
  return blogPosts.filter((post) => post.featured);
}
