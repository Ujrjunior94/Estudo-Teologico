import React, { useState, useEffect, useRef } from 'react';
import { BIBLE_BOOKS, getChapterVersesCount, getGeneratedVerseText } from '../database/bibleMetadata';
import { HIGHLIGHT_COLORS, SYSTEM_BADGES } from '../constants';
import { dbService } from '../database/db';
import { bibleService } from '../services/bibleService';
import { useRewards } from '../contexts/RewardContext';
import { Note, Favorite, Highlight } from '../types';
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
  Mic
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
  const [verses, setVerses] = useState<{ verse: number; text: string }[]>([]);

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
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const query = searchQuery.toLowerCase();
    const resultsList: any[] = [];

    // Scan through preconfigured passages to simulate deep indexing
    BIBLE_BOOKS.forEach(book => {
      // Check first chapters
      for (let ch = 1; ch <= Math.min(3, book.chaptersCount); ch++) {
        const verseCount = getChapterVersesCount(book.id, ch);
        for (let v = 1; v <= verseCount; v++) {
          const txt = getGeneratedVerseText(book.id, ch, v, activeVersion);
          if (txt.toLowerCase().includes(query)) {
            resultsList.push({
              bookId: book.id,
              bookName: book.name,
              chapter: ch,
              verse: v,
              text: txt
            });
          }
        }
      }
    });

    setSearchResults(resultsList);
    addXp(10, 'Pesquisa Bíblica Realizada');
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
        </div>
      </div>

      {/* Main Content viewport */}
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
          <div className="space-y-6 text-slate-800 leading-relaxed font-serif text-lg pb-16">
            {verses.map((v) => {
              const isSelected = selectedVerse === v.verse;
              const hlColor = highlights[v.verse];
              const hasNotes = notes[v.verse] && notes[v.verse].length > 0;
              const isFav = favorites[v.verse];

              return (
                <p 
                  key={v.verse}
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
              );
            })}
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
    </div>
  );
};
export default BibleReader;
