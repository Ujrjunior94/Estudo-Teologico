import React, { useState, useEffect } from 'react';
import { dbService } from '../database/db';
import { ReadingPlan } from '../types';
import { DEFAULT_READING_PLANS } from '../constants';
import { useRewards } from '../contexts/RewardContext';
import { 
  Compass, 
  CheckCircle, 
  Play, 
  Trash2, 
  Award, 
  TrendingUp,
  RotateCcw,
  BookOpen,
  ArrowRight
} from 'lucide-react';

interface PlansProps {
  setActiveTab: (tab: string) => void;
  setSelectedBibleRef: (ref: { bookId: string; chapter: number }) => void;
}

export const Plans: React.FC<PlansProps> = ({ setActiveTab, setSelectedBibleRef }) => {
  const { addXp, unlockBadge } = useRewards();

  // Plans database list
  const [plans, setPlans] = useState<ReadingPlan[]>([]);

  useEffect(() => {
    loadPlans();
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
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Title */}
      <div className="border-b border-slate-200 pb-4">
        <h2 className="font-display font-bold text-3xl text-slate-900 tracking-tight">
          Planos de Leitura e Estudos
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Estreite sua intimidade bíblica iniciando planos estruturados sistemáticos com recompensas integradas de XP.
        </p>
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
                    <span className="bg-emerald-550 text-emerald-600 font-display font-bold text-xs flex items-center gap-1">
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
                      
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {plan.tasksPerDay.map(task => {
                          const isDayCompleted = plan.completedDays.includes(task.day);
                          return (
                            <div 
                              key={task.day}
                              className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                                isDayCompleted 
                                  ? 'bg-slate-50/50 border-slate-100 text-slate-400 line-through' 
                                  : 'bg-slate-50 border-slate-200 text-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                                  Dia {task.day}
                                </span>
                                <div className="flex gap-1 flex-wrap">
                                  {task.readings.map((r, idx) => (
                                    <button
                                      key={idx}
                                      onClick={() => handleGoToReading(r.bookId, r.chapters[0])}
                                      className="hover:underline text-emerald-600 font-medium cursor-pointer"
                                    >
                                      {r.bookName} {r.chapters.join(', ')}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {!isDayCompleted && (
                                <button
                                  onClick={() => handleCompleteDay(plan, task.day)}
                                  className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-2.5 py-1 rounded-md shadow-sm transition-all"
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
              <div className="border-t border-slate-50 pt-4 mt-4 flex justify-end gap-2">
                {isActive ? (
                  <button
                    onClick={() => handleCancelPlan(plan.id)}
                    className="text-xs text-rose-500 bg-rose-50 hover:bg-rose-100 px-4 py-2 rounded-xl transition-all font-semibold flex items-center gap-1.5"
                  >
                    <RotateCcw size={12} />
                    <span>Redefinir Progresso</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleStartPlan(plan)}
                    className="text-xs text-white bg-slate-900 hover:bg-slate-800 px-5 py-2.5 rounded-xl font-bold flex items-center gap-1.5 shadow-md transition-all"
                  >
                    <Play size={12} fill="white" />
                    <span>Iniciar Plano de Estudo</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default Plans;
