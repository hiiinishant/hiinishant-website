export interface BioLink {
  id: string;
  title: string;
  url: string;
  icon?: string;
  isActive: boolean;
  order: number;
  clicks?: number;
  createdAt: string;
}

export interface SocialLinks {
  instagram?: string;
  youtube?: string;
  twitter?: string;
  linkedin?: string;
  github?: string;
  telegram?: string;
  facebook?: string;
  tiktok?: string;
  whatsapp?: string;
  email?: string;
  spotify?: string;
  discord?: string;
}

export type BioThemeId =
  | "dark-modern"
  | "cyber-neon"
  | "emerald-forest"
  | "sunset-glow"
  | "midnight-blue"
  | "minimal-clean"
  | "glass-frosted"
  | "retro-synthwave";

export type ButtonStyle =
  | "rounded"
  | "pill"
  | "sharp"
  | "shadow"
  | "outline"
  | "glass";

export interface CustomColorPalette {
  backgroundColor?: string;
  backgroundGradient?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  textColor?: string;
  accentColor?: string;
}

export interface BioPage {
  uid: string;
  username: string; // normalized lowercase
  displayName: string;
  bio: string;
  avatarType: "custom" | "boy" | "girl" | "initials";
  avatarUrl?: string;
  theme: BioThemeId;
  buttonStyle: ButtonStyle;
  customBackgroundColor?: string;
  customAccentColor?: string;
  customColors?: CustomColorPalette;
  useCustomColors?: boolean;
  isPublished: boolean;
  links: BioLink[];
  socials: SocialLinks;
  views: number;
  totalClicks: number;
  createdAt: string;
  updatedAt: string;
}

export interface PublicBioProfile {
  username: string;
  displayName: string;
  bio: string;
  avatarType: "custom" | "boy" | "girl" | "initials";
  avatarUrl?: string;
  theme: BioThemeId;
  buttonStyle: ButtonStyle;
  customBackgroundColor?: string;
  customAccentColor?: string;
  customColors?: CustomColorPalette;
  useCustomColors?: boolean;
  isPublished: boolean;
  links: Array<{
    id: string;
    title: string;
    url: string;
    icon?: string;
    order: number;
  }>;
  socials: SocialLinks;
}

export interface ColorPalettePreset {
  id: string;
  name: string;
  description: string;
  palette: CustomColorPalette;
}

export const COLOR_PALETTE_PRESETS: ColorPalettePreset[] = [
  {
    id: "midnight-luxe",
    name: "Midnight Luxe",
    description: "Deep obsidian slate with electric cyan glow",
    palette: {
      backgroundColor: "#090d16",
      backgroundGradient: "linear-gradient(135deg, #090d16 0%, #1e293b 100%)",
      buttonColor: "#1e293b",
      buttonTextColor: "#ffffff",
      textColor: "#f8fafc",
      accentColor: "#38bdf8",
    },
  },
  {
    id: "cyber-neon",
    name: "Cyber Neon",
    description: "Deep violet with fluorescent purple & magenta accents",
    palette: {
      backgroundColor: "#0d0a1a",
      backgroundGradient: "linear-gradient(135deg, #0d0a1a 0%, #2e1065 100%)",
      buttonColor: "#2e1065",
      buttonTextColor: "#fdf4ff",
      textColor: "#f5d0fe",
      accentColor: "#d946ef",
    },
  },
  {
    id: "emerald-forest",
    name: "Emerald Forest",
    description: "Lush botanical greens with bright mint highlights",
    palette: {
      backgroundColor: "#022c22",
      backgroundGradient: "linear-gradient(135deg, #022c22 0%, #064e3b 100%)",
      buttonColor: "#065f46",
      buttonTextColor: "#ecfdf5",
      textColor: "#d1fae5",
      accentColor: "#10b981",
    },
  },
  {
    id: "sunset-ember",
    name: "Sunset Ember",
    description: "Warm crimson velvet with fiery amber tones",
    palette: {
      backgroundColor: "#1c1017",
      backgroundGradient: "linear-gradient(135deg, #2a081e 0%, #7c2d12 100%)",
      buttonColor: "#831843",
      buttonTextColor: "#fff1f2",
      textColor: "#ffe4e6",
      accentColor: "#fb923c",
    },
  },
  {
    id: "obsidian-gold",
    name: "Obsidian Gold",
    description: "Pure rich black with premium golden accents",
    palette: {
      backgroundColor: "#0a0a0a",
      backgroundGradient: "linear-gradient(135deg, #000000 0%, #1c1917 100%)",
      buttonColor: "#1c1917",
      buttonTextColor: "#fef08a",
      textColor: "#fafaf9",
      accentColor: "#eab308",
    },
  },
  {
    id: "pastel-lavender",
    name: "Pastel Lavender",
    description: "Gentle dusky twilight with soft lilac accents",
    palette: {
      backgroundColor: "#181424",
      backgroundGradient: "linear-gradient(135deg, #181424 0%, #2e2648 100%)",
      buttonColor: "#352b52",
      buttonTextColor: "#ede9fe",
      textColor: "#f5f3ff",
      accentColor: "#c084fc",
    },
  },
  {
    id: "clean-monochrome",
    name: "Clean Monochrome",
    description: "Classic high-contrast dark aesthetic",
    palette: {
      backgroundColor: "#0f0f11",
      backgroundGradient: "linear-gradient(180deg, #18181b 0%, #09090b 100%)",
      buttonColor: "#27272a",
      buttonTextColor: "#ffffff",
      textColor: "#f4f4f5",
      accentColor: "#e4e4e7",
    },
  },
];

export function isValidHexColor(hex: string): boolean {
  if (!hex || typeof hex !== "string") return false;
  return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(hex.trim());
}

export function hexToRgb(hex: string): [number, number, number] | null {
  if (!isValidHexColor(hex)) return null;
  const clean = hex.trim().replace("#", "");
  if (clean.length === 3) {
    return [
      parseInt(clean[0] + clean[0], 16),
      parseInt(clean[1] + clean[1], 16),
      parseInt(clean[2] + clean[2], 16),
    ];
  }
  if (clean.length === 6) {
    return [
      parseInt(clean.slice(0, 2), 16),
      parseInt(clean.slice(2, 4), 16),
      parseInt(clean.slice(4, 6), 16),
    ];
  }
  return null;
}

export function getContrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return 21;
  const getLum = (r: number, g: number, b: number) => {
    const a = [r, g, b].map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  };
  const lum1 = getLum(...rgb1);
  const lum2 = getLum(...rgb2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

export interface ThemeConfig {
  id: BioThemeId;
  name: string;
  description: string;
  previewBg: string;
  previewAccent: string;
  backgroundClass: string;
  cardClass: string;
  textPrimary: string;
  textSecondary: string;
  accentClass: string;
  avatarBorder: string;
  badgeBg: string;
}

export const BIO_THEMES: Record<BioThemeId, ThemeConfig> = {
  "dark-modern": {
    id: "dark-modern",
    name: "Dark Modern",
    description: "Sleek slate with warm amber glow",
    previewBg: "#09090b",
    previewAccent: "#f59e0b",
    backgroundClass: "bg-zinc-950 text-white",
    cardClass:
      "bg-zinc-900/80 hover:bg-zinc-800/90 border border-white/10 hover:border-amber-500/40 text-white shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:shadow-[0_4px_30px_rgba(245,158,11,0.15)]",
    textPrimary: "text-white",
    textSecondary: "text-zinc-400",
    accentClass: "text-amber-400",
    avatarBorder: "ring-2 ring-amber-400/40 shadow-[0_0_20px_rgba(245,158,11,0.3)]",
    badgeBg: "bg-amber-400/10 border-amber-400/20 text-amber-300",
  },
  "cyber-neon": {
    id: "cyber-neon",
    name: "Cyber Neon",
    description: "Midnight violet with cyan neon glow",
    previewBg: "#0c0517",
    previewAccent: "#06b6d4",
    backgroundClass: "bg-[#0c0517] text-white",
    cardClass:
      "bg-[#170c29]/90 hover:bg-[#20113b] border border-cyan-500/25 hover:border-cyan-400 text-white shadow-[0_0_20px_rgba(6,182,212,0.12)] hover:shadow-[0_0_30px_rgba(6,182,212,0.3)]",
    textPrimary: "text-cyan-50",
    textSecondary: "text-purple-300/70",
    accentClass: "text-cyan-400",
    avatarBorder: "ring-2 ring-cyan-400/60 shadow-[0_0_25px_rgba(6,182,212,0.45)]",
    badgeBg: "bg-cyan-500/10 border-cyan-500/30 text-cyan-300",
  },
  "emerald-forest": {
    id: "emerald-forest",
    name: "Emerald Glow",
    description: "Deep evergreen with radiant mint accents",
    previewBg: "#04140d",
    previewAccent: "#10b981",
    backgroundClass: "bg-[#04140d] text-white",
    cardClass:
      "bg-[#0a261a]/80 hover:bg-[#0e3323] border border-emerald-500/25 hover:border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.12)] hover:shadow-[0_0_30px_rgba(16,185,129,0.25)]",
    textPrimary: "text-emerald-50",
    textSecondary: "text-emerald-300/70",
    accentClass: "text-emerald-400",
    avatarBorder: "ring-2 ring-emerald-400/50 shadow-[0_0_25px_rgba(16,185,129,0.35)]",
    badgeBg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
  },
  "sunset-glow": {
    id: "sunset-glow",
    name: "Sunset Ember",
    description: "Dusk sky with fiery coral & gold gradient",
    previewBg: "#170a1a",
    previewAccent: "#f97316",
    backgroundClass: "bg-gradient-to-b from-[#180a1c] via-[#241021] to-[#120716] text-white",
    cardClass:
      "bg-white/[0.06] hover:bg-white/[0.12] border border-orange-500/25 hover:border-orange-400 text-white shadow-[0_4px_25px_rgba(249,115,22,0.12)] hover:shadow-[0_4px_35px_rgba(249,115,22,0.25)] backdrop-blur-md",
    textPrimary: "text-orange-50",
    textSecondary: "text-orange-200/70",
    accentClass: "text-orange-400",
    avatarBorder: "ring-2 ring-orange-400/60 shadow-[0_0_25px_rgba(249,115,22,0.35)]",
    badgeBg: "bg-orange-500/10 border-orange-500/30 text-orange-300",
  },
  "midnight-blue": {
    id: "midnight-blue",
    name: "Midnight Sapphire",
    description: "Deep oceanic blue with electric sparks",
    previewBg: "#050b17",
    previewAccent: "#3b82f6",
    backgroundClass: "bg-[#050b17] text-white",
    cardClass:
      "bg-[#0d172e]/85 hover:bg-[#132142] border border-blue-500/25 hover:border-blue-400 text-white shadow-[0_0_20px_rgba(59,130,246,0.12)] hover:shadow-[0_0_30px_rgba(59,130,246,0.25)]",
    textPrimary: "text-blue-50",
    textSecondary: "text-blue-300/70",
    accentClass: "text-blue-400",
    avatarBorder: "ring-2 ring-blue-400/50 shadow-[0_0_25px_rgba(59,130,246,0.35)]",
    badgeBg: "bg-blue-500/10 border-blue-500/30 text-blue-300",
  },
  "minimal-clean": {
    id: "minimal-clean",
    name: "Minimal Monochrome",
    description: "Ultra clean black and white contrast",
    previewBg: "#000000",
    previewAccent: "#ffffff",
    backgroundClass: "bg-black text-white",
    cardClass:
      "bg-zinc-950 hover:bg-zinc-900 border border-white/20 hover:border-white text-white shadow-none transition-colors",
    textPrimary: "text-white",
    textSecondary: "text-zinc-400",
    accentClass: "text-white",
    avatarBorder: "ring-2 ring-white/60",
    badgeBg: "bg-white/10 border-white/20 text-white",
  },
  "glass-frosted": {
    id: "glass-frosted",
    name: "Frosted Aura",
    description: "Translucent glass with soft floating mesh",
    previewBg: "#111217",
    previewAccent: "#a855f7",
    backgroundClass: "bg-[#0b0c10] text-white",
    cardClass:
      "bg-white/[0.05] hover:bg-white/[0.1] border border-white/15 hover:border-white/30 text-white backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.37)] hover:shadow-[0_8px_40px_rgba(168,85,247,0.2)]",
    textPrimary: "text-white",
    textSecondary: "text-zinc-300",
    accentClass: "text-purple-400",
    avatarBorder: "ring-2 ring-purple-400/40 shadow-[0_0_25px_rgba(168,85,247,0.3)]",
    badgeBg: "bg-purple-500/10 border-purple-500/30 text-purple-300",
  },
  "retro-synthwave": {
    id: "retro-synthwave",
    name: "Retro Synthwave",
    description: "Vibrant retro neon fuchsia and amber",
    previewBg: "#170526",
    previewAccent: "#ec4899",
    backgroundClass: "bg-gradient-to-b from-[#170526] via-[#10031c] to-[#08010f] text-white",
    cardClass:
      "bg-fuchsia-950/40 hover:bg-fuchsia-900/50 border border-fuchsia-500/30 hover:border-fuchsia-400 text-white shadow-[0_0_25px_rgba(236,72,153,0.15)] hover:shadow-[0_0_35px_rgba(236,72,153,0.3)] backdrop-blur-sm",
    textPrimary: "text-fuchsia-50",
    textSecondary: "text-fuchsia-200/70",
    accentClass: "text-fuchsia-400",
    avatarBorder: "ring-2 ring-fuchsia-400/60 shadow-[0_0_25px_rgba(236,72,153,0.45)]",
    badgeBg: "bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-300",
  },
};

export const BUTTON_STYLES: Record<
  ButtonStyle,
  { id: ButtonStyle; name: string; previewClass: string }
> = {
  rounded: { id: "rounded", name: "Rounded", previewClass: "rounded-2xl" },
  pill: { id: "pill", name: "Pill", previewClass: "rounded-full" },
  sharp: { id: "sharp", name: "Sharp", previewClass: "rounded-md" },
  shadow: { id: "shadow", name: "Lifted 3D", previewClass: "rounded-2xl shadow-xl hover:-translate-y-0.5" },
  outline: { id: "outline", name: "Outline", previewClass: "rounded-2xl bg-transparent border-2" },
  glass: { id: "glass", name: "Frosted Glass", previewClass: "rounded-2xl backdrop-blur-xl bg-white/[0.04]" },
};

export const SUPPORTED_LINK_ICONS = [
  { id: "website", label: "Website / Web" },
  { id: "youtube", label: "YouTube" },
  { id: "instagram", label: "Instagram" },
  { id: "twitter", label: "Twitter / X" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "github", label: "GitHub" },
  { id: "telegram", label: "Telegram" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "spotify", label: "Spotify" },
  { id: "discord", label: "Discord" },
  { id: "facebook", label: "Facebook" },
  { id: "tiktok", label: "TikTok" },
  { id: "mail", label: "Email" },
  { id: "store", label: "Store / Shop" },
  { id: "book", label: "Book / Study" },
  { id: "video", label: "Video / Vlog" },
  { id: "code", label: "Code / Project" },
  { id: "briefcase", label: "Portfolio / Work" },
  { id: "star", label: "Star / Featured" },
  { id: "heart", label: "Support / Donate" },
  { id: "link", label: "General Link" },
];

export const RESERVED_USERNAMES = new Set([
  "about",
  "admin",
  "administrator",
  "amazon",
  "amazon-feed",
  "analytics",
  "api",
  "app",
  "auth",
  "bio",
  "blog",
  "blogs",
  "contact",
  "dashboard",
  "delete-account",
  "edit",
  "explore",
  "faq",
  "features",
  "feed",
  "fonts",
  "gallery",
  "help",
  "home",
  "index",
  "journey",
  "link",
  "links",
  "login",
  "logout",
  "me",
  "music",
  "news",
  "newsletter",
  "nsgram",
  "null",
  "privacy",
  "profile",
  "profiles",
  "project",
  "projects",
  "public",
  "quiz",
  "quizzes",
  "register",
  "resume",
  "root",
  "settings",
  "signin",
  "signup",
  "sitemap",
  "status",
  "support",
  "terms",
  "tree",
  "undefined",
  "universe",
  "updates",
  "user",
  "users",
  "verify",
  "vlog",
  "vlogs",
]);

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidUsernameFormat(username: string): boolean {
  return (
    typeof username === "string" &&
    username.length >= 3 &&
    username.length <= 30 &&
    /^[a-z0-9_]+$/.test(username)
  );
}

export function isReservedUsername(username: string): boolean {
  return RESERVED_USERNAMES.has(normalizeUsername(username));
}

export function isValidBioUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim().toLowerCase();
  if (
    trimmed.startsWith("javascript:") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("vbscript:") ||
    trimmed.startsWith("file:") ||
    trimmed.startsWith("blob:")
  ) {
    return false;
  }
  return (
    trimmed.startsWith("https://") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("tel:")
  );
}
