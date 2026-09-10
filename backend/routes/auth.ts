import { Router } from 'express';
import crypto from 'crypto';
import { generateToken } from '../lib/auth';
import { requireAuth } from '../middleware/auth';
import admin from '../lib/firebaseAdmin';
import { EmailDeliveryError, sendEmail } from '../lib/mail';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      res.status(400).json({ error: "Password is required." });
      return;
    }

    // SECURITY: ADMIN_PASSWORD must be set explicitly in environment variables.
    // There is no default or fallback password — server returns 500 if unconfigured.
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      console.error('[Auth] ADMIN_PASSWORD environment variable is not set.');
      res.status(500).json({ error: "Server authentication is not configured." });
      return;
    }

    // Constant-time comparison to prevent timing attacks
    const inputBuffer = Buffer.from(password);
    const adminBuffer = Buffer.from(adminPassword);

    const isMatch =
      inputBuffer.length === adminBuffer.length &&
      crypto.timingSafeEqual(inputBuffer, adminBuffer);

    if (isMatch) {
      const token = generateToken();
      res.status(200).json({ success: true, token });
    } else {
      res.status(401).json({ error: "Incorrect password." });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Login failed" });
  }
});

router.get('/verify', requireAuth, (req, res) => {
  res.status(200).json({ success: true });
});

// ─── Forgot Password ───────────────────────────────────────────────────────
// Uses Firebase Admin to generate a reset link, then sends via Gmail SMTP
// so the email comes from hiiinishant@gmail.com (trusted, not spam).
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    res.status(400).json({ error: 'Please provide a valid email address.' });
    return;
  }

  const trimmedEmail = email.trim().toLowerCase();

  try {
    const firebaseConfigured = admin.apps.length > 0 && (
      Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS) ||
      Boolean(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY)
    );

    if (!firebaseConfigured) {
      console.error('[Auth] Forgot password configuration failure: Firebase Admin is not initialized');
      res.status(500).json({ error: 'Failed to send reset email. Please try again later.' });
      return;
    }

    // Generate the Firebase password reset link via Admin SDK
    let resetLink: string;
    try {
      resetLink = await admin.auth().generatePasswordResetLink(trimmedEmail);
      console.log('[Auth] Firebase password reset link generated successfully');
    } catch (error: any) {
      console.error('[Auth] Firebase password reset link generation failed:', {
        code: error?.errorInfo?.code || error?.code || 'UNKNOWN',
      });
      res.status(502).json({ error: 'Failed to send reset email. Please try again later.' });
      return;
    }

    const fromName = process.env.EMAIL_FROM_NAME || 'HiiiNishant';

    const htmlBody = `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:580px;margin:0 auto;background:#0f172a;border-radius:16px;overflow:hidden;border:1px solid #1e293b">
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);padding:32px 24px;text-align:center">
          <h1 style="margin:0;font-size:22px;font-weight:700;color:#000;letter-spacing:-0.3px">🔐 Reset Your Password</h1>
          <p style="margin:8px 0 0;font-size:12px;color:rgba(0,0,0,0.7);text-transform:uppercase;letter-spacing:1.5px">${fromName}</p>
        </div>

        <!-- Body -->
        <div style="padding:32px 24px">
          <p style="margin:0 0 16px;font-size:15px;color:#cbd5e1;line-height:1.7">
            Hi there 👋,<br/>
            We received a request to reset the password for your account associated with <strong style="color:#f59e0b">${trimmedEmail}</strong>.
          </p>
          <p style="margin:0 0 28px;font-size:14px;color:#94a3b8;line-height:1.7">
            Click the button below to set a new password. This link will expire in <strong style="color:#e2e8f0">1 hour</strong>.
          </p>

          <!-- CTA Button -->
          <div style="text-align:center;margin-bottom:28px">
            <a href="${resetLink}" style="display:inline-block;background:#f59e0b;color:#000;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:15px;font-weight:700;letter-spacing:0.3px">
              Reset My Password →
            </a>
          </div>

          <!-- Security note -->
          <div style="background:#1e293b;border-radius:10px;padding:14px 18px;border-left:4px solid #f59e0b">
            <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6">
              🛡️ <strong style="color:#e2e8f0">Didn't request this?</strong> You can safely ignore this email. Your password won't be changed unless you click the link above.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background:#0b1120;padding:16px 24px;text-align:center;border-top:1px solid #1e293b">
          <p style="margin:0;font-size:11px;color:#475569">© ${new Date().getFullYear()} ${fromName} · This email was sent to ${trimmedEmail}</p>
        </div>
      </div>`;

    const plainText = `Reset Your Password\n\nHi,\n\nWe received a request to reset the password for your account (${trimmedEmail}).\n\nClick the link below to reset your password (expires in 1 hour):\n${resetLink}\n\nIf you didn't request this, you can safely ignore this email.\n\n© ${new Date().getFullYear()} ${fromName}`;

    try {
      const delivery = await sendEmail({
        to: trimmedEmail,
        subject: `🔐 Reset Your Password — ${fromName}`,
        html: htmlBody,
        text: plainText,
      });

      if (!delivery?.success) {
        throw new EmailDeliveryError('unexpected', 'Email provider did not confirm delivery');
      }
      console.log('[Auth] SMTP sendMail completed successfully');
    } catch (error: any) {
      const kind = error instanceof EmailDeliveryError ? error.kind : 'unexpected';
      const code = error instanceof EmailDeliveryError ? error.code : error?.code;
      console.error('[Auth] SMTP sendMail failed:', { kind, code: code || 'UNKNOWN' });
      res.status(kind === 'configuration' ? 500 : 502).json({ error: 'Failed to send reset email. Please try again later.' });
      return;
    }

    res.status(200).json({ success: true, message: 'Password reset link sent! Check your inbox.' });

  } catch (error: any) {
    console.error('[Auth] Unexpected forgot password failure:', {
      code: error?.errorInfo?.code || error?.code || 'UNKNOWN',
    });
    res.status(500).json({ error: 'Failed to send reset email. Please try again later.' });
  }
});

export default router;
