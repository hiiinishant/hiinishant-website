import { Router } from 'express';
import multer from 'multer';
import { firestore } from '../lib/firebaseAdmin';
import { requireAuth } from '../middleware/auth';
import { uploadBuffer, deleteImage } from '../lib/cloudinary';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', async (req, res) => {
  try {
    if (!firestore) {
      res.status(200).json([]);
      return;
    }

    const snap = await firestore.collection('blogs').orderBy('date', 'desc').get();
    const blogs = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    res.status(200).json(blogs);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch blogs" });
  }
});

router.post('/', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const { slug, title, excerpt, date, readTime, tags, featured, content } = req.body;
    if (!slug || !title || !content) { res.status(400).json({ error: "Slug, title, and content are required." }); return; }
    
    let imageUrl = '';
    let imagePath = '';
    
    // Upload image to Cloudinary if provided
    if (req.file) {
      const uploadResult = await uploadBuffer(req.file.buffer, {
        folder: 'hiiinishant/blog',
        quality: 'auto',
        fetch_format: 'auto',
      });
      imageUrl = uploadResult.secureUrl;
      imagePath = uploadResult.publicId;
    }
    
    const id = slug;
    await firestore.collection('blogs').doc(id).set({
      slug, title, excerpt, date: date || new Date().toISOString().split('T')[0], readTime: readTime || '1 min read', tags: tags || [], featured: !!featured, content, imageUrl, imagePath
    });
    res.status(201).json({ success: true, slug });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to create blog post" });
  }
});

router.put('/', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const { slug, title, excerpt, date, readTime, tags, featured, content, originalSlug } = req.body;
    if (!slug || !title || !content) {
      res.status(400).json({ error: "Slug, title, and content are required." });
      return;
    }
    if (!firestore) {
      res.status(503).json({ error: "Database not available." });
      return;
    }

    const targetSlug = originalSlug || slug;
    const docRef = firestore.collection('blogs').doc(targetSlug);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      res.status(404).json({ error: "Blog not found." });
      return;
    }

    const currentData = docSnap.data() || {};
    let imageUrl = currentData.imageUrl || '';
    let imagePath = currentData.imagePath || '';

    // Handle new image upload
    if (req.file) {
      if (imagePath) {
        try {
          await deleteImage(imagePath);
        } catch (err) {
          console.error('Failed to delete old blog image from Cloudinary:', err);
        }
      }
      const uploadResult = await uploadBuffer(req.file.buffer, {
        folder: 'hiiinishant/blog',
        quality: 'auto',
        fetch_format: 'auto',
      });
      imageUrl = uploadResult.secureUrl;
      imagePath = uploadResult.publicId;
    }

    // Support tags both as Array (already parsed) or string from frontend form body
    let tagsArray = tags || [];
    if (typeof tags === 'string') {
      try {
        tagsArray = JSON.parse(tags);
      } catch {
        tagsArray = tags.split(',').map((t: string) => t.trim()).filter(Boolean);
      }
    }

    const blogData = {
      slug,
      title,
      excerpt,
      date: date || new Date().toISOString().split('T')[0],
      readTime: readTime || '1 min read',
      tags: tagsArray,
      featured: typeof featured === 'boolean' ? featured : featured === 'true',
      content,
      imageUrl,
      imagePath
    };

    // If slug has changed, delete the old document and write the new one
    if (originalSlug && originalSlug !== slug) {
      await docRef.delete();
      await firestore.collection('blogs').doc(slug).set(blogData);
    } else {
      await firestore.collection('blogs').doc(slug).set(blogData);
    }

    res.status(200).json({ success: true, slug });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to update blog post" });
  }
});

router.delete('/', requireAuth, async (req, res) => {
  try {
    const { slug } = req.body;
    if (!slug) { res.status(400).json({ error: "Slug is required." }); return; }
    const docRef = firestore.collection('blogs').doc(slug);
    const doc = await docRef.get();
    if (!doc.exists) { res.status(404).json({ error: "Blog not found." }); return; }
    
    const data = doc.data();
    
    // Delete image from Cloudinary if it exists
    if (data?.imagePath) {
      try {
        await deleteImage(data.imagePath);
      } catch (err) {
        console.error('Failed to delete blog image from Cloudinary:', err);
      }
    }
    
    await docRef.delete();
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to delete blog post" });
  }
});

export default router;
