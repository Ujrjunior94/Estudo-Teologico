export interface BibleBook {
  id: string;
  name: string;
  abbrev: string;
  chaptersCount: number;
  category: string;
  testament: 'AT' | 'NT';
}

export interface BibleVerse {
  bookId: string;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
  version: string;
}

export interface TheologicalTerm {
  id: string;
  term: string;
  etymology: string;
  category: string;
  definition: string;
  theologicalPerspective: string;
  biblicalReferences: string[];
}

export interface Note {
  id: string;
  bookId?: string;
  chapter?: number;
  verse?: number;
  title: string;
  content: string; // markdown supported
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface Favorite {
  id: string;
  bookId: string;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
  createdAt: string;
  category: string;
}

export interface Highlight {
  id: string; // bookId-chapter-verse
  bookId: string;
  chapter: number;
  verse: number;
  color: string; // hex or tailwind class
  createdAt: string;
}

export interface ReadingPlan {
  id: string;
  title: string;
  description: string;
  durationDays: number;
  startDate?: string;
  completedDays: number[]; // e.g. [1, 2, 3]
  completedVerses: string[]; // e.g. ["GEN-1-1", "GEN-1-2"]
  isActive: boolean;
  tasksPerDay: {
    day: number;
    readings: {
      bookId: string;
      bookName: string;
      chapters: number[];
    }[];
  }[];
}

export interface RewardState {
  xp: number;
  level: number;
  dailyStreak: number;
  lastActiveDate?: string;
  badges: string[]; // badge IDs
  achievements: string[]; // achievement IDs
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
}

export interface CreativeDesign {
  id: string;
  type: 'slide' | 'cover' | 'illustrated_verse';
  title: string;
  verseText?: string;
  verseRef?: string;
  backgroundType: 'color' | 'image';
  backgroundValue: string; // hex or image URL / description
  textColor: string;
  fontFamily: string;
  fontSize: number;
  textAlign: 'left' | 'center' | 'right';
  createdAt: string;
}

export interface ReadingProgress {
  id: string; // e.g., 'current'
  lastBookId: string;
  lastChapter: number;
  lastReadAt: string;
  completedChapters: string[]; // e.g., ['GEN-1', 'GEN-2']
}

export interface CachedChapter {
  id: string; // e.g., 'GEN-1-ARA'
  bookId: string;
  chapter: number;
  version: string;
  verses: { verse: number; text: string }[];
  cachedAt: string;
}

export interface Bookmark {
  id: string; // e.g., 'GEN-1-ARA' or random
  bookId: string;
  bookName: string;
  chapter: number;
  version: 'ARA' | 'NVI' | 'KJV';
  scrollPosition: number; // percentage or scrollTop
  highlights: Highlight[]; // highlights stored for this book/chapter at bookmark time
  createdAt: string;
  label?: string; // custom note/label for the bookmark
}

export interface PrayerLog {
  id: string;
  note: string;
  createdAt: string;
}

export interface PrayerRequest {
  id: string;
  title: string;
  request: string;
  requesterName?: string;
  category: 'Saúde' | 'Família' | 'Finanças' | 'Espiritual' | 'Trabalho' | 'Outro';
  status: 'Pendente' | 'Respondido' | 'Agradecimento';
  answer?: string;
  createdAt: string;
  updatedAt: string;
  logs: PrayerLog[];
}

