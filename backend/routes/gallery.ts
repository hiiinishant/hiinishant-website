import { Router } from 'express';
import multer from 'multer';
import { firestore } from '../lib/firebaseAdmin';
import { requireAuth } from '../middleware/auth';
import { uploadBuffer, deleteImage } from '../lib/cloudinary';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Get all gallery photos
router.get('/', async (req, res) => {
  try {
    if (!firestore) {
      res.status(200).json([]);
      return;
    }

    const snap = await firestore.collection('gallery').orderBy('date', 'desc').get();
    const photos = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    res.status(200).json(photos);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch gallery photos" });
  }
});

// Upload a new gallery photo
router.post('/', requireAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "Image file is required." });
      return;
    }

    const { title, story, category } = req.body;
    if (!title || !category) {
      res.status(400).json({ error: "Title and category are required." });
      return;
    }

    // Upload to Cloudinary
    const uploadResult = await uploadBuffer(req.file.buffer, {
      folder: 'hiiinishant/gallery',
      quality: 'auto',
      fetch_format: 'auto',
    });

    // Store metadata in Firestore
    const photoData = {
      title: title.trim(),
      story: story?.trim() || '',
      category: category.trim(),
      imageUrl: uploadResult.secureUrl,
      imagePath: uploadResult.publicId,
      width: uploadResult.width,
      height: uploadResult.height,
      format: uploadResult.format,
      bytes: uploadResult.bytes,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };

    const docRef = await firestore.collection('gallery').add(photoData);
    const doc = await docRef.get();
    res.status(201).json({ id: doc.id, ...doc.data() });
  } catch (error: any) {
    console.error('Gallery upload error:', error);
    res.status(500).json({ error: error.message || "Failed to upload photo" });
  }
});

// Update a gallery photo
router.put('/', requireAuth, async (req, res) => {
  try {
    const { id, title, story, category } = req.body;
    if (!id) {
      res.status(400).json({ error: "ID is required." });
      return;
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (story !== undefined) updateData.story = story.trim();
    if (category !== undefined) updateData.category = category.trim();

    await firestore.collection('gallery').doc(id).update(updateData);
    const doc = await firestore.collection('gallery').doc(id).get();
    const data = doc.data();
    res.status(200).json({ id: doc.id, ...data });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to update photo" });
  }
});

// Delete a gallery photo
router.delete('/', requireAuth, async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      res.status(400).json({ error: "ID is required." });
      return;
    }

    const doc = await firestore.collection('gallery').doc(id).get();
    if (!doc.exists) {
      res.status(404).json({ error: "Photo not found." });
      return;
    }

    const data = doc.data();
    
    // Delete from Cloudinary if publicId exists
    if (data?.imagePath) {
      try {
        await deleteImage(data.imagePath);
      } catch (err) {
        console.error('Failed to delete from Cloudinary:', err);
        // Continue with Firestore deletion even if Cloudinary fails
      }
    }

    // Delete from Firestore
    await firestore.collection('gallery').doc(id).delete();
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to delete photo" });
  }
});

export default router;
