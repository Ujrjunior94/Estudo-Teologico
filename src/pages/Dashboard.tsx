import React, { useEffect, useState } from 'react';
import { useRewards } from '../contexts/RewardContext';
import { dbService } from '../database/db';
import { SYSTEM_BADGES } from '../constants';
import { 
  Flame, 
  Award, 
  TrendingUp, 
  BookOpen, 
  Edit3, 
  Search, 
  Calendar,
  Sparkles,
  ArrowUpRight,
  Heart,
  Trash2,
  RefreshCw,
  ShieldAlert,
  Copy,
  Check,
  Share2,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertTriangle,
  Globe
} from 'lucide-react';
import { formatDate } from '../utils';
import { getDailyVerse, DAILY_VERSES, DailyVerse } from '../database/dailyVerses';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
  setSelectedBibleRef: (ref: { bookId: string; chapter: number }) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setActiveTab, setSelectedBibleRef }) => {
  const { state, addXp, unlockBadge, resetRewards, factoryReset } = useRewards();
  const [stats, setStats] = useState({
    notesCount: 0,
    favoritesCount: 0,
    highlightsCount: 0,
    plansCount: 0,
    completedChapters: 0
  });

  // Dynamic Daily Verse states
  const [verseOfDay, setVerseOfDay] = useState<DailyVerse>(getDailyVerse());
  const [activeVersion, setActiveVersion] = useState<'ARA' | 'NVI' | 'KJV'>('ARA');
  const [showReflection, setShowReflection] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [copied, setCopied] = useState(false);
  const [aiCommentary, setAiCommentary] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Check if verse of the day is already favorited
  useEffect(() => {
    async function checkFavorite() {
      try {
        const favs = await dbService.getFavorites();
        const favorited = favs.some(f => 
          f.bookId === verseOfDay.bookId && 
          f.chapter === verseOfDay.chapter && 
          f.verse === verseOfDay.verse
        );
        setIsFavorited(favorited);
      } catch (err) {
        console.error('Erro ao buscar favoritos:', err);
      }
    }
    checkFavorite();
  }, [verseOfDay]);

  const loadStats = async () => {
    const notes = await dbService.getNotes();
    const favs = await dbService.getFavorites();
    const hls = await dbService.getHighlights();
    const plans = await dbService.getPlans();
    
    let completedChaptersCount = 0;
    plans.forEach(p => {
      completedChaptersCount += p.completedDays.length;
    });

    setStats({
      notesCount: notes.length,
      favoritesCount: favs.length,
      highlightsCount: hls.length,
      plansCount: plans.length,
      completedChapters: completedChaptersCount
    });

    // Unlock initial badge
    if (favs.length > 0 || notes.length > 0 || hls.length > 0) {
      unlockBadge('primeiros_passos');
    }
    if (state.dailyStreak >= 3) {
      unlockBadge('estudioso_fiel');
    }
  };

  useEffect(() => {
    loadStats();
  }, [state.dailyStreak, unlockBadge]);

  useEffect(() => {
    const handleDbUpdate = () => {
      console.log('[Dashboard] Real-time change detected in IndexedDB, updating stats...');
      loadStats();
    };

    window.addEventListener('db-update', handleDbUpdate);
    return () => {
      window.removeEventListener('db-update', handleDbUpdate);
    };
  }, []);

  const toggleFavorite = async () => {
    try {
      const favs = await dbService.getFavorites();
      const existingFav = favs.find(f => 
        f.bookId === verseOfDay.bookId && 
        f.chapter === verseOfDay.chapter && 
        f.verse === verseOfDay.verse
      );

      if (existingFav) {
        await dbService.deleteFavorite(existingFav.id);
        setIsFavorited(false);
        setStats(prev => ({ ...prev, favoritesCount: Math.max(0, prev.favoritesCount - 1) }));
      } else {
        const text = activeVersion === 'ARA' 
          ? verseOfDay.text 
          : activeVersion === 'NVI' 
            ? (verseOfDay.textNVI || verseOfDay.text) 
            : (verseOfDay.textKJV || verseOfDay.text);
            
        await dbService.saveFavorite({
          id: `${verseOfDay.bookId}-${verseOfDay.chapter}-${verseOfDay.verse}`,
          bookId: verseOfDay.bookId,
          bookName: verseOfDay.bookName,
          chapter: verseOfDay.chapter,
          verse: verseOfDay.verse,
          text: text,
          createdAt: new Date().toISOString(),
          category: 'Versículo do Dia'
        });
        setIsFavorited(true);
        setStats(prev => ({ ...prev, favoritesCount: prev.favoritesCount + 1 }));
        addXp(5, 'Favoritou Versículo do Dia');
        unlockBadge('primeiros_passos');
      }
    } catch (err) {
      console.error('Erro ao alternar favorito:', err);
    }
  };

  const handleCopy = () => {
    const text = activeVersion === 'ARA' 
      ? verseOfDay.text 
      : activeVersion === 'NVI' 
        ? (verseOfDay.textNVI || verseOfDay.text) 
        : (verseOfDay.textKJV || verseOfDay.text);
        
    const formatted = `"${text}" — ${verseOfDay.ref} (${activeVersion}) | Estudo Teológico PRO`;
    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    addXp(3, 'Copiou Palavra do Dia');
  };

  const generateAiReflection = async () => {
    if (loadingAi) return;
    setLoadingAi(true);
    setAiError(null);
    setAiCommentary(null);

    const text = activeVersion === 'ARA' 
      ? verseOfDay.text 
      : activeVersion === 'NVI' 
        ? (verseOfDay.textNVI || verseOfDay.text) 
        : (verseOfDay.textKJV || verseOfDay.text);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          option: 'exegese',
          messages: [
            {
              role: 'user',
              content: `Por favor, faça uma exegese teológica acadêmica e reflexão devocional aprofundada para o seguinte versículo:
Ref: ${verseOfDay.ref} (${activeVersion})
Texto: "${text}"

O tema central do dia é: ${verseOfDay.theme}.

Por favor, estruture a resposta de forma limpa usando Markdown, dividindo em:
- **Análise Exegética (Línguas Originais & Gramática)**
- **Contexto Teológico & Histórico**
- **Aplicação Prática e Devocional**

Mantenha a resposta com profundidade de nível de seminário, mas fácil de ler.`
            }
          ]
        })
      });

      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error(`Erro inesperado no servidor (Status ${response.status}).`);
      }

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Erro ao gerar reflexão.');
      }

      if (data && data.text) {
        setAiCommentary(data.text);
        addXp(15, 'Exegese de IA do Versículo do Dia');
      } else {
        throw new Error('Nenhum texto retornado do assistente.');
      }
    } catch (err: any) {
      console.error('Erro na reflexão de IA:', err);
      setAiError(err.message || 'Ocorreu um erro de conexão com o Gemini.');
    } finally {
      setLoadingAi(false);
    }
  };

  const readDailyVerse = () => {
    setSelectedBibleRef({ bookId: verseOfDay.bookId, chapter: verseOfDay.chapter });
    setActiveTab('bible');
    addXp(10, 'Leitura de Versículo do Dia');
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h2 className="font-display font-bold text-3xl text-slate-900 tracking-tight">
            Estudo Teológico PRO
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Seu centro teológico de exegese, hermenêutica e acompanhamento offline-first.
          </p>
        </div>
        <div className="flex items-center gap-3 font-mono text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 self-start md:self-auto">
          <Calendar size={14} className="text-slate-400" />
          <span>{formatDate(new Date().toISOString())}</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Verse of the day & Stats */}
        <div className="lg:col-span-2 space-y-6">
          {/* Verse of the Day Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-2xl p-6 shadow-xl border border-emerald-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl" />
            
            {/* Header / Badges */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 relative z-10">
              <div className="flex flex-wrap items-center gap-2">
                <span className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-mono font-semibold uppercase tracking-wider">
                  Versículo do Dia
                </span>
                <span className="p-1.5 bg-slate-800/80 text-amber-300 rounded-lg text-[10px] font-sans font-semibold border border-amber-500/20">
                  Tema: {verseOfDay.theme}
                </span>
                <Sparkles size={14} className="text-amber-400 animate-pulse hidden sm:inline" />
              </div>

              {/* Translation Selector */}
              <div className="flex bg-slate-950/60 p-1 rounded-lg border border-white/10 self-start sm:self-auto">
                {(['ARA', 'NVI', 'KJV'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setActiveVersion(v)}
                    className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                      activeVersion === v
                        ? 'bg-emerald-500 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Verse text */}
            <blockquote className="text-xl font-display italic font-light text-slate-100 leading-relaxed mb-6 relative z-10">
              "{activeVersion === 'ARA' 
                ? verseOfDay.text 
                : activeVersion === 'NVI' 
                  ? (verseOfDay.textNVI || verseOfDay.text) 
                  : (verseOfDay.textKJV || verseOfDay.text)}"
            </blockquote>

            {/* Citation and Action buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-white/10 pt-4 relative z-10">
              <div>
                <cite className="font-display font-semibold text-slate-200 not-italic">
                  {verseOfDay.ref}
                </cite>
                <span className="text-[10px] text-slate-400 font-mono ml-2">
                  ({activeVersion})
                </span>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                {/* Copy Button */}
                <button
                  onClick={handleCopy}
                  title="Copiar versículo com referência"
                  className="p-2 bg-white/5 hover:bg-white/15 active:scale-95 rounded-lg border border-white/10 transition-all cursor-pointer"
                >
                  {copied ? (
                    <Check size={14} className="text-emerald-400" />
                  ) : (
                    <Copy size={14} className="text-slate-300" />
                  )}
                </button>

                {/* Favorite Button */}
                <button
                  onClick={toggleFavorite}
                  title={isFavorited ? "Remover dos favoritos" : "Salvar nos favoritos"}
                  className="p-2 bg-white/5 hover:bg-white/15 active:scale-95 rounded-lg border border-white/10 transition-all cursor-pointer"
                >
                  <Heart 
                    size={14} 
                    className={isFavorited ? "text-rose-500 fill-rose-500" : "text-slate-300"} 
                  />
                </button>

                {/* Offline Reflection Button */}
                <button
                  onClick={() => setShowReflection(!showReflection)}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all border font-medium cursor-pointer ${
                    showReflection 
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
                      : 'bg-white/5 hover:bg-white/15 text-slate-300 border-white/10'
                  }`}
                >
                  <span>Reflexão</span>
                  {showReflection ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>

                {/* AI Commentary Button */}
                <button
                  onClick={() => {
                    if (aiCommentary) {
                      setAiCommentary(null);
                    } else {
                      generateAiReflection();
                    }
                  }}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all border font-medium cursor-pointer ${
                    aiCommentary || loadingAi
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-white/5 hover:bg-white/15 text-slate-300 border-white/10'
                  }`}
                >
                  <Sparkles size={12} className={loadingAi ? "animate-spin text-amber-400" : "text-amber-400"} />
                  <span>Análise IA</span>
                  {aiCommentary ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>

                {/* Study Chapter Button */}
                <button 
                  onClick={readDailyVerse}
                  className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-lg transition-all border border-emerald-400/20 font-medium active:scale-95 shadow-lg shadow-emerald-950/50 cursor-pointer"
                >
                  <span>Estudar Capítulo</span>
                  <ArrowUpRight size={12} />
                </button>
              </div>
            </div>

            {/* Expandable Curated Reflection */}
            {showReflection && (
              <div className="mt-5 border-t border-white/10 pt-4 text-slate-300 relative z-10 space-y-4">
                <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-3">
                  <h4 className="font-display font-bold text-amber-300 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen size={12} />
                    <span>Meditação Teológica</span>
                  </h4>
                  <p className="text-xs text-slate-200 leading-relaxed font-light">
                    {verseOfDay.reflection}
                  </p>
                </div>

                <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10 space-y-2">
                  <h4 className="font-display font-bold text-emerald-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Award size={12} />
                    <span>Desafio de Hermenêutica Aplicada</span>
                  </h4>
                  <p className="text-xs text-slate-200 leading-relaxed font-light italic">
                    "{verseOfDay.challenge}"
                  </p>
                </div>
              </div>
            )}

            {/* Expandable AI Commentary (Gemini) */}
            {(loadingAi || aiCommentary || aiError) && (
              <div className="mt-5 border-t border-white/10 pt-4 text-slate-300 relative z-10 space-y-4">
                <div className="p-5 bg-slate-950/80 rounded-xl border border-emerald-500/20 space-y-4 shadow-inner">
                  <div className="flex items-center justify-between">
                    <h4 className="font-display font-bold text-emerald-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles size={14} className="text-amber-400 animate-pulse" />
                      <span>Exegese de IA (Gemini 3.5 Flash)</span>
                    </h4>
                    
                    {aiCommentary && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(aiCommentary);
                          alert('Comentário de exegese copiado com sucesso!');
                        }}
                        className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors bg-white/5 px-2 py-1 rounded cursor-pointer"
                      >
                        <Copy size={10} />
                        Copiar Análise
                      </button>
                    )}
                  </div>

                  {loadingAi && (
                    <div className="flex flex-col items-center justify-center py-8 space-y-3">
                      <Loader2 size={24} className="text-emerald-400 animate-spin" />
                      <span className="text-xs text-slate-400 font-mono text-center">
                        Conectando ao Teólogo IA, decifrando línguas originais e contexto histórico...
                      </span>
                    </div>
                  )}

                  {aiError && (
                    <div className="flex items-start gap-2.5 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300">
                      <AlertTriangle size={16} className="shrink-0 mt-0.5 text-rose-400" />
                      <div>
                        <p className="text-xs font-semibold">Falha na consulta teológica</p>
                        <p className="text-[11px] text-rose-400 mt-1">{aiError}</p>
                      </div>
                    </div>
                  )}

                  {aiCommentary && (
                    <div className="text-xs text-slate-200 leading-relaxed font-light space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {aiCommentary.split('\n\n').map((para, idx) => {
                        // Very basic renderer for markdown bold/headings from Gemini response
                        if (para.startsWith('###') || para.startsWith('##') || para.startsWith('#')) {
                          return (
                            <h5 key={idx} className="font-display font-bold text-sm mt-3 border-b border-white/5 pb-1 text-emerald-300">
                              {para.replace(/[#*]/g, '').trim()}
                            </h5>
                          );
                        }
                        if (para.startsWith('-') || para.startsWith('*')) {
                          return (
                            <ul key={idx} className="list-disc list-inside pl-2 space-y-1 text-slate-300">
                              {para.split('\n').map((item, itemIdx) => (
                                <li key={itemIdx} className="font-sans">
                                  {item.replace(/^[-*\s]+/, '').replace(/\*\*([^*]+)\*\*/g, '$1').trim()}
                                </li>
                              ))}
                            </ul>
                          );
                        }
                        
                        // Parse bold text matches **bold**
                        const parts = para.split(/\*\*([^*]+)\*\*/g);
                        if (parts.length > 1) {
                          return (
                            <p key={idx} className="font-sans">
                              {parts.map((part, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="font-semibold text-emerald-200">{part}</strong> : part)}
                            </p>
                          );
                        }

                        return <p key={idx} className="font-sans">{para}</p>;
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Selector for other daily verses (Thematic Library) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="space-y-0.5">
              <h4 className="text-xs font-display font-bold text-slate-800 flex items-center gap-1.5">
                <Globe size={13} className="text-emerald-600" />
                <span>Biblioteca Temática Diária (31 Dias)</span>
              </h4>
              <p className="text-[10px] text-slate-500">
                Escolha qualquer uma das 31 lições teológicas principais do mês para estudar.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <select
                value={verseOfDay.day}
                onChange={(e) => {
                  const dayNum = parseInt(e.target.value, 10);
                  const selected = DAILY_VERSES.find(v => v.day === dayNum);
                  if (selected) {
                    setVerseOfDay(selected);
                    setAiCommentary(null); // Reset AI commentary
                    setShowReflection(false); // Reset reflection
                  }
                }}
                className="bg-white border border-slate-200 text-xs px-2.5 py-1.5 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm cursor-pointer"
              >
                {DAILY_VERSES.map((v) => (
                  <option key={v.day} value={v.day}>
                    Dia {v.day}: {v.theme} ({v.ref})
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  const todayDay = new Date().getDate();
                  const selected = DAILY_VERSES.find(v => v.day === todayDay) || DAILY_VERSES[0];
                  setVerseOfDay(selected);
                  setAiCommentary(null);
                  setShowReflection(false);
                }}
                title="Voltar para o dia de hoje"
                className="px-2.5 py-1.5 text-[10px] bg-white hover:bg-slate-100 text-slate-700 rounded-lg font-bold font-mono transition-colors active:scale-95 border border-slate-200 shadow-sm cursor-pointer"
              >
                HOJE
              </button>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-28">
              <span className="text-slate-400 text-xs font-mono uppercase">Minhas Notas</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-display font-bold text-slate-900">{stats.notesCount}</span>
                <span className="text-[10px] text-slate-400 font-mono">criadas</span>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-28">
              <span className="text-slate-400 text-xs font-mono uppercase">Favoritos</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-display font-bold text-slate-900">{stats.favoritesCount}</span>
                <span className="text-[10px] text-slate-400 font-mono">salvos</span>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-28">
              <span className="text-slate-400 text-xs font-mono uppercase">Destaques</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-display font-bold text-slate-900">{stats.highlightsCount}</span>
                <span className="text-[10px] text-slate-400 font-mono">versos</span>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-28">
              <span className="text-slate-400 text-xs font-mono uppercase">Leituras</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-display font-bold text-slate-900">{stats.completedChapters}</span>
                <span className="text-[10px] text-slate-400 font-mono">capítulos</span>
              </div>
            </div>
          </div>

          {/* Core modules shortcuts */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-display font-bold text-slate-900 text-lg mb-4">Módulos do Sistema</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button 
                onClick={() => setActiveTab('ai')}
                className="group flex items-start gap-4 p-4 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/10 text-left transition-all"
              >
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-100 transition-all">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h4 className="font-display font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition-all">
                    Teólogo IA
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-snug">
                    Exegese estruturada e hermenêutica acadêmica com Gemini.
                  </p>
                </div>
              </button>

              <button 
                onClick={() => setActiveTab('devotionals')}
                className="group flex items-start gap-4 p-4 rounded-xl border border-slate-100 hover:border-rose-200 hover:bg-rose-50/10 text-left transition-all"
              >
                <div className="p-3 bg-rose-50 text-rose-600 rounded-lg group-hover:bg-rose-100 transition-all">
                  <Heart size={20} />
                </div>
                <div>
                  <h4 className="font-display font-bold text-slate-900 text-sm group-hover:text-rose-700 transition-all">
                    Devocionais
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-snug">
                    Planos temáticos e aprofundamento teológico de alta qualidade.
                  </p>
                </div>
              </button>

              <button 
                onClick={() => setActiveTab('creative')}
                className="group flex items-start gap-4 p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/10 text-left transition-all"
              >
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-all">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h4 className="font-display font-bold text-slate-900 text-sm group-hover:text-blue-700 transition-all">
                    Estúdio de Imagens
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-snug">
                    Crie slides de pregação, capas e versículos ilustrados.
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Right column: Level, Streak & Achievements */}
        <div className="space-y-6">
          {/* Level Progress */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-display font-bold text-slate-900 text-lg mb-4">Progresso Teológico</h3>
            
            {/* Gamification Circle */}
            <div className="flex justify-center items-center py-4">
              <div className="relative w-36 h-36 flex items-center justify-center">
                {/* SVG Progress Circle */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle 
                    cx="50" cy="50" r="40" 
                    className="stroke-slate-100 fill-none" 
                    strokeWidth="8"
                  />
                  <circle 
                    cx="50" cy="50" r="40" 
                    className="stroke-emerald-500 fill-none transition-all duration-700" 
                    strokeWidth="8"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 - (251.2 * Math.min(100, (state.xp / (state.level * 150)) * 100)) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-display font-black text-slate-900">
                    {state.level}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest font-semibold">
                    Nível
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl mt-4">
              <Flame size={20} className="text-amber-500 fill-amber-500 animate-bounce" />
              <div>
                <p className="text-xs font-display font-bold text-amber-900">
                  Sequência diária de {state.dailyStreak} {state.dailyStreak === 1 ? 'dia' : 'dias'}!
                </p>
                <p className="text-[10px] text-amber-700 mt-0.5">
                  Mantenha o hábito estudando a palavra amanhã para manter o bônus!
                </p>
              </div>
            </div>
          </div>

          {/* Badges / Medalhas */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-slate-900 text-lg">
                Medalhas Desbloqueadas
              </h3>
              <span className="text-xs font-mono font-semibold text-slate-400">
                {state.badges.length}/{SYSTEM_BADGES.length}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {SYSTEM_BADGES.map((badge) => {
                const isUnlocked = state.badges.includes(badge.id);
                return (
                  <div 
                    key={badge.id}
                    title={`${badge.title}: ${badge.desc}`}
                    className={`flex flex-col items-center p-2.5 rounded-xl border text-center transition-all ${
                      isUnlocked 
                        ? 'bg-emerald-50/20 border-emerald-200 text-emerald-800' 
                        : 'bg-slate-50 border-slate-100 text-slate-300 filter grayscale opacity-60'
                    }`}
                  >
                    <div className={`p-2 rounded-lg mb-1.5 ${isUnlocked ? 'bg-emerald-100/60' : 'bg-slate-100'}`}>
                      <Award size={20} />
                    </div>
                    <span className="text-[9px] font-medium leading-tight line-clamp-1">
                      {badge.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Diagnostics and factory reset card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-display font-bold text-slate-900 text-lg mb-3 flex items-center gap-2">
              <ShieldAlert size={18} className="text-slate-500" />
              <span>Ferramentas e Resets</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Utilitários para testes de QA e redefinição de armazenamento offline (IndexedDB e LocalStorage).
            </p>
            <div className="space-y-2.5">
              <button
                onClick={async () => {
                  if (confirm('Tem certeza de que deseja redefinir o seu progresso teológico e XP? Suas anotações serão mantidas.')) {
                    await resetRewards();
                  }
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-amber-200 hover:bg-amber-50/10 text-left transition-all text-xs font-semibold text-amber-800"
              >
                <span className="flex items-center gap-2">
                  <RefreshCw size={14} className="text-amber-500 animate-spin-slow" />
                  Redefinir Nível & XP
                </span>
                <span className="text-[10px] text-amber-600 font-mono">Manter Notas</span>
              </button>

              <button
                onClick={async () => {
                  if (confirm('ATENÇÃO: Isso apagará permanentemente todas as suas Notas, Favoritos, Destaques, Planos de Leitura e dados de Recompensas do IndexedDB e LocalStorage. Esta ação é irreversível. Deseja prosseguir?')) {
                    await factoryReset();
                    window.location.reload();
                  }
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-rose-200 hover:bg-rose-50/10 text-left transition-all text-xs font-semibold text-rose-800"
              >
                <span className="flex items-center gap-2">
                  <Trash2 size={14} className="text-rose-500" />
                  Reset Geral de Fábrica
                </span>
                <span className="text-[10px] text-rose-600 font-mono">Apagar Tudo</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
