import { Router } from 'express';
import { firestore } from '../lib/firebaseAdmin';
import { requireAuth } from '../middleware/auth';

const router = Router();

const DEFAULT_VLOG_PLAYLIST_URL =
  process.env.VLOG_PLAYLIST_URL ||
  "https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf";

const DEFAULT_INITIAL_VIDEOS = [
  {
    videoId: "dQw4w9WgXcQ",
    title: "My College Life Vlog — Day 1",
    description: "First day at Chandigarh University",
  },
  {
    videoId: "dQw4w9WgXcQ",
    title: "Building 2 AM Study — Behind the Scenes",
    description: "How it all started",
  },
  {
    videoId: "dQw4w9WgXcQ",
    title: "My Daily Routine as a Student Founder",
    description: "Hustle, study, repeat",
  },
  {
    videoId: "dQw4w9WgXcQ",
    title: "Study Motivation Vlog — Late Night Grind",
    description: "2 AM and still coding",
  },
  {
    videoId: "dQw4w9WgXcQ",
    title: "Campus Life & Entrepreneurship",
    description: "Balancing college and a startup",
  },
  {
    videoId: "dQw4w9WgXcQ",
    title: "What I Learned This Year — Annual Vlog",
    description: "Lessons from the journey",
  },
];

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
  return {
    channelHandle: "@hiiinishant",
    channelName: "Nishant Kumar",
    playlistUrl: playlistUrl.trim(),
    playlistId,
    playlistTitle: metadata.title,
    playlistThumbnail: metadata.thumbnail,
    initialVideos: DEFAULT_INITIAL_VIDEOS,
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
    const updatedData = {
      channelHandle: req.body.channelHandle || "@hiiinishant",
      channelName: req.body.channelName || "Nishant Kumar",
      playlistUrl: playlistUrl.trim(),
      playlistId,
      playlistTitle: metadata.title,
      playlistThumbnail: metadata.thumbnail,
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
      initialVideos: data.initialVideos || DEFAULT_INITIAL_VIDEOS,
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

