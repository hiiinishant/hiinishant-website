import { Router } from 'express';
import { firestore } from '../lib/firebaseAdmin';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) { res.status(400).json({ error: "Email is required." }); return; }
    const normalizedEmail = email.trim().toLowerCase();

    const existing = await firestore.collection('newsletterSubscribers').where('email', '==', normalizedEmail).limit(1).get();
    if (!existing.empty) {
      res.status(200).json({ success: true, message: "You're already subscribed! 🎉" });
      return;
    }

    await firestore.collection('newsletterSubscribers').add({
      email: normalizedEmail,
      date: new Date().toISOString()
    });
    res.status(201).json({ success: true, message: "You're in! Welcome to the journey. 🚀" });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to subscribe" });
  }
});

router.get('/', async (req, res) => {
  try {
    const snap = await firestore.collection('newsletterSubscribers').orderBy('date', 'desc').get();
    const subscribers = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    res.status(200).json(subscribers);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to load subscribers" });
  }
});

router.delete('/', async (req, res) => {
  try {
    const { id } = req.body;
    await firestore.collection('newsletterSubscribers').doc(id).delete();
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to delete subscriber" });
  }
});

export default router;
