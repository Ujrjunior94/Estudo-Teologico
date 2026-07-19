import { BIBLE_BOOKS } from '../database/bibleMetadata';
import { BibleBook } from '../types';

/**
 * Normalizes a string by removing accents and converting to lowercase.
 */
export function normalizeString(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents/diacritics
    .toLowerCase()
    .trim();
}

/**
 * Resolves a book name, abbreviation, or ID to a standard BibleBook object using normalization.
 */
export function findBookNormalized(bookNameOrId: string): BibleBook | null {
  if (!bookNameOrId) return null;
  const cleanQuery = normalizeString(bookNameOrId);
  
  // Try exact ID match
  let found = BIBLE_BOOKS.find(b => normalizeString(b.id) === cleanQuery);
  if (found) return found;
  
  // Try exact Name match
  found = BIBLE_BOOKS.find(b => normalizeString(b.name) === cleanQuery);
  if (found) return found;

  // Try exact Abbreviation match
  found = BIBLE_BOOKS.find(b => normalizeString(b.abbrev) === cleanQuery);
  if (found) return found;

  // Try partial or contained match
  found = BIBLE_BOOKS.find(b => {
    const cleanName = normalizeString(b.name);
    return cleanQuery.includes(cleanName) || cleanName.includes(cleanQuery);
  });
  if (found) return found;

  return null;
}

/**
 * Normalizes a Bible book name by removing accents, converting to lowercase, and removing extra spaces.
 */
export function normalizeBookName(bookName: string): string {
  if (!bookName) return '';
  return bookName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents/diacritics
    .toLowerCase()
    .replace(/\s+/g, ' ') // Convert multiple spaces to a single space
    .trim();
}

/**
 * Normalizes all bible book names and references in text before they are processed or sent to APIs.
 */
export function normalizeReferencesInText(text: string): string {
  if (!text) return '';
  // Match things like "Gênesis 1:1" or "Genesis 1:1" or "1 Samuel 2:3"
  const refRegex = /\b([0-9]?\s*[A-Za-zÀ-ÿ]+?)\s+(\d+)[:\s]+(\d+)\b/g;
  
  return text.replace(refRegex, (match, bookPart, chapter, verse) => {
    const matchedBook = findBookNormalized(bookPart);
    if (matchedBook) {
      // Standardize the book name to the normalized one (lowercase, no accents, no extra spaces)
      const normalizedBook = normalizeBookName(matchedBook.name);
      return `${normalizedBook} ${chapter}:${verse}`;
    }
    return match;
  });
}
