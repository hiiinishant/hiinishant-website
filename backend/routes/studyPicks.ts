import { Router, Request, Response } from 'express';
import { firestore } from '../lib/firebaseAdmin';
import { requireAuth } from '../middleware/auth';

const router = Router();
const COLLECTION_NAME = 'studyPicks';

// Helper: Extract slug or product identifier from 2amstudy URL
function parse2amStudyUrl(inputUrl: string): { slug: string; canonicalUrl: string } {
  let cleanUrl = inputUrl.trim();
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = 'https://' + cleanUrl;
  }

  let slug = '';
  try {
    const parsed = new URL(cleanUrl);
    const parts = parsed.pathname.split('/').filter(Boolean);
    if (parts.length >= 2 && ['product', 'products', 'store', 'item', 'p'].includes(parts[0].toLowerCase())) {
      slug = parts[1];
    } else if (parts.length >= 1) {
      slug = parts[parts.length - 1];
    }
  } catch {
    slug = cleanUrl.replace(/[^a-zA-Z0-9-_]/g, '-');
  }
  slug = slug || 'notebook';
  return { slug, canonicalUrl: cleanUrl };
}

function formatTitleFromSlug(slug: string): string {
  const words = slug.replace(/[-_+]/g, ' ').replace(/\s+/g, ' ').trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  const formatted = words.join(' ');
  if (!formatted.toLowerCase().includes('study')) {
    return '💛- 2 AM Study ' + formatted;
  }
  return '💛 ' + formatted;
}


async function resolve2amProduct(inputUrl: string): Promise<{
  productId: string;
  title: string;
  imageUrl: string;
  price: string;
  salePrice?: string;
  availability: string;
  canonicalUrl: string;
  description?: string;
}> {
  const { slug, canonicalUrl } = parse2amStudyUrl(inputUrl);

  const apiCandidates = [
    `https://store.2amstudy.com/api/products/${slug}`,
    `https://2amstudy.com/api/products/${slug}`,
    `https://2amstudy.com/api/store/${slug}`,
  ];

  for (const apiUrl of apiCandidates) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(apiUrl, { headers: { Accept: 'application/json' }, signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data: any = await res.json();
        if (data && (data.title || data.name)) {
          return {
            productId: data.id || slug,
            title: data.title || data.name || formatTitleFromSlug(slug),
            imageUrl: data.imageUrl || data.image || data.thumbnail || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
            price: data.price ? (`₹${data.price}`.replace('₹₹', '₹')) : '₹199',
            salePrice: data.salePrice ? (`x��${data.salePrice}`.replace('₹₹', '₹')) : undefined,
            availability: data.inStock !== false && data.availability !== 'out_of_stock' ? 'In Stock' : 'Out of Stock',
            canonicalUrl: data.url || canonicalUrl,
            description: data.description || 'Official 2 AM Study educational gear & learning resources.',
          };
        }
      }
    } catch {}
  }

  const derivedTitle = formatTitleFromSlug(slug);
  let defaultImage = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80';
  if (slug.includes('notebook') || slug.includes('diary')) {
    defaultImage = 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=800&auto=format&fit=crop&q=80';
  } else if (slug.includes('gate') || slug.includes('notes') || slug.includes('book')) {
    defaultImage = 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=80';
  } else if (slug.includes('bottle') || slug.includes('mug')) {
    defaultImage = 'https://images.unsplash.com/photo-1602143407151-71111542de6e8?w=800&auto=format&fit=crop&q=80';
  }

  return {
    productId: slug,
    title: derivedTitle,
    imageUrl: defaultImage,
    price: '₹199',
    availability: 'In Stock',
    canonicalUrl,
    description: 'Official 2 AM Study learning resource & productivity essential.',
  };
}

router.get('/', async (_req: Request, res: Response) => {
  try {
    if (!firestore) {
      res.status(200).json([]);
      return;
    }
    const snap = await firestore.collection(COLLECTION_NAME).get();
    const items = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    items.sort((a: any, b: any) => {
      const orderA = typeof a.displayOrder === 'number' ? a.displayOrder : 999;
      const orderB = typeof b.displayOrder === 'number' ? b.displayOrder : 999;
      if (orderA !== orderB) return orderA - orderB;
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });
    res.status(200).json(items);
  } catch (error: any) {
    console.error('[study-picks/list] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch 2 AM Study picks' });
  }
});


router.post('/preview', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: '2 AM Study Product URL is required' });
      return;
    }
    const preview = await resolve2amProduct(url);
    res.status(200).json(preview);
  } catch (error: any) {
    console.error('[study-picks/preview] Error:', error);
    res.status(500).json({ error: 'Failed to preview 2 AM Study product' });
  }
});


router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!firestore) {
      res.status(503).json({ error: 'Database unavailable' });
      return;
    }
    const { productUrl, productId, title, imageUrl, price, salePrice, availability, description, isFeatured, displayOrder } = req.body;
    if (!productUrl || !productUrl.trim()) {
      res.status(400).json({ error: '2 AM Study Product URL is required' });
      return;
    }
    let resolvedData: any = {};
    if (!title || !imageUrl) {
      resolvedData = await resolve2amProduct(productUrl);
    }
    const now = new Date().toISOString();
    const itemData = {
      productId: productId || resolvedData.productId || 'study-item',
      productUrl: productUrl.trim(),
      title: (title || resolvedData.title || '2 AM Study Product').trim(),
      imageUrl: (imageUrl || resolvedData.imageUrl || '').trim(),
      price: (price || resolvedData.price || '₹199').trim(),
      salePrice: (salePrice || resolvedData.salePrice || '').trim(),
      availability: availability || resolvedData.availability || 'In Stock',
      description: (description || resolvedData.description || '').trim(),
      isFeatured: !!isFeatured,
      displayOrder: typeof displayOrder === 'number' ? displayOrder : 0,
      createdAt: now,
      updatedAt: now,
    };
    const docRef = await firestore.collection(COLLECTION_NAME).add(itemData);
    const doc = await docRef.get();
    res.status(201).json({ id: doc.id, ...doc.data() });
  } catch (error: any) {
    console.error('[study-picks/create] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to save 2 AM Study pick' });
  }
});


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
      res.status(404).json({ error: 'Study pick not found' });
      return;
    }
    const updateData: any = { ...req.body, updatedAt: new Date().toISOString() };
    delete updateData.id;
    await docRef.update(updateData);
    const updated = await docRef.get();
    res.status(200).json({ id: updated.id, ...updated.data() });
  } catch (error: any) {
    console.error('[study-picks/update] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to update 2 AM Study pick' });
  }
});


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
      res.status(404).json({ error: 'Study pick not found' });
      return;
    }
    await docRef.delete();
    res.status(200).json({ success: true, message: '2 AM Study pick deleted successfully' });
  } catch (error: any) {
    console.error('[study-picks/delete] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete 2 AM Study pick' });
  }
});

export default router;
