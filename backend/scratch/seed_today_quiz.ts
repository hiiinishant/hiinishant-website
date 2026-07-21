/**
 * seed_today_quiz.ts
 * Run: npx ts-node -r tsconfig-paths/register scratch/seed_today_quiz.ts
 *
 * Seeds a quiz document for today's IST date into Firestore.
 * Status is set to 'published' so DailyQuizCard shows it on the homepage.
 */

import { firestore } from '../lib/firebaseAdmin';

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

function todayKeyIST(): string {
  return new Date(Date.now() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

async function seedTodayQuiz() {
  if (!firestore) {
    console.error('❌ Firestore not initialized. Check your .env.local.');
    process.exit(1);
  }

  const today = todayKeyIST();
  console.log(`📅 Today's IST date key: ${today}`);

  const quizData = {
    date: today,
    subject: 'JavaScript',
    question: 'What is the output of `console.log(typeof null)`?',
    optionA: 'undefined',
    optionB: 'object',
    optionC: 'null',
    optionD: 'string',
    correctOption: 'B',
    status: 'published',
    createdAt: new Date().toISOString(),
  };

  await firestore.collection('dailyQuizzes').doc(today).set(quizData, { merge: true });
  console.log(`✅ Quiz published for ${today}:`, quizData.question);
  process.exit(0);
}

seedTodayQuiz().catch((err) => {
  console.error('❌ Error seeding quiz:', err);
  process.exit(1);
});
