import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import { firestore } from "../lib/firebaseAdmin";
import { generateSlug, toSubjectSlug } from "../routes/quiz";

async function runMigration() {
  console.log("🚀 Starting Quiz Slug Migration...");

  if (!firestore) {
    console.error("❌ Firestore could not be initialized. Check your Firebase credentials in .env.local");
    process.exit(1);
  }

  const snap = await firestore.collection("dailyQuizzes").get();
  console.log(`Found ${snap.docs.length} total quiz documents.`);

  if (snap.empty) {
    console.log("No quizzes found to migrate.");
    process.exit(0);
  }

  const batch = firestore.batch();
  let updateCount = 0;
  let skippedCount = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    const needsSlug = !data.slug;
    const needsSubjectSlug = !data.subjectSlug;

    if (needsSlug || needsSubjectSlug) {
      const slug = data.slug || generateSlug(data.question || doc.id);
      const subjectSlug = data.subjectSlug || toSubjectSlug(data.subject || "general");

      batch.update(doc.ref, {
        slug,
        subjectSlug,
        updatedAt: new Date().toISOString(),
      });

      console.log(`  + [Migrating ${doc.id}]`);
      console.log(`    Subject: "${data.subject}" -> slug: "${subjectSlug}"`);
      console.log(`    Question: "${data.question?.slice(0, 50)}..." -> slug: "${slug}"`);
      updateCount++;
    } else {
      skippedCount++;
    }
  }

  if (updateCount > 0) {
    await batch.commit();
    console.log(`\n✅ Migration successful! Updated ${updateCount} questions. (${skippedCount} already had slugs)`);
  } else {
    console.log(`\n✨ All ${skippedCount} questions already have slug and subjectSlug. No updates needed.`);
  }

  process.exit(0);
}

runMigration().catch((err) => {
  console.error("Migration failed with error:", err);
  process.exit(1);
});
