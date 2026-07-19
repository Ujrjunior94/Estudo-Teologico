import { auth, googleProvider } from './client';

export { auth, googleProvider };

export { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail, updateProfile, deleteUser, onAuthStateChanged, signInWithPopup } from 'firebase/auth';
