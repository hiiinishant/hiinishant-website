/**
 * galleryServer.ts
 * Server-side data fetchers for gallery photos.
 * Used by /gallery/[id]/page.tsx and sitemap.ts
 */

import type { GalleryPhoto } from "@/types";

const LIVE_BACKEND = "https://hiinishant-backend.onrender.com";

function getApiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL || LIVE_BACKEND;
}

/**
 * Fetch a single gallery photo by ID.
 * Used for standalone photo SEO page (/gallery/[id]).
 */
export async function getGalleryPhotoById(id: string): Promise<GalleryPhoto | null> {
  try {
    const res = await fetch(`${getApiBase()}/api/gallery/${encodeURIComponent(id)}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data || null;
  } catch {
    return null;
  }
}

/**
 * Fetch all gallery photos.
 * Used by sitemap.ts to index every photo page.
 */
export async function getAllGalleryPhotos(): Promise<GalleryPhoto[]> {
  try {
    const res = await fetch(`${getApiBase()}/api/gallery`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
