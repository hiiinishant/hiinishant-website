import { Router, Request, Response } from 'express';
import { firestore } from '../lib/firebaseAdmin';
import { requireAuth } from '../middleware/auth';
import admin from '../lib/firebaseAdmin';

const router = Router();

// ─── IST Date Helper ──────────────────────────────────────────────────────────
// Resets at 12:00 AM IST (UTC+5:30) — same logic as visitors.ts
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

function todayKeyIST(): string {
  return new Date(Date.now() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

function yesterdayKeyIST(): string {
  return new Date(Date.now() + IST_OFFSET_MS - 86400000).toISOString().slice(0, 10);
}

// ─── Firebase ID Token Verifier ───────────────────────────────────────────────
// Extracts the Firebase UID from the Authorization header sent by the frontend.
// Used for quiz answer submission & stats — distinct from the admin JWT.
async function verifyFirebaseToken(req: Request): Promise<string | null> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  const idToken = header.slice(7);
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    return decoded.uid;
  } catch {
    return null;
  }
}

// ─── Firestore Collection Names ───────────────────────────────────────────────
const QUIZZES     = 'dailyQuizzes';
const RESPONSES   = 'quizResponses';
const STATS       = 'quizStats';

// ─── XP Constants ─────────────────────────────────────────────────────────────
const XP_CORRECT   = 10;
const XP_INCORRECT = 2;

// ═════════════════════════════════════════════════════════════════════════════
//  PUBLIC ROUTES
// ═════════════════════════════════════════════════════════════════════════════

// GET /api/quiz/today
// Returns today's published quizzes (without revealing correctOption before answering).
// Active until 11:59 PM IST of publishDate.
// Response: { quizzes: QuizPublic[], quiz: QuizPublic | null }
router.get('/today', async (_req: Request, res: Response) => {
  try {
    if (!firestore) { res.json({ quizzes: [], quiz: null }); return; }

    const today = todayKeyIST();
    // Fetch quizzes where publishDate == today strictly
    const snap = await firestore.collection(QUIZZES)
      .where('publishDate', '==', today)
      .where('status', '==', 'published')
      .get();

    let docsList = snap.docs;

    // Fallback: check legacy single doc with ID = today
    if (docsList.length === 0) {
      const singleDoc = await firestore.collection(QUIZZES).doc(today).get();
      if (singleDoc.exists && singleDoc.data()?.status === 'published') {
        docsList = [singleDoc as any];
      }
    }

    const quizzes = docsList.map(doc => {
      const d = doc.data()!;
      return {
        id:            doc.id,
        date:          d.publishDate || doc.id,
        subject:       d.subject,
        question:      d.question,
        optionA:       d.optionA,
        optionB:       d.optionB,
        optionC:       d.optionC,
        optionD:       d.optionD,
        correctOption: d.correctOption,
        attemptsCount: d.attemptsCount || 0,
      };
    });

    res.json({
      quizzes,
      quiz: quizzes[0] || null,
    });
  } catch (err) {
    console.error('[quiz/today] Error:', err);
    res.status(500).json({ error: 'Failed to load quizzes' });
  }
});

// GET /api/quiz/subjects
// Returns distinct subject names from all published quizzes, sorted alphabetically.
// Response: { subjects: string[] }
router.get('/subjects', async (_req: Request, res: Response) => {
  try {
    if (!firestore) { res.json({ subjects: [] }); return; }

    const snap = await firestore
      .collection(QUIZZES)
      .where('status', '==', 'published')
      .get();

    const subjectSet = new Set<string>();
    snap.docs.forEach(doc => {
      const s = doc.data()?.subject;
      if (s && typeof s === 'string') subjectSet.add(s.trim());
    });

    res.json({ subjects: Array.from(subjectSet).sort() });
  } catch (err) {
    console.error('[quiz/subjects] Error:', err);
    res.status(500).json({ subjects: [] });
  }
});

// GET /api/quiz/response
// Returns current user's responses indexed by quiz ID.
// Requires Firebase ID Token.
// Response: { responses: Record<string, UserResponse>, response: UserResponse | null }
router.get('/response', async (req: Request, res: Response) => {
  try {
    const uid = await verifyFirebaseToken(req);
    if (!uid || !firestore) { res.json({ responses: {}, response: null }); return; }

    const targetDate = (req.query.date as string) || todayKeyIST();
    const snap = await firestore
      .collection(RESPONSES).doc(uid)
      .collection('responses')
      .get();

    if (snap.empty) { res.json({ responses: {}, response: null }); return; }

    const responses: Record<string, any> = {};
    let singleTargetResponse: any = null;

    for (const doc of snap.docs) {
      const d = doc.data();
      const quizSnap = await firestore.collection(QUIZZES).doc(doc.id).get();
      const correctOption = quizSnap.exists ? quizSnap.data()?.correctOption : null;

      const item = {
        quizId:         doc.id,
        selectedOption: d.selectedOption,
        isCorrect:      d.isCorrect,
        xpEarned:       d.xpEarned,
        answeredAt:     d.answeredAt,
        correctOption,
      };

      responses[doc.id] = item;
      if (doc.id === targetDate || d.quizDate === targetDate) {
        singleTargetResponse = item;
      }
    }

    res.json({
      responses,
      response: singleTargetResponse || Object.values(responses)[0] || null,
    });
  } catch (err) {
    console.error('[quiz/response] Error:', err);
    res.status(500).json({ error: 'Failed to load responses' });
  }
});

// GET /api/quiz/subject/:subject
// Returns published quizzes for a specific subject.
// Exposes correctOption for past quizzes (publishDate < todayKeyIST()) after 11:59 PM.
router.get('/subject/:subject', async (req: Request, res: Response) => {
  try {
    if (!firestore) { res.json({ quizzes: [], quiz: null }); return; }
    const subject = req.params.subject;
    const today = todayKeyIST();

    const snap = await firestore.collection(QUIZZES)
      .where('subject', '==', subject)
      .where('status', '==', 'published')
      .orderBy('publishDate', 'desc')
      .get();

    if (snap.empty) {
      res.json({ quizzes: [], quiz: null });
      return;
    }

    const quizzes = snap.docs.map(doc => {
      const d = doc.data();
      return {
        id:            doc.id,
        date:          d.publishDate || doc.id,
        subject:       d.subject,
        question:      d.question,
        optionA:       d.optionA,
        optionB:       d.optionB,
        optionC:       d.optionC,
        optionD:       d.optionD,
        correctOption: d.correctOption,
        attemptsCount: d.attemptsCount || 0,
      };
    });

    res.json({
      quizzes,
      quiz: quizzes[0] || null,
    });
  } catch (err) {
    console.error('[quiz/by-subject] Error:', err);
    res.status(500).json({ error: 'Failed to load quizzes' });
  }
});

// GET /api/quiz/stats/:userId
// Returns a user's XP and streak stats. Public (userId is the Firebase UID).
// Response: { stats: QuizStats | null }
router.get('/stats/:userId', async (req: Request, res: Response) => {
  try {
    if (!firestore) { res.json({ stats: null }); return; }

    const userId = req.params.userId as string;
    const snap = await firestore.collection(STATS).doc(userId).get();

    if (!snap.exists) {
      res.json({
        stats: {
          totalXP:          0,
          totalCorrect:     0,
          totalAttempts:    0,
          currentStreak:    0,
          longestStreak:    0,
          lastAnsweredDate: null,
        },
      });
      return;
    }

    res.json({ stats: snap.data() });
  } catch (err) {
    console.error('[quiz/stats] Error:', err);
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

// POST /api/quiz/answer
// Submit an answer to a quiz question. One attempt per user per question.
// Requires Firebase ID Token.
// Body: { selectedOption: "A"|"B"|"C"|"D", quizId: string, quizDate?: string }
// Response: { isCorrect, xpEarned, correctOption, stats }
router.post('/answer', async (req: Request, res: Response) => {
  try {
    const uid = await verifyFirebaseToken(req);
    if (!uid) { res.status(401).json({ error: 'Authentication required' }); return; }
    if (!firestore) { res.status(503).json({ error: 'Database unavailable' }); return; }

    const { selectedOption, quizId, quizDate } = req.body;
    if (!['A', 'B', 'C', 'D'].includes(selectedOption)) {
      res.status(400).json({ error: 'Invalid option. Must be A, B, C or D.' });
      return;
    }

    const today = todayKeyIST();
    const targetKey = quizId || quizDate || today;

    // ── Refs ─────────────────────────────────────────────────────────────────
    let quizRef = firestore.collection(QUIZZES).doc(targetKey);
    let responseRef = firestore
      .collection(RESPONSES).doc(uid)
      .collection('responses').doc(targetKey);
    const statsRef = firestore.collection(STATS).doc(uid);

    // Check if targetKey exists as doc ID, if not fallback to quizDate doc
    let quizSnap = await quizRef.get();
    if (!quizSnap.exists && quizDate) {
      quizRef = firestore.collection(QUIZZES).doc(quizDate);
      responseRef = firestore
        .collection(RESPONSES).doc(uid)
        .collection('responses').doc(quizDate);
    }

    // ── Transaction: validate, record, update stats ───────────────────────────
    const result = await firestore.runTransaction(async (tx) => {
      const [qSnap, rSnap, sSnap] = await Promise.all([
        tx.get(quizRef),
        tx.get(responseRef),
        tx.get(statsRef),
      ]);

      // Quiz must exist and be published
      if (!qSnap.exists || qSnap.data()?.status !== 'published') {
        throw new Error('NO_QUIZ');
      }
      // Only today’s Daily Challenge can be answered — past challenges are view-only
      const quizPublishDate = qSnap.data()?.publishDate as string | undefined;
      if (quizPublishDate && quizPublishDate !== today) {
        throw new Error('QUIZ_EXPIRED');
      }
      // One attempt only per question
      if (rSnap.exists) {
        throw new Error('ALREADY_ANSWERED');
      }

      const correctOption: string = qSnap.data()!.correctOption;
      const isCorrect = selectedOption === correctOption;
      const xpEarned  = isCorrect ? XP_CORRECT : XP_INCORRECT;
      const now       = new Date().toISOString();

      // ── Write response doc ──────────────────────────────────────────────
      tx.set(responseRef, {
        quizId:         targetKey,
        quizDate:       quizDate || today,
        selectedOption,
        isCorrect,
        xpEarned,
        answeredAt:     now,
      });

      // ── Update stats ────────────────────────────────────────────────────
      const yesterday = yesterdayKeyIST();
      const currentStats = sSnap.exists ? sSnap.data()! : {
        totalXP:          0,
        totalCorrect:     0,
        totalAttempts:    0,
        currentStreak:    0,
        longestStreak:    0,
        lastAnsweredDate: null,
      };

      const last = currentStats.lastAnsweredDate as string | null;
      let newStreak: number;

      if (last === yesterday) {
        newStreak = (currentStats.currentStreak as number) + 1;
      } else if (last === today) {
        newStreak = currentStats.currentStreak as number;
      } else {
        newStreak = 1;
      }

      const newLongest = Math.max(newStreak, currentStats.longestStreak as number);
      const newTotal   = (currentStats.totalXP as number) + xpEarned;
      const newCorrect = (currentStats.totalCorrect as number) + (isCorrect ? 1 : 0);
      const newAttempts = (currentStats.totalAttempts as number) + 1;

      const updatedStats = {
        totalXP:          newTotal,
        totalCorrect:     newCorrect,
        totalAttempts:    newAttempts,
        currentStreak:    newStreak,
        longestStreak:    newLongest,
        lastAnsweredDate: today,
        updatedAt:        now,
      };

      tx.set(statsRef, updatedStats);

      // Increment attemptsCount on the quiz document
      const currentAttemptsCount = qSnap.data()?.attemptsCount || 0;
      tx.update(quizRef, {
        attemptsCount: currentAttemptsCount + 1,
        updatedAt: now,
      });

      return { isCorrect, xpEarned, correctOption, stats: updatedStats, quizId: targetKey };
    });

    res.json(result);
  } catch (err: any) {
    if (err.message === 'NO_QUIZ') {
      res.status(404).json({ error: "No published quiz found." });
    } else if (err.message === 'QUIZ_EXPIRED') {
      res.status(410).json({ error: "This Daily Challenge has expired. Only today’s quiz can be answered." });
    } else if (err.message === 'ALREADY_ANSWERED') {
      res.status(409).json({ error: "You have already answered this quiz question." });
    } else {
      console.error('[quiz/answer] Error:', err);
      res.status(500).json({ error: 'Failed to submit answer' });
    }
  }
});

// ═════════════════════════════════════════════════════════════════════════════
//  ADMIN ROUTES (require admin JWT via requireAuth middleware)
// ═════════════════════════════════════════════════════════════════════════════

// GET /api/quiz — list all quizzes (admin)
router.get('/', requireAuth, async (_req: Request, res: Response) => {
  try {
    if (!firestore) { res.json([]); return; }
    const snap = await firestore.collection(QUIZZES).orderBy('publishDate', 'desc').get();
    const quizzes = snap.docs.map(d => ({ ...d.data(), id: d.id }));
    res.json(quizzes);
  } catch (err) {
    console.error('[quiz/list] Error:', err);
    res.status(500).json({ error: 'Failed to load quizzes' });
  }
});

// POST /api/quiz — create quiz (admin)
// Body: { id?, subject, question, optionA, optionB, optionC, optionD, correctOption, publishDate, status }
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!firestore) { res.status(503).json({ error: 'Database unavailable' }); return; }

    const {
      id, subject, question,
      optionA, optionB, optionC, optionD,
      correctOption, publishDate, status = 'draft',
    } = req.body;

    // Basic validation
    if (!question || !optionA || !optionB || !optionC || !optionD || !correctOption || !publishDate) {
      res.status(400).json({ error: 'All fields are required.' });
      return;
    }
    if (!['A', 'B', 'C', 'D'].includes(correctOption)) {
      res.status(400).json({ error: 'correctOption must be A, B, C or D.' });
      return;
    }

    const now = new Date().toISOString();
    const quizData = {
      subject:       subject?.trim() || '',
      question:      question.trim(),
      optionA:       optionA.trim(),
      optionB:       optionB.trim(),
      optionC:       optionC.trim(),
      optionD:       optionD.trim(),
      correctOption,
      publishDate,
      status,
      createdAt:     now,
      updatedAt:     now,
    };

    // Use specific ID if provided (for update/legacy), otherwise generate unique auto ID for multi-question support
    const docRef = id ? firestore.collection(QUIZZES).doc(id) : firestore.collection(QUIZZES).doc();
    await docRef.set(quizData);
    res.status(201).json({ id: docRef.id, ...quizData });
  } catch (err) {
    console.error('[quiz/create] Error:', err);
    res.status(500).json({ error: 'Failed to create quiz' });
  }
});

// PUT /api/quiz — update quiz (admin)
// Body: { id, ...fields }
router.put('/', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!firestore) { res.status(503).json({ error: 'Database unavailable' }); return; }

    const { id, ...fields } = req.body;
    if (!id) { res.status(400).json({ error: 'Quiz ID (date) is required.' }); return; }

    const updateData: any = { ...fields, updatedAt: new Date().toISOString() };
    // Trim string fields
    const strFields = ['subject', 'question', 'optionA', 'optionB', 'optionC', 'optionD'];
    strFields.forEach(f => { if (updateData[f]) updateData[f] = updateData[f].trim(); });

    await firestore.collection(QUIZZES).doc(id).update(updateData);
    const updated = await firestore.collection(QUIZZES).doc(id).get();
    res.json({ id, ...updated.data() });
  } catch (err) {
    console.error('[quiz/update] Error:', err);
    res.status(500).json({ error: 'Failed to update quiz' });
  }
});

// DELETE /api/quiz — delete quiz (admin)
// Body: { id }
router.delete('/', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!firestore) { res.status(503).json({ error: 'Database unavailable' }); return; }

    const { id } = req.body;
    if (!id) { res.status(400).json({ error: 'Quiz ID is required.' }); return; }

    const docRef = firestore.collection(QUIZZES).doc(id);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      await docRef.delete();
    } else {
      // Fallback: search by publishDate
      const querySnap = await firestore.collection(QUIZZES).where('publishDate', '==', id).get();
      if (!querySnap.empty) {
        const batch = firestore.batch();
        querySnap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error('[quiz/delete] Error:', err);
    res.status(500).json({ error: 'Failed to delete quiz' });
  }
});

export default router;
