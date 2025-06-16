
// TODO: Add your Firebase project configuration here
// See https://firebase.google.com/docs/web/setup#available-libraries

import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// User-provided Firebase project credentials.
// It's still highly recommended to use environment variables for these sensitive keys in production.
// Example .env.local file:
// NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key
// NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_actual_auth_domain
// NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_actual_project_id
// NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_actual_storage_bucket
// NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_actual_messaging_sender_id
// NEXT_PUBLIC_FIREBASE_APP_ID=your_actual_app_id
// NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_actual_measurement_id

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDZYcn0YoMFStVOtbPp5Ord_YZyJogS0T8",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "papertrail-2iq92.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "papertrail-2iq92",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "papertrail-2iq92.appspot.com", // Corrected: .appspot.com usually for storage bucket
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "545731735012",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:545731735012:web:7f0f8c29c1deb4fe35abf1",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-TZNE4PEZGP"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
