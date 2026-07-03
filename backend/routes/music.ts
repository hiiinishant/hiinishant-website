import { Router } from 'express';
import { firestore } from '../lib/firebaseAdmin';
import { requireAuth } from '../middleware/auth';

const router = Router();

const DEFAULT_PLAYLIST_URL =
  process.env.MUSIC_PLAYLIST_URL ||
  "https://www.youtube.com/watch?v=uNboFgKLGDY&list=PLQfqZFVQZ3To";

function extractPlaylistId(url: string): string | null {
  if (!url) return null;
  const listMatch = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  if (listMatch) return listMatch[1];
  const pathMatch = url.match(/youtube\.com\/playlist\/([a-zA-Z0-9_-]+)/);
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
      title: data.title || "YouTube Playlist",
      thumbnail: data.thumbnail_url || "https://i.ytimg.com/vi/" + playlistId + "/hqdefault.jpg",
    };
  } catch {
    return {
      title: "YouTube Playlist",
      thumbnail: "https://i.ytimg.com/vi/" + playlistId + "/hqdefault.jpg",
    };
  }
}

async function buildMusicSettings(playlistUrl: string) {
  const playlistId = extractPlaylistId(playlistUrl) || "";
  if (!playlistId) {
    return {
      playlistUrl: "",
      playlistId: "",
      playlistTitle: "",
      playlistThumbnail: "",
    };
  }
  const metadata = await fetchPlaylistMetadata(playlistId);
  return {
    playlistUrl: playlistUrl.trim(),
    playlistId,
    playlistTitle: metadata.title,
    playlistThumbnail: metadata.thumbnail,
  };
}

router.get('/', async (req, res) => {
  try {
    const doc = await firestore.collection('musicSettings').doc('default').get();
    if (doc.exists && doc.data()?.playlistId) {
      const data = doc.data()!;
      res.status(200).json({
        playlistUrl: data.playlistUrl,
        playlistId: data.playlistId,
        playlistTitle: data.playlistTitle,
        playlistThumbnail: data.playlistThumbnail,
      });
      return;
    }
    res.status(200).json(await buildMusicSettings(DEFAULT_PLAYLIST_URL));
  } catch {
    res.status(200).json(await buildMusicSettings(DEFAULT_PLAYLIST_URL));
  }
});

router.put('/', requireAuth, async (req, res) => {
  try {
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
    await firestore.collection('musicSettings').doc('default').set({
      playlistUrl: playlistUrl.trim(),
      playlistId,
      playlistTitle: metadata.title,
      playlistThumbnail: metadata.thumbnail,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    const doc = await firestore.collection('musicSettings').doc('default').get();
    const data = doc.data()!;

    res.status(200).json({
      playlistUrl: data.playlistUrl,
      playlistId: data.playlistId,
      playlistTitle: data.playlistTitle,
      playlistThumbnail: data.playlistThumbnail,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to save music settings" });
  }
});

router.delete('/', requireAuth, async (req, res) => {
  try {
    await firestore.collection('musicSettings').doc('default').delete();
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to delete music settings" });
  }
});

export default router;
