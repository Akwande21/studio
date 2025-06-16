
// TODO: Add your Firebase project configuration here
// See https://firebase.google.com/docs/web/setup#available-libraries

import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// IMPORTANT: Replace "YOUR_..." placeholders with your ACTUAL Firebase project credentials.
// It's highly recommended to use environment variables for these sensitive keys.
// Example .env.local file:
// NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key
// NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_actual_auth_domain
// NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_actual_project_id
// NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_actual_storage_bucket
// NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_actual_messaging_sender_id
// NEXT_PUBLIC_FIREBASE_APP_ID=your_actual_app_id

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "YOUR_API_KEY", // <-- REPLACE THIS OR SET ENV VAR
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN", // <-- REPLACE THIS OR SET ENV VAR
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID", // <-- REPLACE THIS OR SET ENV VAR
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET", // <-- REPLACE THIS OR SET ENV VAR
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID", // <-- REPLACE THIS OR SET ENV VAR
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "YOUR_APP_ID", // <-- REPLACE THIS OR SET ENV VAR
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
