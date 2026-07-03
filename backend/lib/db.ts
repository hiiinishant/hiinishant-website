import { firestore } from './firebaseAdmin';

export async function connectDB() {
  if (!firestore) {
    console.warn("⚠️ Firestore not initialized. Skipping connection test.");
    return;
  }
  try {
    // Test Firestore connection by attempting a simple operation
    await firestore.collection('_connection_test').limit(1).get();
    console.log("✅ Connected to Firebase Firestore");
  } catch (error) {
    console.error("❌ Error connecting to Firebase Firestore:", error);
  }
}

export { firestore };
