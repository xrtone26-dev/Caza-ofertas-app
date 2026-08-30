import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  // Music, // 🎵 Música comentada
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
  Video,
  ShoppingCart,
  Package,
  ShieldCheck,
  Headphones,
  Award,
  TrendingDown,
} from 'lucide-react';
import {
  FaWhatsapp,
  FaTelegram,
  FaFacebook,
  FaYoutube
} from "react-icons/fa";
import axios from 'axios';
import useEmblaCarousel from 'embla-carousel-react';
import { motion, AnimatePresence } from 'framer-motion';
// import MusicPlayer from './components/MusicPlayer'; // 🎵 Música comentada
import GamesZone from './components/GamesZone';
import ChatbotWidget from './components/ChatbotWidget';
import ProfileModal from './components/ProfileModal';
import AdminDashboard, { decodeCoupon } from './components/AdminDashboard'; 

const BACKEND_URL = 'https://caza-ofertas-backend.onrender.com';
const API = BACKEND_URL;

// ==========================================
// COMPONENTE 3D: CUBO DE CARACTERÍSTICAS AUTOMÁTICO DINÁMICO
// ==========================================
function FeatureCube({ isLight }) {
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

  const baseFaceClasses = `absolute w-[280px] h-[280px] p-6 flex flex-col justify-between backdrop-blur-xl transition-colors border-[4px] border-dotted border-[#00e5ff] ${
    isLight 
      ? 'bg-white/90 text-gray-800' 
      : 'bg-neutral-900/90 text-neutral-100'
  }`;

  const iconContainerClasses = `w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center mb-4 border-2 shadow-[0_0_10px_rgba(0,229,255,0.4)] ${
    isLight 
      ? 'bg-[#e0ffff] text-[#00b3cc] border-[#00e5ff]' 
      : 'bg-[#00e5ff]/10 text-[#00e5ff] border-[#00e5ff]/50'
  }`;

  const badgeClasses = `text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full border self-start shadow-[0_0_8px_rgba(0,229,255,0.3)] ${
    isLight 
      ? 'bg-[#e0ffff] text-[#008b99] border-[#00e5ff]' 
      : 'bg-[#00e5ff]/10 text-[#00e5ff] border-[#00e5ff]/30'
  }`;

  const faces = [
    {
      id: 'front',
      transform: 'translateZ(140px)',
      icon: Tag,
      title: 'Cupones Exclusivos',
      desc: 'Códigos de descuento únicos y de alto valor que no encontrarás en ningún otro lugar.',
      badge: 'Ahorro Garantizado'
    },
    {
      id: 'back',
      transform: 'rotateY(180deg) translateZ(140px)',
      icon: ShieldCheck,
      title: 'Productos Verificados',
      desc: 'Analizamos reseñas, calidad y reputación para recomendarte solo lo mejor.',
      badge: '100% Confiable'
    },
    {
      id: 'right',
      transform: 'rotateY(90deg) translateZ(140px)',
      icon: Headphones,
      title: 'Atención Personalizada',
      desc: '¿Buscas algo muy específico? Nuestro equipo te ayuda a rastrearlo al mejor precio.',
      badge: 'Soporte Directo'
    },
    {
      id: 'left',
      transform: 'rotateY(-90deg) translateZ(140px)',
      icon: Award,
      title: 'Premios Mensuales',
      desc: 'Participa en nuestra comunidad, gana puntos y obtén recompensas exclusivas.',
      badge: 'Comunidad Activa'
    },
    {
      id: 'top',
      transform: 'rotateX(90deg) translateZ(140px)',
      icon: TrendingDown,
      title: 'Precios Bajos',
      desc: 'Monitoreamos el mercado para asegurarnos de que siempre obtengas la mejor oferta.',
      badge: 'Monitoreo 24/7'
    },
    {
      id: 'bottom',
      transform: 'rotateX(-90deg) translateZ(140px)',
      icon: Lock,
      title: 'Compras Seguras',
      desc: 'Enlaces directos a plataformas oficiales como Mercado Libre para tu tranquilidad.',
      badge: 'Sin Riesgos'
    }
  ];

  return (
    <div 
      className="relative w-[280px] h-[280px] mx-auto pointer-events-none"
      style={{ perspective: '1000px' }}
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
                boxSizing: 'border-box'
              }}
            >
              <div className="flex justify-between items-start">
                <div className={iconContainerClasses}>
                  <Icon className="w-7 h-7" />
                </div>
                <span className={badgeClasses}>{face.badge}</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-black tracking-tight mb-2 leading-tight">{face.title}</h3>
                <p className={`text-xs leading-relaxed opacity-80 font-medium ${isLight ? 'text-gray-600' : 'text-neutral-300'}`}>
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
    const text = `¡Mira este producto probado en CazaOfertas! "${currentVideo.title}":`;
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
      {/* Contenedor adaptado: en móvil se apila en columna centrado, en escritorio va en fila */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 w-full">
        <div className="hidden md:block w-14"></div>

        <div className="relative w-full max-w-[280px] sm:max-w-sm h-[480px] sm:h-[520px] bg-black rounded-3xl overflow-hidden border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col select-none">
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

          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-3 z-30 pointer-events-auto">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-2.5 rounded-full border-2 border-black transition-all shadow-lg ${!isMuted ? 'bg-yellow-400 text-black scale-110 font-black' : 'bg-black/70 text-white hover:bg-black'}`}
              title={isMuted ? "Activar audio" : "Silenciar"}
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>

            <button
              onClick={togglePlay}
              className={`p-2.5 rounded-full border-2 border-black transition-all shadow-lg ${!isPlaying ? 'bg-yellow-400 text-black scale-110 font-black' : 'bg-black/70 text-white hover:bg-black'}`}
              title={isPlaying ? "Pausar video" : "Reproducir video"}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>

            <button
              onClick={() => handleReaction('heart')}
              className={`p-2.5 rounded-full border-2 border-black transition-all shadow-lg ${currentReaction === 'heart' ? 'bg-pink-500 text-white scale-110' : 'bg-black/70 text-white hover:bg-black'}`}
              title="Me encanta"
            >
              <Heart size={18} className={currentReaction === 'heart' ? 'fill-current' : ''} />
              <span className="text-[10px] font-black block mt-0.5">{currentHearts}</span>
            </button>

            <button
              onClick={() => handleReaction('like')}
              className={`p-2.5 rounded-full border-2 border-black transition-all shadow-lg ${currentReaction === 'like' ? 'bg-blue-500 text-white scale-110' : 'bg-black/70 text-white hover:bg-black'}`}
              title="Me gusta"
            >
              <ThumbsUp size={18} />
              <span className="text-[10px] font-black block mt-0.5">{currentLikes}</span>
            </button>

            <button
              onClick={() => handleReaction('dislike')}
              className={`p-2.5 rounded-full border-2 border-black transition-all shadow-lg ${currentReaction === 'dislike' ? 'bg-red-500 text-white scale-110' : 'bg-black/70 text-white hover:bg-red-900'}`}
              title="No me gusta"
            >
              <ThumbsDown size={18} />
              <span className="text-[10px] font-black block mt-0.5">{currentDislikes}</span>
            </button>

            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="p-2.5 rounded-full bg-black/70 text-white border-2 border-black hover:bg-black hover:scale-110 transition-all shadow-lg"
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

        {/* Botones de navegación: en celular se muestran en fila horizontal debajo, en escritorio en columna */}
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
            <span className={`text-xs font-bold ${isLight ? 'text-purple-700' : 'text-cyan-400'}`}>@{currentVideo.author || 'CazaOfertas'}</span>
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
                <span className="font-black text-xs md:text-sm uppercase tracking-tight leading-tight">COMPRAR PRODUCTO EN</span>
                <span className="font-black text-xs md:text-sm uppercase tracking-tight leading-tight">MERCADO LIBRE 🛒</span>
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

function CountdownTimer({ expiresAt }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!expiresAt) {
      setTimeLeft('');
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
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      let timeString = '';
      if (days > 0) timeString += `${days}d `;
      timeString += `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

      setTimeLeft(timeString);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (!expiresAt) {
    return (
      <span className="text-sm font-black text-black bg-white px-3 py-1.5 rounded-full border-2 border-black flex items-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
        ⏰ Permanente
      </span>
    );
  }

  return (
    <span className={`text-sm font-black px-3 py-1.5 rounded-full border-2 flex items-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
      timeLeft === 'Expirado' 
        ? 'text-white bg-red-600 border-black' 
        : 'text-black bg-white border-black'
    }`}>
      ⏰ {timeLeft}
    </span>
  );
}

function App() {
  const logoUrl = 'https://i.postimg.cc/RCXL4ZZ9/logo.png';

  const logoContainerRef = useRef(null);
  const logoCardRef = useRef(null);
  const logoGlareRef = useRef(null);

  // 📱 Estado para detección de dispositivo móvil y pestañas superiores en celular
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [mobileTab, setMobileTab] = useState('cupones'); // 'cupones' | 'productos' | 'juegos' | 'reels'

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
  // const [showMusicModal, setShowMusicModal] = useState(false); // 🎵 Música comentada
  // const [isMinimized, setIsMinimized] = useState(false); // 🎵 Música comentada
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  
  const [showCommunityPopup, setShowCommunityPopup] = useState(false);
  
  const [tiktokVideos, setTiktokVideos] = useState(() => {
    try {
      const saved = localStorage.getItem('cazaOfertasVideos');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'video-1',
        title: '¡Cazando ofertón en directo! 🛒🔥',
        author: 'CazaOfertas Oficial',
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
    localStorage.setItem('cazaOfertasVideos', JSON.stringify(tiktokVideos));
  }, [tiktokVideos]);

  const [themeMode, setThemeMode] = useState('dark');
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [descuentos, setDescuentos] = useState([]);
  const [cupones, setCupones] = useState([]);
  
  const [currentUser, setCurrentUser] = useState(() => {
    return localStorage.getItem('cazaUser') || null;
  });

  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('cazaUser');
    if (usuarioGuardado) {
      setCurrentUser(usuarioGuardado);
    }
  }, []);

  useEffect(() => {
    if (!currentUser) {
      const dismissed = sessionStorage.getItem('communityPopupDismissed');
      if (!dismissed) {
        const timer = setTimeout(() => {
          if (!localStorage.getItem('cazaUser')) {
            setShowCommunityPopup(true);
          }
        }, 60000);
        return () => clearInterval(timer);
      }
    }
  }, [currentUser]);
  
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

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

  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [productSearchInput, setProductSearchInput] = useState('');
  const [couponSearchTerm, setCouponSearchTerm] = useState(''); 
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

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' });
  const [cuponesRef, cuponesApi] = useEmblaCarousel({ loop: true, align: 'start' });

  useEffect(() => {
    if (!cuponesApi) return;
    const autoplay = setInterval(() => {
      cuponesApi.scrollNext();
    }, 4000);
    return () => clearInterval(autoplay);
  }, [cuponesApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const autoplay = setInterval(() => {
      emblaApi.scrollNext();
    }, 5000);
    return () => clearInterval(autoplay);
  }, [emblaApi]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollPrevCupones = useCallback(() => {
    if (cuponesApi) cuponesApi.scrollPrev();
  }, [cuponesApi]);

  const scrollNextCupones = useCallback(() => {
    if (cuponesApi) cuponesApi.scrollNext();
  }, [cuponesApi]);

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
      url: 'https://t.me/+K-usKp25iPYzNWUx',
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

  const getSafeId = (item) => {
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

  useEffect(() => {
    loadPublicOffers();
    loadPublicProducts();

    const botSyncInterval = setInterval(() => {
      loadPublicOffers();
      loadPublicProducts();
    }, 30000); 

    return () => clearInterval(botSyncInterval);
  }, []);

  const loadPublicProducts = async () => {
    try {
      const response = await axios.get(`${API}/products?t=${Date.now()}`);
      setProducts(response.data);
    } catch (error) {}
  };

  const loadPublicOffers = async () => {
    try {
      const [descResponse, cupResponse] = await Promise.all([
        axios.get(`${API}/offers?type=descuento&t=${Date.now()}`),
        axios.get(`${API}/offers?type=cupon&t=${Date.now()}`),
      ]);
      setDescuentos(descResponse.data.map(decodeCoupon));
      setCupones(cupResponse.data.map(decodeCoupon));
    } catch (error) {}
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

  const handleCopiarIrMercadoLibre = (cupon) => {
    if (cupon.code) {
      navigator.clipboard.writeText(cupon.code);
    }
    playSniperSound();
    setToastMessage('Cupón copiado en el portapapeles, estas muy cerca de obtener un mejor precio en tus productos. seras dirigido a Mercado libre');
    setShowToast(true);

    setTimeout(() => {
      setShowToast(false);
      if (cupon.link) {
        window.location.href = cupon.link;
      } else {
        window.location.href = 'https://www.mercadolibre.com.mx';
      }
    }, 5000);
  };

  const activeCupones = cupones.filter((cupon) => {
    if (!cupon.expires_at) return true;
    return new Date(cupon.expires_at).getTime() > currentTime;
  });

  const filteredCupones = activeCupones.filter((cupon) => {
    const term = couponSearchTerm.trim();
    if (!term) return true;

    const numericBudget = Number(term.replace(/\D/g, ''));
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
    return (
      cupon.title.toLowerCase().includes(lowerTerm) ||
      (cupon.description && cupon.description.toLowerCase().includes(lowerTerm)) ||
      (cupon.code && cupon.code.toLowerCase().includes(lowerTerm))
    );
  });

  const isLight = themeMode === 'light';
  const filteredProducts = products.filter(
    (p) =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description &&
        p.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const mainBgClass = isLight
    ? 'min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-800 relative overflow-x-hidden font-sans'
    : 'min-h-screen bg-neutral-950 text-neutral-100 relative overflow-x-hidden font-sans';

  // Renderizador modular para los contenidos principales (Cupones, Productos, Juegos, Reels)
  const renderCuponesSection = () => (
    activeCupones.length > 0 && (
      <div className="container mx-auto px-4 mb-8 relative z-20">
        <div className={`rounded-3xl shadow-xl p-8 backdrop-blur-xl border ${
          isLight ? 'bg-white border-purple-200' : 'bg-neutral-900/85 border-neutral-800'
        }`}>
          <div className="relative flex items-center justify-center mb-6">
            <h2 className={`text-3xl font-bold text-center ${
              isLight ? 'text-purple-700' : 'text-neutral-100 font-black'
            }`}>
              ✨ Cupones Especiales del dia
            </h2>
            
            <div className="absolute right-0 top-0 group">
              <button
                onClick={() => setShowTutorialModal(true)}
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all hover:scale-110 shadow-lg ${
                  isLight
                    ? 'text-purple-600 border-purple-300 hover:bg-purple-100'
                    : 'text-yellow-400 border-yellow-400/50 hover:bg-yellow-400/20'
                }`}
                aria-label="Ayuda con cupones"
              >
                <HelpCircle className="w-6 h-6" />
              </button>
              
              <div className={`absolute bottom-full right-0 mb-3 w-56 p-2.5 text-xs font-bold text-center rounded-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none shadow-xl transform translate-y-2 group-hover:translate-y-0 z-10 ${
                isLight ? 'bg-gray-800 text-white' : 'bg-neutral-800 text-neutral-200 border border-neutral-600'
              }`}>
                ¿Sabes como usar los cupones / Tienes dudas?
                <div className={`absolute top-full right-4 -mt-1 border-4 border-transparent ${isLight ? 'border-t-gray-800' : 'border-t-neutral-800'}`}></div>
              </div>
            </div>
          </div>

          <div className="max-w-xl mx-auto mb-8 flex gap-2">
            <div className="relative flex-1">
              <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 ${
                isLight ? 'text-gray-400' : 'text-neutral-500'
              }`} />
              <input
                type="text"
                value={couponSearchTerm}
                onChange={handleCouponSearchChange}
                placeholder="¿Cuánto planeas gastar? Ej: $4,000"
                className={`w-full pl-11 pr-4 py-3 rounded-xl border focus:outline-none focus:border-yellow-400 text-sm ${
                  isLight ? 'bg-gray-50 border-gray-300 text-gray-800' : 'bg-neutral-950 border-neutral-700 text-neutral-100'
                }`}
              />
            </div>
          </div>

          {filteredCupones.length === 0 ? (
            <div className="text-center py-12">
              <p className={`text-base mb-4 font-semibold ${isLight ? 'text-gray-600' : 'text-neutral-400'}`}>
                Lo lamentamos, por el momento no tenemos un cupón para ese precio. ¡Regresa más tarde! 🕒
              </p>
            </div>
          ) : (
            <div className="relative">
              <div className="overflow-hidden" ref={cuponesRef}>
                <div className="flex gap-6">
                  {filteredCupones.map((cupon) => {
                    const cuponId = getSafeId(cupon) || cupon.title;
                    const currentReaction = userReactions[cuponId];
                    const counts = couponCounts[cuponId] || { like: 0, dislike: 0, heart: 0 };

                    return (
                      <div key={cuponId} className="flex-[0_0_100%] md:flex-[0_0_calc(50%-12px)] lg:flex-[0_0_calc(33.333%-16px)] min-w-0">
                        <div className="h-full bg-[#FFEA00] border-4 border-black rounded-3xl p-4 md:p-5 flex flex-col items-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative">
                          
                          <div className="absolute top-3 right-3 z-10">
                            <CountdownTimer expiresAt={cupon.expires_at} />
                          </div>

                          <div className="w-full text-center mt-7 mb-3 flex items-center justify-center gap-2 md:gap-4 relative">
                            <svg className="w-8 h-8 md:w-10 md:h-10 text-black flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
                            <h3 className="text-3xl md:text-4xl font-black text-black leading-[1.1] tracking-tighter uppercase">
                              CUPÓN<br/>ACTIVO
                            </h3>
                            <svg className="w-8 h-8 md:w-10 md:h-10 text-black flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
                          </div>

                          <div className="relative w-full bg-white border-4 border-black rounded-2xl p-1 mb-4 flex-grow flex flex-col justify-center">
                            <div className="border-[3px] border-dashed border-black rounded-xl p-4 flex flex-col items-center justify-center h-full text-center bg-white relative z-10">
                              
                              <div className="bg-black text-white px-5 py-1.5 rounded-full text-sm font-black uppercase tracking-wider mb-2 max-w-full truncate">
                                {cupon.title || 'NUEVO CUPÓN'}
                              </div>
                              
                              {cupon.code && (
                                <div className="text-4xl md:text-5xl font-black text-black tracking-tighter mb-2 break-all">
                                  {String(cupon.code).length > 3
                                    ? String(cupon.code).slice(0, 3) + '*'.repeat(String(cupon.code).length - 3)
                                    : cupon.code}
                                </div>
                              )}
                              
                              <div className="border-t-[3px] border-black w-full mx-4 mt-2 pt-2 pb-1">
                                <div className="text-sm font-black text-black uppercase tracking-tight flex flex-col gap-1">
                                  {cupon.description ? (
                                    cupon.description.split(/(?=[Dd][Ee][Ss][Cc][Uu][Ee][Nn][Tt][Oo]\s+[Mm][ÁáAa][Xx][Ii][Mm][Oo])/).map((part, i) => (
                                      <span key={i} className="block">{part.trim()}</span>
                                    ))
                                  ) : (
                                    <span>COMPRA MÍNIMA APLICABLE</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="absolute top-1/2 -left-5 -translate-y-1/2 w-8 h-8 bg-[#FFEA00] border-4 border-black rounded-full z-20"></div>
                            <div className="absolute top-1/2 -right-5 -translate-y-1/2 w-8 h-8 bg-[#FFEA00] border-4 border-black rounded-full z-20"></div>
                          </div>

                          <div className="flex justify-between items-center w-full mb-4 px-1 gap-2">
                            <button
                              onClick={() => handleReaction(cuponId, 'like')}
                              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-black transition-all border-2 border-black ${
                                currentReaction === 'like'
                                  ? 'bg-blue-500 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] scale-105'
                                  : 'bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-100'
                              }`}
                            >
                              <span>👍</span><span>{counts.like}</span>
                            </button>
                            <button
                              onClick={() => handleReaction(cuponId, 'dislike')}
                              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-black transition-all border-2 border-black ${
                                currentReaction === 'dislike'
                                  ? 'bg-red-500 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] scale-105'
                                  : 'bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-100'
                              }`}
                            >
                              <span>👎</span><span>{counts.dislike}</span>
                            </button>
                            <button
                              onClick={() => handleReaction(cuponId, 'heart')}
                              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-black transition-all border-2 border-black ${
                                currentReaction === 'heart'
                                  ? 'bg-pink-500 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] scale-105'
                                  : 'bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-100'
                              }`}
                            >
                              <span>❤️</span><span>{counts.heart}</span>
                            </button>
                          </div>

                          {cupon.link && (
                            <button
                              onClick={() => handleCopiarIrMercadoLibre(cupon)}
                              className="w-full bg-black text-[#FFEA00] rounded-2xl py-2 flex flex-col items-center justify-center transition-transform hover:scale-[1.02] mt-auto border-2 border-black shadow-[0_4px_14px_0_rgba(0,0,0,0.39)]"
                            >
                              <div className="flex items-center justify-center gap-3 w-full">
                                <svg className="w-5 h-5 text-[#FFEA00] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
                                <span className="text-xl md:text-2xl font-black tracking-wide uppercase">COPIAR CUPÒN</span>
                                <svg className="w-5 h-5 text-[#FFEA00] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
                              </div>
                              <div className="text-sm md:text-base font-bold tracking-tight -mt-1">
                                E IR A MERCADO LIBRE
                              </div>
                            </button>
                          )}

                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {filteredCupones.length > 1 && (
                <>
                  <button
                    onClick={scrollPrevCupones}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white rounded-full p-3 shadow-xl hover:bg-gray-100 transition-all z-10 text-gray-800"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={scrollNextCupones}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white rounded-full p-3 shadow-xl hover:bg-gray-100 transition-all z-10 text-gray-800"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>
          )}

          <div className={`mt-6 pt-4 border-t text-center text-xs md:text-sm font-medium ${
            isLight ? 'border-purple-200 text-purple-900/70' : 'border-neutral-800 text-neutral-400'
          }`}>
            ℹ️ Nota informativa: La disponibilidad y vigencia de cada cupón son estimadas, ya que su validez está sujeta a un límite determinado de redenciones.
          </div>
        </div>
      </div>
    )
  );

  const renderProductosSection = () => (
    products.length > 0 && (
      <div className={`container mx-auto px-4 mb-16 relative z-10`}>
        <div className={`rounded-3xl shadow-xl p-8 backdrop-blur-xl border ${
          isLight ? 'bg-white border-gray-100' : 'bg-neutral-900/85 border-neutral-800'
        }`}>
          <h2 className={`text-3xl font-bold text-center mb-6 ${isLight ? 'text-gray-800' : 'text-neutral-100 font-black'}`}>
            🔥 Productos Destacados
          </h2>

          <div className="max-w-xl mx-auto mb-8 flex gap-2">
            <div className="relative flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 ${isLight ? 'text-gray-400' : 'text-neutral-500'}`} />
                <input
                  type="text"
                  value={productSearchInput}
                  onChange={(e) => setProductSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setSearchTerm(productSearchInput);
                    }
                  }}
                  placeholder="Busca un producto cargado aquí..."
                  className={`w-full pl-11 pr-4 py-3 rounded-xl border focus:outline-none focus:border-yellow-400 text-sm ${
                    isLight ? 'bg-gray-50 border-gray-300 text-gray-800' : 'bg-neutral-950 border-neutral-700 text-neutral-100'
                  }`}
                />
              </div>
              <button
                onClick={() => setSearchTerm(productSearchInput)}
                className={`px-4 py-3 rounded-xl flex items-center justify-center transition-all font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                  isLight ? 'bg-yellow-400 text-black' : 'bg-[#FFEA00] text-black'
                }`}
                title="Buscar Producto"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className={`text-base mb-4 ${isLight ? 'text-gray-600' : 'text-neutral-400'}`}>
                No encontramos ningún producto local con ese nombre. ¿Quieres buscarlo directamente en Mercado Libre?
              </p>
              <button onClick={handleSearchOnMercadoLibre} className="bg-yellow-400 hover:bg-yellow-300 text-black px-6 py-3 rounded-xl font-black text-sm uppercase transition-all shadow-lg">
                Buscar "{searchTerm}" en Mercado Libre 🚀
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex gap-6">
                  {filteredProducts.map((product) => (
                    <div key={product.id} className="flex-[0_0_100%] md:flex-[0_0_calc(50%-12px)] lg:flex-[0_0_calc(33.333%-16px)] min-w-0">
                      <div className={`rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden h-full flex flex-col ${
                        isLight ? 'bg-gradient-to-br from-gray-50 to-white' : 'bg-gradient-to-b from-neutral-900 to-neutral-950 border border-neutral-800'
                      }`}>
                        <div className="relative">
                          <img src={product.image_url} alt={product.title} className="w-full h-64 object-contain p-2" />
                          {product.discount_percentage && (
                            <div className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-full font-bold text-lg shadow-lg">
                              -{product.discount_percentage}%
                            </div>
                          )}
                        </div>
                        <div className="p-6 flex flex-col flex-1">
                          <h3 className={`text-xl font-bold mb-2 line-clamp-2 ${isLight ? 'text-gray-800' : 'text-neutral-100'}`}>{product.title}</h3>
                          <p className={`mb-4 line-clamp-3 text-sm flex-1 ${isLight ? 'text-gray-600' : 'text-neutral-400'}`}>
                            {product.description}
                          </p>
                          <div className="flex items-baseline gap-3 mb-4 mt-auto flex-wrap">
                            <span className={`text-3xl font-black ${isLight ? 'text-green-600' : 'text-green-400'}`}>
                              ${Number(product.discount_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className={`text-lg font-bold line-through ${isLight ? 'text-red-600' : 'text-red-400'}`}>
                              Antes ${Number(product.original_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          {product.coupon && (
                            <div className={`border-2 border-dashed rounded-lg p-3 mb-4 ${
                              isLight ? 'bg-yellow-50 border-yellow-400' : 'bg-yellow-400/15 border-yellow-400/60'
                            }`}>
                              <p className={`text-xs mb-1 ${isLight ? 'text-gray-600' : 'text-neutral-400 font-bold'}`}>
                                Cupón disponible:
                              </p>
                              <p className={`text-lg font-bold ${isLight ? 'text-yellow-700' : 'text-yellow-400'}`}>
                                {product.coupon}
                              </p>
                            </div>
                          )}
                          <a href={product.affiliate_link || product.link || product.url || '#'} target="_blank" rel="noopener noreferrer" className={`block w-full py-3 rounded-lg font-bold text-center transition-all flex items-center justify-center gap-2 ${
                            isLight ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:shadow-lg' : 'bg-yellow-400 hover:bg-yellow-300 text-black font-black'
                          }`}>
                            Ver Producto <ExternalLink className="w-5 h-5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {filteredProducts.length > 1 && (
                <>
                  <button onClick={scrollPrev} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white rounded-full p-3 shadow-xl hover:bg-gray-100 transition-all z-10 text-gray-800">
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button onClick={scrollNext} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white rounded-full p-3 shadow-xl hover:bg-gray-100 transition-all z-10 text-gray-800">
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>
          )}
          <div className={`mt-6 pt-4 border-t text-center text-xs md:text-sm font-medium ${
            isLight ? 'border-gray-200 text-gray-600' : 'border-neutral-800 text-neutral-400'
          }`}>
            ℹ️ Nota informativa: Los precios y la disponibilidad de los productos están sujetos a cambios sin previo aviso, ya que dependen directamente de cada vendedor o tienda asociada.
          </div>
        </div>
      </div>
    )
  );

  const renderReelsSection = () => (
    <div className="container mx-auto px-4 mb-16 relative z-10">
      <div className={`rounded-3xl shadow-xl p-8 backdrop-blur-xl border ${
        isLight ? 'bg-white border-purple-200' : 'bg-neutral-900/85 border-neutral-800'
      }`}>
        <div className="text-center mb-8">
          <h2 className={`text-3xl md:text-4xl font-black mb-3 flex items-center justify-center gap-3 ${
            isLight ? 'text-purple-700' : 'text-neutral-100'
          }`}>
            <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" /> Productos probados en YouTube
          </h2>
          <p className={`text-sm md:text-base max-w-xl mx-auto font-medium ${
            isLight ? 'text-gray-600' : 'text-neutral-400'
          }`}>
            Mira los videos en acción y adquiere directamente en Mercado Libre el artículo recomendado. 🚀
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

  return (
    <div className={mainBgClass}>
      {!isLight && (
        <>
          <div className="fixed inset-0 bg-grid opacity-20 pointer-events-none" />
          <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-yellow-400/5 rounded-full blur-[150px] pointer-events-none" />
        </>
      )}

      {/* POP-UP AUTOMÁTICO A 1 MINUTO PARA USUARIOS NO REGISTRADOS */}
      <AnimatePresence>
        {showCommunityPopup && !currentUser && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[90] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`relative rounded-3xl p-8 max-w-md w-full border text-center shadow-2xl ${
                isLight ? 'bg-white border-purple-200 text-gray-800' : 'bg-neutral-900 border-yellow-400/50 text-neutral-100'
              }`}
            >
              <button
                onClick={() => {
                  setShowCommunityPopup(false);
                  sessionStorage.setItem('communityPopupDismissed', 'true');
                }}
                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="w-16 h-16 bg-yellow-400/20 text-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-yellow-400/40">
                <Sparkles className="w-8 h-8 animate-pulse" />
              </div>

              <h3 className="text-2xl font-black mb-3 uppercase tracking-tight">
                ¿Quieres unirte a nuestra comunidad?
              </h3>

              <p className="text-sm leading-relaxed mb-6 opacity-90">
                Tenemos beneficios exclusivos para ti. Jugando, interactuando y descubriendo ofertas en nuestra plataforma, podrás <strong>ganar premios cada mes</strong> si te encuentras entre los usuarios con mayor actividad.
              </p>

              <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-2xl p-4 mb-6 text-left">
                <p className="text-xs font-bold uppercase tracking-wider text-yellow-400 mb-1">
                  🌟 Únete a nuestra comunidad de Ahorradores
                </p>
                <p className="text-xs opacity-80">
                  Crea tu perfil gratis en segundos para empezar a sumar puntos, participar en juegos y reclamar recompensas.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCommunityPopup(false);
                    sessionStorage.setItem('communityPopupDismissed', 'true');
                    setShowProfilePanel(true);
                  }}
                  className="flex-1 py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-black rounded-xl text-xs uppercase transition-all shadow-lg"
                >
                  Crear Perfil 🚀
                </button>
                <button
                  onClick={() => {
                    setShowCommunityPopup(false);
                    sessionStorage.setItem('communityPopupDismissed', 'true');
                  }}
                  className="px-5 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold rounded-xl text-xs transition-all border border-neutral-700"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MENÚ FLOTANTE SUPERIOR DERECHO */}
      <div className="fixed top-6 right-6 z-[60] flex flex-col items-center gap-3">
        <div className="flex flex-col items-center gap-1">
          {currentUser && (
            <span className={`font-bold text-[11px] truncate max-w-[65px] text-center ${
              isLight ? 'text-purple-700' : 'text-yellow-400'
            }`}>
              @{localStorage.getItem('cazaNick') || 'User'}
            </span>
          )}
          <button
            onClick={() => setShowProfilePanel(true)}
            className={`w-12 h-12 rounded-full shadow-2xl flex items-center justify-center overflow-hidden transition-all hover:scale-110 border-2 ${
              isLight
                ? 'bg-white text-purple-600 border-purple-200'
                : 'bg-neutral-900 text-yellow-400 border-yellow-400/50'
            }`}
            title="Mi Perfil / Login"
          >
            {localStorage.getItem('cazaAvatarImg') ? (
              <img src={localStorage.getItem('cazaAvatarImg')} alt="Perfil" className="w-full h-full object-cover" />
            ) : currentUser ? (
              <span className="text-xl font-black">{localStorage.getItem('cazaAvatar') || currentUser.charAt(0)}</span>
            ) : (
              <User className="w-6 h-6" />
            )}
          </button>
        </div>

        <button
          onClick={() => setShowThemeModal(true)}
          className={`w-12 h-12 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 border-2 ${
            isLight
              ? 'bg-white text-gray-600 border-gray-200'
              : 'bg-neutral-900 text-neutral-400 border-neutral-700'
          }`}
          title="Cambiar Tema"
        >
          <Settings className="w-6 h-6" />
        </button>
        
        {/* 🎵 MÓDULO DE MÚSICA COMENTADO TEMPORALMENTE 
        <button
          onClick={() => {
            if (isMinimized) {
              setIsMinimized(false);
              setShowMusicModal(true);
            } else {
              setShowMusicModal(!showMusicModal);
            }
          }}
          className={`w-12 h-12 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 border-2 ${
            isLight
              ? 'bg-white text-green-600 border-green-200'
              : 'bg-neutral-900 text-green-400 border-green-500/50'
          }`}
          title="Reproductor de Música"
        >
          <Music className="w-6 h-6" />
        </button>
        */}
      </div>

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
                  <p className="text-lg font-black leading-tight uppercase">{toastMessage}</p>
                </div>
                <button
                  onClick={() => setShowToast(false)}
                  className="absolute top-4 right-4 text-black hover:text-gray-700 transition-colors bg-white rounded-full p-1 border-2 border-black"
                >
                  <X className="h-5 w-5 font-black" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CABECERA CLÁSICA */}
      <div
        className={`relative overflow-hidden border-b pb-16 ${
          isLight
            ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 border-transparent'
            : 'bg-gradient-to-b from-neutral-900 to-neutral-950 border-neutral-800'
        }`}
      >
        {!isLight && <div className="absolute inset-0 bg-black opacity-10" />}
        <div className="relative container mx-auto px-4 pt-12 pb-8">
          <div className="flex flex-col items-center text-center">
            
            <div
              ref={logoContainerRef}
              onMouseMove={handleLogoMouseMove}
              onMouseLeave={handleLogoMouseLeave}
              onMouseEnter={handleLogoMouseEnter}
              className="mb-6 cursor-pointer w-48 h-48 md:w-56 md:h-56 mx-auto"
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
                  alt="CazaOfertasML Logo"
                  className="w-full h-full rounded-full object-cover block pointer-events-none"
                  style={{ transform: 'translateZ(40px)' }}
                  data-testid="logo-image"
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

            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg" data-testid="main-title">
              CazaOfertasML
            </h1>

            <p className="text-xl md:text-2xl text-white/90 mb-6 max-w-2xl" data-testid="hero-subtitle">
              ¡Las Mejores Ofertas de Mercado libre & Amazon!
            </p>

            <div className={`inline-block backdrop-blur-sm px-6 py-3 rounded-full ${
              isLight ? 'bg-white/20' : 'bg-yellow-400/10 border border-yellow-400/30'
            }`}>
              <p className="text-white font-semibold text-lg" data-testid="hero-tagline">
                🎁 "No compres caro, Nosotros ya hicimos la busqueda por ti" 🎁
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* RENDERIZADO CONDICIONAL: PESTAÑAS SUPERIORES PARA CELULAR O CONTENIDO COMPLETO PARA COMPUTADORA/TABLET */}
      {isMobileDevice ? (
        <div className="container mx-auto px-4 mt-6 mb-16 relative z-20">
          {/* Pestañas superiores para móviles */}
          <div className="flex overflow-x-auto gap-2 bg-neutral-900/90 border border-neutral-800 p-2 rounded-2xl mb-6 custom-scrollbar shadow-xl">
            <button
              onClick={() => setMobileTab('cupones')}
              className={`flex-1 py-3 px-4 rounded-xl font-black text-xs uppercase transition-all whitespace-nowrap ${
                mobileTab === 'cupones' ? 'bg-yellow-400 text-black shadow-md' : 'text-neutral-400 hover:text-white'
              }`}
            >
              🎟️ Cupones
            </button>
            <button
              onClick={() => setMobileTab('productos')}
              className={`flex-1 py-3 px-4 rounded-xl font-black text-xs uppercase transition-all whitespace-nowrap ${
                mobileTab === 'productos' ? 'bg-yellow-400 text-black shadow-md' : 'text-neutral-400 hover:text-white'
              }`}
            >
              🔥 Productos
            </button>
            <button
              onClick={() => setMobileTab('juegos')}
              className={`flex-1 py-3 px-4 rounded-xl font-black text-xs uppercase transition-all whitespace-nowrap ${
                mobileTab === 'juegos' ? 'bg-yellow-400 text-black shadow-md' : 'text-neutral-400 hover:text-white'
              }`}
            >
              🎮 Juegos
            </button>
            <button
              onClick={() => setMobileTab('reels')}
              className={`flex-1 py-3 px-4 rounded-xl font-black text-xs uppercase transition-all whitespace-nowrap ${
                mobileTab === 'reels' ? 'bg-yellow-400 text-black shadow-md' : 'text-neutral-400 hover:text-white'
              }`}
            >
              📺 Pruebas
            </button>
          </div>

          {/* Contenido según la pestaña activa en celular */}
          {mobileTab === 'cupones' && renderCuponesSection()}
          {mobileTab === 'productos' && renderProductosSection()}
          {mobileTab === 'juegos' && (
            <div className="mb-8">
              <GamesZone currentUser={currentUser} isLight={isLight} isAuthenticated={isAuthenticated} />
            </div>
          )}
          {mobileTab === 'reels' && renderReelsSection()}
        </div>
      ) : (
        // Contenido completo para Computadora y Tablet (tal cual estaba)
        <>
          {renderCuponesSection()}
          {renderProductosSection()}

          <GamesZone currentUser={currentUser} isLight={isLight} isAuthenticated={isAuthenticated} />

          {renderReelsSection()}
        </>
      )}

      {showTutorialModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[80] p-4">
          <div className={`relative rounded-3xl p-6 w-full max-w-3xl shadow-2xl border flex flex-col ${
            isLight ? 'bg-white border-gray-200' : 'bg-neutral-900 border-neutral-800'
          }`}>
            <button onClick={() => setShowTutorialModal(false)} className={`absolute top-4 right-4 rounded-full p-2 transition-colors z-10 ${
              isLight ? 'hover:bg-gray-200 text-gray-600' : 'hover:bg-neutral-800 text-neutral-400'
            }`}>
              <X className="w-6 h-6" />
            </button>
            <h3 className={`text-2xl font-bold mb-4 text-center pr-8 ${isLight ? 'text-gray-800' : 'text-white'}`}>
              🎓 ¿Cómo aplicar tus cupones?
            </h3>
            <div className="aspect-video bg-black rounded-xl overflow-hidden relative border border-neutral-700">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/TU_ID_DE_VIDEO_AQUI"
                title="Tutorial de cupones"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              ></iframe>
            </div>
            <p className={`mt-4 text-center font-semibold ${isLight ? 'text-gray-600' : 'text-neutral-400'}`}>
              Sigue estos sencillos pasos en el video para aprovechar tus descuentos al máximo. 💸
            </p>
          </div>
        </div>
      )}

      <ProfileModal
        showProfilePanel={showProfilePanel}
        setShowProfilePanel={setShowProfilePanel}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        isLight={isLight}
      />

      <section className={`relative overflow-hidden py-24 px-4 border-b ${
        isLight 
          ? 'bg-gradient-to-br from-gray-50 via-purple-50/30 to-indigo-50/50 border-gray-200 text-gray-800' 
          : 'bg-gradient-to-br from-neutral-950 via-neutral-900 to-black border-neutral-800 text-neutral-100'
      }`}>
        <div className="relative container mx-auto max-w-7xl z-10 flex flex-col items-center">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
              ¿Por qué unirte a nuestros canales?
            </h2>
          </div>

          <div className="flex flex-col items-center justify-center pt-8 pb-16 relative">
            <FeatureCube isLight={isLight} />
          </div>

        </div>
      </section>

      <footer className={`py-12 border-t ${
        isLight ? 'bg-gray-900 text-white border-transparent' : 'bg-neutral-950 border-neutral-900 text-neutral-400'
      }`}>
        <div className="container mx-auto px-4 text-center">
          <div className="mb-6">
            <img src={logoUrl} alt="CazaOfertasML" className="w-20 h-20 rounded-full mx-auto mb-4 ring-4 ring-white/20" />
            <h3 className="text-2xl font-bold mb-2">CazaOfertasML</h3>
            <p className="text-gray-400">"Ahorra con estilo, compra con sabiduría"</p>
          </div>
          <div className="flex justify-center space-x-6 mb-6">
            {socialLinks.map((social, index) => {
              const Icon = social.icon;
              return (
                <a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110 text-white shadow-lg ${social.color}`}
                  title={social.name}
                >
                  <Icon className="w-6 h-6" />
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
        </div>
      </footer>

      {showThemeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className={`rounded-3xl p-8 max-w-sm w-full shadow-2xl border ${
            isLight ? 'bg-white text-gray-800 border-gray-200' : 'bg-neutral-900 text-neutral-100 border-neutral-800'
          }`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">⚙️ Tema de fondo</h2>
              <button onClick={() => setShowThemeModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => { setThemeMode('light'); setShowThemeModal(false); }}
                className={`w-full py-3.5 px-4 rounded-xl font-bold flex items-center justify-between border transition-all ${
                  themeMode === 'light' ? 'bg-purple-500 text-white border-purple-500 shadow-md' : 'bg-neutral-800 text-neutral-200 border-neutral-700 hover:bg-neutral-700'
                }`}
              >
                <span>☀️ Tema Claro</span>
                {themeMode === 'light' && <span className="font-black">✓</span>}
              </button>
              <button
                onClick={() => { setThemeMode('dark'); setShowThemeModal(false); }}
                className={`w-full py-3.5 px-4 rounded-xl font-bold flex items-center justify-between border transition-all ${
                  themeMode === 'dark' ? 'bg-yellow-400 text-black border-yellow-400 shadow-md' : 'bg-neutral-800 text-neutral-200 border-neutral-700 hover:bg-neutral-700'
                }`}
              >
                <span>🌙 Tema Oscuro</span>
                {themeMode === 'dark' && <span className="font-black">✓</span>}
              </button>
            </div>
          </div>
        </div>
      )}

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
        loadPublicOffers={loadPublicOffers}
        loadPublicProducts={loadPublicProducts}
        tiktokVideos={tiktokVideos}
        setTiktokVideos={setTiktokVideos}
      />

      {/* 🎵 MÓDULO DE MÚSICA COMENTADO TEMPORALMENTE 
      <MusicPlayer
        showMusicModal={showMusicModal}
        setShowMusicModal={setShowMusicModal}
        isLight={isLight}
        isMinimized={isMinimized}
        setIsMinimized={setIsMinimized}
      />
      */}

      <ChatbotWidget isLight={isLight} cupones={activeCupones} />
    </div>
  );
}

export default App;
