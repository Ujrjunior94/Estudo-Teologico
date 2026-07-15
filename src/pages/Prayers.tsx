import React, { useState, useEffect } from 'react';
import { dbService } from '../database/db';
import { useRewards } from '../contexts/RewardContext';
import { PrayerRequest, PrayerLog } from '../types';
import { 
  Heart, 
  Plus, 
  Trash2, 
  CheckCircle, 
  Calendar, 
  User, 
  Folder, 
  Clock, 
  PlusCircle, 
  MessageSquare, 
  AlertCircle, 
  ThumbsUp, 
  X, 
  ChevronRight,
  Sparkles,
  ClipboardList,
  Search,
  Check,
  Award
} from 'lucide-react';

const PRAYER_CATEGORIES = [
  { value: 'Saúde', label: 'Saúde 🩺', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  { value: 'Família', label: 'Família 🏠', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  { value: 'Finanças', label: 'Finanças 💰', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'Espiritual', label: 'Espiritual 🕊️', color: 'bg-violet-50 text-violet-700 border-violet-200' },
  { value: 'Trabalho', label: 'Trabalho 💼', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'Outro', label: 'Outro 🌟', color: 'bg-slate-50 text-slate-700 border-slate-200' }
] as const;

export const Prayers: React.FC = () => {
  const { addXp, unlockBadge } = useRewards();

  // Core state
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [selectedStatus, setSelectedStatus] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals / Input Forms
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newRequest, setNewRequest] = useState('');
  const [newRequesterName, setNewRequesterName] = useState('');
  const [newCategory, setNewCategory] = useState<'Saúde' | 'Família' | 'Finanças' | 'Espiritual' | 'Trabalho' | 'Outro'>('Espiritual');

  // Log Modal Form
  const [activeRequestForLog, setActiveRequestForLog] = useState<PrayerRequest | null>(null);
  const [newLogNote, setNewLogNote] = useState('');

  // Answer Modal Form
  const [activeRequestForAnswer, setActiveRequestForAnswer] = useState<PrayerRequest | null>(null);
  const [answerDescription, setAnswerDescription] = useState('');

  // Selected Prayer for detail/logs view
  const [selectedPrayerId, setSelectedPrayerId] = useState<string | null>(null);

  // Load prayers on mount
  useEffect(() => {
    async function loadPrayers() {
      try {
        const stored = await dbService.getPrayers();
        setPrayers(stored.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } catch (err) {
        console.error('Error loading prayers:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPrayers();
  }, []);

  // Handle Create Request
  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newRequest.trim()) return;

    const requestItem: PrayerRequest = {
      id: `prayer_${Date.now()}`,
      title: newTitle.trim(),
      request: newRequest.trim(),
      requesterName: newRequesterName.trim() || undefined,
      category: newCategory,
      status: 'Pendente',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      logs: []
    };

    try {
      await dbService.savePrayer(requestItem);
      setPrayers(prev => [requestItem, ...prev]);
      setShowAddModal(false);
      
      // Reset fields
      setNewTitle('');
      setNewRequest('');
      setNewRequesterName('');
      setNewCategory('Espiritual');

      // Rewards
      addXp(15, 'Novo pedido de oração');
      unlockBadge('primeiros_passos');
    } catch (err) {
      console.error('Error saving prayer request:', err);
    }
  };

  // Handle Delete Request
  const handleDeleteRequest = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Deseja excluir permanentemente este pedido de oração?')) return;
    try {
      await dbService.deletePrayer(id);
      setPrayers(prev => prev.filter(p => p.id !== id));
      if (selectedPrayerId === id) setSelectedPrayerId(null);
    } catch (err) {
      console.error('Error deleting prayer request:', err);
    }
  };

  // Handle Add Prayer Log (Register Update / Session)
  const handleAddLog = async () => {
    if (!activeRequestForLog || !newLogNote.trim()) return;

    const logItem: PrayerLog = {
      id: `log_${Date.now()}`,
      note: newLogNote.trim(),
      createdAt: new Date().toISOString()
    };

    const updatedPrayer: PrayerRequest = {
      ...activeRequestForLog,
      logs: [logItem, ...activeRequestForLog.logs],
      updatedAt: new Date().toISOString()
    };

    try {
      await dbService.savePrayer(updatedPrayer);
      setPrayers(prev => prev.map(p => p.id === updatedPrayer.id ? updatedPrayer : p));
      setActiveRequestForLog(null);
      setNewLogNote('');

      // Rewards
      addXp(10, 'Registrou momento de oração');
    } catch (err) {
      console.error('Error adding prayer log:', err);
    }
  };

  // Handle Mark as Answered / Praise
  const handleMarkAsAnswered = async () => {
    if (!activeRequestForAnswer || !answerDescription.trim()) return;

    const updatedPrayer: PrayerRequest = {
      ...activeRequestForAnswer,
      status: 'Respondido',
      answer: answerDescription.trim(),
      updatedAt: new Date().toISOString(),
      logs: [
        {
          id: `log_ans_${Date.now()}`,
          note: `🎉 Oração Respondida: ${answerDescription.trim()}`,
          createdAt: new Date().toISOString()
        },
        ...activeRequestForAnswer.logs
      ]
    };

    try {
      await dbService.savePrayer(updatedPrayer);
      setPrayers(prev => prev.map(p => p.id === updatedPrayer.id ? updatedPrayer : p));
      setActiveRequestForAnswer(null);
      setAnswerDescription('');

      // Rewards
      addXp(30, 'Oração Respondida! Testemunho de Fé');
      unlockBadge('guerreiro_oracao');
    } catch (err) {
      console.error('Error marking prayer as answered:', err);
    }
  };

  // Handle Conversion to Praise / Thanksgiving
  const handleTogglePraise = async (prayer: PrayerRequest, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = prayer.status === 'Agradecimento' ? 'Pendente' : 'Agradecimento';
    const updated: PrayerRequest = {
      ...prayer,
      status: newStatus,
      updatedAt: new Date().toISOString()
    };
    try {
      await dbService.savePrayer(updated);
      setPrayers(prev => prev.map(p => p.id === updated.id ? updated : p));
      if (newStatus === 'Agradecimento') {
        addXp(20, 'Pedido de oração transformado em Agradecimento');
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  // Filtered List
  const filteredPrayers = prayers.filter(p => {
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
    const matchesStatus = selectedStatus === 'Todos' || p.status === selectedStatus;
    const matchesSearch = 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.request.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.requesterName && p.requesterName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-24 font-sans text-slate-800">
      
      {/* Top Banner and Heading */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-6 md:p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-12 translate-y-6">
          <Heart size={280} />
        </div>
        
        <div className="max-w-2xl relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-100 text-xs font-mono font-bold border border-emerald-400/20 uppercase tracking-widest">
            <Sparkles size={12} className="text-emerald-300 animate-pulse" />
            Diário Espiritual
          </div>
          <h1 className="text-3xl font-display font-black tracking-tight md:text-4xl text-white">
            Pedidos & Registros de Oração
          </h1>
          <p className="text-emerald-100 text-sm leading-relaxed font-light">
            Mantenha um registro organizado das suas intercessões, batalhas espirituais e testemunhos. Registre cada vez que orar por um pedido para acompanhar a sua fidelidade e celebrar as respostas de Deus.
          </p>
        </div>
      </div>

      {/* Main Grid: Filters on Top, Layout split below */}
      <div className="flex flex-col gap-6">
        
        {/* Filter Toolbar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          
          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <input 
              type="text" 
              placeholder="Pesquisar pedidos, pessoas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 text-slate-800 border border-slate-200 px-3 py-2 pl-9 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
            />
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filters Selection */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Status Filter */}
            <select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="Todos">Todos os Status</option>
              <option value="Pendente">🛐 Pendentes</option>
              <option value="Respondido">🎉 Respondidos</option>
              <option value="Agradecimento">❤️ Agradecimentos</option>
            </select>

            {/* Category Filter */}
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="Todos">Todas Categorias</option>
              <option value="Saúde">🩺 Saúde</option>
              <option value="Família">🏠 Família</option>
              <option value="Finanças">💰 Finanças</option>
              <option value="Espiritual">🕊️ Espiritual</option>
              <option value="Trabalho">💼 Trabalho</option>
              <option value="Outro">🌟 Outro</option>
            </select>

            {/* Create Button */}
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all shadow-sm ml-auto md:ml-0"
            >
              <Plus size={14} />
              <span>Novo Pedido</span>
            </button>
          </div>
        </div>

        {/* Layout Split: Left (Requests List), Right (Interactive Details & Log Timeline) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Prayers List */}
          <div className="lg:col-span-7 space-y-4">
            
            {loading ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-sm shadow-sm animate-pulse">
                Carregando seus registros de oração...
              </div>
            ) : filteredPrayers.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 shadow-sm space-y-3">
                <ClipboardList className="mx-auto text-slate-300" size={48} />
                <p className="text-sm">Nenhum pedido de oração encontrado com os filtros selecionados.</p>
                <button 
                  onClick={() => { setSelectedCategory('Todos'); setSelectedStatus('Todos'); setSearchQuery(''); }}
                  className="text-xs text-emerald-600 hover:underline font-semibold"
                >
                  Limpar Filtros
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPrayers.map((prayer) => {
                  const catConfig = PRAYER_CATEGORIES.find(c => c.value === prayer.category);
                  const isSelected = selectedPrayerId === prayer.id;
                  
                  return (
                    <div 
                      key={prayer.id}
                      onClick={() => setSelectedPrayerId(isSelected ? null : prayer.id)}
                      className={`bg-white rounded-2xl border transition-all cursor-pointer shadow-sm relative overflow-hidden ${
                        isSelected 
                          ? 'border-emerald-500 ring-2 ring-emerald-500/10' 
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Left border indicator based on category/status */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                        prayer.status === 'Respondido' 
                          ? 'bg-emerald-500' 
                          : prayer.status === 'Agradecimento' 
                            ? 'bg-amber-500' 
                            : 'bg-indigo-500'
                      }`} />

                      <div className="p-5 pl-7">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            {/* Category Badge */}
                            <span className={`px-2 py-0.5 rounded-full border text-[10px] font-medium ${
                              catConfig?.color || 'bg-slate-50 text-slate-600 border-slate-200'
                            }`}>
                              {catConfig?.label || prayer.category}
                            </span>

                            {/* Status Badge */}
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              prayer.status === 'Respondido' 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : prayer.status === 'Agradecimento' 
                                  ? 'bg-amber-100 text-amber-800' 
                                  : 'bg-indigo-100 text-indigo-800'
                            }`}>
                              {prayer.status === 'Respondido' ? '✓ Respondido' : prayer.status === 'Agradecimento' ? '❤️ Agradecimento' : '🛐 Em Oração'}
                            </span>
                          </div>

                          <span className="text-[10px] font-mono text-slate-400">
                            {new Date(prayer.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>

                        <h3 className="font-display font-bold text-slate-900 text-sm md:text-base mb-2">
                          {prayer.title}
                        </h3>

                        <p className="text-slate-600 text-xs md:text-sm leading-relaxed line-clamp-3 mb-4">
                          {prayer.request}
                        </p>

                        {prayer.requesterName && (
                          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono mb-4">
                            <User size={12} />
                            <span>Por: {prayer.requesterName}</span>
                          </div>
                        )}

                        {prayer.answer && (
                          <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 mb-4 text-xs text-emerald-800 space-y-1">
                            <span className="font-bold block uppercase tracking-wider text-[10px] text-emerald-700">Resposta / Testemunho:</span>
                            <p className="italic">"{prayer.answer}"</p>
                          </div>
                        )}

                        {/* Interactive footer actions */}
                        <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveRequestForLog(prayer);
                              }}
                              className="flex items-center gap-1 text-slate-500 hover:text-emerald-600 font-medium transition-all"
                              title="Registrar que você orou por esta causa hoje"
                            >
                              <PlusCircle size={14} />
                              <span>Interceder</span>
                            </button>

                            {prayer.status !== 'Respondido' && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveRequestForAnswer(prayer);
                                }}
                                className="flex items-center gap-1 text-slate-500 hover:text-emerald-600 font-medium transition-all"
                              >
                                <CheckCircle size={14} />
                                <span>Marcar Resposta</span>
                              </button>
                            )}

                            <button 
                              onClick={(e) => handleTogglePraise(prayer, e)}
                              className={`flex items-center gap-1 font-medium transition-all ${
                                prayer.status === 'Agradecimento' ? 'text-amber-600' : 'text-slate-500 hover:text-amber-600'
                              }`}
                              title="Transformar este pedido em um agradecimento ou vice-versa"
                            >
                              <ThumbsUp size={14} />
                              <span>Agradecer</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-3">
                            {prayer.logs.length > 0 && (
                              <span className="text-[10px] font-mono text-slate-400">
                                {prayer.logs.length} {prayer.logs.length === 1 ? 'registro' : 'registros'}
                              </span>
                            )}
                            
                            <button 
                              onClick={(e) => handleDeleteRequest(prayer.id, e)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition-all"
                              title="Excluir pedido"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Timelines and Logs detailed view */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 sticky top-6">
            {selectedPrayerId ? (
              (() => {
                const selectedPrayer = prayers.find(p => p.id === selectedPrayerId);
                if (!selectedPrayer) return <p className="text-xs text-slate-400">Pedido não encontrado.</p>;
                const catConfig = PRAYER_CATEGORIES.find(c => c.value === selectedPrayer.category);
                
                return (
                  <div className="space-y-6">
                    <div className="border-b border-slate-100 pb-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-medium ${
                          catConfig?.color || 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                          {catConfig?.label || selectedPrayer.category}
                        </span>
                        <button 
                          onClick={() => setSelectedPrayerId(null)}
                          className="text-slate-400 hover:text-slate-600 text-xs font-semibold"
                        >
                          Fechar Detalhes
                        </button>
                      </div>
                      
                      <h2 className="font-display font-bold text-slate-900 text-base">
                        {selectedPrayer.title}
                      </h2>
                      
                      <p className="text-slate-600 text-xs md:text-sm leading-relaxed font-light">
                        {selectedPrayer.request}
                      </p>
                      
                      {selectedPrayer.requesterName && (
                        <p className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                          <User size={11} /> Autor: {selectedPrayer.requesterName}
                        </p>
                      )}
                    </div>

                    {/* Timeline of Update Logs */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-display font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                          <Clock size={12} className="text-emerald-500" />
                          Linha do Tempo de Intercessão
                        </h3>
                        
                        <button 
                          onClick={() => setActiveRequestForLog(selectedPrayer)}
                          className="text-[11px] text-emerald-600 hover:underline font-bold flex items-center gap-1"
                        >
                          <Plus size={12} /> Adicionar Registro
                        </button>
                      </div>

                      {selectedPrayer.logs.length === 0 ? (
                        <div className="border border-dashed border-slate-200 rounded-xl p-6 text-center text-slate-400 text-xs">
                          Você ainda não registrou momentos de orações ativas para este pedido. Clique em "Adicionar Registro" para começar!
                        </div>
                      ) : (
                        <div className="relative border-l border-slate-200 pl-4 ml-2 py-1 space-y-4">
                          {selectedPrayer.logs.map((log) => (
                            <div key={log.id} className="relative space-y-1">
                              {/* Dot node */}
                              <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-white" />
                              
                              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                                <span>{new Date(log.createdAt).toLocaleDateString('pt-BR')} às {new Date(log.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                {log.note}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="text-center py-12 text-slate-400 space-y-3">
                <ClipboardList size={32} className="mx-auto text-slate-300" />
                <p className="text-xs">
                  Selecione um pedido de oração à esquerda para visualizar seu histórico completo de intercessão e registros de oração.
                </p>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* MODAL: ADD PRAYER REQUEST */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 w-full max-w-lg animate-fade-in font-sans">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-bold text-slate-900 text-lg flex items-center gap-2">
                <Heart size={18} className="text-emerald-500 fill-emerald-500" />
                Novo Pedido de Oração
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">Título do Pedido</label>
                <input 
                  type="text" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Pela cirurgia do meu pai / Restauração familiar"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">Categoria</label>
                  <select 
                    value={newCategory} 
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700 font-medium"
                  >
                    <option value="Espiritual">🕊️ Espiritual</option>
                    <option value="Saúde">🩺 Saúde</option>
                    <option value="Família">🏠 Família</option>
                    <option value="Finanças">💰 Finanças</option>
                    <option value="Trabalho">💼 Trabalho</option>
                    <option value="Outro">🌟 Outro</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">Nome de quem pede (Opcional)</label>
                  <input 
                    type="text" 
                    value={newRequesterName}
                    onChange={(e) => setNewRequesterName(e.target.value)}
                    placeholder="Seu nome ou outra pessoa"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">Detalhes do Pedido</label>
                <textarea 
                  rows={4}
                  value={newRequest}
                  onChange={(e) => setNewRequest(e.target.value)}
                  placeholder="Descreva aqui o motivo das suas orações, versículos de apoio ou situações específicas que precisam de intercessão..."
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 text-sm font-medium transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-sm font-semibold shadow-md transition-all flex items-center gap-1"
                >
                  <Check size={16} />
                  Salvar Pedido
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD PRAYER LOG */}
      {activeRequestForLog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 w-full max-w-md animate-fade-in font-sans">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-bold text-slate-900 text-base flex items-center gap-1.5">
                <MessageSquare size={16} className="text-emerald-500" />
                Registrar Atualização de Oração
              </h3>
              <button onClick={() => setActiveRequestForLog(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <p className="text-slate-500 text-xs mb-4">
              Adicione uma anotação sobre seu momento de intercessão pelo pedido: <strong className="text-slate-700">"{activeRequestForLog.title}"</strong>.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">Registro / Progresso</label>
                <textarea 
                  rows={4}
                  value={newLogNote}
                  onChange={(e) => setNewLogNote(e.target.value)}
                  placeholder="Ex: Orei hoje por isso em comunhão / Senti uma renovação na esperança / Tivemos uma conversa positiva sobre a questão..."
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setActiveRequestForLog(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs font-semibold transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleAddLog}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold shadow-md transition-all"
                >
                  Salvar Registro
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MARK AS ANSWERED */}
      {activeRequestForAnswer && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 w-full max-w-md animate-fade-in font-sans">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-bold text-slate-900 text-base flex items-center gap-1.5 text-emerald-600">
                <Award size={18} className="text-emerald-500 animate-bounce" />
                Glória a Deus! Oração Respondida
              </h3>
              <button onClick={() => setActiveRequestForAnswer(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <p className="text-slate-500 text-xs mb-4">
              Que benção extraordinária! Escreva um testemunho rápido de como Deus respondeu a esse clamor para que fique eternizado em seu histórico:
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">Como Deus respondeu?</label>
                <textarea 
                  rows={4}
                  value={answerDescription}
                  onChange={(e) => setAnswerDescription(e.target.value)}
                  placeholder="Ex: O exame médico deu negativo para a doença! / Conseguimos o emprego desejado / Houve reconciliação total..."
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setActiveRequestForAnswer(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs font-semibold transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleMarkAsAnswered}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1"
                >
                  <ThumbsUp size={12} />
                  Registrar Testemunho
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default Prayers;
