import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { RewardState } from '../types';
import { dbService } from '../database/db';
import { SYSTEM_BADGES } from '../constants';

interface RewardContextType {
  state: RewardState;
  addXp: (amount: number, reason?: string) => Promise<void>;
  unlockBadge: (badgeId: string) => Promise<void>;
  resetRewards: () => Promise<void>;
  recentNotification: { message: string; type: 'xp' | 'badge' } | null;
  clearNotification: () => void;
}

const RewardContext = createContext<RewardContextType | undefined>(undefined);

export const useRewards = () => {
  const context = useContext(RewardContext);
  if (!context) {
    throw new Error('useRewards deve ser usado dentro de um RewardProvider');
  }
  return context;
};

export const RewardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<RewardState>({
    xp: 0,
    level: 1,
    dailyStreak: 0,
    badges: [],
    achievements: []
  });
  const [recentNotification, setRecentNotification] = useState<{ message: string; type: 'xp' | 'badge' } | null>(null);

  useEffect(() => {
    async function loadState() {
      const saved = await dbService.getRewardState();
      
      // Update daily streak based on date
      let currentStreak = saved.dailyStreak;
      const today = new Date().toISOString().split('T')[0];
      
      if (saved.lastActiveDate) {
        const lastActive = new Date(saved.lastActiveDate);
        const diffTime = Math.abs(new Date(today).getTime() - lastActive.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          currentStreak += 1;
        } else if (diffDays > 1) {
          currentStreak = 1; // reset to 1
        }
      } else {
        currentStreak = 1; // first time active
      }

      const updated = {
        ...saved,
        dailyStreak: currentStreak,
        lastActiveDate: today
      };

      setState(updated);
      await dbService.saveRewardState(updated);
    }
    loadState();
  }, []);

  const addXp = async (amount: number, reason?: string) => {
    setState((prev) => {
      let newXp = prev.xp + amount;
      let newLevel = prev.level;
      let leveledUp = false;

      // Simple level algorithm: level 1 needs 100 XP, level 2 needs 200 XP, etc.
      while (newXp >= newLevel * 150) {
        newXp -= newLevel * 150;
        newLevel += 1;
        leveledUp = true;
      }

      const updatedState = {
        ...prev,
        xp: newXp,
        level: newLevel
      };

      dbService.saveRewardState(updatedState);

      if (leveledUp) {
        setRecentNotification({
          message: `Parabéns! Você alcançou o Nível ${newLevel}! 🎉`,
          type: 'badge'
        });
      } else {
        setRecentNotification({
          message: `+${amount} XP${reason ? ` - ${reason}` : ''}`,
          type: 'xp'
        });
      }

      return updatedState;
    });
  };

  const unlockBadge = async (badgeId: string) => {
    setState((prev) => {
      if (prev.badges.includes(badgeId)) return prev;

      const badge = SYSTEM_BADGES.find(b => b.id === badgeId);
      const newBadges = [...prev.badges, badgeId];
      const updatedState = {
        ...prev,
        badges: newBadges
      };

      dbService.saveRewardState(updatedState);

      if (badge) {
        setRecentNotification({
          message: `Medalha Desbloqueada: ${badge.title}! 🏅`,
          type: 'badge'
        });
        // Grant badge XP
        setTimeout(() => {
          addXp(badge.xpReward, `Medalha: ${badge.title}`);
        }, 1000);
      }

      return updatedState;
    });
  };

  const resetRewards = async () => {
    const fresh: RewardState = {
      xp: 0,
      level: 1,
      dailyStreak: 1,
      lastActiveDate: new Date().toISOString().split('T')[0],
      badges: [],
      achievements: []
    };
    setState(fresh);
    await dbService.saveRewardState(fresh);
    setRecentNotification({
      message: 'Progresso do sistema de recompensas redefinido.',
      type: 'badge'
    });
  };

  const clearNotification = () => setRecentNotification(null);

  return (
    <RewardContext.Provider
      value={{
        state,
        addXp,
        unlockBadge,
        resetRewards,
        recentNotification,
        clearNotification
      }}
    >
      {children}
    </RewardContext.Provider>
  );
};
