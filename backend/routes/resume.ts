// Resume management routes
import { Router } from 'express';
import multer from 'multer';
import { firestore } from '../lib/firebaseAdmin';
import { requireAuth } from '../middleware/auth';
import { uploadBuffer, deleteImage } from '../lib/cloudinary';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

// GET all resumes — latest first
router.get('/', async (req, res) => {
  try {
    if (!firestore) {
      res.status(200).json([]);
      return;
    }

    const snap = await firestore
      .collection('resumes')
      .orderBy('uploadedAt', 'desc')
      .get();
    const resumes = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(resumes);
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to fetch resumes' });
  }
});

// POST — upload a resume PDF/DOC/DOCX to Cloudinary and save secure_url in Firestore
router.post('/', requireAuth, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Resume file is required' });
    }
    if (!ALLOWED_MIME_TYPES.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Only PDF, DOC, and DOCX files are allowed' });
    }

    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Build a clean public_id preserving the original file extension (essential for 'raw' uploads)
    const ext = req.file.originalname.split('.').pop()?.toLowerCase() || 'pdf';
    const cleanBase = req.file.originalname
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9]/g, '_');
    const uniquePublicId = `${cleanBase}_${Date.now()}.${ext}`;

    // Upload to Cloudinary using resource_type 'raw' (preferred for PDFs)
    const uploadResult = await uploadBuffer(req.file.buffer, {
      folder: 'resumes',
      resourceType: 'raw',
      publicId: uniquePublicId,
    });

    // Audit and verify the uploaded file size and metadata
    console.log('[Resume Audit] Cloudinary raw upload response:', {
      resource_type: 'raw',
      format: uploadResult.format || ext,
      secure_url: uploadResult.secureUrl,
      bytes: uploadResult.bytes,
    });
    console.log(`[Resume Audit] Size check - Original: ${req.file.size} bytes | Uploaded: ${uploadResult.bytes} bytes`);

    if (uploadResult.bytes === 0) {
      console.warn('[Resume Audit] Warning: Uploaded file size is 0 bytes!');
    }
    if (req.file.size !== uploadResult.bytes) {
      console.warn(`[Resume Audit] Warning: File size mismatch! (Difference: ${Math.abs(req.file.size - uploadResult.bytes)} bytes)`);
    }

    const resumeUrl = uploadResult.secureUrl;

    // Save to Firestore
    const docRef = await firestore.collection('resumes').add({
      title: title.trim(),
      resumeUrl,                // direct secure_url
      filePath: uploadResult.publicId,
      resourceType: 'raw',
      uploadedAt: new Date().toISOString(),
    });

    console.log('[Resume] Saved to Firestore, doc ID:', docRef.id);

    const saved = await docRef.get();
    res.status(201).json({ id: docRef.id, ...saved.data() });
  } catch (e: any) {
    console.error('[Resume] Upload error:', e);
    res.status(500).json({ error: e.message || 'Failed to upload resume' });
  }
});

// DELETE a resume
router.delete('/', requireAuth, async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'Resume ID required' });
    }

    const docRef = firestore.collection('resumes').doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    const data = docSnap.data() as any;
    if (data?.filePath) {
      // resource_type for deletion — default to 'image' since auto maps PDFs to image
      const resType = data.resourceType === 'raw' ? 'raw' : 'image';
      await deleteImage(data.filePath, { resourceType: resType }).catch((e) => {
        console.error('[Resume] Failed to delete from Cloudinary:', e);
      });
    }

    await docRef.delete();
    res.status(200).json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to delete resume' });
  }
});

export default router;
