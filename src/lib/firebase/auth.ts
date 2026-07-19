import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { app } from './client';

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Basic configure provider permissions if needed
googleProvider.addScope('email');
googleProvider.addScope('profile');
export { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail, updateProfile, deleteUser, onAuthStateChanged, signInWithPopup } from 'firebase/auth';
