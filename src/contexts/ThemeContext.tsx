import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeType = 'classic' | 'minimalist' | 'midnight';

export interface ThemeConfig {
  id: ThemeType;
  name: string;
  description: string;
  bg: string;
  card: string;
  text: string;
  textMuted: string;
  border: string;
  accent: string;
  accentText: string;
  accentBg: string;
  isDark: boolean;
  tagline: string;
}

export const THEME_CONFIGS: Record<ThemeType, ThemeConfig> = {
  classic: {
    id: 'classic',
    name: 'Classic Seminary',
    tagline: 'Ambiente Acadêmico Tradicional',
    description: 'Tom de pergaminho suave, fontes serifadas e detalhes em verde esmeralda. Perfeito para leituras bíblicas profundas e estudo histórico.',
    bg: 'bg-[#fbf9f4]',
    card: 'bg-white border-[#e5e0d4]',
    text: 'text-[#1e1b18]',
    textMuted: 'text-[#6e6458]',
    border: 'border-[#e5e0d4]',
    accent: 'bg-emerald-700 hover:bg-emerald-800 text-white',
    accentText: 'text-emerald-800',
    accentBg: 'bg-emerald-50/85',
    isDark: false
  },
  minimalist: {
    id: 'minimalist',
    name: 'Minimalist Focus',
    tagline: 'Foco Puro e Sem Distrações',
    description: 'Design moderno, limpo, ultra-clean e com alto contraste. Silencia o ruído visual para focar inteiramente na Palavra de Deus.',
    bg: 'bg-slate-50',
    card: 'bg-white border-slate-200',
    text: 'text-slate-900',
    textMuted: 'text-slate-500',
    border: 'border-slate-200',
    accent: 'bg-slate-900 hover:bg-slate-800 text-white',
    accentText: 'text-slate-900',
    accentBg: 'bg-slate-100',
    isDark: false
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight Study',
    tagline: 'Conforto para Leituras Noturnas',
    description: 'Paleta escura premium baseada em azul-noite profundo. Suave para os olhos, ideal para suas reflexões silenciosas na calada da noite.',
    bg: 'bg-[#0b0f19]',
    card: 'bg-[#151c2c] border-[#222f46]',
    text: 'text-slate-100',
    textMuted: 'text-slate-400',
    border: 'border-[#222f46]',
    accent: 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold',
    accentText: 'text-emerald-400',
    accentBg: 'bg-[#0b241e]',
    isDark: true
  }
};

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  themeConfig: ThemeConfig;
  themes: ThemeConfig[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeType>(() => {
    return (localStorage.getItem('study_theme_v1') as ThemeType) || 'classic';
  });

  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
    localStorage.setItem('study_theme_v1', newTheme);
  };

  useEffect(() => {
    // Apply theme variables directly on documentElement
    const root = document.documentElement;
    root.classList.remove('theme-classic', 'theme-minimalist', 'theme-midnight');
    root.classList.add(`theme-${theme}`);
    
    // Also store choice in localStorage
    localStorage.setItem('study_theme_v1', theme);
  }, [theme]);

  const value: ThemeContextType = {
    theme,
    setTheme,
    themeConfig: THEME_CONFIGS[theme],
    themes: Object.values(THEME_CONFIGS)
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
