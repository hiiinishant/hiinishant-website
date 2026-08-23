"use client";

import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";

interface BlogReadTrackerProps {
  slug: string;
  initialReads?: number;
}

export default function BlogReadTracker({ slug, initialReads = 0 }: BlogReadTrackerProps) {
  const [reads, setReads] = useState<number>(initialReads);

  useEffect(() => {
    if (typeof window === "undefined" || !slug) return;

    // Count once per visitor per article per session using sessionStorage
    const sessionKey = `blog_read_${slug}`;
    const alreadyCountedInSession = sessionStorage.getItem(sessionKey);

    if (!alreadyCountedInSession) {
      // Mark as read in this tab session
      try {
        sessionStorage.setItem(sessionKey, "true");
      } catch {
        // Ignore if storage is disabled/blocked in private mode
      }

      // Background request to increment atomic view counter in Firestore
      fetch(apiUrl(`/api/blog/${slug}/view`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            if (typeof data.reads === "number") {
              setReads(data.reads);
            }
          }
        })
        .catch((err) => {
          // Gracefully catch errors so reading is never affected
          console.debug("[BlogReadTracker] View count request failed silently:", err);
        });
    }
  }, [slug]);

  return <span>{reads.toLocaleString()} reads</span>;
}
