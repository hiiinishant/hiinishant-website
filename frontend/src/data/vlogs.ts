export interface VlogVideo {
  videoId: string;
  title: string;
  description?: string;
  uploadDate?: string;   // ISO date e.g. "2024-08-01"
  tags?: string[];       // for SEO keywords
}

export interface VlogSettings {
  channelHandle: string;
  channelName: string;
  playlistUrl?: string;
  playlistId?: string;        // Optional: use a specific playlist instead of channel
  playlistTitle?: string;
  playlistThumbnail?: string;
  initialVideos: VlogVideo[];
}

export const defaultVlogSettings: VlogSettings = {
  channelHandle: "@hiiinishant",
  channelName: "Nishant Kumar",
  // Replace with Nishant's actual YouTube vlog playlist ID if available
  playlistId: "",
  initialVideos: [
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
  ],
};
