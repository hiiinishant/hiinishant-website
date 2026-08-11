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
  playlistId: "PL7WyIzpQW_0aEsXP5PyWyjpmlGkEeU5nr",
  playlistUrl: "https://www.youtube.com/playlist?list=PL7WyIzpQW_0aEsXP5PyWyjpmlGkEeU5nr",
  playlistTitle: "Nishant's World of Vibes",
  initialVideos: [
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
  ],
};

export const NISHANT_ACTUAL_VLOGS: VlogVideo[] = defaultVlogSettings.initialVideos;
