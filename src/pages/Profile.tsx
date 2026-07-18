import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Lock, 
  LogOut, 
  RefreshCw, 
  Cloud, 
  CloudLightning, 
  CloudOff, 
  Trash2, 
  Award, 
  Flame, 
  Check, 
  AlertCircle, 
  Chrome, 
  UserPlus, 
  LogIn, 
  KeyRound, 
  UserCheck 
} from 'lucide-react';
import { auth, syncAllData, registerSyncStatusListener } from '../services/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail, 
  updateProfile, 
  deleteUser, 
  signInWithPopup, 
  GoogleAuthProvider, 
  User as FirebaseUser 
} from 'firebase/auth';
import { useRewards } from '../contexts/RewardContext';
import { SYSTEM_BADGES } from '../constants';

export const Profile: React.FC = () => {
  const { state: rewardState, addXp } = useRewards();
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(auth.currentUser);
  
  // Auth Form states
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Edit Profile state
  const [editName, setEditName] = useState('');
  const [showEditNameForm, setShowEditNameForm] = useState(false);

  // Sync status
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState<string>('');

  // Delete account confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (user) {
        setEditName(user.displayName || '');
        // Run initial silent sync on login
        syncAllData(user.uid).catch(e => console.warn(e));
      }
    });

    registerSyncStatusListener((status, msg) => {
      setSyncStatus(status);
      if (msg) setSyncMessage(msg);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (isRegister) {
        // Register
        if (!displayName.trim()) {
          throw new Error('Por favor, informe seu nome.');
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, {
          displayName: displayName
        });
        
        // Grant new signup XP reward
        await addXp(50, 'Conta criada!');
        setSuccess('Sua conta foi criada com sucesso! Aproveite os recursos Pro.');
      } else {
        // Login
        await signInWithEmailAndPassword(auth, email, password);
        setSuccess('Bem-vindo de volta! Sincronização iniciada...');
      }
    } catch (err: any) {
      console.error(err);
      let localizedError = 'Ocorreu um erro. Tente novamente.';
      if (err.code === 'auth/email-already-in-use') {
        localizedError = 'Este e-mail já está sendo utilizado por outra conta.';
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

  const handleGoogleLogin = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setSuccess('Conectado via Google com sucesso!');
    } catch (err: any) {
      console.error(err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Falha ao autenticar com o Google: ' + (err.message || err));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Por favor, digite seu e-mail no campo acima para solicitar a redefinição de senha.');
      return;
    }
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess('E-mail de redefinição de senha enviado! Verifique sua caixa de entrada.');
    } catch (err: any) {
      console.error(err);
      setError('Falha ao enviar e-mail de redefinição: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfileName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await updateProfile(currentUser, { displayName: editName });
      setSuccess('Nome de perfil atualizado com sucesso!');
      setShowEditNameForm(false);
    } catch (err: any) {
      setError('Erro ao atualizar perfil: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('guest_mode_v1');
      setSuccess('Você saiu da sua conta com sucesso.');
      // Refresh local page
      window.location.reload();
    } catch (err: any) {
      setError('Erro ao sair: ' + err.message);
    }
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;
    setLoading(true);
    setError(null);
    try {
      await deleteUser(currentUser);
      localStorage.removeItem('guest_mode_v1');
      setSuccess('Sua conta foi excluída permanentemente.');
      setShowDeleteConfirm(false);
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      setError('Para excluir sua conta, você precisa ter feito login recentemente. Por segurança, saia e faça login novamente e depois tente excluir.');
    } finally {
      setLoading(false);
    }
  };

  const triggerManualSync = async () => {
    if (!currentUser) return;
    await syncAllData(currentUser.uid);
  };

  // Find badge metadata for unlocked badges
  const userBadges = SYSTEM_BADGES.filter(b => rewardState.badges.includes(b.id));

  return (
    <div id="profile-page-container" className="max-w-4xl mx-auto py-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-slate-900">
            {currentUser ? 'Minha Conta Teológica' : 'Sincronizar Progresso'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {currentUser 
              ? 'Gerencie seus dados na nuvem, conquistas teológicas e configurações de conta.' 
              : 'Faça login para salvar seus estudos na nuvem e sincronizar em múltiplos dispositivos.'}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-950 rounded-2xl flex items-start gap-3 text-sm font-sans animate-fade-in shadow-sm">
          <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Atenção: </span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-2xl flex items-start gap-3 text-sm font-sans animate-fade-in shadow-sm">
          <Check size={18} className="text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Sucesso! </span>
            <span>{success}</span>
          </div>
        </div>
      )}

      {currentUser ? (
        // LOGGED IN VIEW
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column 1: Info & Sync status */}
          <div className="md:col-span-1 space-y-6">
            {/* User Profile Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 border-4 border-emerald-100 flex items-center justify-center text-white text-3xl font-display font-bold shadow-md mb-4">
                {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : currentUser.email?.[0].toUpperCase() || 'U'}
              </div>
              <h2 className="text-lg font-bold text-slate-900">{currentUser.displayName || 'Teólogo PRO'}</h2>
              <p className="text-xs text-slate-500 font-mono mt-1 break-all">{currentUser.email}</p>
              
              <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-100">
                <UserCheck size={14} />
                <span>Conta Sincronizada</span>
              </div>

              <div className="w-full border-t border-slate-100 mt-6 pt-4 text-left">
                <button 
                  onClick={() => setShowEditNameForm(!showEditNameForm)}
                  className="w-full text-center text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                >
                  {showEditNameForm ? 'Cancelar Edição' : 'Alterar Nome de Perfil'}
                </button>

                {showEditNameForm && (
                  <form onSubmit={handleUpdateProfileName} className="mt-4 space-y-3">
                    <div>
                      <label className="block text-[10px] uppercase font-mono font-bold text-slate-400 mb-1">Novo Nome</label>
                      <input 
                        type="text" 
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs rounded-xl px-3 py-2 outline-none font-medium text-slate-800 transition"
                        placeholder="Seu nome"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2 rounded-xl transition cursor-pointer"
                    >
                      {loading ? 'Salvando...' : 'Salvar Nome'}
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Cloud Storage & Sync Management Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Cloud size={16} className="text-emerald-600" />
                Sincronização na Nuvem
              </h3>

              <div className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Status do Sync:</span>
                  <span className={`font-semibold ${
                    syncStatus === 'syncing' ? 'text-blue-600' :
                    syncStatus === 'success' ? 'text-emerald-600' :
                    syncStatus === 'error' ? 'text-rose-600' : 'text-slate-600'
                  }`}>
                    {syncStatus === 'syncing' && 'Sincronizando...'}
                    {syncStatus === 'success' && 'Tudo Atualizado'}
                    {syncStatus === 'error' && 'Erro no Sync'}
                    {syncStatus === 'idle' && 'Conectado'}
                  </span>
                </div>

                {syncMessage && (
                  <p className="text-[11px] text-slate-500 leading-normal text-center italic">
                    "{syncMessage}"
                  </p>
                )}

                <button
                  onClick={triggerManualSync}
                  disabled={syncStatus === 'syncing'}
                  className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-3 rounded-2xl transition shadow-sm active:scale-95 disabled:opacity-50 disabled:scale-100 cursor-pointer"
                >
                  <RefreshCw size={14} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
                  Sincronizar Agora
                </button>

                <p className="text-[10px] text-slate-400 leading-normal text-center">
                  Suas anotações, favoritos, marcadores e progresso são sincronizados automaticamente em segundo plano.
                </p>
              </div>
            </div>
          </div>

          {/* Column 2 & 3: Statistics & Gamification Rewards & Account actions */}
          <div className="md:col-span-2 space-y-6">
            {/* Gamification Status Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Award size={20} className="text-amber-500" />
                  Progresso e Conquistas
                </h3>
                <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-bold border border-amber-100">
                  <Flame size={14} className="text-amber-500 animate-pulse" />
                  <span>{rewardState.dailyStreak} dias seguidos</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100 text-center">
                  <span className="block text-[10px] uppercase font-mono font-bold text-slate-400">Nível Atual</span>
                  <span className="block text-4xl font-display font-black text-slate-900 mt-1">{rewardState.level}</span>
                </div>
                <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100 text-center">
                  <span className="block text-[10px] uppercase font-mono font-bold text-slate-400">Experiência (XP)</span>
                  <span className="block text-4xl font-display font-black text-slate-900 mt-1">{rewardState.xp}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase font-mono text-slate-400 mb-3 tracking-wider">
                  Medalhas Pro Desbloqueadas ({userBadges.length})
                </h4>

                {userBadges.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">Você ainda não desbloqueou nenhuma medalha. Continue lendo e estudando a Palavra para ganhar conquistas!</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {userBadges.map((badge) => (
                      <div key={badge.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl">
                          <Award size={18} />
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-900">{badge.title}</h5>
                          <p className="text-[10px] text-slate-500 mt-0.5">{badge.desc}</p>
                          <span className="inline-block bg-amber-100/50 text-amber-800 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded mt-1">+{badge.xpReward} XP</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Account Settings (Delete, Sign out) */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-6">
              <h3 className="text-sm font-bold text-slate-900">Opções de Conta</h3>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleLogout}
                  className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-3.5 px-4 rounded-2xl transition cursor-pointer"
                >
                  <LogOut size={16} />
                  Sair da Minha Conta
                </button>

                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex-1 flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs py-3.5 px-4 rounded-2xl transition border border-rose-100 cursor-pointer"
                >
                  <Trash2 size={16} />
                  Excluir Conta Permanentemente
                </button>
              </div>

              {showDeleteConfirm && (
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 space-y-4 animate-fade-in">
                  <div className="flex gap-2.5">
                    <AlertCircle className="text-rose-600 shrink-0 mt-0.5" size={18} />
                    <div>
                      <h4 className="text-xs font-bold text-rose-950">Tem certeza absoluta?</h4>
                      <p className="text-[11px] text-rose-900/90 leading-relaxed mt-1">
                        Esta ação é irreversível. Todos os seus dados salvos na nuvem (anotações, favoritos, marcadores e progresso) serão excluídos permanentemente de nossos servidores.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-3 py-1.5 bg-white text-slate-700 font-semibold text-xs rounded-lg border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={loading}
                      className="px-3 py-1.5 bg-rose-600 text-white font-bold text-xs rounded-lg hover:bg-rose-700 transition flex items-center gap-1 cursor-pointer"
                    >
                      Excluir Definitivamente
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // LOGGED OUT VIEW - AUTH FORMS
        <div className="max-w-md mx-auto bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center mx-auto">
              <Cloud size={28} />
            </div>
            <h2 className="text-xl font-display font-bold text-slate-900">
              {isRegister ? 'Criar Nova Conta' : 'Acesse Sua Conta'}
            </h2>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              {isRegister 
                ? 'Comece a sincronizar seus estudos, notas e progresso bíblico teológico PRO na nuvem de forma imediata!' 
                : 'Insira suas credenciais abaixo ou utilize o Google para sincronizar seu progresso.'}
            </p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-[10px] uppercase font-mono font-bold text-slate-400 mb-1.5">Seu Nome</label>
                <div className="relative flex items-center">
                  <User className="absolute left-3.5 text-slate-400" size={16} />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs rounded-2xl pl-10 pr-4 py-3 outline-none font-medium text-slate-800 transition"
                    placeholder="Ex: João Silva"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] uppercase font-mono font-bold text-slate-400 mb-1.5">E-mail</label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 text-slate-400" size={16} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs rounded-2xl pl-10 pr-4 py-3 outline-none font-medium text-slate-800 transition"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[10px] uppercase font-mono font-bold text-slate-400">Senha</label>
                {!isRegister && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[10px] font-semibold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 text-slate-400" size={16} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs rounded-2xl pl-10 pr-4 py-3 outline-none font-medium text-slate-800 transition"
                  placeholder="Mínimo de 6 caracteres"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3.5 rounded-2xl flex items-center justify-center gap-2 transition shadow-sm active:scale-95 disabled:opacity-50 disabled:scale-100 cursor-pointer"
            >
              {isRegister ? <UserPlus size={16} /> : <LogIn size={16} />}
              {loading ? 'Processando...' : isRegister ? 'Cadastrar e Ativar Pro' : 'Entrar com Email'}
            </button>
          </form>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-100"></div>
            <span className="flex-shrink mx-3 text-[10px] uppercase font-mono text-slate-400">Ou use</span>
            <div className="flex-grow border-t border-slate-100"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs py-3 rounded-2xl transition cursor-pointer"
          >
            <Chrome size={16} className="text-slate-600" />
            Sincronizar com Google
          </button>

          <p className="text-center text-xs text-slate-500">
            {isRegister ? 'Já possui uma conta?' : 'Ainda não possui conta?'}
            <button
              onClick={() => {
                setError(null);
                setSuccess(null);
                setIsRegister(!isRegister);
              }}
              className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline ml-1 cursor-pointer"
            >
              {isRegister ? 'Fazer Login' : 'Cadastre-se grátis'}
            </button>
          </p>
        </div>
      )}
    </div>
  );
};

export default Profile;
