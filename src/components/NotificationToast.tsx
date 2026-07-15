import React, { useEffect } from 'react';
import { useRewards } from '../contexts/RewardContext';
import { Flame, Award, Star } from 'lucide-react';

export const NotificationToast: React.FC = () => {
  const { recentNotification, clearNotification } = useRewards();

  useEffect(() => {
    if (recentNotification) {
      const timer = setTimeout(() => {
        clearNotification();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [recentNotification, clearNotification]);

  if (!recentNotification) return null;

  const isXp = recentNotification.type === 'xp';

  return (
    <div className="fixed bottom-16 md:bottom-6 right-6 z-50 animate-fade-in max-w-sm bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700/50 p-4 flex items-center gap-3 overflow-hidden">
      {/* Decorative colored glow bar */}
      <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${isXp ? 'bg-amber-500' : 'bg-emerald-500'}`} />

      {/* Icon */}
      <div className={`p-2 rounded-lg flex-shrink-0 ${isXp ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
        {isXp ? <Star size={20} className="animate-bounce" /> : <Award size={20} className="animate-pulse" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-2">
        <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
          {isXp ? 'Ganho de Progresso' : 'Conquista Desbloqueada'}
        </h4>
        <p className="text-sm font-display font-medium text-slate-100 truncate">
          {recentNotification.message}
        </p>
      </div>

      {/* Dismiss Button */}
      <button 
        onClick={clearNotification}
        className="text-xs text-slate-500 hover:text-slate-300 px-1 py-1 font-mono hover:bg-slate-800 rounded"
      >
        OK
      </button>
    </div>
  );
};
export default NotificationToast;
