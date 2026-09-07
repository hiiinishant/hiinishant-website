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

/**
 * Curated map of known video IDs to avoid any generic "Song X" or "Track X" placeholders.
 * Even if third-party YouTube oEmbed returns 401 Unauthorized for restricted songs,
 * these guaranteed clean titles resolve synchronously.
 */
export const KNOWN_VIDEO_TITLES: Record<string, string> = {
  "uNboFgKLGDY": "KAUN TUJHE — M.S. Dhoni (Armaan Malik)",
  "hoNb6HuNmU0": "Khairiyat (Bonus Track) — Chhichhore (Arijit Singh)",
  "USccSZnS8MQ": "Thoda Thoda Pyaar — Stebin Ben",
  "9pIXNy-pS10": "Khairiyat — Chhichhore (Arijit Singh)",
  "qvQmaLb6j2k": "Until I Found You — Stephen Sanchez (Guitar Cover)",
  "O6JTWVkJYtM": "Chand Ke Paar Chalo — Udit Narayan & Alka Yagnik",
  "y5GQECf5JRg": "Main Yahaan Hoon — Veer-Zaara (Lofi Reverb)",
  "3HX6WCx2djU": "Suno Na Sangemarmar — Youngistaan (Arijit Singh)",
  "-lDmXk8pBNI": "Kisi Se Tum Pyar Karo — Andaaz (Kumar Sanu & Alka Yagnik)",
  "p_oYiDR6S0E": "Chal Tere Ishq Mein — Gadar 2 (Neeti Mohan)",
  "QWpVWCH6kDs": "Chal Tere Ishq Mein — Gadar 2 (Vishal Mishra)",
  "I2nQfiux2sk": "Musafir Jaane Wale — Gadar (Udit Narayan)",
  "PzmNssVLcLQ": "Khulke Jeene Ka — Dil Bechara (A.R. Rahman & Arijit Singh)",
  "Y9ozt29tzgs": "Naino Ne Baandhi — Gold (Yasser Desai & Arko)",
  "kpqidTRiESk": "Tera Fitoor — Genius (Arijit Singh)",
  "siw7-MTgE4s": "Hamein Tumse Hua Hai Pyar — Ab Tumhare Hawale Watan Sathiyo",
  "1nWQs6IxTrY": "Tum Tak — Raanjhanaa (A. R. Rahman & Javed Ali)",
  "kKljXVVkgS4": "Sanam Teri Kasam — Title Track (Ankit Tiwari & Palak Muchhal)",
  "8v-TWxPWIWc": "Humsafar — Badrinath Ki Dulhania (Akhil Sachdeva)",
  "1ZNaoJ7jEiI": "Apne To Apne Hote Hain — Apne (Himesh Reshammiya)",
  "E1sBogmTH0Q": "Aaj Mere Yaar Di Hai Shadi — Dosti: Friends Forever",
  "Xq4Y4vXsWEA": "Mujhe Haq Hai — Vivah (Udit Narayan & Shreya Ghoshal)",
  "w--g30WTfBs": "O Mere Dil Ke Chain — SANAM",
  "M6Ul3ASaFLU": "Mere Mehboob Qayamat Hogi — SANAM",
  "Yqj1_V90KJo": "Chura Ke Dil Mera — Main Khiladi Tu Anari",
  "D61BvxAOxm0": "Kaun Disa Mein Leke Chala Re Batohiya — Nadiya Ke Paar",
  "TmRgK-pXH9c": "Humnava Mere — Jubin Nautiyal",
  "5gwy0gcjIkI": "Tere Sang Yaara — Rustom (Atif Aslam)",
  "pHu4PLhuKgQ": "Isq Risk — Mere Brother Ki Dulhan (Rahat Fateh Ali Khan)",
};

const titleCache: Record<string, string> = {};

export function getKnownOrCachedTitle(videoId: string): string | null {
  if (!videoId) return null;
  if (KNOWN_VIDEO_TITLES[videoId]) return KNOWN_VIDEO_TITLES[videoId];
  if (titleCache[videoId]) return titleCache[videoId];
  if (typeof window !== "undefined") {
    try {
      const cached = sessionStorage.getItem(`yt_title_${videoId}`);
      if (cached && !cached.startsWith("Song ") && !cached.startsWith("Track ") && !cached.startsWith("Video ")) {
        titleCache[videoId] = cached;
        return cached;
      }
    } catch {}
  }
  return null;
}

export function cacheVideoTitle(videoId: string, title: string): void {
  if (!videoId || !title) return;
  const clean = title.trim();
  if (!clean || clean.startsWith("Song ") || clean.startsWith("Track ") || clean.startsWith("Video ")) return;
  titleCache[videoId] = clean;
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(`yt_title_${videoId}`, clean);
    } catch {}
  }
}

export async function fetchVideoTitle(videoId: string, index?: number): Promise<string> {
  if (!videoId) return index !== undefined ? `Song ${index + 1}` : "Unknown Track";

  // Check known titles first (instant synchronous resolution)
  if (KNOWN_VIDEO_TITLES[videoId]) return KNOWN_VIDEO_TITLES[videoId];
  if (titleCache[videoId]) return titleCache[videoId];

  if (typeof window !== "undefined") {
    try {
      const cached = sessionStorage.getItem(`yt_title_${videoId}`);
      if (cached && !cached.startsWith("Song ") && !cached.startsWith("Track ") && !cached.startsWith("Video ")) {
        titleCache[videoId] = cached;
        return cached;
      }
    } catch {}
  }

  // 1. Try YouTube official oEmbed endpoint (fast, accurate)
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`,
      { cache: "force-cache" }
    );
    if (res.ok) {
      const data = await res.json();
      if (data.title) {
        cacheVideoTitle(videoId, data.title);
        return data.title;
      }
    }
  } catch {}

  // 2. Try our internal server route (bypasses CORS & fetches watch page HTML on server)
  try {
    const res = await fetch(`/api/music/title?videoId=${encodeURIComponent(videoId)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.title) {
        cacheVideoTitle(videoId, data.title);
        return data.title;
      }
    }
  } catch {}

  // 3. Fallback to noembed.com
  try {
    const res = await fetch(
      `https://noembed.com/embed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`
    );
    if (res.ok) {
      const data = await res.json();
      if (data.title) {
        cacheVideoTitle(videoId, data.title);
        return data.title;
      }
    }
  } catch {}

  const fallback = KNOWN_VIDEO_TITLES[videoId] || (index !== undefined ? `Song ${index + 1}` : `Video ${videoId}`);
  return fallback;
}

/**
 * Fetch video titles in controlled parallel batches (concurrency: 3)
 * to avoid network congestion and update track list progressively.
 */
export async function fetchAllVideoTitles(
  videoIds: string[],
  onTitleLoaded?: (index: number, title: string) => void
): Promise<string[]> {
  const titles = new Array<string>(videoIds.length);
  let cursor = 0;
  const concurrency = 3;

  async function worker() {
    while (cursor < videoIds.length) {
      const idx = cursor++;
      const id = videoIds[idx];
      const title = await fetchVideoTitle(id, idx);
      titles[idx] = title;
      onTitleLoaded?.(idx, title);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, videoIds.length) }, () => worker());
  await Promise.all(workers);
  return titles;
}

export function videoThumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
}
