import React, { useState, useEffect } from 'react';
import { dbService } from '../database/db';
import { Note, Favorite } from '../types';
import { useRewards } from '../contexts/RewardContext';
import { exportToMarkdown } from '../utils';
import { 
  FolderHeart, 
  Trash2, 
  Download, 
  BookOpen, 
  Edit3, 
  Plus, 
  Bookmark, 
  Grid,
  FileText,
  Search,
  CheckCircle,
  X
} from 'lucide-react';

interface SavedItemsProps {
  setActiveTab: (tab: string) => void;
  setSelectedBibleRef: (ref: { bookId: string; chapter: number }) => void;
}

export const SavedItems: React.FC<SavedItemsProps> = ({ setActiveTab, setSelectedBibleRef }) => {
  const { addXp } = useRewards();

  // Load persistence states
  const [notes, setNotes] = useState<Note[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'notes' | 'favorites'>('notes');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Editing Note State
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('');

  useEffect(() => {
    loadData();

    // Real-time synchronization update listener
    const handleDbUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (!customEvent.detail || customEvent.detail.type === 'notes' || customEvent.detail.type === 'favorites') {
        console.log('[SavedItems] Real-time change detected in IndexedDB, reloading...');
        loadData();
      }
    };

    window.addEventListener('db-update', handleDbUpdate);
    return () => {
      window.removeEventListener('db-update', handleDbUpdate);
    };
  }, []);

  const loadData = async () => {
    const listNotes = await dbService.getNotes();
    const listFavs = await dbService.getFavorites();
    setNotes(listNotes);
    setFavorites(listFavs);
  };

  const handleExportNote = (note: Note) => {
    const refStr = note.bookId ? `${note.bookId} ${note.chapter}:${note.verse}` : undefined;
    exportToMarkdown(note.title, note.content, note.category, refStr);
    addXp(10, 'Exportou anotação de estudos');
  };

  const handleDeleteNote = async (id: string) => {
    await dbService.deleteNote(id);
    await loadData();
    addXp(5, 'Anotação excluída');
  };

  const handleDeleteFav = async (id: string) => {
    await dbService.deleteFavorite(id);
    await loadData();
  };

  // Click Favorite -> Open inside Bible reader chapter
  const handleOpenFavoriteInBible = (fav: Favorite) => {
    setSelectedBibleRef({ bookId: fav.bookId, chapter: fav.chapter });
    setActiveTab('bible');
    addXp(5, 'Retomou leitura favorita');
  };

  // Open Edit Note
  const startEditing = (note: Note) => {
    setEditingNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditCategory(note.category);
  };

  const saveEditedNote = async () => {
    if (!editingNote) return;

    const updated: Note = {
      ...editingNote,
      title: editTitle,
      content: editContent,
      category: editCategory,
      updatedAt: new Date().toISOString()
    };

    await dbService.saveNote(updated);
    setEditingNote(null);
    await loadData();
    addXp(10, 'Edição de nota salva');
  };

  // Filtering Notes
  const filteredNotes = notes.filter(n => {
    const q = searchQuery.toLowerCase();
    return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q) || n.category.toLowerCase().includes(q);
  });

  // Filtering Favs
  const filteredFavs = favorites.filter(f => {
    const q = searchQuery.toLowerCase();
    return f.bookName.toLowerCase().includes(q) || f.text.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Title */}
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-display font-bold text-3xl text-slate-900 tracking-tight">
            Meus Estudos e Acervo
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Gerencie todas as suas anotações de homilética, exegese bíblica e versículos favoritos.
          </p>
        </div>

        {/* Local searching */}
        <div className="relative w-full sm:w-64">
          <input 
            type="text" 
            placeholder="Pesquisar nos salvos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-3 pl-9 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
        </div>
      </div>

      {/* Sub tabs triggers */}
      <div className="flex border-b border-slate-100">
        <button
          onClick={() => setActiveSubTab('notes')}
          className={`px-5 py-2.5 font-display font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === 'notes' 
              ? 'border-emerald-500 text-emerald-600' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <FileText size={16} />
          <span>Minhas Notas ({notes.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('favorites')}
          className={`px-5 py-2.5 font-display font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === 'favorites' 
              ? 'border-emerald-500 text-emerald-600' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Bookmark size={16} />
          <span>Favoritos ({favorites.length})</span>
        </button>
      </div>

      {/* List display */}
      {activeSubTab === 'notes' ? (
        // Notes CRUD List
        <div className="space-y-4">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              Nenhuma anotação de estudos criada até o momento.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredNotes.map(note => (
                <div 
                  key={note.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-emerald-200 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full">
                        {note.category}
                      </span>
                      {note.bookId && (
                        <span className="text-[10px] font-mono text-slate-400">
                          Ref: {note.bookId} {note.chapter}:{note.verse}
                        </span>
                      )}
                    </div>

                    <h3 className="font-display font-bold text-slate-900 text-base mb-1.5">{note.title}</h3>
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed whitespace-pre-wrap font-sans mb-4">
                      {note.content}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                    <span className="text-[10px] font-mono text-slate-400">
                      Criado em: {new Date(note.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => startEditing(note)}
                        title="Editar nota"
                        className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-slate-500 hover:text-slate-700"
                      >
                        <Edit3 size={14} />
                      </button>

                      <button 
                        onClick={() => handleExportNote(note)}
                        title="Exportar para Markdown (.md)"
                        className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-slate-500 hover:text-slate-700"
                      >
                        <Download size={14} />
                      </button>

                      <button 
                        onClick={() => handleDeleteNote(note.id)}
                        title="Excluir"
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded text-rose-500 hover:text-rose-700"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // Favorites Bible Verses List
        <div className="space-y-4">
          {filteredFavs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              Nenhum versículo favoritado até o momento.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFavs.map(fav => (
                <div 
                  key={fav.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:border-emerald-100 transition-all flex justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-emerald-600">
                        {fav.bookName} {fav.chapter}:{fav.verse}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Salvo em: {new Date(fav.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 italic font-serif leading-relaxed">
                      "{fav.text}"
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start">
                    <button
                      onClick={() => handleOpenFavoriteInBible(fav)}
                      title="Estudar na Bíblia"
                      className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-all"
                    >
                      <BookOpen size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteFav(fav.id)}
                      title="Remover favorito"
                      className="p-2 bg-rose-50 text-rose-500 hover:bg-rose-100 rounded-lg transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Editing Note Overlay Modal */}
      {editingNote && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 w-full max-w-lg animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-bold text-slate-900 text-lg">
                Editar Anotação de Estudo
              </h3>
              <button onClick={() => setEditingNote(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-mono text-slate-400 uppercase font-bold block mb-1">Título</label>
                <input 
                  type="text" 
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-400 uppercase font-bold block mb-1">Categoria</label>
                <select 
                  value={editCategory} 
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                >
                  <option value="Exegese Bíblica">Exegese Bíblica</option>
                  <option value="Hermenêutica Aplicada">Hermenêutica Aplicada</option>
                  <option value="Reflexão Devocional">Reflexão Devocional</option>
                  <option value="Pregação / Homilética">Pregação / Homilética</option>
                  <option value="Teologia Sistemática">Teologia Sistemática</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-mono text-slate-400 uppercase font-bold block mb-1">Anotações (Markdown)</label>
                <textarea 
                  rows={6}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  onClick={() => setEditingNote(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 text-sm font-medium transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={saveEditedNote}
                  className="px-5 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-sm font-semibold shadow-md transition-all"
                >
                  Salvar Alterações
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default SavedItems;
