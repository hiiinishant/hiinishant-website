import { Router } from 'express';
import { firestore } from '../lib/firebaseAdmin';
import { sendEmail } from '../lib/mail';
import { requireAuth } from '../middleware/auth';
const router = Router();

router.post('/', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) { res.status(400).json({ error: "Email is required." }); return; }
    const emailTrim = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrim)) { res.status(400).json({ error: "Invalid email format." }); return; }
    const normalizedEmail = emailTrim.toLowerCase();

    const existing = await firestore.collection('newsletterSubscribers').where('email', '==', normalizedEmail).limit(1).get();
    if (!existing.empty) {
      res.status(200).json({ success: true, message: "You're already subscribed! 🎉" });
      return;
    }

    await firestore.collection('newsletterSubscribers').add({
      email: normalizedEmail,
      date: new Date().toISOString()
    });

    // Respond to user IMMEDIATELY — don't block on email sending
    res.status(201).json({
      success: true,
      message: "✅ Thanks for subscribing! Please check your email for a welcome message."
    });

    // Send both emails in parallel, after response is already sent
    const adminEmail = process.env.EMAIL_TO || 'hiiinishant@gmail.com';
    Promise.allSettled([
      sendEmail({
        to: adminEmail,
        subject: 'New Newsletter Subscription',
        text: `A new subscriber has joined: ${normalizedEmail}`,
        html: `<p>A new subscriber has joined: <strong>${normalizedEmail}</strong></p>`
      }),
      sendEmail({
        to: normalizedEmail,
        subject: 'Welcome to HiiiNishant!',
        text: `Hi,\n\nThank you for subscribing to the HiiiNishant newsletter!\n\nOn behalf of Team HiiiNishant, we're excited to have you with us. You'll receive occasional updates on new projects, technology, AI, study resources, videos, and important announcements.\n\nWe respect your inbox and will only send relevant updates.\n\nWarm regards,\n\nNishant Kumar\nFounder, 2 AM Study\n\nTeam HiiiNishant\nBuilding the future of youth.`,
        html: `<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b; line-height: 1.6;">
  <p>Hi,</p>
  <p>Thank you for subscribing to the <strong>HiiiNishant</strong> newsletter!</p>
  <p>On behalf of <strong>Team HiiiNishant</strong>, we're excited to have you with us. You'll receive occasional updates on new projects, technology, AI, study resources, videos, and important announcements.</p>
  <p>We respect your inbox and will only send relevant updates.</p>
  <p style="margin-top: 24px; margin-bottom: 0;">Warm regards,</p>
  <p style="margin-top: 16px; margin-bottom: 0;"><strong>Nishant Kumar</strong><br/>Founder, 2 AM Study</p>
  <p style="margin-top: 16px; margin-bottom: 0; color: #475569;"><strong>Team HiiiNishant</strong><br/><em>Building the future of youth.</em></p>
</div>`
      })
    ]).then((results) => {
      results.forEach((r, i) => {
        if (r.status === 'rejected') console.error(`[Newsletter] Email ${i === 0 ? 'admin' : 'welcome'} failed:`, r.reason);
        else console.log(`[Newsletter] Email ${i === 0 ? 'admin' : 'welcome'} sent OK`);
      });
    });

  } catch (error: any) {
    res.status(500).json({ error: "Failed to subscribe" });
  }
});

// GET — admin-only: view all subscribers
router.get('/', requireAuth, async (req, res) => {
  try {
    if (!firestore) {
      res.status(200).json([]);
      return;
    }
    const snap = await firestore.collection('newsletterSubscribers').orderBy('date', 'desc').get();
    const subscribers = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    res.status(200).json(subscribers);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to load subscribers" });
  }
});

// DELETE — admin-only: remove a subscriber
router.delete('/', requireAuth, async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      res.status(400).json({ error: "Subscriber ID is required." });
      return;
    }
    if (!firestore) {
      res.status(503).json({ error: "Database not available." });
      return;
    }
    await firestore.collection('newsletterSubscribers').doc(id).delete();
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to delete subscriber" });
  }
});

export default router;
