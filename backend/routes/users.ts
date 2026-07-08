import { Router } from 'express';
import { firestore } from '../lib/firebaseAdmin';

const router = Router();

/**
 * Create or update user profile in Firestore
 * Uses setDoc with merge: true to avoid overwriting existing data
 */
router.post('/profile', async (req, res) => {
  try {
    const { uid, displayName, email, username, bio, avatar, role, isActivated } = req.body;

    if (!uid || !email) {
      res.status(400).json({ error: "UID and email are required." });
      return;
    }

    const userRef = firestore.collection('users').doc(uid);
    const userDoc = await userRef.get();

    const now = new Date().toISOString();

    // Prepare profile data
    const profileData: any = {
      uid,
      email,
      updatedAt: now,
      lastLoginAt: now,
    };

    // Only add these fields if they're provided
    if (displayName !== undefined) profileData.displayName = displayName;
    if (username !== undefined) profileData.username = username;
    if (bio !== undefined) profileData.bio = bio;
    if (avatar !== undefined) profileData.avatar = avatar;
    if (role !== undefined) profileData.role = role;
    if (isActivated !== undefined) profileData.isActivated = isActivated;

    // If user doesn't exist, set createdAt
    if (!userDoc.exists) {
      profileData.createdAt = now;
      // Default role for new users
      if (!role) profileData.role = 'user';
      // Default activation status is false for new signups
      if (profileData.isActivated === undefined) {
        profileData.isActivated = false;
      }
    }

    // Use setDoc with merge: true to avoid overwriting existing data
    await userRef.set(profileData, { merge: true });

    // Return the updated profile
    const updatedDoc = await userRef.get();
    const profile = updatedDoc.data();

    res.status(200).json({ success: true, profile });
  } catch (error: any) {
    console.error('User profile creation/update error:', error);
    res.status(500).json({ error: error.message || "Failed to create/update user profile" });
  }
});

/**
 * Get user profile by UID
 */
router.get('/profile/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    if (!uid) {
      res.status(400).json({ error: "UID is required." });
      return;
    }

    const userDoc = await firestore.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    const profile = userDoc.data();
    res.status(200).json({ id: userDoc.id, ...profile });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch user profile" });
  }
});

/**
 * Update user profile (partial update)
 */
router.put('/profile/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const updates = req.body;

    if (!uid) {
      res.status(400).json({ error: "UID is required." });
      return;
    }

    const userRef = firestore.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    // Add updatedAt timestamp
    updates.updatedAt = new Date().toISOString();

    // Use setDoc with merge: true for partial update
    await userRef.set(updates, { merge: true });

    const updatedDoc = await userRef.get();
    const profile = updatedDoc.data();

    res.status(200).json({ success: true, profile });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to update user profile" });
  }
});

export default router;
