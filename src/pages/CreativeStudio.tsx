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
  Award,
  Instagram
} from 'lucide-react';

export const CreativeStudio: React.FC = () => {
  const { addXp, unlockBadge } = useRewards();

  // Selected slide design settings
  const [designType, setDesignType] = useState<'slide' | 'cover' | 'illustrated_verse' | 'instagram_post' | 'instagram_story' | 'instagram_sticker'>('slide');
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

    // Determine the optimal aspect ratio for Imagen based on the selected format
    let apiAspectRatio = '16:9';
    if (designType === 'instagram_story') {
      apiAspectRatio = '9:16';
    } else if (designType === 'instagram_post' || designType === 'instagram_sticker') {
      apiAspectRatio = '1:1';
    }

    try {
      const response = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          aspectRatio: apiAspectRatio
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
        textAlign,
        designType
      );
      
      addXp(15, `Arte (${designType.replace('_', ' ')}) Exportada como PNG 🎨`);
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

  // Live editor dynamic preview styling configurations
  const getPreviewConfig = () => {
    switch (designType) {
      case 'instagram_post':
        return {
          aspectClass: 'aspect-square max-w-[420px] mx-auto w-full',
          containerStyle: {
            backgroundColor: bgType === 'color' ? bgColor : undefined,
            backgroundImage: bgType === 'image' && bgImage ? `url(${bgImage})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          },
          hasOverlay: bgType === 'image' && !!bgImage,
          hasBorder: true,
          borderPadding: 'p-6',
          titleSize: 'text-[11px] sm:text-xs',
          textSize: 'text-base sm:text-lg md:text-xl',
          refSize: 'text-xs sm:text-sm',
          watermarkY: 'mb-1'
        };
      case 'instagram_story':
        return {
          aspectClass: 'aspect-[9/16] max-w-[280px] mx-auto w-full',
          containerStyle: {
            backgroundColor: bgType === 'color' ? bgColor : undefined,
            backgroundImage: bgType === 'image' && bgImage ? `url(${bgImage})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          },
          hasOverlay: bgType === 'image' && !!bgImage,
          hasBorder: true,
          borderPadding: 'p-6 sm:p-8',
          titleSize: 'text-[10px] sm:text-xs',
          textSize: 'text-xs sm:text-sm md:text-base',
          refSize: 'text-[10px] sm:text-xs',
          watermarkY: 'mb-4'
        };
      case 'instagram_sticker':
        return {
          aspectClass: 'aspect-square max-w-[420px] mx-auto w-full',
          // Checkerboard pattern representing transparency
          containerStyle: {
            backgroundImage: 'linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #cbd5e1 75%), linear-gradient(-45deg, transparent 75%, #cbd5e1 75%)',
            backgroundSize: '16px 16px',
            backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
            backgroundColor: '#f1f5f9'
          },
          hasOverlay: false,
          hasBorder: false,
          borderPadding: 'p-4',
          titleSize: 'text-[10px] sm:text-xs',
          textSize: 'text-xs sm:text-sm md:text-base',
          refSize: 'text-[10px] sm:text-xs',
          watermarkY: 'mb-1'
        };
      default: // slide, cover, illustrated_verse
        return {
          aspectClass: 'aspect-[16/9] w-full',
          containerStyle: {
            backgroundColor: bgType === 'color' ? bgColor : undefined,
            backgroundImage: bgType === 'image' && bgImage ? `url(${bgImage})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          },
          hasOverlay: bgType === 'image' && !!bgImage,
          hasBorder: true,
          borderPadding: 'p-8',
          titleSize: 'text-[10px] sm:text-xs',
          textSize: 'text-lg sm:text-2xl md:text-3xl',
          refSize: 'text-xs sm:text-base',
          watermarkY: 'mb-1'
        };
    }
  };

  const preview = getPreviewConfig();
  const isStickerBgLight = bgType === 'color' && (bgColor.toLowerCase() === '#ffffff' || bgColor.toLowerCase() === '#f8fafc' || bgColor.toLowerCase() === '#f1f5f9');
  const stickerOutlineColor = isStickerBgLight ? 'border-slate-800' : 'border-white';

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Page Title */}
      <div className="border-b border-slate-200 pb-4">
        <h2 className="font-display font-bold text-3xl text-slate-900 tracking-tight">
          Estúdio de Imagens e Slides
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Crie lindas composições visuais para pregações, posts em mídias sociais, stories e adesivos do Instagram com a ajuda de Inteligência Artificial.
        </p>
      </div>

      {/* Editor & Preview Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Editor Control Panel */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 max-h-[660px] overflow-y-auto pr-3">
          
          {/* Design Type selector categorized */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-mono text-slate-400 uppercase font-bold block mb-1.5">
                Formatos Clássicos (Slides/Capas - 16:9)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'slide', label: 'Slide' },
                  { id: 'cover', label: 'Capa' },
                  { id: 'illustrated_verse', label: 'Ilustrado' },
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setDesignType(item.id as any)}
                    className={`py-2 text-[11px] font-semibold rounded-lg border text-center transition-all cursor-pointer ${
                      designType === item.id 
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-extrabold shadow-sm' 
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 uppercase font-bold flex items-center gap-1 block mb-1.5">
                <Instagram size={13} className="text-rose-500" />
                <span>Formatos Sociais (Instagram)</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'instagram_post', label: 'Post 1:1' },
                  { id: 'instagram_story', label: 'Story 9:16' },
                  { id: 'instagram_sticker', label: 'Adesivo' },
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setDesignType(item.id as any)}
                    className={`py-2 text-[11px] font-semibold rounded-lg border text-center transition-all cursor-pointer ${
                      designType === item.id 
                        ? 'bg-rose-50 border-rose-300 text-rose-700 font-extrabold shadow-sm' 
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Texts inputs */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div>
              <label className="text-xs font-mono text-slate-400 uppercase font-bold block mb-1">Título / Cabeçalho</label>
              <input 
                type="text" 
                value={slideTitle}
                onChange={(e) => setSlideTitle(e.target.value)}
                placeholder="Ex: Teologia Reformada"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            
            <div>
              <label className="text-xs font-mono text-slate-400 uppercase font-bold block mb-1">Texto Bíblico / Citação</label>
              <textarea 
                rows={3}
                value={verseText}
                onChange={(e) => setVerseText(e.target.value)}
                placeholder="Citação ou versículo bíblico..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-serif"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 uppercase font-bold block mb-1">Referência / Autor</label>
              <input 
                type="text" 
                value={verseRef}
                onChange={(e) => setVerseRef(e.target.value)}
                placeholder="Ex: Romanos 12:2"
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs focus:outline-none"
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
                  <button type="button" onClick={() => setTextAlign('left')} className={`p-1.5 rounded cursor-pointer ${textAlign === 'left' ? 'bg-white shadow-sm text-slate-950' : 'text-slate-400'}`}><AlignLeft size={12} /></button>
                  <button type="button" onClick={() => setTextAlign('center')} className={`p-1.5 rounded cursor-pointer ${textAlign === 'center' ? 'bg-white shadow-sm text-slate-950' : 'text-slate-400'}`}><AlignCenter size={12} /></button>
                  <button type="button" onClick={() => setTextAlign('right')} className={`p-1.5 rounded cursor-pointer ${textAlign === 'right' ? 'bg-white shadow-sm text-slate-950' : 'text-slate-400'}`}><AlignRight size={12} /></button>
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
                  className="w-full accent-emerald-500 cursor-pointer" 
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
                type="button"
                onClick={() => setBgType('color')}
                className={`flex-1 py-1 rounded-md text-center transition-all cursor-pointer ${
                  bgType === 'color' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                Cor Sólida / Adesivo
              </button>
              <button 
                type="button"
                disabled={designType === 'instagram_sticker'}
                onClick={() => setBgType('image')}
                className={`flex-1 py-1 rounded-md text-center transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  bgType === 'image' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                Imagem por IA
              </button>
            </div>

            {bgType === 'color' || designType === 'instagram_sticker' ? (
              <div className="flex items-center gap-2">
                <input 
                  type="color" 
                  value={bgColor} 
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <span className="text-xs font-mono">Fundo do Card/Adesivo: {bgColor}</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Ex: Templo antigo sob pôr do sol aquarela"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateAiBg}
                    disabled={isGeneratingBg || !aiPrompt.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {isGeneratingBg ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    <span>Gerar</span>
                  </button>
                </div>
                {bgImage ? (
                  <div className="text-[10px] text-emerald-600 font-mono flex items-center gap-1 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                    <FileImage size={12} />
                    <span>Imagem gerada ({designType === 'instagram_story' ? '9:16' : '1:1'}) por IA carregada.</span>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 font-sans">Digite um tema bíblico e clique em Gerar para produzir um fundo sob medida via Imagen 3.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Visual Slide Render & Saved List */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main design preview card */}
          <div 
            style={preview.containerStyle}
            className={`${preview.aspectClass} rounded-2xl border border-slate-200 shadow-xl overflow-hidden relative flex flex-col justify-between text-white relative`}
          >
            {designType === 'instagram_sticker' ? (
              // Physically styled sticker card centered inside transparency frame
              <div 
                style={{ 
                  backgroundColor: bgType === 'color' ? bgColor : '#1E293B',
                }}
                className={`w-[85%] h-[85%] m-auto rounded-[32px] border-[8px] ${stickerOutlineColor} shadow-2xl relative p-6 flex flex-col justify-between text-white overflow-hidden`}
              >
                {/* Thin inner decoration border for premium sticker look */}
                <div className="absolute inset-2 border border-white/10 rounded-[24px] pointer-events-none" />
                
                {/* Sticker Header */}
                <div className="text-center z-10 pt-2">
                  <span className="text-[9px] font-mono tracking-widest text-white/60 uppercase font-bold">
                    {slideTitle || 'Estúdio PRO'}
                  </span>
                </div>

                {/* Sticker Quote */}
                <div className="text-center z-10 max-w-[90%] mx-auto my-auto">
                  {verseText && (
                    <blockquote 
                      style={{ 
                        fontFamily: fontFamily === 'Inter' ? '"Inter", sans-serif' : fontFamily === 'Space Grotesk' ? '"Space Grotesk", sans-serif' : fontFamily === 'JetBrains Mono' ? '"JetBrains Mono", monospace' : 'Georgia, serif',
                        color: textColor
                      }}
                      className={`${preview.textSize} italic font-light leading-snug tracking-wide`}
                    >
                      "{verseText}"
                    </blockquote>
                  )}

                  {verseRef && (
                    <cite 
                      style={{ color: textColor }}
                      className="not-italic font-display font-semibold block mt-3 text-xs uppercase tracking-wider opacity-90"
                    >
                      {verseRef}
                    </cite>
                  )}
                </div>

                {/* Sticker Footer */}
                <div className="text-center text-[8px] font-mono text-white/40 tracking-wider z-10 pb-1">
                  ESTUDO BÍBLICO PRO 🕊... ADESIVO
                </div>
              </div>
            ) : (
              // Standard slide / post / story format preview
              <div className={`w-full h-full flex flex-col justify-between ${preview.borderPadding} relative`}>
                {/* Background darkening overlay */}
                {preview.hasOverlay && (
                  <div className="absolute inset-0 bg-black/45 z-0" />
                )}

                {/* Decorative Inner border */}
                {preview.hasBorder && (
                  <div className="absolute inset-4 border border-white/10 rounded-xl z-0 pointer-events-none" />
                )}

                {/* Watermark header */}
                <div className="flex items-center justify-between z-10">
                  <span className="text-[10px] font-mono tracking-widest text-white/50 uppercase font-bold">
                    {slideTitle || 'Estudo Teológico'}
                  </span>
                  <span className="text-[10px] font-mono text-white/40">Estúdio PRO</span>
                </div>

                {/* Scripture center block */}
                <div className="z-10 py-6 max-w-[85%] mx-auto text-center w-full my-auto" style={{ textAlign }}>
                  {verseText && (
                    <blockquote 
                      style={{ 
                        fontFamily: fontFamily === 'Inter' ? '"Inter", sans-serif' : fontFamily === 'Space Grotesk' ? '"Space Grotesk", sans-serif' : fontFamily === 'JetBrains Mono' ? '"JetBrains Mono", monospace' : 'Georgia, serif',
                        color: textColor
                      }}
                      className={`${preview.textSize} italic font-light leading-snug tracking-wide`}
                    >
                      "{verseText}"
                    </blockquote>
                  )}

                  {verseRef && (
                    <cite 
                      style={{ color: textColor }}
                      className={`not-italic font-display font-semibold block mt-4 ${preview.refSize} opacity-85 uppercase tracking-wider`}
                    >
                      {verseRef}
                    </cite>
                  )}
                </div>

                {/* Watermark footer */}
                <div className={`text-center text-[8px] font-mono text-white/30 tracking-wider z-10 ${preview.watermarkY}`}>
                  ESTUDO BÍBLICO E TEOLÓGICO PRO 🕊️
                </div>
              </div>
            )}
          </div>

          {/* Action and saving control bars */}
          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={handleSaveDesign}
              className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Layers size={14} />
              <span>Salvar no Estúdio</span>
            </button>

            <button
              type="button"
              onClick={handleExportPNG}
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <Download size={14} />
              <span>Exportar PNG ({designType === 'instagram_sticker' ? 'Adesivo Transparente' : designType === 'instagram_story' ? 'Story 9:16' : designType === 'instagram_post' ? 'Post 1:1' : 'Slide 16:9'})</span>
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
