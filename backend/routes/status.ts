import { Router } from 'express';
import { firestore } from '../lib/firebaseAdmin';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const snap = await firestore.collection('dailyStatus').orderBy('date', 'desc').get();
    const statuses = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    res.status(200).json(statuses);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to load statuses" });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { date, statusText, tasks } = req.body;
    const docRef = firestore.collection('dailyStatus').doc(date);
    await docRef.set({
      date, statusText, tasks, updatedAt: new Date().toISOString()
    }, { merge: true });
    const doc = await docRef.get();
    res.status(201).json({ id: doc.id, ...doc.data() });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to create status" });
  }
});

router.delete('/', requireAuth, async (req, res) => {
  try {
    const { id } = req.body;
    await firestore.collection('dailyStatus').doc(id).delete();
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to delete status" });
  }
});

export default router;
