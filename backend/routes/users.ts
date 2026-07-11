import { Router, Request, Response } from 'express';
import { firestore } from '../lib/firebaseAdmin';
import admin from '../lib/firebaseAdmin';

const router = Router();

/**
 * Middleware: verify Firebase ID token from Authorization header.
 * Attaches decoded token to req as (req as any).firebaseUid
 */
async function requireFirebaseAuth(req: Request, res: Response, next: Function): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header.' });
    return;
  }
  const idToken = authHeader.substring(7);
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    (req as any).firebaseUid = decoded.uid;
    next();
  } catch (err: any) {
    res.status(401).json({ error: 'Invalid or expired Firebase token.' });
  }
}

/**
 * Create or update user profile in Firestore.
 * Requires a valid Firebase ID token — users can only update their own profile.
 * Role changes are blocked via this route (must be done in Firestore directly).
 */
router.post('/profile', requireFirebaseAuth, async (req: Request, res: Response) => {
  try {
    const firebaseUid = (req as any).firebaseUid as string;
    const { uid, displayName, email, username, bio, avatar, isActivated } = req.body;

    // Ensure the token owner matches the profile being modified
    if (!uid || uid !== firebaseUid) {
      res.status(403).json({ error: 'You can only modify your own profile.' });
      return;
    }

    if (!email) {
      res.status(400).json({ error: 'Email is required.' });
      return;
    }

    if (!firestore) {
      res.status(503).json({ error: 'Database not available.' });
      return;
    }

    const userRef = firestore.collection('users').doc(uid);
    const userDoc = await userRef.get();
    const now = new Date().toISOString();

    const profileData: any = {
      uid,
      email,
      updatedAt: now,
      lastLoginAt: now,
    };

    // Only add optional fields if explicitly provided
    if (displayName !== undefined) profileData.displayName = displayName;
    if (username !== undefined) profileData.username = username;
    if (bio !== undefined) profileData.bio = bio;
    if (avatar !== undefined) profileData.avatar = avatar;
    if (isActivated !== undefined) profileData.isActivated = isActivated;

    // SECURITY: role cannot be set via this endpoint.
    // Admin role must be assigned directly in Firestore by the admin.

    if (!userDoc.exists) {
      profileData.createdAt = now;
      profileData.role = 'user'; // always default, never trusts client
      if (profileData.isActivated === undefined) {
        profileData.isActivated = false;
      }
    }

    await userRef.set(profileData, { merge: true });

    const updatedDoc = await userRef.get();
    const profile = updatedDoc.data();

    res.status(200).json({ success: true, profile });
  } catch (error: any) {
    console.error('User profile creation/update error:', error);
    res.status(500).json({ error: error.message || 'Failed to create/update user profile' });
  }
});

/**
 * Get user profile by UID — public read (needed for chat/search)
 */
router.get('/profile/:uid', async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    if (!uid) {
      res.status(400).json({ error: 'UID is required.' });
      return;
    }

    if (!firestore) {
      res.status(503).json({ error: 'Database not available.' });
      return;
    }

    const userDoc = await firestore.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const profile = userDoc.data();
    res.status(200).json({ id: userDoc.id, ...profile });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch user profile' });
  }
});

/**
 * Update user profile (partial update) — requires Firebase auth, own profile only
 */
router.put('/profile/:uid', requireFirebaseAuth, async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const firebaseUid = (req as any).firebaseUid as string;

    if (!uid || uid !== firebaseUid) {
      res.status(403).json({ error: 'You can only update your own profile.' });
      return;
    }

    if (!firestore) {
      res.status(503).json({ error: 'Database not available.' });
      return;
    }

    const updates = req.body;

    // SECURITY: Prevent role escalation
    delete updates.role;

    const userRef = firestore.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    updates.updatedAt = new Date().toISOString();
    await userRef.set(updates, { merge: true });

    const updatedDoc = await userRef.get();
    const profile = updatedDoc.data();

    res.status(200).json({ success: true, profile });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update user profile' });
  }
});

export default router;
