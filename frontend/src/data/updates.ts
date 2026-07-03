export interface UpdateItem {
  id: string;
  category: "video" | "instagram";
  title: string;
  description: string;
  date: string;
  href?: string;
  thumbnail?: string;
  badge?: string;
  meta?: string;
  isNew?: boolean;
}

export const latestUpdates: UpdateItem[] = [
  {
    id: "yt-vlog-1",
    category: "video",
    title: "How I Study 10+ Hours a Day for Exams (Scientific Method)",
    description: "Deep-diving into active recall, spaced repetition, and how I maintain focus for 10+ hours a day without burning out.",
    date: "2026-06-28",
    href: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop",
    badge: "Study Vlog",
    meta: "YouTube • 15K Views",
    isNew: true,
  },
  {
    id: "insta-1",
    category: "instagram",
    title: "Building 2 AM Study — The Behind-the-Scenes Journey",
    description: "Late nights, coffee, and constant building. From a simple study routine to a platform trusted by 100K+ students. Here is a look at what we are working on next! 🚀📚",
    date: "2026-06-25",
    href: "https://instagram.com/hiiinishant",
    thumbnail: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=600&auto=format&fit=crop",
    badge: "Instagram",
    meta: "Instagram • 1.2K Likes",
    isNew: true,
  },
  {
    id: "yt-vlog-2",
    category: "video",
    title: "A Day in the Life of an EdTech Founder & Student",
    description: "Balancing university lectures, filming content, and writing code for the new 2 AM Study platform.",
    date: "2026-06-20",
    href: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnail: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?q=80&w=600&auto=format&fit=crop",
    badge: "Vlog",
    meta: "YouTube • 10K Views",
    isNew: false,
  },
  {
    id: "insta-C37jQPcv03g",
    category: "instagram",
    title: "Nishant's latest College Photoshoot",
    description: "Photoshoot - campus memories and new milestones. Reflecting on the journey so far. 🚀",
    date: "2024-02-29",
    href: "https://www.instagram.com/p/C37jQPcv03gvRaXnQRfhO4F2AqXkGG-E9ib2EA0/",
    thumbnail: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=600&auto=format&fit=crop",
    badge: "Instagram",
    meta: "hiiinishant • View Post",
    isNew: false,
  }
];

export const categories = [
  { id: "all" as const, label: "All Updates", icon: "grid" },
  { id: "video" as const, label: "YouTube", icon: "youtube" },
  { id: "instagram" as const, label: "Instagram", icon: "instagram" },
] as const;
