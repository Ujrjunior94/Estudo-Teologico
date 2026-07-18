import React, { useState } from 'react';
import { useRewards } from '../contexts/RewardContext';
import { dbService } from '../database/db';
import { THEMATIC_DEVOTIONALS, DevotionalItem, DEVOTIONAL_JOURNEYS, DevotionalJourney, DevotionalDay } from '../constants/devotionals';
import { sendChatMessage } from '../api/chat';
import { 
  Sparkles, 
  Heart, 
  Shield, 
  Flower, 
  Briefcase, 
  Anchor, 
  Unlock, 
  CheckCircle, 
  ArrowRight, 
  Loader2, 
  BookOpen, 
  Copy, 
  Share2, 
  Save,
  Check,
  AlertCircle,
  Wind,
  Compass,
  Flame,
  HeartHandshake,
  Feather,
  Calendar,
  Award
} from 'lucide-react';

interface DevotionalsProps {
  setActiveTab: (tab: string) => void;
  setSelectedBibleRef: (ref: { bookId: string; chapter: number }) => void;
}

export const Devotionals: React.FC<DevotionalsProps> = ({ setActiveTab, setSelectedBibleRef }) => {
  const { addXp } = useRewards();

  // Mode state: 'daily' (single thematic) or 'journey' (multi-day deep study)
  const [activeSubTab, setActiveSubTab] = useState<'daily' | 'journey'>('daily');

  // Daily Devotional Active state
  const [selectedDevotional, setSelectedDevotional] = useState<DevotionalItem | null>(null);
  const [completedList, setCompletedList] = useState<string[]>(() => {
    const saved = localStorage.getItem('EstudoBiblicoTeologicoPRO_CompletedDevotionals');
    return saved ? JSON.parse(saved) : [];
  });

  // Journey Devotional states
  const [selectedJourney, setSelectedJourney] = useState<DevotionalJourney | null>(() => {
    return DEVOTIONAL_JOURNEYS[0] || null;
  });
  const [selectedJourneyDay, setSelectedJourneyDay] = useState<number>(1);
  const [completedJourneyDays, setCompletedJourneyDays] = useState<string[]>(() => {
    const saved = localStorage.getItem('EstudoBiblicoTeologicoPRO_CompletedJourneyDays');
    return saved ? JSON.parse(saved) : [];
  });

  // AI Generation states
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiGeneratedText, setAiGeneratedText] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [customError, setCustomError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [savedStatus, setSavedStatus] = useState(false);

  // Devotional journaling notes state
  const [personalJournal, setPersonalJournal] = useState<{ [id: string]: string }>(() => {
    const saved = localStorage.getItem('EstudoBiblicoTeologicoPRO_DevotionalJournal');
    return saved ? JSON.parse(saved) : {};
  });

  const handleUpdateJournal = (id: string, text: string) => {
    const updated = { ...personalJournal, [id]: text };
    setPersonalJournal(updated);
    localStorage.setItem('EstudoBiblicoTeologicoPRO_DevotionalJournal', JSON.stringify(updated));
  };

  // Helper to match category icons
  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'casais':
        return <Heart className="text-rose-500" size={24} />;
      case 'desafios-homem':
        return <Shield className="text-blue-500" size={24} />;
      case 'mulher-sabia':
        return <Flower className="text-purple-500" size={24} />;
      case 'deus-negocios':
        return <Briefcase className="text-amber-500" size={24} />;
      case 'momentos-dificeis':
        return <Anchor className="text-sky-500" size={24} />;
      case 'resgatado':
        return <Unlock className="text-emerald-500" size={24} />;
      case 'ansiedade-paz':
        return <Wind className="text-teal-500" size={24} />;
      case 'jovens-proposito':
        return <Compass className="text-violet-500" size={24} />;
      case 'disciplinas-espirituais':
        return <Flame className="text-orange-500" size={24} />;
      case 'perdao-restauracao':
        return <HeartHandshake className="text-pink-500" size={24} />;
      default:
        return <Sparkles className="text-indigo-500" size={24} />;
    }
  };

  // Complete Devotional
  const handleCompleteDevotional = (id: string, xpReward: number, title: string) => {
    if (completedList.includes(id)) return;
    const updated = [...completedList, id];
    setCompletedList(updated);
    localStorage.setItem('EstudoBiblicoTeologicoPRO_CompletedDevotionals', JSON.stringify(updated));
    addXp(xpReward, `Devocional concluído: ${title} 🎉`);
  };

  // Complete Journey Day
  const handleCompleteJourneyDay = (journeyId: string, dayNumber: number, xpReward: number, journeyTitle: string, dayTitle: string) => {
    const key = `${journeyId}_${dayNumber}`;
    if (completedJourneyDays.includes(key)) return;
    const updated = [...completedJourneyDays, key];
    setCompletedJourneyDays(updated);
    localStorage.setItem('EstudoBiblicoTeologicoPRO_CompletedJourneyDays', JSON.stringify(updated));
    addXp(xpReward, `Jornada: ${journeyTitle} - Dia ${dayNumber}: ${dayTitle} 🎉`);
  };

  // Copy to clipboard
  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Send Scripture reference to Bible tab
  const handleGoToBible = (scripture: string) => {
    // Parse first book and chapter if possible, e.g., "Eclesiastes 4:9-12" -> book: Eclesiastes, chapter: 4
    let bookId = 'GEN';
    let chapter = 1;

    if (scripture.includes('Eclesiastes 12')) {
      bookId = 'ECC';
      chapter = 12;
    } else if (scripture.includes('Eclesiastes')) {
      bookId = 'ECC';
      chapter = 4;
    } else if (scripture.includes('2 Coríntios 10')) {
      bookId = '2CO';
      chapter = 10;
    } else if (scripture.includes('2 Coríntios 1')) {
      bookId = '2CO';
      chapter = 1;
    } else if (scripture.includes('Coríntios')) {
      bookId = '1CO';
      chapter = 16;
    } else if (scripture.includes('Provérbios 14')) {
      bookId = 'PRO';
      chapter = 14;
    } else if (scripture.includes('Provérbios 16')) {
      bookId = 'PRO';
      chapter = 16;
    } else if (scripture.includes('Colossenses 3')) {
      bookId = 'COL';
      chapter = 3;
    } else if (scripture.includes('Colossenses')) {
      bookId = 'COL';
      chapter = 1;
    } else if (scripture.includes('Romanos 12')) {
      bookId = 'ROM';
      chapter = 12;
    } else if (scripture.includes('1 Pedro 1')) {
      bookId = '1PE';
      chapter = 1;
    } else if (scripture.includes('Jó 23')) {
      bookId = 'JOB';
      chapter = 23;
    } else if (scripture.includes('Deuteronômio 6')) {
      bookId = 'DEU';
      chapter = 6;
    } else if (scripture.includes('Efésios 5')) {
      bookId = 'EPH';
      chapter = 5;
    } else if (scripture.includes('Josué 24')) {
      bookId = 'JOS';
      chapter = 24;
    } else if (scripture.includes('Salmo')) {
      bookId = 'PSA';
      chapter = 46;
    } else if (scripture.includes('Filipenses')) {
      bookId = 'PHP';
      chapter = 4;
    } else if (scripture.includes('Mateus')) {
      bookId = 'MAT';
      chapter = 6;
    }

    setSelectedBibleRef({ bookId, chapter });
    setActiveTab('bible');
  };

  // Save Journey Day to Notes
  const handleSaveJourneyDayToStudies = async (journey: DevotionalJourney, day: DevotionalDay) => {
    const journalKey = `${journey.id}_day_${day.dayNumber}`;
    const journalText = personalJournal[journalKey] || '';

    let markdownContent = `
# ${journey.title} - Dia ${day.dayNumber}: ${day.title}
*Série de Estudos Teológicos: ${journey.category}*
*Referência: ${day.scripture}*

## Passagem Bíblica
${day.passageText}

## Reflexão Profunda
${day.reflection}

## Desafio Prático do Dia
${day.practicalChallenge}

## Oração Diária
${day.prayer}
    `.trim();

    if (journalText.trim()) {
      markdownContent += `\n\n## Minhas Anotações & Oração Pessoal\n${journalText.trim()}`;
    }

    const newNote = {
      id: `note_journey_${journey.id}_${day.dayNumber}_${Date.now()}`,
      title: `Estudo: ${journey.title} (Dia ${day.dayNumber})`,
      content: markdownContent,
      category: 'Devocionais',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await dbService.saveNote(newNote);
      setSavedStatus(true);
      addXp(15, `Salvou dia da jornada nos estudos`);
      setTimeout(() => setSavedStatus(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  // Save AI or standard Devotional to Notes
  const handleSaveToStudies = async (devotional: DevotionalItem, contentOverride?: string) => {
    const journalText = personalJournal[devotional.id] || '';

    let markdownContent = contentOverride || `
# ${devotional.title}
*Referência: ${devotional.scripture}*

## Passagem Bíblica
${devotional.passageText}

## Reflexão Teológica
${devotional.reflection}

## Desafio Prático do Dia
${devotional.practicalChallenge}

## Oração sugerida
${devotional.prayer}
    `.trim();

    if (journalText.trim()) {
      markdownContent += `\n\n## Minhas Anotações & Oração Pessoal\n${journalText.trim()}`;
    }

    const newNote = {
      id: `note_dev_${Date.now()}`,
      title: `Estudo Devocional: ${devotional.title}`,
      content: markdownContent,
      category: 'Devocionais',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await dbService.saveNote(newNote);
      setSavedStatus(true);
      addXp(15, `Salvou devocional nos estudos`);
      setTimeout(() => setSavedStatus(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  // Generate / Regenerate with Gemini AI
  const handleGenerateAI = async (devotional: DevotionalItem) => {
    setIsGenerating(true);
    setCustomError(null);
    setAiGeneratedText(null);

    const messagePayload = [
      {
        id: 'user_prompt',
        role: 'user' as const,
        content: `Gere um devocional teológico profundo e edificante sob o tema "${devotional.title}" (${devotional.category}), com base na passagem bíblica de ${devotional.scripture}.
        
Siga RIGOROSAMENTE esta estrutura em Markdown:
# ${devotional.title} (Aprofundado com IA)
*Referência: ${devotional.scripture}*

## 📖 Passagem Chave
[Adicione um versículo em destaque sobre o tema]

## 💡 Reflexão Teológica Profunda
[Escreva 2 ou 3 parágrafos de reflexão hermenêutica acadêmica e sensibilidade espiritual sobre os desafios diários desse tema na atualidade]

## 🎯 Desafio Prático de Fé
[Proponha um desafio prático e claro de aplicação hoje]

## 🙏 Oração de Aliança
[Uma oração final escrita na primeira pessoa]`,
        createdAt: new Date().toISOString()
      }
    ];

    try {
      const responseText = await sendChatMessage(messagePayload, 'devocional');
      if (responseText) {
        setAiGeneratedText(responseText);
        addXp(30, `Aprofundou devocional com IA: ${devotional.title}`);
      } else {
        setCustomError('Não foi possível obter resposta do servidor do Assistente Teológico.');
      }
    } catch (err: any) {
      console.error(err);
      try {
        const parsedErr = JSON.parse(err.message);
        setCustomError(`Erro de IA: ${parsedErr.error || parsedErr.message || err.message}`);
      } catch {
        setCustomError('Falha ao conectar com o Gemini no servidor. Verifique a chave de API nos Secrets.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="font-display font-bold text-3xl text-slate-900 tracking-tight">
              Devocionais e Jornadas Teológicas
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Explore reflexões bíblicas de alta maturidade espiritual e teológica em dias seguidos de estudo ou temas rápidos.
            </p>
          </div>
          
          {/* Sub-Tab Selector */}
          <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex self-start md:self-auto shrink-0">
            <button
              onClick={() => {
                setActiveSubTab('daily');
                // Auto select first devotional if none selected
                if (!selectedDevotional) setSelectedDevotional(THEMATIC_DEVOTIONALS[0]);
              }}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeSubTab === 'daily'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <BookOpen size={14} />
              <span>Devocionais Diários</span>
            </button>
            <button
              onClick={() => {
                setActiveSubTab('journey');
                if (!selectedJourney) setSelectedJourney(DEVOTIONAL_JOURNEYS[0]);
              }}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all relative ${
                activeSubTab === 'journey'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Calendar size={14} />
              <span>Jornadas Multi-Dias</span>
              <span className="absolute -top-1.5 -right-1.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </button>
          </div>
        </div>
      </div>

      {activeSubTab === 'daily' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Categories Grid (Left Column) */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-xs font-mono uppercase text-slate-400 font-bold tracking-wider">
              Selecione uma Temática
            </h3>
            <div className="space-y-3">
              {THEMATIC_DEVOTIONALS.map((dev) => {
                const isSelected = selectedDevotional?.id === dev.id;
                const isCompleted = completedList.includes(dev.id);

                return (
                  <button
                    key={dev.id}
                    onClick={() => {
                      setSelectedDevotional(dev);
                      setAiGeneratedText(null);
                      setCustomError(null);
                    }}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500 shadow-sm ring-1 ring-emerald-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex-shrink-0">
                        {getCategoryIcon(dev.slug)}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400 block mb-0.5">
                          {dev.category}
                        </span>
                        <h4 className="font-display font-bold text-slate-950 text-sm truncate leading-snug">
                          {dev.title}
                        </h4>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {isCompleted ? (
                        <CheckCircle className="text-emerald-500" size={18} />
                      ) : (
                        <ArrowRight className="text-slate-300" size={16} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Viewer (Right Columns) */}
          <div className="lg:col-span-2">
            {selectedDevotional ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
                {/* Devotional Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
                  <div>
                    <span className="bg-slate-100 text-slate-800 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {selectedDevotional.category}
                    </span>
                    <h3 className="font-display font-bold text-2xl text-slate-950 mt-1.5 leading-snug">
                      {selectedDevotional.title}
                    </h3>
                    <button 
                      onClick={() => handleGoToBible(selectedDevotional.scripture)}
                      className="text-xs font-medium text-emerald-600 hover:underline mt-1 block flex items-center gap-1.5"
                    >
                      <BookOpen size={13} />
                      <span>Estudar passagem: {selectedDevotional.scripture}</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleCopyToClipboard(
                        aiGeneratedText || 
                        `${selectedDevotional.title}\n${selectedDevotional.scripture}\n\n${selectedDevotional.passageText}\n\nReflexão:\n${selectedDevotional.reflection}\n\nDesafio:\n${selectedDevotional.practicalChallenge}\n\nOração:\n${selectedDevotional.prayer}`
                      )}
                      className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-all"
                      title="Copiar devocional"
                    >
                      {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                    </button>
                    <button
                      onClick={() => handleSaveToStudies(selectedDevotional, aiGeneratedText || undefined)}
                      className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-all flex items-center gap-1.5 text-xs font-medium"
                      title="Salvar nos meus estudos"
                    >
                      <Save size={16} className={savedStatus ? "text-emerald-500" : ""} />
                      <span>{savedStatus ? "Salvo!" : "Salvar nos Estudos"}</span>
                    </button>
                  </div>
                </div>

                {/* Devotional Main Body */}
                {aiGeneratedText ? (
                  // Render live generated AI devotional
                  <div className="space-y-6">
                    <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-start gap-2.5">
                      <Sparkles className="text-indigo-600 flex-shrink-0 mt-0.5 animate-pulse" size={16} />
                      <div className="text-xs text-indigo-900 font-sans leading-relaxed">
                        Este devocional foi <strong>expandido e aprofundado pelo teólogo IA do Gemini</strong>. Sinta-se livre para copiar, salvar nos estudos ou restaurar a versão original.
                      </div>
                    </div>

                    <div className="text-sm font-sans text-slate-800 leading-relaxed space-y-4 whitespace-pre-wrap select-text markdown-body">
                      {aiGeneratedText}
                    </div>
                  </div>
                ) : (
                  // Render curated, highly polished devotional
                  <div className="space-y-6">
                    {/* Scripture Quote */}
                    <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl relative overflow-hidden">
                      <span className="absolute right-3 top-3 text-6xl font-display font-black text-slate-100/70 select-none">“</span>
                      <p className="text-slate-800 italic font-sans text-sm leading-relaxed relative z-10">
                        {selectedDevotional.passageText}
                      </p>
                    </div>

                    {/* Reflection */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-mono uppercase text-slate-400 font-bold">Reflexão Teológica</h4>
                      <p className="text-slate-700 font-sans text-sm leading-relaxed">
                        {selectedDevotional.reflection}
                      </p>
                    </div>

                    {/* Practical Challenge */}
                    <div className="space-y-2 border-t border-slate-100 pt-4">
                      <h4 className="text-xs font-mono uppercase text-slate-400 font-bold">Desafio Prático do Dia</h4>
                      <p className="text-slate-700 font-sans text-sm leading-relaxed bg-emerald-50/40 p-4 rounded-xl border border-emerald-100/50">
                        {selectedDevotional.practicalChallenge}
                      </p>
                    </div>

                    {/* Prayer */}
                    <div className="space-y-2 border-t border-slate-100 pt-4">
                      <h4 className="text-xs font-mono uppercase text-slate-400 font-bold">Oração Sugerida</h4>
                      <p className="text-slate-700 font-sans text-sm leading-relaxed italic bg-blue-50/30 p-4 rounded-xl border border-blue-100/30">
                        {selectedDevotional.prayer}
                      </p>
                    </div>
                  </div>
                )}

                {/* Journaling section */}
                <div className="space-y-3 border-t border-slate-100 pt-5">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Feather size={16} className="text-emerald-600 animate-pulse" />
                      <h4 className="text-xs font-mono uppercase text-slate-500 font-bold">
                        Meu Diário Devocional & Oração Pessoal
                      </h4>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">Salvamento Automático</span>
                  </div>
                  <textarea
                    value={personalJournal[selectedDevotional.id] || ''}
                    onChange={(e) => handleUpdateJournal(selectedDevotional.id, e.target.value)}
                    placeholder="Escreva aqui suas reflexões pessoais, orações sinceras, arrependimentos, compromissos com Deus ou o que o Espírito Santo tocou em seu coração hoje..."
                    rows={4}
                    className="w-full p-4 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 text-sm placeholder-slate-400 font-sans text-slate-800 transition-all bg-slate-50/50 resize-none"
                  />
                  <p className="text-[11px] text-slate-400">
                    📝 Suas anotações são salvas localmente de forma privada e serão integradas caso você salve este devocional na aba "Meus Estudos".
                  </p>
                </div>

                {/* Error state */}
                {customError && (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 space-y-1.5 animate-fade-in flex items-start gap-2.5">
                    <AlertCircle size={18} className="text-rose-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs leading-relaxed font-sans">
                      <strong>Erro de IA:</strong> {customError}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <button
                    onClick={() => handleGenerateAI(selectedDevotional)}
                    disabled={isGenerating}
                    className="w-full sm:w-auto text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Processando Hermenêutica...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} className="text-indigo-200" />
                        <span>Gerar Versão Estendida com IA</span>
                      </>
                    )}
                  </button>

                  {aiGeneratedText && (
                    <button
                      onClick={() => setAiGeneratedText(null)}
                      className="text-xs text-slate-500 hover:text-slate-800 font-medium py-2 px-3"
                    >
                      Restaurar Versão Curada
                    </button>
                  )}

                  {!completedList.includes(selectedDevotional.id) ? (
                    <button
                      onClick={() => handleCompleteDevotional(selectedDevotional.id, selectedDevotional.xpReward, selectedDevotional.title)}
                      className="w-full sm:w-auto text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <CheckCircle size={14} />
                      <span>Concluir Leitura (+{selectedDevotional.xpReward} XP)</span>
                    </button>
                  ) : (
                    <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                      <CheckCircle size={14} />
                      <span>Leitura Concluída!</span>
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm h-full flex flex-col justify-center items-center">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center text-slate-300 mb-4">
                  <BookOpen size={32} />
                </div>
                <h4 className="font-display font-bold text-slate-900 text-lg mb-1">Escolha um Devocional Temático</h4>
                <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
                  Nossos planos devocionais foram desenhados para responder aos principais dilemas espirituais modernos. Escolha um tema ao lado para iniciar.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        // JOURNEYS TAB
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Journeys List (Left Column) */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-xs font-mono uppercase text-slate-400 font-bold tracking-wider">
              Jornadas Teológicas Ativas
            </h3>
            <div className="space-y-3">
              {DEVOTIONAL_JOURNEYS.map((journey) => {
                const isSelected = selectedJourney?.id === journey.id;
                
                // Calculate progress
                const completedInThisJourney = journey.days.filter(d => 
                  completedJourneyDays.includes(`${journey.id}_${d.dayNumber}`)
                ).length;
                
                const isJourneyCompleted = completedInThisJourney === journey.durationDays;

                return (
                  <button
                    key={journey.id}
                    onClick={() => {
                      setSelectedJourney(journey);
                      setSelectedJourneyDay(1);
                    }}
                    className={`w-full text-left p-4 rounded-2xl border transition-all space-y-2 ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500 shadow-sm ring-1 ring-emerald-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[9px] font-mono uppercase tracking-wider font-bold text-slate-400 block mb-0.5">
                          {journey.category} • {journey.durationDays} Dias
                        </span>
                        <h4 className="font-display font-bold text-slate-950 text-sm leading-snug">
                          {journey.title}
                        </h4>
                      </div>
                      <div className="flex-shrink-0 mt-1">
                        {isJourneyCompleted ? (
                          <CheckCircle className="text-emerald-500" size={18} />
                        ) : (
                          <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                            {completedInThisJourney}/{journey.durationDays} D
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Short Description */}
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {journey.description}
                    </p>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-full transition-all duration-300" 
                        style={{ width: `${(completedInThisJourney / journey.durationDays) * 100}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Journey Viewer (Right Columns) */}
          <div className="lg:col-span-2">
            {selectedJourney ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
                {/* Journey Header */}
                <div className="border-b border-slate-100 pb-5">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <span className="bg-slate-100 text-slate-800 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        Série: {selectedJourney.category}
                      </span>
                      <h3 className="font-display font-bold text-2xl text-slate-950 mt-1.5 leading-snug">
                        {selectedJourney.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 max-w-xl">
                        {selectedJourney.description}
                      </p>
                    </div>

                    <div className="flex-shrink-0 bg-emerald-50 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-100 flex items-center gap-1.5 font-mono">
                      <Award size={14} className="text-emerald-600 animate-bounce" />
                      <span>+{selectedJourney.xpRewardPerDay} XP / Dia</span>
                    </div>
                  </div>

                  {/* Day Navigation Timeline / Tabs */}
                  <div className="mt-6 flex flex-wrap gap-2.5 p-1 bg-slate-50 rounded-2xl border border-slate-150">
                    {selectedJourney.days.map((day) => {
                      const isDaySelected = selectedJourneyDay === day.dayNumber;
                      const isDayCompleted = completedJourneyDays.includes(`${selectedJourney.id}_${day.dayNumber}`);

                      return (
                        <button
                          key={day.dayNumber}
                          onClick={() => setSelectedJourneyDay(day.dayNumber)}
                          className={`flex-1 min-w-[70px] text-center py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                            isDaySelected
                              ? 'bg-slate-900 text-white shadow-sm scale-102'
                              : 'hover:bg-slate-200/50 text-slate-600'
                          }`}
                        >
                          <span>Dia {day.dayNumber}</span>
                          {isDayCompleted && (
                            <CheckCircle size={12} className={isDaySelected ? "text-emerald-300" : "text-emerald-600"} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Active Day Content */}
                {(() => {
                  const activeDay = selectedJourney.days.find(d => d.dayNumber === selectedJourneyDay);
                  if (!activeDay) return null;

                  const dayCompletedKey = `${selectedJourney.id}_${activeDay.dayNumber}`;
                  const isCompleted = completedJourneyDays.includes(dayCompletedKey);
                  const journalKey = `${selectedJourney.id}_day_${activeDay.dayNumber}`;

                  return (
                    <div className="space-y-6 animate-fade-in">
                      {/* Day Title and Bible Reference */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-emerald-500/[0.03] p-4 rounded-2xl border border-emerald-500/10">
                        <div>
                          <span className="text-[10px] font-mono uppercase font-bold text-slate-400">
                            Dia {activeDay.dayNumber} de {selectedJourney.durationDays}
                          </span>
                          <h4 className="font-display font-black text-slate-900 text-lg leading-snug">
                            {activeDay.title}
                          </h4>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleGoToBible(activeDay.scripture)}
                            className="bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 transition-all flex items-center gap-1.5"
                          >
                            <BookOpen size={13} className="text-emerald-600" />
                            <span>Abrir na Bíblia</span>
                          </button>

                          <button
                            onClick={() => handleSaveJourneyDayToStudies(selectedJourney, activeDay)}
                            className="bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 transition-all flex items-center gap-1.5"
                            title="Salvar nos meus estudos"
                          >
                            <Save size={13} className={savedStatus ? "text-emerald-500" : ""} />
                            <span>{savedStatus ? "Salvo" : "Salvar"}</span>
                          </button>
                        </div>
                      </div>

                      {/* Scripture Quote */}
                      <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl relative overflow-hidden">
                        <span className="absolute right-3 top-3 text-6xl font-display font-black text-slate-100/70 select-none">“</span>
                        <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded block mb-2 w-max">
                          {activeDay.scripture}
                        </span>
                        <p className="text-slate-800 italic font-sans text-sm leading-relaxed relative z-10">
                          {activeDay.passageText}
                        </p>
                      </div>

                      {/* Reflection */}
                      <div className="space-y-2">
                        <h5 className="text-xs font-mono uppercase text-slate-400 font-bold">Reflexão Teológica Profunda</h5>
                        <p className="text-slate-700 font-sans text-sm leading-relaxed whitespace-pre-line">
                          {activeDay.reflection}
                        </p>
                      </div>

                      {/* Practical Challenge */}
                      <div className="space-y-2 border-t border-slate-100 pt-4">
                        <h5 className="text-xs font-mono uppercase text-slate-400 font-bold">Desafio Prático do Dia</h5>
                        <p className="text-slate-700 font-sans text-sm leading-relaxed bg-emerald-50/40 p-4 rounded-xl border border-emerald-100/50">
                          {activeDay.practicalChallenge}
                        </p>
                      </div>

                      {/* Prayer */}
                      <div className="space-y-2 border-t border-slate-100 pt-4">
                        <h5 className="text-xs font-mono uppercase text-slate-400 font-bold">Oração Sugerida</h5>
                        <p className="text-slate-700 font-sans text-sm leading-relaxed italic bg-blue-50/30 p-4 rounded-xl border border-blue-100/30">
                          {activeDay.prayer}
                        </p>
                      </div>

                      {/* Journaling section */}
                      <div className="space-y-3 border-t border-slate-100 pt-5">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Feather size={16} className="text-emerald-600 animate-pulse" />
                            <h5 className="text-xs font-mono uppercase text-slate-500 font-bold">
                              Diário de Estudo - Dia {activeDay.dayNumber}
                            </h5>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">Privado & Auto-salvamento</span>
                        </div>
                        <textarea
                          value={personalJournal[journalKey] || ''}
                          onChange={(e) => handleUpdateJournal(journalKey, e.target.value)}
                          placeholder="O que chamou sua atenção nesta lição de hoje? Escreva sua reflexão de aprendizagem, compromissos práticos ou uma oração redigida..."
                          rows={4}
                          className="w-full p-4 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 text-sm placeholder-slate-400 font-sans text-slate-800 transition-all bg-slate-50/50 resize-none"
                        />
                      </div>

                      {/* Complete Checkbox Button */}
                      <div className="border-t border-slate-100 pt-6 flex justify-end">
                        {!isCompleted ? (
                          <button
                            onClick={() => handleCompleteJourneyDay(
                              selectedJourney.id, 
                              activeDay.dayNumber, 
                              selectedJourney.xpRewardPerDay, 
                              selectedJourney.title, 
                              activeDay.title
                            )}
                            className="w-full sm:w-auto text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md"
                          >
                            <CheckCircle size={14} />
                            <span>Concluir Estudo do Dia (+{selectedJourney.xpRewardPerDay} XP)</span>
                          </button>
                        ) : (
                          <div className="flex flex-col sm:flex-row items-center gap-3">
                            <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-4 py-2.5 rounded-xl border border-emerald-100 flex items-center gap-1.5">
                              <CheckCircle size={14} />
                              <span>Estudo do Dia {activeDay.dayNumber} Concluído!</span>
                            </span>
                            {activeDay.dayNumber < selectedJourney.durationDays && (
                              <button
                                onClick={() => setSelectedJourneyDay(activeDay.dayNumber + 1)}
                                className="text-xs bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl transition-all"
                              >
                                Ir para o Dia {activeDay.dayNumber + 1}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm h-full flex flex-col justify-center items-center">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center text-slate-300 mb-4">
                  <Calendar size={32} />
                </div>
                <h4 className="font-display font-bold text-slate-900 text-lg mb-1">Inicie uma Jornada Teológica</h4>
                <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
                  Estudos bíblicos profundos estruturados em vários dias para guiar sua caminhada teológica sistemática e elevar o nível da sua devoção.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default Devotionals;
