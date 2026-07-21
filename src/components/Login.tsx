import React, { useState } from 'react';
import { 
  Cloud, 
  Chrome, 
  Mail, 
  Lock, 
  User, 
  UserPlus, 
  LogIn, 
  BookOpen, 
  ShieldCheck,
  Globe
} from 'lucide-react';
import { 
  auth, 
  googleProvider 
} from '../services/firebase';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { useRewards } from '../contexts/RewardContext';
import { KneelingKnightIcon } from './KneelingKnightIcon';

interface LoginProps {
  onContinueOffline: () => void;
}

export const Login: React.FC<LoginProps> = ({ onContinueOffline }) => {
  const { addXp } = useRewards();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isUnauthorizedDomain, setIsUnauthorizedDomain] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Por favor, informe seu e-mail no campo acima para enviarmos o link de recuperação de senha.');
      setMessage(null);
      return;
    }
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setMessage('E-mail de recuperação de senha enviado com sucesso! Verifique sua caixa de entrada.');
      await addXp(10, 'Recuperação de Conta Solicitada 📧');
    } catch (err: any) {
      console.error(err);
      let localizedError = 'Ocorreu um erro ao enviar o e-mail de recuperação de senha.';
      if (err.code === 'auth/invalid-email') {
        localizedError = 'Formato de e-mail inválido.';
      } else if (err.code === 'auth/user-not-found') {
        localizedError = 'Não encontramos nenhuma conta com este e-mail.';
      } else if (err.message) {
        localizedError = err.message;
      }
      setError(localizedError);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setIsUnauthorizedDomain(false);
    setMessage(null);
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      await addXp(30, 'Sincronização via Google Iniciada! 🌐');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/unauthorized-domain' || (err.message && err.message.includes('auth/unauthorized-domain'))) {
        setIsUnauthorizedDomain(true);
        setError('O login via Google não está configurado para este domínio.');
      } else if (err.code !== 'auth/popup-closed-by-user') {
        setError('Erro ao autenticar com o Google: ' + (err.message || err));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsUnauthorizedDomain(false);
    setMessage(null);
    setLoading(true);

    try {
      if (isRegister) {
        if (!displayName.trim()) {
          throw new Error('Por favor, informe seu nome.');
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, {
          displayName: displayName
        });
        await addXp(50, 'Conta Teológica Criada! 🎉');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        await addXp(20, 'Bem-vindo de volta! 🕊️');
      }
    } catch (err: any) {
      console.error(err);
      let localizedError = 'Ocorreu um erro. Tente novamente.';
      if (err.code === 'auth/email-already-in-use') {
        localizedError = 'Este e-mail já está sendo utilizado.';
      } else if (err.code === 'auth/invalid-credential') {
        localizedError = 'E-mail ou senha incorretos.';
      } else if (err.code === 'auth/weak-password') {
        localizedError = 'A senha deve conter pelo menos 6 caracteres.';
      } else if (err.code === 'auth/invalid-email') {
        localizedError = 'Formato de e-mail inválido.';
      } else if (err.message) {
        localizedError = err.message;
      }
      setError(localizedError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
      <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xl space-y-6 relative overflow-hidden">
        {/* Subtle decorative background circles */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl" />

        <div className="text-center space-y-3 relative z-10">
          <KneelingKnightIcon size={64} className="mx-auto drop-shadow-md" />
          <div>
            <h1 className="text-2xl font-display font-black tracking-tight text-slate-900">
              Determinado
            </h1>
            <p className="text-xs text-slate-500 mt-1.5 max-w-xs mx-auto">
              Estudos bíblicos acadêmicos, dicionário teológico, assistente com IA e sincronização inteligente em tempo real.
            </p>
          </div>
        </div>

        {error && (
          isUnauthorizedDomain ? (
            <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-2xl font-medium animate-fade-in space-y-3 shadow-sm">
              <div className="flex items-start gap-2 text-amber-800">
                <Globe className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-sm">Domínio Não Autorizado no Firebase</p>
                  <p className="text-[11px] mt-0.5 text-amber-700">O Google Sign-In precisa que o domínio deste preview seja registrado nas configurações de autenticação do seu projeto Firebase.</p>
                </div>
              </div>
              
              <div className="bg-white/80 border border-amber-200/60 rounded-xl p-2.5 space-y-2">
                <p className="text-[10px] uppercase font-mono font-bold text-amber-800">Copie o domínio atual:</p>
                <div className="flex items-center justify-between gap-2 bg-amber-100/50 hover:bg-amber-100 px-2 py-1.5 rounded text-mono text-[11px] font-semibold text-amber-900">
                  <span className="truncate select-all">{typeof window !== 'undefined' ? window.location.hostname : 'domain'}</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        navigator.clipboard.writeText(window.location.hostname);
                      }
                    }}
                    className="text-[10px] text-amber-700 hover:text-amber-900 font-bold hover:underline cursor-pointer shrink-0"
                  >
                    Copiar
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-amber-800 space-y-1">
                <p className="font-bold">Como resolver em 1 minuto:</p>
                <ol className="list-decimal pl-4 space-y-1.5">
                  <li>Acesse o <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="underline font-bold text-amber-950">Console do Firebase</a></li>
                  <li>Abra o projeto <span className="font-mono bg-amber-100 px-1 rounded text-[10px]">estudo-teologico001</span></li>
                  <li>Vá em <strong>Authentication</strong> &rarr; aba <strong>Settings</strong> &rarr; <strong>Authorized domains</strong></li>
                  <li>Clique em <strong>Add domain</strong>, cole o domínio acima e salve.</li>
                </ol>
              </div>

              <div className="text-[10px] text-amber-700 border-t border-amber-200/60 pt-2 text-center">
                Dica: Você também pode usar o <span className="font-bold">E-mail / Senha</span> abaixo para entrar imediatamente!
              </div>
            </div>
          ) : (
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl font-medium animate-fade-in">
              {error}
            </div>
          )
        )}

        {message && (
          <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-xl font-medium animate-fade-in">
            {message}
          </div>
        )}

        <div className="space-y-4 relative z-10">
          {/* Main Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3.5 rounded-2xl transition shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Chrome size={16} />
            <span>Sincronizar com Google Sign-In</span>
          </button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-100"></div>
            <span className="flex-shrink mx-3 text-[10px] uppercase font-mono text-slate-400">Ou use e-mail</span>
            <div className="flex-grow border-t border-slate-100"></div>
          </div>

          {/* Email Login/Register Form */}
          <form onSubmit={handleEmailAuthSubmit} className="space-y-3">
            {isRegister && (
              <div>
                <label className="block text-[10px] uppercase font-mono font-bold text-slate-400 mb-1">Seu Nome</label>
                <div className="relative flex items-center">
                  <User className="absolute left-3.5 text-slate-400" size={14} />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs rounded-xl pl-10 pr-4 py-2.5 outline-none font-medium text-slate-800 transition"
                    placeholder="Ex: João Silva"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] uppercase font-mono font-bold text-slate-400 mb-1">E-mail</label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 text-slate-400" size={14} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs rounded-xl pl-10 pr-4 py-2.5 outline-none font-medium text-slate-800 transition"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[10px] uppercase font-mono font-bold text-slate-400">Senha</label>
                {!isRegister && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[10px] font-semibold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer font-sans"
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 text-slate-400" size={14} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs rounded-xl pl-10 pr-4 py-2.5 outline-none font-medium text-slate-800 transition"
                  placeholder="Mínimo de 6 caracteres"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-2xl flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isRegister ? <UserPlus size={14} /> : <LogIn size={14} />}
              <span>{loading ? 'Sincronizando...' : isRegister ? 'Criar Conta Pro' : 'Entrar na Conta'}</span>
            </button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setIsRegister(!isRegister);
              }}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
            >
              {isRegister ? 'Já tem uma conta? Fazer Login' : 'Não tem conta? Cadastre-se grátis'}
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex flex-col items-center gap-3 relative z-10">
          {/* Guest option with explicit layout */}
          <button
            type="button"
            onClick={onContinueOffline}
            className="text-xs text-slate-500 hover:text-slate-800 font-bold tracking-wide transition uppercase cursor-pointer"
          >
            Continuar sem Conta (Modo Offline)
          </button>
          
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <ShieldCheck size={12} className="text-emerald-500" />
            <span>Seus dados são salvos localmente e seguros</span>
          </div>
        </div>
      </div>
    </div>
  );
};
