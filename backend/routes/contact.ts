import { Router } from 'express';
import nodemailer from 'nodemailer';
import { firestore } from '../lib/firebaseAdmin';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    if (!firestore) {
      res.status(200).json([]);
      return;
    }

    const snap = await firestore.collection('contactMessages').orderBy('date', 'desc').get();
    const messages = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    res.status(200).json(messages);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to load messages" });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    if (!name || !email || !message) {
      res.status(400).json({ error: 'Name, email, and message are required.' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }

    const submittedAt = new Date();
    const formattedDate = submittedAt.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

    const messageData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : '',
      subject: subject ? subject.trim() : 'No Subject',
      message: message.trim(),
      date: submittedAt.toISOString(),
      read: false
    };

    // Always save to Firestore first
    await firestore.collection('contactMessages').add(messageData);

    // Respond to user IMMEDIATELY — don't block on email sending
    res.status(201).json({
      success: true,
      message: 'Message sent successfully.',
    });

    // Send admin notification email in background (non-blocking)
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const emailTo = process.env.EMAIL_TO || 'hiiinishant@gmail.com';
    const emailFromName = process.env.EMAIL_FROM_NAME || "Nishant's Portfolio";

    if (smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '465', 10),
        secure: process.env.SMTP_SECURE !== 'false',
        auth: { user: smtpUser, pass: smtpPass }
      });

      const phoneRow = messageData.phone
        ? `<tr>
             <td style="padding:10px 16px;font-size:13px;color:#94a3b8;white-space:nowrap;vertical-align:top">Phone</td>
             <td style="padding:10px 16px;font-size:14px;color:#e2e8f0">${messageData.phone}</td>
           </tr>`
        : '';

      const htmlBody = `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f172a;border-radius:16px;overflow:hidden;border:1px solid #1e293b">
          <!-- Header -->
          <div style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#a78bfa 100%);padding:32px 24px;text-align:center">
            <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px">📬 New Contact Form Submission</h1>
            <p style="margin:8px 0 0;font-size:12px;color:rgba(255,255,255,0.8);text-transform:uppercase;letter-spacing:1.5px">${emailFromName}</p>
          </div>

          <!-- Body -->
          <div style="padding:28px 24px">
            <!-- Submission time -->
            <div style="background:#1e293b;border-radius:10px;padding:12px 16px;margin-bottom:20px;display:flex;align-items:center">
              <span style="font-size:12px;color:#64748b">🕐 Submitted on</span>
              <span style="font-size:13px;color:#f59e0b;font-weight:600;margin-left:8px">${formattedDate}</span>
            </div>

            <!-- Details table -->
            <table style="width:100%;border-collapse:collapse;background:#1e293b;border-radius:10px;overflow:hidden">
              <tr style="border-bottom:1px solid #334155">
                <td style="padding:10px 16px;font-size:13px;color:#94a3b8;white-space:nowrap;vertical-align:top">Name</td>
                <td style="padding:10px 16px;font-size:14px;color:#e2e8f0;font-weight:600">${messageData.name}</td>
              </tr>
              <tr style="border-bottom:1px solid #334155">
                <td style="padding:10px 16px;font-size:13px;color:#94a3b8;white-space:nowrap;vertical-align:top">Email</td>
                <td style="padding:10px 16px;font-size:14px"><a href="mailto:${messageData.email}" style="color:#818cf8;text-decoration:none">${messageData.email}</a></td>
              </tr>
              ${phoneRow}
              <tr style="border-bottom:1px solid #334155">
                <td style="padding:10px 16px;font-size:13px;color:#94a3b8;white-space:nowrap;vertical-align:top">Subject</td>
                <td style="padding:10px 16px;font-size:14px;color:#e2e8f0">${messageData.subject}</td>
              </tr>
            </table>

            <!-- Message -->
            <div style="margin-top:20px">
              <p style="font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px">Message</p>
              <div style="background:#1e293b;border-left:4px solid #6366f1;border-radius:0 10px 10px 0;padding:16px 20px">
                <p style="margin:0;font-size:14px;color:#cbd5e1;line-height:1.7;white-space:pre-wrap">${messageData.message}</p>
              </div>
            </div>

            <!-- Reply CTA -->
            <div style="text-align:center;margin-top:28px">
              <a href="mailto:${messageData.email}?subject=Re: ${messageData.subject}" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600">Reply to ${messageData.name} →</a>
            </div>
          </div>

          <!-- Footer -->
          <div style="background:#0b1120;padding:16px 24px;text-align:center;border-top:1px solid #1e293b">
            <p style="margin:0;font-size:11px;color:#475569">This email was generated from your portfolio contact form.</p>
          </div>
        </div>`;

      const plainText = `New Contact Form Submission\n\nSubmitted: ${formattedDate}\n\nName: ${messageData.name}\nEmail: ${messageData.email}${messageData.phone ? '\nPhone: ' + messageData.phone : ''}\nSubject: ${messageData.subject}\n\nMessage:\n${messageData.message}`;

      transporter.sendMail({
        from: `"${emailFromName}" <${smtpUser}>`,
        to: emailTo,
        replyTo: messageData.email,
        subject: `📬 New Message: ${messageData.subject} — from ${messageData.name}`,
        html: htmlBody,
        text: plainText,
      }).then(() => {
        console.log('[Contact] Admin notification email sent OK');
      }).catch((emailErr: any) => {
        console.error('[Contact] Email notification failed:', emailErr);
      });
    } else {
      console.warn('[Contact] SMTP credentials not configured — skipping email notification.');
    }

  } catch (error: any) {
    console.error('[Contact] Failed to process submission:', error);
    res.status(500).json({ error: 'Failed to send message.' });
  }
});

router.patch('/', requireAuth, async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) { res.status(400).json({ error: "ID required." }); return; }
    await firestore.collection('contactMessages').doc(id).update({ read: true });
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update message" });
  }
});

router.delete('/', requireAuth, async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) { res.status(400).json({ error: "ID required." }); return; }
    await firestore.collection('contactMessages').doc(id).delete();
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to delete message" });
  }
});

export default router;
