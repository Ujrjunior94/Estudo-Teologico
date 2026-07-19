import { initializeApp, getApp, getApps } from 'firebase/app';

// Safe environment variable retriever for both Vite and Node contexts
const getEnv = (key: string): string => {
  if (typeof window !== 'undefined') {
    // Client-side environment check (Vite)
    const viteEnv = ((import.meta as any).env || {});
    return viteEnv[`VITE_${key}`] || viteEnv[`NEXT_PUBLIC_${key}`] || viteEnv[key] || '';
  }
  // Server-side environment check (Vite dev server / Node)
  const nodeEnv = (typeof process !== 'undefined' ? process.env : {}) as Record<string, string>;
  return nodeEnv[`VITE_${key}`] || nodeEnv[`NEXT_PUBLIC_${key}`] || nodeEnv[key] || '';
};

// Config resolved dynamically from Env, fallback to real project credentials
export const firebaseConfig = {
  apiKey: getEnv('FIREBASE_API_KEY') || "AIzaSyBi8m7l2UTZmNZe2iQITlFrBVzv18Hc01U",
  authDomain: getEnv('FIREBASE_AUTH_DOMAIN') || "estudo-teologico001.firebaseapp.com",
  projectId: getEnv('FIREBASE_PROJECT_ID') || "estudo-teologico001",
  storageBucket: getEnv('FIREBASE_STORAGE_BUCKET') || "estudo-teologico001.firebasestorage.app",
  messagingSenderId: getEnv('FIREBASE_MESSAGING_SENDER_ID') || "612570871474",
  appId: getEnv('FIREBASE_APP_ID') || "1:612570871474:web:f2d6c9f43f8d610da7bbab",
  measurementId: getEnv('FIREBASE_MEASUREMENT_ID') || "G-RTKC6DY6ZN",
  firestoreDatabaseId: getEnv('FIREBASE_FIRESTORE_DATABASE_ID') || "(default)",
};

// Singleton initialization pattern
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
