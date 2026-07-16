import { dbService } from '../database/db';
import { getChapterVersesCount, getGeneratedVerseText, AUTHENTIC_PASSAGES } from '../database/bibleMetadata';
import { CachedChapter } from '../types';

export interface VerseItem {
  verse: number;
  text: string;
  source?: 'preloaded' | 'api' | 'synthetic';
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
    version: 'ARA' | 'NVI' | 'KJV' = 'ARA',
    forceRefresh: boolean = false
  ): Promise<VerseItem[]> {
    const cacheKey = `${bookId}-${chapter}-${version}`;

    // 1. Check IndexedDB cache first (unless forced to refresh)
    const expectedVerses = getChapterVersesCount(bookId, chapter);
    if (!forceRefresh) {
      try {
        const cached = await dbService.getCachedChapter(bookId, chapter, version);
        if (cached && cached.verses && cached.verses.length > 0) {
          // AUDIT INTEGRITY: Ensure the cache is not structurally incomplete compared to standard counts
          const isLegacyOutdatedSynthetic = cached.source === 'synthetic' && cached.verses.length < expectedVerses;
          const isCorruptedEmpty = cached.verses.length === 0;

          if (!isLegacyOutdatedSynthetic && !isCorruptedEmpty && (cached.source === 'api' || cached.source === 'preloaded')) {
            console.log(`Loaded verified chapter ${bookId} ${chapter} (${version}) from IndexedDB Cache.`);
            return cached.verses.map(v => ({
              ...v,
              source: v.source || cached.source
            }));
          }
        }
      } catch (dbErr) {
        console.error('Failed to read from IndexedDB cache on early check:', dbErr);
      }
    }

    // 2. Try fetching from the server API if network is available
    if (navigator.onLine) {
      try {
        const response = await fetch(`/api/verse?bookId=${bookId}&chapter=${chapter}&version=${version}`);
        if (response.ok) {
          const data = await response.json();
          // CRITICAL: Only cache and return if the server actually returned verses!
          if (data && Array.isArray(data.verses) && data.verses.length > 0) {
            const serverSource = data.source || 'api';
            const versesWithSource: VerseItem[] = data.verses.map((v: any) => ({
              ...v,
              source: serverSource as any
            }));
            
            // Save/Cache to IndexedDB
            const cacheItem: CachedChapter = {
              id: cacheKey,
              bookId,
              chapter,
              version,
              verses: versesWithSource,
              cachedAt: new Date().toISOString(),
              source: serverSource
            };
            await dbService.saveCachedChapter(cacheItem);
            return versesWithSource;
          }
        }
      } catch (err) {
        console.warn('Network fetch failed for Bible chapter. Falling back to local database/cache:', err);
      }
    }

    // --- LOCAL FALLBACK MECHANISM ---
    
    // 3. Fallback to cached chapter (even if it's synthetic, as long as it has verses and is structurally complete)
    try {
      const cached = await dbService.getCachedChapter(bookId, chapter, version);
      if (cached && cached.verses && cached.verses.length >= expectedVerses) {
        console.log(`Loaded cached fallback chapter ${bookId} ${chapter} (${version}) from IndexedDB Cache.`);
        const isPreloadedKey = `${bookId.toUpperCase()}-${chapter}`;
        const chapterSource = cached.source || (AUTHENTIC_PASSAGES[isPreloadedKey] ? 'preloaded' as const : 'synthetic' as const);
        
        return cached.verses.map(v => ({
          ...v,
          source: v.source || chapterSource
        }));
      }
    } catch (dbErr) {
      console.error('Failed to read from IndexedDB cache:', dbErr);
    }

    // 4. Local fallback database generation (metadata backup)
    console.log(`No cache found for ${bookId} ${chapter} (${version}). Generating locally.`);
    const verseCount = getChapterVersesCount(bookId, chapter);
    const verses: VerseItem[] = [];
    const isPreloadedKey = `${bookId.toUpperCase()}-${chapter}`;
    const chapterSource = AUTHENTIC_PASSAGES[isPreloadedKey] ? 'preloaded' as const : 'synthetic' as const;

    for (let v = 1; v <= verseCount; v++) {
      verses.push({
        verse: v,
        text: getGeneratedVerseText(bookId, chapter, v, version),
        source: chapterSource
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
        cachedAt: new Date().toISOString(),
        source: chapterSource
      };
      await dbService.saveCachedChapter(cacheItem);
    } catch (e) {
      // ignore
    }

    return verses;
  }
};
