import { Router } from 'express';
import crypto from 'crypto';
import { generateToken } from '../lib/auth';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) { res.status(400).json({ error: "Password is required." }); return; }

    const adminPassword = process.env.ADMIN_PASSWORD || "nishant2am";
    const computedHash = crypto.createHash("sha256").update(password).digest("hex");
    const oldHash = "c54dfd60e7552554703a55b3b1f5c6b97a22026858e9ad36cc2e9be49df0a5be";

    if (password === adminPassword || computedHash === oldHash || computedHash === process.env.ADMIN_PASSWORD) {
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
