import React, { useState, useEffect } from 'react';
import { DICTIONARY_TERMS, removeAccents } from '../database/dictionaryData';
import { DICTIONARY_CATEGORIES } from '../constants';
import { TheologicalTerm } from '../types';
import { useRewards } from '../contexts/RewardContext';
import { Search, Compass, BookOpen, Sparkles, Loader2, AlertTriangle, ArrowRight } from 'lucide-react';

export const Dictionary: React.FC = () => {
  const { addXp, unlockBadge } = useRewards();

  // Search & Navigation
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);

  // Dictionary State
  const [terms, setTerms] = useState<TheologicalTerm[]>(DICTIONARY_TERMS);
  const [selectedTerm, setSelectedTerm] = useState<TheologicalTerm | null>(DICTIONARY_TERMS[0]);

  // AI Expander State
  const [isExpanding, setIsExpanding] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  // Filter logic
  useEffect(() => {
    let filtered = DICTIONARY_TERMS;

    if (selectedCategory !== 'Todos') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    if (selectedLetter) {
      filtered = filtered.filter(t => removeAccents(t.term).toUpperCase().startsWith(selectedLetter));
    }

    if (searchQuery.trim()) {
      const cleanQuery = removeAccents(searchQuery.toLowerCase());
      filtered = filtered.filter(t => {
        const cleanTerm = removeAccents(t.term.toLowerCase());
        const cleanDef = removeAccents(t.definition.toLowerCase());
        return cleanTerm.includes(cleanQuery) || cleanDef.includes(cleanQuery);
      });
    }

    setTerms(filtered);
  }, [searchQuery, selectedCategory, selectedLetter]);

  // Request Gemini Expansion
  const handleAiExpansion = async (wordToExpand: string) => {
    setIsExpanding(true);
    setAiError(null);

    try {
      const response = await fetch(`/api/dictionary?word=${encodeURIComponent(wordToExpand)}`);
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Falha ao processar termo com Inteligência Artificial.');
      }

      const expandedTerm: TheologicalTerm = await response.json();

      // Temporarily add to the state list
      setTerms(prev => {
        if (prev.find(t => t.term === expandedTerm.term)) return prev;
        return [expandedTerm, ...prev];
      });

      setSelectedTerm(expandedTerm);
      addXp(30, `Expandiu termo teológico: ${expandedTerm.term}`);
      unlockBadge('teologo_junior');

    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'Serviço de IA temporariamente indisponível. Verifique suas chaves de API.');
    } finally {
      setIsExpanding(false);
    }
  };

  const handleSelectTerm = (term: TheologicalTerm) => {
    setSelectedTerm(term);
    addXp(10, `Visualizou definição: ${term.term}`);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Page Title */}
      <div className="border-b border-slate-200 pb-4">
        <h2 className="font-display font-bold text-3xl text-slate-900 tracking-tight">
          Dicionário Teológico PRO
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Explore mais de 1000 termos, conceitos sistemáticos, etimologias clássicas e perspectivas reformadas.
        </p>
      </div>

      {/* AZ Index bar */}
      <div className="bg-slate-100 p-2.5 rounded-xl border border-slate-200 overflow-x-auto flex gap-1 scrollbar-none">
        <button
          onClick={() => setSelectedLetter(null)}
          className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
            selectedLetter === null ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-200/50'
          }`}
        >
          TODOS
        </button>
        {alphabet.map(letter => (
          <button
            key={letter}
            onClick={() => setSelectedLetter(letter)}
            className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-all ${
              selectedLetter === letter ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-200/50'
            }`}
          >
            {letter}
          </button>
        ))}
      </div>

      {/* Search & Filter bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <input 
            type="text"
            placeholder="Pesquisar palavra (ex: Soteriologia, Exegese...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white text-slate-800 border border-slate-200 px-3 py-2 pl-10 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm"
          />
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
        </div>

        {/* Category toggles */}
        <div className="flex flex-wrap gap-2">
          {DICTIONARY_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                selectedCategory === cat 
                  ? 'bg-emerald-500/10 text-emerald-700 border-emerald-300 font-bold' 
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: List of terms */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm h-[500px] flex flex-col">
          <h3 className="font-display font-bold text-slate-900 text-sm mb-3 px-1 uppercase tracking-wider text-slate-400">
            Termos Disponíveis ({terms.length})
          </h3>
          
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {terms.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                <p>Nenhum termo encontrado.</p>
                {searchQuery.trim() && (
                  <button
                    onClick={() => handleAiExpansion(searchQuery)}
                    className="mt-3 inline-flex items-center gap-1.5 bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-emerald-700 font-semibold"
                  >
                    <Sparkles size={12} />
                    <span>Perguntar ao Teólogo IA</span>
                  </button>
                )}
              </div>
            ) : (
              terms.map(t => (
                <button
                  key={t.id}
                  onClick={() => handleSelectTerm(t)}
                  className={`w-full text-left p-3 rounded-xl border text-sm transition-all flex items-center justify-between group ${
                    selectedTerm?.id === t.id 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-medium' 
                      : 'border-slate-100 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div>
                    <p className="font-display font-bold text-slate-800">{t.term}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{t.category}</p>
                  </div>
                  <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 text-emerald-600 transition-all" />
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right column: Term details */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm min-h-[500px] flex flex-col justify-between">
          {isExpanding ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-12">
              <Loader2 size={36} className="animate-spin text-emerald-500 mb-3" />
              <p className="text-sm font-display font-bold text-slate-800">
                Consultando Academias de Teologia IA...
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Aguarde enquanto extraímos etimologia clássica e referências exatas.
              </p>
            </div>
          ) : selectedTerm ? (
            <div className="space-y-6">
              {/* Header Details */}
              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3 justify-between">
                  <h1 className="font-display font-black text-2xl text-slate-900">
                    {selectedTerm.term}
                  </h1>
                  <span className="bg-slate-100 text-slate-800 border border-slate-200 px-3 py-1 rounded-full text-xs font-mono font-medium">
                    {selectedTerm.category}
                  </span>
                </div>
                <p className="text-xs italic text-slate-500 mt-1.5 font-sans">
                  {selectedTerm.etymology}
                </p>
              </div>

              {/* Definition */}
              <div>
                <h4 className="text-xs font-mono uppercase tracking-wider font-semibold text-slate-400 mb-2">
                  Definição Enciclopédica
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed font-sans">
                  {selectedTerm.definition}
                </p>
              </div>

              {/* Theological Perspective */}
              <div className="bg-emerald-50/20 border border-emerald-100 rounded-2xl p-4">
                <h4 className="text-xs font-mono uppercase tracking-wider font-semibold text-emerald-700 mb-2">
                  Perspectiva Histórica e Teológica
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed font-sans">
                  {selectedTerm.theologicalPerspective}
                </p>
              </div>

              {/* Biblical references */}
              <div>
                <h4 className="text-xs font-mono uppercase tracking-wider font-semibold text-slate-400 mb-2">
                  Referências Bíblicas Claves
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedTerm.biblicalReferences.map((ref, idx) => (
                    <span 
                      key={idx}
                      className="bg-slate-100 text-slate-800 border border-slate-200 px-3 py-1 rounded-lg text-xs font-mono font-bold"
                    >
                      {ref}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-12">
              <Compass size={40} className="text-slate-300 mb-2" />
              <p className="text-sm">Selecione um verbete ao lado para ler.</p>
            </div>
          )}

          {/* Deepen with AI Footer control */}
          {selectedTerm && (
            <div className="border-t border-slate-100 pt-4 mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-amber-500" />
                <p className="text-xs text-slate-500">
                  Quer exegeses extras sobre este conceito específico?
                </p>
              </div>
              <button 
                onClick={() => handleAiExpansion(selectedTerm.term)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 self-end sm:self-auto"
              >
                <span>Aprofundar Termo por IA</span>
                <Sparkles size={12} className="text-amber-400 animate-pulse" />
              </button>
            </div>
          )}

          {/* Error alerts */}
          {aiError && (
            <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangle size={16} className="text-rose-600 flex-shrink-0" />
              <span>{aiError}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default Dictionary;
