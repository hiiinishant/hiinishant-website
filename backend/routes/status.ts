import { Router } from 'express';
import { firestore } from '../lib/firebaseAdmin';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', async (req, res) => {
  try {
    if (!firestore) {
      res.status(200).json([]);
      return;
    }

    const snap = await firestore.collection('dailyStatus').orderBy('date', 'desc').get();
    const statuses = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    res.status(200).json(statuses);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to load statuses" });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { 
      date, 
      statusText, 
      tasks,
      study,
      project,
      content,
      health,
      finance,
      mood,
      bestMoment,
      lessonLearned
    } = req.body;

    const docRef = firestore.collection('dailyStatus').doc(date);
    const updateData: any = {
      date,
      updatedAt: new Date().toISOString()
    };

    if (statusText !== undefined) updateData.statusText = statusText;
    if (tasks !== undefined) updateData.tasks = tasks;
    if (study !== undefined) updateData.study = study;
    if (project !== undefined) updateData.project = project;
    if (content !== undefined) updateData.content = content;
    if (health !== undefined) updateData.health = health;
    if (finance !== undefined) updateData.finance = finance;
    if (mood !== undefined) updateData.mood = mood;
    if (bestMoment !== undefined) updateData.bestMoment = bestMoment;
    if (lessonLearned !== undefined) updateData.lessonLearned = lessonLearned;

    await docRef.set(updateData, { merge: true });
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
