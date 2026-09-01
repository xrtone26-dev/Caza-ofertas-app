// src/components/ProfileModal.jsx

import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  User,
  X,
  Edit3,
  Save,
  Eye,
  EyeOff,
  LogOut,
  ArrowLeft,
  Mail,
  Loader2,
  // eslint-disable-next-line no-unused-vars
  RefreshCw,
  Camera,
  CheckCircle,
} from 'lucide-react';

import { motion } from 'framer-motion';

/*
|--------------------------------------------------------------------------
| FIREBASE AUTH
|--------------------------------------------------------------------------
*/

import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';

/*
|--------------------------------------------------------------------------
| FIRESTORE
|--------------------------------------------------------------------------
*/

import {
  deleteDoc,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

/*
|--------------------------------------------------------------------------
| STORAGE
|--------------------------------------------------------------------------
*/

import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from 'firebase/storage';

/*
|--------------------------------------------------------------------------
| FIREBASE CONFIG
|--------------------------------------------------------------------------
*/

import {
  auth,
  db,
  storage,
  googleProvider,
  facebookProvider,
} from '../services/firebase';


/*
===============================================================================
 UTILIDADES
===============================================================================
*/

/**
 * Normaliza un nickname:
 * - elimina acentos
 * - elimina espacios al inicio/final
 * - convierte a minúsculas
 */
function normalizeNickname(value = '') {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

/**
 * Nickname permitido:
 * 3 a 20 caracteres
 * letras
 * números
 * punto
 * guion bajo
 */
function isValidNickname(value = '') {
  return /^[a-z0-9._]{3,20}$/.test(
    normalizeNickname(value)
  );
}

/**
 * Teléfono mexicano de 10 dígitos.
 */
function normalizePhone(value = '') {
  return value
    .replace(/\D/g, '')
    .slice(0, 10);
}

/**
 * Valida contraseña para registro.
 */
function isStrongPassword(password = '') {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password)
  );
}

/**
 * Mensajes amigables de Firebase.
 */
function getFirebaseErrorMessage(error) {
  const code = error?.code || '';

  const messages = {
    'auth/invalid-credential':
      'Correo, nickname o contraseña incorrectos.',

    'auth/invalid-login-credentials':
      'Correo, nickname o contraseña incorrectos.',

    'auth/user-not-found':
      'No encontramos una cuenta con esos datos.',

    'auth/wrong-password':
      'La contraseña es incorrecta.',

    'auth/invalid-email':
      'El correo electrónico no es válido.',

    'auth/email-already-in-use':
      'Ese correo ya está registrado.',

    'auth/weak-password':
      'La contraseña es demasiado débil.',

    'auth/user-disabled':
      'Esta cuenta ha sido deshabilitada.',

    'auth/too-many-requests':
      'Demasiados intentos. Espera unos minutos e inténtalo nuevamente.',

    'auth/network-request-failed':
      'No pudimos conectarnos con Firebase. Revisa tu conexión.',

    'auth/popup-closed-by-user':
      'Se cerró la ventana de inicio de sesión.',

    'auth/popup-blocked':
      'El navegador bloqueó la ventana de inicio de sesión.',

    'auth/account-exists-with-different-credential':
      'Ya existe una cuenta con ese correo utilizando otro método de acceso.',

    'permission-denied':
      'Firebase rechazó la operación por permisos.',

    'storage/unauthorized':
      'No tienes permiso para subir esta imagen.',

    'storage/quota-exceeded':
      'Se alcanzó la cuota disponible de almacenamiento.',
  };

  return (
    messages[code] ||
    error?.message ||
    'Ocurrió un error inesperado.'
  );
}


/*
===============================================================================
 COMPONENTE
===============================================================================
*/

export default function ProfileModal({
  showProfilePanel,
  setShowProfilePanel,
  currentUser,
  setCurrentUser,
  isLight,
}) {

  /*
  ============================================================================
   AUTENTICACIÓN
  ============================================================================
  */

  const [authReady, setAuthReady] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  /*
  ============================================================================
   MODOS
  ============================================================================
  */

  const [authMode, setAuthMode] =
    useState('login');
  // login | register | forgot


  /*
  ============================================================================
   LOGIN
  ============================================================================
  */

  const [loginUser, setLoginUser] =
    useState('');

  const [loginPass, setLoginPass] =
    useState('');

  /*
  ============================================================================
   REGISTRO
  ============================================================================
  */

  const [regNombre, setRegNombre] =
    useState('');

  const [regNick, setRegNick] =
    useState('');

  const [regTel, setRegTel] =
    useState('');

  const [regEmail, setRegEmail] =
    useState('');

  const [regPass, setRegPass] =
    useState('');

  const [regConfirmPass, setRegConfirmPass] =
    useState('');

  /*
  ============================================================================
   RECUPERACIÓN
  ============================================================================
  */

  const [recoveryEmail, setRecoveryEmail] =
    useState('');

  /*
  ============================================================================
   PERFIL
  ============================================================================
  */

  const [isEditing, setIsEditing] =
    useState(false);

  const [editNombre, setEditNombre] =
    useState('');

  const [editNick, setEditNick] =
    useState('');

  const [editTel, setEditTel] =
    useState('');

  const [editEdad, setEditEdad] =
    useState('');

  const [editSexo, setEditSexo] =
    useState('Otro');

  const [selectedAvatar, setSelectedAvatar] =
    useState('👩‍🦰');

  const [customAvatarImg, setCustomAvatarImg] =
    useState('');

  const [selectedFile, setSelectedFile] =
    useState(null);

  /*
  ============================================================================
   UI
  ============================================================================
  */

  const [showPass, setShowPass] =
    useState(false);

  const [showConfirmPass, setShowConfirmPass] =
    useState(false);

  const [errorMsg, setErrorMsg] =
    useState('');

  const [successMsg, setSuccessMsg] =
    useState('');

  /*
  ============================================================================
   AVATARES
  ============================================================================
  */

  const avatarOptions = [
    '👩‍🦰',
    '👨‍🦱',
    '👸',
    '🤴',
    '🦸‍♂️',
    '🦊',
    '🐯',
    '🦁',
    '🐼',
    '🤖',
  ];

  /*
  ============================================================================
   USUARIO EFECTIVO
  ============================================================================
   Ignoramos cualquier string viejo que pudiera quedar en App/localStorage.
  */

  const effectiveUser =
    currentUser &&
    typeof currentUser === 'object' &&
    currentUser.uid
      ? currentUser
      : null;


  /*
  ============================================================================
   PASSWORD MATCH
  ============================================================================
  */

  const passwordsMatch =
    regPass.length > 0 &&
    regConfirmPass.length > 0 &&
    regPass === regConfirmPass;

  const passwordsMismatch =
    regConfirmPass.length > 0 &&
    regPass !== regConfirmPass;


  /*
===============================================================================
 AUTENTICACIÓN GLOBAL
===============================================================================
*/

  useEffect(() => {
    let mounted = true;

    let unsubscribe = null;

    const initializeAuthListener =
      async () => {

        try {
          /*
          --------------------------------------------------------------------
          Persistencia local de Firebase.
          Esto permite mantener la sesión aunque el usuario cierre el
          navegador y regrese posteriormente.
          --------------------------------------------------------------------
          */

          await setPersistence(
            auth,
            browserLocalPersistence
          );
        } catch (error) {
          console.error(
            'No se pudo configurar la persistencia Firebase:',
            error
          );
        }

        if (!mounted) {
          return;
        }

        /*
        ----------------------------------------------------------------------
        OBSERVADOR REAL DE SESIÓN
        ----------------------------------------------------------------------
        */

        unsubscribe =
          onAuthStateChanged(
            auth,
            async (firebaseUser) => {

              if (!mounted) {
                return;
              }

              /*
              ----------------------------------------------------------------
              NO HAY SESIÓN
              ----------------------------------------------------------------
              */

              if (!firebaseUser) {
                setCurrentUser(null);
                setAuthReady(true);
                return;
              }

              try {
                /*
                --------------------------------------------------------------
                Refrescar usuario.
                --------------------------------------------------------------
                */

                try {
                  await reload(firebaseUser);
                } catch (reloadError) {
                  console.warn(
                    'No se pudo recargar usuario:',
                    reloadError
                  );
                }

                /*
                --------------------------------------------------------------
                Verificación de correo para cuentas password.
                Google/Facebook no pasan por esta restricción.
                --------------------------------------------------------------
                */

                const providerId =
                  firebaseUser
                    .providerData?.[0]
                    ?.providerId || '';

                if (
                  providerId === 'password' &&
                  !firebaseUser.emailVerified
                ) {

                  await signOut(auth);

                  if (mounted) {
                    setCurrentUser(null);
                    setAuthReady(true);
                  }

                  return;
                }

                /*
                --------------------------------------------------------------
                Obtener perfil Firestore.
                --------------------------------------------------------------
                */

                const profileRef =
                  doc(
                    db,
                    'users',
                    firebaseUser.uid
                  );

                const profileSnapshot =
                  await getDoc(profileRef);

                let profile = null;

                if (
                  profileSnapshot.exists()
                ) {
                  profile =
                    profileSnapshot.data();
                }

                /*
                --------------------------------------------------------------
                Si es una cuenta social que todavía no tiene perfil,
                creamos uno.
                --------------------------------------------------------------
                */

                if (
                  !profile &&
                  providerId !== 'password'
                ) {

                  profile =
                    await createSocialProfile(
                      firebaseUser
                    );
                }

                /*
                --------------------------------------------------------------
                Si es una cuenta password antigua sin perfil,
                creamos uno mínimo.
                --------------------------------------------------------------
                */

                if (
                  !profile &&
                  firebaseUser.email
                ) {

                  const base =
                    normalizeNickname(
                      firebaseUser
                        .email
                        .split('@')[0]
                    )
                    .replace(
                      /[^a-z0-9._]/g,
                      ''
                    )
                    .slice(0, 16);

                  const finalBase =
                    base.length >= 3
                      ? base
                      : 'cazador';

                  const nickname =
                    await generateUniqueNickname(
                      finalBase,
                      firebaseUser.uid,
                      firebaseUser.email
                    );

                  profile = {
                    uid:
                      firebaseUser.uid,

                    email:
                      firebaseUser.email,

                    nombre:
                      firebaseUser
                        .displayName ||
                      finalBase,

                    nickname,

                    nicknameLower:
                      nickname,

                    telefono: '',

                    edad: '',

                    sexo: 'Otro',

                    avatar: '👩‍🦰',

                    photoURL:
                      firebaseUser.photoURL ||
                      '',

                    provider:
                      'password',

                    role: 'user',

                    status: 'active',

                    emailVerified:
                      Boolean(
                        firebaseUser.emailVerified
                      ),

                    createdAt:
                      serverTimestamp(),

                    updatedAt:
                      serverTimestamp(),

                    lastLoginAt:
                      serverTimestamp(),
                  };

                  await setDoc(
                    profileRef,
                    profile
                  );
                }

                /*
                --------------------------------------------------------------
                Actualizar último acceso.
                --------------------------------------------------------------
                */

                try {
                  await setDoc(
                    profileRef,
                    {
                      lastLoginAt:
                        serverTimestamp(),

                      emailVerified:
                        Boolean(
                          firebaseUser.emailVerified
                        ),

                      updatedAt:
                        serverTimestamp(),
                    },
                    {
                      merge: true,
                    }
                  );
                } catch (
                  profileUpdateError
                ) {
                  console.warn(
                    'No se pudo actualizar lastLoginAt:',
                    profileUpdateError
                  );
                }

                /*
                --------------------------------------------------------------
                Construir objeto final.
                --------------------------------------------------------------
                */

                const finalUser = {
                  ...(profile || {}),

                  uid:
                    firebaseUser.uid,

                  email:
                    firebaseUser.email ||
                    profile?.email ||
                    '',

                  displayName:
                    firebaseUser
                      .displayName ||
                    profile?.nombre ||
                    profile?.nickname ||
                    '',

                  photoURL:
                    firebaseUser.photoURL ||
                    profile?.photoURL ||
                    '',

                  emailVerified:
                    Boolean(
                      firebaseUser.emailVerified
                    ),

                  provider:
                    providerId,
                };

                if (mounted) {
                  setCurrentUser(
                    finalUser
                  );

                  /*
                  ------------------------------------------------------------
                  Cargar campos de edición.
                  ------------------------------------------------------------
                  */

                  loadProfileIntoForm(
                    finalUser
                  );

                  setAuthReady(true);
                }

              } catch (error) {

                console.error(
                  'Error cargando sesión Firebase:',
                  error
                );

                if (mounted) {
                  setErrorMsg(
                    getFirebaseErrorMessage(
                      error
                    )
                  );

                  setCurrentUser(null);
                  setAuthReady(true);
                }
              }
            }
          );

      } catch (error) {

        console.error(
          'Error iniciando observador Firebase:',
          error
        );

        if (mounted) {
          setAuthReady(true);
        }
      }
    };

    initializeAuthListener();

    return () => {
      mounted = false;

      if (unsubscribe) {
        unsubscribe();
      }
    };

  }, [setCurrentUser]);


  /*
===============================================================================
 LIMPIAR localStorage ANTIGUO
===============================================================================
*/

  useEffect(() => {

    /*
    --------------------------------------------------------------------------
    NO utilizamos localStorage para autenticación.
    Eliminamos los datos de la versión anterior.
    --------------------------------------------------------------------------
    */

    const oldKeys = [
      'cazaUser',
      'cazaFullName',
      'cazaNick',
      'cazaTel',
      'cazaEdad',
      'cazaSexo',
      'cazaAvatar',
      'cazaAvatarImg',
    ];

    oldKeys.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch (err) {
        // Ignorar.
      }
    });

  }, []);


  /*
===============================================================================
 CARGAR PERFIL EN FORMULARIO
===============================================================================
*/

  function loadProfileIntoForm(user) {

    if (!user) {
      return;
    }

    setEditNombre(
      user.nombre ||
      user.displayName ||
      ''
    );

    setEditNick(
      user.nickname ||
      ''
    );

    setEditTel(
      user.telefono ||
      ''
    );

    setEditEdad(
      user.edad ||
      ''
    );

    setEditSexo(
      user.sexo ||
      'Otro'
    );

    setSelectedAvatar(
      user.avatar ||
      '👩‍🦰'
    );

    setCustomAvatarImg(
      user.photoURL ||
      ''
    );

    setSelectedFile(null);
  }


  /*
===============================================================================
 RESERVAR NICKNAME
===============================================================================
*/

  async function reserveNickname(
    nickname,
    uid,
    email
  ) {

    const normalized =
      normalizeNickname(nickname);

    if (!isValidNickname(normalized)) {
      throw new Error(
        'El nickname debe tener entre 3 y 20 caracteres y solo puede usar letras, números, punto y guion bajo.'
      );
    }

    const nicknameRef =
      doc(
        db,
        'nicknameIndex',
        normalized
      );

    /*
    --------------------------------------------------------------------------
    Transaction = dos usuarios no pueden apropiarse del mismo nickname
    al mismo tiempo.
    --------------------------------------------------------------------------
    */

    await runTransaction(
      db,
      async (transaction) => {

        const existing =
          await transaction.get(
            nicknameRef
          );

        if (existing.exists()) {

          const data =
            existing.data();

          if (
            data?.uid === uid
          ) {
            return;
          }

          const occupiedError =
            new Error(
              'Ese nickname ya está ocupado.'
            );

          occupiedError.code =
            'nickname-already-exists';

          throw occupiedError;
        }

        transaction.set(
          nicknameRef,
          {
            uid,

            email,

            nickname:
              normalized,

            nicknameLower:
              normalized,

            createdAt:
              serverTimestamp(),
          }
        );
      }
    );

    return normalized;
  }


  /*
===============================================================================
 LIBERAR NICKNAME
===============================================================================
*/

  async function releaseNickname(
    nickname,
    uid
  ) {

    if (!nickname || !uid) {
      return;
    }

    const normalized =
      normalizeNickname(nickname);

    const nicknameRef =
      doc(
        db,
        'nicknameIndex',
        normalized
      );

    const snapshot =
      await getDoc(nicknameRef);

    if (!snapshot.exists()) {
      return;
    }

    const data =
      snapshot.data();

    /*
    --------------------------------------------------------------------------
    Nunca eliminamos un nickname que pertenezca a otra cuenta.
    --------------------------------------------------------------------------
    */

    if (
      data?.uid !== uid
    ) {
      return;
    }

    await deleteDoc(
      nicknameRef
    );
  }


  /*
===============================================================================
 GENERAR NICKNAME ÚNICO
===============================================================================
*/

  async function generateUniqueNickname(
    base,
    uid,
    email
  ) {

    let cleanBase =
      normalizeNickname(base)
        .replace(
          /[^a-z0-9._]/g,
          ''
        )
        .slice(0, 16);

    if (cleanBase.length < 3) {
      cleanBase =
        'cazador';
    }

    const candidates = [
      cleanBase,
      `${cleanBase}1`,
      `${cleanBase}2`,
      `${cleanBase}3`,
      `${cleanBase}100`,
      `${cleanBase}200`,
      `${cleanBase}300`,
      `${cleanBase}${Date.now().toString().slice(-4)}`,
    ];

    for (
      const candidate of candidates
    ) {

      try {

        await reserveNickname(
          candidate,
          uid,
          email
        );

        return candidate;

      } catch (error) {

        if (
          error?.code ===
          'nickname-already-exists'
        ) {
          continue;
        }

        throw error;
      }
    }

    throw new Error(
      'No pudimos generar un nickname disponible.'
    );
  }


  /*
===============================================================================
 CREAR PERFIL SOCIAL
===============================================================================
*/

  async function createSocialProfile(
    firebaseUser
  ) {

    const displayName =
      firebaseUser.displayName ||
      firebaseUser.email?.split('@')[0] ||
      'cazador';

    const base =
      normalizeNickname(
        displayName
      )
        .replace(
          /[^a-z0-9._]/g,
          ''
        )
        .slice(0, 16);

    const nickname =
      await generateUniqueNickname(
        base,
        firebaseUser.uid,
        firebaseUser.email || ''
      );

    const profile = {
      uid:
        firebaseUser.uid,

      email:
        firebaseUser.email || '',

      nombre:
        displayName,

      nickname,

      nicknameLower:
        nickname,

      telefono: '',

      edad: '',

      sexo: 'Otro',

      avatar: '👩‍🦰',

      photoURL:
        firebaseUser.photoURL || '',

      provider:
        firebaseUser.providerData?.[0]
          ?.providerId ||
        'social',

      role: 'user',

      status: 'active',

      emailVerified:
        Boolean(
          firebaseUser.emailVerified
        ),

      createdAt:
        serverTimestamp(),

      updatedAt:
        serverTimestamp(),

      lastLoginAt:
        serverTimestamp(),
    };

    await setDoc(
      doc(
        db,
        'users',
        firebaseUser.uid
      ),
      profile
    );

    return profile;
  }


  /*
===============================================================================
 LOGIN
===============================================================================
*/

  async function intentarLogin() {

    setErrorMsg('');
    setSuccessMsg('');

    const identifier =
      loginUser.trim();

    const password =
      loginPass;

    if (
      !identifier ||
      !password
    ) {
      setErrorMsg(
        'Ingresa tu correo o nickname y contraseña.'
      );

      return;
    }

    setLoading(true);

    try {

      let email =
        identifier.toLowerCase();

      /*
      ------------------------------------------------------------------------
      SI ES NICKNAME
      ------------------------------------------------------------------------
      */

      if (
        !identifier.includes('@')
      ) {

        const normalized =
          normalizeNickname(
            identifier
          );

        if (
          !isValidNickname(
            normalized
          )
        ) {
          throw new Error(
            'El nickname no tiene un formato válido.'
          );
        }

        /*
        ----------------------------------------------------------------------
        Buscar el correo asociado al nickname.
        ----------------------------------------------------------------------
        */

        const nicknameRef =
          doc(
            db,
            'nicknameIndex',
            normalized
          );

        const nicknameSnapshot =
          await getDoc(
            nicknameRef
          );

        if (
          !nicknameSnapshot.exists()
        ) {
          throw new Error(
            'No encontramos una cuenta con ese nickname.'
          );
        }

        const nicknameData =
          nicknameSnapshot.data();

        if (
          !nicknameData?.email
        ) {
          throw new Error(
            'Ese nickname no tiene un correo asociado.'
          );
        }

        email =
          nicknameData.email
            .trim()
            .toLowerCase();
      }

      /*
      ------------------------------------------------------------------------
      LOGIN REAL DE FIREBASE
      ------------------------------------------------------------------------
      */

      const credential =
        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

      const firebaseUser =
        credential.user;

      /*
      ------------------------------------------------------------------------
      VERIFICACIÓN
      ------------------------------------------------------------------------
      */

      await reload(firebaseUser);

      if (
        !firebaseUser.emailVerified
      ) {

        try {
          await sendEmailVerification(
            firebaseUser
          );
        } catch (
          verificationError
        ) {
          console.warn(
            'No se pudo reenviar verificación:',
            verificationError
          );
        }

        await signOut(auth);

        setErrorMsg(
          'Debes verificar tu correo antes de entrar. Te enviamos nuevamente el correo de verificación.'
        );

        return;
      }

      /*
      ------------------------------------------------------------------------
      PERFIL
      ------------------------------------------------------------------------
      */

      let profile =
        await getDoc(
          doc(
            db,
            'users',
            firebaseUser.uid
          )
        );

      let profileData =
        profile.exists()
          ? profile.data()
          : null;

      /*
      ------------------------------------------------------------------------
      Si existe cuenta Auth pero no Firestore, creamos perfil.
      ------------------------------------------------------------------------
      */

      if (!profileData) {

        const nicknameBase =
          normalizeNickname(
            firebaseUser.email
              ?.split('@')[0] ||
              'cazador'
          )
            .replace(
              /[^a-z0-9._]/g,
              ''
            )
            .slice(0, 16);

        const nickname =
          await generateUniqueNickname(
            nicknameBase,
            firebaseUser.uid,
            firebaseUser.email || ''
          );

        profileData = {
          uid:
            firebaseUser.uid,

          email:
            firebaseUser.email || '',

          nombre:
            firebaseUser.displayName ||
            nickname,

          nickname,

          nicknameLower:
            nickname,

          telefono: '',

          edad: '',

          sexo: 'Otro',

          avatar: '👩‍🦰',

          photoURL:
            firebaseUser.photoURL ||
            '',

          provider: 'password',

          role: 'user',

          status: 'active',

          emailVerified:
            Boolean(
              firebaseUser.emailVerified
            ),

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),

          lastLoginAt:
            serverTimestamp(),
        };

        await setDoc(
          doc(
            db,
            'users',
            firebaseUser.uid
          ),
          profileData
        );
      }

      /*
      ------------------------------------------------------------------------
      USUARIO FINAL
      ------------------------------------------------------------------------
      */

      const finalUser = {
        ...profileData,

        uid:
          firebaseUser.uid,

        email:
          firebaseUser.email ||
          profileData.email ||
          '',

        displayName:
          firebaseUser.displayName ||
          profileData.nombre ||
          profileData.nickname ||
          '',

        photoURL:
          firebaseUser.photoURL ||
          profileData.photoURL ||
          '',

        emailVerified:
          Boolean(
            firebaseUser.emailVerified
          ),

        provider:
          firebaseUser.providerData?.[0]
            ?.providerId ||
          'password',
      };

      setCurrentUser(
        finalUser
      );

      loadProfileIntoForm(
        finalUser
      );

      setLoginUser('');
      setLoginPass('');

      setShowProfilePanel(false);

    } catch (error) {

      console.error(
        'Login:',
        error
      );

      setErrorMsg(
        error?.code ===
        'nickname-already-exists'
          ? 'Ese nickname ya está ocupado.'
          : getFirebaseErrorMessage(
              error
            )
      );

    } finally {

      setLoading(false);
    }
  }


  /*
===============================================================================
 GOOGLE / FACEBOOK
===============================================================================
*/

  async function handleSocialLogin(
    providerType
  ) {

    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {

      const provider =
        providerType === 'Google'
          ? googleProvider
          : facebookProvider;

      const result =
        await signInWithPopup(
          auth,
          provider
        );

      const firebaseUser =
        result.user;

      /*
      ------------------------------------------------------------------------
      Obtener o crear perfil.
      ------------------------------------------------------------------------
      */

      let profileSnapshot =
        await getDoc(
          doc(
            db,
            'users',
            firebaseUser.uid
          )
        );

      let profileData =
        profileSnapshot.exists()
          ? profileSnapshot.data()
          : null;

      if (!profileData) {
        profileData =
          await createSocialProfile(
            firebaseUser
          );
      }

      const finalUser = {
        ...profileData,

        uid:
          firebaseUser.uid,

        email:
          firebaseUser.email ||
          profileData.email ||
          '',

        displayName:
          firebaseUser.displayName ||
          profileData.nombre ||
          profileData.nickname ||
          '',

        photoURL:
          firebaseUser.photoURL ||
          profileData.photoURL ||
          '',

        emailVerified:
          Boolean(
            firebaseUser.emailVerified
          ),

        provider:
          firebaseUser.providerData?.[0]
            ?.providerId ||
          providerType,
      };

      setCurrentUser(
        finalUser
      );

      loadProfileIntoForm(
        finalUser
      );

      setSuccessMsg(
        `✅ Inicio de sesión con ${providerType} correcto.`
      );

      setTimeout(() => {
        if (showProfilePanel) {
          setShowProfilePanel(false);
        }
      }, 700);

    } catch (error) {

      console.error(
        'Social login:',
        error
      );

      setErrorMsg(
        getFirebaseErrorMessage(
          error
        )
      );

    } finally {

      setLoading(false);
    }
  }


  /*
===============================================================================
 REGISTRO
===============================================================================
*/

  async function finalizarRegistro() {

    setErrorMsg('');
    setSuccessMsg('');

    const nombre =
      regNombre.trim();

    const nickname =
      normalizeNickname(
        regNick
      );

    const email =
      regEmail
        .trim()
        .toLowerCase();

    const telefono =
      normalizePhone(
        regTel
      );

    /*
    --------------------------------------------------------------------------
    VALIDACIONES
    --------------------------------------------------------------------------
    */

    if (
      nombre.length < 2
    ) {
      setErrorMsg(
        'Escribe tu nombre completo.'
      );

      return;
    }

    if (
      !isValidNickname(
        nickname
      )
    ) {
      setErrorMsg(
        'El nickname debe tener entre 3 y 20 caracteres y solo usar letras, números, punto y guion bajo.'
      );

      return;
    }

    if (!email) {
      setErrorMsg(
        'Ingresa un correo electrónico.'
      );

      return;
    }

    if (
      !isStrongPassword(
        regPass
      )
    ) {
      setErrorMsg(
        'La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula y un número.'
      );

      return;
    }

    if (
      regPass !==
      regConfirmPass
    ) {
      setErrorMsg(
        'Las contraseñas no coinciden.'
      );

      return;
    }

    if (
      regTel &&
      telefono.length !== 10
    ) {
      setErrorMsg(
        'El teléfono debe tener 10 dígitos.'
      );

      return;
    }

    setLoading(true);

    let firebaseUser = null;

    let nicknameReserved = false;

    try {

      /*
      ------------------------------------------------------------------------
      CREAR CUENTA AUTH
      ------------------------------------------------------------------------
      */

      const credential =
        await createUserWithEmailAndPassword(
          auth,
          email,
          regPass
        );

      firebaseUser =
        credential.user;

      /*
      ------------------------------------------------------------------------
      ACTUALIZAR DISPLAY NAME
      ------------------------------------------------------------------------
      */

      await updateProfile(
        firebaseUser,
        {
          displayName:
            nombre,
        }
      );

      /*
      ------------------------------------------------------------------------
      RESERVAR NICKNAME
      ------------------------------------------------------------------------
      */

      await reserveNickname(
        nickname,
        firebaseUser.uid,
        email
      );

      nicknameReserved = true;

      /*
      ------------------------------------------------------------------------
      CREAR PERFIL
      ------------------------------------------------------------------------
      */

      const profile = {
        uid:
          firebaseUser.uid,

        email,

        nombre,

        nickname,

        nicknameLower:
          nickname,

        telefono,

        edad: '',

        sexo: 'Otro',

        avatar: '👩‍🦰',

        photoURL: '',

        provider:
          'password',

        role:
          'user',

        status:
          'active',

        emailVerified:
          false,

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp(),

        lastLoginAt:
          serverTimestamp(),
      };

      await setDoc(
        doc(
          db,
          'users',
          firebaseUser.uid
        ),
        profile
      );

      /*
      ------------------------------------------------------------------------
      ENVIAR VERIFICACIÓN
      ------------------------------------------------------------------------
      */

      await sendEmailVerification(
        firebaseUser
      );

      /*
      ------------------------------------------------------------------------
      NO DEJAR SESIÓN ACTIVA HASTA VERIFICAR
      ------------------------------------------------------------------------
      */

      await signOut(
        auth
      );

      /*
      ------------------------------------------------------------------------
      LIMPIAR FORMULARIO
      ------------------------------------------------------------------------
      */

      setRegNombre('');
      setRegNick('');
      setRegTel('');
      setRegEmail('');
      setRegPass('');
      setRegConfirmPass('');

      setSuccessMsg(
        '✅ Registro exitoso. Te enviamos un correo de verificación. Debes verificar tu correo antes de iniciar sesión.'
      );

      /*
      ------------------------------------------------------------------------
      VOLVER AL LOGIN
      ------------------------------------------------------------------------
      */

      setTimeout(() => {

        setAuthMode(
          'login'
        );

        setSuccessMsg('');

      }, 5000);

    } catch (error) {

      console.error(
        'Registro:',
        error
      );

      /*
      ------------------------------------------------------------------------
      ROLLBACK NICKNAME
      ------------------------------------------------------------------------
      */

      if (
        nicknameReserved &&
        firebaseUser
      ) {

        try {

          await releaseNickname(
            nickname,
            firebaseUser.uid
          );

        } catch (
          releaseError
        ) {

          console.warn(
            'No se pudo liberar nickname:',
            releaseError
          );
        }
      }

      /*
      ------------------------------------------------------------------------
      ROLLBACK CUENTA AUTH
      ------------------------------------------------------------------------
      */

      if (
        firebaseUser
      ) {

        try {

          /*
          Solo se intenta borrar la cuenta si
          el flujo falló antes de quedar terminado.
          */

          await firebaseUser.delete();

        } catch (
          deleteError
        ) {

          console.warn(
            'No se pudo eliminar usuario incompleto:',
            deleteError
          );
        }
      }

      if (
        error?.code ===
        'nickname-already-exists'
      ) {

        setErrorMsg(
          '⚠️ Ese nickname ya está ocupado. Elige otro.'
        );

      } else {

        setErrorMsg(
          getFirebaseErrorMessage(
            error
          )
        );
      }

    } finally {

      setLoading(false);
    }
  }


  /*
===============================================================================
 RECUPERACIÓN
===============================================================================
*/

  async function handlePasswordReset() {

    setErrorMsg('');
    setSuccessMsg('');

    const email =
      recoveryEmail
        .trim()
        .toLowerCase();

    if (!email) {

      setErrorMsg(
        'Ingresa el correo electrónico de tu cuenta.'
      );

      return;
    }

    setLoading(true);

    try {

      await sendPasswordResetEmail(
        auth,
        email
      );

      setSuccessMsg(
        '📧 Te enviamos el enlace para restablecer tu contraseña. Revisa también la carpeta de spam.'
      );

      setRecoveryEmail('');

    } catch (error) {

      console.error(
        'Password reset:',
        error
      );

      setErrorMsg(
        getFirebaseErrorMessage(
          error
        )
      );

    } finally {

      setLoading(false);
    }
  }


  /*
===============================================================================
 SUBIR FOTO
===============================================================================
*/

  async function uploadProfilePhoto(
    firebaseUser,
    file
  ) {

    if (!file) {
      return '';
    }

    if (
      !file.type.startsWith(
        'image/'
      )
    ) {

      throw new Error(
        'El archivo seleccionado no es una imagen.'
      );
    }

    /*
    --------------------------------------------------------------------------
    Máximo 5 MB.
    --------------------------------------------------------------------------
    */

    if (
      file.size >
      5 * 1024 * 1024
    ) {

      throw new Error(
        'La imagen no puede superar los 5 MB.'
      );
    }

    const fileRef =
      ref(
        storage,
        `profilePhotos/${firebaseUser.uid}/avatar`
      );

    await uploadBytes(
      fileRef,
      file,
      {
        contentType:
          file.type,
      }
    );

    return await getDownloadURL(
      fileRef
    );
  }


  /*
===============================================================================
 ELIMINAR FOTO
===============================================================================
*/

  async function removeProfilePhoto(
    uid
  ) {

    if (!uid) {
      return;
    }

    const fileRef =
      ref(
        storage,
        `profilePhotos/${uid}/avatar`
      );

    try {

      await deleteObject(
        fileRef
      );

    } catch (error) {

      /*
      Si no existe, no hay nada que borrar.
      */

      if (
        error?.code !==
        'storage/object-not-found'
      ) {
        throw error;
      }
    }
  }


  /*
===============================================================================
 SELECCIONAR FOTO
===============================================================================
*/

  function handleFileChange(
    event
  ) {

    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');

    if (
      !file.type.startsWith(
        'image/'
      )
    ) {

      setErrorMsg(
        'Selecciona una imagen válida.'
      );

      return;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {

      setErrorMsg(
        'La imagen no puede superar los 5 MB.'
      );

      return;
    }

    /*
    --------------------------------------------------------------------------
    Vista previa local.
    --------------------------------------------------------------------------
    */

    if (
      customAvatarImg?.startsWith(
        'blob:'
      )
    ) {

      try {
        URL.revokeObjectURL(
          customAvatarImg
        );
      } catch (err) {
        // Ignorar.
      }
    }

    const preview =
      URL.createObjectURL(
        file
      );

    setSelectedFile(
      file
    );

    setCustomAvatarImg(
      preview
    );
  }


  /*
===============================================================================
 GUARDAR PERFIL
===============================================================================
*/

  async function guardarCambiosPerfil() {

    setErrorMsg('');
    setSuccessMsg('');

    const firebaseUser =
      auth.currentUser;

    if (!firebaseUser) {

      setErrorMsg(
        'Tu sesión expiró. Inicia sesión nuevamente.'
      );

      return;
    }

    const nombre =
      editNombre.trim();

    const nickname =
      normalizeNickname(
        editNick
      );

    const telefono =
      normalizePhone(
        editTel
      );

    if (
      nombre.length < 2
    ) {

      setErrorMsg(
        'El nombre no puede estar vacío.'
      );

      return;
    }

    if (
      !isValidNickname(
        nickname
      )
    ) {

      setErrorMsg(
        'El nickname debe tener entre 3 y 20 caracteres y usar solo letras, números, punto y guion bajo.'
      );

      return;
    }

    if (
      editTel &&
      telefono.length !== 10
    ) {

      setErrorMsg(
        'El teléfono debe contener 10 dígitos.'
      );

      return;
    }

    if (
      editEdad &&
      (
        Number(editEdad) < 1 ||
        Number(editEdad) > 120
      )
    ) {

      setErrorMsg(
        'La edad debe estar entre 1 y 120 años.'
      );

      return;
    }

    setLoading(true);

    const oldNickname =
      normalizeNickname(
        effectiveUser?.nickname ||
        ''
      );

    let newNicknameReserved =
      false;

    try {

      /*
      ------------------------------------------------------------------------
      Si cambió nickname:
      primero lo reservamos.
      ------------------------------------------------------------------------
      */

      if (
        oldNickname !==
        nickname
      ) {

        await reserveNickname(
          nickname,
          firebaseUser.uid,
          firebaseUser.email || ''
        );

        newNicknameReserved =
          true;
      }

      /*
      ------------------------------------------------------------------------
      FOTO
      ------------------------------------------------------------------------
      */

      let finalPhotoURL =
        effectiveUser?.photoURL ||
        '';

      /*
      ------------------------------------------------------------------------
      Si hay un archivo nuevo, lo subimos.
      ------------------------------------------------------------------------
      */

      if (
        selectedFile
      ) {

        finalPhotoURL =
          await uploadProfilePhoto(
            firebaseUser,
            selectedFile
          );
      }

      /*
      ------------------------------------------------------------------------
      Si el usuario eligió emoji:
      eliminamos foto.
      ------------------------------------------------------------------------
      */

      if (
        !selectedFile &&
        !customAvatarImg
      ) {

        await removeProfilePhoto(
          firebaseUser.uid
        );

        finalPhotoURL =
          '';
      }

      /*
      ------------------------------------------------------------------------
      Actualizar Firebase Authentication
      ------------------------------------------------------------------------
      */

      await updateProfile(
        firebaseUser,
        {
          displayName:
            nombre,

          photoURL:
            finalPhotoURL || null,
        }
      );

      /*
      ------------------------------------------------------------------------
      Firestore
      ------------------------------------------------------------------------
      */

      const userRef =
        doc(
          db,
          'users',
          firebaseUser.uid
        );

      await setDoc(
        userRef,
        {
          nombre,

          nickname,

          nicknameLower:
            nickname,

          telefono,

          edad:
            editEdad
              ? String(editEdad)
              : '',

          sexo:
            editSexo || 'Otro',

          avatar:
            selectedAvatar,

          photoURL:
            finalPhotoURL,

          updatedAt:
            serverTimestamp(),
        },
        {
          merge: true,
        }
      );

      /*
      ------------------------------------------------------------------------
      Liberar nickname anterior.
      ------------------------------------------------------------------------
      */

      if (
        oldNickname &&
        oldNickname !== nickname
      ) {

        try {

          await releaseNickname(
            oldNickname,
            firebaseUser.uid
          );

        } catch (
          releaseError
        ) {

          console.warn(
            'No se pudo liberar el nickname anterior:',
            releaseError
          );
        }
      }

      /*
      ------------------------------------------------------------------------
      Actualizar estado global
      ------------------------------------------------------------------------
      */

      const updatedUser = {
        ...effectiveUser,

        uid:
          firebaseUser.uid,

        email:
          firebaseUser.email ||
          effectiveUser?.email ||
          '',

        nombre,

        nickname,

        nicknameLower:
          nickname,

        telefono,

        edad:
          editEdad
            ? String(editEdad)
            : '',

        sexo:
          editSexo || 'Otro',

        avatar:
          selectedAvatar,

        photoURL:
          finalPhotoURL,

        displayName:
          nombre,

        emailVerified:
          Boolean(
            firebaseUser.emailVerified
          ),

        provider:
          firebaseUser.providerData?.[0]
            ?.providerId ||
          effectiveUser?.provider ||
          'password',
      };

      setCurrentUser(
        updatedUser
      );

      setSelectedFile(
        null
      );

      /*
      ------------------------------------------------------------------------
      Preview blob ya no es necesario.
      ------------------------------------------------------------------------
      */

      if (
        customAvatarImg?.startsWith(
          'blob:'
        )
      ) {

        try {
          URL.revokeObjectURL(
            customAvatarImg
          );
        } catch (err) {
          // Ignorar.
        }
      }

      setCustomAvatarImg(
        finalPhotoURL
      );

      setIsEditing(
        false
      );

      setSuccessMsg(
        '✅ Perfil actualizado correctamente.'
      );

      setTimeout(() => {
        setSuccessMsg('');
      }, 3000);

    } catch (error) {

      console.error(
        'Guardar perfil:',
        error
      );

      /*
      ------------------------------------------------------------------------
      Si reservamos nickname nuevo y algo falló,
      intentamos liberarlo.
      ------------------------------------------------------------------------
      */

      if (
        newNicknameReserved
      ) {

        try {

          await releaseNickname(
            nickname,
            firebaseUser.uid
          );

        } catch (err) {
          // Ignorar.
        }
      }

      setErrorMsg(
        error?.message ||
        getFirebaseErrorMessage(
          error
        )
      );

    } finally {

      setLoading(false);
    }
  }


  /*
===============================================================================
 CERRAR SESIÓN
===============================================================================
*/

  async function cerrarSesion() {

    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {

      /*
      ------------------------------------------------------------------------
      Logout REAL de Firebase.
      ------------------------------------------------------------------------
      */

      await signOut(
        auth
      );

      /*
      ------------------------------------------------------------------------
      El listener onAuthStateChanged hará el resto.
      ------------------------------------------------------------------------
      */

      setCurrentUser(
        null
      );

      setIsEditing(
        false
      );

      setLoginUser('');
      setLoginPass('');

      setShowProfilePanel(
        false
      );

    } catch (error) {

      console.error(
        'Cerrar sesión:',
        error
      );

      setErrorMsg(
        getFirebaseErrorMessage(
          error
        )
      );

    } finally {

      setLoading(false);
    }
  }


  /*
===============================================================================
 CAMBIAR A LOGIN
===============================================================================
*/

  function goToLogin() {

    setAuthMode(
      'login'
    );

    setErrorMsg('');
    setSuccessMsg('');

  }


  /*
===============================================================================
 CAMBIAR A REGISTRO
===============================================================================
*/

  function goToRegister() {

    setAuthMode(
      'register'
    );

    setErrorMsg('');
    setSuccessMsg('');

  }


  /*
===============================================================================
 CERRAR MODAL
===============================================================================
*/

  function closeModal() {

    if (
      loading
    ) {
      return;
    }

    setShowProfilePanel(
      false
    );
  }


  /*
===============================================================================
 ESTADO DE PASSWORD
===============================================================================
*/

  const passwordStatus = useMemo(
    () => {

      if (
        !regPass
      ) {

        return {
          valid:
            false,

          text:
            'Mínimo 8 caracteres, una mayúscula, una minúscula y un número.',
        };
      }

      if (
        isStrongPassword(
          regPass
        )
      ) {

        return {
          valid:
            true,

          text:
            '✅ Contraseña segura',
        };
      }

      return {
        valid:
          false,

        text:
          'La contraseña debe contener 8 caracteres, una mayúscula, una minúscula y un número.',
      };

    },
    [
      regPass,
    ]
  );


  /*
===============================================================================
 SI EL PANEL NO SE MUESTRA
===============================================================================
*/

  if (
    !showProfilePanel
  ) {
    return null;
  }


  /*
===============================================================================
 ESPERANDO FIREBASE
===============================================================================
*/

  if (
    !authReady
  ) {

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4">

        <div
          className={`rounded-3xl shadow-2xl p-8 max-w-md w-full text-center ${
            isLight
              ? 'bg-white'
              : 'bg-neutral-900'
          }`}
        >

          <Loader2
            className="animate-spin mx-auto mb-4 text-yellow-400"
            size={32}
          />

          <p
            className={
              isLight
                ? 'text-gray-700'
                : 'text-neutral-300'
            }
          >
            Verificando tu sesión...
          </p>

        </div>

      </div>
    );
  }


  /*
===============================================================================
 RENDER
===============================================================================
*/

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4">

      <motion.div
        initial={{
          opacity: 0,
          scale: 0.9,
          y: -20,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
        }}
        exit={{
          opacity: 0,
          scale: 0.9,
          y: -20,
        }}
        className={`relative rounded-3xl shadow-2xl p-5 sm:p-8 max-w-md w-full max-h-[95vh] overflow-y-auto border ${
          isLight
            ? 'bg-white border-purple-200'
            : 'bg-neutral-900 border-yellow-400/30'
        }`}
      >

        {/* ================================================================
            CERRAR
        ================================================================= */}

        <button
          onClick={
            closeModal
          }
          disabled={
            loading
          }
          type="button"
          className="absolute top-4 right-4 z-10 text-gray-500 hover:text-red-500 disabled:opacity-40"
        >
          <X className="w-6 h-6" />
        </button>


        {/* ================================================================
            HEADER
        ================================================================= */}

        <div className="text-center">

          <div className="flex items-center justify-between mb-4 pr-6">

            <h2
              className={`text-lg sm:text-xl font-bold flex items-center gap-2 ${
                isLight
                  ? 'text-purple-700'
                  : 'text-yellow-400'
              }`}
            >

              <User className="w-5 h-5" />

              MI PERFIL CAZAOFERTAS

            </h2>

          </div>


          {/* ==============================================================
              ERROR
          ============================================================== */}

          {errorMsg && (

            <div className="mb-3 p-3 bg-red-500/20 border border-red-500 text-red-300 text-xs rounded-xl font-bold text-left">

              {errorMsg}

            </div>

          )}


          {/* ==============================================================
              SUCCESS
          ============================================================== */}

          {successMsg && (

            <div className="mb-3 p-3 bg-green-500/20 border border-green-500 text-green-300 text-xs rounded-xl font-bold text-left flex items-start gap-2">

              <CheckCircle
                size={16}
                className="shrink-0 mt-0.5"
              />

              <span>
                {successMsg}
              </span>

            </div>

          )}


          {/* ==============================================================
              USUARIO LOGUEADO
          ============================================================== */}

          {effectiveUser ? (

            <div>

              {!isEditing ? (

                /*
                ==============================================================
                PERFIL NORMAL
                ==============================================================
                */

                <div className="p-4 sm:p-6 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 text-center">

                  <div className="flex flex-col items-center justify-center mb-3">

                    {effectiveUser.photoURL ? (

                      <img
                        src={
                          effectiveUser.photoURL
                        }
                        alt="Foto de perfil"
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-yellow-400 shadow-md"
                      />

                    ) : (

                      <span className="text-[4rem] sm:text-[5rem] leading-none">
                        {
                          effectiveUser.avatar ||
                          '👩‍🦰'
                        }
                      </span>

                    )}

                    <span className="text-yellow-400 font-bold text-sm mt-3">
                      @
                      {
                        effectiveUser.nickname ||
                        'cazador'
                      }
                    </span>

                  </div>


                  <p className="text-lg sm:text-xl font-black text-white">
                    ¡Hola,{' '}
                    {
                      effectiveUser.nickname ||
                      effectiveUser.nombre ||
                      'Cazador'
                    }
                    !
                  </p>


                  <p className="text-xs text-neutral-400 mt-2">
                    {
                      effectiveUser.nombre ||
                      ''
                    }
                  </p>


                  <p className="text-xs text-neutral-400 mt-1 break-all">
                    {
                      effectiveUser.email ||
                      ''
                    }
                  </p>


                  {effectiveUser.telefono && (

                    <p className="text-xs text-neutral-400 mt-1">
                      📞{' '}
                      {
                        effectiveUser.telefono
                      }
                    </p>

                  )}


                  {(effectiveUser.edad ||
                    effectiveUser.sexo) && (

                    <p className="text-xs text-yellow-400 mt-1">

                      {
                        effectiveUser.edad
                          ? `Edad: ${effectiveUser.edad}`
                          : ''
                      }

                      {effectiveUser.edad &&
                      effectiveUser.sexo
                        ? ' • '
                        : ''}

                      {
                        effectiveUser.sexo ||
                        ''
                      }

                    </p>

                  )}


                  <div className="mt-3">

                    {effectiveUser.emailVerified ? (

                      <span className="inline-flex items-center gap-1 text-[10px] text-green-400 font-bold">
                        <CheckCircle
                          size={13}
                        />
                        Correo verificado
                      </span>

                    ) : (

                      <span className="inline-flex items-center gap-1 text-[10px] text-red-400 font-bold">
                        Correo sin verificar
                      </span>

                    )}

                  </div>


                  <p className="text-[10px] text-neutral-500 mt-2">
                    {
                      effectiveUser.provider ===
                      'password'
                        ? 'Cuenta con correo y contraseña'
                        : `Cuenta mediante ${
                            effectiveUser.provider ||
                            'red social'
                          }`
                    }
                  </p>


                  <div className="flex flex-col sm:flex-row gap-2 mt-5 justify-center">

                    <button
                      onClick={() => {
                        setErrorMsg('');
                        setSuccessMsg('');
                        setIsEditing(true);
                      }}
                      disabled={
                        loading
                      }
                      type="button"
                      className="px-4 py-2.5 bg-yellow-400 text-black rounded-xl text-xs font-black hover:bg-yellow-300 flex items-center justify-center gap-1 disabled:opacity-50"
                    >

                      <Edit3
                        size={14}
                      />

                      Editar Perfil

                    </button>


                    <button
                      onClick={
                        cerrarSesion
                      }
                      disabled={
                        loading
                      }
                      type="button"
                      className="px-4 py-2.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-50"
                    >

                      {loading ? (

                        <Loader2
                          size={14}
                          className="animate-spin"
                        />

                      ) : (

                        <LogOut
                          size={14}
                        />

                      )}

                      Cerrar Sesión

                    </button>

                  </div>

                </div>

              ) : (

                /*
                ==============================================================
                EDITAR PERFIL
                ==============================================================
                */

                <div className="space-y-4 text-left">

                  <p className="text-xs text-yellow-400 font-bold uppercase text-center">
                    ✏️ Editando tu perfil
                  </p>


                  {/* NOMBRE */}

                  <div>

                    <label className="text-[11px] text-neutral-400 font-bold">
                      Nombre Completo
                    </label>

                    <input
                      type="text"
                      value={
                        editNombre
                      }
                      onChange={(e) =>
                        setEditNombre(
                          e.target.value
                        )
                      }
                      disabled={
                        loading
                      }
                      className="w-full px-3 py-2.5 rounded-xl border bg-neutral-950 border-neutral-700 text-white text-sm focus:outline-none focus:border-yellow-400 disabled:opacity-50"
                    />

                  </div>


                  {/* NICKNAME */}

                  <div>

                    <label className="text-[11px] text-neutral-400 font-bold">
                      Nickname
                    </label>

                    <input
                      type="text"
                      value={
                        editNick
                      }
                      onChange={(e) =>
                        setEditNick(
                          normalizeNickname(
                            e.target.value
                          )
                        )
                      }
                      maxLength={20}
                      disabled={
                        loading
                      }
                      className="w-full px-3 py-2.5 rounded-xl border bg-neutral-950 border-neutral-700 text-white text-sm focus:outline-none focus:border-yellow-400 disabled:opacity-50"
                    />

                    <p className="text-[10px] text-neutral-500 mt-1">
                      3-20 caracteres. Letras, números, punto y guion bajo.
                    </p>

                  </div>


                  {/* TELÉFONO */}

                  <div>

                    <label className="text-[11px] text-neutral-400 font-bold">
                      Teléfono
                    </label>

                    <input
                      type="tel"
                      inputMode="numeric"
                      value={
                        editTel
                      }
                      onChange={(e) =>
                        setEditTel(
                          normalizePhone(
                            e.target.value
                          )
                        )
                      }
                      maxLength={10}
                      disabled={
                        loading
                      }
                      className="w-full px-3 py-2.5 rounded-xl border bg-neutral-950 border-neutral-700 text-white text-sm focus:outline-none focus:border-yellow-400 disabled:opacity-50"
                    />

                  </div>


                  {/* EDAD / SEXO */}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                    <div>

                      <label className="text-[11px] text-neutral-400 font-bold">
                        Edad
                      </label>

                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={
                          editEdad
                        }
                        onChange={(e) =>
                          setEditEdad(
                            e.target.value
                          )
                        }
                        disabled={
                          loading
                        }
                        className="w-full px-3 py-2.5 rounded-xl border bg-neutral-950 border-neutral-700 text-white text-sm focus:outline-none focus:border-yellow-400 disabled:opacity-50"
                      />

                    </div>


                    <div>

                      <label className="text-[11px] text-neutral-400 font-bold">
                        Sexo
                      </label>

                      <select
                        value={
                          editSexo
                        }
                        onChange={(e) =>
                          setEditSexo(
                            e.target.value
                          )
                        }
                        disabled={
                          loading
                        }
                        className="w-full px-3 py-2.5 rounded-xl border bg-neutral-950 border-neutral-700 text-white text-sm focus:outline-none focus:border-yellow-400 disabled:opacity-50"
                      >

                        <option value="Masculino">
                          Masculino
                        </option>

                        <option value="Femenino">
                          Femenino
                        </option>

                        <option value="Otro">
                          Otro
                        </option>

                      </select>

                    </div>

                  </div>


                  {/* FOTO */}

                  <div>

                    <label className="text-[11px] text-neutral-400 font-bold block mb-1">
                      📷 Foto de Perfil
                    </label>

                    <div className="flex items-center gap-3 mb-2">

                      <div className="w-16 h-16 rounded-full overflow-hidden border border-yellow-400/40 bg-neutral-950 flex items-center justify-center shrink-0">

                        {customAvatarImg ? (

                          <img
                            src={
                              customAvatarImg
                            }
                            alt="Vista previa"
                            className="w-full h-full object-cover"
                          />

                        ) : (

                          <span className="text-3xl">
                            {
                              selectedAvatar
                            }
                          </span>

                        )}

                      </div>

                      <div className="flex-1">

                        <label className="cursor-pointer flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-yellow-400 text-black text-xs font-black hover:bg-yellow-300">

                          <Camera
                            size={15}
                          />

                          Seleccionar foto

                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={
                              handleFileChange
                            }
                            disabled={
                              loading
                            }
                            className="hidden"
                          />

                        </label>

                        <p className="text-[10px] text-neutral-500 mt-1">
                          PNG, JPG o WEBP. Máximo 5 MB.
                        </p>

                      </div>

                    </div>

                  </div>


                  {/* AVATAR */}

                  <div>

                    <label className="text-[11px] text-neutral-400 font-bold">
                      O elige un Avatar
                    </label>

                    <div className="grid grid-cols-5 gap-2 p-2 mt-1 bg-neutral-950 rounded-xl border border-neutral-700">

                      {avatarOptions.map(
                        (avatar) => (

                          <button
                            key={
                              avatar
                            }
                            type="button"
                            disabled={
                              loading
                            }
                            onClick={() => {

                              setSelectedAvatar(
                                avatar
                              );

                              setSelectedFile(
                                null
                              );

                              /*
                              ------------------------------------------------
                              Elegir emoji elimina la imagen personalizada.
                              ------------------------------------------------
                              */

                              if (
                                customAvatarImg?.startsWith(
                                  'blob:'
                                )
                              ) {

                                try {

                                  URL.revokeObjectURL(
                                    customAvatarImg
                                  );

                                } catch (err) {
                                  // Ignorar.
                                }
                              }

                              setCustomAvatarImg(
                                ''
                              );

                            }}
                            className={`p-2 rounded-lg text-xl transition-all disabled:opacity-50 ${
                              selectedAvatar ===
                                avatar &&
                              !customAvatarImg
                                ? 'bg-yellow-400 text-black scale-110'
                                : 'hover:bg-neutral-800'
                            }`}
                          >
                            {
                              avatar
                            }
                          </button>

                        )
                      )}

                    </div>

                  </div>


                  {/* BOTONES */}

                  <div className="flex gap-2 pt-2">

                    <button
                      onClick={
                        guardarCambiosPerfil
                      }
                      disabled={
                        loading
                      }
                      type="button"
                      className="flex-1 py-3 bg-yellow-400 text-black font-black rounded-xl text-xs uppercase shadow-lg hover:bg-yellow-300 flex items-center justify-center gap-1 disabled:opacity-50"
                    >

                      {loading ? (

                        <Loader2
                          size={15}
                          className="animate-spin"
                        />

                      ) : (

                        <Save
                          size={15}
                        />

                      )}

                      Guardar

                    </button>


                    <button
                      onClick={() => {

                        if (
                          effectiveUser
                        ) {

                          loadProfileIntoForm(
                            effectiveUser
                          );

                        }

                        setIsEditing(
                          false
                        );

                        setErrorMsg('');
                        setSuccessMsg('');

                      }}
                      disabled={
                        loading
                      }
                      type="button"
                      className="flex-1 py-3 bg-neutral-800 text-neutral-300 font-bold rounded-xl text-xs hover:bg-neutral-700 disabled:opacity-50"
                    >

                      Cancelar

                    </button>

                  </div>

                </div>

              )}

            </div>

          ) : (

            /*
            ==================================================================
            NO HAY SESIÓN
            ==================================================================
            */

            <div>

              {/* ============================================================
                  LOGIN
              ============================================================ */}

              {authMode ===
                'login' && (

                <div className="space-y-4">

                  <input
                    type="text"
                    placeholder="Correo o Nickname"
                    value={
                      loginUser
                    }
                    onChange={(e) =>
                      setLoginUser(
                        e.target.value
                      )
                    }
                    autoComplete="username"
                    disabled={
                      loading
                    }
                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:border-yellow-400 ${
                      isLight
                        ? 'bg-gray-50 border-gray-300 text-black'
                        : 'bg-neutral-950 border-neutral-700 text-white'
                    } disabled:opacity-50`}
                  />


                  <div className="relative">

                    <input
                      type={
                        showPass
                          ? 'text'
                          : 'password'
                      }
                      placeholder="Contraseña"
                      value={
                        loginPass
                      }
                      onChange={(e) =>
                        setLoginPass(
                          e.target.value
                        )
                      }
                      autoComplete="current-password"
                      disabled={
                        loading
                      }
                      className="w-full px-4 py-3 pr-11 rounded-xl border bg-neutral-950 border-neutral-700 text-white focus:outline-none focus:border-yellow-400 disabled:opacity-50"
                    />

                    <button
                      type="button"
                      disabled={
                        loading
                      }
                      onClick={() =>
                        setShowPass(
                          !showPass
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 disabled:opacity-40"
                    >

                      {showPass ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}

                    </button>

                  </div>


                  <div className="text-right">

                    <button
                      type="button"
                      disabled={
                        loading
                      }
                      onClick={() => {

                        setAuthMode(
                          'forgot'
                        );

                        setErrorMsg('');
                        setSuccessMsg('');

                      }}
                      className="text-xs text-yellow-400 hover:underline disabled:opacity-40"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>

                  </div>


                  <button
                    onClick={
                      intentarLogin
                    }
                    disabled={
                      loading
                    }
                    type="button"
                    className="w-full py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                  >

                    {loading && (
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                    )}

                    Entrar

                  </button>


                  <div className="flex items-center gap-4 my-4">

                    <div className="flex-1 border-t border-neutral-700" />

                    <span className="text-[11px] text-neutral-500">
                      O ingresa con
                    </span>

                    <div className="flex-1 border-t border-neutral-700" />

                  </div>


                  {/* GOOGLE / FACEBOOK */}

                  <div className="flex gap-3">

                    <button
                      type="button"
                      disabled={
                        loading
                      }
                      onClick={() =>
                        handleSocialLogin(
                          'Google'
                        )
                      }
                      className="flex-1 py-2.5 bg-white text-black font-bold rounded-xl text-sm border flex justify-center items-center gap-2 disabled:opacity-50"
                    >
                      Google
                    </button>


                    <button
                      type="button"
                      disabled={
                        loading
                      }
                      onClick={() =>
                        handleSocialLogin(
                          'Facebook'
                        )
                      }
                      className="flex-1 py-2.5 bg-[#1877F2] text-white font-bold rounded-xl text-sm flex justify-center items-center gap-2 disabled:opacity-50"
                    >
                      Facebook
                    </button>

                  </div>


                  <hr className="border-neutral-800 my-4" />


                  <button
                    type="button"
                    disabled={
                      loading
                    }
                    onClick={
                      goToRegister
                    }
                    className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl border border-neutral-700 disabled:opacity-50"
                  >
                    Crear Cuenta Nueva
                  </button>

                </div>

              )}


              {/* ============================================================
                  RECUPERACIÓN
              ============================================================ */}

              {authMode ===
                'forgot' && (

                <div className="space-y-4 text-left">

                  <div className="flex items-center gap-2 mb-2">

                    <button
                      type="button"
                      disabled={
                        loading
                      }
                      onClick={
                        goToLogin
                      }
                      className="text-neutral-400 hover:text-white disabled:opacity-40"
                    >

                      <ArrowLeft
                        size={18}
                      />

                    </button>


                    <h3 className="text-sm font-bold text-yellow-400">
                      Recuperar Contraseña
                    </h3>

                  </div>


                  <div className="relative">

                    <Mail
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
                      size={18}
                    />

                    <input
                      type="email"
                      placeholder="Correo electrónico"
                      value={
                        recoveryEmail
                      }
                      onChange={(e) =>
                        setRecoveryEmail(
                          e.target.value
                        )
                      }
                      disabled={
                        loading
                      }
                      className="w-full pl-10 pr-3 py-3 rounded-xl border bg-neutral-950 border-neutral-700 text-white focus:outline-none focus:border-yellow-400 disabled:opacity-50"
                    />

                  </div>


                  <button
                    onClick={
                      handlePasswordReset
                    }
                    disabled={
                      loading
                    }
                    type="button"
                    className="w-full py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                  >

                    {loading && (
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                    )}

                    Enviar enlace de recuperación

                  </button>

                </div>

              )}


              {/* ============================================================
                  REGISTRO
              ============================================================ */}

              {authMode ===
                'register' && (

                <div className="space-y-4 text-left">

                  <div className="text-center">

                    <p className="text-sm font-bold text-yellow-400">
                      Crear cuenta
                    </p>

                    <p className="text-[10px] text-neutral-500 mt-1">
                      Los campos con * son obligatorios.
                    </p>

                  </div>


                  {/* NOMBRE */}

                  <input
                    type="text"
                    placeholder="Nombre Completo *"
                    value={
                      regNombre
                    }
                    onChange={(e) =>
                      setRegNombre(
                        e.target.value
                      )
                    }
                    disabled={
                      loading
                    }
                    autoComplete="name"
                    className="w-full px-3 py-2.5 rounded-xl border bg-neutral-950 border-neutral-700 text-white focus:outline-none focus:border-yellow-400 disabled:opacity-50"
                  />


                  {/* NICKNAME */}

                  <input
                    type="text"
                    placeholder="Nickname *"
                    value={
                      regNick
                    }
                    onChange={(e) =>
                      setRegNick(
                        normalizeNickname(
                          e.target.value
                        )
                      )
                    }
                    maxLength={20}
                    disabled={
                      loading
                    }
                    autoComplete="username"
                    className="w-full px-3 py-2.5 rounded-xl border bg-neutral-950 border-neutral-700 text-white focus:outline-none focus:border-yellow-400 disabled:opacity-50"
                  />


                  <p className="text-[10px] text-neutral-500 -mt-2">
                    3-20 caracteres. Letras, números, punto y guion bajo.
                  </p>


                  {/* TELÉFONO */}

                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="Teléfono (opcional)"
                    value={
                      regTel
                    }
                    onChange={(e) =>
                      setRegTel(
                        normalizePhone(
                          e.target.value
                        )
                      )
                    }
                    maxLength={10}
                    disabled={
                      loading
                    }
                    autoComplete="tel"
                    className="w-full px-3 py-2.5 rounded-xl border bg-neutral-950 border-neutral-700 text-white focus:outline-none focus:border-yellow-400 disabled:opacity-50"
                  />


                  {/* EMAIL */}

                  <input
                    type="email"
                    placeholder="Correo electrónico *"
                    value={
                      regEmail
                    }
                    onChange={(e) =>
                      setRegEmail(
                        e.target.value
                      )
                    }
                    disabled={
                      loading
                    }
                    autoComplete="email"
                    className="w-full px-3 py-2.5 rounded-xl border bg-neutral-950 border-neutral-700 text-white focus:outline-none focus:border-yellow-400 disabled:opacity-50"
                  />


                  {/* PASSWORD */}

                  <div className="relative">

                    <input
                      type={
                        showPass
                          ? 'text'
                          : 'password'
                      }
                      placeholder="Contraseña *"
                      value={
                        regPass
                      }
                      onChange={(e) =>
                        setRegPass(
                          e.target.value
                        )
                      }
                      disabled={
                        loading
                      }
                      autoComplete="new-password"
                      className="w-full px-3 py-2.5 pr-10 rounded-xl border bg-neutral-950 border-neutral-700 text-white focus:outline-none focus:border-yellow-400 disabled:opacity-50"
                    />

                    <button
                      type="button"
                      disabled={
                        loading
                      }
                      onClick={() =>
                        setShowPass(
                          !showPass
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 disabled:opacity-40"
                    >

                      {showPass ? (
                        <EyeOff size={17} />
                      ) : (
                        <Eye size={17} />
                      )}

                    </button>

                  </div>


                  <p
                    className={`text-[10px] ${
                      passwordStatus.valid
                        ? 'text-green-400'
                        : 'text-neutral-500'
                    }`}
                  >
                    {
                      passwordStatus.text
                    }
                  </p>


                  {/* CONFIRMAR PASSWORD */}

                  <div className="relative">

                    <input
                      type={
                        showConfirmPass
                          ? 'text'
                          : 'password'
                      }
                      placeholder="Confirmar Contraseña *"
                      value={
                        regConfirmPass
                      }
                      onChange={(e) =>
                        setRegConfirmPass(
                          e.target.value
                        )
                      }
                      disabled={
                        loading
                      }
                      autoComplete="new-password"
                      className={`w-full px-3 py-2.5 pr-10 rounded-xl border bg-neutral-950 text-white focus:outline-none disabled:opacity-50 ${
                        passwordsMismatch
                          ? 'border-red-500'
                          : passwordsMatch
                            ? 'border-green-500'
                            : 'border-neutral-700'
                      }`}
                    />

                    <button
                      type="button"
                      disabled={
                        loading
                      }
                      onClick={() =>
                        setShowConfirmPass(
                          !showConfirmPass
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 disabled:opacity-40"
                    >

                      {showConfirmPass ? (
                        <EyeOff size={17} />
                      ) : (
                        <Eye size={17} />
                      )}

                    </button>

                  </div>


                  {passwordsMatch && (

                    <p className="text-[10px] text-green-400">
                      ✅ Las contraseñas coinciden.
                    </p>

                  )}


                  {/* REGISTRAR */}

                  <button
                    onClick={
                      finalizarRegistro
                    }
                    disabled={
                      loading
                    }
                    type="button"
                    className="w-full py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                  >

                    {loading && (
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                    )}

                    Finalizar Registro

                  </button>


                  {/* VOLVER */}

                  <button
                    type="button"
                    disabled={
                      loading
                    }
                    onClick={
                      goToLogin
                    }
                    className="w-full text-xs text-neutral-400 hover:text-white underline disabled:opacity-40"
                  >
                    Volver al inicio
                  </button>

                </div>

              )}

            </div>

          )}

        </div>

      </motion.div>

    </div>
  );
}
