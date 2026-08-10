export interface MusicSettings {
  playlistUrl: string;
  playlistId: string;
  playlistTitle: string;
  playlistThumbnail: string;
  initialTracks?: { videoId: string; title: string }[];
}

let youtubeApiPromise: Promise<void> | null = null;

export function loadYouTubeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();

  if (!youtubeApiPromise) {
    youtubeApiPromise = new Promise((resolve) => {
      if (window.YT?.Player) {
        resolve();
        return;
      }

      const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
      if (existing) {
        const prev = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
          prev?.();
          resolve();
        };
        // Polling fallback in case window.onYouTubeIframeAPIReady already fired
        const checkInterval = setInterval(() => {
          if (window.YT?.Player) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
        return;
      }

      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScript = document.getElementsByTagName("script")[0];
      firstScript.parentNode?.insertBefore(tag, firstScript);

      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        resolve();
      };

      const checkInterval = setInterval(() => {
        if (window.YT?.Player) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  }

  return youtubeApiPromise;
}

const titleCache: Record<string, string> = {};

export async function fetchVideoTitle(videoId: string, index?: number): Promise<string> {
  if (!videoId) return index !== undefined ? `Song ${index + 1}` : "Unknown Track";
  if (titleCache[videoId]) return titleCache[videoId];

  if (typeof window !== "undefined") {
    try {
      const cached = sessionStorage.getItem(`yt_title_${videoId}`);
      if (cached) {
        titleCache[videoId] = cached;
        return cached;
      }
    } catch {}
  }

  try {
    const res = await fetch(
      `https://noembed.com/embed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`
    );
    if (!res.ok) throw new Error("noembed fail");
    const data = await res.json();
    const title = data.title || (index !== undefined ? `Song ${index + 1}` : `Video ${videoId}`);
    titleCache[videoId] = title;
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(`yt_title_${videoId}`, title);
      } catch {}
    }
    return title;
  } catch {
    const fallback = index !== undefined ? `Song ${index + 1}` : `Video ${videoId}`;
    return fallback;
  }
}

export function videoThumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
}

