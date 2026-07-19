import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  LayoutDashboard, 
  Sparkles, 
  Compass, 
  Palette, 
  FolderHeart, 
  History,
  Flame,
  User,
  LogOut,
  Award,
  BookMarked,
  Heart,
  HeartHandshake,
  Smartphone,
  Cloud
} from 'lucide-react';
import { useRewards } from '../contexts/RewardContext';
import { auth } from '../services/firebase';
import { User as FirebaseUser } from 'firebase/auth';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenQuickPrayer: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab, onOpenQuickPrayer }) => {
  const { state } = useRewards();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(auth.currentUser);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
      setShowInstallBtn(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      unsubscribe();
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Navigation PWA Install choice: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };

  const navItems = [
    { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
    { id: 'bible', label: 'Bíblia', icon: BookOpen },
    { id: 'devotionals', label: 'Devocionais', icon: Heart },
    { id: 'dictionary', label: 'Dicionário', icon: BookMarked },
    { id: 'ai', label: 'Teólogo IA', icon: Sparkles },
    { id: 'creative', label: 'Estúdio', icon: Palette },
    { id: 'saved', label: 'Estudos', icon: FolderHeart },
    { id: 'plans', label: 'Planos', icon: Compass },
    { id: 'prayers', label: 'Orações', icon: HeartHandshake },
    { id: 'profile', label: 'Nuvem', icon: Cloud }
  ];

  return (
    <>
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-100 h-screen sticky top-0 border-r border-slate-800">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="bg-emerald-500 text-slate-950 p-2 rounded-lg font-display font-bold">
            PRO
          </div>
          <div>
            <h1 className="font-display font-bold text-sm tracking-tight text-white leading-none">Estudo Bíblico</h1>
            <span className="text-xs text-slate-400 font-mono">e Teológico PRO</span>
          </div>
        </div>

        {/* User Level Widget */}
        <div className="p-4 mx-4 mt-6 bg-slate-800/50 rounded-xl border border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-mono uppercase tracking-wider">Nível {state.level}</span>
            <div className="flex items-center gap-1 text-amber-400 text-xs font-mono font-bold">
              <Flame size={14} className="animate-pulse text-amber-500" />
              <span>{state.dailyStreak} dias</span>
            </div>
          </div>
          <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-emerald-400 to-teal-500 h-full transition-all duration-500"
              style={{ width: `${Math.min(100, (state.xp / (state.level * 150)) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-[10px] text-slate-400 font-mono">{state.xp} XP</span>
            <span className="text-[10px] text-slate-400 font-mono">{state.level * 150} XP para nível {state.level + 1}</span>
          </div>
        </div>

        {/* Quick Prayer Trigger Button for Desktop */}
        <div className="px-4 mt-4 shrink-0">
          <button 
            onClick={onOpenQuickPrayer}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-sans font-bold text-xs py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 cursor-pointer transition-all active:scale-95 hover:shadow-emerald-500/15"
          >
            <Heart size={14} className="fill-slate-950 text-slate-950 animate-pulse" />
            <span>Clamor Rápido</span>
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-emerald-500/10 text-emerald-400 border-l-4 border-emerald-500' 
                    : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-emerald-400' : 'text-slate-400'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* PWA Install Widget */}
        {showInstallBtn && (
          <div className="p-4 mx-4 mb-4 bg-slate-800/50 border border-emerald-500/20 rounded-xl flex flex-col gap-1.5 animate-fade-in">
            <div className="flex items-center gap-2 text-emerald-400">
              <Smartphone size={14} />
              <h3 className="text-xs font-bold font-sans">Instalar Aplicativo</h3>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              Acesse offline diretamente da sua tela inicial como app nativo.
            </p>
            <button 
              onClick={handleInstallClick}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold py-1.5 px-3 rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              Instalar Agora
            </button>
          </div>
        )}

        {/* Footer */}
        <button 
          onClick={() => setActiveTab('profile')}
          className="w-full p-4 border-t border-slate-800 flex items-center justify-between text-left hover:bg-slate-800/25 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 shrink-0 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 font-bold text-xs">
              {currentUser ? (currentUser.displayName ? currentUser.displayName[0].toUpperCase() : currentUser.email?.[0].toUpperCase() || 'U') : <User size={14} />}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-medium text-slate-300 truncate">
                {currentUser ? (currentUser.displayName || 'Usuário Pro') : 'Teólogo PRO'}
              </p>
              <p className="text-[10px] font-mono text-slate-500 truncate">
                {currentUser ? 'Sincronizado' : 'Membro Offline'}
              </p>
            </div>
          </div>
          <div className="text-emerald-500/80 shrink-0">
            <Award size={18} />
          </div>
        </button>
      </aside>

      {/* Floating Action Button for Mobile */}
      <div className="md:hidden fixed bottom-20 right-4 z-45">
        <button
          onClick={onOpenQuickPrayer}
          className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-slate-950 shadow-xl shadow-emerald-500/30 active:scale-95 transition-all cursor-pointer border border-emerald-400/20"
          title="Clamor Rápido"
        >
          <Heart size={18} className="fill-slate-950 text-slate-950 animate-pulse" />
        </button>
      </div>

      {/* Bottom Tab Bar for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 flex items-center py-2 px-3 z-50 overflow-x-auto gap-4 scrollbar-none justify-between">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex-shrink-0 flex flex-col items-center gap-1 py-1 px-2 rounded-md transition-all ${
                isActive ? 'text-emerald-400 bg-emerald-500/5' : 'text-slate-400'
              }`}
            >
              <Icon size={18} />
              <span className="text-[9px] font-medium tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
export default Navigation;
