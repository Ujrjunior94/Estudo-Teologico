import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  X, 
  Timer, 
  Play, 
  Pause, 
  RotateCcw, 
  Check, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  BookOpen, 
  ChevronRight,
  Wind
} from 'lucide-react';
import { dbService } from '../database/db';
import { useRewards } from '../contexts/RewardContext';
import { PrayerRequest } from '../types';

interface QuickPrayerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  { value: 'Espiritual', emoji: '🕊️', label: 'Espiritual' },
  { value: 'Saúde', emoji: '🩺', label: 'Saúde' },
  { value: 'Família', emoji: '🏠', label: 'Família' },
  { value: 'Finanças', emoji: '💰', label: 'Finanças' },
  { value: 'Trabalho', emoji: '💼', label: 'Trabalho' },
  { value: 'Outro', emoji: '🌟', label: 'Outro' }
] as const;

const TIMER_OPTIONS = [
  { value: 0, label: 'Sem silêncio (Gravar direto)' },
  { value: 60, label: '1 minuto' },
  { value: 120, label: '2 minutos' },
  { value: 180, label: '3 minutos' },
  { value: 300, label: '5 minutos' }
] as const;

const INSPIRATIONAL_VERSES = [
  { text: "Não andeis ansiosos por coisa alguma; antes em tudo as vossas petições sejam conhecidas diante de Deus pela oração e súplica, com ação de graças.", ref: "Filipenses 4:6" },
  { text: "Tu conservarás em paz aquele cuja mente está firme em ti; porque ele confia em ti.", ref: "Isaías 26:3" },
  { text: "Aquietai-vos, e sabei que eu sou Deus.", ref: "Salmos 46:10" },
  { text: "Clama a mim, e responder-te-ei, e anunciar-te-ei coisas grandes e firmes que não sabes.", ref: "Jeremias 33:3" },
  { text: "O Senhor está perto de todos os que o invocam, de todos os que o invocam em verdade.", ref: "Salmos 145:18" }
];

export const QuickPrayer: React.FC<QuickPrayerProps> = ({ isOpen, onClose }) => {
  const { addXp, unlockBadge } = useRewards();

  // Form states
  const [step, setStep] = useState<'form' | 'timer' | 'completed'>('form');
  const [title, setTitle] = useState('');
  const [request, setRequest] = useState('');
  const [requesterName, setRequesterName] = useState('');
  const [category, setCategory] = useState<typeof CATEGORIES[number]['value']>('Espiritual');
  const [duration, setDuration] = useState<number>(0); // seconds

  // Timer states
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [savedRequest, setSavedRequest] = useState<PrayerRequest | null>(null);

  // Breathing box states (for animation timing)
  // Phase can be: 'inhale' (4s) -> 'hold_full' (4s) -> 'exhale' (4s) -> 'hold_empty' (4s)
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold_full' | 'exhale' | 'hold_empty'>('inhale');
  const [breathText, setBreathText] = useState('Prepare-se...');
  const breathCycleRef = useRef<number | null>(null);
  const [breathSeconds, setBreathSeconds] = useState(0);

  // Verse of the day for completion screen
  const [selectedVerse, setSelectedVerse] = useState(INSPIRATIONAL_VERSES[0]);

  useEffect(() => {
    if (isOpen) {
      // Reset form states
      setStep('form');
      setTitle('');
      setRequest('');
      setRequesterName('');
      setCategory('Espiritual');
      setDuration(0);
      setIsTimerRunning(false);
      setSavedRequest(null);
      // Randomize completion verse
      const randomIndex = Math.floor(Math.random() * INSPIRATIONAL_VERSES.length);
      setSelectedVerse(INSPIRATIONAL_VERSES[randomIndex]);
    }
  }, [isOpen]);

  // Breathing loop cycle tracker
  useEffect(() => {
    if (step !== 'timer' || !isTimerRunning) {
      setBreathText('Pausado');
      return;
    }

    const interval = setInterval(() => {
      setBreathSeconds(prev => {
        const nextSec = (prev + 1) % 16;
        if (nextSec < 4) {
          setBreathPhase('inhale');
          setBreathText('Inale suavemente...');
        } else if (nextSec < 8) {
          setBreathPhase('hold_full');
          setBreathText('Sinta a presença de Deus...');
        } else if (nextSec < 12) {
          setBreathPhase('exhale');
          setBreathText('Exale suas preocupações...');
        } else {
          setBreathPhase('hold_empty');
          setBreathText('Aquiete o seu coração...');
        }
        return nextSec;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [step, isTimerRunning]);

  // Meditative Silence Timer Countdown Loop
  useEffect(() => {
    let timerId: any;
    if (step === 'timer' && isTimerRunning && timeLeft > 0) {
      timerId = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (step === 'timer' && timeLeft === 0 && isTimerRunning) {
      handleTimerComplete();
    }

    return () => clearTimeout(timerId);
  }, [step, isTimerRunning, timeLeft]);

  // Serene Celestial Chime Synthesizer using Web Audio API (Offline friendly!)
  const playCelestialChime = () => {
    if (!isSoundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const playNote = (frequency: number, delay: number, duration: number, volume = 0.15) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        // Beautiful rich sine/triangle hybrid bell tone
        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency, ctx.currentTime + delay);
        
        gain.gain.setValueAtTime(0, ctx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + duration);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + duration);
      };
      
      // Celestial Major Arpeggio chime
      playNote(523.25, 0.0, 3.5, 0.15); // C5 (serene foundation)
      playNote(659.25, 0.2, 3.0, 0.12); // E5
      playNote(783.99, 0.4, 2.8, 0.12); // G5
      playNote(1046.50, 0.6, 2.5, 0.10); // C6 (angelic high bell)
    } catch (e) {
      console.warn('Web Audio chime play failed:', e);
    }
  };

  const handleSaveAndProceed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !request.trim()) return;

    const requestItem: PrayerRequest = {
      id: `prayer_${Date.now()}`,
      title: title.trim(),
      request: request.trim(),
      requesterName: requesterName.trim() || undefined,
      category,
      status: 'Pendente',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      logs: []
    };

    try {
      // Save prayer request to the DB
      await dbService.savePrayer(requestItem);
      setSavedRequest(requestItem);

      if (duration > 0) {
        // Prepare Timer
        setTimeLeft(duration);
        setStep('timer');
        setIsTimerRunning(true);
        setBreathSeconds(0);
        setBreathPhase('inhale');
        setBreathText('Prepare-se para o silêncio...');
      } else {
        // No timer option: go straight to completed screen
        addXp(15, 'Oração rápida gravada');
        unlockBadge('primeiros_passos');
        setStep('completed');
      }
    } catch (err) {
      console.error('Error saving quick prayer request:', err);
    }
  };

  const handleTimerComplete = async () => {
    setIsTimerRunning(false);
    playCelestialChime();
    
    // Add meditation completion log to the prayer request
    if (savedRequest) {
      const updatedRequest: PrayerRequest = {
        ...savedRequest,
        logs: [
          {
            id: `log_silence_${Date.now()}`,
            note: `⏱️ Realizou momento de silêncio meditativo de ${duration / 60} min para intercessão e escuta espiritual.`,
            createdAt: new Date().toISOString()
          },
          ...savedRequest.logs
        ],
        updatedAt: new Date().toISOString()
      };
      
      try {
        await dbService.savePrayer(updatedRequest);
      } catch (err) {
        console.warn('Failed to save silence log to prayer:', err);
      }
    }

    // Reward points for silent meditation
    addXp(25, 'Oração rápida com silêncio meditativo');
    unlockBadge('guerreiro_oracao');
    setStep('completed');
  };

  const handleSkipTimer = () => {
    handleTimerComplete();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Breathing animation variants
  const breathingVariants = {
    inhale: {
      scale: 1.35,
      backgroundColor: "rgba(16, 185, 129, 0.2)",
      borderColor: "rgba(16, 185, 129, 0.6)",
      transition: { duration: 4, ease: "easeInOut" }
    },
    hold_full: {
      scale: 1.35,
      backgroundColor: "rgba(20, 184, 166, 0.25)",
      borderColor: "rgba(20, 184, 166, 0.7)",
      transition: { duration: 4, ease: "linear" }
    },
    exhale: {
      scale: 0.95,
      backgroundColor: "rgba(99, 102, 241, 0.15)",
      borderColor: "rgba(99, 102, 241, 0.5)",
      transition: { duration: 4, ease: "easeInOut" }
    },
    hold_empty: {
      scale: 0.95,
      backgroundColor: "rgba(148, 163, 184, 0.1)",
      borderColor: "rgba(148, 163, 184, 0.4)",
      transition: { duration: 4, ease: "linear" }
    }
  };

  if (!isOpen) return null;

  return (
    <div id="quick-prayer-overlay" className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <div 
        id="quick-prayer-container" 
        className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden w-full max-w-lg flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-slate-950 shadow-md shadow-emerald-500/10">
              <Heart size={16} className="fill-slate-950" />
            </div>
            <div>
              <h2 className="font-display font-bold text-white text-base">Clamor Rápido</h2>
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Momento Intencional de Oração</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
            title="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form or Timer Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: INPUT FORM */}
            {step === 'form' && (
              <motion.form 
                key="prayer-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleSaveAndProceed}
                className="space-y-5 text-slate-200"
              >
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1.5">O que está no seu coração?</label>
                  <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Gratidão pela semana / Fortalecimento na fé"
                    required
                    maxLength={100}
                    className="w-full bg-slate-850 border border-slate-750 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-white transition-all placeholder:text-slate-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1.5">Categoria</label>
                    <div className="relative">
                      <select 
                        value={category} 
                        onChange={(e) => setCategory(e.target.value as any)}
                        className="w-full bg-slate-850 border border-slate-750 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 text-white font-medium appearance-none cursor-pointer"
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat.value} value={cat.value}>
                            {cat.emoji} {cat.label}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                        <ChevronRight size={14} className="rotate-90" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1.5">Quem Clama (Opcional)</label>
                    <input 
                      type="text" 
                      value={requesterName}
                      onChange={(e) => setRequesterName(e.target.value)}
                      placeholder="Seu nome"
                      maxLength={50}
                      className="w-full bg-slate-850 border border-slate-750 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-white transition-all placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1.5">Súplica / Detalhes</label>
                  <textarea 
                    rows={3}
                    value={request}
                    onChange={(e) => setRequest(e.target.value)}
                    placeholder="Descreva aqui o motivo das suas orações, versículos de apoio ou situações específicas que precisam de intercessão..."
                    required
                    maxLength={1000}
                    className="w-full bg-slate-850 border border-slate-750 rounded-xl p-4 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-white transition-all placeholder:text-slate-500 resize-none"
                  />
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-2 flex items-center gap-1.5">
                    <Timer size={12} className="text-emerald-400" />
                    Silêncio Meditativo Opcional
                  </label>
                  <p className="text-[11px] text-slate-400 leading-normal mb-3">
                    Após registrar, reserve um momento para aquietar o coração e ouvir a Deus em silêncio. Um cronômetro guiará sua respiração e tocará um carrilhão celestial ao fim.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {TIMER_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setDuration(opt.value)}
                        className={`py-2.5 px-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center ${
                          duration === opt.value
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold'
                            : 'bg-slate-850 border-slate-750 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        {opt.value === 0 ? 'Sem Timer' : `${opt.value / 60} Min`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button 
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl border border-slate-750 text-slate-400 hover:text-white hover:bg-slate-800 text-sm font-semibold transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 hover:text-slate-900 font-bold text-sm shadow-lg shadow-emerald-500/10 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check size={16} />
                    <span>{duration > 0 ? 'Gravar & Iniciar Silêncio' : 'Gravar Oração'}</span>
                  </button>
                </div>
              </motion.form>
            )}

            {/* STEP 2: MEDITATIVE TIMER */}
            {step === 'timer' && (
              <motion.div 
                key="prayer-timer"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-6 text-center space-y-6 select-none"
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold">Aquietai-vos e Sabei</span>
                  <h3 className="text-lg font-bold text-white max-w-xs mx-auto truncate">"{title}"</h3>
                  <p className="text-[11px] text-slate-400">Em oração e silêncio diante do Senhor</p>
                </div>

                {/* Animated Breathing Ring */}
                <div className="relative w-52 h-52 flex items-center justify-center my-4">
                  {/* Outer Pulsing Aura */}
                  <motion.div 
                    animate={breathPhase}
                    variants={breathingVariants}
                    className="absolute w-44 h-44 rounded-full border-2 flex items-center justify-center shadow-lg"
                  />

                  {/* Inner breathing circle */}
                  <div className="absolute w-36 h-36 rounded-full bg-slate-900 border border-slate-800 flex flex-col items-center justify-center z-10 shadow-inner">
                    <span className="text-3xl font-mono font-bold text-white tracking-tight leading-none">
                      {formatTime(timeLeft)}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 uppercase mt-1">RESTANTE</span>
                  </div>

                  {/* Little wind icon breathing visualizer decoration */}
                  <motion.div 
                    animate={{ rotate: isTimerRunning ? 360 : 0 }}
                    transition={{ repeat: Infinity, duration: 16, ease: "linear" }}
                    className="absolute text-emerald-400/20 z-0 pointer-events-none"
                  >
                    <Wind size={200} strokeWidth={0.5} />
                  </motion.div>
                </div>

                {/* Breathing Guide text indicator */}
                <div className="h-10 flex flex-col items-center justify-center">
                  <motion.p 
                    key={breathText}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-emerald-300 text-sm font-medium tracking-wide"
                  >
                    {breathText}
                  </motion.p>
                  
                  {isTimerRunning && (
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-1">
                      Respiração Quadrada (4-4-4-4)
                    </span>
                  )}
                </div>

                {/* Timer Controls bar */}
                <div className="flex items-center gap-4 pt-4">
                  {/* Sound Toggle */}
                  <button 
                    onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                    className="p-3 rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title={isSoundEnabled ? "Mutar som ao terminar" : "Ativar som ao terminar"}
                  >
                    {isSoundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  </button>

                  {/* Play/Pause */}
                  <button 
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                    className={`p-4 rounded-full transition-all shadow-lg active:scale-95 cursor-pointer ${
                      isTimerRunning 
                        ? 'bg-slate-800 border border-slate-700 text-emerald-400 hover:text-emerald-300' 
                        : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                    }`}
                  >
                    {isTimerRunning ? <Pause size={20} className="fill-emerald-400" /> : <Play size={20} className="fill-slate-950 ml-0.5" />}
                  </button>

                  {/* Complete/Skip */}
                  <button 
                    onClick={handleSkipTimer}
                    className="p-3 rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="Concluir silêncio"
                  >
                    <Check size={16} />
                  </button>
                </div>

                <div className="w-full max-w-xs bg-slate-800/40 border border-slate-750 rounded-2xl p-4 mt-2">
                  <p className="text-[10px] text-slate-400 leading-normal italic font-light">
                    "Busquei o Senhor, e ele me acolheu; livrou-me de todos os meus temores." — Salmos 34:4
                  </p>
                </div>
              </motion.div>
            )}

            {/* STEP 3: COMPLETED / VERSE SCREEN */}
            {step === 'completed' && (
              <motion.div 
                key="prayer-completed"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center text-center py-6 space-y-6"
              >
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Check size={40} className="stroke-emerald-400" />
                  </div>
                  {/* Floating sparkles */}
                  <Sparkles size={18} className="absolute -top-1 -right-1 text-amber-400 animate-pulse" />
                  <Heart size={16} className="absolute -bottom-1 -left-1 text-rose-500 fill-rose-500" />
                </div>

                <div className="space-y-2">
                  <h3 className="font-display font-black text-2xl text-white">Clamor Entregue!</h3>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    {duration > 0 
                      ? "Seu pedido foi registrado e sua alma se aquietou diante de Deus. Seu coração está em comunhão."
                      : "Seu pedido de oração e clamor rápido foi gravado e guardado na nuvem espiritual."
                    }
                  </p>
                </div>

                {/* Verse Card */}
                <div className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 text-slate-700">
                    <BookOpen size={48} strokeWidth={1} />
                  </div>
                  <div className="relative z-10 space-y-3">
                    <p className="text-slate-200 text-xs md:text-sm leading-relaxed font-light italic">
                      "{selectedVerse.text}"
                    </p>
                    <span className="inline-block text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-bold">
                      {selectedVerse.ref}
                    </span>
                  </div>
                </div>

                <button 
                  onClick={onClose}
                  className="w-full sm:w-auto px-10 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 hover:text-slate-900 font-bold text-sm shadow-lg shadow-emerald-500/15 transition-all cursor-pointer"
                >
                  Confirmar & Fechar Amém
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
