import React, { useState, useEffect, useRef } from 'react';
import { List as WindowList } from 'react-window';
import { BIBLE_BOOKS, getChapterVersesCount, getGeneratedVerseText, AUTHENTIC_PASSAGES } from '../database/bibleMetadata';
import { DAILY_VERSES } from '../database/dailyVerses';
import { HIGHLIGHT_COLORS, SYSTEM_BADGES } from '../constants';
import { dbService } from '../database/db';
import { bibleService, VerseItem } from '../services/bibleService';
import { useRewards } from '../contexts/RewardContext';
import { Note, Favorite, Highlight, Bookmark as BibleBookmark } from '../types';
import { 
  Book, 
  Bookmark, 
  Copy, 
  Share2, 
  Volume2, 
  VolumeX, 
  Edit3, 
  Palette, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  List,
  CheckCircle,
  X,
  Mic,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  DownloadCloud
} from 'lucide-react';
import { formatShareText } from '../utils';

interface BibleReaderProps {
  selectedBibleRef: { bookId: string; chapter: number } | null;
  setSelectedBibleRef: (ref: { bookId: string; chapter: number } | null) => void;
}

export const BibleReader: React.FC<BibleReaderProps> = ({ selectedBibleRef, setSelectedBibleRef }) => {
  const { addXp, unlockBadge } = useRewards();

  // Core reading state
  const [activeBook, setActiveBook] = useState(BIBLE_BOOKS.find(b => b.id === 'GEN')!);
  const [activeChapter, setActiveChapter] = useState(1);
  const [activeVersion, setActiveVersion] = useState<'ARA' | 'NVI' | 'KJV'>('ARA');
  const [verses, setVerses] = useState<VerseItem[]>([]);

  // Selection & UI controls
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [showBookSelector, setShowBookSelector] = useState(false);
  const [showChapterSelector, setShowChapterSelector] = useState(false);
  
  // Persistence state
  const [highlights, setHighlights] = useState<Record<string, string>>({}); // key: verseIndex, value: colorHex
  const [favorites, setFavorites] = useState<Record<number, boolean>>({});
  const [notes, setNotes] = useState<Record<number, Note[]>>({});

  // Note Modal state
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteCategory, setNoteCategory] = useState('Estudo Teológico');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ bookId: string; bookName: string; chapter: number; verse: number; text: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Audio / TTS state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Bookmark state & methods
  const [bookmarks, setBookmarks] = useState<BibleBookmark[]>([]);
  const [showBookmarkModal, setShowBookmarkModal] = useState(false);
  const [bookmarkLabel, setBookmarkLabel] = useState('');

  // List virtualization using react-window
  const listRef = useRef<any>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.resetAfterIndex(0);
    }
  }, [verses, activeVersion]);

  const loadBookmarks = async () => {
    try {
      const stored = await dbService.getBookmarks();
      setBookmarks(stored.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (err) {
      console.error('Error loading bookmarks:', err);
    }
  };

  useEffect(() => {
    loadBookmarks();
  }, []);

  const handleSaveBookmark = async () => {
    const mainEl = document.querySelector('main');
    const currentScroll = mainEl ? mainEl.scrollTop : 0;

    // Compile chapter highlights
    const chapterHighlights: Highlight[] = Object.entries(highlights).map(([vIndex, color]) => ({
      id: `${activeBook.id}-${activeChapter}-${vIndex}`,
      bookId: activeBook.id,
      chapter: activeChapter,
      verse: parseInt(vIndex, 10),
      color: color as string,
      createdAt: new Date().toISOString()
    }));

    const newBookmark: BibleBookmark = {
      id: `bookmark_${activeBook.id}_${activeChapter}_${activeVersion}_${Date.now()}`,
      bookId: activeBook.id,
      bookName: activeBook.name,
      chapter: activeChapter,
      version: activeVersion,
      scrollPosition: currentScroll,
      highlights: chapterHighlights,
      createdAt: new Date().toISOString(),
      label: bookmarkLabel.trim() || undefined
    };

    try {
      await dbService.saveBookmark(newBookmark);
      setBookmarks(prev => [newBookmark, ...prev]);
      setShowBookmarkModal(false);
      setBookmarkLabel('');
      addXp(15, 'Marcou posição e destaques');
    } catch (err) {
      console.error('Error saving bookmark:', err);
    }
  };

  const handleDeleteBookmark = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await dbService.deleteBookmark(id);
      setBookmarks(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      console.error('Error deleting bookmark:', err);
    }
  };

  const handleApplyBookmark = async (b: BibleBookmark) => {
    const book = BIBLE_BOOKS.find(item => item.id === b.bookId);
    if (!book) return;

    setActiveBook(book);
    setActiveChapter(b.chapter);
    setActiveVersion(b.version);

    // Apply specific highlights saved in the bookmark to current state and IndexedDB
    if (b.highlights && b.highlights.length > 0) {
      const targetHls: Record<string, string> = {};
      for (const hl of b.highlights) {
        await dbService.saveHighlight(hl);
        targetHls[hl.verse] = hl.color;
      }
      setHighlights(targetHls);
    }

    // Scroll container to saved height
    setTimeout(() => {
      const mainEl = document.querySelector('main');
      if (mainEl) {
        mainEl.scrollTo({ top: b.scrollPosition, behavior: 'smooth' });
      }
    }, 450);

    addXp(10, 'Restaurou posição e destaques');
  };

  // Interactive verification and synchronization logic
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isSyncingBook, setIsSyncingBook] = useState(false);
  const [bookSyncProgress, setBookSyncProgress] = useState(0);

  const forceOnlineSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncStatus('idle');
    try {
      const fetched = await bibleService.fetchChapter(activeBook.id, activeChapter, activeVersion, true);
      const firstSource = fetched[0]?.source;
      if (fetched && fetched.length > 0 && (firstSource === 'api' || firstSource === 'preloaded')) {
        setVerses(fetched);
        setSyncStatus('success');
        addXp(10, 'Sincronizou Capítulo Online');
        setTimeout(() => setSyncStatus('idle'), 3000);
        return;
      }
      throw new Error('Falha ao obter dados verificados do servidor.');
    } catch (err) {
      console.error('Error syncing online:', err);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  const syncEntireBook = async () => {
    if (isSyncingBook) return;
    setIsSyncingBook(true);
    setBookSyncProgress(0);
    let successCount = 0;
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    try {
      const totalChapters = activeBook.chaptersCount;
      for (let ch = 1; ch <= totalChapters; ch++) {
        try {
          // Introduce a 350ms delay between fetches to prevent rate limiting
          await delay(350);
          
          const fetched = await bibleService.fetchChapter(activeBook.id, ch, activeVersion, true);
          const firstSource = fetched[0]?.source;
          if (fetched && fetched.length > 0 && (firstSource === 'api' || firstSource === 'preloaded')) {
            successCount++;
            if (ch === activeChapter) {
              setVerses(fetched);
            }
          }
        } catch (chErr) {
          console.warn(`Error caching chapter ${ch} of ${activeBook.id}:`, chErr);
        }
        setBookSyncProgress(Math.round((ch / totalChapters) * 100));
      }
      addXp(25, `Sincronizou livro ${activeBook.name} completo`);
      alert(`Sincronização concluída! ${successCount} de ${totalChapters} capítulos do livro ${activeBook.name} foram sincronizados offline com texto bíblico verificado.`);
    } catch (err) {
      console.error('Error syncing entire book:', err);
    } finally {
      setIsSyncingBook(false);
      setBookSyncProgress(0);
    }
  };

  // Sync with selectedBibleRef if set from Dashboard
  useEffect(() => {
    if (selectedBibleRef) {
      const book = BIBLE_BOOKS.find(b => b.id === selectedBibleRef.bookId);
      if (book) {
        setActiveBook(book);
        setActiveChapter(selectedBibleRef.chapter);
        setSelectedBibleRef(null); // clear after reading
      }
    }
  }, [selectedBibleRef, setSelectedBibleRef]);

  // Load verses and offline persistence (highlights, favorites, notes)
  useEffect(() => {
    async function loadData() {
      // Load verses using the offline-first bibleService
      try {
        const fetchedVerses = await bibleService.fetchChapter(activeBook.id, activeChapter, activeVersion);
        setVerses(fetchedVerses);
      } catch (err) {
        console.error('Error loading verses from bibleService:', err);
        const verseCount = getChapterVersesCount(activeBook.id, activeChapter);
        const generatedVerses = [];
        for (let v = 1; v <= verseCount; v++) {
          generatedVerses.push({
            verse: v,
            text: getGeneratedVerseText(activeBook.id, activeChapter, v, activeVersion)
          });
        }
        setVerses(generatedVerses);
      }

      // Save reading progress to IndexedDB
      try {
        const progress = await dbService.getReadingProgress();
        const completedChapters = progress?.completedChapters || [];
        const currentRef = `${activeBook.id}-${activeChapter}`;
        const newCompleted = completedChapters.includes(currentRef)
          ? completedChapters
          : [...completedChapters, currentRef];

        await dbService.saveReadingProgress({
          id: 'current',
          lastBookId: activeBook.id,
          lastChapter: activeChapter,
          lastReadAt: new Date().toISOString(),
          completedChapters: newCompleted
        });
      } catch (progressErr) {
        console.error('Error saving reading progress:', progressErr);
      }

      // Load DB States
      const allHls = await dbService.getHighlights();
      const currentHls: Record<string, string> = {};
      allHls.forEach(h => {
        if (h.bookId === activeBook.id && h.chapter === activeChapter) {
          currentHls[h.verse] = h.color;
        }
      });
      setHighlights(currentHls);

      const allFavs = await dbService.getFavorites();
      const currentFavs: Record<number, boolean> = {};
      allFavs.forEach(f => {
        if (f.bookId === activeBook.id && f.chapter === activeChapter) {
          currentFavs[f.verse] = true;
        }
      });
      setFavorites(currentFavs);

      const allNotes = await dbService.getNotes();
      const currentNotes: Record<number, Note[]> = {};
      allNotes.forEach(n => {
        if (n.bookId === activeBook.id && n.chapter === activeChapter && n.verse) {
          if (!currentNotes[n.verse]) currentNotes[n.verse] = [];
          currentNotes[n.verse].push(n);
        }
      });
      setNotes(currentNotes);
    }
    loadData();
    setSelectedVerse(null);
    stopAudio();
  }, [activeBook, activeChapter, activeVersion]);

  // Handle highlights
  const handleHighlight = async (colorHex: string) => {
    if (selectedVerse === null) return;
    
    const hlId = `${activeBook.id}-${activeChapter}-${selectedVerse}`;
    const newHl: Highlight = {
      id: hlId,
      bookId: activeBook.id,
      chapter: activeChapter,
      verse: selectedVerse,
      color: colorHex,
      createdAt: new Date().toISOString()
    };

    await dbService.saveHighlight(newHl);
    setHighlights(prev => ({ ...prev, [selectedVerse]: colorHex }));
    addXp(5, 'Destacou versículo');
    unlockBadge('primeiros_passos');
    setSelectedVerse(null);
  };

  const removeHighlight = async () => {
    if (selectedVerse === null) return;
    const hlId = `${activeBook.id}-${activeChapter}-${selectedVerse}`;
    await dbService.deleteHighlight(hlId);
    setHighlights(prev => {
      const copy = { ...prev };
      delete copy[selectedVerse];
      return copy;
    });
    setSelectedVerse(null);
  };

  // Handle Favorites
  const toggleFavorite = async () => {
    if (selectedVerse === null) return;
    
    const favId = `${activeBook.id}-${activeChapter}-${selectedVerse}`;
    const isFav = favorites[selectedVerse];

    if (isFav) {
      await dbService.deleteFavorite(favId);
      setFavorites(prev => ({ ...prev, [selectedVerse]: false }));
    } else {
      const verseText = verses.find(v => v.verse === selectedVerse)?.text || '';
      const newFav: Favorite = {
        id: favId,
        bookId: activeBook.id,
        bookName: activeBook.name,
        chapter: activeChapter,
        verse: selectedVerse,
        text: verseText,
        createdAt: new Date().toISOString(),
        category: 'Estudo Diário'
      };
      await dbService.saveFavorite(newFav);
      setFavorites(prev => ({ ...prev, [selectedVerse]: true }));
      addXp(10, 'Adicionou aos favoritos');
      unlockBadge('primeiros_passos');
    }
    setSelectedVerse(null);
  };

  // Handle Notes
  const openNoteModal = () => {
    if (selectedVerse === null) return;
    setNoteTitle(`${activeBook.name} ${activeChapter}:${selectedVerse}`);
    setNoteContent('');
    setShowNoteModal(true);
  };

  const saveNote = async () => {
    if (selectedVerse === null) return;

    const newNote: Note = {
      id: `note_${Date.now()}`,
      bookId: activeBook.id,
      chapter: activeChapter,
      verse: selectedVerse,
      title: noteTitle,
      content: noteContent,
      category: noteCategory,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await dbService.saveNote(newNote);
    
    setNotes(prev => {
      const current = prev[selectedVerse] || [];
      return { ...prev, [selectedVerse]: [...current, newNote] };
    });

    addXp(20, 'Anotação criada');
    unlockBadge('escriba');
    setShowNoteModal(false);
    setSelectedVerse(null);
  };

  // Copy Clipboard
  const copyToClipboard = () => {
    if (selectedVerse === null) return;
    const text = verses.find(v => v.verse === selectedVerse)?.text || '';
    const shareStr = `${text} — ${activeBook.name} ${activeChapter}:${selectedVerse} (${activeVersion})`;
    navigator.clipboard.writeText(shareStr);
    setSelectedVerse(null);
    addXp(2, 'Copiou versículo');
  };

  // Web Speech synthesis for TTS (works offline)
  const toggleAudio = () => {
    if (isPlayingAudio) {
      stopAudio();
    } else {
      const textToSpeak = verses.map(v => `${v.verse}. ${v.text}`).join(' ');
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = activeVersion === 'KJV' ? 'en-US' : 'pt-BR';
      utterance.rate = 1.0;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);

      speechSynthesis.speak(utterance);
      speechUtteranceRef.current = utterance;
      setIsPlayingAudio(true);
      addXp(15, 'Ouviu capítulo bíblico');
    }
  };

  const stopAudio = () => {
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
  };

  // Quick navigation
  const nextChapter = () => {
    if (activeChapter < activeBook.chaptersCount) {
      setActiveChapter(prev => prev + 1);
    } else {
      const bookIndex = BIBLE_BOOKS.findIndex(b => b.id === activeBook.id);
      if (bookIndex < BIBLE_BOOKS.length - 1) {
        setActiveBook(BIBLE_BOOKS[bookIndex + 1]);
        setActiveChapter(1);
      }
    }
  };

  const prevChapter = () => {
    if (activeChapter > 1) {
      setActiveChapter(prev => prev - 1);
    } else {
      const bookIndex = BIBLE_BOOKS.findIndex(b => b.id === activeBook.id);
      if (bookIndex > 0) {
        const prevBook = BIBLE_BOOKS[bookIndex - 1];
        setActiveBook(prevBook);
        setActiveChapter(prevBook.chaptersCount);
      }
    }
  };

  // Perform full Bible search offline
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setIsSearching(false);
      return;
    }

    const query = searchQuery.trim();

    // 1. Check if the query is a Bible Reference (e.g., "João 3:16", "Rom 8:28", "Salmos 23")
    const cleanQuery = query.toLowerCase();
    const refRegex = /^(\d+)?\s*([a-zá-úçâêîôûãõ\s-]+?)\s+(\d+)(?:\s*:\s*(\d+))?$/i;
    const match = cleanQuery.match(refRegex);
    
    let matchedRef = null;
    if (match) {
      const prefix = match[1] ? match[1] + ' ' : '';
      const bookNamePart = (prefix + match[2].trim()).toLowerCase();
      const chapterNum = parseInt(match[3], 10);
      const verseNum = match[4] ? parseInt(match[4], 10) : null;
      
      const book = BIBLE_BOOKS.find(b => {
        const nameNorm = b.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const abbrevNorm = b.abbrev.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const queryNorm = bookNamePart.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return nameNorm === queryNorm || abbrevNorm === queryNorm || b.id.toLowerCase() === queryNorm;
      });
      
      if (book && chapterNum >= 1 && chapterNum <= book.chaptersCount) {
        matchedRef = {
          bookId: book.id,
          bookName: book.name,
          chapter: chapterNum,
          verse: verseNum
        };
      }
    } else {
      // Try exact book name only match (e.g., "Gênesis", "Mateus")
      const bookOnly = BIBLE_BOOKS.find(b => {
        const nameNorm = b.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const queryNorm = cleanQuery.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return nameNorm === queryNorm || b.abbrev.toLowerCase() === queryNorm || b.id.toLowerCase() === queryNorm;
      });
      if (bookOnly) {
        matchedRef = {
          bookId: bookOnly.id,
          bookName: bookOnly.name,
          chapter: 1,
          verse: null
        };
      }
    }

    if (matchedRef) {
      const matchedBook = BIBLE_BOOKS.find(b => b.id === matchedRef.bookId);
      if (matchedBook) {
        setActiveBook(matchedBook);
        setActiveChapter(matchedRef.chapter);
        if (matchedRef.verse) {
          setSelectedVerse(matchedRef.verse);
        } else {
          setSelectedVerse(null);
        }
        setIsSearching(false);
        setSearchQuery('');
        addXp(15, 'Navegou por Referência');
        return;
      }
    }

    // 2. Otherwise, perform a keyword search
    setIsSearching(true);
    const lowercaseQuery = query.toLowerCase();
    const resultsList: any[] = [];
    const seenResults = new Set<string>();

    const addResult = (bookId: string, bookName: string, ch: number, v: number, text: string) => {
      const key = `${bookId}-${ch}-${v}`;
      if (!seenResults.has(key)) {
        seenResults.add(key);
        resultsList.push({
          bookId,
          bookName,
          chapter: ch,
          verse: v,
          text
        });
      }
    };

    // A. Search across daily verses
    DAILY_VERSES.forEach(dv => {
      const text = activeVersion === 'KJV' 
        ? (dv.textKJV || dv.text) 
        : activeVersion === 'NVI' 
          ? (dv.textNVI || dv.text) 
          : dv.text;
      if (text.toLowerCase().includes(lowercaseQuery)) {
        addResult(dv.bookId, dv.bookName, dv.chapter, dv.verse, text);
      }
    });

    // B. Search across all preloaded authentic passages
    Object.entries(AUTHENTIC_PASSAGES).forEach(([key, verses]) => {
      const [bookId, chStr] = key.split('-');
      const ch = parseInt(chStr, 10);
      const book = BIBLE_BOOKS.find(b => b.id === bookId);
      if (book) {
        const versesArray = verses as string[];
        versesArray.forEach((text, idx) => {
          if (text.toLowerCase().includes(lowercaseQuery)) {
            addResult(book.id, book.name, ch, idx + 1, text);
          }
        });
      }
    });

    // C. Search across ALL cached chapters in IndexedDB
    try {
      const cachedChapters = await dbService.getAllCachedChapters();
      cachedChapters.forEach(cached => {
        // Only search cache for the active version
        if (cached.version === activeVersion && cached.verses) {
          const book = BIBLE_BOOKS.find(b => b.id === cached.bookId);
          if (book) {
            cached.verses.forEach(v => {
              if (v.text.toLowerCase().includes(lowercaseQuery)) {
                addResult(book.id, book.name, cached.chapter, v.verse, v.text);
              }
            });
          }
        }
      });
    } catch (err) {
      console.error('Error searching cached chapters:', err);
    }

    // D. Scan through first 3 chapters of all books (including synthetic generator)
    // as a fallback for keywords if list is short, to keep full offline compatibility.
    BIBLE_BOOKS.forEach(book => {
      for (let ch = 1; ch <= Math.min(3, book.chaptersCount); ch++) {
        const verseCount = getChapterVersesCount(book.id, ch);
        for (let v = 1; v <= verseCount; v++) {
          const txt = getGeneratedVerseText(book.id, ch, v, activeVersion);
          if (txt.toLowerCase().includes(lowercaseQuery)) {
            addResult(book.id, book.name, ch, v, txt);
          }
        }
      }
    });

    setSearchResults(resultsList);
    addXp(10, 'Pesquisa Bíblica Realizada');
  };

  // List virtualization parameters using react-window
  const getRowHeight = (index: number) => {
    const verseText = verses[index]?.text || '';
    const charsPerLine = 60;
    const lines = Math.max(1, Math.ceil(verseText.length / charsPerLine));
    return lines * 28 + 24; 
  };

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const v = verses[index];
    if (!v) return null;
    const isSelected = selectedVerse === v.verse;
    const hlColor = highlights[v.verse];
    const hasNotes = notes[v.verse] && notes[v.verse].length > 0;
    const isFav = favorites[v.verse];

    return (
      <div style={style} className="pr-1">
        <p 
          onClick={() => setSelectedVerse(isSelected ? null : v.verse)}
          style={{ backgroundColor: hlColor ? `${hlColor}50` : undefined }}
          className={`relative p-2 rounded-lg cursor-pointer transition-all hover:bg-slate-50 select-none ${
            isSelected ? 'ring-2 ring-emerald-500 bg-emerald-50/20' : ''
          }`}
        >
          {/* Indicators for Notes / Favorites */}
          <span className="absolute -left-3 top-3 flex gap-0.5">
            {isFav && <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" title="Favoritado" />}
            {hasNotes && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" title="Possui notas" />}
          </span>

          <sup className="font-mono text-xs font-bold text-emerald-600 mr-2 select-none">
            {v.verse}
          </sup>
          
          <span className="font-serif font-light text-slate-800 tracking-wide">
            {v.text}
          </span>
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in pb-24">
      {/* Header Selectors */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 self-start md:self-auto">
          {/* Book Dropdown */}
          <div className="relative">
            <button 
              onClick={() => { setShowBookSelector(!showBookSelector); setShowChapterSelector(false); }}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-display font-bold px-4 py-2 rounded-lg transition-all border border-slate-200"
            >
              <Book size={16} className="text-emerald-600" />
              <span>{activeBook.name}</span>
            </button>
            
            {showBookSelector && (
              <div className="absolute left-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-4 max-h-96 overflow-y-auto grid grid-cols-2 gap-2">
                {BIBLE_BOOKS.map(b => (
                  <button
                    key={b.id}
                    onClick={() => {
                      setActiveBook(b);
                      setActiveChapter(1);
                      setShowBookSelector(false);
                    }}
                    className={`text-left text-xs px-2.5 py-1.5 rounded-md hover:bg-slate-50 transition-all ${
                      b.id === activeBook.id ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-700'
                    }`}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Chapter Selector */}
          <div className="relative">
            <button 
              onClick={() => { setShowChapterSelector(!showChapterSelector); setShowBookSelector(false); }}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-display font-bold px-4 py-2 rounded-lg transition-all border border-slate-200"
            >
              <List size={16} className="text-emerald-600" />
              <span>Capítulo {activeChapter}</span>
            </button>

            {showChapterSelector && (
              <div className="absolute left-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-4 max-h-96 overflow-y-auto grid grid-cols-4 gap-2">
                {Array.from({ length: activeBook.chaptersCount }, (_, i) => i + 1).map(ch => (
                  <button
                    key={ch}
                    onClick={() => {
                      setActiveChapter(ch);
                      setShowChapterSelector(false);
                    }}
                    className={`p-2 text-xs rounded-md font-mono text-center transition-all ${
                      ch === activeChapter ? 'bg-emerald-500 text-white font-bold' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Search & Version controls */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Search bar */}
          <div className="relative flex-1 md:flex-none">
            <input 
              type="text" 
              placeholder="Pesquisar Palavra ou Frase..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full md:w-56 bg-slate-100 text-slate-800 border border-slate-200 px-3 py-1.5 pl-9 rounded-lg text-xs font-sans focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setIsSearching(false); }} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                <X size={12} />
              </button>
            )}
          </div>

          {/* Version Toggles */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-mono font-bold">
            {(['ARA', 'NVI', 'KJV'] as const).map(ver => (
              <button
                key={ver}
                onClick={() => setActiveVersion(ver)}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  activeVersion === ver ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {ver}
              </button>
            ))}
          </div>

          {/* Speak Audio Button */}
          <button 
            onClick={toggleAudio}
            title="Ouvir capítulo em áudio"
            className={`p-2.5 rounded-lg border transition-all ${
              isPlayingAudio ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isPlayingAudio ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>

          {/* Bookmark Button */}
          <button 
            onClick={() => setShowBookmarkModal(true)}
            title="Marcar posição atual de leitura e destaques"
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 p-2.5 rounded-lg transition-all border border-slate-200 text-xs font-semibold"
          >
            <Bookmark size={16} className="text-emerald-600" />
            <span className="hidden sm:inline">Marcar Posição</span>
          </button>
        </div>
      </div>

      {/* Main Content responsive grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Left column: Bible Text / Search results */}
        <div className="lg:col-span-3 space-y-6">
          {isSearching ? (
            // Search Results Panel
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm min-h-[400px]">
              <h3 className="font-display font-bold text-slate-900 text-lg mb-4">
                Resultados de Busca para "{searchQuery}" ({searchResults.length})
              </h3>
              
              {searchResults.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  Nenhuma ocorrência encontrada offline para esta expressão.
                </div>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {searchResults.map((result, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => {
                        const b = BIBLE_BOOKS.find(book => book.id === result.bookId);
                        if (b) {
                          setActiveBook(b);
                          setActiveChapter(result.chapter);
                          setIsSearching(false);
                        }
                      }}
                      className="p-4 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/5 cursor-pointer transition-all"
                    >
                      <p className="text-xs font-mono font-bold text-emerald-600 mb-1">
                        {result.bookName} {result.chapter}:{result.verse} ({activeVersion})
                      </p>
                      <p className="text-sm text-slate-700 font-serif italic">
                        "{result.text}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Bible Chapter Reader Surface
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm relative min-h-[500px]">
              <div className="text-center mb-8">
                <h1 className="font-display font-black text-3xl text-slate-900">
                  {activeBook.name}
                </h1>
                <p className="font-mono text-xs text-slate-400 mt-1 uppercase tracking-widest font-bold">
                  Capítulo {activeChapter} — {activeBook.category}
                </p>
              </div>

              {/* Verses Container */}
              <div className="relative text-slate-800 font-serif text-lg pb-4 h-[600px] w-full">
                <WindowList<any>
                  key={`${activeBook.id}-${activeChapter}-${activeVersion}`}
                  listRef={listRef}
                  rowCount={verses.length}
                  rowHeight={getRowHeight}
                  rowComponent={Row as any}
                  rowProps={{}}
                  style={{ height: 600 }}
                  className="overflow-y-auto pr-1"
                />
              </div>

              {/* Quick chapter switches */}
              <div className="flex justify-between items-center border-t border-slate-100 pt-6 mt-8">
                <button 
                  onClick={prevChapter}
                  className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg font-medium text-slate-700 text-sm transition-all"
                >
                  <ChevronLeft size={16} />
                  <span>Anterior</span>
                </button>
                <span className="text-xs font-mono text-slate-400">
                  {activeBook.abbrev} {activeChapter}
                </span>
                <button 
                  onClick={nextChapter}
                  className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg font-medium text-slate-700 text-sm transition-all"
                >
                  <span>Próximo</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right column: Sidebars Container */}
        <div className="lg:col-span-1 space-y-6">
          {/* Bookmarks Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Bookmark size={18} className="text-emerald-600" />
              <h3 className="font-display font-bold text-slate-900 text-sm">
                Marcadores Salvos
              </h3>
            </div>

            {bookmarks.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs space-y-2 leading-relaxed">
                <p>Nenhum marcador de posição salvo neste dispositivo.</p>
                <p className="text-[10px] text-slate-400/70">Use o botão "Marcar Posição" no topo para registrar onde parou e as cores marcadas!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {bookmarks.map((b) => (
                  <div 
                    key={b.id}
                    onClick={() => handleApplyBookmark(b)}
                    className="p-3 bg-slate-50 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/10 rounded-xl cursor-pointer transition-all relative group animate-fade-in"
                  >
                    <div className="flex justify-between items-start gap-1">
                      <span className="text-xs font-mono font-bold text-emerald-700">
                        {b.bookName} {b.chapter} ({b.version})
                      </span>
                      <button 
                        onClick={(e) => handleDeleteBookmark(b.id, e)}
                        className="text-slate-300 hover:text-rose-600 transition-all p-0.5 rounded"
                        title="Excluir marcador"
                      >
                        <X size={13} />
                      </button>
                    </div>

                    {b.label && (
                      <p className="text-xs font-semibold text-slate-800 mt-1">
                        {b.label}
                      </p>
                    )}

                    {b.highlights && b.highlights.length > 0 && (
                      <div className="mt-1 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-mono text-slate-400">
                          {b.highlights.length} {b.highlights.length === 1 ? 'destaque salvo' : 'destaques salvos'}
                        </span>
                      </div>
                    )}

                    <div className="mt-2.5 flex items-center justify-between text-[9px] font-mono text-slate-400 border-t border-slate-100 pt-1.5">
                      <span>Posição Salva</span>
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-1 py-0.5 rounded">IR ➔</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Textual Fidelity & Verification Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <ShieldCheck size={18} className="text-emerald-600" />
              <h3 className="font-display font-bold text-slate-900 text-sm">
                Fidelidade & Autenticidade
              </h3>
            </div>

            {/* Current Chapter Status */}
            <div className="space-y-3">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-bold">
                Capítulo Atual ({activeBook.abbrev} {activeChapter})
              </div>

              {verses[0]?.source === 'api' ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
                    <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                    <span>✓ Texto Bíblico Verificado</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 leading-relaxed font-light">
                    O texto deste capítulo foi comparado e sincronizado com os servidores teológicos via API, assegurando exatidão literal integral.
                  </p>
                  <div className="text-[9px] font-mono text-emerald-500 font-bold">
                    FONTE: BÍBLIA API ONLINE
                  </div>
                </div>
              ) : verses[0]?.source === 'preloaded' ? (
                <div className="p-3 bg-emerald-50/50 border border-emerald-200/60 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
                    <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                    <span>✓ Texto Local Consolidado</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 leading-relaxed font-light">
                    Este é um dos capítulos teológicos de referência pré-carregados no sistema. É 100% autêntico e fidedigno ao texto original.
                  </p>
                  <div className="text-[9px] font-mono text-emerald-500 font-bold">
                    FONTE: BASE INTERNA AUTÊNTICA
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs">
                    <AlertCircle size={16} className="text-amber-600 shrink-0" />
                    <span>Base Auxiliar Offline</span>
                  </div>
                  <p className="text-[11px] text-amber-700 leading-relaxed font-light">
                    Este capítulo foi gerado offline a partir dos metadados temáticos estruturados. Você pode baixar o texto bíblico oficial completo abaixo.
                  </p>
                  
                  <button
                    onClick={forceOnlineSync}
                    disabled={isSyncing}
                    className="w-full flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow"
                  >
                    {isSyncing ? (
                      <>
                        <RefreshCw size={12} className="animate-spin" />
                        <span>Verificando...</span>
                      </>
                    ) : (
                      <>
                        <DownloadCloud size={12} />
                        <span>Sincronizar Capítulo</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* General Sync Status Indicators */}
              {syncStatus === 'success' && (
                <p className="text-[10px] text-emerald-600 font-semibold font-mono text-center animate-pulse">
                  ✓ Texto atualizado e comparado com sucesso!
                </p>
              )}
              {syncStatus === 'error' && (
                <p className="text-[10px] text-rose-500 font-semibold font-mono text-center">
                  ⚠️ Erro ao conectar ao servidor. Verifique a rede.
                </p>
              )}

              {/* Book Synchronization Panel */}
              <div className="border-t border-slate-100 pt-3 mt-3 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Estudo Offline Completo</span>
                  <span className="text-[10px] font-mono text-slate-400">{activeBook.name}</span>
                </div>
                
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Baixe e compare todos os {activeBook.chaptersCount} capítulos de {activeBook.name} para que fiquem gravados permanentemente no banco offline (IndexedDB).
                </p>

                {isSyncingBook ? (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-mono text-emerald-600 font-bold">
                      <span>Baixando capítulos...</span>
                      <span>{bookSyncProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-full transition-all duration-300" 
                        style={{ width: `${bookSyncProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={syncEntireBook}
                    className="w-full flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 text-slate-700 font-bold py-2 px-3 rounded-xl text-xs border border-slate-200 transition-all shadow-sm"
                  >
                    <DownloadCloud size={13} className="text-emerald-600" />
                    <span>Sincronizar Livro Completo</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Floating Verse Action Controls */}
      {selectedVerse !== null && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl py-3 px-4 flex flex-col md:flex-row items-center gap-4 text-white max-w-[95%]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-widest font-bold">
              {activeBook.abbrev} {activeChapter}:{selectedVerse}
            </span>
            <div className="h-4 w-px bg-slate-800 hidden md:block" />
          </div>

          {/* Highlight Palette */}
          <div className="flex items-center gap-2">
            {HIGHLIGHT_COLORS.map(color => (
              <button
                key={color.id}
                onClick={() => handleHighlight(color.value)}
                style={{ backgroundColor: color.value }}
                title={color.name}
                className="w-6 h-6 rounded-full border border-white/20 hover:scale-110 active:scale-95 transition-all"
              />
            ))}
            <button 
              onClick={removeHighlight}
              title="Remover Destaque"
              className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded hover:text-white transition-all font-mono"
            >
              LIMPAR
            </button>
          </div>

          <div className="h-px w-full bg-slate-800 md:hidden" />
          <div className="h-4 w-px bg-slate-800 hidden md:block" />

          {/* Actions toolbar */}
          <div className="flex items-center gap-3">
            <button 
              onClick={toggleFavorite}
              title="Adicionar aos Favoritos"
              className={`p-2 rounded-lg hover:bg-slate-800 transition-all ${
                favorites[selectedVerse] ? 'text-rose-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bookmark size={16} />
            </button>

            <button 
              onClick={openNoteModal}
              title="Escrever Anotação de Estudo"
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all"
            >
              <Edit3 size={16} />
            </button>

            <button 
              onClick={copyToClipboard}
              title="Copiar Versículo"
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all"
            >
              <Copy size={16} />
            </button>

            <button 
              onClick={() => setSelectedVerse(null)}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-all text-xs font-mono font-bold"
            >
              FECHAR
            </button>
          </div>
        </div>
      )}

      {/* Note Creation Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 w-full max-w-lg animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-bold text-slate-900 text-lg">
                Nova Anotação de Estudo
              </h3>
              <button onClick={() => setShowNoteModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-mono text-slate-400 uppercase font-bold block mb-1">Título</label>
                <input 
                  type="text" 
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-400 uppercase font-bold block mb-1">Categoria de Estudo</label>
                <select 
                  value={noteCategory} 
                  onChange={(e) => setNoteCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="Exegese Bíblica">Exegese Bíblica</option>
                  <option value="Hermenêutica Aplicada">Hermenêutica Aplicada</option>
                  <option value="Reflexão Devocional">Reflexão Devocional</option>
                  <option value="Pregação / Homilética">Pregação / Homilética</option>
                  <option value="Teologia Sistemática">Teologia Sistemática</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-mono text-slate-400 uppercase font-bold block mb-1">Anotações (Suporta Markdown)</label>
                <textarea 
                  rows={6}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Escreva seus estudos, exegese textual, notas históricas..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  onClick={() => setShowNoteModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 text-sm font-medium transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={saveNote}
                  className="px-5 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-sm font-semibold shadow-md transition-all"
                >
                  Salvar Estudo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bookmark Save Modal */}
      {showBookmarkModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 w-full max-w-md shadow-2xl animate-scale-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-bold text-slate-900 text-lg flex items-center gap-2">
                <Bookmark size={18} className="text-emerald-600" />
                <span>Salvar Marcador de Leitura</span>
              </h3>
              <button onClick={() => setShowBookmarkModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Isso salvará sua posição exata de leitura em <strong>{activeBook.name} {activeChapter}</strong>, incluindo quaisquer trechos destacados neste capítulo para que você retorne facilmente mais tarde.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-mono text-slate-400 uppercase font-bold block mb-1">Rótulo / Nota Curta (Opcional)</label>
                <input 
                  type="text" 
                  value={bookmarkLabel}
                  onChange={(e) => setBookmarkLabel(e.target.value)}
                  placeholder="Ex: Leitura matinal, Estudo de terça, etc."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  onClick={() => setShowBookmarkModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 text-sm font-medium transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveBookmark}
                  className="px-5 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-sm font-semibold shadow-md transition-all"
                >
                  Confirmar e Salvar (+15 XP)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default BibleReader;
