import { Router } from 'express';
import { firestore } from '../lib/firebaseAdmin';
import { requireAuth } from '../middleware/auth';

const router = Router();

const DEFAULT_VLOG_PLAYLIST_URL =
  process.env.VLOG_PLAYLIST_URL ||
  "https://www.youtube.com/playlist?list=PL7WyIzpQW_0aEsXP5PyWyjpmlGkEeU5nr";

const DEFAULT_INITIAL_VIDEOS = [
  {
    videoId: "-zCZyulh9I8",
    title: "Diwali Celebration in my college  | Chandigarh University | Nishant's World of Vibes",
    description: "By Hiii Nishant",
  },
  {
    videoId: "U68KQP2s0Qk",
    title: "Holi celebration in my college  | Happy Holi 🎉 | Chandigarh University | Nishant Kumar Vlogs",
    description: "By Hiii Nishant",
  },
  {
    videoId: "9qElnk3VIAM",
    title: "Chandigarh university Diwali Celebration | Diwali Special Video 2023 | Vlog Video | Nishant Kumar",
    description: "By Hiii Nishant",
  },
  {
    videoId: "qZflRQ3ZdG0",
    title: "Ek diwali aisa bhi 👀 | Diwali celebration | Nishant Kumar | vlog video",
    description: "By Hiii Nishant",
  },
  {
    videoId: "fDZxl3m0TZw",
    title: "Chandigarh University | MAKA TROPHY  champion 🔥",
    description: "By Hiii Nishant",
  },
  {
    videoId: "98bwPXP6bBY",
    title: "Lohri Celebration in my college | Chandigarh University 🎇",
    description: "By Hiii Nishant",
  },
  {
    videoId: "i6zlm5wal_o",
    title: "First Time खाना बनाया | Part - 1| Chandigarh University Student Life | College Student Daily Routine",
    description: "By Hiii Nishant",
  },
  {
    videoId: "dLbYPk0ZiLc",
    title: "International Women's Day in Chandigarh University 🔥 | Chandigarh University",
    description: "By Hiii Nishant",
  },
  {
    videoId: "x0ZCdKOOsxk",
    title: "Mahashivratri Special 🧡 | Happy Mahashivratri Guys | Near Chandigarh University | Nishant Kumar vlog",
    description: "By Hiii Nishant",
  },
  {
    videoId: "LGlHdvB_cTE",
    title: "My College Life 🙂 | Chandigarh University | CU | Nishant Kumar shorts video",
    description: "By Hiii Nishant",
  },
  {
    videoId: "_AyCbGNiX2k",
    title: "Nishant shorts video | Chandigarh University student short video | college student",
    description: "By Hiii Nishant",
  },
  {
    videoId: "fb2K1XW_8cE",
    title: "Raat me bahar 😱 | New vlog video | Nishant Kumar | Chandigarh university student",
    description: "By Hiii Nishant",
  },
  {
    videoId: "2UoNmuJfPWQ",
    title: "Saraswati Group of Colleges | SGC | Fresher's Party Vlog | Daily Vlog | Nishant Kumar",
    description: "By Hiii Nishant",
  },
  {
    videoId: "NzIOLBaHvaI",
    title: "Jubin Nautiyal in my college | Chandigarh University | Nishant Vlogs",
    description: "By Hiii Nishant",
  },
].map((v) => ({
  ...v,
  thumbnail: `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
}));

function extractPlaylistId(url: string): string | null {
  if (!url) return null;
  const listMatch = url.match(/[?&]list=([a-zA-Z0-9_-]{10,})/);
  if (listMatch) return listMatch[1];
  const pathMatch = url.match(/youtube\.com\/playlist\/([a-zA-Z0-9_-]{10,})/);
  if (pathMatch) return pathMatch[1];
  return null;
}

async function fetchPlaylistMetadata(playlistId: string): Promise<{ title: string; thumbnail: string }> {
  const playlistUrl = "https://www.youtube.com/playlist?list=" + playlistId;
  try {
    const res = await fetch(
      "https://www.youtube.com/oembed?url=" + encodeURIComponent(playlistUrl) + "&format=json"
    );
    if (!res.ok) throw new Error("oEmbed failed");
    const data = (await res.json()) as { title?: string; thumbnail_url?: string };
    return {
      title: data.title || "Nishant's Vlog Playlist",
      thumbnail: data.thumbnail_url || "https://i.ytimg.com/vi/" + playlistId + "/hqdefault.jpg",
    };
  } catch {
    return {
      title: "Nishant's Vlog Playlist",
      thumbnail: "https://i.ytimg.com/vi/" + playlistId + "/hqdefault.jpg",
    };
  }
}

async function fetchPlaylistVideos(playlistId: string): Promise<Array<{ videoId: string; title: string; description: string; thumbnail: string }>> {
  if (!playlistId) return DEFAULT_INITIAL_VIDEOS;
  try {
    const playlistUrl = `https://www.youtube.com/playlist?list=${playlistId}`;
    const res = await fetch(playlistUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    if (!res.ok) return DEFAULT_INITIAL_VIDEOS;
    const html = await res.text();

    const matches = [...html.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)];
    const uniqueVideoIds: string[] = [];
    const seen = new Set<string>();
    for (const m of matches) {
      const id = m[1];
      if (!seen.has(id)) {
        seen.add(id);
        uniqueVideoIds.push(id);
      }
    }

    if (uniqueVideoIds.length === 0) return DEFAULT_INITIAL_VIDEOS;

    const idsToFetch = uniqueVideoIds.slice(0, 50);
    const videoItems = await Promise.all(
      idsToFetch.map(async (videoId) => {
        try {
          const oembedRes = await fetch(
            `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
          );
          if (oembedRes.ok) {
            const data = (await oembedRes.json()) as { title?: string; author_name?: string; thumbnail_url?: string };
            return {
              videoId,
              title: data.title || `Vlog ${videoId}`,
              description: data.author_name ? `By ${data.author_name}` : "",
              thumbnail: data.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            };
          }
        } catch {}
        return {
          videoId,
          title: `Vlog ${videoId}`,
          description: "",
          thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        };
      })
    );

    return videoItems.length > 0 ? videoItems : DEFAULT_INITIAL_VIDEOS;
  } catch (err) {
    console.warn("Failed to fetch playlist videos dynamically:", err);
    return DEFAULT_INITIAL_VIDEOS;
  }
}

async function buildVlogSettings(playlistUrl: string) {
  const playlistId = extractPlaylistId(playlistUrl) || "";
  if (!playlistId) {
    return {
      channelHandle: "@hiiinishant",
      channelName: "Nishant Kumar",
      playlistUrl: "",
      playlistId: "",
      playlistTitle: "Nishant's Vlogs",
      playlistThumbnail: "",
      initialVideos: DEFAULT_INITIAL_VIDEOS,
    };
  }
  const metadata = await fetchPlaylistMetadata(playlistId);
  const initialVideos = await fetchPlaylistVideos(playlistId);
  return {
    channelHandle: "@hiiinishant",
    channelName: "Nishant Kumar",
    playlistUrl: playlistUrl.trim(),
    playlistId,
    playlistTitle: metadata.title,
    playlistThumbnail: metadata.thumbnail,
    initialVideos,
  };
}

router.get('/', async (req, res) => {
  try {
    if (!firestore) {
      res.status(200).json(await buildVlogSettings(DEFAULT_VLOG_PLAYLIST_URL));
      return;
    }

    const doc = await firestore.collection('vlogSettings').doc('default').get();
    if (doc.exists && doc.data()?.playlistId) {
      const data = doc.data()!;
      res.status(200).json({
        channelHandle: data.channelHandle || "@hiiinishant",
        channelName: data.channelName || "Nishant Kumar",
        playlistUrl: data.playlistUrl || "",
        playlistId: data.playlistId || "",
        playlistTitle: data.playlistTitle || "Nishant's Vlog Playlist",
        playlistThumbnail: data.playlistThumbnail || "",
        initialVideos: data.initialVideos || DEFAULT_INITIAL_VIDEOS,
      });
      return;
    }
    res.status(200).json(await buildVlogSettings(DEFAULT_VLOG_PLAYLIST_URL));
  } catch {
    res.status(200).json(await buildVlogSettings(DEFAULT_VLOG_PLAYLIST_URL));
  }
});

const updateVlogHandler = async (req: any, res: any) => {
  try {
    if (!firestore) {
      res.status(503).json({ error: "Database not available." });
      return;
    }

    const { playlistUrl } = req.body;
    if (!playlistUrl || typeof playlistUrl !== "string") {
      res.status(400).json({ error: "A valid YouTube playlist URL is required." });
      return;
    }

    const playlistId = extractPlaylistId(playlistUrl.trim());
    if (!playlistId) {
      res.status(400).json({ error: "Could not find a playlist ID in that URL. Use a link like https://www.youtube.com/playlist?list=..." });
      return;
    }

    const metadata = await fetchPlaylistMetadata(playlistId);
    const fetchedVideos = await fetchPlaylistVideos(playlistId);
    const updatedData = {
      channelHandle: req.body.channelHandle || "@hiiinishant",
      channelName: req.body.channelName || "Nishant Kumar",
      playlistUrl: playlistUrl.trim(),
      playlistId,
      playlistTitle: metadata.title,
      playlistThumbnail: metadata.thumbnail,
      initialVideos: fetchedVideos,
      updatedAt: new Date().toISOString(),
    };

    await firestore.collection('vlogSettings').doc('default').set(updatedData, { merge: true });

    const doc = await firestore.collection('vlogSettings').doc('default').get();
    const data = doc.data() || {};

    res.status(200).json({
      channelHandle: data.channelHandle || "@hiiinishant",
      channelName: data.channelName || "Nishant Kumar",
      playlistUrl: data.playlistUrl || playlistUrl.trim(),
      playlistId: data.playlistId || playlistId,
      playlistTitle: data.playlistTitle || metadata.title,
      playlistThumbnail: data.playlistThumbnail || metadata.thumbnail,
      initialVideos: data.initialVideos || fetchedVideos,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to save vlog settings" });
  }
};

router.put('/', requireAuth, updateVlogHandler);
router.post('/', requireAuth, updateVlogHandler);

router.delete('/', requireAuth, async (req, res) => {
  try {
    if (!firestore) {
      res.status(503).json({ error: "Database not available." });
      return;
    }
    await firestore.collection('vlogSettings').doc('default').delete();
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to delete vlog settings" });
  }
});

// ─── Individual Vlog Video CRUD ─────────────────────────────────────────────

// GET /api/vlogs/videos — list all admin-added vlog videos
router.get('/videos', async (req, res) => {
  try {
    if (!firestore) {
      res.status(200).json([]);
      return;
    }
    const snap = await firestore
      .collection('vlogVideos')
      .orderBy('createdAt', 'desc')
      .get();
    const videos = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(videos);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch vlog videos" });
  }
});

// POST /api/vlogs/videos — add a vlog video
router.post('/videos', requireAuth, async (req, res) => {
  try {
    if (!firestore) {
      res.status(503).json({ error: "Database not available." });
      return;
    }
    const { videoId, title, description, uploadDate, tags } = req.body;
    if (!videoId || !title) {
      res.status(400).json({ error: "videoId and title are required." });
      return;
    }
    // Fetch oEmbed title/thumbnail for verification
    let resolvedTitle = title;
    let thumbnail = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
    try {
      const oEmbed = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`
      );
      if (oEmbed.ok) {
        const data = await oEmbed.json() as { title?: string; thumbnail_url?: string };
        resolvedTitle = title || data.title || title;
        thumbnail = data.thumbnail_url || thumbnail;
      }
    } catch {}

    const docRef = await firestore.collection('vlogVideos').add({
      videoId: videoId.trim(),
      title: resolvedTitle.trim(),
      description: description?.trim() || "",
      uploadDate: uploadDate || new Date().toISOString().split('T')[0],
      tags: Array.isArray(tags) ? tags : (tags ? String(tags).split(',').map((t: string) => t.trim()).filter(Boolean) : []),
      thumbnail,
      createdAt: new Date().toISOString(),
    });
    const doc = await docRef.get();
    res.status(201).json({ id: doc.id, ...doc.data() });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to add vlog video" });
  }
});

// GET /api/vlogs/videos/:videoId — get single video by YouTube videoId
router.get('/videos/:videoId', async (req, res) => {
  try {
    if (!firestore) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const { videoId } = req.params;
    const snap = await firestore
      .collection('vlogVideos')
      .where('videoId', '==', videoId)
      .limit(1)
      .get();
    if (snap.empty) {
      res.status(404).json({ error: "Video not found" });
      return;
    }
    const doc = snap.docs[0];
    res.status(200).json({ id: doc.id, ...doc.data() });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch video" });
  }
});

// DELETE /api/vlogs/videos/:id — delete a vlog video by Firestore doc id
router.delete('/videos/:id', requireAuth, async (req, res) => {
  try {
    if (!firestore) {
      res.status(503).json({ error: "Database not available." });
      return;
    }
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await firestore.collection('vlogVideos').doc(id).delete();
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to delete video" });
  }
});

export default router;

