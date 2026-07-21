import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { firestore } from '../lib/firebaseAdmin';

const QUIZZES = 'dailyQuizzes';

const quizzesToSeed = [
  {
    id: 'subject-react',
    subject: 'React',
    question: 'Which hook should be used to memoize the result of a computation in React?',
    optionA: 'useCallback',
    optionB: 'useMemo',
    optionC: 'useRef',
    optionD: 'useState',
    correctOption: 'B',
    publishDate: '2026-07-20-react',
    status: 'published',
    attemptsCount: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'subject-html-css',
    subject: 'HTML & CSS',
    question: 'Which CSS property is used to change the text color of an element?',
    optionA: 'font-color',
    optionB: 'text-color',
    optionC: 'color',
    optionD: 'background-color',
    correctOption: 'C',
    publishDate: '2026-07-20-css',
    status: 'published',
    attemptsCount: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'subject-sql',
    subject: 'SQL & Databases',
    question: 'Which SQL keyword is used to sort the result-set?',
    optionA: 'SORT BY',
    optionB: 'ORDER BY',
    optionC: 'ALIGN BY',
    optionD: 'GROUP BY',
    correctOption: 'B',
    publishDate: '2026-07-20-sql',
    status: 'published',
    attemptsCount: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'subject-dsa',
    subject: 'Data Structures',
    question: 'What is the worst-case time complexity of searching in a Hash Table?',
    optionA: 'O(1)',
    optionB: 'O(log N)',
    optionC: 'O(N)',
    optionD: 'O(N log N)',
    correctOption: 'C',
    publishDate: '2026-07-20-dsa',
    status: 'published',
    attemptsCount: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'subject-algo',
    subject: 'Algorithms',
    question: 'Which algorithm design technique does Quick Sort use?',
    optionA: 'Greedy approach',
    optionB: 'Dynamic Programming',
    optionC: 'Divide and Conquer',
    optionD: 'Backtracking',
    correctOption: 'C',
    publishDate: '2026-07-20-algo',
    status: 'published',
    attemptsCount: 0,
    createdAt: new Date().toISOString(),
  }
];

async function seed() {
  if (!firestore) {
    console.error('❌ Firestore not initialized. Check your .env.local path.');
    process.exit(1);
  }

  for (const q of quizzesToSeed) {
    await firestore.collection(QUIZZES).doc(q.publishDate).set(q, { merge: true });
    console.log(`✅ Seeded quiz for subject: ${q.subject}`);
  }

  console.log('🎉 Seeding completed successfully.');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Error during seeding:', err);
  process.exit(1);
});
