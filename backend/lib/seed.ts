import { firestore } from './firebaseAdmin';

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

export const seedDatabase = async () => {
  if (!firestore) {
    console.warn("⚠️ Firestore not initialized. Skipping database seeding.");
    return;
  }
  try {
    const updateSnap = await firestore.collection('updateItems').limit(1).get();
    if (updateSnap.empty) {
      console.log("🌱 Seeding default updates...");
      await firestore.collection('updateItems').add({
        category: "instagram",
        title: "Nishant's latest College Photoshoot",
        description: "Photoshoot - campus memories and new milestones. Reflecting on the journey so far. 🚀",
        date: "2024-02-29",
        href: "https://www.instagram.com/p/C37jQPcv03gvRaXnQRfhO4F2AqXkGG-E9ib2EA0/",
        thumbnail: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=600&auto=format&fit=crop",
        badge: "Instagram",
        meta: "hiiinishant • View Post",
        isNewItem: false
      });
      await firestore.collection('updateItems').add({
        category: "instagram",
        title: "Building 2 AM Study — The Behind-the-Scenes Journey",
        description: "Late nights, coffee, and constant building. From a simple study routine to a platform trusted by 100K+ students. Here is a look at what we are working on next! 🚀📚",
        date: "2026-06-25",
        href: "https://instagram.com/hiiinishant",
        thumbnail: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=600&auto=format&fit=crop",
        badge: "Instagram",
        meta: "Instagram • 1.2K Likes",
        isNewItem: true
      });
    }

    const planSnap = await firestore.collection('futurePlans').limit(1).get();
    if (planSnap.empty) {
      console.log("🌱 Seeding default future plans...");
      await firestore.collection('futurePlans').add({
        title: "Launch 2 AM Study Mobile App",
        description: "Build and publish a native Android/iOS application supporting offline notes access, flashcards, and study planners.",
        targetDate: "Q4 2026",
        category: "business",
        status: "planned"
      });
      await firestore.collection('futurePlans').add({
        title: "GATE CSE Full Mock Series",
        description: "Publish 10 full-length practice examinations matching the latest GATE system syllabus and time limits.",
        targetDate: "Q3 2026",
        category: "academic",
        status: "in-progress"
      });
      await firestore.collection('futurePlans').add({
        title: "National Mentorship Program",
        description: "Launch weekly live study rooms and direct peer mentorship circles to help 500+ top aspirants coordinate GATE schedules.",
        targetDate: "Q3 2026",
        category: "community",
        status: "in-progress"
      });
    }

    const statusSnap = await firestore.collection('dailyStatus').limit(1).get();
    if (statusSnap.empty) {
      console.log("🌱 Seeding default daily statuses...");
      await firestore.collection('dailyStatus').doc('2026-06-29').set({
        date: "2026-06-29",
        statusText: "Launching New Features & Vlogs Portal 🎥",
        tasks: [
          "Integrated first 3 Hiii Nishant YouTube vlogs to the Updates portal.",
          "Connected latest Instagram posts & custom feeds for student community engagement.",
          "Updated Live Status dashboard with real-time logs and automated database seeders.",
          "Refined animations and hover effects on cards for a smoother, premium browsing experience."
        ],
        study: {
          hours: 6,
          subject: "Algorithms & Data Structures",
          questions: 15,
          mock: "N/A"
        },
        project: {
          hours: 4,
          tasks: [
            "Refactored homepage Hero section top spacing",
            "Optimized profile card sticky position with custom overflow-clip updates"
          ]
        },
        content: {
          videos: 1,
          posts: 2
        },
        health: {
          sleep: 7.5,
          healthyEating: 4
        },
        finance: {
          expense: 450,
          income: 1200
        },
        mood: 9,
        bestMoment: "Reached 100K+ students milestone across the platform updates!",
        lessonLearned: "Keep inputs modular and structured to easily parse dashboard cards dynamically.",
        updatedAt: "2026-06-29T11:30:00.000Z"
      });
      await firestore.collection('dailyStatus').doc('2026-06-28').set({
        date: "2026-06-28",
        statusText: "Building Live & Refactoring Animations 🚀",
        tasks: [
          "Refactored homepage Hero section top spacing to remove navbar gaps.",
          "Implemented floating quote background movements and animations."
        ],
        study: {
          hours: 8,
          subject: "Operating Systems (GATE)",
          questions: 20,
          mock: "GATE Full Mock Exam #3 (Score: 78/100)"
        },
        project: {
          hours: 5,
          tasks: [
            "Implemented floating quote animations",
            "Set up new WebRTC voice signaling"
          ]
        },
        content: {
          videos: 0,
          posts: 1
        },
        health: {
          sleep: 8,
          healthyEating: 5
        },
        finance: {
          expense: 150,
          income: 0
        },
        mood: 8,
        bestMoment: "Finished a full length Sunday mock series with high marks!",
        lessonLearned: "Early morning routines allow higher focus blocks without distraction.",
        updatedAt: "2026-06-28T20:30:00.000Z"
      });
    }

    const musicDoc = await firestore.collection('musicSettings').doc('default').get();
    if (!musicDoc.exists) {
      console.log("🌱 Seeding default music playlist...");
      const music = await buildMusicSettings(DEFAULT_PLAYLIST_URL);
      await firestore.collection('musicSettings').doc('default').set({
        key: "default",
        ...music,
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error("❌ Failed to seed database:", err);
  }
};
