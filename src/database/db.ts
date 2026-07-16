import { Note, Favorite, Highlight, ReadingPlan, RewardState, CreativeDesign, ReadingProgress, CachedChapter, Bookmark, PrayerRequest } from '../types';

const DB_NAME = 'EstudoBiblicoTeologicoPRO_DB';
const DB_VERSION = 3;

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = request.result;

      if (!db.objectStoreNames.contains('notes')) {
        db.createObjectStore('notes', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('favorites')) {
        db.createObjectStore('favorites', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('highlights')) {
        db.createObjectStore('highlights', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('plans')) {
        db.createObjectStore('plans', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('rewards')) {
        db.createObjectStore('rewards', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('designs')) {
        db.createObjectStore('designs', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('reading_progress')) {
        db.createObjectStore('reading_progress', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('bible_cache')) {
        db.createObjectStore('bible_cache', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('bookmarks')) {
        db.createObjectStore('bookmarks', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('prayers')) {
        db.createObjectStore('prayers', { keyPath: 'id' });
      }
    };
  });
}

// Helper to perform simple transactions
async function runTx<T>(
  storeName: string,
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest | void
): Promise<T> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const req = callback(store);

    tx.oncomplete = () => {
      if (req && req.result !== undefined) {
        resolve(req.result as T);
      } else {
        resolve(undefined as unknown as T);
      }
    };

    tx.onerror = () => reject(tx.error);
    if (req) {
      req.onerror = () => reject(req.error);
    }
  });
}

export const dbService = {
  // NOTES CRUD
  async getNotes(): Promise<Note[]> {
    return runTx<Note[]>('notes', 'readonly', (store) => store.getAll());
  },
  async saveNote(note: Note): Promise<void> {
    await runTx<void>('notes', 'readwrite', (store) => store.put(note));
  },
  async deleteNote(id: string): Promise<void> {
    await runTx<void>('notes', 'readwrite', (store) => store.delete(id));
  },

  // FAVORITES CRUD
  async getFavorites(): Promise<Favorite[]> {
    return runTx<Favorite[]>('favorites', 'readonly', (store) => store.getAll());
  },
  async saveFavorite(fav: Favorite): Promise<void> {
    await runTx<void>('favorites', 'readwrite', (store) => store.put(fav));
  },
  async deleteFavorite(id: string): Promise<void> {
    await runTx<void>('favorites', 'readwrite', (store) => store.delete(id));
  },

  // HIGHLIGHTS CRUD
  async getHighlights(): Promise<Highlight[]> {
    return runTx<Highlight[]>('highlights', 'readonly', (store) => store.getAll());
  },
  async saveHighlight(hl: Highlight): Promise<void> {
    await runTx<void>('highlights', 'readwrite', (store) => store.put(hl));
  },
  async deleteHighlight(id: string): Promise<void> {
    await runTx<void>('highlights', 'readwrite', (store) => store.delete(id));
  },

  // READING PLANS CRUD
  async getPlans(): Promise<ReadingPlan[]> {
    return runTx<ReadingPlan[]>('plans', 'readonly', (store) => store.getAll());
  },
  async savePlan(plan: ReadingPlan): Promise<void> {
    await runTx<void>('plans', 'readwrite', (store) => store.put(plan));
  },
  async deletePlan(id: string): Promise<void> {
    await runTx<void>('plans', 'readwrite', (store) => store.delete(id));
  },

  // REWARDS Persistence
  async getRewardState(): Promise<RewardState> {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('rewards', 'readonly');
      const store = tx.objectStore('rewards');
      const req = store.get('current');
      req.onsuccess = () => {
        if (req.result) {
          resolve(req.result as RewardState);
        } else {
          // Return default state
          const defaultState: RewardState = {
            xp: 0,
            level: 1,
            dailyStreak: 0,
            badges: [],
            achievements: []
          };
          resolve(defaultState);
        }
      };
      req.onerror = () => {
        resolve({
          xp: 0,
          level: 1,
          dailyStreak: 0,
          badges: [],
          achievements: []
        });
      };
    });
  },
  async saveRewardState(state: RewardState): Promise<void> {
    await runTx<void>('rewards', 'readwrite', (store) => store.put({ ...state, id: 'current' }));
  },

  // CREATIVE DESIGNS CRUD
  async getDesigns(): Promise<CreativeDesign[]> {
    return runTx<CreativeDesign[]>('designs', 'readonly', (store) => store.getAll());
  },
  async saveDesign(design: CreativeDesign): Promise<void> {
    await runTx<void>('designs', 'readwrite', (store) => store.put(design));
  },
  async deleteDesign(id: string): Promise<void> {
    await runTx<void>('designs', 'readwrite', (store) => store.delete(id));
  },

  // READING PROGRESS CRUD
  async getReadingProgress(): Promise<ReadingProgress> {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('reading_progress', 'readonly');
      const store = tx.objectStore('reading_progress');
      const req = store.get('current');
      req.onsuccess = () => {
        if (req.result) {
          resolve(req.result as ReadingProgress);
        } else {
          resolve({
            id: 'current',
            lastBookId: 'GEN',
            lastChapter: 1,
            lastReadAt: new Date().toISOString(),
            completedChapters: []
          });
        }
      };
      req.onerror = () => {
        resolve({
          id: 'current',
          lastBookId: 'GEN',
          lastChapter: 1,
          lastReadAt: new Date().toISOString(),
          completedChapters: []
        });
      };
    });
  },
  async saveReadingProgress(progress: ReadingProgress): Promise<void> {
    await runTx<void>('reading_progress', 'readwrite', (store) => store.put({ ...progress, id: 'current' }));
  },

  // BIBLE CACHE CRUD
  async getCachedChapter(bookId: string, chapter: number, version: string): Promise<CachedChapter | null> {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('bible_cache', 'readonly');
      const store = tx.objectStore('bible_cache');
      const req = store.get(`${bookId}-${chapter}-${version}`);
      req.onsuccess = () => {
        resolve(req.result ? (req.result as CachedChapter) : null);
      };
      req.onerror = () => {
        resolve(null);
      };
    });
  },
  async saveCachedChapter(cached: CachedChapter): Promise<void> {
    await runTx<void>('bible_cache', 'readwrite', (store) => store.put(cached));
  },
  async getAllCachedChapters(): Promise<CachedChapter[]> {
    return runTx<CachedChapter[]>('bible_cache', 'readonly', (store) => store.getAll());
  },
  
  // BOOKMARKS CRUD
  async getBookmarks(): Promise<Bookmark[]> {
    return runTx<Bookmark[]>('bookmarks', 'readonly', (store) => store.getAll());
  },
  async saveBookmark(bookmark: Bookmark): Promise<void> {
    await runTx<void>('bookmarks', 'readwrite', (store) => store.put(bookmark));
  },
  async deleteBookmark(id: string): Promise<void> {
    await runTx<void>('bookmarks', 'readwrite', (store) => store.delete(id));
  },

  // PRAYERS CRUD
  async getPrayers(): Promise<PrayerRequest[]> {
    return runTx<PrayerRequest[]>('prayers', 'readonly', (store) => store.getAll());
  },
  async savePrayer(prayer: PrayerRequest): Promise<void> {
    await runTx<void>('prayers', 'readwrite', (store) => store.put(prayer));
  },
  async deletePrayer(id: string): Promise<void> {
    await runTx<void>('prayers', 'readwrite', (store) => store.delete(id));
  },

  async clearAllData(): Promise<void> {
    const db = await openDB();
    const stores = ['notes', 'favorites', 'highlights', 'plans', 'rewards', 'designs', 'reading_progress', 'bible_cache', 'bookmarks', 'prayers'];
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(stores, 'readwrite');
        stores.forEach(storeName => {
          if (db.objectStoreNames.contains(storeName)) {
            tx.objectStore(storeName).clear();
          }
        });
        tx.oncomplete = () => resolve();
        tx.onerror = (e) => reject(e);
      } catch (err) {
        reject(err);
      }
    });
  }
};
