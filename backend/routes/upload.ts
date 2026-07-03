import { Router } from 'express';
import multer from 'multer';
import { uploadBuffer, deleteImage } from '../lib/cloudinary';
import { requireAuth } from '../middleware/auth';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * Generic image upload endpoint
 * Supports uploads for: Gallery, Blog, User Profile, Nsgram posts, Project images
 */
router.post('/', requireAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "Image file is required." });
      return;
    }

    const { type, folder } = req.body;
    
    // Determine folder based on type
    const uploadFolder = folder || `hiiinishant/${type || 'general'}`;
    
    const uploadResult = await uploadBuffer(req.file.buffer, {
      folder: uploadFolder,
      quality: 'auto',
      fetch_format: 'auto',
    });

    res.status(200).json({
      url: uploadResult.secureUrl,
      publicId: uploadResult.publicId,
      width: uploadResult.width,
      height: uploadResult.height,
      format: uploadResult.format,
      bytes: uploadResult.bytes,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || "Failed to upload image" });
  }
});

/**
 * Delete image by public ID
 */
router.delete('/', requireAuth, async (req, res) => {
  try {
    const { publicId } = req.body;
    if (!publicId) {
      res.status(400).json({ error: "Public ID is required." });
      return;
    }

    const result = await deleteImage(publicId);
    res.status(200).json({ success: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to delete image" });
  }
});

export default router;
