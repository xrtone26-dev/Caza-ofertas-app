import React, { useState, useEffect } from 'react';
import { User, X, Edit3, Save, Eye, EyeOff, LogOut, ArrowLeft, Mail, Music } from 'lucide-react';
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
  
  const [recoveryEmail, setRecoveryEmail] = useState('');
  
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editNombre, setEditNombre] = useState('');
  const [editNick, setEditNick] = useState('');
  const [editTel, setEditTel] = useState('');
  const [editEdad, setEditEdad] = useState('');
  const [editSexo, setEditSexo] = useState('Masculino');
  const [editPlaylist, setEditPlaylist] = useState(''); // Campo para la música
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
      setEditPlaylist(localStorage.getItem('cazaPlaylist') || '');
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
    localStorage.setItem('cazaPlaylist', editPlaylist);
    localStorage.setItem('cazaAvatar', selectedAvatar);
    if (customAvatarImg) {
      localStorage.setItem('cazaAvatarImg', customAvatarImg);
    }

    setIsEditing(false);
  };

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

      setSuccessMsg('✅ ¡Registro exitoso! Te hemos enviado un correo de validación.');
      
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
        setErrorMsg('⚠️ Ese correo ya está dado de alta.');
      } else if (error.code === 'auth/invalid-email') {
        setErrorMsg('⚠️ El formato del correo electrónico no es válido.');
      } else if (error.code === 'auth/weak-password') {
        setErrorMsg('⚠️ La contraseña es muy débil (mínimo 6 caracteres).');
      } else {
        setErrorMsg(`⚠️ Error: ${error.message}`);
      }
    }
  };

  const handlePasswordReset = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    if (!recoveryEmail) {
      setErrorMsg('⚠️ Por favor ingresa tu correo electrónico registrado.');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, recoveryEmail);
      setSuccessMsg('📧 ¡Correo enviado! Revisa tu bandeja de entrada.');
    } catch (error) {
      console.error(error);
      if (error.code === 'auth/user-not-found') {
        setErrorMsg('⚠️ No existe una cuenta registrada con este correo.');
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

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -20 }}
        className={`relative rounded-3xl shadow-2xl p-5 sm:p-8 max-w-md w-full max-h-[95vh] overflow-y-auto custom-scrollbar border ${
          isLight
            ? 'bg-white border-purple-200'
            : 'bg-neutral-900 border-yellow-400/30'
        }`}
      >
        <button
          onClick={() => setShowProfilePanel(false)}
          className="absolute top-4 right-4 z-10 text-gray-500 hover:text-red-500 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center">
          <div className="flex items-center justify-between mb-4 pr-6">
            <h2
              className={`text-lg sm:text-xl font-bold flex items-center gap-2 ${
                isLight ? 'text-purple-700' : 'text-yellow-400'
              }`}
            >
              <User className="w-5 h-5" /> MI PERFIL CAZAOFERTAS
            </h2>
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
                <div className="p-4 sm:p-6 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 text-center">
                  
                  <div className="flex flex-col items-center justify-center mb-3">
                    {customAvatarImg ? (
                      <img 
                        src={customAvatarImg} 
                        alt="Foto de perfil" 
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-yellow-400 shadow-md"
                      />
                    ) : (
                      <span className="text-[4rem] sm:text-[5rem] block leading-none">{selectedAvatar}</span>
                    )}
                    
                    <span className="text-yellow-400 font-bold text-sm mt-3">
                      @{editNick || currentUser}
                    </span>
                  </div>

                  <p className="text-lg sm:text-xl font-black text-white mt-1">
                    ¡Hola, {editNick || currentUser}!
                  </p>
                  <p className="text-[11px] sm:text-xs text-neutral-400 mt-1">
                    {editNombre ? `Nombre: ${editNombre}` : ''} {editTel ? `| 📞 ${editTel}` : ''}
                  </p>
                  <p className="text-[11px] sm:text-xs text-yellow-400 mt-1 font-semibold">
                    {editEdad ? `Edad: ${editEdad} años` : ''} {editSexo ? `• Sexo: ${editSexo}` : ''}
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-2 mt-4 justify-center">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2.5 sm:py-2 bg-yellow-400 text-black rounded-xl text-xs font-black hover:bg-yellow-300 transition-all flex items-center justify-center gap-1 shadow-md"
                    >
                      <Edit3 size={14} /> Editar Perfil
                    </button>
                    <button
                      onClick={cerrarSesion}
                      className="px-4 py-2.5 sm:py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold hover:bg-red-500/30 transition-all flex items-center justify-center gap-1"
                    >
                      <LogOut size={14} /> Cerrar Sesión
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-left max-h-[65vh] sm:max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  <p className="text-xs text-yellow-400 font-bold uppercase text-center mb-2">✏️ Editando tu perfil completo</p>
                  
                  <div>
                    <label className="text-[11px] text-neutral-400 font-bold">Nombre Completo</label>
                    <input
                      type="text"
                      value={editNombre}
                      onChange={(e) => setEditNombre(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border bg-neutral-950 border-neutral-700 text-white text-sm focus:outline-none focus:border-yellow-400"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-neutral-400 font-bold">Nickname</label>
                      <input
                        type="text"
                        value={editNick}
                        onChange={(e) => setEditNick(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border bg-neutral-950 border-neutral-700 text-white text-sm focus:outline-none focus:border-yellow-400"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-neutral-400 font-bold">Teléfono</label>
                      <input
                        type="tel"
                        value={editTel}
                        onChange={(e) => setEditTel(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border bg-neutral-950 border-neutral-700 text-white text-sm focus:outline-none focus:border-yellow-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-yellow-400 font-bold flex items-center gap-1">
                      <Music size={14} /> Enlace de tu Playlist (Spotify o YouTube)
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: https://open.spotify.com/playlist/... o https://youtube.com/..."
                      value={editPlaylist}
                      onChange={(e) => setEditPlaylist(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border bg-neutral-950 border-yellow-400/50 text-white text-sm focus:outline-none focus:border-yellow-400 mt-1"
                    />
                    <p className="text-[10px] text-neutral-400 mt-0.5">Pega el enlace de tu música favorita para que suene en el reproductor.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-neutral-400 font-bold">Edad</label>
                      <input
                        type="number"
                        value={editEdad}
                        onChange={(e) => setEditEdad(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border bg-neutral-950 border-neutral-700 text-white text-sm focus:outline-none focus:border-yellow-400"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-neutral-400 font-bold">Sexo</label>
                      <select
                        value={editSexo}
                        onChange={(e) => setEditSexo(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border bg-neutral-950 border-neutral-700 text-white text-sm focus:outline-none focus:border-yellow-400"
                      >
                        <option value="Masculino">Masculino</option>
                        <option value="Femenino">Femenino</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-neutral-400 font-bold block mb-1">📷 Subir Foto de Perfil:</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="w-full text-xs text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-yellow-400 file:text-black hover:file:bg-yellow-300 cursor-pointer bg-neutral-950 border border-neutral-700 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-neutral-400 font-bold">O elige tu Avatar Emoji:</label>
                    <div className="max-h-32 overflow-y-auto grid grid-cols-5 gap-2 p-2 bg-neutral-950 rounded-xl border border-neutral-700 custom-scrollbar">
                      {['👩‍🦰', '👨‍🦱', '👸', '🤴', '🦸‍♂️', '🦊', '🐯', '🦁', '🐼', '🤖'].map((av) => (
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
                      className="flex-1 py-3 bg-yellow-400 text-black font-black rounded-xl text-xs uppercase shadow-lg hover:bg-yellow-300 transition-all flex items-center justify-center gap-1"
                    >
                      <Save size={14} /> Guardar
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex-1 py-3 bg-neutral-800 text-neutral-300 font-bold rounded-xl text-xs hover:bg-neutral-700 transition-all flex items-center justify-center"
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
                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:border-yellow-400 text-base sm:text-sm ${
                      isLight ? 'bg-gray-50 border-gray-300' : 'bg-neutral-950 border-neutral-700 text-white'
                    }`}
                  />
                  <input
                    type="password"
                    placeholder="Contraseña"
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:border-yellow-400 text-base sm:text-sm ${
                      isLight ? 'bg-gray-50 border-gray-300' : 'bg-neutral-950 border-neutral-700 text-white'
                    }`}
                  />
                  
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
                    <span className="text-[11px] sm:text-xs text-neutral-500">O ingresa rápido con</span>
                    <div className="flex-1 border-t border-neutral-700"></div>
                  </div>

                  <div className="flex gap-3 mb-4">
                    <button
                      type="button"
                      onClick={() => handleRealSocialLogin('Google')}
                      className="flex-1 py-2.5 bg-white text-black font-bold rounded-xl text-sm border hover:bg-gray-100 flex justify-center items-center gap-2 transition-all shadow-md"
                    >
                      Google
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRealSocialLogin('Facebook')}
                      className="flex-1 py-2.5 bg-[#1877F2] text-white font-bold rounded-xl text-sm hover:bg-[#166FE5] flex justify-center items-center gap-2 transition-all shadow-md"
                    >
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
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                    <input
                      type="email"
                      placeholder="Correo electrónico registrado"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      className="w-full pl-10 pr-3 py-3 rounded-xl border text-base sm:text-sm bg-neutral-950 border-neutral-700 text-white focus:outline-none focus:border-yellow-400"
                    />
                  </div>
                  <button
                    onClick={handlePasswordReset}
                    className="w-full py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-bold rounded-xl transition-all shadow-lg mt-2"
                  >
                    Enviar enlace de recuperación
                  </button>
                </div>
              )}

              {authMode === 'register' && (
                <div className="space-y-4 text-left">
                  <input
                    type="text"
                    placeholder="Nombre Completo"
                    value={regNombre}
                    onChange={(e) => setRegNombre(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-sm bg-neutral-950 border-neutral-700 text-white focus:outline-none focus:border-yellow-400"
                  />
                  <input
                    type="text"
                    placeholder="Nickname"
                    value={regNick}
                    onChange={(e) => setRegNick(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-sm bg-neutral-950 border-neutral-700 text-white focus:outline-none focus:border-yellow-400"
                  />
                  <input
                    type="email"
                    placeholder="Correo"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-sm bg-neutral-950 border-neutral-700 text-white focus:outline-none focus:border-yellow-400"
                  />
                  <input
                    type="password"
                    placeholder="Contraseña"
                    value={regPass}
                    onChange={(e) => setRegPass(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-sm bg-neutral-950 text-white focus:outline-none border-neutral-700"
                  />
                  <input
                    type="password"
                    placeholder="Confirmar Contraseña"
                    value={regConfirmPass}
                    onChange={(e) => setRegConfirmPass(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-sm bg-neutral-950 text-white focus:outline-none border-neutral-700"
                  />

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
