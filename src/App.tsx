import React, { useState, useEffect } from 'react';
import { RewardProvider } from './contexts/RewardContext';
import { Navigation } from './components/Navigation';
import { NotificationToast } from './components/NotificationToast';
import { WifiOff, ShieldAlert, Smartphone, X } from 'lucide-react';

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

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  // Bible reference hook to allow switching to Bible chapter directly from dashboard/favorites/plans
  const [selectedBibleRef, setSelectedBibleRef] = useState<{ bookId: string; chapter: number } | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen to messages from our service worker (e.g. background sync completes)
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SYNC_COMPLETED') {
        console.log('[App] Received sync completion from SW:', event.data.message);
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
  }, []);

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
      default:
        return <Dashboard setActiveTab={setActiveTab} setSelectedBibleRef={setSelectedBibleRef} />;
    }
  };

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
