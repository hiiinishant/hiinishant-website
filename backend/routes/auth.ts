import { Router } from 'express';
import crypto from 'crypto';
import { generateToken } from '../lib/auth';
import { requireAuth } from '../middleware/auth';

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

export default router;
