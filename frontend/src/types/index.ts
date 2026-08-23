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
  | "snapchat"
  | "website";

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
  content: string;
  html?: string;
  imageUrl?: string;
  imagePath?: string;
  writtenBy?: string;
  category?: string;
  contentType?: "markdown" | "tiptap";
  seoTitle?: string;
  reads?: number;
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

export interface DailyStatus {
  id: string;
  date: string;
  statusText?: string;
  tasks?: string[];
  study?: {
    hours: number;
    subject: string;
    questions: number;
    mock?: string;
  };
  project?: {
    hours: number;
    tasks: string[];
  };
  content?: {
    videos?: number;
    posts?: number;
    blogs?: number;
  };
  health?: {
    sleep: number;
    healthyEating: number;
  };
  finance?: {
    expense: number;
    income: number;
  };
  mood?: number;
  bestMoment?: string;
  lessonLearned?: string;
  updatedAt: string;
}

export interface AmazonPick {
  id: string;
  title: string;
  category: string;
  affiliateUrl: string;
  imageUrl?: string;
  price?: string;
  description?: string;
  isFeatured?: boolean;
  inStock?: boolean;
  asin?: string;
  rating?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface StudyPick {
  id: string;
  productId: string;
  productUrl: string;
  title: string;
  category?: string;
  imageUrl?: string;
  price?: string;
  salePrice?: string;
  availability?: "In Stock" | "Out of Stock" | string;
  description?: string;
  isFeatured?: boolean;
  displayOrder?: number;
  createdAt: string;
  updatedAt?: string;
}


