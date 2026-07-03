export type SocialPlatform =
  | "twitter"
  | "linkedin"
  | "instagram"
  | "youtube"
  | "telegram"
  | "email"
  | "quora"
  | "github"
  | "medium"
  | "facebook"
  | "snapchat";

export interface SocialLink {
  platform: SocialPlatform;
  label: string;
  handle: string;
  href: string;
  description?: string;
}

export interface Project {
  id: string;
  name: string;
  tagline: string;
  description: string;
  status: "active" | "building" | "launched";
  year: string;
  href?: string;
  tags: string[];
  website?: string;
  youtube?: string;
  instagram?: string;
}

export interface Achievement {
  id: string;
  value: string;
  label: string;
  year?: string;
  description?: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  tags: string[];
  featured?: boolean;
  content: string[];
  html?: string;
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  type: "guide" | "template" | "tool" | "course";
  href: string;
  free: boolean;
  tags: string[];
}

export interface NowItem {
  category: string;
  items: string[];
}

export interface GalleryPhoto {
  id: string;
  imageUrl: string;
  imagePath: string;
  title: string;
  story: string;
  date: string;
  category: "Daily Moments" | "School" | "College" | "Achievements";
  createdAt: number;
}

