// Firebase Admin initialization for Server-Side / Edge environment
// Only initialized if executed in a Node.js context with credential environment variables
import { firebaseConfig } from './client';

let adminApp: any = null;

export async function getFirebaseAdmin() {
  if (typeof window !== 'undefined') {
    throw new Error('Firebase Admin SDK cannot be initialized on the client side.');
  }

  // @ts-ignore
  const { default: admin } = await import('firebase-admin');

  if (!admin.apps.length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    if (privateKey && clientEmail) {
      adminApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: firebaseConfig.projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
        databaseURL: `https://${firebaseConfig.projectId}.firebaseio.com`,
      });
    } else {
      // Dev mode or default fallback credential
      adminApp = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        databaseURL: `https://${firebaseConfig.projectId}.firebaseio.com`,
      });
    }
  } else {
    adminApp = admin.apps[0];
  }

  return adminApp;
}

export async function getAdminAuth() {
  const admin = await getFirebaseAdmin();
  // @ts-ignore
  const { default: adminAuth } = await import('firebase-admin/auth');
  return adminAuth.getAuth(admin);
}

export async function getAdminFirestore() {
  const admin = await getFirebaseAdmin();
  // @ts-ignore
  const { default: adminFirestore } = await import('firebase-admin/firestore');
  return adminFirestore.getFirestore(admin);
}
