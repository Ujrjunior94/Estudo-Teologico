import React, { useState, useEffect, useRef } from 'react';
import { useRewards } from '../contexts/RewardContext';
import { ChatMessage, ChatSession } from '../types';
import { sendChatMessage } from '../api/chat';
import { 
  Sparkles, 
  Send, 
  RefreshCw, 
  Trash2, 
  BookOpen, 
  MessageSquare,
  Network,
  AlertOctagon,
  Loader2,
  Cpu,
  WifiOff
} from 'lucide-react';

export const AiAssistant: React.FC = () => {
  const { addXp, unlockBadge } = useRewards();

  // Chat sessions states
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [activeOption, setActiveOption] = useState<'exegese' | 'hermeneutica' | 'devocional' | 'mapa_mental'>('exegese');

  // Loading & Error states
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<{ code: string; message: string; error: string } | null>(null);

  // Simulated offline & fault testing harness for QA
  const [faultType, setFaultType] = useState<'none' | 'timeout' | 'quota' | 'key_missing' | 'no_internet'>('none');

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Initialize with a default session if empty
  useEffect(() => {
    const savedSessionsJson = localStorage.getItem('EstudoBiblicoTeologicoPRO_ChatSessions');
    if (savedSessionsJson) {
      try {
        const parsed = JSON.parse(savedSessionsJson);
        if (parsed.length > 0) {
          setSessions(parsed);
          setActiveSessionId(parsed[0].id);
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }

    // Create default session
    const defaultSession: ChatSession = {
      id: `session_${Date.now()}`,
      title: 'Estudo Bíblico Inicial',
      messages: [
        {
          id: 'welcome',
          role: 'model',
          content: 'Graça e Paz! Sou o seu Assistente Teológico PRO. Como posso apoiar os seus estudos bíblicos hoje?\n\nEscolha um modo de estudo acima (Exegese, Hermenêutica, Devocional ou Mapa Mental) e digite sua dúvida ou o texto bíblico que deseja examinar.',
          createdAt: new Date().toISOString()
        }
      ],
      createdAt: new Date().toISOString()
    };
    setSessions([defaultSession]);
    setActiveSessionId(defaultSession.id);
  }, []);

  // Save sessions to LocalStorage on change
  const saveSessions = (updated: ChatSession[]) => {
    setSessions(updated);
    localStorage.setItem('EstudoBiblicoTeologicoPRO_ChatSessions', JSON.stringify(updated));
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions, activeSessionId]);

  const activeSession = sessions.find(s => s.id === activeSessionId);

  // Send Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || !activeSessionId || isLoading) return;

    setServerError(null);
    const userMsgText = inputMessage.trim();
    setInputMessage('');

    // Append user message
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: userMsgText,
      createdAt: new Date().toISOString()
    };

    const sessionIndex = sessions.findIndex(s => s.id === activeSessionId);
    if (sessionIndex === -1) return;

    const updatedSession = {
      ...sessions[sessionIndex],
      messages: [...sessions[sessionIndex].messages, userMessage],
      title: sessions[sessionIndex].messages.length === 1 ? userMsgText.slice(0, 24) + '...' : sessions[sessionIndex].title
    };

    const updatedSessions = [...sessions];
    updatedSessions[sessionIndex] = updatedSession;
    saveSessions(updatedSessions);
    setIsLoading(true);

    // QA Fault Testing Mode simulation
    if (faultType !== 'none') {
      setTimeout(() => {
        setIsLoading(false);
        if (faultType === 'timeout') {
          setServerError({
            code: 'TIMEOUT',
            error: 'Tempo limite esgotado.',
            message: 'O servidor demorou mais de 20 segundos para responder à sua consulta teológica.'
          });
        } else if (faultType === 'quota') {
          setServerError({
            code: 'QUOTA_EXCEEDED',
            error: 'Cota de requisições excedida.',
            message: 'Você atingiu temporariamente os limites do Gemini. Por favor, aguarde alguns minutos e tente novamente.'
          });
        } else if (faultType === 'key_missing') {
          setServerError({
            code: 'INVALID_API_KEY',
            error: 'Chave de API do Gemini inválida ou ausente.',
            message: 'A chave configurada no servidor é nula ou inválida. Por favor, ajuste no painel Secrets.'
          });
        } else if (faultType === 'no_internet') {
          setServerError({
            code: 'NO_INTERNET',
            error: 'Sem conexão com a internet.',
            message: 'O dispositivo parece estar desconectado. O aplicativo continuará funcionando offline!'
          });
        }
      }, 1500);
      return;
    }

    try {
      const chatResponseText = await sendChatMessage(updatedSession.messages, activeOption);

      const modelMessage: ChatMessage = {
        id: `msg_${Date.now()}_model`,
        role: 'model',
        content: chatResponseText,
        createdAt: new Date().toISOString()
      };

      const finalSessions = [...sessions];
      finalSessions[sessionIndex] = {
        ...updatedSession,
        messages: [...updatedSession.messages, modelMessage]
      };
      saveSessions(finalSessions);
      addXp(25, `Consulta IA (${activeOption})`);

    } catch (err: any) {
      console.error(err);
      try {
        const parsedErr = JSON.parse(err.message);
        setServerError(parsedErr);
      } catch {
        setServerError({
          code: 'INTERNAL_ERROR',
          error: 'Erro de Comunicação.',
          message: 'Não foi possível conectar com o servidor da IA. Certifique-se de que o servidor local está ativo.'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewSession = () => {
    const freshSession: ChatSession = {
      id: `session_${Date.now()}`,
      title: `Estudo ${sessions.length + 1}`,
      messages: [
        {
          id: `welcome_${Date.now()}`,
          role: 'model',
          content: 'Sessão de estudos iniciada. Digite seu texto de pesquisa ou exegese bíblica...',
          createdAt: new Date().toISOString()
        }
      ],
      createdAt: new Date().toISOString()
    };
    const updated = [freshSession, ...sessions];
    saveSessions(updated);
    setActiveSessionId(freshSession.id);
    addXp(10, 'Iniciou nova sessão de estudos');
  };

  const handleDeleteSession = (id: string) => {
    const updated = sessions.filter(s => s.id !== id);
    if (updated.length === 0) {
      localStorage.removeItem('EstudoBiblicoTeologicoPRO_ChatSessions');
      // recreate default
      const defaultSession: ChatSession = {
        id: `session_${Date.now()}`,
        title: 'Estudo Bíblico Inicial',
        messages: [
          {
            id: 'welcome',
            role: 'model',
            content: 'Graça e Paz! Sou o seu Assistente Teológico PRO...',
            createdAt: new Date().toISOString()
          }
        ],
        createdAt: new Date().toISOString()
      };
      saveSessions([defaultSession]);
      setActiveSessionId(defaultSession.id);
    } else {
      saveSessions(updated);
      if (activeSessionId === id) {
        setActiveSessionId(updated[0].id);
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Page Title */}
      <div className="border-b border-slate-200 pb-4">
        <h2 className="font-display font-bold text-3xl text-slate-900 tracking-tight">
          Assistente Teológico IA
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Aprofunde seus conhecimentos bíblicos realizando exegeses, investigações hermenêuticas e mapas mentais completos.
        </p>
      </div>

      {/* Theological Modes Selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(['exegese', 'hermeneutica', 'devocional', 'mapa_mental'] as const).map(opt => (
          <button
            key={opt}
            onClick={() => { setActiveOption(opt); addXp(5, 'Modo de estudo alterado'); }}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              activeOption === opt 
                ? 'bg-emerald-500/10 border-emerald-300 text-emerald-800 font-bold shadow-sm' 
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="text-xs font-mono uppercase text-slate-400 font-bold block mb-1">
              Modo de IA
            </span>
            <span className="text-sm font-display leading-tight capitalize">
              {opt.replace('_', ' ')}
            </span>
          </button>
        ))}
      </div>

      {/* Main split dashboard: sessions & active chat */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Sessions sidebar */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between h-[520px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono uppercase text-slate-400 font-bold">Estudos ({sessions.length})</span>
              <button 
                onClick={handleNewSession}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-2 py-1.5 rounded-lg transition-all"
              >
                + NOVO
              </button>
            </div>

            <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
              {sessions.map(s => (
                <div 
                  key={s.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                    s.id === activeSessionId ? 'bg-slate-50 border-slate-300' : 'border-transparent hover:bg-slate-50'
                  }`}
                >
                  <button 
                    onClick={() => setActiveSessionId(s.id)}
                    className="flex-1 text-left text-sm text-slate-700 truncate font-display font-medium"
                  >
                    {s.title}
                  </button>
                  <button 
                    onClick={() => handleDeleteSession(s.id)}
                    className="text-slate-400 hover:text-slate-600 p-1"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Fault Injector for QA testing */}
          <div className="border-t border-slate-100 pt-4 bg-slate-50 -mx-4 -mb-4 p-4 rounded-b-2xl">
            <div className="flex items-center gap-1.5 mb-2 text-slate-700 font-display font-bold text-xs">
              <Cpu size={14} className="text-emerald-500" />
              <span>Simulador de Falhas (QA)</span>
            </div>
            
            <select
              value={faultType}
              onChange={(e) => setFaultType(e.target.value as any)}
              className="w-full bg-white border border-slate-200 rounded-lg text-[10px] p-2 font-mono text-slate-600 focus:outline-none"
            >
              <option value="none">✓ Sem Erros (Conectado)</option>
              <option value="timeout">⏱ Simular Timeout (504)</option>
              <option value="quota">⚖ Simular Limite de Cota (429)</option>
              <option value="key_missing">🔑 Simular Chave Inválida (401)</option>
              <option value="no_internet">📡 Simular Sem Internet (503)</option>
            </select>
          </div>
        </div>

        {/* Chat window viewport */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl shadow-sm h-[520px] flex flex-col justify-between overflow-hidden">
          {/* Active messages list */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
            {activeSession?.messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div 
                  key={m.id}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm border ${
                    isUser 
                      ? 'bg-slate-900 border-slate-800 text-white rounded-br-none' 
                      : 'bg-white border-slate-200 text-slate-800 rounded-bl-none'
                  }`}>
                    {/* Role header */}
                    <div className="flex items-center gap-1.5 mb-2 font-mono text-[9px] uppercase tracking-wider font-bold">
                      {isUser ? 'Meus Estudos' : 'Teólogo PRO IA'}
                    </div>

                    {/* Content formatted with pre-wrap */}
                    <div className="text-sm font-sans leading-relaxed whitespace-pre-wrap select-text markdown-body">
                      {m.content}
                    </div>
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none p-4 shadow-sm flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin text-emerald-500" />
                  <span className="text-xs font-mono text-slate-400 font-bold uppercase">Pesquisando Escrituras...</span>
                </div>
              </div>
            )}

            {serverError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 space-y-2 max-w-md animate-fade-in">
                <div className="flex items-center gap-2 font-bold font-display text-sm text-rose-900">
                  <AlertOctagon size={18} className="text-rose-600 flex-shrink-0" />
                  <span>{serverError.error}</span>
                </div>
                <p className="text-xs font-sans leading-relaxed text-rose-700">
                  {serverError.message}
                </p>
                <div className="pt-1 flex items-center gap-2">
                  <span className="bg-rose-100 text-[9px] font-mono font-bold px-2 py-0.5 rounded text-rose-800">
                    COD: {serverError.code}
                  </span>
                  {serverError.code === 'NO_INTERNET' && (
                    <span className="flex items-center gap-1 text-[9px] font-mono text-rose-500">
                      <WifiOff size={10} />
                      Modo Offline Ativado
                    </span>
                  )}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Form input messaging bar */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 bg-white flex gap-3">
            <input 
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={`Perguntar ao Teólogo no modo ${activeOption}...`}
              disabled={isLoading}
              className="flex-1 bg-slate-50 text-slate-800 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button 
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
export default AiAssistant;
