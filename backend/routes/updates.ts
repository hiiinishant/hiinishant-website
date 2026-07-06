import { Router } from 'express';
import { firestore } from '../lib/firebaseAdmin';
import { requireAuth } from '../middleware/auth';

const router = Router();

function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

async function fetchYoutubeVideos(): Promise<any[]> {
  const channelId = "UCTztpZiVXOoug9bgMC8FxsQ";
  const feedUrl = "https://www.youtube.com/feeds/videos.xml?channel_id=" + channelId;
  try {
    const res = await fetch(feedUrl);
    if (!res.ok) throw new Error("Failed to fetch youtube feed");
    const xml = await res.text();

    const entries: any[] = [];
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let match;
    while ((match = entryRegex.exec(xml)) !== null) {
      const entryHtml = match[1];
      const videoId = (/<yt:videoId>([\s\S]*?)<\/yt:videoId>/.exec(entryHtml))?.[1] || "";
      const title = (/<title>([\s\S]*?)<\/title>/.exec(entryHtml))?.[1] || "";
      const published = (/<published>([\s\S]*?)<\/published>/.exec(entryHtml))?.[1] || "";
      const thumbnail = (/<media:thumbnail\s+url="([^"]*?)"/.exec(entryHtml))?.[1] ||
        "https://i.ytimg.com/vi/" + videoId + "/hqdefault.jpg";

      if (videoId) {
        entries.push({
          id: "yt-" + videoId,
          category: "video",
          title: decodeEntities(title) || "YouTube Video",
          description: "Check out my latest vlog on YouTube!",
          date: published ? published.split("T")[0] : new Date().toISOString().split("T")[0],
          href: "https://www.youtube.com/watch?v=" + videoId,
          thumbnail: thumbnail,
          badge: title.toLowerCase().includes("short") ? "Short" : "Vlog",
          meta: "New video",
          isNew: false
        });
      }
    }
    return entries;
  } catch (e) {
    return [];
  }
}

router.get('/', async (req, res) => {
  try {
    if (!firestore) {
      // Return only YouTube videos if Firestore is not configured
      const youtubeUpdates = await fetchYoutubeVideos();
      res.status(200).json(youtubeUpdates);
      return;
    }

    const staticUpdatesSnap = await firestore.collection('updateItems').get();
    const formattedStaticUpdates = staticUpdatesSnap.docs.map((d: any) => {
      const data = d.data();
      return {
        ...data,
        id: d.id,
        isNew: data.isNewItem ?? false,
      };
    });
    const youtubeUpdates = await fetchYoutubeVideos();
    const all = [...formattedStaticUpdates, ...youtubeUpdates].sort(
      (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    res.status(200).json(all);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to load updates" });
  }
});

router.get('/static', async (req, res) => {
  try {
    const snap = await firestore.collection('updateItems').orderBy('date', 'desc').get();
    const updates = snap.docs.map((d: any) => {
      const data = d.data();
      return {
        ...data,
        id: d.id,
        isNew: data.isNewItem ?? false,
      };
    });
    res.status(200).json(updates);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to load static updates" });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { category, title, description, date, href, badge, meta, isNew, thumbnail } = req.body;
    const docRef = await firestore.collection('updateItems').add({
      category, title, description, date, href, badge, meta, thumbnail,
      isNewItem: !!isNew,
    });
    const doc = await docRef.get();
    const data = doc.data();
    res.status(201).json({ ...data, id: doc.id, isNew: data?.isNewItem ?? false });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to create update" });
  }
});

router.put('/', requireAuth, async (req, res) => {
  try {
    const { id, category, title, description, date, href, badge, meta, isNew, thumbnail } = req.body;
    if (!id) { res.status(400).json({ error: "ID is required." }); return; }
    
    const updateData: any = {};
    if (category !== undefined) updateData.category = category;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (date !== undefined) updateData.date = date;
    if (href !== undefined) updateData.href = href;
    if (badge !== undefined) updateData.badge = badge;
    if (meta !== undefined) updateData.meta = meta;
    if (thumbnail !== undefined) updateData.thumbnail = thumbnail;
    if (isNew !== undefined) updateData.isNewItem = isNew;
    
    await firestore.collection('updateItems').doc(id).update(updateData);
    const doc = await firestore.collection('updateItems').doc(id).get();
    const data = doc.data();
    res.status(200).json({ ...data, id: doc.id, isNew: data?.isNewItem ?? false });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update update" });
  }
});

router.delete('/', requireAuth, async (req, res) => {
  try {
    const { id } = req.body;
    await firestore.collection('updateItems').doc(id).delete();
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to delete update" });
  }
});

export default router;
