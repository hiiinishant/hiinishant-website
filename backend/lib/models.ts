// TypeScript interfaces for Firestore data type safety
// These interfaces are used for type checking when working with Firestore documents

export interface Blog {
  slug: string;
  title: string;
  excerpt?: string;
  date?: string;
  readTime?: string;
  tags: string[];
  featured: boolean;
  content: string;
}

export interface ContactMessage {
  name: string;
  email: string;
  subject: string;
  message: string;
  date?: string;
  read: boolean;
}

export interface FuturePlan {
  title: string;
  description: string;
  targetDate?: string;
  category: string;
  status: string;
}

export interface DailyStatus {
  date: string;
  statusText: string;
  tasks: string[];
  updatedAt?: string;
}

export interface UpdateItem {
  category: string;
  title: string;
  description: string;
  date: string;
  href?: string;
  badge?: string;
  meta?: string;
  isNewItem?: boolean;
  thumbnail?: string;
}

export interface NewsletterSubscriber {
  email: string;
  date?: string;
}

export interface MusicSettings {
  key: string;
  playlistUrl: string;
  playlistId: string;
  playlistTitle: string;
  playlistThumbnail: string;
  updatedAt: string;
}
