import { Router, Request, Response } from 'express';
import multer from 'multer';
import { firestore } from '../lib/firebaseAdmin';
import { requireAuth } from '../middleware/auth';
import { uploadBuffer } from '../lib/cloudinary';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const COLLECTION_NAME = 'amazonPicks';

export const DEFAULT_CATEGORIES = [
  "Tech & Desk Setup",
  "Study Essentials",
  "Books & Learning",
  "Audio & Accessories",
  "Productivity & Tools",
  "Lifestyle & Health",
  "Beauty",
];

// Helper: Verify if Amazon CDN image exists and is a real image (> 500 bytes)
async function verifyAmazonCdnImage(imageUrl: string): Promise<boolean> {
  if (!imageUrl) return false;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(imageUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) return false;

    const contentType = res.headers.get('content-type') || '';
    const contentLength = parseInt(res.headers.get('content-length') || '0', 10);

    // Amazon missing ASIN returns a 1x1 GIF of 43 bytes
    if (contentLength > 0 && contentLength < 500) {
      return false;
    }

    return contentType.startsWith('image/');
  } catch {
    return false;
  }
}

// Helper: Extract ASIN & format title from Amazon URL (without web scraping)
async function resolveAmazonUrl(inputUrl: string): Promise<{
  resolvedUrl: string;
  asin?: string;
  suggestedTitle: string;
  suggestedImage: string;
  isImageVerified: boolean;
}> {
  let targetUrl = inputUrl.trim();
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = `https://${targetUrl}`;
  }

  let finalUrl = targetUrl;
  try {
    // Resolve shortlinks (e.g. amzn.to / amzn.in) safely with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(targetUrl, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (response.url) {
      finalUrl = response.url;
    }
  } catch (err) {
    // If request times out or fails, proceed with initial URL
    finalUrl = targetUrl;
  }

  // Extract ASIN (10-character alphanumeric)
  // Patterns: /dp/B0..., /gp/product/B0..., /d/B0..., /asin/B0..., /product/B0...
  const asinMatch = finalUrl.match(/(?:\/dp\/|\/gp\/product\/|\/d\/|\/asin\/|\/product\/)([A-Z0-9]{10})/i) ||
    targetUrl.match(/(?:\/dp\/|\/gp\/product\/|\/d\/|\/asin\/|\/product\/)([A-Z0-9]{10})/i);

  const asin = asinMatch ? asinMatch[1].toUpperCase() : undefined;

  // Extract title from slug in URL if available (e.g. amazon.in/Product-Title-Here/dp/B0...)
  let suggestedTitle = "";
  try {
    const parsed = new URL(finalUrl);
    const pathname = parsed.pathname;
    const parts = pathname.split('/').filter(Boolean);

    // Check if the segment preceding /dp/ or /d/ is a readable slug
    const dpIndex = parts.findIndex(p => p.toLowerCase() === 'dp' || p.toLowerCase() === 'd' || p.toLowerCase() === 'product');
    if (dpIndex > 0) {
      const slug = parts[dpIndex - 1];
      if (slug && slug.length > 2 && !slug.toLowerCase().startsWith('gp')) {
        suggestedTitle = decodeURIComponent(slug)
          .replace(/[-_+]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        // Capitalize words
        suggestedTitle = suggestedTitle
          .split(' ')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
      }
    }
  } catch {
    // Ignore URL parse errors
  }

  if (!suggestedTitle && asin) {
    suggestedTitle = `Amazon Product (${asin})`;
  } else if (!suggestedTitle) {
    suggestedTitle = "Amazon Recommended Pick";
  }

  // Test standard CDN high-res image template
  let suggestedImage = "";
  let isImageVerified = false;

  if (asin) {
    const candidateCdn = `https://images-na.ssl-images-amazon.com/images/P/${asin}.01.LZZZZZZZ.jpg`;
    isImageVerified = await verifyAmazonCdnImage(candidateCdn);
    if (isImageVerified) {
      suggestedImage = candidateCdn;
    }
  }

  return {
    resolvedUrl: finalUrl,
    asin,
    suggestedTitle,
    suggestedImage,
    isImageVerified,
  };
}

// ─── GET /api/amazon-picks ──────────────────────────────────────────────────
// Returns all picks, optional filter ?category=... & ?featured=true
router.get('/', async (req: Request, res: Response) => {
  try {
    if (!firestore) {
      res.status(200).json([]);
      return;
    }

    let query: any = firestore.collection(COLLECTION_NAME);

    const { category, featured } = req.query;

    if (category && typeof category === 'string' && category !== 'All') {
      query = query.where('category', '==', category.trim());
    }

    if (featured === 'true') {
      query = query.where('isFeatured', '==', true);
    }

    const snap = await query.get();
    const items = snap.docs.map((d: any) => ({
      id: d.id,
      ...d.data(),
    }));

    // Sort in-memory by createdAt desc
    items.sort((a: any, b: any) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    res.status(200).json(items);
  } catch (error: any) {
    console.error('[amazon-picks/list] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch Amazon picks' });
  }
});

// ─── GET /api/amazon-picks/categories ───────────────────────────────────────
// Returns list of unique categories
router.get('/categories', async (_req: Request, res: Response) => {
  try {
    if (!firestore) {
      res.status(200).json(DEFAULT_CATEGORIES);
      return;
    }

    const snap = await firestore.collection(COLLECTION_NAME).get();
    const catSet = new Set<string>(DEFAULT_CATEGORIES);

    snap.docs.forEach((doc: any) => {
      const c = doc.data()?.category;
      if (c && typeof c === 'string' && c.trim()) {
        catSet.add(c.trim());
      }
    });

    res.status(200).json(Array.from(catSet));
  } catch (error: any) {
    console.error('[amazon-picks/categories] Error:', error);
    res.status(200).json(DEFAULT_CATEGORIES);
  }
});

// ─── POST /api/amazon-picks/preview ─────────────────────────────────────────
// Preview link: resolves shortlink, extracts ASIN, verifies CDN image, derives title
router.post('/preview', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: 'Amazon URL is required' });
      return;
    }

    const info = await resolveAmazonUrl(url);
    res.status(200).json(info);
  } catch (error: any) {
    console.error('[amazon-picks/preview] Error:', error);
    res.status(500).json({ error: 'Failed to preview Amazon link' });
  }
});

// ─── POST /api/amazon-picks/upload-image (Admin Only) ───────────────────────
// Upload a custom product image to Cloudinary
router.post('/upload-image', requireAuth, upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Image file is required' });
      return;
    }

    const uploadResult = await uploadBuffer(req.file.buffer, {
      folder: 'hiiinishant/amazon-picks',
      quality: 'auto',
      fetch_format: 'auto',
    });

    res.status(200).json({
      imageUrl: uploadResult.secureUrl,
      publicId: uploadResult.publicId,
    });
  } catch (error: any) {
    console.error('[amazon-picks/upload-image] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload image' });
  }
});

// ─── POST /api/amazon-picks (Admin Only) ─────────────────────────────────────
// Create new Amazon product pick
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!firestore) {
      res.status(503).json({ error: 'Database unavailable' });
      return;
    }

    const {
      affiliateUrl,
      title,
      category,
      imageUrl,
      price,
      description,
      isFeatured,
      asin,
      rating,
    } = req.body;

    if (!affiliateUrl || !affiliateUrl.trim()) {
      res.status(400).json({ error: 'Amazon product/affiliate link is required' });
      return;
    }

    // Auto-resolve if title or image missing
    let finalTitle = title?.trim();
    let finalImage = imageUrl?.trim();
    let finalAsin = asin?.trim();

    if (!finalTitle || !finalImage) {
      const resolved = await resolveAmazonUrl(affiliateUrl);
      if (!finalTitle) finalTitle = resolved.suggestedTitle;
      if (!finalImage) finalImage = resolved.suggestedImage;
      if (!finalAsin) finalAsin = resolved.asin;
    }

    const now = new Date().toISOString();
    const productData = {
      title: finalTitle || 'Amazon Pick',
      category: (category?.trim() || 'Tech & Desk Setup'),
      affiliateUrl: affiliateUrl.trim(), // Exact affiliate attribution preserved
      imageUrl: finalImage || '',
      price: price?.trim() || '', // Never guessed or faked
      description: description?.trim() || '',
      isFeatured: !!isFeatured,
      asin: finalAsin || '',
      rating: typeof rating === 'number' ? rating : 5,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await firestore.collection(COLLECTION_NAME).add(productData);
    const doc = await docRef.get();

    res.status(201).json({ id: doc.id, ...doc.data() });
  } catch (error: any) {
    console.error('[amazon-picks/create] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to save Amazon pick' });
  }
});

// ─── PUT /api/amazon-picks/:id (Admin Only) ──────────────────────────────────
// Update an existing pick
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!firestore) {
      res.status(503).json({ error: 'Database unavailable' });
      return;
    }

    const rawId = req.params.id;
    const id: string = Array.isArray(rawId) ? rawId[0] : (rawId as string);

    const docRef = firestore.collection(COLLECTION_NAME).doc(id);
    const existing = await docRef.get();
    if (!existing.exists) {
      res.status(404).json({ error: 'Product pick not found' });
      return;
    }

    const updateData: any = {
      ...req.body,
      updatedAt: new Date().toISOString(),
    };
    delete updateData.id; // Do not overwrite doc id

    await docRef.update(updateData);
    const updated = await docRef.get();

    res.status(200).json({ id: updated.id, ...updated.data() });
  } catch (error: any) {
    console.error('[amazon-picks/update] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to update Amazon pick' });
  }
});

// ─── DELETE /api/amazon-picks/:id (Admin Only) ──────────────────────────────
// Delete a pick
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!firestore) {
      res.status(503).json({ error: 'Database unavailable' });
      return;
    }

    const rawId = req.params.id;
    const id: string = Array.isArray(rawId) ? rawId[0] : (rawId as string);

    const docRef = firestore.collection(COLLECTION_NAME).doc(id);
    const existing = await docRef.get();
    if (!existing.exists) {
      res.status(404).json({ error: 'Product pick not found' });
      return;
    }

    await docRef.delete();
    res.status(200).json({ success: true, message: 'Product pick deleted successfully' });
  } catch (error: any) {
    console.error('[amazon-picks/delete] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete Amazon pick' });
  }
});

export default router;
