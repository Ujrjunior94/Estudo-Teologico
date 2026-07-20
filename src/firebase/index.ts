// Clean Architecture unified access layer to Firebase services
export { auth, googleProvider } from '../lib/firebase/client';
export { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail, 
  updateProfile, 
  deleteUser, 
  onAuthStateChanged, 
  signInWithPopup 
} from '../lib/firebase/auth';
export { 
  db, 
  OperationType, 
  handleFirestoreError,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  deleteDoc,
  writeBatch,
  query,
  where,
  onSnapshot
} from '../lib/firebase/firestore';
export { storage } from '../lib/firebase/storage';
export type { FirestoreErrorInfo } from '../lib/firebase/firestore';
