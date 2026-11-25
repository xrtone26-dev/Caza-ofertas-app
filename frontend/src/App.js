import React, { useState, useEffect, useCallback, useRef, useMemo, lazy, Suspense } from 'react';
import './App.css';
import {
  Sparkles,
  Tag,
  Search,
  X,
  Lock,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Settings,
  User,
  HelpCircle,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Share2,
  ChevronUp,
  ChevronDown,
  Package,
  ShoppingCart,
  ShieldCheck,
  Headphones,
  Award,
  TrendingDown,
  Star,
  Check,
  RefreshCw,
  Wifi,
  FileText,
  CreditCard,
  Battery,
  BatteryCharging,
  Maximize2,
  Scale,
  Bluetooth,
  Truck,
  DollarSign,
  Calendar,
  Smartphone,
  Users,
  Copy,
  Building2,
  Briefcase,
  ArrowRight,
  Sun,
  Moon
} from 'lucide-react';
import {
  FaWhatsapp,
  FaTelegram,
  FaFacebook,
  FaYoutube
} from "react-icons/fa";
import axios from 'axios';
import useEmblaCarousel from 'embla-carousel-react';
import { ML_CATEGORIES, classifyProduct, getCategoryById } from './utils/categories';
import { motion, AnimatePresence } from 'framer-motion';
import ChatbotWidget from './components/ChatbotWidget';
// import ProfileModal from './components/ProfileModal'; // COMENTADO: Módulo de perfil de usuario normal deshabilitado
import AdminDashboard, { decodeCoupon } from './components/AdminDashboard'; 
import {
  SectionHeader,
  AmountSearchInput,
  CarouselArrows,
  SwipeHint,
  CouponCard,
  CouponCopyDialog,
  useDialogBehavior,
  formatMoney,
} from './components/ui';

const BACKEND_URL = 'https://caza-ofertas-backend.onrender.com';
const API = BACKEND_URL;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
// Cada cuánto se refresca el catálogo mientras la pestaña está visible.
// Antes eran 30 s (≈190 KB comprimidos por petición); el backend ya cachea 60 s.
const CATALOG_REFRESH_MS = 5 * 60 * 1000;
// Cuántos productos se pintan a la vez en el carrusel (antes se pintaban los ~1 900).
const WHATSAPP_GROUP_URL = 'https://chat.whatsapp.com/IRASJWGThXcLi0VcBLolUi?mode=hqrt1';

// ==========================================
// RUTAS (hash): cada apartado y cada categoría tienen su propia vista.
//   #/                  inicio        #/ofertas/celulares  ofertas de una categoría
//   #/cupones           cupones       #/bancos             promociones bancarias
//   #/ofertas           todas         #/terminales  #/videos  #/juegos  #/unete
// Se usa hash para que funcione sin configurar el servidor y el botón "atrás" del navegador funcione.
// ==========================================
const SECTION_SLUGS = {
  inicio: '',
  cupones: 'cupones',
  bancarios: 'bancos',
  productos: 'ofertas',
  exclusivos: 'terminales',
  reels: 'videos',
  juegos: 'juegos',
  trabaja: 'unete',
};
const SLUG_TO_SECTION = Object.fromEntries(Object.entries(SECTION_SLUGS).map(([k, v]) => [v, k]));

function parseHash(hash) {
  const parts = String(hash || '').replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  const section = SLUG_TO_SECTION[parts[0] || ''] || 'inicio';
  const category = section === 'productos' && parts[1] && getCategoryById(parts[1]) ? parts[1] : null;
  return { section, category };
}

function buildHash(section, category) {
  const slug = SECTION_SLUGS[section] || '';
  if (!slug) return '#/';
  return category && section === 'productos' ? `#/${slug}/${category}` : `#/${slug}`;
}

// Navegación principal: etiqueta corta + qué encuentra el visitante en cada sección.
const MOBILE_TABS = [
  { id: 'inicio', icon: '🏠', label: 'Inicio' },
  { id: 'cupones', icon: '🎟️', label: 'Cupones' },
  { id: 'productos', icon: '🔥', label: 'Ofertas' },
  { id: 'bancarios', icon: '💳', label: 'Bancos' },
  { id: 'juegos', icon: '🎮', label: 'Juegos' },
  { id: 'exclusivos', icon: '⭐', label: 'Terminales' },
  { id: 'reels', icon: '📺', label: 'Videos' },
  { id: 'trabaja', icon: '💼', label: 'Únete' },
];

// La barra inferior del celular muestra estas 4 + "Más" (el resto va dentro de "Más").
const MOBILE_PRIMARY_TAB_IDS = ['inicio', 'productos', 'cupones', 'juegos'];
const MOBILE_MORE_TABS = [
  { id: 'bancarios', icon: '💳', label: 'Bancos', hint: 'Promociones y meses sin intereses con tu banco' },
  { id: 'exclusivos', icon: '⭐', label: 'Terminales', hint: 'Cobra con tarjeta y recibe tu dinero al instante' },
  { id: 'reels', icon: '📺', label: 'Videos', hint: 'Productos probados en video' },
  { id: 'trabaja', icon: '💼', label: 'Únete', hint: 'Trabaja con nosotros' },
];

// ==========================================
// JUEGOS: CARGA DIFERIDA (no pesan hasta que alguien llega a la sección)
// ==========================================
const loadGamesZone = () => import('./components/GamesZone');
let GamesZoneLazy = lazy(loadGamesZone);
// Si la descarga falla (mala conexión o versión nueva publicada) se crea un lazy nuevo para reintentar.
const resetGamesZone = () => { GamesZoneLazy = lazy(loadGamesZone); };

class GamesErrorBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  retry = () => { resetGamesZone(); this.setState({ failed: false }); };
  render() {
    if (this.state.failed) return this.props.renderFallback(this.retry);
    return this.props.children;
  }
}

// Monta a sus hijos solo cuando el bloque está cerca de la pantalla.
function LazyMount({ children, placeholder = null, rootMargin = '400px' }) {
  const ref = useRef(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (show) return undefined;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setShow(true);
      return undefined;
    }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setShow(true);
        io.disconnect();
      }
    }, { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [show, rootMargin]);
  return <div ref={ref}>{show ? children : placeholder}</div>;
}

function GamesZoneLoader(props) {
  const Comp = GamesZoneLazy;
  return <Comp {...props} />;
}

function GamesPlaceholder({ isLight, status = 'loading', onRetry }) {
  const isError = status === 'error';
  return (
    <div
      role={isError ? 'alert' : 'status'}
      aria-live="polite"
      className={`rounded-lg border px-5 py-12 text-center flex flex-col items-center gap-3 min-h-[320px] justify-center ${
        isLight ? 'bg-white border-gray-200 text-gray-700' : 'bg-neutral-900 border-neutral-800 text-neutral-200'
      }`}
    >
      <div className={`text-4xl ${isError ? '' : 'animate-pulse'}`} aria-hidden="true">{isError ? '⚠️' : '🎮'}</div>
      <p className="text-base font-bold">{isError ? 'No pudimos cargar los juegos' : 'Preparando los juegos…'}</p>
      <p className="text-sm max-w-sm opacity-80">
        {isError ? 'Revisa tu conexión e inténtalo de nuevo. Las ofertas siguen funcionando con normalidad.' : 'Solo tarda un momento.'}
      </p>
      {isError && onRetry && (
        <button type="button" onClick={onRetry} className="min-h-[44px] px-5 rounded-md bg-[#3483FA] hover:bg-[#2968c8] text-white font-semibold text-sm">
          Reintentar
        </button>
      )}
    </div>
  );
}

// ==========================================
// FUNCIONES UTILITARIAS Y DE SEGURIDAD
// ==========================================
export const getSafeId = (item) => {
  if (!item) return null;
  if (typeof item === 'string' || typeof item === 'number')
    return String(item);
  const keysToTry = ['id','_id','offer_id','product_id','Id','ID','uuid','key'];
  for (let key of keysToTry) {
    if (item[key] !== undefined && item[key] !== null) {
      const val = item[key];
      if (typeof val === 'string' || typeof val === 'number')
        return String(val);
      if (typeof val === 'object' && val.$oid) return String(val.$oid);
      if (typeof val === 'object' && typeof val.toString === 'function') {
        const res = val.toString();
        if (res !== '[object Object]') return res;
      }
    }
  }
  const anyIdKey = Object.keys(item).find((k) => k.toLowerCase().includes('id'));
  if (anyIdKey && item[anyIdKey] !== undefined && item[anyIdKey] !== null) {
    const val = item[anyIdKey];
    if (typeof val === 'string' || typeof val === 'number')
      return String(val);
    if (typeof val === 'object' && val.$oid) return String(val.$oid);
  }
  return null;
};

const isProductFresh = (product) => {
  if (!product) return false;
  if (product.active === false) return false;

  const rawDate =
    product.created_at ||
    product.createdAt ||
    product.updated_at ||
    product.updatedAt ||
    product.date ||
    product.fecha;

  if (!rawDate) return true;

  const publishedTime = new Date(rawDate).getTime();
  if (isNaN(publishedTime)) return true;

  return Date.now() - publishedTime <= SEVEN_DAYS_MS;
};

const getRemainingDays = (product) => {
  const rawDate =
    product?.created_at ||
    product?.createdAt ||
    product?.updated_at ||
    product?.updatedAt ||
    product?.date ||
    product?.fecha;

  if (!rawDate) return 7;

  const publishedTime = new Date(rawDate).getTime();
  if (isNaN(publishedTime)) return 7;

  const elapsedMs = Date.now() - publishedTime;
  const remainingMs = SEVEN_DAYS_MS - elapsedMs;
  const daysLeft = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));

  return Math.min(7, Math.max(1, daysLeft));
};

export const getBankInfo = (title = '') => {
  const t = (title || '').toLowerCase();
  if (t.includes('bbva')) {
    return { name: 'BBVA', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2b/BBVA_2019.svg' };
  } else if (t.includes('santander')) {
    return { name: 'SANTANDER', logo: 'https://upload.wikimedia.org/wikipedia/commons/b/b8/Banco_Santander_Logotipo.svg' };
  } else if (t.includes('banorte')) {
    return { name: 'BANORTE', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/5a/Banorte_logo.svg' };
  } else if (t.includes('citibanamex') || t.includes('banamex')) {
    return { name: 'CITIBANAMEX', logo: 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Citibanamex_logo.svg' };
  } else if (t.includes('hsbc')) {
    return { name: 'HSBC', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/aa/HSBC_logo_%282018%29.svg' };
  } else if (t.includes('nu')) {
    return { name: 'NU', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/f7/Nu_logo.svg' };
  } else if (t.includes('amex') || t.includes('american express')) {
    return { name: 'AMEX', logo: 'https://upload.wikimedia.org/wikipedia/commons/3/30/American_Express_logo_%282018%29.svg' };
  }
  return { name: 'BANCO', logo: null };
};

// ==========================================
// CONTADOR CIRCULAR
// ==========================================
function VisitorCounter({ isLight }) {
  const [count, setCount] = useState(() => {
    try {
      const visited = sessionStorage.getItem('cazaSessionVisited');
      const saved = localStorage.getItem('cazaRealVisitorCount');
      if (!visited) {
        sessionStorage.setItem('cazaSessionVisited', 'true');
        const newCount = saved ? Number(saved) + 1 : 1;
        localStorage.setItem('cazaRealVisitorCount', newCount);
        return newCount;
      }
      return saved ? Number(saved) : 1;
    } catch {
      return 1;
    }
  });

  return (
    <div 
      className={`w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full shadow-2xl flex flex-col items-center justify-center border-2 transition-all hover:scale-110 cursor-default select-none ${
        isLight 
          ? 'bg-white text-purple-600 border-purple-200' 
          : 'bg-neutral-900 text-yellow-400 border-yellow-400/50'
      }`}
      title={`Visitantes: ${count.toLocaleString()}`}
    >
      <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 mb-0.5 animate-pulse" />
      <span className="text-[9px] sm:text-[10px] font-black leading-none">{count}</span>
    </div>
  );
}

// ==========================================
// CUBO 3D
// ==========================================
function FeatureCube({ isLight, isMobileDevice }) {
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });
  const requestRef = useRef();
  const startTimeRef = useRef(performance.now());

  const animate = useCallback((time) => {
    const elapsed = (time - startTimeRef.current) * 0.001;
    setRotation({
      x: Math.sin(elapsed * 0.6) * 55, 
      y: elapsed * 35,                                     
      z: Math.sin(elapsed * 0.4) * 20, 
    });
    requestRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [animate]);

  const neonShadow = `0 0 15px rgba(0,229,255,0.5), inset 0 0 15px rgba(0,229,255,0.3)`;
  const cubeSize = isMobileDevice ? 200 : 280;
  const tz = cubeSize / 2;

  const baseFaceClasses = `absolute p-4 md:p-6 flex flex-col justify-between backdrop-blur-xl transition-colors border-[4px] border-dotted border-[#00e5ff] ${
    isLight 
      ? 'bg-white/90 text-gray-800' 
      : 'bg-neutral-900/90 text-neutral-100'
  }`;

  const iconContainerClasses = `w-11 h-11 md:w-14 md:h-14 rounded-2xl flex-shrink-0 flex items-center justify-center mb-2 md:mb-4 border-2 shadow-[0_0_10px_rgba(0,229,255,0.4)] ${
    isLight 
      ? 'bg-[#e0ffff] text-[#00b3cc] border-[#00e5ff]' 
      : 'bg-[#00e5ff]/10 text-[#00e5ff] border-[#00e5ff]/50'
  }`;

  const badgeClasses = `text-[8px] md:text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full border self-start shadow-[0_0_8px_rgba(0,229,255,0.3)] ${
    isLight 
      ? 'bg-[#e0ffff] text-[#008b99] border-[#00e5ff]' 
      : 'bg-[#00e5ff]/10 text-[#00e5ff] border-[#00e5ff]/30'
  }`;

  const faces = [
    {
      id: 'front',
      transform: `translateZ(${tz}px)`,
      icon: Tag,
      title: 'Cupones Exclusivos',
      desc: 'Códigos de descuento únicos y de alto valor que no encontrarás en ningún otro lugar.',
      badge: 'Ahorro Garantizado'
    },
    {
      id: 'back',
      transform: `rotateY(180deg) translateZ(${tz}px)`,
      icon: ShieldCheck,
      title: 'Productos Verificados',
      desc: 'Analizamos reseñas, calidad y reputación para recomendarte solo lo mejor.',
      badge: '100% Confiable'
    },
    {
      id: 'right',
      transform: `rotateY(90deg) translateZ(${tz}px)`,
      icon: Headphones,
      title: 'Atención Personalizada',
      desc: '¿Buscas algo muy específico? Nuestro equipo te ayuda a rastrearlo al mejor precio.',
      badge: 'Soporte Directo'
    },
    {
      id: 'left',
      transform: `rotateY(-90deg) translateZ(${tz}px)`,
      icon: Award,
      title: 'Alertas en Comunidad',
      desc: 'Entérate antes que nadie de cupones relámpago, remates y errores de precio activos.',
      badge: 'Comunidad Activa'
    },
    {
      id: 'top',
      transform: `rotateX(90deg) translateZ(${tz}px)`,
      icon: TrendingDown,
      title: 'Precios Bajos',
      desc: 'Monitoreamos el mercado para asegurarnos de que siempre obtengas la mejor oferta.',
      badge: 'Monitoreo 24/7'
    },
    {
      id: 'bottom',
      transform: `rotateX(-90deg) translateZ(${tz}px)`,
      icon: Lock,
      title: 'Compras Seguras',
      desc: 'Enlaces directos a plataformas oficiales como Mercado Libre para tu tranquilidad.',
      badge: 'Sin Riesgos'
    }
  ];

  return (
    <div 
      className="relative mx-auto pointer-events-none"
      style={{ perspective: '1000px', width: `${cubeSize}px`, height: `${cubeSize}px` }}
    >
      <div 
        className="w-full h-full relative"
        style={{ 
          transformStyle: 'preserve-3d', 
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) rotateZ(${rotation.z}deg)` 
        }}
      >
        {faces.map((face) => {
          const Icon = face.icon;
          return (
            <div 
              key={face.id} 
              className={baseFaceClasses}
              style={{ 
                transform: face.transform, 
                backfaceVisibility: 'hidden',
                boxShadow: neonShadow,
                boxSizing: 'border-box',
                width: `${cubeSize}px`,
                height: `${cubeSize}px`,
              }}
            >
              <div className="flex justify-between items-start">
                <div className={iconContainerClasses}>
                  <Icon className="w-5 h-5 md:w-7 md:h-7" />
                </div>
                <span className={badgeClasses}>{face.badge}</span>
              </div>
              <div className="flex-1">
                <h3 className="text-base md:text-xl font-black tracking-tight mb-1 md:mb-2 leading-tight">{face.title}</h3>
                <p className={`text-[10px] md:text-xs leading-relaxed opacity-80 font-medium ${isLight ? 'text-gray-600' : 'text-neutral-300'}`}>
                  {face.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==========================================
// REELS PLAYER
// ==========================================
function YoutubeReelsPlayer({ videos, setTiktokVideos, setToastMessage, setShowToast, isLight }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likes, setLikes] = useState({});
  const [dislikes, setDislikes] = useState({});
  const [hearts, setHearts] = useState({});
  const [userReactions, setUserReactions] = useState({});
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const iframeRef = useRef(null);

  useEffect(() => {
    setIsPlaying(true);
  }, [currentIndex]);

  if (!videos || videos.length === 0) {
    return (
      <div className="text-center py-12 text-neutral-400 font-bold">
        No hay videos disponibles en este momento. Agrega algunos desde el panel de administración. 🎬
      </div>
    );
  }

  const safeIndex = currentIndex >= videos.length ? 0 : currentIndex;
  const currentVideo = videos[safeIndex] || videos[0];
  const videoId = currentVideo.id;

  const currentLikes = likes[videoId] !== undefined ? likes[videoId] : (currentVideo.likes || 120);
  const currentDislikes = dislikes[videoId] !== undefined ? dislikes[videoId] : (currentVideo.dislikes || 5);
  const currentHearts = hearts[videoId] !== undefined ? hearts[videoId] : (currentVideo.hearts || 539);
  const currentReaction = userReactions[videoId];

  const shareUrl = `${window.location.origin}${window.location.pathname}?video=${videoId}`;

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return '';
    let ytId = '';
    if (url.includes('shorts/')) {
      ytId = url.split('shorts/')[1]?.split('?')[0];
    } else if (url.includes('youtu.be/')) {
      ytId = url.split('youtu.be/')[1]?.split('?')[0];
    } else if (url.includes('watch?v=')) {
      ytId = url.split('watch?v=')[1]?.split('&')[0];
    } else {
      ytId = url;
    }
    return `https://www.youtube.com/embed/${ytId}?enablejsapi=1&autoplay=${isPlaying ? 1 : 0}&mute=${isMuted ? 1 : 0}&loop=1&playlist=${ytId}&controls=0&modestbranding=1&rel=0&showinfo=0&disablekb=1&iv_load_policy=3`;
  };

  const togglePlay = () => {
    const nextState = !isPlaying;
    setIsPlaying(nextState);
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({
          event: 'command',
          func: nextState ? 'playVideo' : 'pauseVideo',
          args: ''
        }),
        '*'
      );
    }
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % videos.length);
    setShowShareMenu(false);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + videos.length) % videos.length);
    setShowShareMenu(false);
  };

  const handleReaction = (type) => {
    const prevRx = userReactions[videoId];
    let newRx = { ...userReactions };
    let lDelta = 0, dDelta = 0, hDelta = 0;

    if (prevRx === type) {
      delete newRx[videoId];
      if (type === 'like') lDelta = -1;
      if (type === 'dislike') dDelta = -1;
      if (type === 'heart') hDelta = -1;
    } else {
      if (prevRx === 'like') lDelta = -1;
      if (prevRx === 'dislike') dDelta = -1;
      if (prevRx === 'heart') hDelta = -1;

      newRx[videoId] = type;
      if (type === 'like') lDelta = 1;
      if (type === 'dislike') dDelta = 1;
      if (type === 'heart') hDelta = 1;
    }

    setUserReactions(newRx);
    setLikes({ ...likes, [videoId]: currentLikes + lDelta });
    setDislikes({ ...dislikes, [videoId]: currentDislikes + dDelta });
    setHearts({ ...hearts, [videoId]: currentHearts + hDelta });
  };

  const handleShareOption = (platform) => {
    const text = `¡Mira este producto probado en CapiBara! "${currentVideo.title}":`;
    if (platform === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + shareUrl)}`, '_blank');
    } else if (platform === 'telegram') {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`, '_blank');
    } else if (platform === 'messenger') {
      window.open(`fb-messenger://share/?link=${encodeURIComponent(shareUrl)}`, '_blank');
    } else if (platform === 'copy') {
      navigator.clipboard.writeText(shareUrl);
      setToastMessage('🔗 ¡Enlace único copiado al portapapeles!');
      setShowToast(true);
    }
    setShowShareMenu(false);
  };

  const activeImgUrl = currentVideo.imageUrl || currentVideo.image_url;

  return (
    <div className="flex flex-col items-center justify-center gap-6 w-full">
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 w-full">
        <div className="hidden md:block w-14"></div>

        <div className="relative w-full max-w-[280px] sm:max-w-sm h-[460px] sm:h-[520px] bg-black rounded-3xl overflow-hidden border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col select-none">
          <div className="absolute inset-0 w-full h-full overflow-hidden bg-black pointer-events-none">
            <iframe
              ref={iframeRef}
              src={getYouTubeEmbedUrl(currentVideo.url)}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] border-0 pointer-events-none"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={currentVideo.title}
            />
          </div>
          <div className="absolute inset-0 z-10 pointer-events-none" />

          <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2.5 sm:gap-3 z-30 pointer-events-auto">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-2 sm:p-2.5 rounded-full border-2 border-black transition-all shadow-lg ${!isMuted ? 'bg-yellow-400 text-black scale-110 font-black' : 'bg-black/70 text-white hover:bg-black'}`}
              title={isMuted ? "Activar audio" : "Silenciar"}
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>

            <button
              onClick={togglePlay}
              className={`p-2 sm:p-2.5 rounded-full border-2 border-black transition-all shadow-lg ${!isPlaying ? 'bg-yellow-400 text-black scale-110 font-black' : 'bg-black/70 text-white hover:bg-black'}`}
              title={isPlaying ? "Pausar video" : "Reproducir video"}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>

            <button
              onClick={() => handleReaction('heart')}
              className={`p-2 sm:p-2.5 rounded-full border-2 border-black transition-all shadow-lg ${currentReaction === 'heart' ? 'bg-pink-500 text-white scale-110' : 'bg-black/70 text-white hover:bg-black'}`}
              title="Me encanta"
            >
              <Heart size={18} className={currentReaction === 'heart' ? 'fill-current' : ''} />
              <span className="text-[10px] font-black block mt-0.5">{currentHearts}</span>
            </button>

            <button
              onClick={() => handleReaction('like')}
              className={`p-2 sm:p-2.5 rounded-full border-2 border-black transition-all shadow-lg ${currentReaction === 'like' ? 'bg-blue-500 text-white scale-110' : 'bg-black/70 text-white hover:bg-black'}`}
              title="Me gusta"
            >
              <ThumbsUp size={18} />
              <span className="text-[10px] font-black block mt-0.5">{currentLikes}</span>
            </button>

            <button
              onClick={() => handleReaction('dislike')}
              className={`p-2 sm:p-2.5 rounded-full border-2 border-black transition-all shadow-lg ${currentReaction === 'dislike' ? 'bg-red-500 text-white scale-110' : 'bg-black/70 text-white hover:bg-red-900'}`}
              title="No me gusta"
            >
              <ThumbsDown size={18} />
              <span className="text-[10px] font-black block mt-0.5">{currentDislikes}</span>
            </button>

            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="p-2 sm:p-2.5 rounded-full bg-black/70 text-white border-2 border-black hover:bg-black hover:scale-110 transition-all shadow-lg"
              title="Compartir"
            >
              <Share2 size={18} />
            </button>
          </div>

          {showShareMenu && (
            <div className="absolute inset-0 bg-black/95 z-40 flex flex-col items-center justify-center p-6 rounded-3xl animate-fadeIn pointer-events-auto">
              <h4 className="text-yellow-400 font-black text-sm uppercase mb-4 tracking-wider">Compartir este video</h4>
              <div className="flex flex-col gap-2.5 w-full max-w-[180px]">
                <button 
                  onClick={() => handleShareOption('whatsapp')} 
                  className="flex items-center justify-center gap-2 bg-[#25D366] text-white py-2.5 px-4 rounded-xl font-bold text-xs hover:scale-105 transition-transform border border-black shadow-md"
                >
                  <span>💬 WhatsApp</span>
                </button>
                <button 
                  onClick={() => handleShareOption('telegram')} 
                  className="flex items-center justify-center gap-2 bg-[#229ED9] text-white py-2.5 px-4 rounded-xl font-bold text-xs hover:scale-105 transition-transform border border-black shadow-md"
                >
                  <span>✈️ Telegram</span>
                </button>
                <button 
                  onClick={() => handleShareOption('messenger')} 
                  className="flex items-center justify-center gap-2 bg-[#00B2FF] text-white py-2.5 px-4 rounded-xl font-bold text-xs hover:scale-105 transition-transform border border-black shadow-md"
                >
                  <span>💬 Messenger</span>
                </button>
                <button 
                  onClick={() => handleShareOption('copy')} 
                  className="flex items-center justify-center gap-2 bg-yellow-400 text-black py-2.5 px-4 rounded-xl font-black text-xs hover:scale-105 transition-transform border border-black shadow-md"
                >
                  <span>🔗 Copiar Link</span>
                </button>
              </div>
              <button 
                onClick={() => setShowShareMenu(false)} 
                className="mt-4 text-neutral-400 hover:text-white text-xs font-bold uppercase tracking-wider"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-row md:flex-col gap-4 mt-2 md:mt-0">
          <button
            onClick={handlePrev}
            className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-yellow-400 text-black border-4 border-black flex items-center justify-center hover:scale-110 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black"
            title="Video Anterior"
          >
            <ChevronUp size={24} className="md:w-7 md:h-7" />
          </button>
          <button
            onClick={handleNext}
            className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-yellow-400 text-black border-4 border-black flex items-center justify-center hover:scale-110 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black"
            title="Siguiente Video"
          >
            <ChevronDown size={24} className="md:w-7 md:h-7" />
          </button>
        </div>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-3">
        <div className="flex flex-col gap-1 px-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-yellow-400 text-black font-black flex items-center justify-center text-xs border-2 border-black">
              {currentVideo.author ? currentVideo.author.charAt(0) : 'C'}
            </div>
            <span className={`text-xs font-bold ${isLight ? 'text-purple-700' : 'text-cyan-400'}`}>@{currentVideo.author || 'CapiBara'}</span>
          </div>
          <p className={`text-sm font-black drop-shadow-md line-clamp-1 ${isLight ? 'text-purple-900' : 'text-cyan-400'}`}>{currentVideo.title}</p>
        </div>

        {currentVideo.buyUrl ? (
          <a
            href={currentVideo.buyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#FFEA00] hover:bg-yellow-300 text-black border-4 border-black rounded-2xl py-3 px-4 flex items-center justify-between gap-3 transition-transform hover:scale-[1.02] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <ShoppingCart size={22} className="flex-shrink-0" />
              <div className="flex flex-col text-left min-w-0">
                <span className="font-black text-xs md:text-sm uppercase tracking-tight leading-tight">COMPRAR PRODUCTO 🛒</span>
              </div>
            </div>

            <div className="w-16 h-14 bg-white rounded-xl border-2 border-black overflow-hidden flex-shrink-0 shadow-md flex items-center justify-center">
              {activeImgUrl ? (
                <img
                  src={activeImgUrl}
                  alt={currentVideo.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Package size={26} className="text-black" />
              )}
            </div>
          </a>
        ) : (
          <div className="w-full bg-neutral-800 text-neutral-400 border-2 border-neutral-700 rounded-2xl py-3 px-6 text-center text-xs font-bold uppercase tracking-wider">
            Sin enlace de compra asignado para este producto
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// COUNTDOWN TIMER
// ==========================================
function CountdownTimer({ expiresAt }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!expiresAt) {
      setTimeLeft('Vigente');
      return;
    }

    const updateTimer = () => {
      const targetTime = new Date(expiresAt).getTime();
      const currentTime = new Date().getTime();
      const diff = targetTime - currentTime;

      if (diff <= 0) {
        setTimeLeft('Expirado');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeLeft(`Vence en ${days} ${days === 1 ? 'día' : 'días'}`);
      } else if (hours > 0) {
        setTimeLeft(`Vence en ${hours} h`);
      } else {
        setTimeLeft(`Vence en ${Math.max(1, minutes)} min`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <span className="inline-flex items-center gap-1 text-xs font-black text-amber-200 bg-black/70 px-2.5 py-1 rounded-full border border-amber-400/40 whitespace-nowrap">
      <span aria-hidden="true">⏱</span> {timeLeft || 'Vigente'}
    </span>
  );
}

// ==========================================
// SECCIÓN TRABAJA CON NOSOTROS
// ==========================================
function renderWorkWithUsSection(isLight) {
  return (
    <div id="unete" className="container mx-auto px-4 mt-6 mb-12 relative z-20 scroll-mt-44">
      <div className={`rounded-3xl shadow-2xl p-6 sm:p-10 backdrop-blur-2xl border relative overflow-hidden ${
        isLight ? 'bg-white/90 border-cyan-200' : 'bg-neutral-900/90 border-cyan-500/30'
      }`}>
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-center justify-between gap-10 relative z-10">
          
          <div className="flex flex-col items-start text-left max-w-xl">
            <span className="inline-flex items-center gap-2 px-3.5 py-1 bg-cyan-400 text-black font-black text-xs uppercase rounded-full shadow-md mb-4 border border-black">
              🚀 OPORTUNIDAD DE COLABORACIÓN
            </span>

            <h2 className={`text-2xl sm:text-3xl md:text-4xl font-black tracking-tight mb-4 leading-tight ${
              isLight ? 'text-cyan-950' : 'text-white'
            }`}>
              ¿Quieres ganar dinero con nosotros y unirte al equipo?
            </h2>

            <p className={`text-xs sm:text-sm font-medium leading-relaxed mb-6 ${
              isLight ? 'text-gray-600' : 'text-neutral-300'
            }`}>
              Súmate a nuestra red de promotores oficiales de CapiBaraML. Te asignamos un rol, etiquetas exclusivas y herramientas automatizadas para que generes comisiones promocionando los mejores productos y cupones de Mercado Libre. ¡Trabaja con nosotros y crece con el proyecto!
            </p>

            <a
              href="https://wa.me/523312229710?text=Hola,%20quiero%20postularme%20para%20unirme%20al%20equipo%20y%20ganar%20dinero%20con%20CapiBaraML"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-3.5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-black rounded-2xl text-xs sm:text-sm uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black transition-all hover:scale-105"
            >
              <FaWhatsapp size={20} /> POSTULARME POR WHATSAPP
            </a>
          </div>

          <div className="flex items-center justify-center gap-2 sm:gap-6 shrink-0 py-4 max-w-full">
            
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-cyan-400/30 rounded-full blur-xl group-hover:bg-cyan-400/50 transition-all" />
              <div className="relative w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-cyan-400 border-4 border-black flex flex-col items-center justify-center text-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] shrink-0">
                <Users className="w-8 h-8 sm:w-11 sm:h-11 stroke-[2.5]" />
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider mt-1">EQUIPO</span>
              </div>
            </motion.div>

            <div className="relative flex items-center justify-center w-20 sm:w-32 h-20">
              <svg
                className="w-full h-full drop-shadow-[0_0_12px_rgba(6,182,212,0.8)]"
                viewBox="0 0 140 60"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="neonCyanGrad" x1="0%" y1="50%" x2="100%" y2="50%">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.2" />
                    <stop offset="40%" stopColor="#22d3ee" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="1" />
                  </linearGradient>

                  <linearGradient id="sparkleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#a5f3fc" />
                    <stop offset="100%" stopColor="#38bdf8" />
                  </linearGradient>
                </defs>

                <path d="M 15 12 L 17 15 L 20 15 L 17 17 L 18 20 L 15 18 L 12 20 L 13 17 L 10 15 L 13 15 Z" fill="url(#sparkleGrad)" opacity="0.6" />
                <path d="M 115 42 L 116.5 44 L 119 44 L 117 45.5 L 118 48 L 115 46.5 L 112 48 L 113 45.5 L 111 44 L 113.5 44 Z" fill="url(#sparkleGrad)" opacity="0.8" />

                <path
                  d="M 25 38 L 65 38 A 6 6 0 0 0 71 32 L 71 30"
                  stroke="url(#neonCyanGrad)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  opacity="0.5"
                />
                <path
                  d="M 66 28 L 71 21 L 76 28 Z"
                  fill="#22d3ee"
                  opacity="0.6"
                />

                <path
                  d="M 10 32 C 40 32, 60 30, 98 30"
                  stroke="url(#neonCyanGrad)"
                  strokeWidth="5"
                  strokeLinecap="round"
                />

                <path
                  d="M 94 18 L 122 30 L 94 42 L 100 30 Z"
                  fill="#38bdf8"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  strokeLinejoin="miter"
                />

                <motion.circle
                  r="3"
                  fill="#FFFFFF"
                  className="drop-shadow-[0_0_8px_#FFFFFF]"
                  animate={{
                    cx: [10, 105],
                    opacity: [0, 1, 1, 0]
                  }}
                  transition={{
                    duration: 1.4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  cy="30"
                />
              </svg>
            </div>

            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut', delay: 0.5 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-cyan-400/30 rounded-full blur-xl group-hover:bg-cyan-400/50 transition-all" />
              <div className="relative w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-neutral-950 border-4 border-cyan-400 flex items-center justify-center overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] shrink-0 p-1">
                <img
                  src="./logo.png"
                  alt="Logo CapiBaraML"
                  className="w-full h-full object-contain"
                />
              </div>
            </motion.div>

          </div>

        </div>
      </div>
    </div>
  );
}

// ==========================================
// RENDER NEW SECTION
// ==========================================
function renderNewSection(products = []) {
  const promoProducts = products.filter(p => p.is_promo_card && isProductFresh(p));

  if (promoProducts.length === 0) return null; 

  return (
    <div className="container mx-auto px-4 mb-16 relative z-10 flex flex-col items-center">
      {promoProducts.map((promo) => {
        const origPrice = Number(promo.original_price || 0).toLocaleString('en-US');
        const finalPrice = Number(promo.discount_price || 0).toLocaleString('en-US');
        const pId = getSafeId(promo) || promo.title;

        return (
          <div key={pId} className="max-w-[420px] w-full bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 mb-8 font-sans">
            
            <div className="bg-[#594d6e] relative pt-8 pb-4 px-6 text-center text-white min-h-[260px] flex flex-col items-center overflow-hidden">
              <h3 className="text-2xl font-bold tracking-tight mb-0.5">{promo.title}</h3>
              <p className="text-sm font-semibold text-blue-200 mb-6 flex items-center gap-1 justify-center">
                {promo.promo_subtitle}
              </p>
              {promo.image_url && (
                <img 
                  src={promo.image_url} 
                  alt={promo.title} 
                  loading="lazy"
                  decoding="async"
                  className="w-full max-w-[280px] object-contain drop-shadow-2xl z-10 relative scale-110 mt-2" 
                />
              )}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
            </div>

            <div className="p-6 sm:p-8 text-center bg-white">
              <h4 className="text-xl font-black text-black mb-4 tracking-tight">{promo.model_capacity}</h4>

              <div className="flex items-center justify-center gap-3 mb-6">
                <span className="text-gray-600 font-medium text-sm">Precio inicial</span>
                <div className="relative inline-block ml-1">
                  <span className="text-blue-600 font-black text-2xl">${origPrice}</span>
                  <div className="absolute top-1/2 left-[-10%] w-[120%] h-[3px] bg-red-500 rotate-[-12deg] transform -translate-y-1/2 shadow-sm"></div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 mb-6">
                <div className="flex-1 border-2 border-dashed border-blue-400 rounded-xl py-2.5 px-1 flex flex-col items-center justify-center bg-blue-50/30">
                  <span className="text-[10px] font-bold text-blue-600 mb-1 text-center leading-none">{promo.coupon1_desc}</span>
                  <span className="text-blue-600 font-black tracking-widest text-sm leading-none">{promo.coupon1_code}</span>
                </div>
                
                <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center font-black flex-shrink-0 text-sm border-2 border-blue-200 shadow-sm">
                  +
                </div>
                
                <div className="flex-1 border-2 border-dashed border-blue-400 rounded-xl py-2.5 px-1 flex flex-col items-center justify-center bg-blue-50/30">
                  <span className="text-[10px] font-bold text-blue-600 mb-1 text-center leading-none">{promo.coupon2_desc}</span>
                  <span className="text-blue-600 font-black tracking-widest text-sm leading-none">{promo.coupon2_code}</span>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-black font-black text-xs mb-1">Precio final con descuentos aplicados</p>
                <div className="text-[#5578F4] font-black text-4xl sm:text-5xl tracking-tight py-1">${finalPrice}</div>
              </div>

              <div className="flex items-center justify-center gap-4 sm:gap-8 py-5 border-t border-b border-gray-300 mt-2 mb-5">
                <div className="flex items-center gap-2 sm:gap-3">
                  <CreditCard size={28} className="text-[#5578F4] flex-shrink-0" strokeWidth={1.5} />
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] text-gray-500 font-black uppercase leading-none tracking-wider mb-0.5">Hasta</span>
                    <span className="text-black font-black text-xs sm:text-[15px] leading-none">{promo.msi_text}</span>
                  </div>
                </div>
                <div className="w-[1px] h-10 bg-gray-300"></div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <Truck size={28} className="text-[#5578F4] flex-shrink-0" strokeWidth={1.5} />
                  <div className="flex flex-col text-left">
                    <span className="text-black font-black text-xs sm:text-[15px] leading-none">{promo.shipping_text}</span>
                  </div>
                </div>
              </div>

              <div className="mb-6 flex flex-col gap-0.5">
                <p className="text-[#5578F4] font-black text-[13px]">{promo.affiliate_earning}</p>
                <p className="text-[#5578F4] text-[11px] font-bold opacity-80">{promo.affiliate_desc}</p>
              </div>

              <div className="mt-2">
                <a
                  href={promo.affiliate_link || promo.link || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-[#5578F4] hover:bg-blue-700 text-white font-black py-4 px-6 rounded-2xl text-sm uppercase tracking-wider transition-all shadow-[0_8px_20px_rgba(85,120,244,0.4)] hover:shadow-[0_8px_25px_rgba(85,120,244,0.6)] hover:-translate-y-1"
                >
                  <ShoppingCart size={18} /> Comprar Ahora
                </a>
              </div>

            </div>
          </div>
        );
      })}
    </div>
  );
}

// ==========================================
// ESTADO VACÍO / CARGANDO / ERROR
// ==========================================
function EmptyState({ isLight, status = 'empty', icon = '🐹', title, message, actions = [], onRetry }) {
  const isLoading = status === 'loading';
  const isError = status === 'error';
  const heading = isLoading ? 'Cargando ofertas…' : isError ? 'No pudimos cargar las ofertas' : title;
  const body = isLoading
    ? 'Estamos despertando al servidor; la primera carga puede tardar hasta 30 segundos.'
    : isError
    ? 'Revisa tu conexión o vuelve a intentarlo en unos segundos.'
    : message;

  return (
    <div
      role={isError ? 'alert' : 'status'}
      aria-live="polite"
      className={`rounded-3xl border-2 border-dashed px-5 py-10 sm:py-12 text-center flex flex-col items-center gap-3 ${
        isLight ? 'bg-white border-purple-200 text-gray-700' : 'bg-neutral-900/85 border-yellow-400/40 text-neutral-200'
      }`}
    >
      <div className={`text-4xl ${isLoading ? 'animate-pulse' : ''}`} aria-hidden="true">
        {isLoading ? '⏳' : isError ? '⚠️' : icon}
      </div>
      <p className={`text-base sm:text-lg font-black ${isLight ? 'text-gray-900' : 'text-yellow-400'}`}>{heading}</p>
      {body && <p className="text-sm max-w-md leading-relaxed opacity-90">{body}</p>}
      {isLoading && (
        <div className="w-40 h-1.5 rounded-full bg-neutral-700/40 overflow-hidden mt-1">
          <div className="h-full w-1/2 bg-yellow-400 rounded-full animate-pulse" />
        </div>
      )}
      <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-2.5 mt-2 w-full sm:w-auto">
        {isError && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="min-h-[44px] px-5 py-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs uppercase border-2 border-black"
          >
            Reintentar
          </button>
        )}
        {!isLoading && actions.map((action) =>
          action.href ? (
            <a
              key={action.label}
              href={action.href}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-xs uppercase border-2 border-black"
            >
              {action.label}
            </a>
          ) : (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              className="min-h-[44px] px-5 py-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs uppercase border-2 border-black"
            >
              {action.label}
            </button>
          )
        )}
      </div>
    </div>
  );
}

// ==========================================
// COMPONENTE PRINCIPAL APP
// ==========================================
function App() {
  const logoUrl = './logo.png';

  const logoContainerRef = useRef(null);
  const logoCardRef = useRef(null);
  const logoGlareRef = useRef(null);

  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [route, setRoute] = useState(() => parseHash(window.location.hash));
  const mobileTab = route.section;
  const navigate = (section, category = null) => {
    setShowMoreSheet(false);
    const target = buildHash(section, category);
    if (window.location.hash === target || (target === '#/' && !window.location.hash)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    window.location.hash = target; // dispara hashchange (ver efecto de abajo)
  };
  const setMobileTab = (tab) => navigate(tab);
  useEffect(() => {
    const onHash = () => {
      setRoute(parseHash(window.location.hash));
      window.scrollTo({ top: 0, behavior: 'auto' });
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const [manualExclusives, setManualExclusives] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cazaManualExclusives') || '[]');
    } catch {
      return [];
    }
  });

  const toggleManualExclusive = (productId) => {
    const updated = manualExclusives.includes(productId)
      ? manualExclusives.filter(id => id !== productId)
      : [...manualExclusives, productId];
    setManualExclusives(updated);
    localStorage.setItem('cazaManualExclusives', JSON.stringify(updated));
  };

  useEffect(() => {
    const checkDevice = () => {
      const isTouch = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isSmallScreen = window.innerWidth < 768;
      setIsMobileDevice(isTouch || isSmallScreen);
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  const handleLogoMouseMove = (e) => {
    const container = logoContainerRef.current;
    const card = logoCardRef.current;
    const glare = logoGlareRef.current;
    if (!container || !card || !glare) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = -((y - centerY) / centerY) * 25;
    const rotateY = ((x - centerX) / centerX) * 25;

    card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.08, 1.08, 1.08)`;
    glare.style.setProperty('--x', `${x}px`);
    glare.style.setProperty('--y', `${y}px`);
    glare.style.opacity = '1';
  };

  const handleLogoMouseLeave = () => {
    const card = logoCardRef.current;
    const glare = logoGlareRef.current;
    if (!card || !glare) return;
    card.style.transform = `rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    card.style.transition = 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
    glare.style.opacity = '0';
  };

  const handleLogoMouseEnter = () => {
    const card = logoCardRef.current;
    if (!card) return;
    card.style.transition = 'transform 0.08s ease-out';
  };

  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [showMoreSheet, setShowMoreSheet] = useState(false);
  useDialogBehavior(showMoreSheet, () => setShowMoreSheet(false));
  useDialogBehavior(showTutorialModal, () => setShowTutorialModal(false));
  useDialogBehavior(showPrivacyModal, () => setShowPrivacyModal(false));
  useDialogBehavior(showTermsModal, () => setShowTermsModal(false));
  
  const [tiktokVideos, setTiktokVideos] = useState(() => {
    try {
      const saved = localStorage.getItem('CapiBaraVideos');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'video-1',
        title: '¡Cazando ofertas en directo! 🛒🔥',
        author: 'CapiBara Oficial',
        url: 'https://www.youtube.com/shorts/dQw4w9WgXcQ',
        buyUrl: 'https://www.mercadolibre.com.mx',
        imageUrl: '',
        likes: 342,
        dislikes: 12,
        hearts: 1205
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('CapiBaraVideos', JSON.stringify(tiktokVideos));
  }, [tiktokVideos]);

  const [themeMode, setThemeMode] = useState('dark');
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [descuentos, setDescuentos] = useState([]);
  const [cupones, setCupones] = useState([]);
  const [cuponesBancarios, setCuponesBancarios] = useState([]);
  
  const [userReactions, setUserReactions] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('couponReactions') || '{}');
    } catch {
      return {};
    }
  });

  const [couponCounts, setCouponCounts] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('couponReactionCounts') || '{}');
    } catch {
      return {};
    }
  });

  const handleReaction = (cuponId, reactionType) => {
    const updatedUserReactions = { ...userReactions };
    const updatedCounts = { ...couponCounts };

    if (!updatedCounts[cuponId]) {
      updatedCounts[cuponId] = { like: 0, dislike: 0, heart: 0 };
    }

    const previousReaction = updatedUserReactions[cuponId];

    if (previousReaction === reactionType) {
      delete updatedUserReactions[cuponId];
      updatedCounts[cuponId][reactionType] = Math.max(0, updatedCounts[cuponId][reactionType] - 1);
    } else {
      if (previousReaction) {
        updatedCounts[cuponId][previousReaction] = Math.max(0, updatedCounts[cuponId][previousReaction] - 1);
      }
      updatedUserReactions[cuponId] = reactionType;
      updatedCounts[cuponId][reactionType] = (updatedCounts[cuponId][reactionType] || 0) + 1;
    }

    setUserReactions(updatedUserReactions);
    setCouponCounts(updatedCounts);
    localStorage.setItem('couponReactions', JSON.stringify(updatedUserReactions));
    localStorage.setItem('couponReactionCounts', JSON.stringify(updatedCounts));
  };

  const [products, setProducts] = useState([]);
  // 'loading' | 'ready' | 'error' — evita pantallas en blanco mientras Render despierta
  const [offersStatus, setOffersStatus] = useState('loading');
  const [productsStatus, setProductsStatus] = useState('loading');
  const [searchTerm, setSearchTerm] = useState('');
  const [productSearchInput, setProductSearchInput] = useState('');
  // La categoría activa vive en la URL (#/ofertas/<categoria>), así cada categoría es su propia vista.
  const selectedQuickFilter = route.section === 'productos' && route.category ? route.category : 'all';
  const setSelectedQuickFilter = (id) => navigate('productos', id === 'all' ? null : id);
  const [couponSearchTerm, setCouponSearchTerm] = useState(''); 
  const [bancarioSearchTerm, setBancarioSearchTerm] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const formatCurrencyInput = (value) => {
    const rawDigits = value.replace(/\D/g, '');
    if (!rawDigits) return '';
    return '$' + Number(rawDigits).toLocaleString('en-US');
  };

  const handleCouponSearchChange = (e) => {
    const formatted = formatCurrencyInput(e.target.value);
    setCouponSearchTerm(formatted);
  };

  const handleBancarioSearchChange = (e) => {
    const formatted = formatCurrencyInput(e.target.value);
    setBancarioSearchTerm(formatted);
  };

  const [isAdminVisible, setIsAdminVisible] = useState(false);
  const [typedCode, setTypedCode] = useState('');

  useEffect(() => {
    const handleKeyDown = async (e) => {
      if (/^[0-9]$/.test(e.key)) {
        setTypedCode((prev) => {
          const next = (prev + e.key).slice(-6);
          if (next === '060891') {
            fetch('https://api.ipify.org?format=json')
              .then((res) => res.json())
              .then((data) => {
                sessionStorage.setItem('adminAuthorizedIp', data.ip);
                setIsAdminVisible(true);
                setToastMessage(`🔓 ¡Código correcto! Panel vinculado a tu IP (${data.ip}).`);
                setShowToast(true);
              })
              .catch(() => {
                setIsAdminVisible(true);
                setToastMessage('🔓 ¡Código correcto! Panel desbloqueado.');
                setShowToast(true);
              });
          }
          return next;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCloseAdminLogin = (val) => {
    setShowAdminLogin(val);
    if (!val && !showAdminPanel) {
      setIsAdminVisible(false);
      sessionStorage.removeItem('adminAuthorizedIp');
    }
  };

  const handleCloseAdminPanel = (val) => {
    setShowAdminPanel(val);
    if (!val && !showAdminLogin) {
      setIsAdminVisible(false);
      sessionStorage.removeItem('adminAuthorizedIp');
    }
  };

  const [cuponesRef, cuponesApi] = useEmblaCarousel({ loop: true, align: 'start' });
  const [bancariosRef, bancariosApi] = useEmblaCarousel({ loop: true, align: 'start' });
  const [exclusiveEmblaRef, exclusiveEmblaApi] = useEmblaCarousel({ loop: true, align: 'start' });

  useEffect(() => {
    if (!cuponesApi) return;
    const autoplay = setInterval(() => {
      cuponesApi.scrollNext();
    }, 4000);
    return () => clearInterval(autoplay);
  }, [cuponesApi]);

  useEffect(() => {
    if (!bancariosApi) return;
    const autoplay = setInterval(() => {
      bancariosApi.scrollNext();
    }, 4000);
    return () => clearInterval(autoplay);
  }, [bancariosApi]);

  useEffect(() => {
    if (!exclusiveEmblaApi) return;
    const autoplay = setInterval(() => {
      exclusiveEmblaApi.scrollNext();
    }, 5000);
    return () => clearInterval(autoplay);
  }, [exclusiveEmblaApi]);

  const scrollPrevCupones = useCallback(() => {
    if (cuponesApi) cuponesApi.scrollPrev();
  }, [cuponesApi]);

  const scrollNextCupones = useCallback(() => {
    if (cuponesApi) cuponesApi.scrollNext();
  }, [cuponesApi]);

  const scrollPrevBancarios = useCallback(() => {
    if (bancariosApi) bancariosApi.scrollPrev();
  }, [bancariosApi]);

  const scrollNextBancarios = useCallback(() => {
    if (bancariosApi) bancariosApi.scrollNext();
  }, [bancariosApi]);

  const scrollPrevExclusive = useCallback(() => {
    if (exclusiveEmblaApi) exclusiveEmblaApi.scrollPrev();
  }, [exclusiveEmblaApi]);

  const scrollNextExclusive = useCallback(() => {
    if (exclusiveEmblaApi) exclusiveEmblaApi.scrollNext();
  }, [exclusiveEmblaApi]);

  const socialLinks = [
    {
      name: 'WhatsApp',
      icon: FaWhatsapp,
      url: 'https://chat.whatsapp.com/IRASJWGThXcLi0VcBLolUi?mode=hqrt1',
      color: 'bg-[#25D366] hover:bg-[#20bd5a]',
    },
    {
      name: 'Telegram',
      icon: FaTelegram,
      url: 'https://t.me/+QFHGS37AyAk5M2Ex',
      color: 'bg-[#229ED9] hover:bg-[#1a8ac2]',
    },
    {
      name: 'Facebook',
      icon: FaFacebook,
      url: 'https://www.facebook.com/share/1RpfPkSzit/',
      color: 'bg-[#1877F2] hover:bg-[#1367d5]',
    },
    {
      name: 'YouTube',
      icon: FaYoutube,
      url: 'https://www.youtube.com/@CazaOfertasML06',
      color: 'bg-[#FF0000] hover:bg-[#cc0000]',
    },
  ];

  useEffect(() => {
    loadPublicOffers();
    loadPublicProducts();

    // Refresco periódico solo con la pestaña visible, y al volver a ella.
    const refreshIfVisible = () => {
      if (document.visibilityState === 'visible') {
        loadPublicOffers();
        loadPublicProducts();
      }
    };
    const botSyncInterval = setInterval(refreshIfVisible, CATALOG_REFRESH_MS);
    let lastVisibleRefresh = Date.now();
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastVisibleRefresh > 60000) {
        lastVisibleRefresh = Date.now();
        refreshIfVisible();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(botSyncInterval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  // fresh=true salta la caché de 60 s del backend (se usa tras editar en el panel admin).
  const loadPublicProducts = async (fresh = false) => {
    try {
      const response = await axios.get(`${API}/products`, {
        params: fresh ? { t: Date.now() } : undefined,
        timeout: 60000,
      });
      const allProducts = Array.isArray(response.data) ? response.data : [];
      setProducts(allProducts.filter(isProductFresh));
      setProductsStatus('ready');
    } catch (error) {
      // Si ya había datos, se conservan; solo se marca error si no hay nada que mostrar.
      setProductsStatus((prev) => (prev === 'ready' ? 'ready' : 'error'));
    }
  };

  const loadPublicOffers = async (fresh = false) => {
    const params = fresh ? { t: Date.now() } : undefined;
    try {
      const [descResponse, cupResponse, bancarioResponse] = await Promise.all([
        axios.get(`${API}/offers`, { params: { type: 'descuento', ...params }, timeout: 60000 }),
        axios.get(`${API}/offers`, { params: { type: 'cupon', ...params }, timeout: 60000 }),
        axios.get(`${API}/offers`, { params: { type: 'bancario', ...params }, timeout: 60000 }).catch(() => ({ data: [] })),
      ]);
      setDescuentos(descResponse.data.map(decodeCoupon));
      setCupones(cupResponse.data.map(decodeCoupon));
      setCuponesBancarios(bancarioResponse.data.map(decodeCoupon));
      setOffersStatus('ready');
    } catch (error) {
      setOffersStatus((prev) => (prev === 'ready' ? 'ready' : 'error'));
    }
  };

  const handleSearchOnMercadoLibre = () => {
    window.open('https://mercadolibre.com/sec/1XFPeWr', '_blank');
  };

  const playSniperSound = () => {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'square';
      osc1.frequency.setValueAtTime(1800, now);
      osc1.frequency.exponentialRampToValueAtTime(120, now + 0.08);
      gain1.gain.setValueAtTime(0.35, now);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      osc1.connect(gain1).connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.15);
      setTimeout(() => ctx.close().catch(() => {}), 500);
    } catch (e) {}
  };

  // Copiar cupón: se copia el código y se muestra un diálogo con los pasos y el
  // botón para abrir Mercado Libre en otra pestaña (antes se redirigía la página
  // completa a los 5 s, sin que el usuario pudiera leer ni decidir).
  const [copyDialogCoupon, setCopyDialogCoupon] = useState(null);
  const [copyStatus, setCopyStatus] = useState('idle');

  const copyCouponCode = (code) => {
    if (!code) return;
    try {
      navigator.clipboard
        .writeText(String(code))
        .then(() => setCopyStatus('copied'))
        .catch(() => setCopyStatus('failed'));
    } catch (e) {
      setCopyStatus('failed');
    }
  };

  const handleCopiarIrMercadoLibre = (cupon) => {
    setCopyStatus('idle');
    copyCouponCode(cupon.code);
    playSniperSound();
    setCopyDialogCoupon(cupon);
  };

  const activeCupones = useMemo(() => {
    const now = Date.now();
    return cupones.filter((cupon) => {
      if (!cupon.expires_at) return true;
      return new Date(cupon.expires_at).getTime() > now;
    });
  }, [cupones]);

  const activeCuponesBancarios = useMemo(() => {
    const now = Date.now();
    return cuponesBancarios.filter((cupon) => {
      if (!cupon.expires_at) return true;
      return new Date(cupon.expires_at).getTime() > now;
    });
  }, [cuponesBancarios]);

  const filteredCupones = useMemo(() => {
    const term = couponSearchTerm.trim();
    if (!term) return activeCupones;

    const numericBudget = Number(term.replace(/\D/g, ''));
    return activeCupones.filter((cupon) => {
      if (!isNaN(numericBudget) && numericBudget > 0) {
        let minPurchase = cupon.min_purchase !== undefined && cupon.min_purchase !== null && cupon.min_purchase !== ''
          ? Number(cupon.min_purchase)
          : NaN;

        if (isNaN(minPurchase) && cupon.description) {
          const match = cupon.description.match(/minima[:\s]*\$?([\d,.]+)/i);
          if (match) {
            minPurchase = Number(match[1].replace(/\D/g, ''));
          }
        }

        if (!isNaN(minPurchase) && minPurchase > 0) {
          return numericBudget >= minPurchase;
        }
      }

      const lowerTerm = term.toLowerCase();
      const titleMatch = cupon.title ? cupon.title.toLowerCase().includes(lowerTerm) : false;
      const descMatch = cupon.description ? cupon.description.toLowerCase().includes(lowerTerm) : false;
      const codeMatch = cupon.code ? cupon.code.toLowerCase().includes(lowerTerm) : false;

      return titleMatch || descMatch || codeMatch;
    });
  }, [activeCupones, couponSearchTerm]);

  const filteredCuponesBancarios = useMemo(() => {
    const term = bancarioSearchTerm.trim();
    if (!term) return activeCuponesBancarios;

    const numericBudget = Number(term.replace(/\D/g, ''));
    return activeCuponesBancarios.filter((cupon) => {
      if (!isNaN(numericBudget) && numericBudget > 0) {
        let minPurchase = cupon.min_purchase !== undefined && cupon.min_purchase !== null && cupon.min_purchase !== ''
          ? Number(cupon.min_purchase)
          : NaN;

        if (isNaN(minPurchase) && cupon.description) {
          const match = cupon.description.match(/minima[:\s]*\$?([\d,.]+)/i);
          if (match) {
            minPurchase = Number(match[1].replace(/\D/g, ''));
          }
        }

        if (!isNaN(minPurchase) && minPurchase > 0) {
          return numericBudget >= minPurchase;
        }
      }

      const lowerTerm = term.toLowerCase();
      const titleMatch = cupon.title ? cupon.title.toLowerCase().includes(lowerTerm) : false;
      const descMatch = cupon.description ? cupon.description.toLowerCase().includes(lowerTerm) : false;
      const codeMatch = cupon.code ? cupon.code.toLowerCase().includes(lowerTerm) : false;

      return titleMatch || descMatch || codeMatch;
    });
  }, [activeCuponesBancarios, bancarioSearchTerm]);

  const isLight = themeMode === 'light';

  const exclusiveProducts = useMemo(() => {
    return products.filter(p => {
      if (!isProductFresh(p)) return false;
      const pId = getSafeId(p) || p.title;
      const isManual = manualExclusives.includes(pId);
      if (isManual) return true;

      return (
        p.is_exclusive === true || 
        p.is_exclusive === 'true' || 
        p.is_exclusive === 1 || 
        p.is_exclusive === '1' || 
        p.is_exclusive === 'yes' || 
        p.is_exclusive === 'on' ||
        p.exclusive === true ||
        p.exclusive === 'true'
      );
    });
  }, [products, manualExclusives]);

  const regularProducts = useMemo(() => {
    const exclusiveIds = new Set(exclusiveProducts.map(p => getSafeId(p) || p.title));
    return products.filter(p => {
      if (!isProductFresh(p)) return false;
      const pId = getSafeId(p) || p.title;
      return !exclusiveIds.has(pId) && !p.is_promo_card;
    });
  }, [products, exclusiveProducts]);

  // Clasificación automática (categorías de Mercado Libre): se calcula una vez por producto.
  const categoryById = useMemo(() => {
    const map = new Map();
    regularProducts.forEach((p) => map.set(getSafeId(p) || p.title, classifyProduct(p)));
    return map;
  }, [regularProducts]);

  const categoryCounts = useMemo(() => {
    const counts = {};
    categoryById.forEach((cat) => { counts[cat] = (counts[cat] || 0) + 1; });
    return counts;
  }, [categoryById]);

  const filteredProducts = useMemo(() => {
    const lowerSearch = searchTerm.trim().toLowerCase();

    return regularProducts.filter((p) => {
      if (selectedQuickFilter !== 'all' && categoryById.get(getSafeId(p) || p.title) !== selectedQuickFilter) return false;
      if (!lowerSearch) return true;
      const titleLower = p.title ? String(p.title).toLowerCase() : '';
      const descLower = p.description ? String(p.description).toLowerCase() : '';
      return titleLower.includes(lowerSearch) || descLower.includes(lowerSearch);
    });
  }, [regularProducts, searchTerm, selectedQuickFilter, categoryById]);

  const mainBgClass = `${isLight
    ? 'min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-800 relative overflow-x-clip font-sans'
    : 'min-h-screen bg-neutral-950 text-neutral-100 relative overflow-x-clip font-sans'}${isMobileDevice ? ' pb-[72px]' : ''}`;

  const renderCuponesSection = () => {
    if (activeCupones.length === 0) {
      return (
        <EmptyState
          isLight={isLight}
          status={offersStatus === 'ready' ? 'empty' : offersStatus}
          onRetry={() => loadPublicOffers(true)}
          icon="🎟️"
          title="Hoy no hay cupones activos"
          message="Los cupones de Mercado Libre se agotan rápido. Mientras tanto, revisa los productos en oferta o recibe los nuevos cupones al instante por WhatsApp."
          actions={[
            { label: '🔥 Ver productos en oferta', onClick: () => setMobileTab('productos') },
            { label: 'Avisarme por WhatsApp', href: WHATSAPP_GROUP_URL },
          ]}
        />
      );
    }
    return renderCuponesContent();
  };

  const renderCouponCarousel = ({ list, emblaRefFn, onPrev, onNext, variant, gradients, noun }) => (
    <div className="relative sm:px-10 lg:px-12">
      <div className="overflow-hidden py-2" ref={emblaRefFn}>
        <div className="flex gap-3 sm:gap-4 lg:gap-6 items-stretch">
          {list.map((cupon, idx) => {
            const cuponId = getSafeId(cupon) || cupon.title;
            const counts = couponCounts[cuponId] || { like: 0, dislike: 0, heart: 0 };
            return (
              <div
                key={cuponId}
                className={`${list.length > 1 ? 'flex-[0_0_88%] sm:flex-[0_0_80%]' : 'flex-[0_0_100%]'} lg:flex-[0_0_calc(50%-12px)] min-w-0`}
              >
                <CouponCard
                  cupon={cupon}
                  variant={variant}
                  bank={variant === 'bank' ? getBankInfo(cupon.title) : undefined}
                  gradientClass={gradients[idx % gradients.length]}
                  expiryBadge={<CountdownTimer expiresAt={cupon.expires_at} />}
                  reaction={userReactions[cuponId]}
                  counts={counts}
                  onReact={(type) => handleReaction(cuponId, type)}
                  onCopy={() => handleCopiarIrMercadoLibre(cupon)}
                />
              </div>
            );
          })}
        </div>
      </div>
      {list.length > 1 && <CarouselArrows onPrev={onPrev} onNext={onNext} label={noun === 'cupones' ? 'Cupón' : 'Promoción'} />}
      <SwipeHint count={list.length} noun={noun} isLight={isLight} />
    </div>
  );

  const renderNoMatch = (amount, onClear) => (
    <div className="text-center py-10 px-3" role="status">
      <p className={`text-base font-black mb-1 ${isLight ? 'text-gray-800' : 'text-neutral-100'}`}>
        Ningún cupón aplica para {amount}
      </p>
      <p className={`text-sm mb-4 ${isLight ? 'text-gray-600' : 'text-neutral-400'}`}>
        Prueba con un monto mayor o quita el filtro para ver todos.
      </p>
      <button
        type="button"
        onClick={onClear}
        className="min-h-[44px] px-5 py-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-sm border-2 border-black"
      >
        Ver todos
      </button>
    </div>
  );

  const renderCuponesContent = () => (
    <section aria-labelledby="sec-cupones" id="cupones" className="container mx-auto px-0 sm:px-4 mb-12 relative z-20 scroll-mt-44">
      <div className={`rounded-3xl shadow-xl p-3.5 sm:p-8 backdrop-blur-xl border ${
        isLight ? 'bg-white border-purple-200' : 'bg-neutral-900/85 border-neutral-800'
      }`}>
        <SectionHeader
          id="sec-cupones"
          icon="🎟️"
          title="Cupones de Mercado Libre"
          subtitle="Copia el código y pégalo en “Agregar cupón” antes de pagar. Cada cupón tiene un límite de usos."
          isLight={isLight}
          action={
            <button
              type="button"
              onClick={() => setShowTutorialModal(true)}
              className={`self-start sm:self-auto min-h-[44px] inline-flex items-center gap-2 px-4 rounded-xl border-2 font-black text-sm transition ${
                isLight
                  ? 'text-purple-700 border-purple-300 hover:bg-purple-50'
                  : 'text-yellow-400 border-yellow-400/50 hover:bg-yellow-400/10'
              }`}
            >
              <HelpCircle className="w-5 h-5" aria-hidden="true" /> ¿Cómo se usan?
            </button>
          }
        />

        <AmountSearchInput
          id="coupon-budget"
          label="¿Cuánto vas a gastar?"
          helper="Escribe el total de tu compra y te mostramos los cupones que aplican."
          value={couponSearchTerm}
          onChange={handleCouponSearchChange}
          onClear={() => setCouponSearchTerm('')}
          isLight={isLight}
        />

        {filteredCupones.length === 0
          ? renderNoMatch(couponSearchTerm, () => setCouponSearchTerm(''))
          : renderCouponCarousel({
              list: filteredCupones,
              emblaRefFn: cuponesRef,
              onPrev: scrollPrevCupones,
              onNext: scrollNextCupones,
              variant: 'ml',
              noun: 'cupones',
              gradients: [
                'from-amber-300 via-yellow-300 to-amber-400',
                'from-emerald-300 via-teal-300 to-emerald-400',
                'from-pink-300 via-rose-300 to-pink-400',
                'from-sky-300 via-blue-300 to-indigo-300',
              ],
            })}

        <p className={`mt-6 pt-4 border-t text-center text-xs sm:text-sm ${
          isLight ? 'border-purple-200 text-gray-600' : 'border-neutral-800 text-neutral-400'
        }`}>
          ℹ️ La vigencia y el número de usos de cada cupón los define Mercado Libre y pueden terminar antes de lo indicado.
        </p>
      </div>
    </section>
  );

  const renderCuponesBancariosSection = () => (
    <section aria-labelledby="sec-bancos" id="bancos" className="container mx-auto px-0 sm:px-4 mb-12 relative z-20 scroll-mt-44">
      <div className={`rounded-3xl shadow-xl p-3.5 sm:p-8 backdrop-blur-xl border ${
        isLight ? 'bg-white border-blue-200' : 'bg-neutral-900/85 border-neutral-800'
      }`}>
        <SectionHeader
          id="sec-bancos"
          icon="💳"
          title="Promociones con tarjeta"
          subtitle="Descuentos y meses sin intereses al pagar con tarjetas de bancos participantes."
          isLight={isLight}
        />

        {activeCuponesBancarios.length > 0 && (
          <AmountSearchInput
            id="bank-budget"
            label="¿De cuánto es tu compra?"
            helper="Te mostramos las promociones bancarias que aplican a ese monto."
            value={bancarioSearchTerm}
            onChange={handleBancarioSearchChange}
            onClear={() => setBancarioSearchTerm('')}
            isLight={isLight}
          />
        )}

        {filteredCuponesBancarios.length === 0 ? (
          activeCuponesBancarios.length === 0 ? (
            <EmptyState
              isLight={isLight}
              status={offersStatus === 'ready' ? 'empty' : offersStatus}
              onRetry={() => loadPublicOffers(true)}
              icon="🏦"
              title="Sin promociones bancarias por ahora"
              message="Cuando haya meses sin intereses o descuentos con tarjeta los verás aquí. Únete al grupo para enterarte primero."
              actions={[
                ...(isMobileDevice ? [{ label: '🔥 Ver ofertas', onClick: () => setMobileTab('productos') }] : []),
                { label: 'Avisarme por WhatsApp', href: WHATSAPP_GROUP_URL },
              ]}
            />
          ) : (
            renderNoMatch(bancarioSearchTerm, () => setBancarioSearchTerm(''))
          )
        ) : (
          renderCouponCarousel({
            list: filteredCuponesBancarios,
            emblaRefFn: bancariosRef,
            onPrev: scrollPrevBancarios,
            onNext: scrollNextBancarios,
            variant: 'bank',
            noun: 'promociones',
            gradients: [
              'from-blue-600 via-indigo-600 to-sky-700',
              'from-cyan-600 via-blue-700 to-indigo-800',
              'from-violet-600 via-purple-600 to-indigo-700',
            ],
          })
        )}

        <p className={`mt-6 pt-4 border-t text-center text-xs sm:text-sm ${
          isLight ? 'border-blue-200 text-gray-600' : 'border-neutral-800 text-neutral-400'
        }`}>
          ℹ️ Los beneficios bancarios y meses sin intereses dependen de los términos de cada banco.
        </p>
      </div>
    </section>
  );

  const renderProductosSection = () => {
    if (regularProducts.length === 0) {
      return (
        <div className="container mx-auto px-0 sm:px-4 mb-16 relative z-10">
          <EmptyState
            isLight={isLight}
            status={productsStatus === 'ready' ? 'empty' : productsStatus}
            onRetry={() => loadPublicProducts(true)}
            icon="🛒"
            title="Estamos cazando nuevas ofertas"
            message="En este momento no hay productos destacados. Puedes buscar directamente en Mercado Libre o recibir las ofertas por WhatsApp."
            actions={[
              { label: 'Buscar en Mercado Libre 🚀', onClick: handleSearchOnMercadoLibre },
              { label: 'Avisarme por WhatsApp', href: WHATSAPP_GROUP_URL },
            ]}
          />
        </div>
      );
    }
    return renderProductosContent();
  };

  const renderProductosContent = () => (
    (
      <section aria-labelledby="sec-ofertas" id="ofertas" className="container mx-auto px-0 sm:px-4 mb-16 relative z-10 scroll-mt-44">
        <div className={`rounded-lg shadow-sm p-3.5 sm:p-6 border ${
          isLight ? 'bg-white border-gray-200' : 'bg-neutral-900 border-neutral-800'
        }`}>
          <SectionHeader
            id="sec-ofertas"
            icon="🔥"
            title={selectedQuickFilter !== 'all' ? (getCategoryById(selectedQuickFilter)?.label || 'Ofertas destacadas') : 'Ofertas destacadas'}
            subtitle="Precios rebajados en Mercado Libre. Elige una categoría o busca un producto."
            isLight={isLight}
          />

          <div className="mb-5 flex flex-col gap-3">
            <div
              role="group"
              aria-label="Filtrar ofertas"
              className="flex sm:flex-wrap gap-2 overflow-x-auto no-scrollbar -mx-3.5 px-3.5 sm:mx-0 sm:px-0 pb-1"
            >
              {[{ id: 'all', short: 'Todas', icon: '🛒', count: regularProducts.length },
                ...ML_CATEGORIES.filter((c) => (categoryCounts[c.id] || 0) > 0 || c.id === selectedQuickFilter).map((c) => ({ ...c, count: categoryCounts[c.id] || 0 })),
              ].map((chip) => {
                const isSelected = selectedQuickFilter === chip.id;
                return (
                  <button
                    key={chip.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedQuickFilter(chip.id)}
                    className={`shrink-0 min-h-[40px] px-4 rounded-full text-sm font-semibold transition-colors cursor-pointer border ${
                      isSelected
                        ? isLight
                          ? 'bg-[#e3edfb] text-[#3483FA] border-[#3483FA]'
                          : 'bg-[#3483FA]/20 text-[#8dbdff] border-[#3483FA]'
                        : isLight
                        ? 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                        : 'bg-neutral-900 text-neutral-300 border-neutral-700 hover:border-neutral-500'
                    }`}
                  >
                    <span aria-hidden="true" className="mr-1">{chip.icon}</span>{chip.short} <span className="opacity-60 font-medium">({chip.count})</span>
                  </button>
                );
              })}
            </div>

            {(searchTerm || selectedQuickFilter !== 'all') && (
              <div className={`flex flex-wrap items-center justify-between gap-2 text-sm ${isLight ? 'text-gray-700' : 'text-neutral-300'}`} role="status">
                <span>
                  <strong>{filteredProducts.length}</strong> {filteredProducts.length === 1 ? 'resultado' : 'resultados'}
                  {searchTerm && <> para “<strong>{searchTerm}</strong>”</>}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setProductSearchInput('');
                    setSelectedQuickFilter('all');
                  }}
                  className="min-h-[40px] inline-flex items-center gap-1 px-3 rounded-md font-semibold text-sm text-[#3483FA] hover:bg-[#3483FA]/10"
                >
                  <X className="w-4 h-4" aria-hidden="true" /> Quitar filtros
                </button>
              </div>
            )}
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-10 px-2" role="status">
              <p className={`text-base font-black mb-1 ${isLight ? 'text-gray-800' : 'text-neutral-100'}`}>
                No encontramos ofertas con ese filtro
              </p>
              <p className={`text-sm mb-4 ${isLight ? 'text-gray-600' : 'text-neutral-400'}`}>
                Prueba con otra palabra, quita los filtros o búscalo directamente en Mercado Libre.
              </p>
              <button onClick={handleSearchOnMercadoLibre} className="min-h-[48px] bg-[#3483FA] hover:bg-[#2968c8] text-white px-6 py-3 rounded-md font-semibold text-sm">
                Buscar en Mercado Libre 🚀
              </button>
            </div>
          ) : (
            <div className="relative">
              <div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4">
                  {filteredProducts.map((product) => {
                    const pId = getSafeId(product) || product.title;
                    const remainingDays = getRemainingDays(product);
                    const origPriceNum = Number(product.original_price || 0);
                    const formattedOriginalPrice = origPriceNum < 100 && origPriceNum > 0 
                      ? (origPriceNum * 1000).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
                      : origPriceNum.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
                    // Solo presentación: el ahorro se muestra cuando el precio anterior es mayor al actual.
                    const origDisplayNum = origPriceNum < 100 && origPriceNum > 0 ? origPriceNum * 1000 : origPriceNum;
                    const priceNum = Number(product.discount_price);
                    const showsSaving = origDisplayNum > 0 && priceNum > 0 && origDisplayNum > priceNum;
                    const savingPct = product.discount_percentage || (showsSaving ? Math.round((1 - priceNum / origDisplayNum) * 100) : null);

                    return (
                      <div key={pId} className="min-w-0" style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 380px' }}>
                        <article className={`h-full flex flex-col relative rounded-lg overflow-hidden border transition-shadow hover:shadow-lg ${
                          isLight ? 'bg-white border-gray-200 shadow-sm' : 'bg-neutral-900 border-neutral-800'
                        }`}>
                          {isAuthenticated && (
                            <button
                              onClick={() => {
                                toggleManualExclusive(pId);
                                setToastMessage('⭐ Producto cambiado a Exclusivos con éxito.');
                                setShowToast(true);
                              }}
                              className="absolute top-3 left-3 z-20 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-[10px] px-2.5 py-1 rounded-lg border-2 border-black shadow-md flex items-center gap-1 transition-transform hover:scale-105"
                              title="Si este producto debe ser exclusivo, haz clic aquí"
                            >
                              <Star size={12} className="fill-black" /> Mover a Exclusivos
                            </button>
                          )}

                          <div className="relative bg-white border-b border-gray-100">
                            <img src={product.image_url} alt={product.title} loading="lazy" decoding="async" width="400" height="256" className="w-full h-32 sm:h-44 object-contain p-2 sm:p-3" />
                          </div>

                          <div className="p-3 sm:p-4 flex flex-col flex-1">
                            <h3 className={`text-[13px] sm:text-sm leading-snug line-clamp-2 min-h-[2.5rem] mb-2 ${isLight ? 'text-gray-800' : 'text-neutral-100'}`}>
                              {product.title}
                            </h3>

                            {showsSaving && (
                              <span className={`text-xs line-through ${isLight ? 'text-gray-500' : 'text-neutral-500'}`}>
                                <span className="sr-only">Precio anterior </span>${formattedOriginalPrice}
                              </span>
                            )}
                            <div className="flex items-baseline flex-wrap gap-x-2">
                              <span className={`text-xl sm:text-2xl font-normal leading-tight ${isLight ? 'text-gray-900' : 'text-neutral-50'}`}>
                                ${Number(product.discount_price).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                              </span>
                              {savingPct > 0 && (
                                <span className={`text-xs sm:text-sm font-semibold ${isLight ? 'text-[#00a650]' : 'text-[#3ddc84]'}`}>
                                  {savingPct}% OFF
                                </span>
                              )}
                            </div>
                            {showsSaving && (
                              <p className={`text-xs font-medium ${isLight ? 'text-[#00a650]' : 'text-[#3ddc84]'}`}>
                                Ahorras {formatMoney(origDisplayNum - priceNum)}
                              </p>
                            )}

                            {product.coupon && (
                              <div className={`mt-2 rounded px-2 py-1.5 border border-dashed ${
                                isLight ? 'bg-[#e8f5ee] border-[#00a650]/50 text-[#007a3d]' : 'bg-[#00a650]/15 border-[#00a650]/50 text-[#5fd99a]'
                              }`}>
                                <p className="text-[11px] leading-tight">Cupón para este producto:</p>
                                <p className="text-sm font-bold break-all">{product.coupon}</p>
                              </div>
                            )}

                            <p className={`mt-2 text-[11px] ${isLight ? 'text-gray-500' : 'text-neutral-500'}`}>
                              ⏳ Publicada aquí {remainingDays === 1 ? 'por 1 día más' : `por ${remainingDays} días más`}
                            </p>
                            {product.description && (
                              <p className={`mt-1 text-xs line-clamp-2 ${isLight ? 'text-gray-500' : 'text-neutral-400'}`}>
                                {product.description}
                              </p>
                            )}

                            <div className="mt-auto pt-3">
                              <a
                                href={product.affiliate_link || product.link || product.url || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full min-h-[44px] rounded-md bg-[#3483FA] hover:bg-[#2968c8] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
                              >
                                Ver en Mercado Libre <ExternalLink className="w-4 h-4" aria-hidden="true" />
                                <span className="sr-only">(se abre en otra pestaña)</span>
                              </a>
                            </div>
                          </div>
                        </article>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}
          {filteredProducts.length > 0 && (
            <p className={`mt-5 text-center text-xs font-bold ${isLight ? 'text-gray-500' : 'text-neutral-400'}`} role="status">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'oferta' : 'ofertas'}
              {selectedQuickFilter !== 'all' && ` en ${getCategoryById(selectedQuickFilter)?.short || 'esta categoría'}`}
            </p>
          )}
          <div className={`mt-6 pt-4 border-t text-center text-xs md:text-sm font-medium ${
            isLight ? 'border-gray-200 text-gray-600' : 'border-neutral-800 text-neutral-400'
          }`}>
            ℹ️ Precios y disponibilidad los define cada vendedor y pueden cambiar sin aviso. Confirma el precio final en Mercado Libre.
          </div>
        </div>
      </section>
    )
  );

  const renderExclusiveProductsSection = () => (
    <section aria-labelledby="sec-terminales" id="terminales" className="container mx-auto px-0 sm:px-4 mb-16 relative z-10 scroll-mt-44">
      <div className="bg-[#FFE600] rounded-3xl p-6 sm:p-10 mb-8 text-black shadow-xl relative overflow-hidden grid grid-cols-1 md:grid-cols-2 items-center gap-8 border-4 border-black">
        <div className="flex flex-col items-start text-left max-w-xl z-10">
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight mb-4 leading-tight">
            Vende con terminal Point, recibe tu dinero al instante
          </h2>
          <p className="font-bold text-sm sm:text-base mb-6 text-black/90">
            Lleva gratis una Tarjeta Debit Mastercard® para usar tu dinero.
          </p>
          <div className="flex flex-wrap gap-3 sm:gap-4 items-center">
            <a 
              href="https://www.mercadopago.com.mx/herramientas-para-vender/lectores-point?code=7XYVCUKISD" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="bg-[#3483fa] hover:bg-[#2968c8] text-white font-black px-5 sm:px-6 py-3.5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black text-xs sm:text-sm uppercase transition-transform hover:scale-105"
            >
              Elegir terminal
            </a>
            <div className="flex items-center gap-2 font-black text-xs sm:text-sm bg-white px-4 py-3.5 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Truck size={18} /> Llega gratis hoy (*)
            </div>
          </div>
        </div>

        <div className="z-10 flex justify-center">
          <img 
            src="https://http2.mlstatic.com/storage/pog-cm-admin/calm-assets/multi-mlm-hero--b6703c46.png" 
            alt="Terminales Point Mercado Pago" 
            className="max-w-[240px] sm:max-w-[340px] lg:max-w-[420px] h-auto object-contain drop-shadow-xl"
          />
        </div>

        <div className="grid grid-cols-1 min-[400px]:grid-cols-2 sm:grid-cols-4 gap-4 w-full pt-6 border-t-2 border-black/20 z-10 md:col-span-2">
          <div className="flex items-center gap-2 text-xs font-black">
            <DollarSign size={20} className="text-black flex-shrink-0" />
            <span>Crédito inmediato y a tu medida²</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-black">
            <Calendar size={20} className="text-black flex-shrink-0" />
            <span>Sin renta mensual ni RFC.</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-black">
            <CreditCard size={20} className="text-black flex-shrink-0" />
            <span>Cuenta digital y tarjeta gratuita.</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-black">
            <ShoppingCart size={20} className="text-black flex-shrink-0" />
            <span>Acepta débito, crédito y vales.</span>
          </div>
        </div>
      </div>

      <div className={`rounded-3xl shadow-xl p-3.5 sm:p-8 backdrop-blur-xl border ${
        isLight ? 'bg-white border-yellow-300' : 'bg-neutral-900/85 border-neutral-800'
      }`}>
        <div className="relative flex items-center justify-center mb-6 px-2">
          <h2 id="sec-terminales" className={`text-2xl sm:text-3xl font-black text-center flex items-center gap-2 ${isLight ? 'text-yellow-700' : 'text-yellow-400'}`}>
              ⭐ Terminales y productos exclusivos
          </h2>
        </div>
        <p className={`text-center text-xs sm:text-sm mb-8 ${isLight ? 'text-gray-600' : 'text-neutral-400'}`}>
          Dispositivos oficiales con beneficios directos, meses sin intereses y envío gratis.
        </p>

        {exclusiveProducts.length === 0 ? (
          <EmptyState
            isLight={isLight}
            status={productsStatus === 'ready' ? 'empty' : productsStatus}
            onRetry={() => loadPublicProducts(true)}
            icon="⭐"
            title="Pronto llegan nuevas terminales exclusivas"
            message="Mientras tanto puedes elegir tu terminal Point directamente en Mercado Pago."
            actions={[
              { label: 'Elegir terminal Point', href: 'https://www.mercadopago.com.mx/herramientas-para-vender/lectores-point?code=7XYVCUKISD' },
              ...(isMobileDevice ? [{ label: '🔥 Ver productos en oferta', onClick: () => setMobileTab('productos') }] : []),
            ]}
          />
        ) : (
          <div className="relative px-2 sm:px-0">
            <div className="overflow-hidden" ref={exclusiveEmblaRef}>
              <div className="flex gap-6 items-stretch">
                {exclusiveProducts.map((product) => {
                  const pId = getSafeId(product) || product.title;
                  const remainingDays = getRemainingDays(product);
                  const origPriceNum = Number(product.original_price || 0);
                  const formattedOriginalPrice = origPriceNum < 100 && origPriceNum > 0 
                    ? (origPriceNum * 1000).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
                    : origPriceNum.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

                  const handleShareProduct = () => {
                    const title = product.title || product.nombre || 'Terminal Exclusiva';
                    const link = product.affiliate_link || product.link || product.url || window.location.href;
                    const text = `¡Mira esta gran oferta en CapiBaraML! 🔥 *${title}* \nEncuéntrala aquí: ${link}`;
                    if (navigator.share) {
                      navigator.share({ title, text, url: link }).catch(() => {});
                    } else {
                      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                    }
                  };

                  return (
                    <div key={pId} className="flex-[0_0_100%] md:flex-[0_0_calc(50%-12px)] lg:flex-[0_0_calc(33.333%-16px)] min-w-0 flex">
                      <div className="w-full rounded-3xl shadow-xl transition-all duration-300 overflow-hidden flex flex-col border bg-white text-gray-900 border-gray-200 relative p-5 sm:p-6">
                        
                        <button
                          onClick={handleShareProduct}
                          className="absolute top-3 left-3 z-20 min-h-[40px] bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-3 rounded-xl border-2 border-white shadow-md flex items-center gap-1.5"
                          aria-label={`Compartir ${product.title || 'producto'}`}
                        >
                          <Share2 size={14} aria-hidden="true" /> Compartir
                        </button>

                        <span className="absolute top-3 right-3 z-20 px-2 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-300 text-[11px] font-bold select-none">
                          ⏳ {remainingDays} {remainingDays === 1 ? 'día' : 'días'}
                        </span>

                        <div className="relative pt-6 px-4 pb-2 text-center bg-white flex justify-center items-center h-48">
                          <img src={product.image_url} alt={product.title} loading="lazy" decoding="async" className="max-h-full max-w-full object-contain drop-shadow-md" />
                        </div>

                        <div className="pb-3 text-center">
                          <h3 className="text-xl font-black text-gray-900 mb-1 tracking-tight">{product.title || product.nombre}</h3>
                          <p className="text-xs text-gray-600 font-medium line-clamp-2 px-1">
                            {product.description}
                          </p>
                        </div>

                        <div className="text-center mb-4">
                          <div className="flex items-center justify-center gap-2 mb-1">
                            {origPriceNum > 0 && (
                              <span className="text-sm font-bold text-gray-400 line-through">
                                ${formattedOriginalPrice}
                              </span>
                            )}
                            {(product.discount_percentage || product.descuento) && (
                              <span className="bg-[#00a650] text-white px-2 py-0.5 rounded-md font-bold text-[11px] tracking-wide">
                                {product.discount_percentage ? `${product.discount_percentage}% OFF` : product.descuento}
                              </span>
                            )}
                          </div>
                          <div className="text-3xl font-black text-gray-900 tracking-tight">
                            ${Number(product.discount_price || product.precio || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                          </div>
                          {product.installments_text && (
                            <div className="text-xs text-gray-600 mt-1 font-medium">
                              {product.installments_text}
                            </div>
                          )}
                        </div>

                        <div className="mb-4">
                          <a 
                            href={product.affiliate_link || product.link || product.url || '#'} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="w-full bg-[#3483fa] hover:bg-[#2968c8] text-white py-3 rounded-xl font-bold text-center block transition-all shadow-md text-sm uppercase tracking-wide"
                          >
                            Comprar ahora
                          </a>
                        </div>

                        <div className="w-full border-t border-gray-200 pt-4 pb-3 bg-white text-left flex flex-col gap-2.5">
                          <div className="flex items-center gap-2.5 text-xs font-medium text-gray-700">
                            <span className="text-[#3483fa] text-base flex-shrink-0">✔</span>
                            <span className="leading-tight">Acepta débito, crédito y vales.</span>
                          </div>
                          <div className="flex items-center gap-2.5 text-xs font-medium text-gray-700">
                            <span className="text-[#3483fa] text-base flex-shrink-0">✔</span>
                            <span className="leading-tight">Incluye cuenta digital y tarjeta gratuita.</span>
                          </div>
                          <div className="flex items-center gap-2.5 text-xs font-medium text-gray-700">
                            <span className="text-[#3483fa] text-base flex-shrink-0">✔</span>
                            <span className="leading-tight">1 año de garantía.</span>
                          </div>
                          <div className="flex items-center gap-2.5 text-xs font-medium text-gray-700">
                            <span className="text-[#3483fa] text-base flex-shrink-0">✔</span>
                            <span className="leading-tight">Envío gratis en 2 hs.</span>
                          </div>
                        </div>

                        <div className="w-full border-t border-dashed border-gray-200 pt-4 pb-3 bg-white text-left flex flex-col gap-2.5">
                          <div className="flex items-center gap-2.5 text-xs text-gray-600 font-medium">
                            <Wifi size={16} className="text-blue-500 flex-shrink-0" />
                            <span className="truncate">Plan de datos 4G gratis y Wi-Fi.</span>
                          </div>
                          <div className="flex items-center gap-2.5 text-xs text-gray-600 font-medium">
                            <FileText size={16} className="text-blue-500 flex-shrink-0" />
                            <span className="truncate">Recibos impresos, por e-mail y SMS. Rollos gratis.</span>
                          </div>
                          <div className="flex items-center gap-2.5 text-xs text-gray-600 font-medium">
                            <CreditCard size={16} className="text-blue-500 flex-shrink-0" />
                            <span className="truncate">Tarjetas con chip, banda y sin contacto.</span>
                          </div>
                          <div className="flex items-center gap-2.5 text-xs text-gray-600 font-medium">
                            <BatteryCharging size={16} className="text-blue-500 flex-shrink-0" />
                            <span className="truncate">72 horas de batería.</span>
                          </div>
                          <div className="flex items-center gap-2.5 text-xs text-gray-600 font-medium">
                            <Maximize2 size={16} className="text-blue-500 flex-shrink-0" />
                            <span className="truncate">175x82x62 mm.</span>
                          </div>
                          <div className="flex items-center gap-2.5 text-xs text-gray-600 font-medium">
                            <Scale size={16} className="text-blue-500 flex-shrink-0" />
                            <span className="truncate">410 g.</span>
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {exclusiveProducts.length > 1 && (
              <CarouselArrows onPrev={scrollPrevExclusive} onNext={scrollNextExclusive} label="Producto exclusivo" topClass="top-[120px]" />
            )}
          </div>
        )}
      </div>

    </section>
  );

  const renderReelsSection = () => (
    <div id="videos" className="container mx-auto px-0 sm:px-4 mb-16 relative z-10 scroll-mt-44">
      <div className={`rounded-3xl shadow-xl p-5 sm:p-8 backdrop-blur-xl border ${
        isLight ? 'bg-white border-purple-200' : 'bg-neutral-900/85 border-neutral-800'
      }`}>
        <div className="text-center mb-8">
          <h2 className={`text-2xl sm:text-3xl md:text-4xl font-black mb-3 flex items-center justify-center gap-3 ${
            isLight ? 'text-purple-700' : 'text-neutral-100'
          }`}>
            <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-yellow-400 shrink-0" aria-hidden="true" /> Productos probados en video
          </h2>
          <p className={`text-sm md:text-base max-w-xl mx-auto font-medium ${
            isLight ? 'text-gray-600' : 'text-neutral-400'
          }`}>
            Mira cómo funciona cada producto y cómpralo con el botón amarillo debajo del video. Usa las flechas para cambiar de video.
          </p>
        </div>
        <YoutubeReelsPlayer 
          videos={tiktokVideos} 
          setTiktokVideos={setTiktokVideos}
          setToastMessage={setToastMessage} 
          setShowToast={setShowToast} 
          isLight={isLight}
        />
      </div>
    </div>
  );

  // ==========================================
  // BUSCADOR GLOBAL Y ENCABEZADO (inspirado en Mercado Libre)
  // ==========================================
  const goToOffers = () => navigate('productos');

  const handleHeaderSearch = (e) => {
    e.preventDefault();
    setSearchTerm(productSearchInput);
    goToOffers();
  };

  const clearHeaderSearch = () => {
    setProductSearchInput('');
    setSearchTerm('');
  };

  const renderHeaderSearch = () => (
    <form role="search" onSubmit={handleHeaderSearch} className="flex-1 min-w-0 max-w-3xl">
      <label htmlFor="product-search" className="sr-only">Buscar productos</label>
      <div className="relative flex items-center bg-white rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.25)] focus-within:ring-2 focus-within:ring-[#3483FA]">
        <input
          id="product-search"
          type="text"
          enterKeyHint="search"
          autoComplete="off"
          value={productSearchInput}
          onChange={(e) => setProductSearchInput(e.target.value)}
          placeholder="Buscar productos, marcas y más…"
          className="w-full min-h-[44px] pl-4 pr-2 bg-transparent rounded-l-md text-base text-gray-900 placeholder:text-gray-400 focus:outline-none"
        />
        {productSearchInput && (
          <button
            type="button"
            aria-label="Borrar búsqueda"
            onClick={clearHeaderSearch}
            className="shrink-0 w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        <button
          type="submit"
          aria-label="Buscar"
          className="shrink-0 w-12 min-h-[44px] flex items-center justify-center border-l border-gray-200 text-gray-600 hover:text-[#3483FA] rounded-r-md"
        >
          <Search className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
    </form>
  );

  const desktopNavLinks = [
    { id: 'inicio', label: '🏠 Inicio' },
    ...(activeCupones.length > 0 ? [{ id: 'cupones', label: '🎟️ Cupones' }] : []),
    { id: 'bancarios', label: '💳 Promociones bancarias' },
    { id: 'productos', label: '🔥 Ofertas' },
    { id: 'exclusivos', label: '⭐ Terminales' },
    { id: 'reels', label: '📺 Videos' },
    { id: 'juegos', label: '🎮 Juegos' },
    { id: 'trabaja', label: '💼 Únete al equipo' },
  ];

  // ==========================================
  // INICIO LIMPIO + MIGAS DE PAN
  // ==========================================
  const SECTION_TILES = [
    { id: 'cupones', icon: '🎟️', title: 'Cupones', desc: 'Códigos de descuento activos', count: activeCupones.length, noun: 'activos' },
    { id: 'bancarios', icon: '💳', title: 'Promociones bancarias', desc: 'Meses sin intereses y bonificaciones', count: activeCuponesBancarios.length, noun: 'promos' },
    { id: 'productos', icon: '🔥', title: 'Ofertas destacadas', desc: 'Todas las ofertas, por categoría', count: regularProducts.length, noun: 'ofertas' },
    { id: 'exclusivos', icon: '⭐', title: 'Terminales', desc: 'Cobra con tarjeta al instante' },
    { id: 'reels', icon: '📺', title: 'Videos', desc: 'Productos probados en video' },
    { id: 'juegos', icon: '🎮', title: 'Zona de juegos', desc: 'Cinco juegos gratis' },
    { id: 'trabaja', icon: '💼', title: 'Únete al equipo', desc: 'Trabaja con nosotros' },
  ];

  const tileClass = `group text-left rounded-lg border p-3.5 min-h-[88px] flex flex-col justify-between transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3483FA] ${
    isLight ? 'bg-white border-gray-200' : 'bg-neutral-900 border-neutral-800'
  }`;

  const renderHome = () => (
    <div className="container mx-auto px-3 sm:px-4 mb-16 relative z-10 space-y-8">
      <section aria-labelledby="home-secciones">
        <h2 id="home-secciones" className={`text-lg sm:text-xl font-bold mb-3 ${isLight ? 'text-gray-900' : 'text-neutral-100'}`}>¿Qué quieres hacer hoy?</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {SECTION_TILES.map((t) => (
            <button key={t.id} type="button" onClick={() => navigate(t.id)} className={tileClass}>
              <span className="text-2xl" aria-hidden="true">{t.icon}</span>
              <span>
                <span className={`block font-bold text-sm sm:text-base leading-tight ${isLight ? 'text-gray-900' : 'text-neutral-100'}`}>{t.title}</span>
                <span className={`block text-xs mt-0.5 ${isLight ? 'text-gray-500' : 'text-neutral-400'}`}>
                  {typeof t.count === 'number' ? (t.count > 0 ? `${t.count} ${t.noun}` : 'Sin novedades hoy') : t.desc}
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section aria-labelledby="home-categorias">
        <div className="flex items-end justify-between gap-2 mb-3">
          <h2 id="home-categorias" className={`text-lg sm:text-xl font-bold ${isLight ? 'text-gray-900' : 'text-neutral-100'}`}>Categorías</h2>
          <button type="button" onClick={() => navigate('productos')} className="min-h-[40px] px-2 text-sm font-semibold text-[#3483FA] hover:underline">Ver todas las ofertas</button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2.5 sm:gap-3">
          {ML_CATEGORIES.filter((c) => (categoryCounts[c.id] || 0) > 0).map((c) => (
            <button key={c.id} type="button" onClick={() => navigate('productos', c.id)} className={`${tileClass} min-h-[80px]`}>
              <span className="text-2xl" aria-hidden="true">{c.icon}</span>
              <span>
                <span className={`block font-semibold text-sm leading-tight ${isLight ? 'text-gray-900' : 'text-neutral-100'}`}>{c.short}</span>
                <span className={`block text-xs ${isLight ? 'text-gray-500' : 'text-neutral-400'}`}>{categoryCounts[c.id]} {categoryCounts[c.id] === 1 ? 'oferta' : 'ofertas'}</span>
              </span>
            </button>
          ))}
        </div>
        {regularProducts.length === 0 && (
          <p className={`text-sm mt-2 ${isLight ? 'text-gray-600' : 'text-neutral-400'}`} role="status">
            {productsStatus === 'loading' ? 'Cargando ofertas…' : 'Aún no hay ofertas por categoría. Vuelve en unos minutos o revisa los cupones.'}
          </p>
        )}
      </section>
    </div>
  );

  const renderBreadcrumb = () => {
    const sectionTitle = (MOBILE_TABS.find((t) => t.id === route.section) || {}).label;
    const cat = route.category ? getCategoryById(route.category) : null;
    const linkCls = 'inline-flex items-center min-h-[40px] px-1 font-semibold text-[#3483FA] hover:underline';
    return (
      <nav aria-label="Ruta de navegación" className="container mx-auto px-3 sm:px-4 pt-3 pb-3 text-sm">
        <ol className="flex flex-wrap items-center gap-x-1.5">
          <li>
            <button type="button" onClick={() => navigate('inicio')} className={linkCls}>
              <ChevronLeft className="w-4 h-4" aria-hidden="true" /> Inicio
            </button>
          </li>
          <li aria-hidden="true" className={isLight ? 'text-gray-400' : 'text-neutral-600'}>›</li>
          <li>
            {cat ? (
              <button type="button" onClick={() => navigate('productos')} className={linkCls}>Ofertas</button>
            ) : (
              <span aria-current="page" className={`font-semibold ${isLight ? 'text-gray-800' : 'text-neutral-200'}`}>{sectionTitle}</span>
            )}
          </li>
          {cat && (
            <>
              <li aria-hidden="true" className={isLight ? 'text-gray-400' : 'text-neutral-600'}>›</li>
              <li><span aria-current="page" className={`font-semibold ${isLight ? 'text-gray-800' : 'text-neutral-200'}`}>{cat.short}</span></li>
            </>
          )}
        </ol>
      </nav>
    );
  };

  const renderTopBar = () => (
    isMobileDevice ? (
      <header className="sticky top-[60px] z-[65] bg-[#FFE600] shadow-md">
        <div className="flex items-center gap-2 px-3 py-2">
          <button type="button" onClick={() => navigate('inicio')} aria-label="CapiBaraML, ir al inicio" className="shrink-0">
            <img src={logoUrl} alt="" className="w-9 h-9 rounded-full object-cover border border-black/20" />
          </button>
          {renderHeaderSearch()}
        </div>
      </header>
    ) : (
      <header className="sticky top-[64px] z-[65] bg-[#FFE600] shadow-md">
        <div className="container mx-auto px-4 py-2.5 flex items-center gap-5">
          <button
            type="button"
            onClick={() => navigate('inicio')}
            aria-label="CapiBaraML, ir al inicio"
            className="flex items-center gap-2 shrink-0"
          >
            <img src={logoUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-black/20" />
            <span className="text-lg font-black text-black tracking-tight">CapiBaraML</span>
          </button>
          {renderHeaderSearch()}
        </div>
        <nav aria-label="Secciones" className="border-t border-black/10">
          <ul className="container mx-auto px-4 flex flex-wrap items-center gap-x-1">
            {desktopNavLinks.map((item) => (
              <li key={item.id}>
                <a
                  href={buildHash(item.id)}
                  aria-current={route.section === item.id ? 'page' : undefined}
                  className={`inline-flex items-center min-h-[40px] px-3 text-sm hover:text-black hover:underline underline-offset-4 decoration-2 ${
                    route.section === item.id ? 'font-bold text-black underline' : 'font-medium text-black/80'
                  }`}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>
    )
  );

  // ==========================================
  // NAVEGACIÓN INFERIOR EN CELULAR (al alcance del pulgar)
  // ==========================================
  const renderMobileBottomNav = () => {
    const primary = MOBILE_TABS.filter((t) => MOBILE_PRIMARY_TAB_IDS.includes(t.id));
    const moreActive = MOBILE_MORE_TABS.some((t) => t.id === mobileTab);
    const itemBase = 'relative w-full min-h-[56px] flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors';
    const itemColor = (active) => (active ? 'text-[#3483FA]' : isLight ? 'text-gray-600' : 'text-neutral-400');
    const indicator = <span aria-hidden="true" className="absolute top-0 inset-x-4 h-0.5 rounded-b bg-[#3483FA]" />;
    return (
      <>
        <nav
          aria-label="Navegación principal"
          className={`fixed bottom-0 inset-x-0 z-[70] border-t pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_8px_rgba(0,0,0,0.12)] ${
            isLight ? 'bg-white border-gray-200' : 'bg-neutral-950 border-neutral-800'
          }`}
        >
          <ul className="grid grid-cols-5">
            {primary.map((tab) => {
              const selected = mobileTab === tab.id;
              return (
                <li key={tab.id}>
                  <button
                    type="button"
                    aria-current={selected ? 'page' : undefined}
                    onClick={() => setMobileTab(tab.id)}
                    className={`${itemBase} ${itemColor(selected)}`}
                  >
                    {selected && indicator}
                    <span className={`text-xl leading-none ${selected ? '' : 'grayscale opacity-70'}`} aria-hidden="true">{tab.icon}</span>
                    {tab.label}
                  </button>
                </li>
              );
            })}
            <li>
              <button
                type="button"
                aria-haspopup="dialog"
                aria-expanded={showMoreSheet}
                onClick={() => setShowMoreSheet(true)}
                className={`${itemBase} ${itemColor(moreActive)}`}
              >
                {moreActive && indicator}
                <span className={`text-xl leading-none ${moreActive ? '' : 'grayscale opacity-70'}`} aria-hidden="true">☰</span>
                Más
              </button>
            </li>
          </ul>
        </nav>

        {showMoreSheet && (
          <div className="fixed inset-0 z-[80] bg-black/60 flex items-end" onClick={() => setShowMoreSheet(false)}>
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="more-sheet-title"
              onClick={(e) => e.stopPropagation()}
              className={`w-full rounded-t-2xl p-4 pb-[calc(env(safe-area-inset-bottom)+16px)] shadow-2xl ${
                isLight ? 'bg-white text-gray-900' : 'bg-neutral-900 text-neutral-100'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 id="more-sheet-title" className="text-lg font-bold">Más secciones</h3>
                <button
                  type="button"
                  aria-label="Cerrar"
                  onClick={() => setShowMoreSheet(false)}
                  className={`w-11 h-11 rounded-full flex items-center justify-center ${isLight ? 'hover:bg-gray-100' : 'hover:bg-neutral-800'}`}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <ul className={`divide-y ${isLight ? 'divide-gray-100' : 'divide-neutral-800'}`}>
                {MOBILE_MORE_TABS.map((tab) => (
                  <li key={tab.id}>
                    <button
                      type="button"
                      onClick={() => setMobileTab(tab.id)}
                      className="w-full min-h-[56px] py-2 flex items-center gap-3 text-left"
                    >
                      <span className="text-2xl w-9 text-center" aria-hidden="true">{tab.icon}</span>
                      <span className="flex-1 min-w-0">
                        <span className="block font-semibold">{tab.label}</span>
                        <span className={`block text-xs ${isLight ? 'text-gray-500' : 'text-neutral-400'}`}>{tab.hint}</span>
                      </span>
                      <ChevronRight className={`w-5 h-5 shrink-0 ${isLight ? 'text-gray-400' : 'text-neutral-500'}`} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </>
    );
  };

  // ==========================================
  // ZONA DE JUEGOS (se descarga solo al llegar a la sección)
  // ==========================================
  const renderGamesSection = () => (
    <section aria-labelledby="sec-juegos" id="juegos" className="container mx-auto px-0 sm:px-4 mb-16 relative z-10 scroll-mt-44">
      <div className={`rounded-lg shadow-sm p-3.5 sm:p-8 border ${isLight ? 'bg-white border-gray-200' : 'bg-neutral-900 border-neutral-800'}`}>
        <SectionHeader
          id="sec-juegos"
          icon="🎮"
          title="Zona de juegos"
          subtitle="Cinco juegos gratis para relajarte entre ofertas. Tus récords se guardan en este dispositivo."
          isLight={isLight}
        />
        <GamesErrorBoundary renderFallback={(retry) => <GamesPlaceholder isLight={isLight} status="error" onRetry={retry} />}>
          <LazyMount placeholder={<GamesPlaceholder isLight={isLight} />}>
            <Suspense fallback={<GamesPlaceholder isLight={isLight} />}>
              <GamesZoneLoader isLight={isLight} />
            </Suspense>
          </LazyMount>
        </GamesErrorBoundary>
      </div>
    </section>
  );

  return (
    <div className={mainBgClass}>
      
      {/* ========================================== */}
      {/* BARRA SUPERIOR DE WHATSAPP (BLINDADA ADS)  */}
      {/* ========================================== */}
      <div className="sticky top-0 z-[75] w-full bg-[#25D366] border-b-4 border-black shadow-xl">
        <div className="container mx-auto px-2.5 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between sm:justify-center gap-2 sm:gap-5">
          <div className="flex items-center gap-1.5 sm:gap-2 text-black min-w-0">
            <span className="relative flex h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-black"></span>
            </span>
            <p className="text-[11px] sm:text-sm font-black tracking-tight truncate">
              <span className="sm:hidden">🔥 Cupones flash al instante</span>
              <span className="hidden sm:inline">🔥 ¡Recibe las mejores ofertas, cupones  y errores de precio al instante!</span>
            </p>
          </div>
          <a
            href="https://chat.whatsapp.com/IRASJWGThXcLi0VcBLolUi?mode=hqrt1"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 min-h-[40px] inline-flex items-center gap-1.5 bg-black hover:bg-neutral-800 text-white font-black text-[11px] sm:text-xs uppercase px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full border-2 border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,0.4)] transition-transform hover:scale-105 whitespace-nowrap"
          >
            <FaWhatsapp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#25D366] shrink-0" />
            <span>Unirme al WhatsApp</span>
            <ArrowRight className="w-3.5 h-3.5 hidden sm:inline shrink-0" />
          </a>
        </div>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { scrollbar-width: none; }
        html { scroll-behavior: smooth; }
        @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
        @media (max-width: 768px) {
          [class*="chat-window"], [class*="bot-container"] {
            width: 100vw !important;
            height: 100vh !important;
            bottom: 0 !important;
            right: 0 !important;
            border-radius: 0 !important;
            position: fixed !important;
            max-height: 100vh !important;
            z-index: 99999 !important;
          }
        }
      `}</style>

      {!isLight && (
        <>
          <div className="fixed inset-0 bg-grid opacity-20 pointer-events-none" />
          <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-yellow-400/5 rounded-full blur-[150px] pointer-events-none" />
        </>
      )}

      {/* Controles flotantes: en celular solo el chat, para no tapar contenido */}
      {!isMobileDevice && (
        <div className="fixed top-[190px] right-4 lg:right-6 z-[60] flex flex-col items-center gap-2.5">
          <VisitorCounter isLight={isLight} />
          <button
            type="button"
            onClick={() => setThemeMode(isLight ? 'dark' : 'light')}
            className={`w-12 h-12 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 border-2 ${
              isLight ? 'bg-white text-purple-600 border-gray-200' : 'bg-neutral-900 text-yellow-400 border-neutral-700'
            }`}
            aria-label={isLight ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro'}
            title={isLight ? 'Tema oscuro' : 'Tema claro'}
          >
            {isLight ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
        </div>
      )}

      {isMobileDevice && (
        <ChatbotWidget isLight={isLight} cupones={activeCupones} products={products} isMobileDevice={isMobileDevice} hasBottomNav />
      )}

      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, x: "-50%", y: "-40%", scale: 0.85 }}
            animate={{ opacity: 1, x: "-50%", y: "-50%", scale: 1 }}
            exit={{ opacity: 0, x: "-50%", y: "-40%", scale: 0.9 }}
            transition={{ type: 'spring', damping: 18, stiffness: 260 }}
            className="fixed top-1/2 left-1/2 z-[100] w-[92%] max-w-lg"
          >
            <div className="relative overflow-hidden rounded-3xl border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-[#FFEA00] text-black">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-bounce">
                  <Sparkles className="h-8 w-8 text-black" />
                </div>
                <div>
                  <p className="text-base sm:text-lg font-black leading-tight uppercase">{toastMessage}</p>
                </div>
                <button
                  onClick={() => setShowToast(false)}
                  aria-label="Cerrar aviso"
                  className="absolute top-3 right-3 w-10 h-10 flex items-center justify-center text-black hover:text-gray-700 transition-colors bg-white rounded-full border-2 border-black"
                >
                  <X className="h-5 w-5 font-black" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {renderTopBar()}

      {route.section === 'inicio' && (
      <div
        className={`relative overflow-hidden border-b pb-8 ${
          isLight
            ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 border-transparent'
            : 'bg-gradient-to-b from-neutral-900 to-neutral-950 border-neutral-800'
        }`}
      >
        {!isLight && <div className="absolute inset-0 bg-black opacity-10" />}
        <div className="relative container mx-auto px-4 pt-6 sm:pt-12 pb-2 sm:pb-4">
          {isMobileDevice && (
            <button
              type="button"
              onClick={() => setThemeMode(isLight ? 'dark' : 'light')}
              aria-label={isLight ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro'}
              className={`absolute top-3 right-3 w-11 h-11 rounded-full flex items-center justify-center border-2 z-10 ${
                isLight ? 'bg-white/90 text-purple-600 border-white' : 'bg-neutral-900 text-yellow-400 border-neutral-700'
              }`}
            >
              {isLight ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
          )}
          <div className="flex flex-col items-center text-center">
            
            <div
              ref={logoContainerRef}
              onMouseMove={handleLogoMouseMove}
              onMouseLeave={handleLogoMouseLeave}
              onMouseEnter={handleLogoMouseEnter}
              className="mb-4 sm:mb-6 cursor-pointer w-28 h-28 sm:w-48 sm:h-48 md:w-56 md:h-56 mx-auto"
              style={{ perspective: '800px' }}
            >
              <div
                ref={logoCardRef}
                className={`w-full h-full relative rounded-full shadow-2xl ${
                  isLight
                    ? 'ring-8 ring-white/50'
                    : 'shadow-yellow-400/25 ring-4 ring-neutral-800'
                }`}
                style={{
                  transformStyle: 'preserve-3d',
                  willChange: 'transform',
                  transition: 'transform 0.08s ease-out'
                }}
              >
                <img
                  src={logoUrl}
                  alt="CapiBaraML Logo"
                  className="w-full h-full rounded-full object-cover block pointer-events-none"
                  style={{ transform: 'translateZ(40px)' }}
                />
                <div
                  ref={logoGlareRef}
                  className="absolute inset-0 rounded-full pointer-events-none opacity-0 transition-opacity duration-300"
                  style={{
                    mixBlendMode: 'overlay',
                    background: 'radial-gradient(circle at var(--x, 50%) var(--y, 50%), rgba(255, 255, 255, 0.9) 0%, rgba(255, 215, 0, 0.4) 35%, transparent 70%)',
                    zIndex: 10
                  }}
                />
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-2 drop-shadow-lg">
              CapiBaraML
            </h1>
            <p className="text-white/95 font-bold text-sm md:text-base mb-3 sm:mb-4 max-w-xl">
              Cupones, ofertas y promociones bancarias de Mercado Libre en un solo lugar. Elige una sección y ahorra en tu próxima compra.
            </p>

            {!isMobileDevice && (
              <div className={`inline-block backdrop-blur-sm px-6 py-3 rounded-full mb-2 ${
                isLight ? 'bg-white/20' : 'bg-yellow-400/10 border border-yellow-400/30'
              }`}>
                <p className="text-white font-semibold text-base lg:text-lg">
                "No compres caro, Nosotros ya hicimos la busqueda por ti"
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {route.section === 'inicio' && <div className="h-4" />}
      {route.section === 'inicio' ? renderHome() : (
        <>
          {renderBreadcrumb()}
          <main id="vista" className="relative z-20 pt-1">
            {route.section === 'cupones' && renderCuponesSection()}
            {route.section === 'bancarios' && renderCuponesBancariosSection()}
            {route.section === 'productos' && renderProductosSection()}
            {route.section === 'juegos' && renderGamesSection()}
            {route.section === 'exclusivos' && renderExclusiveProductsSection()}
            {route.section === 'trabaja' && renderWorkWithUsSection(isLight)}
            {route.section === 'reels' && (
              <>
                {renderReelsSection()}
                {renderNewSection(products)}
              </>
            )}
          </main>
        </>
      )}

      {isMobileDevice && renderMobileBottomNav()}

      {showTutorialModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-[80] p-0 sm:p-4" onClick={() => setShowTutorialModal(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="tutorial-title"
            onClick={(e) => e.stopPropagation()}
            className={`relative rounded-t-3xl sm:rounded-3xl p-5 sm:p-7 w-full max-w-lg shadow-2xl border max-h-[92dvh] overflow-y-auto ${
              isLight ? 'bg-white border-gray-200 text-gray-800' : 'bg-neutral-900 border-neutral-800 text-neutral-100'
            }`}
          >
            <button
              onClick={() => setShowTutorialModal(false)}
              aria-label="Cerrar"
              className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center ${
                isLight ? 'hover:bg-gray-200 text-gray-600' : 'hover:bg-neutral-800 text-neutral-400'
              }`}
            >
              <X className="w-6 h-6" />
            </button>
            <h3 id="tutorial-title" className="text-xl sm:text-2xl font-black mb-4 pr-10">
              🎓 ¿Cómo usar un cupón?
            </h3>
            <ol className="space-y-3">
              {[
                ['Copia el código', 'Toca “Copiar código y usarlo” en el cupón que quieras.'],
                ['Abre Mercado Libre', 'Usa el botón “Ir a Mercado Libre” y agrega tu producto al carrito.'],
                ['Pega el cupón al pagar', 'Antes de confirmar, busca “Agregar cupón” y pega el código.'],
                ['Revisa el total', 'El descuento debe aparecer antes de pagar. Si no aplica, puede que se haya agotado o que tu compra no llegue al mínimo.'],
              ].map(([t, d], i) => (
                <li key={t} className="flex gap-3">
                  <span className="w-8 h-8 shrink-0 rounded-full bg-yellow-400 text-black font-black flex items-center justify-center">{i + 1}</span>
                  <div>
                    <p className="font-black">{t}</p>
                    <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-neutral-400'}`}>{d}</p>
                  </div>
                </li>
              ))}
            </ol>
            <button
              type="button"
              onClick={() => setShowTutorialModal(false)}
              className="mt-6 w-full min-h-[48px] rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-black border-2 border-black"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[90] p-4">
          <motion.div 
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`relative rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto border-2 shadow-2xl ${
              isLight ? 'bg-white text-gray-800 border-purple-300' : 'bg-neutral-900 text-neutral-100 border-yellow-400/60'
            }`}
          >
            <button 
              onClick={() => setShowPrivacyModal(false)} 
              aria-label="Cerrar"
              className="absolute top-3 right-3 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <h3 className="text-xl sm:text-2xl font-black mb-4 flex items-center gap-2 pr-6">
              🔒 Política de Privacidad de CapiBaraML
            </h3>
            
            <div className="space-y-4 text-xs sm:text-sm leading-relaxed opacity-90">
              <p>
                En <strong>CapiBaraML</strong> valoramos tu privacidad y nos comprometemos a proteger la información personal que compartas con nosotros. Este aviso detalla cómo recopilamos, usamos y resguardamos tus datos.
              </p>
              <h4 className="font-black text-sm sm:text-base text-yellow-400 mt-2">1. Información que recopilamos</h4>
              <p>
                Podemos recopilar datos básicos proporcionados voluntariamente por ti (como nombre, apodo, correo electrónico y número de teléfono de WhatsApp) exclusivamente para fines de participación en nuestra comunidad y torneos mensuales de gamificación.
              </p>
              <h4 className="font-black text-sm sm:text-base text-yellow-400 mt-2">2. Enlaces de afiliados y cookies</h4>
              <p>
                Este sitio web contiene enlaces de afiliados hacia Mercado Libre y plataformas asociadas. Al hacer clic en ellos, es posible que dichas plataformas utilicen cookies técnicas para registrar que fuiste recomendado por CapiBaraML, sin que esto comprometa tu información bancaria o personal sensible.
              </p>
              <h4 className="font-black text-sm sm:text-base text-yellow-400 mt-2">3. Seguridad de los datos</h4>
              <p>
                Implementamos medidas de seguridad estándar en la industria para proteger tus datos contra accesos no autorizados, alteración o divulgación. Jamás vendemos ni compartimos tu información con terceros con fines publicitarios ajenos a nuestro servicio.
              </p>
            </div>

            <div className="mt-8 text-center">
              <button 
                onClick={() => setShowPrivacyModal(false)}
                className="bg-yellow-400 hover:bg-yellow-300 text-black font-black px-6 py-3 rounded-xl uppercase tracking-wider text-xs shadow-md transition-transform hover:scale-105"
              >
                Entendido
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {showTermsModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[90] p-4">
          <motion.div 
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`relative rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto border-2 shadow-2xl ${
              isLight ? 'bg-white text-gray-800 border-purple-300' : 'bg-neutral-900 text-neutral-100 border-yellow-400/60'
            }`}
          >
            <button 
              onClick={() => setShowTermsModal(false)} 
              aria-label="Cerrar"
              className="absolute top-3 right-3 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <h3 className="text-xl sm:text-2xl font-black mb-4 flex items-center gap-2 pr-6">
              📄 Términos y Condiciones de Uso
            </h3>
            
            <div className="space-y-4 text-xs sm:text-sm leading-relaxed opacity-90">
              <p>
                Bienvenido a <strong>CapiBaraML</strong>. Al acceder y utilizar nuestro sitio web, aceptas cumplir con los siguientes términos y condiciones de uso.
              </p>
              <h4 className="font-black text-sm sm:text-base text-yellow-400 mt-2">1. Carácter informativo y de afiliación</h4>
              <p>
                CapiBaraML es un sitio web independiente dedicado a la recopilación de ofertas, cupones y recomendaciones de productos disponibles en Mercado Libre y otros comercios. Actuamos como canal de difusión y afiliados; por lo tanto, no procesamos pagos directos ni somos responsables de la entrega, garantías o stock gestionados por los vendedores de dichas plataformas.
              </p>
              <h4 className="font-black text-sm sm:text-base text-yellow-400 mt-2">2. Vigencia de precios y cupones</h4>
              <p>
                Los precios, descuentos, cupones y la disponibilidad mostrados están sujetos a cambios constantes y a los términos particulares establecidos por cada vendedor o plataforma de destino.
              </p>
              <h4 className="font-black text-sm sm:text-base text-yellow-400 mt-2">3. Propiedad intelectual</h4>
              <p>
                Los logotipos, marcas comerciales y nombres de productos (incluyendo Mercado Libre, Mercado Pago, etc.) pertenecen a sus respectivos titulares y se mencionan en este sitio bajo los lineamientos de uso legítimo y programas de afiliados.
              </p>
            </div>

            <div className="mt-8 text-center">
              <button 
                onClick={() => setShowTermsModal(false)}
                className="bg-yellow-400 hover:bg-yellow-300 text-black font-black px-6 py-3 rounded-xl uppercase tracking-wider text-xs shadow-md transition-transform hover:scale-105"
              >
                Aceptar y Cerrar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <section className={`relative overflow-hidden py-20 sm:py-24 px-4 border-b ${
        isLight 
          ? 'bg-gradient-to-br from-gray-50 via-purple-50/30 to-indigo-50/50 border-gray-200 text-gray-800' 
          : 'bg-gradient-to-br from-neutral-950 via-neutral-900 to-black border-neutral-800 text-neutral-100'
      }`}>
        <div className="relative container mx-auto max-w-7xl z-10 flex flex-col items-center">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight mb-4">
              ¿Por qué unirte a nuestros canales?
            </h2>
          </div>

          <div className="flex flex-col items-center justify-center pt-8 pb-16 relative">
            <FeatureCube isLight={isLight} isMobileDevice={isMobileDevice} />
          </div>
        </div>
      </section>

      <footer className={`py-12 border-t ${
        isLight ? 'bg-gray-900 text-white border-transparent' : 'bg-neutral-950 border-neutral-900 text-neutral-400'
      }`}>
        <div className="container mx-auto px-4 text-center">
          <div className="mb-6">
            <img src={logoUrl} alt="CapiBaraML" className="w-20 h-20 rounded-full mx-auto mb-4 ring-4 ring-white/20" />
            <h3 className="text-2xl font-bold mb-2">CapiBaraML</h3>
            <p className="text-gray-400">"Ahorra con estilo, compra con sabiduría"</p>
          </div>
          <div className="flex justify-center space-x-4 sm:space-x-6 mb-6">
            {socialLinks.map((social, index) => {
              const Icon = social.icon;
              return (
                <a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all hover:scale-110 text-white shadow-lg ${social.color}`}
                  title={social.name}
                >
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </a>
              );
            })}
          </div>

          <div className="flex justify-center items-center gap-6 mt-6">
            {isAdminVisible && (
              <button
                onClick={() => setShowAdminLogin(true)}
                className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1 font-bold animate-pulse"
              >
                <Lock className="w-3 h-3" /> Panel Admin
              </button>
            )}
          </div>

          <div className={`mt-8 pt-6 border-t text-xs sm:text-sm max-w-4xl mx-auto p-4 sm:p-5 rounded-2xl border transition-all ${
            isLight 
              ? 'bg-gray-100 border-purple-200 text-gray-700 shadow-md font-semibold' 
              : 'bg-neutral-900 border-yellow-400/40 text-neutral-200 shadow-[0_0_20px_rgba(250,204,21,0.15)] font-semibold'
          }`}>
            <p className="mb-3 text-center leading-relaxed">
              📢 <strong className={isLight ? 'text-gray-900' : 'text-yellow-400'}>Aviso Legal y Afiliados:</strong> Mercado Libre y su logotipo son marcas registradas de Mercado Libre, S. de R.L. de C.V. Su utilización en este sitio es únicamente informativa como parte de su programa de afiliados.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-3 border-t border-yellow-500/20">
              <button 
                onClick={() => setShowPrivacyModal(true)} 
                className={`min-h-[44px] px-2 font-black underline ${isLight ? 'text-purple-700 hover:text-purple-900' : 'text-purple-300 hover:text-purple-200'}`}
              >
                🔒 Política de Privacidad
              </button>
              <span className="opacity-50">|</span>
              <button 
                onClick={() => setShowTermsModal(true)} 
                className={`min-h-[44px] px-2 font-black underline ${isLight ? 'text-purple-700 hover:text-purple-900' : 'text-purple-300 hover:text-purple-200'}`}
              >
                📄 Términos y Condiciones
              </button>
            </div>
          </div>

        </div>
      </footer>

      <CouponCopyDialog
        coupon={copyDialogCoupon}
        copyStatus={copyStatus}
        onClose={() => setCopyDialogCoupon(null)}
        onRetryCopy={() => copyCouponCode(copyDialogCoupon?.code)}
        fallbackLink="https://www.mercadolibre.com.mx"
      />

      {/* PANEL DE ADMIN INTACTO */}
      <AdminDashboard
        showAdminLogin={showAdminLogin}
        setShowAdminLogin={handleCloseAdminLogin}
        showAdminPanel={showAdminPanel}
        setShowAdminPanel={handleCloseAdminPanel}
        adminPassword={adminPassword}
        setAdminPassword={setAdminPassword}
        isAuthenticated={isAuthenticated}
        setIsAuthenticated={setIsAuthenticated}
        API={API}
        getSafeId={getSafeId}
        loadPublicOffers={() => loadPublicOffers(true)}
        loadPublicProducts={() => loadPublicProducts(true)}
        tiktokVideos={tiktokVideos}
        setTiktokVideos={setTiktokVideos}
      />

      {!isMobileDevice && (
        <div className="fixed bottom-4 right-4 z-50 pointer-events-auto">
          <ChatbotWidget isLight={isLight} cupones={activeCupones} products={products} isMobileDevice={isMobileDevice} />
        </div>
      )}
    </div>
  );
}

export default App;
