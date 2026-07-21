import { Router, Request, Response } from 'express';
import { createHash } from 'crypto';
import { firestore } from '../lib/firebaseAdmin';
import type { Server as SocketIOServer } from 'socket.io';
import admin from '../lib/firebaseAdmin';

const router = Router();

// ─── IST helpers ──────────────────────────────────────────────────────────────
// IST = UTC + 5:30. The daily visitor count resets at 12:00 AM IST.
// We derive the IST calendar date purely via arithmetic to avoid any
// timezone library dependency.

/** Returns today's date string in YYYY-MM-DD **IST** (Asia/Kolkata, UTC+5:30). */
function todayKeyIST(): string {
  const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000; // 330 min in ms
  const istMs = Date.now() + IST_OFFSET_MS;
  return new Date(istMs).toISOString().slice(0, 10); // e.g. "2026-07-20"
}

// ─── Fingerprinting ───────────────────────────────────────────────────────────
// A privacy-safe, one-way hash of the visitor's IP address and User-Agent.
// The raw IP and UA are never stored — only the hex digest is written to Firestore.

/** Returns a SHA-256 hex digest of `${clientIP}:${userAgent}`. */
function buildFingerprint(req: Request): string {
  // Respect reverse-proxy headers (Render, Vercel, Cloudflare, etc.)
  const ip =
    (req.headers['x-forwarded-for'] as string | undefined)
      ?.split(',')[0]
      .trim() ||
    req.socket.remoteAddress ||
    'unknown';

  const ua = (req.headers['user-agent'] as string | undefined) || 'unknown';

  return createHash('sha256').update(`${ip}:${ua}`).digest('hex');
}

// ─── Firestore structure ───────────────────────────────────────────────────────
//
// BEFORE (old — array inside one document):
//   visitorCounts/{date}
//     count:        number
//     fingerprints: string[]   ← hit Firestore's 1 MB doc limit at scale
//
// NOW (subcollection — one document per unique visitor):
//   visitorCounts/{date}
//     count:     number        ← single counter, incremented atomically
//     updatedAt: string        ← ISO timestamp of last unique visit
//
//   visitorCounts/{date}/visitors/{fingerprintHash}
//     seenAt: string           ← ISO timestamp of first visit this day
//
// Benefits:
//   • Each fingerprint document is tiny (~60 bytes). Scales to millions of
//     visitors with no document size concern.
//   • Reading just the parent doc (for the count) is O(1) — no array scan.
//   • Firestore charges one read per dedup check instead of reading the whole array.

const COLLECTION = 'visitorCounts';

// ─── Socket.IO injection ──────────────────────────────────────────────────────
// server.ts calls setVisitorsIo(io) after the Socket.IO server is created,
// so this module can broadcast real-time updates without circular imports.

let _io: SocketIOServer | null = null;

export function setVisitorsIo(io: SocketIOServer): void {
  _io = io;
}

// ─── GET /api/visitors ────────────────────────────────────────────────────────
// Lightweight read — fetches only the parent summary document.
// Response: { count: number, asOf: string }

router.get('/', async (_req: Request, res: Response) => {
  try {
    if (!firestore) {
      res.status(503).json({ error: 'Database not available' });
      return;
    }

    const today = todayKeyIST();

    // Single Firestore read — O(1), no array scanning
    const snap = await firestore.collection(COLLECTION).doc(today).get();
    const count: number = snap.exists ? (snap.data()?.count ?? 0) : 0;

    res.json({ count, asOf: new Date().toISOString() });
  } catch (err) {
    console.error('[visitors/GET] Error:', err);
    res.status(500).json({ error: 'Failed to fetch visitor count' });
  }
});

// ─── POST /api/visitors/ping ──────────────────────────────────────────────────
// Called by the frontend once per device per IST calendar day.
// Uses a Firestore transaction to:
//   1. Check whether visitorCounts/{date}/visitors/{fp} already exists.
//   2. If NOT: create the fingerprint doc + atomically increment the counter.
//   3. If YES: skip — return the current count without any write.
//
// Response: { count: number, asOf: string, isNew: boolean }

router.post('/ping', async (req: Request, res: Response) => {
  try {
    if (!firestore) {
      res.status(503).json({ error: 'Database not available' });
      return;
    }

    const today = todayKeyIST();
    const fp = buildFingerprint(req);

    // Parent summary document ref
    const dayRef = firestore.collection(COLLECTION).doc(today);

    // Subcollection document ref — one doc per unique fingerprint per day.
    // Using the fingerprint hash as the document ID makes existence-checks free
    // (a `get` on a non-existent doc costs zero extra Firestore reads).
    const fpRef = dayRef.collection('visitors').doc(fp);

    const { count, isNew } = await firestore.runTransaction(async (tx) => {
      // Read both refs inside the transaction so all checks are consistent
      const [daySnap, fpSnap] = await Promise.all([
        tx.get(dayRef),
        tx.get(fpRef),
      ]);

      // ── Already visited today — return current count with no writes ───────
      if (fpSnap.exists) {
        return {
          count: daySnap.exists ? (daySnap.data()?.count ?? 0) : 0,
          isNew: false,
        };
      }

      // ── New unique visitor ─────────────────────────────────────────────────
      const now = new Date().toISOString();

      // Create the fingerprint subdoc (marks this visitor as counted for today)
      tx.set(fpRef, { seenAt: now });

      if (!daySnap.exists) {
        // First visitor of the day — create the summary document
        tx.set(dayRef, { date: today, count: 1, updatedAt: now });
        return { count: 1, isNew: true };
      }

      // Subsequent new visitor — atomically increment the existing counter
      tx.update(dayRef, {
        count: admin.firestore.FieldValue.increment(1),
        updatedAt: now,
      });

      // Return optimistic count; the actual Firestore value will match after commit
      const currentCount = (daySnap.data()?.count ?? 0) as number;
      return { count: currentCount + 1, isNew: true };
    });

    const asOf = new Date().toISOString();

    // Broadcast to all connected Socket.IO clients only when count changed
    if (isNew && _io) {
      _io.emit('visitor-update', { count, asOf });
    }

    res.json({ count, asOf, isNew });
  } catch (err) {
    console.error('[visitors/ping] Error:', err);
    res.status(500).json({ error: 'Failed to record visitor' });
  }
});

export default router;
