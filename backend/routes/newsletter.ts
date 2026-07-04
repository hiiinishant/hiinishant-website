import { Router } from 'express';
import { firestore } from '../lib/firebaseAdmin';
import { sendEmail } from '../lib/mail';

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
    let emailSent = false;
    const adminEmail = process.env.EMAIL_TO || 'hiiinishant@gmail.com';
    try {
      const adminRes = await sendEmail({
        to: adminEmail,
        subject: 'New Newsletter Subscription',
        text: `A new subscriber has joined: ${normalizedEmail}`,
        html: `<p>A new subscriber has joined: ${normalizedEmail}</p>`
      });
      const welcomeRes = await sendEmail({
        to: normalizedEmail,
        subject: 'Welcome to HiiiNishant!',
        text: `Hi,

Thank you for subscribing to the HiiiNishant newsletter!

On behalf of Team HiiiNishant, we're excited to have you with us. You'll receive occasional updates on new projects, technology, AI, study resources, videos, and important announcements.

We respect your inbox and will only send relevant updates.

Warm regards,

Nishant Kumar
Founder, 2 AM Study

Team HiiiNishant
Building the future of youth.`,
        html: `<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b; line-height: 1.6;">
  <p>Hi,</p>
  <p>Thank you for subscribing to the <strong>HiiiNishant</strong> newsletter!</p>
  <p>On behalf of <strong>Team HiiiNishant</strong>, we're excited to have you with us. You'll receive occasional updates on new projects, technology, AI, study resources, videos, and important announcements.</p>
  <p>We respect your inbox and will only send relevant updates.</p>
  <p style="margin-top: 24px; margin-bottom: 0;">Warm regards,</p>
  <p style="margin-top: 16px; margin-bottom: 0;"><strong>Nishant Kumar</strong><br/>Founder, 2 AM Study</p>
  <p style="margin-top: 16px; margin-bottom: 0; color: #475569;"><strong>Team HiiiNishant</strong><br/><em>Building the future of youth.</em></p>
</div>`
      });
      emailSent = adminRes.success && welcomeRes.success;
    } catch (emailErr) {
      console.error('[Newsletter] Email send error:', emailErr);
    }
    res.status(201).json({ success: true, message: "✅ Thanks for subscribing! Please check your email for a welcome message.", emailSent });
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
