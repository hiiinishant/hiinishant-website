import { Router } from 'express';
import { firestore } from '../lib/firebaseAdmin';
import { EmailDeliveryError, sendEmail } from '../lib/mail';
import { requireAuth } from '../middleware/auth';
const router = Router();

router.post('/', async (req, res) => {
  console.log('[Newsletter] Subscription request received');
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

    // Send welcome email immediately upon subscription
    let emailSent = false;
    const adminEmail = process.env.EMAIL_TO || 'hiiinishant@gmail.com';

    try {
      const [adminRes, welcomeRes] = await Promise.allSettled([
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
      ]);

      if (welcomeRes.status === 'fulfilled') {
        console.log('[Newsletter] Welcome email sent successfully');
        emailSent = true;
      } else {
        const error = welcomeRes.reason as any;
        const msg = error?.message || (error instanceof EmailDeliveryError ? error.message : 'Unknown error');
        console.error('[Newsletter] Welcome email failed:', msg);
      }

      if (adminRes.status === 'fulfilled') {
        console.log('[Newsletter] Admin notification email sent successfully');
      } else {
        const error = adminRes.reason as any;
        const msg = error?.message || (error instanceof EmailDeliveryError ? error.message : 'Unknown error');
        console.error('[Newsletter] Admin notification email failed:', msg);
      }
    } catch (emailErr: any) {
      console.error('[Newsletter] Email send error:', emailErr?.message || emailErr);
    }

    res.status(201).json({
      success: true,
      message: "✅ Thanks for subscribing! Please check your email for a welcome message.",
      emailSent
    });

  } catch (error: any) {
    res.status(500).json({ error: "Failed to subscribe" });
  }
});

// GET — diagnostic: inspect email provider status safely without exposing secrets
router.get('/diagnostic', async (req, res) => {
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const emailFrom = process.env.EMAIL_FROM?.trim() || 'onboarding@resend.dev';
  const emailFromName = process.env.EMAIL_FROM_NAME?.trim() || 'Portfolio Website';
  const adminEmail = process.env.EMAIL_TO || 'hiiinishant@gmail.com';

  const diagnostic: any = {
    hasResendApiKey: Boolean(resendApiKey),
    resendKeyPrefix: resendApiKey ? `${resendApiKey.slice(0, 4)}...${resendApiKey.slice(-4)}` : null,
    resendKeyLength: resendApiKey ? resendApiKey.length : 0,
    emailFrom,
    emailFromName,
    adminEmail,
    smtpConfigured: Boolean(process.env.SMTP_USER && process.env.SMTP_PASS),
    activeProvider: resendApiKey ? 'resend' : (process.env.SMTP_USER && process.env.SMTP_PASS ? 'smtp' : 'none'),
  };

  if (resendApiKey) {
    try {
      const resp = await fetch('https://api.resend.com/domains', {
        headers: { Authorization: `Bearer ${resendApiKey}` },
      });
      const data = await resp.json() as any;
      if (resp.ok) {
        diagnostic.resendKeyStatus = 'VALID';
        const domainList = data?.data || [];
        diagnostic.verifiedDomains = [];

        for (const d of domainList) {
          try {
            const detailResp = await fetch(`https://api.resend.com/domains/${d.id}`, {
              headers: { Authorization: `Bearer ${resendApiKey}` },
            });
            const detail = await detailResp.json() as any;
            diagnostic.verifiedDomains.push({
              id: d.id,
              name: d.name,
              status: detail.status || d.status,
              region: d.region,
              records: (detail.records || []).map((r: any) => ({
                record: r.record,
                type: r.type,
                name: r.name,
                value: r.value,
                status: r.status,
              })),
            });
          } catch {
            diagnostic.verifiedDomains.push({
              id: d.id,
              name: d.name,
              status: d.status,
              region: d.region,
            });
          }
        }
      } else {
        diagnostic.resendKeyStatus = 'INVALID_OR_RESTRICTED';
        diagnostic.resendError = data?.message || `HTTP ${resp.status}`;
      }
    } catch (e: any) {
      diagnostic.resendKeyStatus = 'CONNECTION_ERROR';
      diagnostic.resendError = e?.message;
    }

    if (req.query.testEmail) {
      const testTo = String(req.query.testEmail).trim();
      try {
        const testResp = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: `"${emailFromName}" <${emailFrom}>`,
            to: [testTo],
            subject: "Test Diagnostic Email",
            text: "This is a diagnostic email from HiiiNishant.",
            html: "<p>This is a diagnostic email from HiiiNishant.</p>",
          }),
        });
        const testData = await testResp.json();
        diagnostic.testSendResult = {
          httpStatus: testResp.status,
          ok: testResp.ok,
          data: testData,
          fromUsed: `"${emailFromName}" <${emailFrom}>`,
          toUsed: testTo,
        };
      } catch (testErr: any) {
        diagnostic.testSendResult = {
          error: testErr.message,
        };
      }
    }
  }

  res.json(diagnostic);
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
