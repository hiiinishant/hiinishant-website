import { Router } from 'express';
import { firestore } from '../lib/firebaseAdmin';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const snap = await firestore.collection('futurePlans').get();
    const plans = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    res.status(200).json(plans);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to load plans" });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, description, targetDate, category, status } = req.body;
    const docRef = await firestore.collection('futurePlans').add({
      title, description, targetDate, category, status
    });
    const doc = await docRef.get();
    res.status(201).json({ id: doc.id, ...doc.data() });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to create plan" });
  }
});

router.patch('/', requireAuth, async (req, res) => {
  try {
    const { id, status } = req.body;
    await firestore.collection('futurePlans').doc(id).update({ status });
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update plan" });
  }
});

router.delete('/', requireAuth, async (req, res) => {
  try {
    const { id } = req.body;
    await firestore.collection('futurePlans').doc(id).delete();
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to delete plan" });
  }
});

export default router;
