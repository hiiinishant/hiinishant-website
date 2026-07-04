import admin from "firebase-admin";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\\n/g, "\n");
const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

let firestore: admin.firestore.Firestore | null = null;

if (!admin.apps.length) {
  if (projectId && clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      } as any),
      storageBucket,
    });
    console.log("✅ Initialized Firebase Admin SDK (service account)");
    firestore = admin.firestore();
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({ storageBucket });
    console.log("✅ Initialized Firebase Admin SDK (GOOGLE_APPLICATION_CREDENTIALS)");
    firestore = admin.firestore();
  } else {
    console.warn(
      "⚠️ Firebase Admin credentials not provided. Firestore operations will fail until configured."
    );
  }
} else {
  firestore = admin.firestore();
}

export { firestore };

export default admin;
