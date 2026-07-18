import { initializeApp, getApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  deleteUser,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  initializeFirestore, 
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
} from 'firebase/firestore';
import { dbService } from '../database/db';
import { Note, Favorite, Highlight, ReadingPlan, RewardState, CreativeDesign, ReadingProgress, Bookmark, PrayerRequest } from '../types';

// Real configuration from firebase-applet-config.json
const firebaseConfig = {
  projectId: "gen-lang-client-0167985385",
  appId: "1:710269410392:web:a26f36e79c3db99e5cbe2d",
  apiKey: "AIzaSyDu4aGG5w7VKzl99YA4k3w_sEQJ8nKfZbA",
  authDomain: "gen-lang-client-0167985385.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-bibletheologypro-0095cf70-1f02-42e2-9e42-51561c4671b3",
  storageBucket: "gen-lang-client-0167985385.firebasestorage.app",
  messagingSenderId: "710269410392",
  measurementId: ""
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

// Custom UI events or notifications for synchronization
let onSyncStatusChangeCallback: ((status: 'idle' | 'syncing' | 'success' | 'error', message?: string) => void) | null = null;

export function registerSyncStatusListener(callback: (status: 'idle' | 'syncing' | 'success' | 'error', message?: string) => void) {
  onSyncStatusChangeCallback = callback;
}

function updateSyncStatus(status: 'idle' | 'syncing' | 'success' | 'error', message?: string) {
  if (onSyncStatusChangeCallback) {
    onSyncStatusChangeCallback(status, message);
  }
}

// Global Sync State
let isSyncing = false;

/**
 * Perform a full bi-directional sync between local IndexedDB and Cloud Firestore.
 * This function preserves existing user data and merges everything securely.
 */
export async function syncAllData(userId: string): Promise<boolean> {
  if (isSyncing) return false;
  isSyncing = true;
  updateSyncStatus('syncing', 'Sincronizando dados com a nuvem...');

  try {
    console.log('[Sync] Starting full synchronization for user:', userId);

    // 1. Sync NOTES
    const localNotes = await dbService.getNotes();
    const notesCol = collection(db, 'users', userId, 'notes');
    const cloudNotesSnap = await getDocs(notesCol);
    const cloudNotes = cloudNotesSnap.docs.map(doc => doc.data() as Note);

    // Merge notes by id
    const notesBatch = writeBatch(db);
    let notesDbModified = false;

    // Upload local to cloud (or update cloud if newer)
    for (const local of localNotes) {
      const cloud = cloudNotes.find(n => n.id === local.id);
      if (!cloud || new Date(local.updatedAt || local.createdAt) > new Date(cloud.updatedAt || cloud.createdAt)) {
        const docRef = doc(db, 'users', userId, 'notes', local.id);
        notesBatch.set(docRef, local);
      }
    }
    // Download cloud to local
    for (const cloud of cloudNotes) {
      const local = localNotes.find(n => n.id === cloud.id);
      if (!local) {
        await dbService.saveNote(cloud);
        notesDbModified = true;
      } else if (new Date(cloud.updatedAt || cloud.createdAt) > new Date(local.updatedAt || local.createdAt)) {
        await dbService.saveNote(cloud);
        notesDbModified = true;
      }
    }
    await notesBatch.commit();

    // 2. Sync FAVORITES
    const localFavs = await dbService.getFavorites();
    const favCol = collection(db, 'users', userId, 'favorites');
    const cloudFavsSnap = await getDocs(favCol);
    const cloudFavs = cloudFavsSnap.docs.map(doc => doc.data() as Favorite);

    const favsBatch = writeBatch(db);
    let favsModified = false;

    for (const local of localFavs) {
      const cloud = cloudFavs.find(f => f.id === local.id);
      if (!cloud) {
        const docRef = doc(db, 'users', userId, 'favorites', local.id);
        favsBatch.set(docRef, local);
      }
    }
    for (const cloud of cloudFavs) {
      const local = localFavs.find(f => f.id === cloud.id);
      if (!local) {
        await dbService.saveFavorite(cloud);
        favsModified = true;
      }
    }
    await favsBatch.commit();

    // 3. Sync HIGHLIGHTS
    const localHls = await dbService.getHighlights();
    const hlCol = collection(db, 'users', userId, 'highlights');
    const cloudHlsSnap = await getDocs(hlCol);
    const cloudHls = cloudHlsSnap.docs.map(doc => doc.data() as Highlight);

    const hlsBatch = writeBatch(db);
    let hlsModified = false;

    for (const local of localHls) {
      const cloud = cloudHls.find(h => h.id === local.id);
      if (!cloud) {
        const docRef = doc(db, 'users', userId, 'highlights', local.id);
        hlsBatch.set(docRef, local);
      }
    }
    for (const cloud of cloudHls) {
      const local = localHls.find(h => h.id === cloud.id);
      if (!local) {
        await dbService.saveHighlight(cloud);
        hlsModified = true;
      }
    }
    await hlsBatch.commit();

    // 4. Sync READING PLANS
    const localPlans = await dbService.getPlans();
    const plansCol = collection(db, 'users', userId, 'plans');
    const cloudPlansSnap = await getDocs(plansCol);
    const cloudPlans = cloudPlansSnap.docs.map(doc => doc.data() as ReadingPlan);

    const plansBatch = writeBatch(db);
    let plansModified = false;

    for (const local of localPlans) {
      const cloud = cloudPlans.find(p => p.id === local.id);
      // If active or completed progress is higher locally
      if (!cloud || local.completedDays.length > cloud.completedDays.length || local.completedVerses.length > cloud.completedVerses.length) {
        const docRef = doc(db, 'users', userId, 'plans', local.id);
        plansBatch.set(docRef, local);
      }
    }
    for (const cloud of cloudPlans) {
      const local = localPlans.find(p => p.id === cloud.id);
      if (!local || cloud.completedDays.length > local.completedDays.length || cloud.completedVerses.length > local.completedVerses.length) {
        await dbService.savePlan(cloud);
        plansModified = true;
      }
    }
    await plansBatch.commit();

    // 5. Sync BOOKMARKS
    const localBookmarks = await dbService.getBookmarks();
    const bookmarksCol = collection(db, 'users', userId, 'bookmarks');
    const cloudBookmarksSnap = await getDocs(bookmarksCol);
    const cloudBookmarks = cloudBookmarksSnap.docs.map(doc => doc.data() as Bookmark);

    const bookmarksBatch = writeBatch(db);
    let bookmarksModified = false;

    for (const local of localBookmarks) {
      const cloud = cloudBookmarks.find(b => b.id === local.id);
      if (!cloud) {
        const docRef = doc(db, 'users', userId, 'bookmarks', local.id);
        bookmarksBatch.set(docRef, local);
      }
    }
    for (const cloud of cloudBookmarks) {
      const local = localBookmarks.find(b => b.id === cloud.id);
      if (!local) {
        await dbService.saveBookmark(cloud);
        bookmarksModified = true;
      }
    }
    await bookmarksBatch.commit();

    // 6. Sync PRAYERS
    const localPrayers = await dbService.getPrayers();
    const prayersCol = collection(db, 'users', userId, 'prayers');
    const cloudPrayersSnap = await getDocs(prayersCol);
    const cloudPrayers = cloudPrayersSnap.docs.map(doc => doc.data() as PrayerRequest);

    const prayersBatch = writeBatch(db);
    let prayersModified = false;

    for (const local of localPrayers) {
      const cloud = cloudPrayers.find(p => p.id === local.id);
      if (!cloud || new Date(local.updatedAt || local.createdAt) > new Date(cloud.updatedAt || cloud.createdAt)) {
        const docRef = doc(db, 'users', userId, 'prayers', local.id);
        prayersBatch.set(docRef, local);
      }
    }
    for (const cloud of cloudPrayers) {
      const local = localPrayers.find(p => p.id === cloud.id);
      if (!local || new Date(cloud.updatedAt || cloud.createdAt) > new Date(local.updatedAt || local.createdAt)) {
        await dbService.savePrayer(cloud);
        prayersModified = true;
      }
    }
    await prayersBatch.commit();

    // 7. Sync REWARD STATE
    const localRewards = await dbService.getRewardState();
    const rewardsDocRef = doc(db, 'users', userId, 'metadata', 'rewards');
    const cloudRewardsSnap = await getDoc(rewardsDocRef);

    if (cloudRewardsSnap.exists()) {
      const cloudRewards = cloudRewardsSnap.data() as RewardState;
      // Merge: take highest level and XP, and larger badges array
      const mergedRewards: RewardState = {
        xp: Math.max(localRewards.xp, cloudRewards.xp),
        level: Math.max(localRewards.level, cloudRewards.level),
        dailyStreak: Math.max(localRewards.dailyStreak, cloudRewards.dailyStreak),
        lastActiveDate: localRewards.lastActiveDate || cloudRewards.lastActiveDate,
        badges: Array.from(new Set([...(localRewards.badges || []), ...(cloudRewards.badges || [])])),
        achievements: Array.from(new Set([...(localRewards.achievements || []), ...(cloudRewards.achievements || [])]))
      };
      
      // Update local if different
      if (JSON.stringify(mergedRewards) !== JSON.stringify(localRewards)) {
        await dbService.saveRewardState(mergedRewards);
      }
      // Update cloud
      await setDoc(rewardsDocRef, mergedRewards);
    } else {
      // Just upload local
      await setDoc(rewardsDocRef, localRewards);
    }

    // 8. Sync READING PROGRESS
    const localProgress = await dbService.getReadingProgress();
    const progressDocRef = doc(db, 'users', userId, 'metadata', 'progress');
    const cloudProgressSnap = await getDoc(progressDocRef);

    if (cloudProgressSnap.exists()) {
      const cloudProgress = cloudProgressSnap.data() as ReadingProgress;
      // Merge completed chapters
      const mergedProgress: ReadingProgress = {
        id: 'current',
        lastBookId: localProgress.lastBookId || cloudProgress.lastBookId,
        lastChapter: localProgress.lastChapter || cloudProgress.lastChapter,
        lastReadAt: new Date(localProgress.lastReadAt || 0) > new Date(cloudProgress.lastReadAt || 0) 
          ? localProgress.lastReadAt 
          : cloudProgress.lastReadAt,
        completedChapters: Array.from(new Set([...(localProgress.completedChapters || []), ...(cloudProgress.completedChapters || [])]))
      };

      if (JSON.stringify(mergedProgress) !== JSON.stringify(localProgress)) {
        await dbService.saveReadingProgress(mergedProgress);
      }
      await setDoc(progressDocRef, mergedProgress);
    } else {
      await setDoc(progressDocRef, localProgress);
    }

    // 9. Sync CREATIVE DESIGNS
    const localDesigns = await dbService.getDesigns();
    const designsCol = collection(db, 'users', userId, 'designs');
    const cloudDesignsSnap = await getDocs(designsCol);
    const cloudDesigns = cloudDesignsSnap.docs.map(doc => doc.data() as CreativeDesign);

    const designsBatch = writeBatch(db);
    let designsModified = false;

    for (const local of localDesigns) {
      const cloud = cloudDesigns.find(d => d.id === local.id);
      if (!cloud) {
        const docRef = doc(db, 'users', userId, 'designs', local.id);
        designsBatch.set(docRef, local);
      }
    }
    for (const cloud of cloudDesigns) {
      const local = localDesigns.find(d => d.id === cloud.id);
      if (!local) {
        await dbService.saveDesign(cloud);
        designsModified = true;
      }
    }
    await designsBatch.commit();

    console.log('[Sync] Synchronization completed successfully!');
    updateSyncStatus('success', 'Sincronização concluída com sucesso!');
    isSyncing = false;
    
    // Auto reset to idle status after a few seconds
    setTimeout(() => {
      updateSyncStatus('idle');
    }, 4000);

    return true;
  } catch (error) {
    console.error('[Sync] Error during synchronization:', error);
    updateSyncStatus('error', 'Ocorreu um erro ao sincronizar seus dados.');
    isSyncing = false;
    return false;
  }
}

/**
 * Register Background Sync via Service Worker when offline modifications are made.
 */
export function registerOfflineSync() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((reg) => {
      if ('sync' in reg) {
        console.log('[Sync] Registering "sync-theology-studies" background sync tag...');
        return (reg as any).sync.register('sync-theology-studies');
      }
    }).catch((err) => {
      console.warn('[Sync] Failed to register background sync offline:', err);
    });
  }
}

/**
 * Upload a single item update to Firestore in real-time.
 * Used internally by saving functions when user is logged in.
 */
export async function saveToCloudRealtime(userId: string, pathSegment: string, id: string, data: any) {
  if (!navigator.onLine) {
    registerOfflineSync();
    return; // Silent skip if completely offline
  }
  try {
    const docRef = doc(db, 'users', userId, pathSegment, id);
    await setDoc(docRef, data);
  } catch (err) {
    console.warn(`[Sync] Realtime save to cloud failed for ${pathSegment}/${id}:`, err);
    registerOfflineSync();
  }
}

/**
 * Delete a single item from Firestore in real-time.
 */
export async function deleteFromCloudRealtime(userId: string, pathSegment: string, id: string) {
  if (!navigator.onLine) {
    registerOfflineSync();
    return;
  }
  try {
    const docRef = doc(db, 'users', userId, pathSegment, id);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn(`[Sync] Realtime delete from cloud failed for ${pathSegment}/${id}:`, err);
    registerOfflineSync();
  }
}

// Register local DB changes to stream to the cloud in real-time
import { registerCloudHandlers } from '../database/db';

registerCloudHandlers(
  async (segment: string, id: string, data: any) => {
    const user = auth.currentUser;
    if (user) {
      await saveToCloudRealtime(user.uid, segment, id, data);
    }
  },
  async (segment: string, id: string) => {
    const user = auth.currentUser;
    if (user) {
      await deleteFromCloudRealtime(user.uid, segment, id);
    }
  }
);

// Real-time Firestore Sync Listeners (to sync changes back from the cloud to local storage)
let notesUnsubscribe: (() => void) | null = null;
let plansUnsubscribe: (() => void) | null = null;

export function setupRealtimeListeners(userId: string, onUpdate?: () => void) {
  // Clear any existing active listeners
  clearRealtimeListeners();

  if (!userId) return;

  console.log('[Firebase Realtime] Subscribing to cloud changes for notes and plans for user:', userId);

  // 1. Real-time Notes listener
  const notesCol = collection(db, 'users', userId, 'notes');
  notesUnsubscribe = onSnapshot(notesCol, async (snapshot) => {
    let localDBUpdated = false;
    
    for (const change of snapshot.docChanges()) {
      const cloudNote = change.doc.data() as Note;
      if (change.type === 'added' || change.type === 'modified') {
        // Query local note to see if we need an update (merge logic based on updatedAt timestamp)
        const localNote = await dbService.getNotes().then(list => list.find(n => n.id === cloudNote.id));
        if (!localNote || !localNote.updatedAt || !cloudNote.updatedAt || new Date(cloudNote.updatedAt) > new Date(localNote.updatedAt)) {
          await dbService.saveNoteFromCloud(cloudNote);
          localDBUpdated = true;
        }
      } else if (change.type === 'removed') {
        await dbService.deleteNoteFromCloud(change.doc.id);
        localDBUpdated = true;
      }
    }

    if (localDBUpdated) {
      console.log('[Firebase Realtime] Notes database changed in cloud. Dispatching update event.');
      window.dispatchEvent(new CustomEvent('db-update', { detail: { type: 'notes' } }));
      if (onUpdate) onUpdate();
    }
  }, (error) => {
    console.error('[Firebase Realtime] Error in notes snapshot listener:', error);
  });

  // 2. Real-time Plans listener
  const plansCol = collection(db, 'users', userId, 'plans');
  plansUnsubscribe = onSnapshot(plansCol, async (snapshot) => {
    let localDBUpdated = false;

    for (const change of snapshot.docChanges()) {
      const cloudPlan = change.doc.data() as ReadingPlan;
      if (change.type === 'added' || change.type === 'modified') {
        const localPlan = await dbService.getPlans().then(list => list.find(p => p.id === cloudPlan.id));
        if (!localPlan || cloudPlan.completedDays.length > localPlan.completedDays.length || cloudPlan.completedVerses.length > localPlan.completedVerses.length) {
          await dbService.savePlanFromCloud(cloudPlan);
          localDBUpdated = true;
        }
      } else if (change.type === 'removed') {
        await dbService.deletePlanFromCloud(change.doc.id);
        localDBUpdated = true;
      }
    }

    if (localDBUpdated) {
      console.log('[Firebase Realtime] Plans database changed in cloud. Dispatching update event.');
      window.dispatchEvent(new CustomEvent('db-update', { detail: { type: 'plans' } }));
      if (onUpdate) onUpdate();
    }
  }, (error) => {
    console.error('[Firebase Realtime] Error in plans snapshot listener:', error);
  });
}

export function clearRealtimeListeners() {
  if (notesUnsubscribe) {
    notesUnsubscribe();
    notesUnsubscribe = null;
  }
  if (plansUnsubscribe) {
    plansUnsubscribe();
    plansUnsubscribe = null;
  }
  console.log('[Firebase Realtime] Cleared active cloud listeners.');
}

