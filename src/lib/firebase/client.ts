import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, setLogLevel } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Config resolved statically from Env (enabling Vite compile-time replacement), prioritizing NEXT_PUBLIC_FIREBASE_*
export const firebaseConfig = {
  apiKey: (typeof import.meta !== 'undefined' && (import.meta as any).env?.NEXT_PUBLIC_FIREBASE_API_KEY) || 
          (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_FIREBASE_API_KEY) || 
          (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_FIREBASE_API_KEY) ||
          (typeof process !== 'undefined' && process.env?.VITE_FIREBASE_API_KEY) ||
          "AIzaSyDu4aGG5w7VKzl99YA4k3w_sEQJ8nKfZbA",

  authDomain: (typeof import.meta !== 'undefined' && (import.meta as any).env?.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) || 
              (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN) || 
              (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) ||
              (typeof process !== 'undefined' && process.env?.VITE_FIREBASE_AUTH_DOMAIN) ||
              "gen-lang-client-0167985385.firebaseapp.com",

  projectId: (typeof import.meta !== 'undefined' && (import.meta as any).env?.NEXT_PUBLIC_FIREBASE_PROJECT_ID) || 
             (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID) || 
             (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_FIREBASE_PROJECT_ID) ||
             (typeof process !== 'undefined' && process.env?.VITE_FIREBASE_PROJECT_ID) ||
             "gen-lang-client-0167985385",

  storageBucket: (typeof import.meta !== 'undefined' && (import.meta as any).env?.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) || 
                 (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET) || 
                 (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) ||
                 (typeof process !== 'undefined' && process.env?.VITE_FIREBASE_STORAGE_BUCKET) ||
                 "gen-lang-client-0167985385.firebasestorage.app",

  messagingSenderId: (typeof import.meta !== 'undefined' && (import.meta as any).env?.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) || 
                      (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID) || 
                      (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) ||
                      (typeof process !== 'undefined' && process.env?.VITE_FIREBASE_MESSAGING_SENDER_ID) ||
                      "710269410392",

  appId: (typeof import.meta !== 'undefined' && (import.meta as any).env?.NEXT_PUBLIC_FIREBASE_APP_ID) || 
         (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_FIREBASE_APP_ID) || 
         (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_FIREBASE_APP_ID) ||
         (typeof process !== 'undefined' && process.env?.VITE_FIREBASE_APP_ID) ||
         "1:710269410392:web:a26f36e79c3db99e5cbe2d",

  measurementId: (typeof import.meta !== 'undefined' && (import.meta as any).env?.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID) || 
                  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_FIREBASE_MEASUREMENT_ID) || 
                  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID) ||
                  (typeof process !== 'undefined' && process.env?.VITE_FIREBASE_MEASUREMENT_ID) ||
                  "",

  firestoreDatabaseId: (typeof import.meta !== 'undefined' && (import.meta as any).env?.NEXT_PUBLIC_FIREBASE_FIRESTORE_DATABASE_ID) || 
                        (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_FIREBASE_FIRESTORE_DATABASE_ID) || 
                        (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_FIREBASE_FIRESTORE_DATABASE_ID) ||
                        (typeof process !== 'undefined' && process.env?.VITE_FIREBASE_FIRESTORE_DATABASE_ID) ||
                        "ai-studio-bibletheologypro-0095cf70-1f02-42e2-9e42-51561c4671b3",
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
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

export const storage = getStorage(app);
