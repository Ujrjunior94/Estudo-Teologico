import React, { useState, useEffect } from 'react';
import { useRewards } from '../contexts/RewardContext';
import { dbService } from '../database/db';
import { CreativeDesign } from '../types';
import { exportCanvasAsPNG } from '../utils';
import { 
  Palette, 
  Download, 
  Sparkles, 
  Loader2, 
  Type as FontIcon, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Trash2,
  FileImage,
  Layers,
  AlertTriangle,
  Award
} from 'lucide-react';

export const CreativeStudio: React.FC = () => {
  const { addXp, unlockBadge } = useRewards();

  // Selected slide design settings
  const [designType, setDesignType] = useState<'slide' | 'cover' | 'illustrated_verse'>('slide');
  const [slideTitle, setSlideTitle] = useState('Ensino de Domingo');
  const [verseText, setVerseText] = useState('O Senhor é o meu pastor; nada me faltará.');
  const [verseRef, setVerseRef] = useState('Salmos 23:1');

  // Background style states
  const [bgType, setBgType] = useState<'color' | 'image'>('color');
  const [bgColor, setBgColor] = useState('#0F172A');
  const [bgImage, setBgImage] = useState('');
  
  // Text configurations
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [fontFamily, setFontFamily] = useState('Inter');
  const [fontSize, setFontSize] = useState(36);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');

  // AI Background generator states
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingBg, setIsGeneratingBg] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Loaded designs list
  const [savedDesigns, setSavedDesigns] = useState<CreativeDesign[]>([]);

  useEffect(() => {
    loadSavedDesigns();
  }, []);

  const loadSavedDesigns = async () => {
    const list = await dbService.getDesigns();
    setSavedDesigns(list);
  };

  // Trigger Gemini AI Image Background generation
  const handleGenerateAiBg = async () => {
    if (!aiPrompt.trim()) return;

    setIsGeneratingBg(true);
    setGenerationError(null);

    try {
      const response = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          aspectRatio: '16:9'
        })
      });

      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error(`Erro inesperado no servidor (Status ${response.status}).`);
      }

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Falha ao processar imagem de fundo via IA.');
      }

      setBgImage(data.imageUrl);
      setBgType('image');
      addXp(40, 'Arte Teológica por IA');
      unlockBadge('estudio_criativo');

    } catch (err: any) {
      console.error(err);
      setGenerationError(err.message || 'A geração de arte por IA falhou. Verifique suas chaves de API e conexão.');
    } finally {
      setIsGeneratingBg(false);
    }
  };

  // Save design to IndexedDB local cache
  const handleSaveDesign = async () => {
    const newDesign: CreativeDesign = {
      id: `design_${Date.now()}`,
      type: designType,
      title: slideTitle,
      verseText,
      verseRef,
      backgroundType: bgType,
      backgroundValue: bgType === 'color' ? bgColor : bgImage,
      textColor,
      fontFamily,
      fontSize,
      textAlign,
      createdAt: new Date().toISOString()
    };

    await dbService.saveDesign(newDesign);
    await loadSavedDesigns();
    addXp(20, 'Design salvo no portfólio');
    unlockBadge('estudio_criativo');
  };

  // Perform crisp HTML5 canvas render & export
  const handleExportPNG = async () => {
    try {
      const currentBgValue = bgType === 'color' ? bgColor : bgImage;
      
      await exportCanvasAsPNG(
        slideTitle,
        verseText,
        verseRef,
        bgType,
        currentBgValue,
        textColor,
        fontFamily,
        textAlign
      );
      
      addXp(15, 'Slide Exportado como PNG');
    } catch (err) {
      console.error('Falha ao exportar imagem:', err);
      alert('Não foi possível exportar a imagem. Verifique se o ativo de imagem de fundo foi gerado corretamente.');
    }
  };

  const handleDeleteDesign = async (id: string) => {
    await dbService.deleteDesign(id);
    await loadSavedDesigns();
  };

  const handleApplySavedDesign = (design: CreativeDesign) => {
    setDesignType(design.type);
    setSlideTitle(design.title);
    setVerseText(design.verseText || '');
    setVerseRef(design.verseRef || '');
    setBgType(design.backgroundType);
    if (design.backgroundType === 'color') {
      setBgColor(design.backgroundValue);
    } else {
      setBgImage(design.backgroundValue);
    }
    setTextColor(design.textColor);
    setFontFamily(design.fontFamily);
    setFontSize(design.fontSize);
    setTextAlign(design.textAlign);
    addXp(5, 'Aplicou design salvo');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Page Title */}
      <div className="border-b border-slate-200 pb-4">
        <h2 className="font-display font-bold text-3xl text-slate-900 tracking-tight">
          Estúdio de Imagens e Slides
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Crie lindas composições visuais para pregações, posts em mídias sociais e capas teológicas com a ajuda de Inteligência Artificial.
        </p>
      </div>

      {/* Editor & Preview Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Editor Control Panel */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 max-h-[640px] overflow-y-auto pr-3">
          
          {/* Design Type selector */}
          <div>
            <label className="text-xs font-mono text-slate-400 uppercase font-bold block mb-2">
              Tipo de Arte
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['slide', 'cover', 'illustrated_verse'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setDesignType(type)}
                  className={`py-2 text-xs font-semibold rounded-lg border text-center capitalize transition-all ${
                    designType === type 
                      ? 'bg-emerald-500/15 border-emerald-300 text-emerald-700' 
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {type.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Texts inputs */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-mono text-slate-400 uppercase font-bold block mb-1">Título do Slide</label>
              <input 
                type="text" 
                value={slideTitle}
                onChange={(e) => setSlideTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            
            <div>
              <label className="text-xs font-mono text-slate-400 uppercase font-bold block mb-1">Escritura Bíblica (Texto)</label>
              <textarea 
                rows={3}
                value={verseText}
                onChange={(e) => setVerseText(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-serif"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 uppercase font-bold block mb-1">Referência Bíblica</label>
              <input 
                type="text" 
                value={verseRef}
                onChange={(e) => setVerseRef(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Typography Settings */}
          <div className="space-y-3 border-t border-slate-100 pt-4">
            <h4 className="text-xs font-mono uppercase text-slate-400 font-bold mb-2">Tipografia & Estilos</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">Fonte</label>
                <select 
                  value={fontFamily} 
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs"
                >
                  <option value="Inter">Inter (Sans)</option>
                  <option value="Space Grotesk">Space Grotesk (Tech)</option>
                  <option value="JetBrains Mono">JetBrains Mono (Mono)</option>
                  <option value="Georgia">Georgia (Serif)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">Alinhamento</label>
                <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 justify-between">
                  <button onClick={() => setTextAlign('left')} className={`p-1.5 rounded ${textAlign === 'left' ? 'bg-white shadow-sm' : ''}`}><AlignLeft size={12} /></button>
                  <button onClick={() => setTextAlign('center')} className={`p-1.5 rounded ${textAlign === 'center' ? 'bg-white shadow-sm' : ''}`}><AlignCenter size={12} /></button>
                  <button onClick={() => setTextAlign('right')} className={`p-1.5 rounded ${textAlign === 'right' ? 'bg-white shadow-sm' : ''}`}><AlignRight size={12} /></button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">Tamanho da Letra ({fontSize}px)</label>
                <input 
                  type="range" 
                  min={18} 
                  max={64} 
                  value={fontSize} 
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full accent-emerald-500" 
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">Cor do Texto</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    value={textColor} 
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <span className="text-xs font-mono">{textColor}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Background settings */}
          <div className="space-y-3 border-t border-slate-100 pt-4">
            <h4 className="text-xs font-mono uppercase text-slate-400 font-bold mb-2">Configuração de Fundo</h4>
            
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 mb-3 text-xs font-bold">
              <button 
                onClick={() => setBgType('color')}
                className={`flex-1 py-1 rounded-md text-center transition-all ${
                  bgType === 'color' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                Cor Sólida
              </button>
              <button 
                onClick={() => setBgType('image')}
                className={`flex-1 py-1 rounded-md text-center transition-all ${
                  bgType === 'image' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                Imagem por IA
              </button>
            </div>

            {bgType === 'color' ? (
              <div className="flex items-center gap-2">
                <input 
                  type="color" 
                  value={bgColor} 
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <span className="text-xs font-mono">Fundo Sólido: {bgColor}</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Ex: Templo grego sob pôr do sol aquarela"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                  />
                  <button
                    onClick={handleGenerateAiBg}
                    disabled={isGeneratingBg || !aiPrompt.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isGeneratingBg ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    <span>Gerar</span>
                  </button>
                </div>
                {bgImage ? (
                  <div className="text-[10px] text-emerald-600 font-mono flex items-center gap-1 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                    <FileImage size={12} />
                    <span>Imagem gerada por IA carregada no fundo.</span>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400">Digite um tema bíblico e clique em Gerar para produzir um fundo por IA.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Visual Slide Render & Saved List */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main design preview card */}
          <div 
            style={{ 
              backgroundColor: bgType === 'color' ? bgColor : undefined,
              backgroundImage: bgType === 'image' && bgImage ? `url(${bgImage})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
            className="w-full aspect-[16/9] rounded-2xl border border-slate-200 shadow-xl overflow-hidden relative flex flex-col justify-between p-8 text-white relative"
          >
            {/* Background darkening overlay for better readability on images */}
            {bgType === 'image' && bgImage && (
              <div className="absolute inset-0 bg-black/40 z-0" />
            )}

            {/* Decorative Inner border */}
            <div className="absolute inset-4 border border-white/10 rounded-xl z-0 pointer-events-none" />

            {/* Watermark header */}
            <div className="flex items-center justify-between z-10">
              <span className="text-[10px] font-mono tracking-widest text-white/50 uppercase font-bold">
                {slideTitle || 'Estudo Teológico'}
              </span>
              <span className="text-[10px] font-mono text-white/40">Estúdio PRO</span>
            </div>

            {/* Scripture center block */}
            <div className="z-10 py-6 max-w-[85%] mx-auto text-center" style={{ textAlign }}>
              {verseText && (
                <blockquote 
                  style={{ 
                    fontFamily: fontFamily === 'Inter' ? '"Inter", sans-serif' : fontFamily === 'Space Grotesk' ? '"Space Grotesk", sans-serif' : fontFamily === 'JetBrains Mono' ? '"JetBrains Mono", monospace' : 'Georgia, serif',
                    fontSize: `${fontSize}px`,
                    color: textColor
                  }}
                  className="font-serif italic font-light leading-snug tracking-wide"
                >
                  "{verseText}"
                </blockquote>
              )}

              {verseRef && (
                <cite 
                  style={{ color: textColor }}
                  className="not-italic font-display font-semibold block mt-4 text-base opacity-85 uppercase tracking-wider"
                >
                  {verseRef}
                </cite>
              )}
            </div>

            {/* Watermark footer */}
            <div className="text-center text-[8px] font-mono text-white/30 tracking-wider z-10">
              ESTUDO BÍBLICO E TEOLÓGICO PRO 🕊️
            </div>
          </div>

          {/* Action and saving control bars */}
          <div className="flex gap-4 justify-end">
            <button
              onClick={handleSaveDesign}
              className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Layers size={14} />
              <span>Salvar no Estúdio</span>
            </button>

            <button
              onClick={handleExportPNG}
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all"
            >
              <Download size={14} />
              <span>Exportar Slide PNG</span>
            </button>
          </div>

          {/* Saved Designs List section */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-display font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
              <Award size={18} className="text-emerald-500" />
              <span>Meus Designs Salvos ({savedDesigns.length})</span>
            </h3>

            {savedDesigns.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Nenhum design salvo localmente no seu estúdio.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-48 overflow-y-auto pr-1">
                {savedDesigns.map(design => (
                  <div 
                    key={design.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between h-28 group relative hover:border-emerald-300 transition-all"
                  >
                    <div>
                      <h4 className="font-display font-bold text-slate-800 text-xs truncate">{design.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 italic font-serif">"{design.verseText}"</p>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100">
                      <button 
                        onClick={() => handleApplySavedDesign(design)}
                        className="text-[9px] text-emerald-600 font-bold hover:text-emerald-800"
                      >
                        Aplicar
                      </button>
                      <button 
                        onClick={() => handleDeleteDesign(design.id)}
                        className="text-slate-400 hover:text-rose-600 transition-all"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default CreativeStudio;
