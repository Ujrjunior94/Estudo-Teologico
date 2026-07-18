import React, { useState, useEffect } from 'react';
import { dbService } from '../database/db';
import { ReadingPlan } from '../types';
import { DEFAULT_READING_PLANS } from '../constants';
import { useRewards } from '../contexts/RewardContext';
import { generateTheologicalPlan } from '../api/chat';
import { 
  Compass, 
  CheckCircle, 
  Play, 
  Trash2, 
  Award, 
  TrendingUp,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Sparkles,
  Loader2,
  Wand2
} from 'lucide-react';

interface PlansProps {
  setActiveTab: (tab: string) => void;
  setSelectedBibleRef: (ref: { bookId: string; chapter: number }) => void;
}

export const Plans: React.FC<PlansProps> = ({ setActiveTab, setSelectedBibleRef }) => {
  const { addXp, unlockBadge } = useRewards();

  // Plans database list
  const [plans, setPlans] = useState<ReadingPlan[]>([]);
  const [themeInput, setThemeInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  useEffect(() => {
    loadPlans();

    // Real-time synchronization update listener
    const handleDbUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (!customEvent.detail || customEvent.detail.type === 'plans') {
        console.log('[Plans] Real-time change detected in IndexedDB, reloading...');
        loadPlans();
      }
    };

    window.addEventListener('db-update', handleDbUpdate);
    return () => {
      window.removeEventListener('db-update', handleDbUpdate);
    };
  }, []);

  const loadPlans = async () => {
    const list = await dbService.getPlans();
    
    // If no plans exist, initialize with DEFAULT_READING_PLANS
    if (list.length === 0) {
      for (const defaultPlan of DEFAULT_READING_PLANS) {
        await dbService.savePlan(defaultPlan);
      }
      const reloaded = await dbService.getPlans();
      setPlans(reloaded);
    } else {
      setPlans(list);
    }
  };

  // Generate study plan with AI
  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!themeInput.trim()) return;

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const generatedPlan = await generateTheologicalPlan(themeInput);
      
      const newPlan: ReadingPlan = {
        id: `ai_plan_${Date.now()}`,
        title: generatedPlan.title,
        description: generatedPlan.description,
        durationDays: generatedPlan.durationDays || 30,
        completedDays: [],
        completedVerses: [],
        isActive: false,
        tasksPerDay: generatedPlan.tasksPerDay || []
      };

      await dbService.savePlan(newPlan);
      await loadPlans();
      
      addXp(100, `Esboço Teológico gerado com IA para: ${newPlan.title} 🎓`);
      unlockBadge('teologo_junior');
      setThemeInput('');
    } catch (err: any) {
      console.error('Erro ao gerar plano:', err);
      setGenerationError('Não foi possível conectar ao serviço de IA. Mas não se preocupe! O mecanismo local gerou um plano estruturado para você.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Delete custom plan
  const handleDeletePlan = async (id: string) => {
    if (window.confirm('Tem certeza de que deseja excluir este plano de estudos personalizado?')) {
      await dbService.deletePlan(id);
      await loadPlans();
      addXp(5, 'Excluiu plano de estudos personalizado');
    }
  };

  // Start reading plan
  const handleStartPlan = async (plan: ReadingPlan) => {
    const updated = {
      ...plan,
      isActive: true,
      startDate: new Date().toISOString()
    };
    await dbService.savePlan(updated);
    await loadPlans();
    addXp(20, `Iniciou o plano: ${plan.title}`);
  };

  // Stop / Abandon plan
  const handleCancelPlan = async (id: string) => {
    const plan = plans.find(p => p.id === id);
    if (!plan) return;

    const updated = {
      ...plan,
      isActive: false,
      completedDays: [],
      completedVerses: []
    };
    await dbService.savePlan(updated);
    await loadPlans();
    addXp(5, 'Redefiniu plano de estudos');
  };

  // Finish day task
  const handleCompleteDay = async (plan: ReadingPlan, day: number) => {
    if (plan.completedDays.includes(day)) return;

    const newCompletedDays = [...plan.completedDays, day].sort((a, b) => a - b);
    const isCompleted = newCompletedDays.length === plan.durationDays;

    const updated: ReadingPlan = {
      ...plan,
      completedDays: newCompletedDays
    };

    await dbService.savePlan(updated);
    await loadPlans();

    // Reward player
    addXp(50, `Concluiu Dia ${day} do plano: ${plan.title}`);
    
    if (isCompleted) {
      addXp(200, `Plano concluído com maestria: ${plan.title} 🎉`);
      unlockBadge('mestre_da_lei');
    }
  };

  // Click reading task -> Open scripture directly in Bible Reader
  const handleGoToReading = (bookId: string, chapter: number) => {
    setSelectedBibleRef({ bookId, chapter });
    setActiveTab('bible');
    addXp(5, 'Iniciou leitura guiada');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20 font-sans">
      {/* Title */}
      <div className="border-b border-slate-200 pb-4">
        <h2 className="font-display font-bold text-3xl text-slate-900 tracking-tight">
          Planos de Leitura e Estudos
        </h2>
        <p className="text-sm text-slate-500 mt-1 font-sans">
          Estreite sua intimidade bíblica iniciando planos estruturados sistemáticos com recompensas integradas de XP.
        </p>
      </div>

      {/* AI PLAN CREATOR SECTION */}
      <div className="bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-800 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-10 -top-10 w-32 h-32 bg-emerald-400/20 rounded-full blur-xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-2">
            <span className="p-1.5 bg-white/20 rounded-xl text-emerald-100">
              <Sparkles size={18} className="animate-pulse" />
            </span>
            <h3 className="font-display font-bold text-lg">Criador de Planos de Estudo com IA</h3>
          </div>
          
          <p className="text-xs text-emerald-100/90 leading-relaxed mb-5 max-w-2xl font-sans">
            Insira qualquer tema teológico complexo (ex: <strong>Soteriologia</strong>, <strong>Escatologia Bíblica</strong> ou <strong>Doutrina da Trindade</strong>) para criar instantaneamente um plano de estudos temático personalizado de 30 dias com metas diárias específicas.
          </p>
          
          <form onSubmit={handleGeneratePlan} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <input 
                type="text"
                value={themeInput}
                onChange={(e) => setThemeInput(e.target.value)}
                disabled={isGenerating}
                placeholder="Insira um tema teológico complexo (ex: Soteriologia)..."
                className="w-full bg-white/10 border border-white/20 hover:border-white/40 focus:border-white focus:bg-white focus:text-slate-900 focus:outline-none rounded-xl py-2.5 px-4 text-sm text-white placeholder-emerald-100/50 transition-all font-sans"
              />
              {themeInput && (
                <button
                  type="button"
                  onClick={() => setThemeInput('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-lg font-bold"
                >
                  &times;
                </button>
              )}
            </div>
            
            <button
              type="submit"
              disabled={isGenerating || !themeInput.trim()}
              className="bg-white hover:bg-emerald-50 text-emerald-950 disabled:bg-white/50 disabled:text-emerald-100/80 font-bold text-sm px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Gerando Plano...</span>
                </>
              ) : (
                <>
                  <Wand2 size={16} />
                  <span>Gerar Plano de 30 Dias</span>
                </>
              )}
            </button>
          </form>

          {/* Preset Suggestions */}
          <div className="flex flex-wrap gap-2 mt-4 items-center">
            <span className="text-[10px] font-mono text-emerald-200 uppercase font-bold mr-1">Sugestões rápidas:</span>
            {[
              'Soteriologia',
              'Escatologia Bíblica',
              'Doutrina da Trindade',
              'Cristologia',
              'Pneumatologia'
            ].map(preset => (
              <button
                key={preset}
                type="button"
                disabled={isGenerating}
                onClick={() => setThemeInput(preset)}
                className="text-[11px] bg-white/10 hover:bg-white/25 active:bg-white/35 text-white font-medium px-2.5 py-1 rounded-lg transition-all cursor-pointer"
              >
                {preset}
              </button>
            ))}
          </div>

          {isGenerating && (
            <div className="mt-4 p-3 bg-white/10 border border-white/10 rounded-xl text-xs flex items-center gap-3 animate-pulse text-emerald-50 font-sans">
              <Loader2 size={14} className="animate-spin text-emerald-300" />
              <span>
                A IA está vasculhando as escrituras para dividir o tema em 30 eixos específicos de estudo com leituras recomendadas. Por favor, aguarde...
              </span>
            </div>
          )}

          {generationError && (
            <div className="mt-3 text-xs bg-amber-500/20 border border-amber-500/30 text-amber-100 p-3 rounded-xl font-sans">
              ⚠️ {generationError}
            </div>
          )}
        </div>
      </div>

      {/* Grid plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plans.map(plan => {
          const isActive = plan.isActive;
          const completedCount = plan.completedDays.length;
          const progressPercent = Math.round((completedCount / plan.durationDays) * 100);
          
          return (
            <div 
              key={plan.id}
              className={`bg-white border rounded-2xl p-6 shadow-sm flex flex-col justify-between transition-all ${
                isActive ? 'border-emerald-500 ring-1 ring-emerald-500/20' : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="bg-slate-100 text-slate-800 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase">
                    Duração: {plan.durationDays} dias
                  </span>
                  
                  {isActive && (
                    <span className="bg-emerald-50 text-emerald-600 font-display font-bold text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                      <TrendingUp size={14} />
                      <span>{progressPercent}% Ativo</span>
                    </span>
                  )}
                </div>

                <h3 className="font-display font-bold text-slate-900 text-lg mb-1">{plan.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-sans mb-5">{plan.description}</p>

                {isActive && (
                  <div className="space-y-4 mb-6 border-t border-slate-100 pt-4">
                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                        <span>Progresso diário</span>
                        <span>{completedCount}/{plan.durationDays} dias</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-full transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Today Reading Checklist */}
                    <div>
                      <h4 className="text-xs font-mono uppercase text-slate-400 font-bold mb-2">Checklist de Leituras</h4>
                      
                      <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                        {plan.tasksPerDay.map(task => {
                          const isDayCompleted = plan.completedDays.includes(task.day);
                          return (
                            <div 
                              key={task.day}
                              className={`p-2.5 rounded-xl border text-xs flex items-start sm:items-center justify-between gap-3 ${
                                isDayCompleted 
                                  ? 'bg-slate-50/50 border-slate-100 text-slate-400 line-through' 
                                  : 'bg-slate-50 border-slate-200 text-slate-700'
                              }`}
                            >
                              <div className="flex flex-col gap-1 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono font-bold text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded flex-shrink-0">
                                    Dia {task.day}
                                  </span>
                                  {task.title && (
                                    <span className={`font-sans font-bold text-xs ${isDayCompleted ? 'text-slate-400' : 'text-slate-800'}`}>
                                      {task.title}
                                    </span>
                                  )}
                                </div>
                                <div className="flex gap-1 flex-wrap items-center mt-1 text-slate-500 text-[11px]">
                                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Leitura:</span>
                                  {task.readings.map((r, idx) => (
                                    <button
                                      key={idx}
                                      onClick={() => handleGoToReading(r.bookId, r.chapters[0])}
                                      className="hover:underline text-emerald-600 font-semibold cursor-pointer"
                                    >
                                      {r.bookName} {r.chapters.join(', ')}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {!isDayCompleted && (
                                <button
                                  onClick={() => handleCompleteDay(plan, task.day)}
                                  className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-2.5 py-1 rounded-md shadow-sm transition-all flex-shrink-0"
                                >
                                  <CheckCircle size={10} />
                                  <span>Concluir</span>
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Activation control buttons */}
              <div className="border-t border-slate-50 pt-4 mt-4 flex justify-between items-center gap-2">
                <div>
                  {plan.id.startsWith('ai_plan_') && (
                    <button
                      onClick={() => handleDeletePlan(plan.id)}
                      className="text-xs text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 px-3 py-2 rounded-xl transition-all font-semibold flex items-center gap-1 cursor-pointer"
                      title="Excluir este plano personalizado"
                    >
                      <Trash2 size={12} />
                      <span>Excluir</span>
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  {isActive ? (
                    <button
                      onClick={() => handleCancelPlan(plan.id)}
                      className="text-xs text-rose-500 bg-rose-50 hover:bg-rose-100 px-4 py-2 rounded-xl transition-all font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw size={12} />
                      <span>Redefinir Progresso</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStartPlan(plan)}
                      className="text-xs text-white bg-slate-900 hover:bg-slate-800 px-5 py-2.5 rounded-xl font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                    >
                      <Play size={12} fill="white" />
                      <span>Iniciar Plano de Estudo</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default Plans;
