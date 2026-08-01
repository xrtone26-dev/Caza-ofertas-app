import React, { useState, useEffect } from 'react';
import { User, X, Edit3, Save, Eye, EyeOff, LogOut, ArrowLeft, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

import { auth, googleProvider, facebookProvider } from '../services/firebase';
import { 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  sendEmailVerification, 
  sendPasswordResetEmail 
} from 'firebase/auth';

export default function ProfileModal({
  showProfilePanel,
  setShowProfilePanel,
  currentUser,
  setCurrentUser,
  isLight,
}) {
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');

  const [regNombre, setRegNombre] = useState('');
  const [regNick, setRegNick] = useState('');
  const [regTel, setRegTel] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regConfirmPass, setRegConfirmPass] = useState('');
  
  // Estado para recuperación de contraseña (Escenario 3)
  const [recoveryEmail, setRecoveryEmail] = useState('');
  
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editNombre, setEditNombre] = useState('');
  const [editNick, setEditNick] = useState('');
  const [editTel, setEditTel] = useState('');
  const [editEdad, setEditEdad] = useState('');
  const [editSexo, setEditSexo] = useState('Masculino');
  const [selectedAvatar, setSelectedAvatar] = useState('👩‍🦰');
  const [customAvatarImg, setCustomAvatarImg] = useState(() => localStorage.getItem('cazaAvatarImg') || '');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (currentUser) {
      setEditNombre(localStorage.getItem('cazaFullName') || currentUser);
      setEditNick(localStorage.getItem('cazaNick') || currentUser);
      setEditTel(localStorage.getItem('cazaTel') || '');
      setEditEdad(localStorage.getItem('cazaEdad') || '');
      setEditSexo(localStorage.getItem('cazaSexo') || 'Masculino');
      setSelectedAvatar(localStorage.getItem('cazaAvatar') || '👩‍🦰');
      setCustomAvatarImg(localStorage.getItem('cazaAvatarImg') || '');
    }
  }, [currentUser, showProfilePanel]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomAvatarImg(reader.result);
        localStorage.setItem('cazaAvatarImg', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRealSocialLogin = async (providerType) => {
    try {
      setErrorMsg('');
      setSuccessMsg('');
      const provider = providerType === 'Google' ? googleProvider : facebookProvider;
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const [nombre, ...apellidoParts] = (user.displayName || 'Cazador Web').split(' ');
      const apellido = apellidoParts.join(' ') || '';
      const nombreFinal = `${nombre} ${apellido}`.trim();
      
      setCurrentUser(nombreFinal);
      localStorage.setItem('cazaUser', nombreFinal);
      localStorage.setItem('cazaFullName', nombreFinal);
      localStorage.setItem('cazaNick', nombre);
      if (user.photoURL) {
        localStorage.setItem('cazaAvatarImg', user.photoURL);
        setCustomAvatarImg(user.photoURL);
      }

      setShowProfilePanel(false);
    } catch (error) {
      console.error(error);
      setErrorMsg(`Error al conectar con ${providerType}`);
    }
  };

  const intentarLogin = () => {
    setErrorMsg('');
    setSuccessMsg('');
    if (!loginUser || !loginPass) {
      setErrorMsg('¡Ingresa tus datos para continuar!');
      return;
    }
    setCurrentUser(loginUser);
    localStorage.setItem('cazaUser', loginUser);
    localStorage.setItem('cazaFullName', loginUser);
    setShowProfilePanel(false);
  };

  const guardarCambiosPerfil = () => {
    const nombreGuardar = editNick || editNombre || currentUser;
    setCurrentUser(nombreGuardar);
    localStorage.setItem('cazaUser', nombreGuardar);
    localStorage.setItem('cazaFullName', editNombre);
    localStorage.setItem('cazaNick', editNick);
    localStorage.setItem('cazaTel', editTel);
    localStorage.setItem('cazaEdad', editEdad);
    localStorage.setItem('cazaSexo', editSexo);
    localStorage.setItem('cazaAvatar', selectedAvatar);
    if (customAvatarImg) {
      localStorage.setItem('cazaAvatarImg', customAvatarImg);
    }

    setIsEditing(false);
  };

  // ESCENARIO 1 y ESCENARIO 2: Registro y validación por correo
  const finalizarRegistro = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    if (!regNick || !regEmail || !regPass || !regConfirmPass) {
      setErrorMsg('¡Completa todos los campos básicos!');
      return;
    }
    if (regPass !== regConfirmPass) {
      setErrorMsg('¡Las contraseñas no son iguales!');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, regEmail, regPass);
      await sendEmailVerification(userCredential.user);

      setSuccessMsg('✅ ¡Registro exitoso! Te hemos enviado un correo de validación. Por favor revisa tu bandeja y activa tu cuenta.');
      
      setTimeout(() => {
        setAuthMode('login');
        setRegNick('');
        setRegEmail('');
        setRegPass('');
        setRegConfirmPass('');
        setSuccessMsg('');
      }, 4000);
    } catch (error) {
      console.error(error);
      if (error.code === 'auth/email-already-in-use') {
        setErrorMsg('⚠️ Ese correo ya está dado de alta.'); // Escenario 1
      } else if (error.code === 'auth/invalid-email') {
        setErrorMsg('⚠️ El formato del correo electrónico no es válido.');
      } else if (error.code === 'auth/weak-password') {
        setErrorMsg('⚠️ La contraseña es muy débil (mínimo 6 caracteres).');
      } else {
        setErrorMsg(`⚠️ Error: ${error.message}`);
      }
    }
  };

  // ESCENARIO 3: Recuperación de contraseña
  const handlePasswordReset = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    if (!recoveryEmail) {
      setErrorMsg('⚠️ Por favor ingresa tu correo electrónico registrado.');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, recoveryEmail);
      setSuccessMsg('📧 ¡Correo enviado! Revisa tu bandeja de entrada para restablecer tu contraseña.');
    } catch (error) {
      console.error(error);
      if (error.code === 'auth/user-not-found') {
        setErrorMsg('⚠️ No existe una cuenta registrada con este correo.');
      } else if (error.code === 'auth/invalid-email') {
        setErrorMsg('⚠️ El correo ingresado no es válido.');
      } else {
        setErrorMsg(`⚠️ Error al enviar correo: ${error.message}`);
      }
    }
  };

  const cerrarSesion = () => {
    setCurrentUser(null);
    localStorage.removeItem('cazaUser');
    localStorage.removeItem('cazaAvatarImg');
    setCustomAvatarImg('');
    setIsEditing(false);
    setShowProfilePanel(false);
  };

  if (!showProfilePanel) return null;

  const passwordsMatch = regPass && regConfirmPass && regPass === regConfirmPass;
  const passwordsMismatch = regConfirmPass && regPass !== regConfirmPass;

  const getPassBorderClass = () => {
    if (passwordsMatch) return 'border-green-500 focus:border-green-500 text-green-400';
    if (passwordsMismatch) return 'border-red-500 focus:border-red-500 text-red-400';
    return 'border-neutral-700 text-white';
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -20 }}
        className={`relative rounded-3xl shadow-2xl p-8 max-w-md w-full border ${
          isLight
            ? 'bg-white border-purple-200'
            : 'bg-neutral-900 border-yellow-400/30'
        }`}
      >
        <button
          onClick={() => setShowProfilePanel(false)}
          className="absolute top-4 right-4 text-gray-500 hover:text-red-500 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center">
          <div className="flex items-center justify-between mb-4 pr-6">
            <h2
              className={`text-xl font-bold flex items-center gap-2 ${
                isLight ? 'text-purple-700' : 'text-yellow-400'
              }`}
            >
              <User className="w-5 h-5" /> MI PERFIL CAZAOFERTAS
            </h2>
            {/* BOTÓN "SALIR" SUPERIOR ELIMINADO */}
          </div>

          {errorMsg && (
            <div className="mb-3 p-2.5 bg-red-500/20 border border-red-500 text-red-300 text-xs rounded-xl font-bold">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="mb-3 p-2.5 bg-green-500/20 border border-green-500 text-green-300 text-xs rounded-xl font-bold">
              {successMsg}
            </div>
          )}

          {currentUser ? (
            <div>
              {!isEditing ? (
                <div className="p-6 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 text-center">
                  
                  <div className="flex flex-col items-center justify-center mb-3">
                    {customAvatarImg ? (
                      <img 
                        src={customAvatarImg} 
                        alt="Foto de perfil" 
                        className="w-24 h-24 rounded-full object-cover border-2 border-yellow-400 shadow-md"
                      />
                    ) : (
                      <span className="text-[5rem] block leading-none">{selectedAvatar}</span>
                    )}
                    
                    <span className="text-yellow-400 font-bold text-sm mt-3">
                      @{editNick || currentUser}
                    </span>
                  </div>

                  <p className="text-xl font-black text-white mt-1">
                    ¡Hola, {editNick || currentUser}!
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">
                    {editNombre ? `Nombre: ${editNombre}` : ''} {editTel ? `| 📞 ${editTel}` : ''}
                  </p>
                  <p className="text-xs text-yellow-400 mt-1 font-semibold">
                    {editEdad ? `Edad: ${editEdad} años` : ''} {editSexo ? `• Sexo: ${editSexo}` : ''}
                  </p>
                  
                  <div className="flex gap-2 mt-4 justify-center">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-yellow-400 text-black rounded-xl text-xs font-black hover:bg-yellow-300 transition-all flex items-center gap-1 shadow-md"
                    >
                      <Edit3 size={14} /> Editar Perfil
                    </button>
                    <button
                      onClick={cerrarSesion}
                      className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold hover:bg-red-500/30 transition-all flex items-center gap-1"
                    >
                      <LogOut size={14} /> Cerrar Sesión
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-left max-h-[60vh] overflow-y-auto pr-1">
                  <p className="text-xs text-yellow-400 font-bold uppercase text-center mb-2">✏️ Editando tu perfil completo</p>
                  
                  <div>
                    <label className="text-[11px] text-neutral-400 font-bold">Nombre Completo</label>
                    <input
                      type="text"
                      value={editNombre}
                      onChange={(e) => setEditNombre(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border bg-neutral-950 border-neutral-700 text-white text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-neutral-400 font-bold">Nickname</label>
                      <input
                        type="text"
                        value={editNick}
                        onChange={(e) => setEditNick(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border bg-neutral-950 border-neutral-700 text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-neutral-400 font-bold">Teléfono</label>
                      <input
                        type="tel"
                        value={editTel}
                        onChange={(e) => setEditTel(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border bg-neutral-950 border-neutral-700 text-white text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-neutral-400 font-bold">Edad</label>
                      <input
                        type="number"
                        value={editEdad}
                        onChange={(e) => setEditEdad(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border bg-neutral-950 border-neutral-700 text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-neutral-400 font-bold">Sexo</label>
                      <select
                        value={editSexo}
                        onChange={(e) => setEditSexo(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border bg-neutral-950 border-neutral-700 text-white text-sm"
                      >
                        <option value="Masculino">Masculino</option>
                        <option value="Femenino">Femenino</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-neutral-400 font-bold block mb-1">📷 Subir Foto de Perfil (PC o Celular):</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="w-full text-xs text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-yellow-400 file:text-black hover:file:bg-yellow-300 cursor-pointer bg-neutral-950 border border-neutral-700 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-neutral-400 font-bold">O elige tu Avatar Emoji:</label>
                    <div className="max-h-32 overflow-y-auto grid grid-cols-5 gap-2 p-2 bg-neutral-950 rounded-xl border border-neutral-700">
                      {[
                        '👩‍🦰', '👨‍🦱', '👸', '🤴', '🦸‍♂️', '🦸‍♀️', '🦹‍♂️', '🦹‍♀️', 
                        '🦊', '🐯', '🦁', '🐼', '🐨', '🐶', '🐱', '🐰', 
                        '🤖', '👽', '👻', '🎃', '🚀', '⭐', '🔥', '💎', 
                        '👑', '😶‍🌫️', '🤑', '🤡', '🥸', '💀', '💩', '🥁', 
                        '👾', '😺', '😼', '🐵', '🙊', '🙉', '💣', '🎧', 
                        '🙈', '🦁', '🦀', '🦉', '🐦‍🔥', '🦋', '🐞', '🎙️',
                        '🕵️‍♀️', '🕵️‍♂️', '👮‍♀️', '👮‍♂️', '🤶', '🎅', '👰‍♀️', '👨‍🚀',
                        '🧑‍🚀', '🧜‍♀️', '🧜‍♂️', '🩲', '👙', '💎', '🏐', '🏀',
                        '🥎', '🎱', '🏉', '🥇', '🕹️', '🎷', '🎸', '🎺',
                      ].map((av) => (
                        <span
                          key={av}
                          onClick={() => {
                            setSelectedAvatar(av);
                            setCustomAvatarImg('');
                            localStorage.removeItem('cazaAvatarImg');
                          }}
                          className={`cursor-pointer p-2 text-center rounded-lg transition-all text-xl flex items-center justify-center ${
                            selectedAvatar === av && !customAvatarImg
                              ? 'bg-yellow-400 text-black font-black scale-110 shadow-md'
                              : 'hover:bg-neutral-800'
                          }`}
                        >
                          {av}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={guardarCambiosPerfil}
                      className="flex-1 py-2.5 bg-yellow-400 text-black font-black rounded-xl text-xs uppercase shadow-lg hover:bg-yellow-300 transition-all flex items-center justify-center gap-1"
                    >
                      <Save size={14} /> Guardar
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2.5 bg-neutral-800 text-neutral-300 font-bold rounded-xl text-xs hover:bg-neutral-700 transition-all"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              {authMode === 'login' && (
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Correo o Nickname"
                    value={loginUser}
                    onChange={(e) => setLoginUser(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:border-yellow-400 text-sm ${
                      isLight
                        ? 'bg-gray-50 border-gray-300'
                        : 'bg-neutral-950 border-neutral-700 text-white'
                    }`}
                  />
                  <input
                    type="password"
                    placeholder="Contraseña"
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:border-yellow-400 text-sm ${
                      isLight
                        ? 'bg-gray-50 border-gray-300'
                        : 'bg-neutral-950 border-neutral-700 text-white'
                    }`}
                  />
                  
                  {/* Botón de recuperar contraseña (Escenario 3) */}
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => { setAuthMode('forgot'); setErrorMsg(''); setSuccessMsg(''); }}
                      className="text-xs text-yellow-400 hover:underline font-semibold"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>

                  <button
                    onClick={intentarLogin}
                    className="w-full py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-bold rounded-xl transition-all shadow-lg"
                  >
                    Entrar
                  </button>

                  <div className="flex items-center gap-4 my-4">
                    <div className="flex-1 border-t border-neutral-700"></div>
                    <span className="text-xs text-neutral-500">O ingresa rápido con</span>
                    <div className="flex-1 border-t border-neutral-700"></div>
                  </div>

                  <div className="flex gap-3 mb-4">
                    <button
                      type="button"
                      onClick={() => handleRealSocialLogin('Google')}
                      className="flex-1 py-2.5 bg-white text-black font-bold rounded-xl text-sm border hover:bg-gray-100 flex justify-center items-center gap-2 transition-all shadow-md"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43 .35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                      Google
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRealSocialLogin('Facebook')}
                      className="flex-1 py-2.5 bg-[#1877F2] text-white font-bold rounded-xl text-sm hover:bg-[#166FE5] flex justify-center items-center gap-2 transition-all shadow-md"
                    >
                      <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103v3.381h-2.392c-1.212 0-1.42.383-1.42 1.42v1.54h3.8l-.52 3.667h-3.28v7.98c5.441-.83 9.475-5.541 9.475-11.233C22 5.58 17.525 1.105 12 1.105S2 5.58 2 11.085c0 5.692 4.033 10.403 9.475 11.233z"/></svg>
                      Facebook
                    </button>
                  </div>

                  <hr className="border-neutral-800 my-4" />
                  <button
                    onClick={() => { setAuthMode('register'); setErrorMsg(''); setSuccessMsg(''); }}
                    className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl transition-all border border-neutral-700 text-sm"
                  >
                    Crear Cuenta Nueva
                  </button>
                </div>
              )}

              {/* VISTA DE RECUPERACIÓN DE CONTRASEÑA (ESCENARIO 3) */}
              {authMode === 'forgot' && (
                <div className="space-y-4 text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      onClick={() => { setAuthMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
                      className="text-neutral-400 hover:text-white"
                    >
                      <ArrowLeft size={18} />
                    </button>
                    <h3 className="text-sm font-bold text-yellow-400">Recuperar Contraseña</h3>
                  </div>
                  <p className="text-xs text-neutral-400">
                    Ingresa el correo electrónico asociado a tu cuenta y te enviaremos las instrucciones para restablecer tu contraseña.
                  </p>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                    <input
                      type="email"
                      placeholder="Correo electrónico registrado"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      className="w-full pl-10 pr-3 py-3 rounded-xl border text-sm bg-neutral-950 border-neutral-700 text-white focus:outline-none focus:border-yellow-400"
                    />
                  </div>
                  <button
                    onClick={handlePasswordReset}
                    className="w-full py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-bold rounded-xl transition-all shadow-lg mt-2"
                  >
                    Enviar enlace de recuperación
                  </button>
                  <p
                    onClick={() => { setAuthMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
                    className="text-xs text-neutral-400 text-center cursor-pointer underline mt-3"
                  >
                    Volver al inicio de sesión
                  </p>
                </div>
              )}

              {authMode === 'register' && (
                <div className="space-y-4 text-left">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Nombre Completo"
                      value={regNombre}
                      onChange={(e) => setRegNombre(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border text-sm bg-neutral-950 border-neutral-700 text-white"
                    />
                    <input
                      type="text"
                      placeholder="Nickname"
                      value={regNick}
                      onChange={(e) => setRegNick(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border text-sm bg-neutral-950 border-neutral-700 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="tel"
                      placeholder="Teléfono"
                      value={regTel}
                      onChange={(e) => setRegTel(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border text-sm bg-neutral-950 border-neutral-700 text-white"
                    />
                    <input
                      type="email"
                      placeholder="Correo"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border text-sm bg-neutral-950 border-neutral-700 text-white"
                    />
                  </div>

                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      placeholder="Contraseña"
                      value={regPass}
                      onChange={(e) => setRegPass(e.target.value)}
                      className={`w-full px-3 py-2 pr-10 rounded-xl border text-sm bg-neutral-950 ${getPassBorderClass()}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                    >
                      {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      placeholder="Confirmar Contraseña"
                      value={regConfirmPass}
                      onChange={(e) => setRegConfirmPass(e.target.value)}
                      className={`w-full px-3 py-2 pr-10 rounded-xl border text-sm bg-neutral-950 ${getPassBorderClass()}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                    >
                      {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {regConfirmPass && (
                    <p className={`text-[11px] font-bold ${passwordsMatch ? 'text-green-500' : 'text-red-500'}`}>
                      {passwordsMatch ? '✓ Las contraseñas coinciden' : '✕ Las contraseñas no son iguales'}
                    </p>
                  )}

                  <p className="text-xs text-neutral-400 mt-2">Selecciona tu Avatar:</p>
                  <div className="flex justify-center gap-3 text-2xl">
                    {['👩‍🦰', '👨‍🦱', '👸', '🦊', '🐯'].map((av) => (
                      <span
                        key={av}
                        onClick={() => setSelectedAvatar(av)}
                        className={`cursor-pointer p-2 rounded-xl transition-all ${
                          selectedAvatar === av
                            ? 'bg-yellow-400/30 border border-yellow-400 scale-110'
                            : 'hover:scale-105'
                        }`}
                      >
                        {av}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={finalizarRegistro}
                    className="w-full py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-bold rounded-xl transition-all shadow-lg mt-4"
                  >
                    Finalizar Registro
                  </button>
                  <p
                    onClick={() => { setAuthMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
                    className="text-xs text-neutral-400 text-center cursor-pointer underline mt-2"
                  >
                    Volver al inicio
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
