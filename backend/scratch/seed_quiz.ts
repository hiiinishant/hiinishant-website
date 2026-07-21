import '../lib/env';
import { firestore } from '../lib/firebaseAdmin';

// Helper to get today's IST date string
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
const todayKeyIST = new Date(Date.now() + IST_OFFSET_MS).toISOString().slice(0, 10);

async function seed() {
  if (!firestore) {
    console.log("Firestore not initialized");
    return;
  }

  const quizRef = firestore.collection('dailyQuizzes').doc(todayKeyIST);
  const quizData = {
    subject: "JavaScript",
    question: "What is the output of `console.log(typeof null)`?",
    optionA: "undefined",
    optionB: "object",
    optionC: "null",
    optionD: "string",
    correctOption: "B",
    publishDate: todayKeyIST,
    status: "published",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await quizRef.set(quizData);
  console.log("Successfully seeded today's quiz:", todayKeyIST);
}

seed();
