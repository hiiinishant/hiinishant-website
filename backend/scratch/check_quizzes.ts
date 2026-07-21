import '../lib/env';
import { firestore } from '../lib/firebaseAdmin';

async function check() {
  if (!firestore) {
    console.log("Firestore not initialized");
    return;
  }
  const snap = await firestore.collection('dailyQuizzes').get();
  console.log("Total quizzes in Firestore:", snap.size);
  snap.docs.forEach(doc => {
    console.log(doc.id, "=>", doc.data());
  });
}

check();
