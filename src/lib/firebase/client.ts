import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, getFirestore, setLogLevel } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Config resolved statically from Env (enabling Vite compile-time replacement), prioritizing NEXT_PUBLIC_FIREBASE_*
export const firebaseConfig = {
  apiKey: (typeof import.meta !== 'undefined' && (import.meta as any).env?.NEXT_PUBLIC_FIREBASE_API_KEY) || 
          (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_FIREBASE_API_KEY) || 
          (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_FIREBASE_API_KEY) ||
          (typeof process !== 'undefined' && process.env?.VITE_FIREBASE_API_KEY) ||
          "AIzaSyBi8m7l2UTZmNZe2iQITlFrBVzv18Hc01U",

  authDomain: (typeof import.meta !== 'undefined' && (import.meta as any).env?.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) || 
              (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN) || 
              (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) ||
              (typeof process !== 'undefined' && process.env?.VITE_FIREBASE_AUTH_DOMAIN) ||
              "estudo-teologico001.firebaseapp.com",

  projectId: (typeof import.meta !== 'undefined' && (import.meta as any).env?.NEXT_PUBLIC_FIREBASE_PROJECT_ID) || 
             (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID) || 
             (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_FIREBASE_PROJECT_ID) ||
             (typeof process !== 'undefined' && process.env?.VITE_FIREBASE_PROJECT_ID) ||
             "estudo-teologico001",

  storageBucket: (typeof import.meta !== 'undefined' && (import.meta as any).env?.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) || 
                  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET) || 
                  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) ||
                  (typeof process !== 'undefined' && process.env?.VITE_FIREBASE_STORAGE_BUCKET) ||
                  "estudo-teologico001.firebasestorage.app",

  messagingSenderId: (typeof import.meta !== 'undefined' && (import.meta as any).env?.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) || 
                      (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID) || 
                      (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) ||
                      (typeof process !== 'undefined' && process.env?.VITE_FIREBASE_MESSAGING_SENDER_ID) ||
                      "612570871474",

  appId: (typeof import.meta !== 'undefined' && (import.meta as any).env?.NEXT_PUBLIC_FIREBASE_APP_ID) || 
         (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_FIREBASE_APP_ID) || 
         (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_FIREBASE_APP_ID) ||
         (typeof process !== 'undefined' && process.env?.VITE_FIREBASE_APP_ID) ||
         "1:612570871474:web:f2d6c9f43f8d610da7bbab",

  measurementId: (typeof import.meta !== 'undefined' && (import.meta as any).env?.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID) || 
                  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_FIREBASE_MEASUREMENT_ID) || 
                  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID) ||
                  (typeof process !== 'undefined' && process.env?.VITE_FIREBASE_MEASUREMENT_ID) ||
                  "G-RTKC6DY6ZN",

  firestoreDatabaseId: (typeof import.meta !== 'undefined' && (import.meta as any).env?.NEXT_PUBLIC_FIREBASE_FIRESTORE_DATABASE_ID) || 
                        (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_FIREBASE_FIRESTORE_DATABASE_ID) || 
                        (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_FIREBASE_FIRESTORE_DATABASE_ID) ||
                        (typeof process !== 'undefined' && process.env?.VITE_FIREBASE_FIRESTORE_DATABASE_ID) ||
                        "(default)",
};

// Singleton initialization pattern
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize and export auth, db and storage for unified application usage
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

// Suppress normal offline logging warnings & initialize db
setLogLevel('error');
const customDbId = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)' 
  ? firebaseConfig.firestoreDatabaseId 
  : undefined;

function getFirestoreInstance() {
  try {
    return customDbId 
      ? initializeFirestore(app, { experimentalForceLongPolling: true }, customDbId)
      : initializeFirestore(app, { experimentalForceLongPolling: true });
  } catch {
    return customDbId ? getFirestore(app, customDbId) : getFirestore(app);
  }
}

export const db = getFirestoreInstance();

export const storage = getStorage(app);
