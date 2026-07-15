import { dbService } from '../database/db';
import { getChapterVersesCount, getGeneratedVerseText } from '../database/bibleMetadata';
import { CachedChapter } from '../types';

export interface VerseItem {
  verse: number;
  text: string;
}

/**
 * Bible Service to handle chapter and verse fetching.
 * Features an offline-first caching policy:
 * 1. Checks if online, fetches from server API (/api/verse)
 * 2. Caches successful fetches in IndexedDB for subsequent offline use
 * 3. Falls back to IndexedDB cached chapters when offline or network fails
 * 4. Falls back to local synthetic generation (via metadata) if no cache exists
 */
export const bibleService = {
  async fetchChapter(
    bookId: string,
    chapter: number,
    version: 'ARA' | 'NVI' | 'KJV' = 'ARA'
  ): Promise<VerseItem[]> {
    const cacheKey = `${bookId}-${chapter}-${version}`;

    // Try fetching from the server API if network is available
    if (navigator.onLine) {
      try {
        const response = await fetch(`/api/verse?bookId=${bookId}&chapter=${chapter}&version=${version}`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.verses) {
            // Save/Cache to IndexedDB
            const cacheItem: CachedChapter = {
              id: cacheKey,
              bookId,
              chapter,
              version,
              verses: data.verses,
              cachedAt: new Date().toISOString()
            };
            await dbService.saveCachedChapter(cacheItem);
            return data.verses;
          }
        }
      } catch (err) {
        console.warn('Network fetch failed for Bible chapter. Falling back to local database/cache:', err);
      }
    }

    // --- LOCAL FALLBACK MECHANISM ---
    
    // 1. Check IndexedDB cache first
    try {
      const cached = await dbService.getCachedChapter(bookId, chapter, version);
      if (cached && cached.verses && cached.verses.length > 0) {
        console.log(`Loaded chapter ${bookId} ${chapter} (${version}) from IndexedDB Cache.`);
        return cached.verses;
      }
    } catch (dbErr) {
      console.error('Failed to read from IndexedDB cache:', dbErr);
    }

    // 2. Local fallback database generation (metadata backup)
    console.log(`No cache found for ${bookId} ${chapter} (${version}). Generating locally.`);
    const verseCount = getChapterVersesCount(bookId, chapter);
    const verses: VerseItem[] = [];
    for (let v = 1; v <= verseCount; v++) {
      verses.push({
        verse: v,
        text: getGeneratedVerseText(bookId, chapter, v, version)
      });
    }

    // Silently try to cache the generated ones in IndexedDB so it's ready next time
    try {
      const cacheItem: CachedChapter = {
        id: cacheKey,
        bookId,
        chapter,
        version,
        verses,
        cachedAt: new Date().toISOString()
      };
      await dbService.saveCachedChapter(cacheItem);
    } catch (e) {
      // ignore
    }

    return verses;
  }
};
