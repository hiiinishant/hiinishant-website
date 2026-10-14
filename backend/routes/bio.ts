import { Router, Request, Response } from 'express';
import multer from 'multer';
import { firestore } from '../lib/firebaseAdmin';
import admin from '../lib/firebaseAdmin';
import { uploadBuffer } from '../lib/cloudinary';
import {
  BioPage,
  BioLink,
  BioThemeId,
  ButtonStyle,
  normalizeUsername,
  isValidUsernameFormat,
  isReservedUsername,
  isValidBioUrl,
} from '../lib/bioTypes';
import { requireAuth } from '../middleware/auth';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

/**
 * Reusable Middleware: Verify Firebase ID token from Authorization header.
 * Attaches decoded token uid to req as (req as any).firebaseUid
 */
async function requireFirebaseAuth(req: Request, res: Response, next: Function): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header.' });
    return;
  }
  const idToken = authHeader.substring(7);
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    (req as any).firebaseUid = decoded.uid;
    next();
  } catch (err: any) {
    res.status(401).json({ error: 'Invalid or expired Firebase token.' });
  }
}

// ── Rate Limiting & Bot Filtering Caches for Analytics ─────────────────────────
const ipViewCooldown = new Map<string, number>();
const ipClickCooldown = new Map<string, number>();

// Periodic cleanup every 15 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, ts] of ipViewCooldown.entries()) {
    if (now - ts > 120_000) ipViewCooldown.delete(key);
  }
  for (const [key, ts] of ipClickCooldown.entries()) {
    if (now - ts > 30_000) ipClickCooldown.delete(key);
  }
}, 15 * 60 * 1000);

const BOT_USER_AGENT_REGEX =
  /(bot|crawler|spider|crawling|googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|sogou|exabot|facebookexternalhit|facebot|ia_archiver|curl|wget|python)/i;

function isBot(userAgent?: string): boolean {
  if (!userAgent) return true;
  return BOT_USER_AGENT_REGEX.test(userAgent);
}

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown-ip';
}

/**
 * Returns today's date in UTC as 'YYYY-MM-DD'.
 * All daily stats documents use this key so they sort chronologically.
 */
function getTodayDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Atomically increments a field in the daily_stats sub-collection for a
 * bio_pages document. Non-blocking — errors are swallowed to never affect
 * the primary response.
 */
async function incrementDailyStat(
  bioDocRef: admin.firestore.DocumentReference,
  field: 'views' | 'clicks'
): Promise<void> {
  if (!firestore) return;
  try {
    const dateKey = getTodayDateKey();
    const statRef = bioDocRef.collection('daily_stats').doc(dateKey);
    await statRef.set(
      {
        date: dateKey,
        [field]: admin.firestore.FieldValue.increment(1),
        // Ensure both fields exist on first write
        ...(field === 'views' ? { clicks: admin.firestore.FieldValue.increment(0) } : { views: admin.firestore.FieldValue.increment(0) }),
      },
      { merge: true }
    );
  } catch (err: any) {
    console.warn('[Bio API] Daily stat increment error (non-blocking):', err.message);
  }
}

// ─── 1. Public Endpoint: Check Username Availability ─────────────────────────
// GET /api/bio/check-username?username=<username>
router.get('/check-username', async (req: Request, res: Response) => {
  try {
    const raw = req.query.username;
    if (!raw || typeof raw !== 'string') {
      res.status(400).json({ available: false, error: 'Username is required.' });
      return;
    }

    const username = normalizeUsername(raw);

    if (!isValidUsernameFormat(username)) {
      res.status(400).json({
        available: false,
        error: 'Username must be 3-30 characters with letters, numbers, and underscores only.',
      });
      return;
    }

    if (isReservedUsername(username)) {
      res.status(200).json({
        available: false,
        error: 'This username is reserved for system use. Please choose another.',
      });
      return;
    }

    if (!firestore) {
      res.status(503).json({ available: false, error: 'Database service unavailable.' });
      return;
    }

    // Check bio_pages collection
    const bioSnap = await firestore
      .collection('bio_pages')
      .where('username', '==', username)
      .limit(1)
      .get();

    if (!bioSnap.empty) {
      res.status(200).json({ available: false, error: 'Username is already taken.' });
      return;
    }

    // Check existing users collection as well
    const usersSnap = await firestore
      .collection('users')
      .where('username', '==', username)
      .limit(1)
      .get();

    if (!usersSnap.empty) {
      res.status(200).json({ available: false, error: 'Username is already taken.' });
      return;
    }

    res.status(200).json({ available: true });
  } catch (error: any) {
    console.error('[Bio API] Check username error:', error);
    res.status(500).json({ available: false, error: 'Failed to verify username availability.' });
  }
});

// ─── 1b. Authenticated Endpoint: Get Analytics Time-Series ──────────────────
// GET /api/bio/me/analytics?range=7d|30d|90d
// Must be declared BEFORE the wildcard GET /:username route.
router.get('/me/analytics', requireFirebaseAuth, async (req: Request, res: Response) => {
  try {
    const uid = (req as any).firebaseUid as string;

    if (!firestore) {
      res.status(503).json({ error: 'Database service unavailable.' });
      return;
    }

    // Parse range — default 30 days, max 90 days
    const rawRange = typeof req.query.range === 'string' ? req.query.range : '30d';
    const allowedRanges: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 };
    const days = allowedRanges[rawRange] || 30;

    // Build the cutoff date string (inclusive lower bound)
    const cutoffDate = new Date();
    cutoffDate.setUTCDate(cutoffDate.getUTCDate() - (days - 1));
    const cutoffDateKey = cutoffDate.toISOString().slice(0, 10);

    const bioDocRef = firestore.collection('bio_pages').doc(uid);

    // Verify the profile exists and belongs to this user
    const bioSnap = await bioDocRef.get();
    if (!bioSnap.exists) {
      res.status(404).json({ error: 'Bio profile not found.' });
      return;
    }

    // Fetch daily_stats sub-collection filtered to requested range
    const statsSnap = await bioDocRef
      .collection('daily_stats')
      .where('date', '>=', cutoffDateKey)
      .orderBy('date', 'asc')
      .get();

    // Build a full date-indexed map so gaps become zeros
    const dataMap: Record<string, { views: number; clicks: number }> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - i);
      const key = d.toISOString().slice(0, 10);
      dataMap[key] = { views: 0, clicks: 0 };
    }

    statsSnap.docs.forEach((doc) => {
      const d = doc.data();
      if (dataMap[d.date] !== undefined) {
        dataMap[d.date] = {
          views: d.views || 0,
          clicks: d.clicks || 0,
        };
      }
    });

    const series = Object.entries(dataMap).map(([date, stats]) => ({
      date,
      views: stats.views,
      clicks: stats.clicks,
    }));

    // Aggregate totals from the bio_pages document (always accurate)
    const profileData = bioSnap.data() as BioPage;

    res.status(200).json({
      success: true,
      range: rawRange,
      days,
      series,
      totals: {
        views: profileData.views || 0,
        totalClicks: profileData.totalClicks || 0,
      },
    });
  } catch (error: any) {
    console.error('[Bio API] Analytics error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch analytics.' });
  }
});

// ─── 2. Authenticated Endpoint: Get Current User's Bio Page ─────────────────
// GET /api/bio/me
router.get('/me', requireFirebaseAuth, async (req: Request, res: Response) => {
  try {
    const uid = (req as any).firebaseUid as string;

    if (!firestore) {
      res.status(503).json({ error: 'Database service unavailable.' });
      return;
    }

    const bioDocRef = firestore.collection('bio_pages').doc(uid);
    const bioDoc = await bioDocRef.get();

    if (bioDoc.exists) {
      const data = bioDoc.data() as BioPage;
      res.status(200).json({ success: true, profile: { ...data, uid } });
      return;
    }

    // Initialize default profile based on user's basic record if existing
    const userDocRef = firestore.collection('users').doc(uid);
    const userDoc = await userDocRef.get();
    const userData = userDoc.exists ? userDoc.data() : null;

    let initialUsername = userData?.username ? normalizeUsername(userData.username) : '';
    // If user's existing username is reserved, leave blank so they claim a fresh one
    if (isReservedUsername(initialUsername)) {
      initialUsername = '';
    }

    const now = new Date().toISOString();
    const newProfile: BioPage = {
      uid,
      username: initialUsername,
      displayName: userData?.displayName || 'My Profile',
      bio: userData?.bio || 'Welcome to my official links page! ✨',
      avatarType: userData?.avatar === 'girl' || userData?.avatar === 'boy' ? userData.avatar : 'initials',
      avatarUrl: userData?.photoURL || '',
      theme: 'dark-modern',
      buttonStyle: 'rounded',
      isPublished: Boolean(initialUsername),
      links: [
        {
          id: `link-${Date.now()}-1`,
          title: 'My Official Website',
          url: 'https://hiiinishant.com',
          icon: 'website',
          isActive: true,
          order: 0,
          clicks: 0,
          createdAt: now,
        },
      ],
      socials: {},
      views: 0,
      totalClicks: 0,
      createdAt: now,
      updatedAt: now,
    };

    await bioDocRef.set(newProfile);
    res.status(200).json({ success: true, profile: newProfile });
  } catch (error: any) {
    console.error('[Bio API] Get /me error:', error);
    res.status(500).json({ error: error.message || 'Failed to retrieve profile.' });
  }
});

// ─── 3. Authenticated Endpoint: Update Current User's Bio Page ──────────────
// PUT /api/bio/me
router.put('/me', requireFirebaseAuth, async (req: Request, res: Response) => {
  try {
    const uid = (req as any).firebaseUid as string;
    const body = req.body || {};

    if (!firestore) {
      res.status(503).json({ error: 'Database service unavailable.' });
      return;
    }

    const bioDocRef = firestore.collection('bio_pages').doc(uid);
    const existingSnap = await bioDocRef.get();
    if (!existingSnap.exists) {
      res.status(404).json({ error: 'Bio profile not initialized.' });
      return;
    }

    const existingData = existingSnap.data() as BioPage;
    const now = new Date().toISOString();

    // ── Input Validations ──
    const displayName =
      typeof body.displayName === 'string'
        ? body.displayName.trim().slice(0, 60)
        : existingData.displayName;

    const bio =
      typeof body.bio === 'string' ? body.bio.trim().slice(0, 300) : existingData.bio;

    const allowedThemes: BioThemeId[] = [
      'dark-modern',
      'cyber-neon',
      'emerald-forest',
      'sunset-glow',
      'midnight-blue',
      'minimal-clean',
      'glass-frosted',
      'retro-synthwave',
    ];
    const theme = allowedThemes.includes(body.theme) ? body.theme : existingData.theme;

    const allowedButtonStyles: ButtonStyle[] = [
      'rounded',
      'pill',
      'sharp',
      'shadow',
      'outline',
      'glass',
    ];
    const buttonStyle = allowedButtonStyles.includes(body.buttonStyle)
      ? body.buttonStyle
      : existingData.buttonStyle;

    const avatarType = ['custom', 'boy', 'girl', 'initials'].includes(body.avatarType)
      ? body.avatarType
      : existingData.avatarType;

    let avatarUrl = existingData.avatarUrl || '';
    if (body.avatarUrl !== undefined) {
      if (typeof body.avatarUrl === 'string' && body.avatarUrl.trim().length > 0) {
        const cleanUrl = body.avatarUrl.trim();
        if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
          avatarUrl = cleanUrl.slice(0, 1000);
        } else if (cleanUrl.startsWith('data:image/')) {
          avatarUrl = cleanUrl.slice(0, 500000);
        }
      } else {
        avatarUrl = '';
      }
    }

    const isPublished =
      typeof body.isPublished === 'boolean' ? body.isPublished : existingData.isPublished;

    // ── Sanitize Links Array ──
    let links: BioLink[] = existingData.links || [];
    if (Array.isArray(body.links)) {
      const existingClickMap = new Map<string, number>();
      for (const l of existingData.links || []) {
        existingClickMap.set(l.id, l.clicks || 0);
      }

      links = body.links.slice(0, 50).map((item: any, idx: number): BioLink => {
        const id = typeof item.id === 'string' && item.id.length > 0 ? item.id : `link-${Date.now()}-${idx}`;
        const title = typeof item.title === 'string' ? item.title.trim().slice(0, 100) : 'Untitled Link';
        let url = typeof item.url === 'string' ? item.url.trim() : '';
        
        // Auto-fix URL if user omitted protocol
        if (url && !url.includes('://') && !url.startsWith('mailto:') && !url.startsWith('tel:')) {
          url = `https://${url}`;
        }

        // Validate strictly to prevent XSS (javascript:, data:, etc.)
        if (!isValidBioUrl(url)) {
          url = 'https://hiiinishant.com';
        }

        const icon = typeof item.icon === 'string' ? item.icon.slice(0, 30) : 'link';
        const isActive = typeof item.isActive === 'boolean' ? item.isActive : true;
        const order = typeof item.order === 'number' ? item.order : idx;
        const clicks = existingClickMap.get(id) || 0;

        return {
          id,
          title: title || 'Link',
          url,
          icon,
          isActive,
          order,
          clicks,
          createdAt: item.createdAt || now,
        };
      });
    }

    // ── Sanitize Socials Object ──
    const socials: Record<string, string> = {};
    const allowedSocialKeys = [
      'instagram',
      'youtube',
      'twitter',
      'linkedin',
      'github',
      'telegram',
      'facebook',
      'tiktok',
      'whatsapp',
      'email',
      'spotify',
      'discord',
    ];
    if (body.socials && typeof body.socials === 'object') {
      for (const key of allowedSocialKeys) {
        const val = body.socials[key];
        if (typeof val === 'string' && val.trim().length > 0) {
          socials[key] = val.trim().slice(0, 150);
        }
      }
    }

    // ── Sanitize Custom Color Palette (Linktree-style) ──
    const isValidHex = (hex: any): boolean => {
      if (typeof hex !== 'string') return false;
      return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(hex.trim());
    };

    const isValidGradient = (grad: any): boolean => {
      if (typeof grad !== 'string') return false;
      const trimmed = grad.trim();
      if (trimmed.length > 250) return false;
      const isGrad =
        /^linear-gradient\([^;{}]+\)$/.test(trimmed) ||
        /^radial-gradient\([^;{}]+\)$/.test(trimmed);
      const isSafe = !/[;{}<>]|url|expression|javascript/i.test(trimmed);
      return isGrad && isSafe;
    };

    const useCustomColors =
      typeof body.useCustomColors === 'boolean'
        ? body.useCustomColors
        : existingData.useCustomColors || false;

    let customColors = existingData.customColors || {};
    if (body.customColors && typeof body.customColors === 'object') {
      const bColors = body.customColors;
      const sanitized: any = {};
      if (isValidHex(bColors.backgroundColor)) sanitized.backgroundColor = bColors.backgroundColor.trim();
      if (isValidGradient(bColors.backgroundGradient)) sanitized.backgroundGradient = bColors.backgroundGradient.trim();
      if (isValidHex(bColors.buttonColor)) sanitized.buttonColor = bColors.buttonColor.trim();
      if (isValidHex(bColors.buttonTextColor)) sanitized.buttonTextColor = bColors.buttonTextColor.trim();
      if (isValidHex(bColors.textColor)) sanitized.textColor = bColors.textColor.trim();
      if (isValidHex(bColors.accentColor)) sanitized.accentColor = bColors.accentColor.trim();
      customColors = sanitized;
    }

    const updatedData: Partial<BioPage> = {
      displayName,
      bio,
      theme,
      buttonStyle,
      avatarType,
      avatarUrl,
      isPublished,
      links,
      socials,
      customColors,
      useCustomColors,
      updatedAt: now,
    };

    await bioDocRef.set(updatedData, { merge: true });

    const finalSnap = await bioDocRef.get();
    res.status(200).json({ success: true, profile: { ...finalSnap.data(), uid } });
  } catch (error: any) {
    console.error('[Bio API] Update /me error:', error);
    res.status(500).json({ error: error.message || 'Failed to update profile.' });
  }
});

// ─── 3b. Authenticated Endpoint: Upload Custom Avatar Image ──────────────────
// POST /api/bio/upload-avatar
router.post('/upload-avatar', requireFirebaseAuth, upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Image file is required.' });
      return;
    }

    const uid = (req as any).firebaseUid as string;
    const uploadResult = await uploadBuffer(req.file.buffer, {
      folder: 'hiiinishant/bio_avatars',
      transformation: 'w_400,h_400,c_fill,g_face',
      quality: 'auto',
      fetch_format: 'auto',
    });

    if (firestore) {
      const bioDocRef = firestore.collection('bio_pages').doc(uid);
      await bioDocRef.set(
        {
          avatarType: 'custom',
          avatarUrl: uploadResult.secureUrl,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }

    res.status(200).json({
      success: true,
      url: uploadResult.secureUrl,
      publicId: uploadResult.publicId,
    });
  } catch (error: any) {
    console.error('[Bio API] Upload avatar error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload avatar image.' });
  }
});

// ─── 4. Authenticated Endpoint: Claim / Update Username ──────────────────────
// POST /api/bio/claim-username
router.post('/claim-username', requireFirebaseAuth, async (req: Request, res: Response) => {
  try {
    const uid = (req as any).firebaseUid as string;
    const { username: rawUsername } = req.body || {};

    if (!rawUsername || typeof rawUsername !== 'string') {
      res.status(400).json({ error: 'Username is required.' });
      return;
    }

    const username = normalizeUsername(rawUsername);

    if (!isValidUsernameFormat(username)) {
      res.status(400).json({
        error: 'Username must be 3-30 characters with letters, numbers, and underscores only.',
      });
      return;
    }

    if (isReservedUsername(username)) {
      res.status(400).json({
        error: 'This username is reserved for system routes. Please choose a different handle.',
      });
      return;
    }

    if (!firestore) {
      res.status(503).json({ error: 'Database service unavailable.' });
      return;
    }

    const db = firestore;

    // Check if another bio_page already has this username
    const existingBio = await db
      .collection('bio_pages')
      .where('username', '==', username)
      .limit(1)
      .get();

    if (!existingBio.empty && existingBio.docs[0].id !== uid) {
      res.status(409).json({ error: 'Username is already taken by another user.' });
      return;
    }

    // Check if another user has this username in users collection
    const existingUser = await db
      .collection('users')
      .where('username', '==', username)
      .limit(1)
      .get();

    if (!existingUser.empty && existingUser.docs[0].id !== uid) {
      res.status(409).json({ error: 'Username is already taken by another user.' });
      return;
    }

    const now = new Date().toISOString();

    // Atomically update bio_pages and users document
    await db.runTransaction(async (transaction) => {
      const bioRef = db.collection('bio_pages').doc(uid);
      const userRef = db.collection('users').doc(uid);

      transaction.set(bioRef, { username, updatedAt: now }, { merge: true });
      transaction.set(userRef, { username, updatedAt: now }, { merge: true });
    });

    res.status(200).json({ success: true, username });
  } catch (error: any) {
    console.error('[Bio API] Claim username error:', error);
    res.status(500).json({ error: error.message || 'Failed to claim username.' });
  }
});

// ─── 5. Public Endpoint: Get Public Profile by Username ──────────────────────
// GET /api/bio/:username
router.get('/:username', async (req: Request, res: Response) => {
  try {
    const raw = Array.isArray(req.params.username) ? req.params.username[0] : req.params.username;
    if (!raw) {
      res.status(400).json({ error: 'Username is required.' });
      return;
    }

    const username = normalizeUsername(raw);

    if (!isValidUsernameFormat(username) || isReservedUsername(username)) {
      res.status(404).json({ error: 'Profile not found.' });
      return;
    }

    if (!firestore) {
      res.status(503).json({ error: 'Database service unavailable.' });
      return;
    }

    const snapshot = await firestore
      .collection('bio_pages')
      .where('username', '==', username)
      .limit(1)
      .get();

    if (snapshot.empty) {
      res.status(404).json({ error: 'Profile not found.' });
      return;
    }

    const doc = snapshot.docs[0];
    const data = doc.data() as BioPage;

    // Check if published
    if (!data.isPublished) {
      res.status(200).json({
        isPublished: false,
        username: data.username,
        displayName: data.displayName,
        avatarType: data.avatarType,
        avatarUrl: data.avatarUrl,
      });
      return;
    }

    // Filter to only active links and sort by order
    const activeLinks = (data.links || [])
      .filter((link) => link.isActive)
      .sort((a, b) => a.order - b.order)
      .map((link) => ({
        id: link.id,
        title: link.title,
        url: link.url,
        icon: link.icon || 'link',
        order: link.order,
      }));

    // Return safe public profile ONLY. Never expose email, tokens, or UIDs.
    res.status(200).json({
      isPublished: true,
      username: data.username,
      displayName: data.displayName,
      bio: data.bio || '',
      avatarType: data.avatarType || 'initials',
      avatarUrl: data.avatarUrl || '',
      theme: data.theme || 'dark-modern',
      buttonStyle: data.buttonStyle || 'rounded',
      customBackgroundColor: data.customBackgroundColor,
      customAccentColor: data.customAccentColor,
      customColors: data.customColors,
      useCustomColors: data.useCustomColors || false,
      links: activeLinks,
      socials: data.socials || {},
    });
  } catch (error: any) {
    console.error('[Bio API] Get public profile error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch public profile.' });
  }
});

// ─── 6. Public Endpoint: Track Profile View ──────────────────────────────────
// POST /api/bio/:username/view
router.post('/:username/view', async (req: Request, res: Response) => {
  try {
    const raw = Array.isArray(req.params.username) ? req.params.username[0] : req.params.username;
    if (!raw) {
      res.status(400).json({ error: 'Username is required.' });
      return;
    }

    const username = normalizeUsername(raw);
    const userAgent = req.headers['user-agent'] || '';

    // Ignore bot traffic
    if (isBot(userAgent)) {
      res.status(200).json({ counted: false, reason: 'bot-filtered' });
      return;
    }

    // Rate-limit same IP viewing the same profile within 60 seconds
    const clientIp = getClientIp(req);
    const cooldownKey = `view:${clientIp}:${username}`;
    const now = Date.now();
    const lastView = ipViewCooldown.get(cooldownKey);

    if (lastView && now - lastView < 60_000) {
      res.status(200).json({ counted: false, reason: 'rate-limited' });
      return;
    }

    ipViewCooldown.set(cooldownKey, now);

    if (!firestore) {
      res.status(200).json({ counted: false });
      return;
    }

    const snap = await firestore
      .collection('bio_pages')
      .where('username', '==', username)
      .limit(1)
      .get();

    if (!snap.empty) {
      const docRef = snap.docs[0].ref;
      // Atomically update the running total AND the daily time-series bucket
      await Promise.all([
        docRef.update({ views: admin.firestore.FieldValue.increment(1) }),
        incrementDailyStat(docRef, 'views'),
      ]);
    }

    res.status(200).json({ success: true, counted: true });
  } catch (error: any) {
    // Non-blocking for client experience
    console.warn('[Bio API] Track view warning:', error.message);
    res.status(200).json({ success: false });
  }
});

// ─── 7. Public Endpoint: Track Link Click ────────────────────────────────────
// POST /api/bio/:username/click/:linkId
router.post('/:username/click/:linkId', async (req: Request, res: Response) => {
  try {
    const raw = Array.isArray(req.params.username) ? req.params.username[0] : req.params.username;
    const linkId = Array.isArray(req.params.linkId) ? req.params.linkId[0] : req.params.linkId;
    if (!raw || !linkId) {
      res.status(400).json({ error: 'Username and linkId are required.' });
      return;
    }

    const username = normalizeUsername(raw);
    const userAgent = req.headers['user-agent'] || '';

    // Filter bots
    if (isBot(userAgent)) {
      res.status(200).json({ counted: false, reason: 'bot-filtered' });
      return;
    }

    // Rate limit same IP clicking same link within 10 seconds
    const clientIp = getClientIp(req);
    const cooldownKey = `click:${clientIp}:${username}:${linkId}`;
    const now = Date.now();
    const lastClick = ipClickCooldown.get(cooldownKey);

    if (lastClick && now - lastClick < 10_000) {
      res.status(200).json({ counted: false, reason: 'rate-limited' });
      return;
    }

    ipClickCooldown.set(cooldownKey, now);

    if (!firestore) {
      res.status(200).json({ counted: false });
      return;
    }

    const snap = await firestore
      .collection('bio_pages')
      .where('username', '==', username)
      .limit(1)
      .get();

    if (!snap.empty) {
      const docRef = snap.docs[0].ref;
      const data = snap.docs[0].data() as BioPage;
      const links = data.links || [];

      let found = false;
      const updatedLinks = links.map((l) => {
        if (l.id === linkId) {
          found = true;
          return { ...l, clicks: (l.clicks || 0) + 1 };
        }
        return l;
      });

      if (found) {
        // Atomically update running totals AND the daily time-series bucket
        await Promise.all([
          docRef.update({
            links: updatedLinks,
            totalClicks: admin.firestore.FieldValue.increment(1),
          }),
          incrementDailyStat(docRef, 'clicks'),
        ]);
      }
    }

    res.status(200).json({ success: true, counted: true });
  } catch (error: any) {
    console.warn('[Bio API] Track click warning:', error.message);
    res.status(200).json({ success: false });
  }
});

/**
 * GET /api/bio/featured-link
 * Public endpoint: Returns Nishant's bio link settings for the homepage portal card.
 */
router.get('/featured-link', async (_req: Request, res: Response): Promise<void> => {
  try {
    const DEFAULT_FEATURED = {
      bioUrl: '/nishant',
      bioHandle: 'nishant',
      bioTitle: "Nishant's Bio Link",
      bioDescription: "Explore all of Nishant's official links, social channels, and featured projects in one clean personal hub.",
      buttonText: "Visit Nishant's Bio",
    };

    if (!firestore) {
      res.status(200).json(DEFAULT_FEATURED);
      return;
    }

    const doc = await firestore.collection('siteSettings').doc('featured_bio').get();
    if (doc.exists && doc.data()?.bioUrl) {
      const data = doc.data()!;
      res.status(200).json({
        bioUrl: data.bioUrl || DEFAULT_FEATURED.bioUrl,
        bioHandle: data.bioHandle || DEFAULT_FEATURED.bioHandle,
        bioTitle: data.bioTitle || DEFAULT_FEATURED.bioTitle,
        bioDescription: data.bioDescription || DEFAULT_FEATURED.bioDescription,
        buttonText: data.buttonText || DEFAULT_FEATURED.buttonText,
      });
      return;
    }

    res.status(200).json(DEFAULT_FEATURED);
  } catch (error: any) {
    res.status(200).json({
      bioUrl: '/nishant',
      bioHandle: 'nishant',
      bioTitle: "Nishant's Bio Link",
      bioDescription: "Explore all of Nishant's official links, social channels, and featured projects in one clean personal hub.",
      buttonText: "Visit Nishant's Bio",
    });
  }
});

/**
 * POST /api/bio/featured-link
 * Admin endpoint: Updates Nishant's bio link settings from the Admin Console.
 */
router.post('/featured-link', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!firestore) {
      res.status(503).json({ error: 'Database not available.' });
      return;
    }

    const { bioUrl, bioHandle, bioTitle, bioDescription, buttonText } = req.body;
    let url = (bioUrl || '').trim();
    if (url && !url.startsWith('/') && !url.startsWith('http://') && !url.startsWith('https://')) {
      url = `/${url}`;
    }

    const updateData = {
      bioUrl: url || '/nishant',
      bioHandle: (bioHandle || '').trim().replace(/^@/, '') || 'nishant',
      bioTitle: (bioTitle || '').trim() || "Nishant's Bio Link",
      bioDescription:
        (bioDescription || '').trim() ||
        "Explore all of Nishant's official links, social channels, and featured projects in one clean personal hub.",
      buttonText: (buttonText || '').trim() || "Visit Nishant's Bio",
      updatedAt: new Date().toISOString(),
    };

    await firestore.collection('siteSettings').doc('featured_bio').set(updateData, { merge: true });

    res.status(200).json({ success: true, ...updateData });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to save bio link settings' });
  }
});

export default router;
