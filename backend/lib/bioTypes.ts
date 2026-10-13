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
  | 'dark-modern'
  | 'cyber-neon'
  | 'emerald-forest'
  | 'sunset-glow'
  | 'midnight-blue'
  | 'minimal-clean'
  | 'glass-frosted'
  | 'retro-synthwave';

export type ButtonStyle =
  | 'rounded'
  | 'pill'
  | 'sharp'
  | 'shadow'
  | 'outline'
  | 'glass';

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
  avatarType: 'custom' | 'boy' | 'girl' | 'initials';
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

export const RESERVED_USERNAMES = new Set([
  'about',
  'admin',
  'administrator',
  'amazon',
  'amazon-feed',
  'analytics',
  'api',
  'app',
  'auth',
  'bio',
  'blog',
  'blogs',
  'contact',
  'dashboard',
  'delete-account',
  'edit',
  'explore',
  'faq',
  'features',
  'feed',
  'fonts',
  'gallery',
  'help',
  'home',
  'index',
  'journey',
  'link',
  'links',
  'login',
  'logout',
  'me',
  'music',
  'news',
  'newsletter',
  'nsgram',
  'null',
  'privacy',
  'profile',
  'profiles',
  'project',
  'projects',
  'public',
  'quiz',
  'quizzes',
  'register',
  'resume',
  'root',
  'settings',
  'signin',
  'signup',
  'sitemap',
  'status',
  'support',
  'terms',
  'tree',
  'undefined',
  'universe',
  'updates',
  'user',
  'users',
  'verify',
  'vlog',
  'vlogs',
]);

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidUsernameFormat(username: string): boolean {
  return (
    typeof username === 'string' &&
    username.length >= 3 &&
    username.length <= 30 &&
    /^[a-z0-9_]+$/.test(username)
  );
}

export function isReservedUsername(username: string): boolean {
  return RESERVED_USERNAMES.has(normalizeUsername(username));
}

export function isValidBioUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim().toLowerCase();
  if (
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('vbscript:') ||
    trimmed.startsWith('file:') ||
    trimmed.startsWith('blob:')
  ) {
    return false;
  }
  return (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:')
  );
}
