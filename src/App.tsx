import React, { useState, useEffect } from 'react';
import { RewardProvider } from './contexts/RewardContext';
import { Navigation } from './components/Navigation';
import { NotificationToast } from './components/NotificationToast';
import { WifiOff, ShieldAlert, Smartphone, X, Loader2 } from 'lucide-react';
import { dbService } from './database/db';
import { User as FirebaseUser } from 'firebase/auth';
import { auth, setupRealtimeListeners, clearRealtimeListeners, syncAllData } from './services/firebase';
import { Login } from './components/Login';

// Pages
import { Dashboard } from './pages/Dashboard';
import { BibleReader } from './pages/BibleReader';
import { Dictionary } from './pages/Dictionary';
import { AiAssistant } from './pages/AiAssistant';
import { CreativeStudio } from './pages/CreativeStudio';
import { SavedItems } from './pages/SavedItems';
import { Plans } from './pages/Plans';
import { Devotionals } from './pages/Devotionals';
import { Prayers } from './pages/Prayers';
import { Profile } from './pages/Profile';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  // Authentication & Guest states
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [continueOffline, setContinueOffline] = useState(() => {
    return localStorage.getItem('guest_mode_v1') === 'true';
  });

  // Bible reference hook to allow switching to Bible chapter directly from dashboard/favorites/plans
  const [selectedBibleRef, setSelectedBibleRef] = useState<{ bookId: string; chapter: number } | null>(null);

  // Track authentication state and configure real-time cloud listeners
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      
      if (user) {
        // Enforce guest mode to false since user is officially authenticated
        setContinueOffline(false);
        localStorage.setItem('guest_mode_v1', 'false');
        
        // Setup real-time listeners for notes and plans in Firestore
        setupRealtimeListeners(user.uid);

        // Perform automatic bi-directional synchronization on startup or login
        syncAllData(user.uid).catch((err) => {
          console.warn('[Sync] Initial bi-directional sync failed/offline:', err);
        });
      } else {
        clearRealtimeListeners();
      }
    });

    return () => {
      unsubscribe();
      clearRealtimeListeners();
    };
  }, []);

  // Auto-clear bible cache on first load after the API fix to ensure clean synchronisation and prevent mismatches
  useEffect(() => {
    async function init() {
      if (!localStorage.getItem('bible_cache_cleared_v2')) {
        try {
          await dbService.clearBibleCache();
          localStorage.setItem('bible_cache_cleared_v2', 'true');
          console.log('[App] Old bible cache cleared successfully due to database sync upgrade.');
        } catch (err) {
          console.warn('[App] Could not clear outdated Bible cache on startup:', err);
        }
      }
    }
    init();
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      const user = auth.currentUser;
      if (user) {
        console.log('[App] Browser came online. Performing automatic bi-directional sync...');
        syncAllData(user.uid).catch((err) => {
          console.warn('[Sync] Sync failed when browser came online:', err);
        });
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen to messages from our service worker (e.g. background sync completes)
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SYNC_COMPLETED') {
        console.log('[App] Received sync completion from SW:', event.data.message);
        const user = auth.currentUser;
        if (user) {
          syncAllData(user.uid).catch((err) => {
            console.warn('[Sync] Sync failed following Service Worker SYNC_COMPLETED trigger:', err);
          });
        }
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleMessage);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      }
    };
  }, [currentUser]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If already running in standalone mode, hide the install banner
    if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
      setShowInstallBanner(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA Install choice: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            setActiveTab={setActiveTab} 
            setSelectedBibleRef={setSelectedBibleRef} 
          />
        );
      case 'bible':
        return (
          <BibleReader 
            selectedBibleRef={selectedBibleRef} 
            setSelectedBibleRef={setSelectedBibleRef} 
          />
        );
      case 'devotionals':
        return (
          <Devotionals 
            setActiveTab={setActiveTab} 
            setSelectedBibleRef={setSelectedBibleRef} 
          />
        );
      case 'dictionary':
        return <Dictionary />;
      case 'ai':
        return <AiAssistant />;
      case 'creative':
        return <CreativeStudio />;
      case 'saved':
        return (
          <SavedItems 
            setActiveTab={setActiveTab} 
            setSelectedBibleRef={setSelectedBibleRef} 
          />
        );
      case 'plans':
        return (
          <Plans 
            setActiveTab={setActiveTab} 
            setSelectedBibleRef={setSelectedBibleRef} 
          />
        );
      case 'prayers':
        return <Prayers />;
      case 'profile':
        return <Profile />;
      default:
        return <Dashboard setActiveTab={setActiveTab} setSelectedBibleRef={setSelectedBibleRef} />;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-mono uppercase tracking-widest">Iniciando Bíblia PRO...</p>
        </div>
      </div>
    );
  }

  if (!currentUser && !continueOffline) {
    return (
      <RewardProvider>
        <Login 
          onContinueOffline={() => {
            setContinueOffline(true);
            localStorage.setItem('guest_mode_v1', 'true');
          }} 
        />
        <NotificationToast />
      </RewardProvider>
    );
  }

  return (
    <RewardProvider>
      <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 text-slate-800 font-sans">
        
        {/* Navigation Sidebar/BottomBar */}
        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Main Viewport Content area */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full relative">
          {showInstallBanner && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-2xl flex items-start sm:items-center justify-between gap-4 text-xs font-sans animate-fade-in shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-xl text-emerald-700">
                  <Smartphone size={18} />
                </div>
                <div>
                  <span className="font-bold block sm:inline text-slate-900">Instalar Bíblia PRO no Celular ou Computador:</span>
                  <span className="text-slate-700 ml-1">Estude a Palavra de Deus com acesso instantâneo diretamente da sua tela inicial, melhor desempenho e suporte offline completo.</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button 
                  onClick={handleInstallClick} 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-3.5 py-1.5 rounded-xl transition shadow-sm active:scale-95 cursor-pointer"
                >
                  Instalar
                </button>
                <button 
                  onClick={() => setShowInstallBanner(false)} 
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-emerald-100/50 transition cursor-pointer"
                  title="Fechar"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

          {!isOnline && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl flex items-start sm:items-center justify-between gap-3 text-xs font-sans animate-fade-in shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-amber-100 rounded-lg text-amber-700">
                  <WifiOff size={16} />
                </div>
                <div>
                  <span className="font-bold block sm:inline">Modo Offline Ativo:</span>
                  <span className="text-amber-700/90 ml-0.5"> Você está estudando sem conexão de rede. Suas anotações, favoritos, destaques e planos de leitura estão totalmente disponíveis e serão persistidos localmente!</span>
                </div>
              </div>
            </div>
          )}
          {renderActivePage()}
        </main>

        {/* Global Gamification Alerts Notification */}
        <NotificationToast />
      </div>
    </RewardProvider>
  );
}
