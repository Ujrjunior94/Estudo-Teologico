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
  ShieldAlert
} from 'lucide-react';
import { formatDate } from '../utils';

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

  // Daily Verse definition
  const dailyVerse = {
    ref: 'João 1:1',
    bookId: 'JOH',
    chapter: 1,
    text: 'No princípio era o Verbo, e o Verbo estava com Deus, e o Verbo era Deus.',
    version: 'ARA'
  };

  useEffect(() => {
    async function loadStats() {
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
    }
    loadStats();
  }, [state, unlockBadge]);

  const readDailyVerse = () => {
    setSelectedBibleRef({ bookId: dailyVerse.bookId, chapter: dailyVerse.chapter });
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
            <div className="flex items-center gap-2 mb-4">
              <span className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-mono font-semibold uppercase tracking-wider">
                Versículo do Dia
              </span>
              <Sparkles size={14} className="text-amber-400 animate-pulse" />
            </div>
            
            <blockquote className="text-xl font-display italic font-light text-slate-100 leading-relaxed mb-6">
              "{dailyVerse.text}"
            </blockquote>

            <div className="flex items-center justify-between">
              <div>
                <cite className="font-display font-semibold text-slate-200 not-italic">
                  {dailyVerse.ref}
                </cite>
                <span className="text-[10px] text-slate-400 font-mono ml-2">
                  ({dailyVerse.version})
                </span>
              </div>
              <button 
                onClick={readDailyVerse}
                className="flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white text-xs px-3.5 py-1.5 rounded-lg transition-all border border-white/10 font-medium"
              >
                <span>Estudar Capítulo</span>
                <ArrowUpRight size={14} />
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
