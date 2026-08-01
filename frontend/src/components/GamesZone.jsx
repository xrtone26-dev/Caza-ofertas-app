import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Gamepad2, User, Trophy, Play, Pause, Sparkles, Volume2, VolumeX, RotateCcw, Clock, Lightbulb, Maximize, Minimize, Settings as SettingsIcon, Music, Zap, Award, BarChart3, Share2, Home, Calendar } from 'lucide-react';

// ---------------------------------------------------------------------------
// CONFIGURACIÓN DEL MEMORAMA
// ---------------------------------------------------------------------------
const MEMORY_DIFFICULTIES = {
  'Fácil': { id: 'easy', rows: 4, cols: 4, pairs: 8, gridClass: 'grid-cols-4', maxWidth: 'max-w-[400px]', maxHeight: 'max-h-[400px]' },
  'Normal': { id: 'normal', rows: 6, cols: 6, pairs: 18, gridClass: 'grid-cols-6', maxWidth: 'max-w-[430px]', maxHeight: 'max-h-[430px]' },
  'Difícil': { id: 'hard', rows: 8, cols: 8, pairs: 32, gridClass: 'grid-cols-8', maxWidth: 'max-w-[440px]', maxHeight: 'max-h-[440px]' },
  'Experto': { id: 'expert', rows: 10, cols: 10, pairs: 50, gridClass: 'grid-cols-10', maxWidth: 'max-w-[445px]', maxHeight: 'max-h-[445px]' }
};

const MEMORY_THEMES = {
  'Animales': ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦','🐤','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🐛','🦋','🐌','🐞','🐜','🦟','🦗','🕷','🦂','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟'],
  'Frutas': ['🍏','🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🥬','🥒','🌶','🌽','🥕','🧄','🧅','🥔','🍠','🥐','🥯','🍞','🥖','🥨','🧀','🥚','🍳','🧈','🥞','🧇','🥓','🥩','🍗','🍖','🌭','🍔','🍟','🍕','🥪','🥙'],
  'Espacio': ['🌍','🌎','🌏','🪐','☀️','🌙','🌜','🌛','🌟','🌠','🌌','☁️','⛅','⛈️','🌤️','🌥️','🌦️','🌧️','🌨️','🌩️','🌪️','🌫️','🌬️','🌀','🌈','🌂','☂️','☔','⛱️','⚡','❄️','☃️','⛄','☄️','🔥','💧','🌊','🚀','🛸','🛰️','👨‍🚀','👩‍🚀','👽','👾','🤖','🌌','🔭','📡','🔋','🔮'],
  'Tecnología': ['⌚','📱','📲','💻','⌨️','🖥️','🖨️','🖱️','🖲️','🕹️','🗜️','💽','💾','💿','📀','📼','📷','📸','📹','🎥','📽️','🎞️','📞','☎️','📟','📠','📺','📻','🎙️','🎚️','🎛️','🧭','⏱️','⏲️','⏰','🕰️','⌛','⏳','📡','🔋','🔌','💡','🔦','🕯️','🧯','🗑️','🛢️','💸','💵','💴']
};

const FRUIT_TYPES = [
  { name: 'Manzana', emoji: '🍎', color: '#ef4444', points: 10 },
  { name: 'Sandía', emoji: '🍉', color: '#22c55e', points: 10 },
  { name: 'Plátano', emoji: '🍌', color: '#eab308', points: 10 },
  { name: 'Piña', emoji: '🍍', color: '#f59e0b', points: 10 },
  { name: 'Kiwi', emoji: '🥝', color: '#84cc16', points: 10 },
  { name: 'Fresa', emoji: '🍓', color: '#f43f5e', points: 10 },
  { name: 'Durazno', emoji: '🍑', color: '#fb923c', points: 10 },
  { name: 'Uvas', emoji: '🍇', color: '#a855f7', points: 10 },
  { name: 'Cerezas', emoji: '🍒', color: '#dc2626', points: 10 },
  { name: 'Pera', emoji: '🍐', color: '#bef264', points: 10 },
  { name: 'Mango', emoji: '🥭', color: '#f97316', points: 10 },
  { name: 'Naranja', emoji: '🍊', color: '#fb923c', points: 10 },
  { name: 'Limón', emoji: '🍋', color: '#facc15', points: 10 }
];

const MEDALS = [
  { id: 'diamond', name: 'Diamante', threshold: 750, color: 'from-cyan-300 to-blue-500', icon: '💎' },
  { id: 'gold', name: 'Oro', threshold: 600, color: 'from-yellow-300 to-yellow-600', icon: '🥇' },
  { id: 'silver', name: 'Plata', threshold: 450, color: 'from-gray-300 to-gray-500', icon: '🥈' },
  { id: 'bronze', name: 'Bronce', threshold: 300, color: 'from-orange-400 to-orange-700', icon: '🥉' },
  { id: 'wood', name: 'Madera', threshold: 0, color: 'from-amber-700 to-amber-900', icon: '🪵' }
];

const ACHIEVEMENTS = [
  { id: 'first_blood', title: 'Primer Clic', desc: 'Haz tu primer clic.', target: 1 },
  { id: 'speed_100', title: 'Cien', desc: 'Alcanza 100 clics.', target: 100 },
  { id: 'speed_500', title: 'Medio Millar', desc: 'Alcanza 500 clics.', target: 500 },
  { id: 'cps_10', title: 'Rápido', desc: 'Alcanza 10 CPS.', targetCps: 10 },
  { id: 'cps_15', title: 'Rayo', desc: 'Alcanza 15 CPS.', targetCps: 15 }
];

const TAUNT_MESSAGES = [
  "¡CLICK!", "¡Más rápido!", "¡No te detengas!", "¡Aún puedes romper el récord!",
  "¡Vamos, acelera!", "¡Eso fue lento!", "¡Tus dedos pueden más!", "¡Dale con todo!",
  "¡No aflojes!", "¡Sigue, sigue!", "¡No pierdas el ritmo!", "¡Más velocidad!",
  "¡Aún no impresiona!", "¡Quiero ver humo en ese mouse!", "¡Haz clic como si no hubiera mañana!",
  "¡No me hagas dormir!", "¡Vamos campeón!", "¡Eso apenas calienta!", "¡El récord se está riendo de ti!",
  "¡Más fuerza!", "¡Más rapidez!", "¡Vamos, rompe ese botón!", "¡Tus clics necesitan cafeína!",
  "¡Acelera esos dedos!", "¡Todavía puedes ganar!", "¡No bajes el ritmo!", "¡No te rindas!",
  "¡Sorpréndeme!", "¡Demuéstralo!", "¡Quiero más clics!", "¡Eso estuvo cerca!",
  "¡Haz historia!", "¡El tiempo corre!", "¡Solo falta un poco más!", "¡No pares ahora!",
  "¡Estás encendido!", "¡Sigue así!", "¡No desperdicies segundos!", "¡Cada clic cuenta!",
  "¡Más, más, más!", "¡El botón aún respira!", "¡Hazlo sufrir!", "¡Dale sin miedo!",
  "¡No lo acaricies, haz clic!", "¡Muéstrale quién manda!", "¡Modo bestia!",
  "¡Modo turbo!", "¡Modo ninja!", "¡Modo máquina!", "¡Modo loco!",
  "¡Rompe el récord!", "¡Vas muy bien!", "¡No aflojes ahora!", "¡Eso fue rápido!",
  "¡Excelente ritmo!", "¡Sube la velocidad!", "¡No pierdas el impulso!",
  "¡Más potencia!", "¡Tus dedos pueden ir más rápido!", "¡Vamos, máquina de clics!",
  "¡Quiero ver un nuevo récord!", "¡Imparable!", "¡Increíble velocidad!",
  "¡Sigue atacando ese botón!", "¡No dejes respirar al botón!", "¡Haz que eche humo!",
  "¡No te distraigas!", "¡Cada segundo vale oro!", "¡Solo los mejores llegan al récord!",
  "¡Hazlo legendario!", "¡Un clic más!", "¡Diez clics más!", "¡No bajes la guardia!",
  "¡Estás cerca!", "¡A fondo!", "¡Sin descanso!", "¡Con todo!", "¡Exprime esos dedos!",
  "¡El récord te espera!", "¡Haz que valga la pena!", "¡Vamos, puedes más!",
  "¡No hay excusas!", "¡A romper marcas!", "¡Haz clic hasta el último segundo!",
  "¡No pares hasta que termine!", "¡El cronómetro no espera!", "¡Haz cada clic contar!",
  "¡Eso es velocidad!", "¡Más intensidad!", "¡No mires el tiempo, sigue clickeando!",
  "¡El récord está temblando!", "¡Hazlo épico!", "¡Lleva tus dedos al límite!",
  "¡No hay descanso para los campeones!", "¡Más rápido que eso!", "¡A romper todos los récords!"
];

// Configuración Tetris
const TETRIS_COLS = 10;
const TETRIS_ROWS = 20;
const TETRIS_HIDDEN_ROWS = 2;
const TETRIS_SHAPES = {
  I: { shape: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], color: '#06b6d4' },
  J: { shape: [[1,0,0],[1,1,1],[0,0,0]], color: '#3b82f6' },
  L: { shape: [[0,0,1],[1,1,1],[0,0,0]], color: '#f97316' },
  O: { shape: [[1,1],[1,1]], color: '#eab308' },
  S: { shape: [[0,1,1],[1,1,0],[0,0,0]], color: '#22c55e' },
  T: { shape: [[0,1,0],[1,1,1],[0,0,0]], color: '#a855f7' },
  Z: { shape: [[1,1,0],[0,1,1],[0,0,0]], color: '#ef4444' }
};

export default function GamesZone({ currentUser, isLight }) {
  const [activeGame, setActiveGame] = useState('2048'); 
  const [gamePhase, setGamePhase] = useState('menu'); 
  const [isEffectsMuted, setIsEffectsMuted] = useState(false);

  // Estados de XP y Niveles independientes por jugador y más difíciles
  const [playerXP, setPlayerXP] = useState(() => Number(localStorage.getItem('caza_player_xp')) || 96);
  const [playerLevel, setPlayerLevel] = useState(() => Number(localStorage.getItem('caza_player_level')) || 14);
  const [playerCoins, setPlayerCoins] = useState(() => Number(localStorage.getItem('caza_player_coins')) || 2206);
  const [nextXpTarget, setNextXpTarget] = useState(() => {
    const lvl = Number(localStorage.getItem('caza_player_level')) || 14;
    return 1000 + lvl * 500;
  });

  const gameContainerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [timeLeftMonth, setTimeLeftMonth] = useState('0d 0h 0m 0s');

  // Récords independientes por cada juego
  const [highScores, setHighScores] = useState(() => {
    try {
      const saved = localStorage.getItem('caza_arcade_highscores');
      return saved ? JSON.parse(saved) : { '2048': 1972, 'tetris': 0, 'memory': 0, 'ninja': 0, 'clicker': 0 };
    } catch(e) {
      return { '2048': 1972, 'tetris': 0, 'memory': 0, 'ninja': 0, 'clicker': 0 };
    }
  });

  // Estado para los Ganadores del Mes almacenados
  const [monthlyWinners, setMonthlyWinners] = useState(() => {
    try {
      const saved = localStorage.getItem('caza_monthly_winners');
      return saved ? JSON.parse(saved) : {};
    } catch(e) {
      return {};
    }
  });

  // Efecto para actualizar el temporizador del Torneo Mensual y registrar ganadores al cambiar de mes
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
      const diff = lastDayOfMonth - now;

      // Verificación de cambio de mes para guardar ganadores del mes anterior automáticamente
      const lastSavedMonth = localStorage.getItem('caza_last_saved_month');
      const currentMonthKey = `${currentYear}-${currentMonth}`;

      if (lastSavedMonth !== currentMonthKey) {
        if (lastSavedMonth) {
          try {
            const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
            const prevDate = new Date(currentYear, currentMonth - 1, 1);
            const prevMonthName = monthNames[prevDate.getMonth()];
            const prevYear = prevDate.getFullYear();
            const fullMonthKey = `${prevMonthName} ${prevYear}`;

            const savedWinners = JSON.parse(localStorage.getItem('caza_monthly_winners')) || {};
            
            // Guardar los primeros lugares de cada juego al terminar el mes
            savedWinners[fullMonthKey] = {
              user: currentUser || 'Xrtone26',
              scores: { ...highScores }
            };
            
            localStorage.setItem('caza_monthly_winners', JSON.stringify(savedWinners));
            setMonthlyWinners(savedWinners);
          } catch(e) {}
        }
        localStorage.setItem('caza_last_saved_month', currentMonthKey);
      }

      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTimeLeftMonth(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeLeftMonth('0d 0h 0m 0s');
      }
    };

    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);
    return () => clearInterval(timerInterval);
  }, [highScores, currentUser]);

  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const [isWon, setIsWon] = useState(false);

  // Estados 2048
  const [grid2048, setGrid2048] = useState(() => Array(4).fill(0).map(() => Array(4).fill(0)));
  const [history2048, setHistory2048] = useState([]);
  const [is2048Paused, setIs2048Paused] = useState(false);

  // Estados Tetris
  const [tetrisGrid, setTetrisGrid] = useState(() => Array(TETRIS_ROWS + TETRIS_HIDDEN_ROWS).fill(0).map(() => Array(TETRIS_COLS).fill(null)));
  const [tetrisCurrent, setTetrisCurrent] = useState(null);
  const [tetrisQueue, setTetrisQueue] = useState([]);
  const [tetrisHold, setTetrisHold] = useState(null);
  const [tetrisCanHold, setTetrisCanHold] = useState(true);
  const [tetrisLevel, setTetrisLevel] = useState(1);
  const [tetrisLines, setTetrisLines] = useState(0);
  const [tetrisCombo, setTetrisCombo] = useState(0);
  const [isTetrisPaused, setIsTetrisPaused] = useState(false);
  const tetrisBagRef = useRef([]);

  // Estados Memoria
  const [memSettings, setMemSettings] = useState({ diff: 'Fácil', theme: 'Animales' });
  const [memoryCards, setMemoryCards] = useState([]);
  const [memoryFlipped, setMemoryFlipped] = useState([]);
  const [memoryMatched, setMemoryMatched] = useState([]);
  const [memStats, setMemStats] = useState({ moves: 0, errors: 0, hints: 3, time: 0 });
  const [isMemoryPaused, setIsMemoryPaused] = useState(false);
  const [memoryStars, setMemoryStars] = useState(0);

  // Estados Ninja Cut
  const [ninjaMode, setNinjaMode] = useState('classic');
  const [ninjaLives, setNinjaLives] = useState(3);
  const [ninjaTimeLeft, setNinjaTimeLeft] = useState(60);
  const [ninjaTheme, setNinjaTheme] = useState('Dojo');
  const [ninjaKatana, setNinjaKatana] = useState('Katana');
  const [comboPopup, setComboPopup] = useState(null);
  const [screenRed, setScreenRed] = useState(false);
  const [isNinjaPaused, setIsNinjaPaused] = useState(false);
  const isNinjaPausedRef = useRef(false);

  const canvasRef = useRef(null);
  const ninjaObjectsRef = useRef([]);
  const ninjaParticlesRef = useRef([]);
  const sliceTrailRef = useRef([]);
  const isMouseDownRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const ninjaGameLoopRef = useRef(null);
  const ninjaTimerRef = useRef(null);
  const ninjaLivesRef = useRef(3);
  const ninjaStatsRef = useRef({ fruitsCut: 0, gameTime: 0, lastHeartCutCount: 0 });

  // Estados Clicker Challenge
  const [clickerCountdown, setClickerCountdown] = useState(3);
  const [clickerButtonText, setClickerButtonText] = useState('¡CLICK!');
  const [clickerSettings, setClickerSettings] = useState(() => JSON.parse(localStorage.getItem('click_challenge_settings')) || {
    sound: true, music: false, theme: 'dark', vibration: true, showFps: false, buttonColor: 'blue'
  });
  const [clickerStats, setClickerStats] = useState(() => JSON.parse(localStorage.getItem('click_challenge_stats')) || {
    played: 0, highScore: 0, totalClicks: 0, timePlayed: 0, bestCps: 0, avgCps: 0, lastScore: 0, date: null, achievements: []
  });
  const [clickerLeaderboard, setClickerLeaderboard] = useState(() => JSON.parse(localStorage.getItem('click_challenge_leaderboard')) || []);

  const isClickerPlayingRef = useRef(false);
  const clickerClicksRef = useRef(0);
  const clickerMaxCpsRef = useRef(0);
  const clickerCpsHistoryRef = useRef([]);
  const clickTimestampsRef = useRef([]);
  const clickerStartTimeRef = useRef(0);
  const clickerGameLoopRef = useRef(null);
  
  const timerTextRef = useRef(null);
  const clicksTextRef = useRef(null);
  const cpsTextRef = useRef(null);
  const cpsBarRef = useRef(null);
  const clickerCanvasRef = useRef(null);
  const fpsRef = useRef(null);
  const lastFrameTimeRef = useRef(performance.now());
  const clickerParticlesRef = useRef([]);
  const clickerConfettiRef = useRef([]);
  const activeMusicRef = useRef(null);

  const gameIntervalRef = useRef(null);
  const touchStartRef = useRef({ x: 0, y: 0 });

  const fullLeaderboard = [
    { name: currentUser || 'Xrtone26', score: highScores[activeGame] || 0, isMe: true },
    { name: 'OfertaKing', score: 1540 },
    { name: 'Irving', score: 840 },
    { name: 'LadyDescuentos', score: 620 },
    { name: 'AhorroMax', score: 410 }
  ];

  useEffect(() => {
    localStorage.setItem('caza_arcade_highscores', JSON.stringify(highScores));
  }, [highScores]);

  useEffect(() => {
    localStorage.setItem('caza_player_xp', playerXP);
    localStorage.setItem('caza_player_level', playerLevel);
    localStorage.setItem('caza_player_coins', playerCoins);
  }, [playerXP, playerLevel, playerCoins]);

  useEffect(() => {
    const preventDefaultScroll = (e) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        const tag = e.target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', preventDefaultScroll, { passive: false });
    return () => window.removeEventListener('keydown', preventDefaultScroll);
  }, []);

  const setNinjaPausedState = (paused) => {
    setIsNinjaPaused(paused);
    isNinjaPausedRef.current = paused;
  };

  const updateScore = (val) => {
    scoreRef.current = val;
    setScore(val);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (gameContainerRef.current?.requestFullscreen) {
        gameContainerRef.current.requestFullscreen();
      } else if (gameContainerRef.current?.webkitRequestFullscreen) {
        gameContainerRef.current.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => { localStorage.setItem('click_challenge_settings', JSON.stringify(clickerSettings)); }, [clickerSettings]);
  useEffect(() => { localStorage.setItem('click_challenge_stats', JSON.stringify(clickerStats)); }, [clickerStats]);
  useEffect(() => { localStorage.setItem('click_challenge_leaderboard', JSON.stringify(clickerLeaderboard)); }, [clickerLeaderboard]);

  useEffect(() => {
    let interval;
    if (activeGame === 'clicker' && gamePhase === 'playing') {
      setClickerButtonText('¡CLICK!');
      interval = setInterval(() => {
        const randomPhrase = TAUNT_MESSAGES[Math.floor(Math.random() * TAUNT_MESSAGES.length)];
        setClickerButtonText(randomPhrase);
      }, 3500);
    } else {
      setClickerButtonText('¡CLICK!');
    }
    return () => clearInterval(interval);
  }, [activeGame, gamePhase]);

  useEffect(() => {
    let timer;
    if (activeGame === 'memory' && gamePhase === 'playing' && !isMemoryPaused) {
      timer = setInterval(() => {
        setMemStats(prev => ({ ...prev, time: prev.time + 1 }));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeGame, gamePhase, isMemoryPaused]);

  const audioCtxRef = useRef(null);
  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const playSoundEffect = (type) => {
    if (activeGame !== 'clicker' && isEffectsMuted) return;
    if (activeGame === 'clicker' && (!clickerSettings.sound || isEffectsMuted)) return;

    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      const now = ctx.currentTime;

      if (type === 'pop' || type === 'catch' || type === 'flip' || type === 'cut' || type === 'move') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(type === 'cut' ? 600 : type === 'move' ? 300 : 400, now);
        osc.frequency.exponentialRampToValueAtTime(type === 'cut' ? 200 : type === 'move' ? 150 : 800, now + 0.1);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start();
        osc.stop(now + 0.1);
      } else if (type === 'coin' || type === 'rotate') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(type === 'rotate' ? 440 : 523.25, now);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(); osc.stop(now + 0.15);
      } else if (type === 'match' || type === 'clear') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(); osc.stop(now + 0.3);
      } else if (type === 'mismatch') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(); osc.stop(now + 0.2);
      } else if (type === 'explosion') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(20, now + 0.6);
        gainNode.gain.setValueAtTime(0.6, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
        osc.start(); osc.stop(now + 0.6);
      } else if (type === 'heart') {
        [400, 600, 800].forEach((f, i) => {
          setTimeout(() => {
            if (ctx.state === 'running') {
              const o = ctx.createOscillator();
              const g = ctx.createGain();
              o.connect(g);
              g.connect(ctx.destination);
              o.type = 'sine';
              o.frequency.setValueAtTime(f, ctx.currentTime);
              g.gain.setValueAtTime(0.2, ctx.currentTime);
              g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
              o.start(); o.stop(ctx.currentTime + 0.15);
            }
          }, i * 80);
        });
      } else if (type === 'combo') {
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
          setTimeout(() => {
            if (ctx.state === 'running') {
              const o = ctx.createOscillator();
              const g = ctx.createGain();
              o.connect(g);
              g.connect(ctx.destination);
              o.type = 'triangle';
              o.frequency.setValueAtTime(f, ctx.currentTime);
              g.gain.setValueAtTime(0.2, ctx.currentTime);
              g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
              o.start(); o.stop(ctx.currentTime + 0.15);
            }
          }, i * 60);
        });
      } else if (type === 'win') {
        [440, 554.37, 659.25, 880].forEach((f, i) => {
          setTimeout(() => {
            if (ctx.state === 'running') {
              const o = ctx.createOscillator();
              const g = ctx.createGain();
              o.connect(g);
              g.connect(ctx.destination);
              o.type = 'square';
              o.frequency.setValueAtTime(f, ctx.currentTime);
              g.gain.setValueAtTime(0.2, ctx.currentTime);
              g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
              o.start();
              o.stop(ctx.currentTime + 0.2);
            }
          }, i * 100);
        });
      } else if (type === 'gameover') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.4);
        gainNode.gain.setValueAtTime(0.4, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start();
        osc.stop(now + 0.4);
      }
      else if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800 + Math.random() * 200, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);
      } else if (type === 'tick') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, now);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.start(now); osc.stop(now + 0.05);
      } else if (type === 'beep') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, now);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.linearRampToValueAtTime(0.01, now + 0.2);
        osc.start(now); osc.stop(now + 0.2);
      } else if (type === 'go') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.linearRampToValueAtTime(1200, now + 0.3);
        gainNode.gain.setValueAtTime(0.4, now);
        gainNode.gain.linearRampToValueAtTime(0.01, now + 0.4);
        osc.start(now); osc.stop(now + 0.4);
      } else if (type === 'over') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 1);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.linearRampToValueAtTime(0.01, now + 1);
        osc.start(now); osc.stop(now + 1);
      } else if (type === 'record') {
        [400, 500, 600, 800].forEach((freq, i) => {
          setTimeout(() => {
            if (ctx.state === 'running') {
              const o = ctx.createOscillator(); const g = ctx.createGain();
              o.connect(g); g.connect(ctx.destination);
              o.type = 'sine'; o.frequency.value = freq;
              g.gain.setValueAtTime(0.2, ctx.currentTime);
              g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
              o.start(); o.stop(ctx.currentTime + 0.3);
            }
          }, i * 150);
        });
      }
    } catch (e) {}
  };

  const handleShareScore = (gameTitle, finalScore) => {
    let detailText = '';
    if (activeGame === 'ninja') {
      detailText = ` (${ninjaStatsRef.current.fruitsCut} frutas cortadas)`;
    } else if (activeGame === 'memory') {
      detailText = ` (Tiempo: ${formatTime(memStats.time)}, Movimientos: ${memStats.moves})`;
    } else if (activeGame === 'clicker') {
      const avg = (finalScore / 60).toFixed(2);
      const medal = getClickerMedal(finalScore);
      detailText = ` (${avg} CPS) - Medalla: ${medal.name} ${medal.icon}`;
    } else if (activeGame === 'tetris') {
      detailText = ` (Líneas: ${tetrisLines}, Nivel: ${tetrisLevel})`;
    }

    const text = `¡Conseguí ${finalScore} puntos en ${gameTitle}!${detailText} 🚀 ¿Puedes superarme? Juega ahora en: https://cazaofertasml.vercel.app`;
    if (navigator.share) {
      navigator.share({ title: 'CazaOfertasML Games', text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => alert('¡Puntaje detallado y enlace copiados al portapapeles!'));
    }
  };

  const handleFinishGame = (finalScore, won = false) => {
    if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
    if (ninjaGameLoopRef.current) cancelAnimationFrame(ninjaGameLoopRef.current);
    if (ninjaTimerRef.current) clearInterval(ninjaTimerRef.current);
    if (clickerGameLoopRef.current) cancelAnimationFrame(clickerGameLoopRef.current);
    
    clickerParticlesRef.current = [];
    clickerConfettiRef.current = [];

    const validScore = finalScore !== undefined ? finalScore : scoreRef.current;
    updateScore(validScore);
    setIsWon(won);
    
    const currentHighScore = highScores[activeGame] || 0;
    if (validScore > currentHighScore) {
      setHighScores(prev => ({ ...prev, [activeGame]: validScore }));
    }

    const earnedXp = Math.floor(validScore / 3); 
    let newXp = playerXP + earnedXp;
    let newLevel = playerLevel;
    let newTarget = nextXpTarget;
    let newCoins = playerCoins + Math.floor(validScore / 10);

    while (newXp >= newTarget) {
      newXp -= newTarget;
      newLevel += 1;
      newTarget += 1000;
    }

    setPlayerXP(newXp);
    setPlayerLevel(newLevel);
    setNextXpTarget(newTarget);
    setPlayerCoins(newCoins);

    setGamePhase('gameover');
    if (won) playSoundEffect('win'); else playSoundEffect('gameover');
  };

  const handleSelectGame = (gameKey) => {
    if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
    if (ninjaGameLoopRef.current) cancelAnimationFrame(ninjaGameLoopRef.current);
    if (ninjaTimerRef.current) clearInterval(ninjaTimerRef.current);
    if (clickerGameLoopRef.current) cancelAnimationFrame(clickerGameLoopRef.current);
    
    clickerParticlesRef.current = [];
    clickerConfettiRef.current = [];

    setActiveGame(gameKey);
    setGamePhase('menu'); 
    updateScore(0);
    setIsWon(false);
  };

  const startGameFlow = () => { 
    setGamePhase('rules'); 
  };
  
  const startPlaying = () => {
    setGamePhase('playing');
    updateScore(0);
    setIs2048Paused(false);
    setIsTetrisPaused(false);
    setIsMemoryPaused(false);
    clickerParticlesRef.current = [];
    clickerConfettiRef.current = [];
    if (activeGame === '2048') init2048();
    if (activeGame === 'tetris') initTetris();
    if (activeGame === 'memory') initMemory();
    if (activeGame === 'ninja') initNinja();
    if (activeGame === 'clicker') startClickerCountdown();
  };

  useEffect(() => {
    return () => { 
      if (gameIntervalRef.current) clearInterval(gameIntervalRef.current); 
      if (ninjaGameLoopRef.current) cancelAnimationFrame(ninjaGameLoopRef.current);
      if (ninjaTimerRef.current) clearInterval(ninjaTimerRef.current);
      if (clickerGameLoopRef.current) cancelAnimationFrame(clickerGameLoopRef.current);
    };
  }, []);

  const init2048 = () => {
    let newGrid = Array(4).fill(0).map(() => Array(4).fill(0));
    newGrid = addRandom2048Tile(newGrid);
    newGrid = addRandom2048Tile(newGrid);
    setGrid2048(newGrid);
    setHistory2048([]);
    updateScore(0);
  };

  const addRandom2048Tile = (grid) => {
    const empty = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (grid[r][c] === 0) empty.push({ r, c });
      }
    }
    if (empty.length === 0) return grid;
    const { r, c } = empty[Math.floor(Math.random() * empty.length)];
    const copy = grid.map(row => [...row]);
    copy[r][c] = Math.random() < 0.9 ? 2 : 4;
    return copy;
  };

  const move2048 = useCallback((dir) => {
    if (gamePhase !== 'playing' || is2048Paused) return;
    let currentScore = scoreRef.current;
    let moved = false;
    const oldGrid = grid2048.map(row => [...row]);

    const slideRow = (row) => {
      let arr = row.filter(v => v !== 0);
      for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i] === arr[i + 1]) {
          arr[i] *= 2;
          currentScore += arr[i];
          arr[i + 1] = 0;
          playSoundEffect('pop');
        }
      }
      arr = arr.filter(v => v !== 0);
      while (arr.length < 4) arr.push(0);
      return arr;
    };

    let newGrid = grid2048.map(row => [...row]);

    if (dir === 'left' || dir === 'right') {
      for (let r = 0; r < 4; r++) {
        let row = [...newGrid[r]];
        if (dir === 'right') row.reverse();
        let sl = slideRow(row);
        if (dir === 'right') sl.reverse();
        if (sl.toString() !== newGrid[r].toString()) moved = true;
        newGrid[r] = sl;
      }
    } else {
      for (let c = 0; c < 4; c++) {
        let col = [newGrid[0][c], newGrid[1][c], newGrid[2][c], newGrid[3][c]];
        if (dir === 'down') col.reverse();
        let sl = slideRow(col);
        if (dir === 'down') sl.reverse();
        for (let r = 0; r < 4; r++) {
          if (newGrid[r][c] !== sl[r]) moved = true;
          newGrid[r][c] = sl[r];
        }
      }
    }

    if (moved) {
      setHistory2048(prev => [...prev, { grid: oldGrid, score: scoreRef.current }]);
      let finalGrid = addRandom2048Tile(newGrid);
      setGrid2048(finalGrid);
      updateScore(currentScore);

      if (finalGrid.some(row => row.includes(2048))) setIsWon(true);
      if (is2048GameOver(finalGrid)) handleFinishGame(currentScore, false);
    }
  }, [grid2048, gamePhase, is2048Paused]);

  const is2048GameOver = (grid) => {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (grid[r][c] === 0) return false;
        if (r < 3 && grid[r][c] === grid[r + 1][c]) return false;
        if (c < 3 && grid[r][c] === grid[r][c + 1]) return false;
      }
    }
    return true;
  };

  const undo2048 = () => {
    if (history2048.length === 0 || is2048Paused) return;
    const lastState = history2048[history2048.length - 1];
    setGrid2048(lastState.grid);
    updateScore(lastState.score);
    setHistory2048(prev => prev.slice(0, -1));
  };

  // ---------------- TETRIS ------------------------------------------------
  const getNextTetrisPiece = () => {
    if (tetrisBagRef.current.length === 0) {
      tetrisBagRef.current = Object.keys(TETRIS_SHAPES).sort(() => Math.random() - 0.5);
    }
    const type = tetrisBagRef.current.pop();
    return { type, ...TETRIS_SHAPES[type] };
  };

  const initTetris = () => {
    tetrisBagRef.current = [];
    const emptyGrid = Array(TETRIS_ROWS + TETRIS_HIDDEN_ROWS).fill(0).map(() => Array(TETRIS_COLS).fill(null));
    setTetrisGrid(emptyGrid);
    
    const queue = [];
    for (let i = 0; i < 6; i++) {
      queue.push(getNextTetrisPiece());
    }
    const current = queue.shift();
    const placedCurrent = {
      ...current,
      x: Math.floor((TETRIS_COLS - current.shape[0].length) / 2),
      y: 0
    };

    setTetrisQueue(queue);
    setTetrisCurrent(placedCurrent);
    setTetrisHold(null);
    setTetrisCanHold(true);
    setTetrisLevel(1);
    setTetrisLines(0);
    setTetrisCombo(0);
    updateScore(0);
    setIsTetrisPaused(false);
  };

  const checkTetrisCollision = (piece, board, offsetX, offsetY) => {
    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (piece.shape[r][c]) {
          let newX = piece.x + c + offsetX;
          let newY = piece.y + r + offsetY;
          if (newX < 0 || newX >= TETRIS_COLS || newY >= TETRIS_ROWS + TETRIS_HIDDEN_ROWS) return true;
          if (newY >= 0 && board[newY][newX] !== null) return true;
        }
      }
    }
    return false;
  };

  const rotateTetrisPiece = (piece) => {
    const rotatedShape = piece.shape[0].map((_, index) => piece.shape.map(row => row[index]).reverse());
    const newPiece = { ...piece, shape: rotatedShape };
    
    let kicks = [0, 1, -1, 2, -2];
    for (let k of kicks) {
      if (!checkTetrisCollision(newPiece, tetrisGrid, k, 0)) {
        return { ...newPiece, x: newPiece.x + k };
      }
    }
    return piece;
  };

  const getTetrisGhostY = () => {
    if (!tetrisCurrent) return 0;
    let gy = tetrisCurrent.y;
    while (!checkTetrisCollision(tetrisCurrent, tetrisGrid, 0, (gy - tetrisCurrent.y) + 1)) {
      gy++;
    }
    return gy;
  };

  const lockTetrisPiece = () => {
    if (!tetrisCurrent) return;
    const newGrid = tetrisGrid.map(row => [...row]);
    let gameOver = false;

    for (let r = 0; r < tetrisCurrent.shape.length; r++) {
      for (let c = 0; c < tetrisCurrent.shape[r].length; c++) {
        if (tetrisCurrent.shape[r][c]) {
          let boardY = tetrisCurrent.y + r;
          let boardX = tetrisCurrent.x + c;
          if (boardY < TETRIS_HIDDEN_ROWS) {
            gameOver = true;
          } else {
            newGrid[boardY][boardX] = tetrisCurrent.color;
          }
        }
      }
    }

    if (gameOver) {
      handleFinishGame(scoreRef.current, false);
      return;
    }

    let linesCleared = 0;
    let filteredGrid = newGrid.filter((row, rIdx) => {
      const isFull = row.every(cell => cell !== null);
      if (isFull && rIdx >= TETRIS_HIDDEN_ROWS) linesCleared++;
      return !isFull || rIdx < TETRIS_HIDDEN_ROWS;
    });

    while (filteredGrid.length < TETRIS_ROWS + TETRIS_HIDDEN_ROWS) {
      filteredGrid.unshift(Array(TETRIS_COLS).fill(null));
    }

    let addedScore = 0;
    let newCombo = tetrisCombo;
    if (linesCleared > 0) {
      playSoundEffect('clear');
      const basePoints = [0, 100, 300, 500, 800][linesCleared] || 800;
      newCombo += 1;
      addedScore = basePoints * tetrisLevel * Math.max(1, newCombo);
    } else {
      newCombo = 0;
    }

    const newLines = tetrisLines + linesCleared;
    const newLevel = Math.floor(newLines / 10) + 1;
    if (newLevel > tetrisLevel) playSoundEffect('win');

    const nextQueue = [...tetrisQueue];
    const nextPiece = nextQueue.shift();
    nextQueue.push(getNextTetrisPiece());

    const placedNext = {
      ...nextPiece,
      x: Math.floor((TETRIS_COLS - nextPiece.shape[0].length) / 2),
      y: 0
    };

    if (checkTetrisCollision(placedNext, filteredGrid, 0, 0)) {
      setTetrisGrid(filteredGrid);
      updateScore(scoreRef.current + addedScore);
      handleFinishGame(scoreRef.current + addedScore, false);
      return;
    }

    setTetrisGrid(filteredGrid);
    setTetrisCurrent(placedNext);
    setTetrisQueue(nextQueue);
    setTetrisCanHold(true);
    setTetrisLines(newLines);
    setTetrisLevel(newLevel);
    setTetrisCombo(newCombo);
    updateScore(scoreRef.current + addedScore);
    playSoundEffect('lock');
  };

  const moveTetrisDown = () => {
    if (!tetrisCurrent || isTetrisPaused || gamePhase !== 'playing') return;
    if (!checkTetrisCollision(tetrisCurrent, tetrisGrid, 0, 1)) {
      setTetrisCurrent(prev => ({ ...prev, y: prev.y + 1 }));
    } else {
      lockTetrisPiece();
    }
  };

  const softDropTetris = () => {
    if (!tetrisCurrent || isTetrisPaused || gamePhase !== 'playing') return;
    if (!checkTetrisCollision(tetrisCurrent, tetrisGrid, 0, 1)) {
      setTetrisCurrent(prev => ({ ...prev, y: prev.y + 1 }));
      updateScore(scoreRef.current + 1);
    } else {
      lockTetrisPiece();
    }
  };

  const holdTetrisPiece = () => {
    if (!tetrisCanHold || !tetrisCurrent || isTetrisPaused || gamePhase !== 'playing') return;
    playSoundEffect('rotate');
    if (tetrisHold === null) {
      setTetrisHold({ type: tetrisCurrent.type, shape: TETRIS_SHAPES[tetrisCurrent.type].shape, color: TETRIS_SHAPES[tetrisCurrent.type].color });
      const nextQueue = [...tetrisQueue];
      const nextPiece = nextQueue.shift();
      nextQueue.push(getNextTetrisPiece());
      setTetrisQueue(nextQueue);
      setTetrisCurrent({
        ...nextPiece,
        x: Math.floor((TETRIS_COLS - nextPiece.shape[0].length) / 2),
        y: 0
      });
    } else {
      const temp = tetrisHold;
      setTetrisHold({ type: tetrisCurrent.type, shape: TETRIS_SHAPES[tetrisCurrent.type].shape, color: TETRIS_SHAPES[tetrisCurrent.type].color });
      setTetrisCurrent({
        type: temp.type,
        shape: temp.shape,
        color: temp.color,
        x: Math.floor((TETRIS_COLS - temp.shape[0].length) / 2),
        y: 0
      });
    }
    setTetrisCanHold(false);
  };

  const getTetrisSpeedMs = (lvl) => {
    if (lvl === 1) return 800;
    if (lvl === 2) return 720;
    if (lvl === 3) return 630;
    if (lvl === 4) return 550;
    if (lvl === 5) return 470;
    if (lvl === 6) return 380;
    if (lvl === 7) return 300;
    if (lvl === 8) return 220;
    if (lvl === 9) return 160;
    return Math.max(60, 160 - (lvl - 9) * 15);
  };

  useEffect(() => {
    if (activeGame !== 'tetris' || gamePhase !== 'playing' || isTetrisPaused) return;
    const interval = setInterval(() => {
      moveTetrisDown();
    }, getTetrisSpeedMs(tetrisLevel));
    gameIntervalRef.current = interval;
    return () => clearInterval(interval);
  }, [activeGame, gamePhase, tetrisCurrent, tetrisGrid, tetrisLevel, isTetrisPaused]);

  const initMemory = () => {
    const config = MEMORY_DIFFICULTIES[memSettings.diff];
    const themeAssets = MEMORY_THEMES[memSettings.theme];
    const shuffledAssets = [...themeAssets].sort(() => Math.random() - 0.5);
    const selected = shuffledAssets.slice(0, config.pairs);
    const deck = [...selected, ...selected]
      .sort(() => Math.random() - 0.5)
      .map((item, i) => ({ 
        id: i, content: item, flipped: false, matched: false, errorAnim: false, isHint: false
      }));
    setMemoryCards(deck);
    setMemoryFlipped([]);
    setMemoryMatched([]);
    setMemStats({ moves: 0, errors: 0, hints: 3, time: 0 });
    updateScore(0);
    setIsMemoryPaused(false);
    setIsWon(false);
    setGamePhase('playing');
  };

  const checkWinCondition = (matchedCount, totalCards, currentScore) => {
    if (matchedCount === totalCards) {
      setIsMemoryPaused(true);
      let stars = 1;
      const config = MEMORY_DIFFICULTIES[memSettings.diff];
      const maxMoves = config.pairs * 2.5;
      if (memStats.errors <= 2 && memStats.moves <= maxMoves) stars = 3;
      else if (memStats.errors <= 6) stars = 2;
      setMemoryStars(stars);
      const finalScore = currentScore + (stars * 500);
      updateScore(finalScore);
      handleFinishGame(finalScore, true); 
    }
  };

  const handleFlipCard = (idx) => {
    if (isMemoryPaused || memoryFlipped.length >= 2 || memoryCards[idx].flipped || memoryCards[idx].matched || memoryCards[idx].isHint) return;
    playSoundEffect('flip');
    const newCards = [...memoryCards];
    newCards[idx].flipped = true;
    setMemoryCards(newCards);
    const newFlipped = [...memoryFlipped, idx];
    setMemoryFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMemStats(s => ({ ...s, moves: s.moves + 1 }));
      const [idx1, idx2] = newFlipped;
      if (newCards[idx1].content === newCards[idx2].content) {
        const nextScore = scoreRef.current + 50 + Math.max(0, 100 - memStats.time);
        updateScore(nextScore);
        setTimeout(() => {
          playSoundEffect('match');
          setMemoryMatched(prev => {
            const newMatched = [...prev, idx1, idx2];
            checkWinCondition(newMatched.length, memoryCards.length, scoreRef.current);
            return newMatched;
          });
          setMemoryFlipped([]);
        }, 400);
      } else {
        updateScore(Math.max(0, scoreRef.current - 10));
        setTimeout(() => {
            const errorCards = [...memoryCards];
            errorCards[idx1].errorAnim = true;
            errorCards[idx2].errorAnim = true;
            setMemoryCards(errorCards);
        }, 300);
        setTimeout(() => {
          playSoundEffect('mismatch');
          const resetCards = [...memoryCards];
          resetCards[idx1].flipped = false;
          resetCards[idx2].flipped = false;
          resetCards[idx1].errorAnim = false;
          resetCards[idx2].errorAnim = false;
          setMemoryCards(resetCards);
          setMemoryFlipped([]);
          setMemStats(s => ({ ...s, errors: s.errors + 1 }));
        }, 700);
      }
    }
  };

  const useMemoryHint = () => {
    if (memStats.hints <= 0 || isMemoryPaused || memoryFlipped.length > 0) return;
    const unmatched = memoryCards.filter(c => !c.matched);
    if (unmatched.length === 0) return;
    const targetContent = unmatched[0].content;
    const pair = memoryCards.filter(c => c.content === targetContent);
    const newCards = [...memoryCards];
    newCards[pair[0].id].isHint = true;
    newCards[pair[1].id].isHint = true;
    setMemoryCards(newCards);
    setMemStats(s => ({ ...s, hints: s.hints - 1 }));
    updateScore(Math.max(0, scoreRef.current - 20));
    setTimeout(() => {
        const resetCards = [...memoryCards];
        resetCards[pair[0].id].isHint = false;
        resetCards[pair[1].id].isHint = false;
        setMemoryCards(resetCards);
    }, 2000);
  };
  
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ---------------- NINJA CUT -------------------------------------------
  const initNinja = () => {
    ninjaLivesRef.current = 3;
    setNinjaLives(3);
    const initialTime = ninjaMode === 'arcade' ? 60 : 0;
    setNinjaTimeLeft(initialTime);
    updateScore(0);
    ninjaObjectsRef.current = [];
    ninjaParticlesRef.current = [];
    sliceTrailRef.current = [];
    setNinjaPausedState(false);
    ninjaStatsRef.current = { fruitsCut: 0, gameTime: 0, lastHeartCutCount: 0 };

    if (ninjaGameLoopRef.current) cancelAnimationFrame(ninjaGameLoopRef.current);
    if (ninjaTimerRef.current) clearInterval(ninjaTimerRef.current);

    ninjaTimerRef.current = setInterval(() => {
      if (!isNinjaPausedRef.current) {
        ninjaStatsRef.current.gameTime += 1;
        if (ninjaMode === 'arcade') {
          setNinjaTimeLeft(prev => {
            if (prev <= 1) {
              clearInterval(ninjaTimerRef.current);
              handleFinishGame(scoreRef.current, true);
              return 0;
            }
            return prev - 1;
          });
        }
      }
    }, 1000);
    
    let lastSpawnTime = 0;

    const gameLoop = (timestamp) => {
      if (isNinjaPausedRef.current) {
        lastSpawnTime = timestamp;
        ninjaGameLoopRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) {
        ninjaGameLoopRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      if (canvas.width !== 840 || canvas.height !== 520) {
        canvas.width = 840;
        canvas.height = 520;
      }

      const width = canvas.width;
      const height = canvas.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, width, height);
      drawNinjaBackground(ctx, width, height);

      const gTime = ninjaStatsRef.current.gameTime;
      const stage = getNinjaStageConfig(gTime);
      const spawnInterval = stage.interval * 1000;

      if (timestamp - lastSpawnTime > spawnInterval) {
        lastSpawnTime = timestamp;
        spawnNinjaWave(width, height, stage);
      }

      const cutTotal = ninjaStatsRef.current.fruitsCut;
      if (cutTotal > 0 && cutTotal % 50 === 0 && cutTotal !== ninjaStatsRef.current.lastHeartCutCount) {
        ninjaStatsRef.current.lastHeartCutCount = cutTotal;
        ninjaObjectsRef.current.push({
          type: 'heart',
          emoji: '❤️',
          x: width * 0.15 + Math.random() * (width * 0.7),
          y: height + 60,
          vx: Math.random() * 150 - 75,
          vy: -(Math.random() * 150 + 720),
          rotation: 0,
          vRot: Math.random() * 60 - 30,
          isHalf: false
        });
      }

      const dt = 1 / 60;
      const gravity = 950;

      let currentObjects = [...ninjaObjectsRef.current];

      for (let i = currentObjects.length - 1; i >= 0; i--) {
        let obj = currentObjects[i];

        if (!obj.isHalf) {
          obj.x += obj.vx * dt;
          obj.y += obj.vy * dt;
          obj.vy += gravity * dt; 
          obj.rotation += obj.vRot * dt;
        } else {
          obj.x += obj.vx * dt;
          obj.y += obj.vy * dt;
          obj.vy += gravity * 1.3 * dt;
          obj.rotation += obj.vRot * dt;
          obj.alpha -= 0.02;
        }

        ctx.save();
        ctx.translate(obj.x, obj.y);
        ctx.rotate(obj.rotation);
        ctx.globalAlpha = obj.alpha !== undefined ? obj.alpha : 1;

        if (obj.type === 'bomb') {
          ctx.beginPath();
          ctx.arc(0, 0, 32, 0, Math.PI * 2);
          ctx.fillStyle = '#18181b';
          ctx.fill();
          ctx.lineWidth = 4;
          ctx.strokeStyle = '#ef4444';
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(0, -32);
          ctx.lineTo(12, -45);
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.font = '28px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('💣', 0, 0);
        } else if (obj.type === 'heart') {
          ctx.font = '48px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('❤️', 0, 0);
        } else {
          ctx.shadowColor = 'rgba(0,0,0,0.6)';
          ctx.shadowBlur = 12;
          ctx.font = '56px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(obj.emoji, 0, 0);
        }
        ctx.restore();

        if (!obj.countedMiss && !obj.isHalf && obj.type === 'fruit' && ninjaMode !== 'zen' && obj.y > height && obj.vy > 0) {
          obj.countedMiss = true;
          ninjaLivesRef.current = Math.max(0, ninjaLivesRef.current - 1);
          setNinjaLives(ninjaLivesRef.current);
          if (ninjaLivesRef.current <= 0) {
            handleFinishGame(scoreRef.current, false);
            return;
          }
        }

        if (obj.y > height + 120) {
          currentObjects.splice(i, 1);
        }
      }
      ninjaObjectsRef.current = currentObjects;

      let currentParticles = [...ninjaParticlesRef.current];
      for (let p = currentParticles.length - 1; p >= 0; p--) {
        let pt = currentParticles[p];
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.vy += gravity * dt;
        pt.alpha -= 0.03;

        ctx.save();
        ctx.globalAlpha = Math.max(0, pt.alpha);
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (pt.alpha <= 0) currentParticles.splice(p, 1);
      }
      ninjaParticlesRef.current = currentParticles;

      let trail = sliceTrailRef.current;
      if (trail.length > 1) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(trail[0].x, trail[0].y);
        for (let t = 1; t < trail.length; t++) {
          ctx.lineTo(trail[t].x, trail[t].y);
        }

        if (ninjaKatana === 'Láser') {
          ctx.lineWidth = 8;
          ctx.strokeStyle = '#06b6d4';
          ctx.shadowColor = '#22d3ee';
          ctx.shadowBlur = 25;
        } else if (ninjaKatana === 'Fuego') {
          ctx.lineWidth = 12;
          ctx.strokeStyle = '#f97316';
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 30;
        } else if (ninjaKatana === 'Rayos') {
          ctx.lineWidth = 7;
          ctx.strokeStyle = '#facc15';
          ctx.shadowColor = '#fde047';
          ctx.shadowBlur = 25;
        } else {
          ctx.lineWidth = 6;
          ctx.strokeStyle = '#f43f5e';
          ctx.shadowColor = '#fb7185';
          ctx.shadowBlur = 18;
        }
        ctx.stroke();
        ctx.restore();

        if (!isMouseDownRef.current && trail.length > 0) {
          trail.shift();
        }
      }

      ninjaGameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    ninjaGameLoopRef.current = requestAnimationFrame(gameLoop);
  };

  const getNinjaStageConfig = (gTime) => {
    if (gTime < 30) return { minFruits: 1, maxFruits: 1, interval: 2.2, speed: 780, bombChance: 0 };
    if (gTime < 60) return { minFruits: 1, maxFruits: 2, interval: 1.8, speed: 820, bombChance: 3 };
    if (gTime < 120) return { minFruits: 1, maxFruits: 2, interval: 1.4, speed: 870, bombChance: 6 };
    if (gTime < 180) return { minFruits: 2, maxFruits: 3, interval: 1.2, speed: 920, bombChance: 8 };
    if (gTime < 300) return { minFruits: 2, maxFruits: 3, interval: 1.0, speed: 970, bombChance: 10 };
    return { minFruits: 2, maxFruits: 4, interval: 0.9, speed: 1020, bombChance: 12 };
  };

  const drawNinjaBackground = (ctx, width, height) => {
    let grad = ctx.createLinearGradient(0, 0, width, height);
    if (ninjaTheme === 'Bosque') {
      grad.addColorStop(0, '#022c22'); grad.addColorStop(0.5, '#064e3b'); grad.addColorStop(1, '#022c22');
    } else if (ninjaTheme === 'Atardecer') {
      grad.addColorStop(0, '#431407'); grad.addColorStop(0.5, '#7c2d12'); grad.addColorStop(1, '#9a3412');
    } else if (ninjaTheme === 'Noche') {
      grad.addColorStop(0, '#09090b'); grad.addColorStop(0.5, '#1e1b4b'); grad.addColorStop(1, '#312e81');
    } else {
      grad.addColorStop(0, '#3f1a0d'); grad.addColorStop(0.5, '#2a1208'); grad.addColorStop(1, '#180a04');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  };

  const spawnNinjaWave = (width, height, stage) => {
    const fruitCount = Math.floor(Math.random() * (stage.maxFruits - stage.minFruits + 1)) + stage.minFruits;

    for (let f = 0; f < fruitCount; f++) {
      const isBomb = ninjaMode !== 'zen' && Math.random() * 100 < stage.bombChance;
      const minX = width * 0.15;
      const maxX = width * 0.85;
      const startX = minX + Math.random() * (maxX - minX);
      const startY = height + 60; 
      const vx = Math.random() * 160 - 80; 
      const vy = -(Math.random() * 100 + stage.speed);
      const rotationDegPerSec = Math.random() * 150 - 75;
      const vRot = (rotationDegPerSec * Math.PI) / 180;

      if (isBomb) {
        ninjaObjectsRef.current.push({ type: 'bomb', x: startX, y: startY, vx, vy, rotation: Math.random() * Math.PI, vRot, isHalf: false });
      } else {
        const fruitTemplate = FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)];
        ninjaObjectsRef.current.push({ type: 'fruit', emoji: fruitTemplate.emoji, color: fruitTemplate.color, points: fruitTemplate.points, x: startX, y: startY, vx, vy, rotation: Math.random() * Math.PI, vRot, isHalf: false });
      }
    }
  };

  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const handleNinjaPointerDown = (e) => {
    if (isNinjaPausedRef.current) return;
    isMouseDownRef.current = true;
    const { x, y } = getCanvasCoordinates(e);
    lastMousePosRef.current = { x, y };
    sliceTrailRef.current = [{ x, y }];
  };

  const handleNinjaPointerMove = (e) => {
    if (!isMouseDownRef.current || isNinjaPausedRef.current) return;
    const { x: currentX, y: currentY } = getCanvasCoordinates(e);
    sliceTrailRef.current.push({ x: currentX, y: currentY });
    if (sliceTrailRef.current.length > 14) sliceTrailRef.current.shift();
    checkNinjaSlices(currentX, currentY);
  };

  const handleNinjaPointerUp = () => { isMouseDownRef.current = false; };

  const checkNinjaSlices = (x, y) => {
    let objects = ninjaObjectsRef.current;
    let cutCount = 0;

    for (let i = objects.length - 1; i >= 0; i--) {
      let obj = objects[i];
      if (obj.isHalf) continue;

      const dist = Math.hypot(obj.x - x, obj.y - y);
      if (dist < 55) {
        if (obj.type === 'bomb') {
          playSoundEffect('explosion');
          setScreenRed(true);
          setTimeout(() => setScreenRed(false), 500);
          objects.splice(i, 1);
          ninjaLivesRef.current = Math.max(0, ninjaLivesRef.current - 1);
          setNinjaLives(ninjaLivesRef.current);
          if (ninjaLivesRef.current <= 0) {
            handleFinishGame(scoreRef.current, false);
            return;
          }
        } else if (obj.type === 'heart') {
          playSoundEffect('heart');
          objects.splice(i, 1);
          ninjaLivesRef.current = Math.min(3, ninjaLivesRef.current + 1);
          setNinjaLives(ninjaLivesRef.current);
        } else {
          playSoundEffect('cut');
          cutCount++;
          ninjaStatsRef.current.fruitsCut++;
          for (let p = 0; p < 15; p++) {
            ninjaParticlesRef.current.push({ x: obj.x, y: obj.y, vx: Math.random() * 250 - 125, vy: Math.random() * 250 - 125, radius: Math.random() * 6 + 3, color: obj.color, alpha: 1 });
          }
          objects.splice(i, 1);
          objects.push({ ...obj, isHalf: true, vx: -140 - Math.random() * 80, vy: -120 - Math.random() * 60, vRot: -8, alpha: 1 });
          objects.push({ ...obj, isHalf: true, vx: 140 + Math.random() * 80, vy: -120 - Math.random() * 60, vRot: 8, alpha: 1 });
        }
      }
    }

    if (cutCount > 0) {
      const addedPoints = cutCount * 10 * (cutCount > 1 ? cutCount * 1.5 : 1);
      const nextScore = scoreRef.current + addedPoints;
      updateScore(nextScore);
      if (cutCount >= 2) {
        playSoundEffect('combo');
        setComboPopup(`COMBO x${cutCount}!`);
        setTimeout(() => setComboPopup(null), 1000);
      }
    }
  };

  // ---------------- CLICKER CHALLENGE -------------------------------------------
  const toggleClickerMusic = () => {
    const nextState = !clickerSettings.music;
    setClickerSettings(prev => ({ ...prev, music: nextState }));
    if (nextState) {
      try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sine'; osc.frequency.value = 150;
        gain.gain.value = 0.05;
        osc.start(); activeMusicRef.current = { osc, gain };
      } catch (e) {}
    } else {
      if (activeMusicRef.current) {
        activeMusicRef.current.osc.stop(); activeMusicRef.current = null;
      }
    }
  };

  const spawnClickEffect = (x, y) => {
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 2;
      clickerParticlesRef.current.push({
        x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life: 1, color: clickerSettings.theme === 'neon' ? '#0ff' : '#fcd34d', size: Math.random() * 4 + 2
      });
    }
  };

  const spawnConfetti = () => {
    const canvas = clickerCanvasRef.current;
    if (!canvas) return;
    const w = canvas.width; const h = canvas.height;
    for (let i = 0; i < 150; i++) {
      clickerConfettiRef.current.push({
        x: Math.random() < 0.5 ? 0 : w, y: h - Math.random() * 100,
        vx: (Math.random() * 10 + 5) * (Math.random() < 0.5 ? 1 : -1),
        vy: -(Math.random() * 15 + 10), color: `hsl(${Math.random() * 360}, 100%, 50%)`,
        size: Math.random() * 8 + 4, angle: Math.random() * 360, rot: (Math.random() - 0.5) * 10
      });
    }
  };

  const drawClickerCanvas = useCallback(() => {
    const canvas = clickerCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = clickerParticlesRef.current.length - 1; i >= 0; i--) {
      let p = clickerParticlesRef.current[i];
      p.x += p.vx; p.y += p.vy; p.life -= 0.03;
      p.vx *= 0.95; p.vy *= 0.95;
      if (p.life <= 0) { clickerParticlesRef.current.splice(i, 1); continue; }
      ctx.globalAlpha = p.life; ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    }
    
    for (let i = clickerConfettiRef.current.length - 1; i >= 0; i--) {
      let c = clickerConfettiRef.current[i];
      c.x += c.vx; c.y += c.vy; c.vy += 0.4; c.angle += c.rot;
      if (c.y > canvas.height) { clickerConfettiRef.current.splice(i, 1); continue; }
      ctx.globalAlpha = 1; ctx.fillStyle = c.color;
      ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.angle * Math.PI / 180);
      ctx.fillRect(-c.size/2, -c.size/2, c.size, c.size); ctx.restore();
    }
    ctx.globalAlpha = 1;
  }, [clickerSettings.theme]);

  const startClickerCountdown = () => {
    clickerParticlesRef.current = [];
    clickerConfettiRef.current = [];
    setGamePhase('clicker-countdown');
    setClickerCountdown(3);
    playSoundEffect('beep');
    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setClickerCountdown(count);
        playSoundEffect('beep');
      } else {
        clearInterval(interval);
        initClicker();
      }
    }, 1000);
  };

  const initClicker = () => {
    playSoundEffect('go');
    clickerClicksRef.current = 0;
    clickerMaxCpsRef.current = 0;
    clickerCpsHistoryRef.current = [];
    clickTimestampsRef.current = [];
    clickerParticlesRef.current = [];
    clickerConfettiRef.current = [];
    clickerStartTimeRef.current = performance.now();
    
    setGamePhase('playing');
    setClickerButtonText('¡CLICK!');
    isClickerPlayingRef.current = true;
    
    if (timerTextRef.current) {
      timerTextRef.current.classList.remove('text-red-500', 'animate-pulse', 'scale-110');
      timerTextRef.current.classList.add('text-current');
    }
    if (clicksTextRef.current) clicksTextRef.current.innerText = '0';
    
    if (clickerGameLoopRef.current) cancelAnimationFrame(clickerGameLoopRef.current);
    clickerGameLoopRef.current = requestAnimationFrame(clickerLoop);
  };

  const checkAchievements = (clicks, maxCps) => {
    const newAchieved = [];
    ACHIEVEMENTS.forEach(ach => {
      if (!clickerStats.achievements.includes(ach.id)) {
        if (ach.target && clicks >= ach.target) newAchieved.push(ach.id);
        if (ach.targetCps && maxCps >= ach.targetCps) newAchieved.push(ach.id);
      }
    });
    return newAchieved;
  };

  const endClickerGame = () => {
    isClickerPlayingRef.current = false;
    clickerParticlesRef.current = []; 
    playSoundEffect('over');
    const finalClicks = clickerClicksRef.current;
    const finalMaxCps = clickerMaxCpsRef.current;
    
    // CORRECCIÓN: Actualizar el récord global del juego ('clicker') para que se refleje en el Top Global y el Récord del Mes
    const currentHighScore = highScores['clicker'] || 0;
    if (finalClicks > currentHighScore) {
      setHighScores(prev => ({ ...prev, 'clicker': finalClicks }));
    }

    const isNewRecord = finalClicks > clickerStats.highScore;
    updateScore(finalClicks);
    
    if (isNewRecord) setTimeout(() => { playSoundEffect('record'); spawnConfetti(); }, 500);

    const avg = finalClicks / 60;
    const newAchievements = checkAchievements(finalClicks, finalMaxCps);

    const newStats = {
      played: clickerStats.played + 1,
      highScore: Math.max(clickerStats.highScore, finalClicks),
      totalClicks: clickerStats.totalClicks + finalClicks,
      timePlayed: clickerStats.timePlayed + 60,
      bestCps: Math.max(clickerStats.bestCps, finalMaxCps),
      avgCps: ((clickerStats.avgCps * clickerStats.played) + avg) / (clickerStats.played + 1),
      lastScore: finalClicks,
      date: isNewRecord ? new Date().toISOString() : clickerStats.date,
      achievements: [...clickerStats.achievements, ...newAchievements]
    };
    setClickerStats(newStats);

    const newLeaderboard = [...clickerLeaderboard, {
      clicks: finalClicks, cps: Number(avg.toFixed(2)), date: new Date().toLocaleDateString(), time: new Date().toLocaleTimeString()
    }].sort((a, b) => b.clicks - a.clicks).slice(0, 10);
    setClickerLeaderboard(newLeaderboard);

    setGamePhase('clicker-result');
  };

  const clickerLoop = useCallback((timestamp) => {
    if (!isClickerPlayingRef.current) return;
    
    if (clickerSettings.showFps && fpsRef.current) {
      const delta = timestamp - lastFrameTimeRef.current;
      fpsRef.current.innerText = `${Math.round(1000 / delta)} FPS`;
    }
    lastFrameTimeRef.current = timestamp;

    drawClickerCanvas();

    const now = performance.now();
    const elapsed = (now - clickerStartTimeRef.current) / 1000;
    const remaining = Math.max(0, 60 - elapsed);
    
    if (timerTextRef.current) {
      const secs = Math.ceil(remaining);
      const formatSecs = secs.toString().padStart(2, '0');
      timerTextRef.current.innerText = `00:${formatSecs}`;
      
      if (secs <= 10 && secs > 0 && remaining % 1 < 0.05) {
          if (!timerTextRef.current.dataset.lastTick || now - timerTextRef.current.dataset.lastTick > 900) {
              playSoundEffect('tick');
              timerTextRef.current.dataset.lastTick = now;
          }
      }
      if (secs <= 10) {
          timerTextRef.current.classList.add('text-red-500', 'animate-pulse', 'scale-110');
          timerTextRef.current.classList.remove('text-current');
      }
    }

    const currentTimestamps = clickTimestampsRef.current;
    while (currentTimestamps.length > 0 && now - currentTimestamps[0] > 1000) { currentTimestamps.shift(); }
    const cps = currentTimestamps.length;
    if (cps > clickerMaxCpsRef.current) clickerMaxCpsRef.current = cps;
    
    if (cpsTextRef.current) cpsTextRef.current.innerText = cps;
    if (cpsBarRef.current) {
      const percentage = Math.min(100, (cps / 15) * 100);
      cpsBarRef.current.style.width = `${percentage}%`;
      if (cps > 12) cpsBarRef.current.style.backgroundColor = '#ef4444';
      else if (cps > 7) cpsBarRef.current.style.backgroundColor = '#f59e0b';
      else cpsBarRef.current.style.backgroundColor = '#3b82f6';
    }

    if (remaining <= 0) { 
      endClickerGame(); 
      return; 
    }
    clickerGameLoopRef.current = requestAnimationFrame(clickerLoop);
  }, [drawClickerCanvas, clickerSettings.showFps, highScores]);

  useEffect(() => {
    let interval;
    if (activeGame === 'clicker' && gamePhase === 'playing') {
      interval = setInterval(() => { clickerCpsHistoryRef.current.push(clickTimestampsRef.current.length); }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeGame, gamePhase]);

  const handleMainClickerAction = (e) => {
    if (activeGame !== 'clicker' || !isClickerPlayingRef.current) return;
    
    if (e) {
      if (!e.isTrusted && e.type !== 'keydown') return; 
      if (e.type === 'keydown' && e.code !== 'Space' && e.code !== 'Enter') return;
      if (e.type === 'keydown') e.preventDefault();
    }

    clickerClicksRef.current += 1;
    clickTimestampsRef.current.push(performance.now());
    
    if (clicksTextRef.current) clicksTextRef.current.innerText = clickerClicksRef.current;

    playSoundEffect('click');
    if (clickerSettings.vibration && navigator.vibrate) navigator.vibrate(15);

    if (e && (e.type === 'pointerdown' || e.type === 'mousedown' || e.type === 'touchstart')) {
      const canvas = clickerCanvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (clientX - rect.left) * scaleX;
        const y = (clientY - rect.top) * scaleY;
        spawnClickEffect(x, y);
      }
    } else {
       const canvas = clickerCanvasRef.current;
       if (canvas) spawnClickEffect(canvas.width / 2, canvas.height / 2);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gamePhase !== 'playing') return;

      if (activeGame === '2048' && !is2048Paused) {
        if (['ArrowUp', 'KeyW'].includes(e.code)) { move2048('up'); }
        if (['ArrowDown', 'KeyS'].includes(e.code)) { move2048('down'); }
        if (['ArrowLeft', 'KeyA'].includes(e.code)) { move2048('left'); }
        if (['ArrowRight', 'KeyD'].includes(e.code)) { move2048('right'); }
      } 
      else if (activeGame === 'tetris' && !isTetrisPaused && tetrisCurrent) {
        if (['ArrowLeft', 'KeyA'].includes(e.code)) {
          if (!checkTetrisCollision(tetrisCurrent, tetrisGrid, -1, 0)) {
            playSoundEffect('move');
            setTetrisCurrent(prev => ({ ...prev, x: prev.x - 1 }));
          }
        } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
          if (!checkTetrisCollision(tetrisCurrent, tetrisGrid, 1, 0)) {
            playSoundEffect('move');
            setTetrisCurrent(prev => ({ ...prev, x: prev.x + 1 }));
          }
        } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
          moveTetrisDown();
        } else if (['ArrowUp', 'KeyW'].includes(e.code) || e.code === 'KeyX') {
          playSoundEffect('rotate');
          setTetrisCurrent(prev => rotateTetrisPiece(prev));
        } else if (e.code === 'Space') {
          softDropTetris();
        } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyC') {
          holdTetrisPiece();
        }
      }
      else if (activeGame === 'clicker') {
        if (['Space', 'Enter'].includes(e.code)) { 
          handleMainClickerAction(e); 
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeGame, gamePhase, move2048, is2048Paused, isTetrisPaused, tetrisCurrent, tetrisGrid, tetrisCanHold, tetrisHold]);

  const handleTouchStart = (e) => {
    if (e.touches && e.touches.length > 0) {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchEnd = (e) => {
    if (!touchStartRef.current.x || !touchStartRef.current.y || e.changedTouches.length === 0) return;
    const diffX = e.changedTouches[0].clientX - touchStartRef.current.x;
    const diffY = e.changedTouches[0].clientY - touchStartRef.current.y;
    const minSwipeDistance = 50;

    if (activeGame === '2048' && !is2048Paused) {
      if (Math.abs(diffX) > Math.abs(diffY)) {
        if (Math.abs(diffX) > minSwipeDistance) {
          if (diffX > 0) move2048('right'); else move2048('left');
        }
      } else {
        if (Math.abs(diffY) > minSwipeDistance) {
          if (diffY > 0) move2048('down'); else move2048('up');
        }
      }
    } else if (activeGame === 'tetris' && !isTetrisPaused && tetrisCurrent) {
      if (Math.abs(diffX) > Math.abs(diffY)) {
        if (Math.abs(diffX) > minSwipeDistance) {
          if (diffX > 0 && !checkTetrisCollision(tetrisCurrent, tetrisGrid, 1, 0)) {
            playSoundEffect('move');
            setTetrisCurrent(prev => ({ ...prev, x: prev.x + 1 }));
          } else if (diffX < 0 && !checkTetrisCollision(tetrisCurrent, tetrisGrid, -1, 0)) {
            playSoundEffect('move');
            setTetrisCurrent(prev => ({ ...prev, x: prev.x - 1 }));
          }
        }
      } else {
        if (Math.abs(diffY) > minSwipeDistance) {
          if (diffY > 0) {
            softDropTetris();
          } else {
            playSoundEffect('rotate');
            setTetrisCurrent(prev => rotateTetrisPiece(prev));
          }
        }
      }
    }
    touchStartRef.current = { x: 0, y: 0 };
  };

  const getClickerThemeClasses = () => {
    switch (clickerSettings.theme) {
      case 'light': return 'bg-gray-100 text-gray-900 border-gray-300';
      case 'neon': return 'bg-neutral-950 text-cyan-400 border-cyan-800 shadow-[0_0_20px_rgba(34,211,238,0.2)]';
      default: return 'bg-neutral-900 text-gray-100 border-neutral-700 shadow-xl';
    }
  };

  const getClickerButtonColorClasses = () => {
    switch(clickerSettings.buttonColor) {
      case 'red': return 'from-red-500 to-red-700 shadow-red-500/50';
      case 'purple': return 'from-purple-500 to-purple-700 shadow-purple-500/50';
      case 'gold': return 'from-yellow-400 to-amber-600 shadow-yellow-500/50 text-black';
      default: return 'from-blue-500 to-blue-700 shadow-blue-500/50';
    }
  };

  const getClickerMedal = (score) => {
    return MEDALS.find(m => score >= m.threshold) || MEDALS[MEDALS.length - 1];
  };

  const renderClickerChart = () => {
    const data = clickerCpsHistoryRef.current;
    if (data.length === 0) return null;
    const maxVal = Math.max(...data, 10);
    return (
      <div className="w-full h-20 md:h-24 flex items-end justify-between gap-0.5 mt-2 p-2 bg-black/20 rounded-lg">
        {data.map((val, i) => (
          <div 
            key={i} 
            className="w-full bg-blue-500 rounded-t-sm transition-all"
            style={{ height: `${(val / maxVal) * 100}%`, opacity: 0.7 + (val/maxVal)*0.3 }}
            title={`Seg ${i+1}: ${val} CPS`}
          />
        ))}
      </div>
    );
  };

  const renderUnifiedPauseOverlay = (onResume, onQuit) => (
    <div className="absolute inset-0 bg-neutral-950/90 z-50 flex flex-col items-center justify-center p-6 text-center text-white backdrop-blur-md animate-in fade-in duration-200">
      <h2 className="text-3xl font-black text-yellow-400 mb-2 uppercase tracking-widest">JUEGO PAUSADO</h2>
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 my-4 max-w-sm w-full space-y-1 shadow-lg">
        <p className="text-sm font-black text-white">Juego desarrollado por Omar Navarro</p>
        <p className="text-xs text-neutral-400">para CazaOfertasML</p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button onClick={onResume} className="px-6 py-3 bg-yellow-400 text-black font-black rounded-xl text-xs uppercase shadow-lg hover:scale-105 transition-all">Reanudar Partida ▶️</button>
        <button onClick={() => setIsEffectsMuted(!isEffectsMuted)} className="px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold rounded-xl text-xs flex items-center justify-center gap-2 border border-neutral-700">
          {isEffectsMuted ? <VolumeX size={14} /> : <Volume2 size={14} />} Sonido: {isEffectsMuted ? 'Silenciado' : 'Activado'}
        </button>
        <button onClick={onQuit} className="px-6 py-2.5 bg-red-900/40 hover:bg-red-900/70 text-red-300 font-bold rounded-xl text-xs border border-red-500/30 transition-all">Menú Principal</button>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 mb-16 relative z-10">
      
      {/* BANNER SUPERIOR TORNEO MENSUAL */}
      <div className="mb-8 bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 border-2 border-yellow-400/40 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 text-center md:text-left">
          <div className="w-14 h-14 bg-yellow-400 text-black rounded-2xl flex items-center justify-center shrink-0 shadow-lg font-black text-2xl">
            🏆
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-tight">
              🎁 TORNEO MENSUAL ACTIVO
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Acumula la mejor puntuaciòn, escala puestos, llega al primer puesto y gana tarjetas de regalo cada mes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-black/60 px-6 py-3 rounded-2xl border border-yellow-400/30">
          <Clock className="w-5 h-5 text-yellow-400 animate-pulse" />
          <div className="text-left">
            <span className="text-[10px] uppercase tracking-widest text-neutral-400 block font-bold">Tiempo restante de mes</span>
            <span className="text-sm font-black text-yellow-400">{timeLeftMonth}</span>
          </div>
        </div>
      </div>

      <div className={`rounded-3xl shadow-xl p-6 md:p-8 backdrop-blur-xl border ${isLight ? 'bg-white border-purple-200' : 'bg-neutral-900/85 border-neutral-800'}`}>
        <h2 className={`text-3xl font-bold text-center mb-6 flex items-center justify-center gap-2 ${isLight ? 'text-purple-700' : 'text-neutral-100 font-black'}`}>
          <Gamepad2 className="w-8 h-8 text-yellow-400" /> ZONA DE RECREACIÓN CAZAOFERTAS
        </h2>

        <div className="flex justify-center gap-2.5 mb-6 flex-wrap">
          <button onClick={() => handleSelectGame('2048')} className={`px-4 py-2 rounded-full font-bold text-xs transition-all border ${activeGame === '2048' ? 'bg-yellow-400 text-black border-yellow-400 shadow-lg scale-105' : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'}`}>🔢 2048 Classic</button>
          <button onClick={() => handleSelectGame('tetris')} className={`px-4 py-2 rounded-full font-bold text-xs transition-all border ${activeGame === 'tetris' ? 'bg-yellow-400 text-black border-yellow-400 shadow-lg scale-105' : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'}`}>🧱 Cyber Tetris</button>
          <button onClick={() => handleSelectGame('memory')} className={`px-4 py-2 rounded-full font-bold text-xs transition-all border ${activeGame === 'memory' ? 'bg-yellow-400 text-black border-yellow-400 shadow-lg scale-105' : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'}`}>🎴 Memoria Pro</button>
          <button onClick={() => handleSelectGame('ninja')} className={`px-4 py-2 rounded-full font-bold text-xs transition-all border ${activeGame === 'ninja' ? 'bg-yellow-400 text-black border-yellow-400 shadow-lg scale-105' : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'}`}>⚔️ Ninja Cut</button>
          <button onClick={() => handleSelectGame('clicker')} className={`px-4 py-2 rounded-full font-bold text-xs transition-all border ${activeGame === 'clicker' ? 'bg-yellow-400 text-black border-yellow-400 shadow-lg scale-105' : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'}`}>⚡ Click Challenge</button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
          
          {/* PROGRESO GLOBAL */}
          <div className="w-full lg:w-64 shrink-0 bg-gradient-to-b from-red-600 to-red-900 rounded-2xl p-5 text-white shadow-lg border border-red-500 relative overflow-hidden">
            <h3 className="text-center font-black text-sm uppercase tracking-wider mb-3 flex items-center justify-center gap-2">
              <User className="w-4 h-4" /> PROGRESO GLOBAL
            </h3>
            <div className="bg-black/40 rounded-xl p-3 text-center space-y-2">
              <p className="text-xs font-bold text-red-200 truncate">@{currentUser || 'Xrtone26'}</p>
              <div className="flex justify-around items-center pt-1 border-t border-red-500/30">
                <div>
                  <span className="text-[10px] uppercase text-red-300 block">NIVEL</span>
                  <span className="text-lg font-black text-yellow-300">{playerLevel}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-red-300 block">MONEDAS</span>
                  <span className="text-lg font-black text-yellow-300">💰 {playerCoins}</span>
                </div>
              </div>
              <div className="w-full bg-black/50 h-2 rounded-full overflow-hidden mt-1">
                <div className="bg-yellow-400 h-full transition-all duration-300" style={{ width: `${Math.min(100, (playerXP / nextXpTarget) * 100)}%` }} />
              </div>
              <span className="text-[10px] text-red-200 block">XP: {playerXP} / {nextXpTarget} (Difícil)</span>
              <div className="pt-2 text-[11px] text-yellow-300 font-bold border-t border-red-500/30">
                🏆 Récord Mes: {highScores[activeGame] || 0} pts
              </div>
            </div>
          </div>

          {/* CONTENEDOR CENTRAL DEL JUEGO */}
          <div className="flex flex-col gap-3">
            {gamePhase === 'playing' && activeGame !== 'memory' && activeGame !== 'ninja' && activeGame !== 'clicker' && activeGame !== 'tetris' && (
              <div className="w-[840px] max-w-full flex justify-between items-center bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-xl shadow-md text-white text-xs font-bold">
                <div>Puntos: <span className="text-yellow-400 text-sm font-black">{score}</span></div>
                <div>Récord: <span className="text-yellow-400 text-sm font-black">{highScores[activeGame] || 0}</span></div>
                <div className="flex gap-2">
                  <button onClick={() => {
                    if (activeGame === '2048') setIs2048Paused(true);
                  }} className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 rounded-lg flex items-center gap-1 text-xs text-yellow-400">
                    <Pause size={14} /> Pausa
                  </button>
                  <button onClick={() => setIsEffectsMuted(!isEffectsMuted)} className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 rounded-lg flex items-center gap-1 text-xs">
                    {isEffectsMuted ? <VolumeX size={14} /> : <Volume2 size={14} />} Efectos
                  </button>
                </div>
              </div>
            )}

            <div 
              ref={gameContainerRef} 
              className={`relative w-[840px] max-w-full h-[520px] bg-neutral-950 rounded-2xl border flex items-center justify-center shadow-2xl overflow-hidden ${
                activeGame === 'clicker' ? getClickerThemeClasses() : 'border-neutral-800'
              } ${
                isFullscreen ? 'h-screen w-screen rounded-none border-none max-w-none' : ''
              } ${screenRed ? 'ring-4 ring-red-600 animate-pulse' : ''}`}
            >
              {/* BOTÓN DE PANTALLA COMPLETA */}
              <button
                onClick={toggleFullscreen}
                className={`absolute top-3 right-3 z-50 p-2 rounded-xl backdrop-blur-sm border shadow-lg transition-all ${activeGame === 'clicker' ? 'bg-black/10 hover:bg-black/20 border-transparent' : 'bg-neutral-800/80 hover:bg-neutral-700 text-yellow-400 border-neutral-700'}`}
                title="Pantalla Completa"
              >
                {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
              </button>

              {/* CANVAS DE CLICKER */}
              {activeGame === 'clicker' && (
                <canvas ref={clickerCanvasRef} className="pointer-events-none absolute inset-0 z-40 w-full h-full" />
              )}
              {activeGame === 'clicker' && clickerSettings.showFps && gamePhase === 'playing' && (
                <div ref={fpsRef} className="absolute top-3 left-3 text-[10px] font-mono text-green-500 z-50 bg-black/50 px-2 py-1 rounded">0 FPS</div>
              )}
              
              {gamePhase === 'menu' && (
                <div className="absolute inset-0 bg-neutral-900/95 flex flex-col items-center justify-center z-30 p-6 text-center rounded-2xl">
                  <Gamepad2 className="w-16 h-16 text-yellow-400 mb-4 animate-bounce" />
                  <h3 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">
                    {activeGame === '2048' && '2048 Classic'}
                    {activeGame === 'tetris' && 'Cyber Tetris Pro'}
                    {activeGame === 'memory' && 'Memoria Pro'}
                    {activeGame === 'ninja' && 'Ninja Cut HD'}
                    {activeGame === 'clicker' && 'Click Challenge'}
                  </h3>
                  <p className="text-sm text-neutral-400 max-w-md mb-6">Compite en el Top Global mensual. ¡El mejor por mes en cada juego Gana tarjetas de regalo!</p>
                  <button onClick={startGameFlow} className="flex items-center gap-2 px-8 py-3.5 bg-yellow-400 text-black font-black rounded-full shadow-lg hover:scale-105 transition-all uppercase text-sm">
                    <Play className="w-5 h-5 fill-current" /> Jugar Ahora
                  </button>
                </div>
              )}

              {gamePhase === 'rules' && activeGame !== 'clicker' && (
                <div className="absolute inset-0 bg-neutral-950 z-40 flex flex-col items-center justify-center p-8 text-white text-center rounded-2xl">
                  <h3 className="text-2xl font-black text-yellow-400 mb-3 uppercase">Instrucciones</h3>
                  <p className="text-sm text-neutral-300 max-w-md mb-6 leading-relaxed">
                    {activeGame === '2048' && 'Usa el teclado (Flechas o las teclas W,A,S,D) o desliza el dedo en cualquier dirección sobre el tablero para combinar fichas iguales.'}
                    {activeGame === 'tetris' && 'Mueve piezas con las teclas A/D o Flechas, rota con W/X, baja suavemente con S o Espacio y guarda pieza con Shift o C.'}
                    {activeGame === 'memory' && 'Voltea las cartas, encuentra las parejas ocultas en el menor tiempo posible y usa tus pistas sabiamente.'}
                    {activeGame === 'ninja' && 'Corta la mayor cantidad de frutas posibles. Usa el mouse y click izquierdo, ¡Cuidado con las bombas (restan 1 vida)!'}
                  </p>

                  {/* Selectores desplegables limpios para Memoria Pro */}
                  {activeGame === 'memory' && (
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md mb-6 text-left">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Dificultad</label>
                          <select 
                            value={memSettings.diff} 
                            onChange={(e) => setMemSettings(s => ({...s, diff: e.target.value}))} 
                            className="bg-neutral-900 text-white font-bold text-sm p-3 rounded-xl border border-neutral-700 outline-none focus:border-yellow-400 transition-colors shadow-inner cursor-pointer"
                          >
                            {Object.keys(MEMORY_DIFFICULTIES).map(d => (
                              <option key={d} value={d} className="bg-neutral-900 text-white py-2">{d}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Temática</label>
                          <select 
                            value={memSettings.theme} 
                            onChange={(e) => setMemSettings(s => ({...s, theme: e.target.value}))} 
                            className="bg-neutral-900 text-white font-bold text-sm p-3 rounded-xl border border-neutral-700 outline-none focus:border-yellow-400 transition-colors shadow-inner cursor-pointer"
                          >
                            {Object.keys(MEMORY_THEMES).map(t => (
                              <option key={t} value={t} className="bg-neutral-900 text-white py-2">{t}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                  )}

                  {activeGame === 'ninja' && (
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full max-w-lg mb-6 text-left">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold text-neutral-400 uppercase">Modo</label>
                          <select value={ninjaMode} onChange={(e) => setNinjaMode(e.target.value)} className="bg-neutral-800 text-white text-xs p-2 rounded-lg border border-neutral-700">
                            <option value="classic">Clásico (3 Vidas)</option>
                            <option value="arcade">Arcade (60s)</option>
                            <option value="zen">Zen (Sin Bombas)</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold text-neutral-400 uppercase">Fondo</label>
                          <select value={ninjaTheme} onChange={(e) => setNinjaTheme(e.target.value)} className="bg-neutral-800 text-white text-xs p-2 rounded-lg border border-neutral-700">
                            <option value="Dojo">Dojo Tradicional</option>
                            <option value="Bosque">Bosque Místico</option>
                            <option value="Atardecer">Atardecer Épico</option>
                            <option value="Noche">Noche Estrellada</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold text-neutral-400 uppercase">Sable / Katana</label>
                          <select value={ninjaKatana} onChange={(e) => setNinjaKatana(e.target.value)} className="bg-neutral-800 text-white text-xs p-2 rounded-lg border border-neutral-700">
                            <option value="Katana">Katana Clásica</option>
                            <option value="Láser">Láser Cibernético</option>
                            <option value="Fuego">Espada de Fuego</option>
                            <option value="Rayos">Rayos de Trueno</option>
                          </select>
                        </div>
                      </div>
                  )}

                  <button onClick={startPlaying} className="px-8 py-3 bg-yellow-400 text-black font-black rounded-xl text-sm shadow-lg hover:scale-105 transition-transform uppercase">¡Comenzar Partida! 🚀</button>
                </div>
              )}

              {/* MENU ESPECÍFICO CLICKER */}
              {activeGame === 'clicker' && gamePhase === 'rules' && (
                <div className="absolute inset-0 flex flex-col z-30 p-6">
                  <div className="flex justify-between items-center mb-4 shrink-0">
                    <div className="flex items-center gap-2">
                      <Zap className={`w-6 h-6 ${clickerSettings.theme === 'neon' ? 'text-cyan-400' : 'text-blue-500'}`} />
                      <h1 className="text-xl font-black uppercase tracking-wider">Click Challenge</h1>
                    </div>
                    <div className="flex gap-2 pr-10">
                      <button onClick={() => setGamePhase('clicker-stats')} className="p-2 bg-black/10 hover:bg-black/20 rounded-xl transition-all" title="Estadísticas"><BarChart3 size={18} /></button>
                      <button onClick={() => setGamePhase('clicker-leaderboard')} className="p-2 bg-black/10 hover:bg-black/20 rounded-xl transition-all" title="Ranking"><Trophy size={18} /></button>
                      <button onClick={() => setGamePhase('clicker-settings')} className="p-2 bg-black/10 hover:bg-black/20 rounded-xl transition-all" title="Ajustes"><SettingsIcon size={18} /></button>
                    </div>
                  </div>
                  
                  <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300">
                    <div className="mb-8 p-6 bg-black/5 rounded-2xl">
                      <p className="text-sm font-bold uppercase tracking-widest opacity-60 mb-1">Récord Personal</p>
                      <p className={`text-6xl font-black ${clickerSettings.theme === 'neon' ? 'text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]' : ''}`}>{highScores['clicker'] || 0}</p>
                      <p className="text-xs opacity-50 mt-2">Mejor racha: {clickerStats.bestCps} CPS</p>
                    </div>
                    <button 
                      onClick={startClickerCountdown}
                      className={`relative px-12 py-5 text-2xl font-black uppercase tracking-wider text-white rounded-full transition-all hover:scale-105 active:scale-95 shadow-2xl bg-gradient-to-r ${getClickerButtonColorClasses()} overflow-hidden group`}
                    >
                      <span className="relative z-20 flex items-center gap-2"><Play fill="currentColor" /> Comenzar</span>
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform z-10"></div>
                    </button>
                    <p className="mt-6 text-xs font-medium opacity-60 max-w-xs">Tienes exactamente 60 segundos para hacer la mayor cantidad de clics posibles sobre el botón gigante.</p>
                  </div>
                </div>
              )}

              {/* COUNTDOWN CLICKER */}
              {activeGame === 'clicker' && gamePhase === 'clicker-countdown' && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center animate-pulse">
                  <p className="text-sm font-bold uppercase tracking-widest mb-4 opacity-70">Prepárate...</p>
                  <span className={`text-[150px] leading-none font-black ${clickerSettings.theme === 'neon' ? 'text-cyan-400 drop-shadow-[0_0_30px_rgba(34,211,238,1)]' : 'text-blue-500'}`}>
                    {clickerCountdown}
                  </span>
                </div>
              )}

              {/* ESTADÍSTICAS CLICKER */}
              {activeGame === 'clicker' && gamePhase === 'clicker-stats' && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-black/30 backdrop-blur-md">
                  <div className="w-full max-w-lg animate-in fade-in text-left bg-black/60 p-6 rounded-2xl border border-white/10 shadow-2xl">
                    <h2 className="text-2xl font-black mb-6 uppercase flex items-center gap-2 border-b border-current pb-2"><BarChart3 /> Estadísticas Globales</h2>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="p-3 bg-black/40 rounded-xl"><span className="text-[10px] uppercase font-bold opacity-60 block">Partidas Jugadas</span><span className="text-lg font-black">{clickerStats.played}</span></div>
                      <div className="p-3 bg-black/40 rounded-xl"><span className="text-[10px] uppercase font-bold opacity-60 block">Clicks Totales</span><span className="text-lg font-black">{clickerStats.totalClicks.toLocaleString()}</span></div>
                      <div className="p-3 bg-blue-500/80 rounded-xl text-white"><span className="text-[10px] uppercase font-bold opacity-80 block">Mejor Récord</span><span className="text-lg font-black">{highScores['clicker'] || 0}</span></div>
                      <div className="p-3 bg-black/40 rounded-xl"><span className="text-[10px] uppercase font-bold opacity-60 block">CPS Promedio</span><span className="text-lg font-black">{clickerStats.avgCps.toFixed(2)}</span></div>
                    </div>
                    <h3 className="text-sm font-black uppercase mb-3 opacity-70">Logros ({clickerStats.achievements.length}/{ACHIEVEMENTS.length})</h3>
                    <div className="space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                      {ACHIEVEMENTS.map(ach => {
                        const unlocked = clickerStats.achievements.includes(ach.id);
                        return (
                          <div key={ach.id} className={`p-2 rounded-xl border flex items-center gap-3 ${unlocked ? 'bg-black/20 border-blue-500/30' : 'bg-black/5 border-transparent opacity-40'}`}>
                            <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-sm ${unlocked ? 'bg-blue-500 text-white' : 'bg-black/20'}`}>{unlocked ? '🏆' : '🔒'}</div>
                            <div>
                              <p className="font-bold text-xs">{ach.title}</p>
                              <p className="text-[10px] opacity-70">{ach.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <button onClick={() => setGamePhase('rules')} className="mt-4 w-full py-2 bg-black/40 hover:bg-black/60 font-bold rounded-xl transition-all">Volver</button>
                  </div>
                </div>
              )}

              {/* LEADERBOARD CLICKER */}
              {activeGame === 'clicker' && gamePhase === 'clicker-leaderboard' && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-black/30 backdrop-blur-md">
                  <div className="w-full max-w-lg animate-in fade-in text-left bg-black/60 p-6 rounded-2xl border border-white/10 shadow-2xl">
                    <h2 className="text-2xl font-black mb-6 uppercase flex items-center gap-2 border-b border-current pb-2"><Trophy className="text-yellow-500" /> Mejores Puntuaciones</h2>
                    {clickerLeaderboard.length === 0 ? (
                      <p className="text-center opacity-50 py-10">Aún no hay partidas registradas.</p>
                    ) : (
                      <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                        {clickerLeaderboard.map((entry, idx) => (
                          <div key={idx} className={`p-3 rounded-xl flex items-center justify-between ${idx === 0 ? 'bg-yellow-500/20 border border-yellow-500/50 text-yellow-300' : 'bg-black/20 border border-transparent'}`}>
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-black opacity-60 w-6 text-center">#{idx + 1}</span>
                              <div>
                                <p className="font-black text-base">{entry.clicks} <span className="text-[10px] font-normal opacity-70">clicks</span></p>
                                <p className="text-[10px] opacity-60">{entry.date} - {entry.time}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-sm">{entry.cps} CPS</p>
                              <p className="text-[10px] opacity-60">Promedio</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <button onClick={() => setGamePhase('rules')} className="mt-6 w-full py-2 bg-black/40 hover:bg-black/60 font-bold rounded-xl transition-all">Volver</button>
                  </div>
                </div>
              )}

              {/* CONFIGURACIÓN CLICKER */}
              {activeGame === 'clicker' && gamePhase === 'clicker-settings' && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-black/30 backdrop-blur-md">
                  <div className="w-full max-w-sm animate-in fade-in text-left bg-black/60 p-6 rounded-2xl border border-white/10 shadow-2xl">
                    <h2 className="text-xl font-black mb-4 uppercase flex items-center gap-2 border-b border-current pb-2"><SettingsIcon /> Configuración</h2>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-black/20 rounded-xl cursor-pointer" onClick={() => setClickerSettings(s => ({...s, sound: !s.sound}))}>
                        <div className="flex items-center gap-2"><span className="opacity-70">{clickerSettings.sound ? <Volume2 size={16}/> : <VolumeX size={16}/>}</span><span className="font-bold text-xs">Efectos Sonido</span></div>
                        <div className={`w-8 h-4 rounded-full relative transition-colors ${clickerSettings.sound ? 'bg-blue-500' : 'bg-white/20'}`}><div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${clickerSettings.sound ? 'translate-x-4' : 'translate-x-0'}`}></div></div>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-black/20 rounded-xl cursor-pointer" onClick={toggleClickerMusic}>
                        <div className="flex items-center gap-2"><span className="opacity-70"><Music size={16}/></span><span className="font-bold text-xs">Música Fondo</span></div>
                        <div className={`w-8 h-4 rounded-full relative transition-colors ${clickerSettings.music ? 'bg-blue-500' : 'bg-white/20'}`}><div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${clickerSettings.music ? 'translate-x-4' : 'translate-x-0'}`}></div></div>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-black/20 rounded-xl cursor-pointer" onClick={() => setClickerSettings(s => ({...s, showFps: !s.showFps}))}>
                        <div className="flex items-center gap-2"><span className="opacity-70"><BarChart3 size={16}/></span><span className="font-bold text-xs">Mostrar FPS</span></div>
                        <div className={`w-8 h-4 rounded-full relative transition-colors ${clickerSettings.showFps ? 'bg-blue-500' : 'bg-white/20'}`}><div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${clickerSettings.showFps ? 'translate-x-4' : 'translate-x-0'}`}></div></div>
                      </div>
                      <div className="pt-2">
                        <p className="text-[10px] font-bold uppercase mb-2 opacity-60">Tema Visual</p>
                        <div className="grid grid-cols-3 gap-2">
                          {['light', 'dark', 'neon'].map(t => (
                            <button key={t} onClick={() => setClickerSettings(s => ({...s, theme: t}))} className={`py-1.5 rounded-lg text-[10px] font-bold transition-all border ${clickerSettings.theme === t ? 'bg-current text-current bg-opacity-20 border-current' : 'border-transparent bg-black/20 opacity-60 hover:opacity-100'}`}>
                              {t === 'light' ? 'Claro' : t === 'dark' ? 'Oscuro' : 'Neón'}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="pt-2">
                        <p className="text-[10px] font-bold uppercase mb-2 opacity-60">Color del Botón</p>
                        <div className="flex gap-2 justify-center">
                          {['blue', 'red', 'purple', 'gold'].map(color => (
                            <button key={color} onClick={() => setClickerSettings(s => ({...s, buttonColor: color}))}
                              className={`w-8 h-8 rounded-full border-2 transition-all ${clickerSettings.buttonColor === color ? 'border-current scale-110' : 'border-transparent opacity-50'} ${color === 'blue' ? 'bg-blue-500' : color === 'red' ? 'bg-red-500' : color === 'purple' ? 'bg-purple-500' : 'bg-yellow-500'}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setGamePhase('rules')} className="mt-6 w-full py-2 bg-black/40 hover:bg-black/60 font-bold rounded-xl transition-all">Guardar y Volver</button>
                  </div>
                </div>
              )}

              {/* JUGANDO CLICKER */}
              {activeGame === 'clicker' && gamePhase === 'playing' && (
                <div className="w-full h-full flex flex-col items-center justify-between py-4 relative z-20">
                  <div className="w-full flex justify-between items-start px-6 pt-12">
                    <div className="flex flex-col items-start bg-black/10 p-3 rounded-xl min-w-[120px] backdrop-blur-md">
                      <span className="text-[10px] uppercase font-bold opacity-60">Tiempo</span>
                      <span ref={timerTextRef} className="text-4xl font-black font-mono tracking-tighter">01:00</span>
                    </div>
                    <div className="flex flex-col items-end bg-black/10 p-3 rounded-xl min-w-[120px] backdrop-blur-md">
                      <span className="text-[10px] uppercase font-bold opacity-60">Clicks</span>
                      <span ref={clicksTextRef} className="text-4xl font-black font-mono tracking-tighter text-blue-500">0</span>
                    </div>
                  </div>
                  <div className="w-full max-w-md px-6 absolute top-[120px] left-1/2 -translate-x-1/2 pointer-events-none">
                    <div className="flex justify-between text-[10px] font-bold uppercase opacity-60 mb-1">
                      <span>Velocidad Actual</span>
                      <span><span ref={cpsTextRef}>0</span> CPS</span>
                    </div>
                    <div className="w-full h-2 bg-black/20 rounded-full overflow-hidden">
                      <div ref={cpsBarRef} className="h-full bg-blue-500 w-0 transition-all duration-100 ease-linear"></div>
                    </div>
                  </div>
                  <div className="flex-1 flex items-center justify-center w-full touch-none select-none">
                    <button
                      onPointerDown={handleMainClickerAction}
                      className={`w-56 h-56 sm:w-64 sm:h-64 rounded-full font-black text-2xl sm:text-3xl text-white outline-none px-4 text-center
                        bg-gradient-to-br ${getClickerButtonColorClasses()} 
                        shadow-[0_20px_50px_rgba(0,0,0,0.4)]
                        hover:brightness-110 active:brightness-90
                        active:scale-95 transition-all duration-75 cursor-pointer 
                        flex items-center justify-center flex-col gap-2 relative group focus-visible:ring-8 focus-visible:ring-blue-400`}
                      style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
                    >
                      <span className="pointer-events-none drop-shadow-md leading-tight">{clickerButtonText}</span>
                      <div className="absolute inset-0 rounded-full shadow-[inset_0_5px_15px_rgba(255,255,255,0.4)] pointer-events-none"></div>
                      <div className="absolute inset-0 rounded-full border-2 border-white/0 group-hover:border-white/30 group-hover:scale-105 transition-all duration-300 pointer-events-none"></div>
                    </button>
                  </div>
                  <div className="text-xs font-medium opacity-40">Presiona el botón, Espacio o Enter.</div>
                </div>
              )}

              {/* RESULTADOS CLICKER */}
              {activeGame === 'clicker' && gamePhase === 'clicker-result' && (() => {
                const finalScore = clickerClicksRef.current;
                const avg = (finalScore / 60).toFixed(2);
                const medal = getClickerMedal(finalScore);
                const isNewRecord = finalScore >= (highScores['clicker'] || 0) && finalScore > 0;
                return (
                  <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-black/80 backdrop-blur-md">
                    <div className="w-full max-w-2xl flex flex-col items-center text-center animate-in slide-in-from-bottom-8 duration-500 bg-neutral-900 border border-white/10 p-6 md:p-8 rounded-3xl shadow-2xl">
                      {isNewRecord && (
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-yellow-400 text-black font-black uppercase text-xs rounded-full mb-4 animate-bounce">
                          <Award size={14} /> ¡Nuevo Récord Personal!
                        </div>
                      )}
                      <h2 className="text-5xl sm:text-7xl font-black mb-1">{finalScore}</h2>
                      <p className="text-sm uppercase font-bold opacity-60 tracking-widest mb-4">Clicks Totales</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full mb-4">
                        <div className="bg-black/20 p-3 rounded-2xl flex flex-col items-center"><span className="text-[10px] uppercase font-bold opacity-50 mb-1">Promedio</span><span className="text-lg font-black">{avg} <span className="text-[10px]">CPS</span></span></div>
                        <div className="bg-black/20 p-3 rounded-2xl flex flex-col items-center"><span className="text-[10px] uppercase font-bold opacity-50 mb-1">Mejor Racha</span><span className="text-lg font-black">{clickerMaxCpsRef.current} <span className="text-[10px]">CPS</span></span></div>
                        <div className="bg-black/20 p-3 rounded-2xl flex flex-col items-center col-span-2 md:col-span-2"><span className="text-[10px] uppercase font-bold opacity-50 mb-1">Medalla Obtenida</span>
                          <div className="flex items-center gap-2"><span className="text-xl">{medal.icon}</span><span className={`text-base font-black bg-clip-text text-transparent bg-gradient-to-r ${medal.color}`}>{medal.name}</span></div>
                        </div>
                      </div>
                      <div className="w-full mb-6">
                        <p className="text-[10px] uppercase font-bold opacity-50 text-left mb-1">Rendimiento (CPS por segundo)</p>
                        {renderClickerChart()}
                      </div>
                      <div className="flex flex-wrap justify-center gap-3 w-full">
                        <button onClick={startClickerCountdown} className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-black rounded-xl transition-all shadow-lg flex items-center gap-2 flex-1 min-w-[160px] justify-center"><RotateCcw size={16} /> Jugar Otra Vez</button>
                        <button onClick={() => handleShareScore('Click Challenge', finalScore)} className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-black rounded-xl transition-all shadow-lg flex items-center gap-2 flex-1 min-w-[150px] justify-center"><Share2 size={16} /> Compartir</button>
                        <button onClick={() => setGamePhase('rules')} className="px-6 py-3 bg-black/40 hover:bg-black/60 font-bold rounded-xl transition-all flex items-center gap-2 flex-1 min-w-[120px] justify-center"><Home size={16} /> Menú</button>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* JUGANDO 2048 */}
              {activeGame === '2048' && gamePhase === 'playing' && (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 select-none touch-none relative" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
                  {is2048Paused && renderUnifiedPauseOverlay(() => setIs2048Paused(false), () => setGamePhase('menu'))}
                  <div className="flex justify-between w-full max-w-[340px] mb-3">
                    <span className="text-xs font-bold text-neutral-400">{isWon ? '✨ ¡2048 Conseguido! (Modo Infinito)' : 'Combina fichas iguales'}</span>
                    <button onClick={undo2048} className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-yellow-400 rounded-lg flex items-center gap-1 shadow"><RotateCcw size={12} /> Deshacer</button>
                  </div>
                  <div className="grid grid-cols-4 gap-2.5 bg-neutral-900 p-3.5 rounded-2xl border-2 border-neutral-800 shadow-2xl">
                    {grid2048.map((row, r) => row.map((val, c) => (
                      <div key={`${r}-${c}`} className={`w-16 h-16 md:w-20 md:h-20 rounded-xl flex items-center justify-center font-black text-xl md:text-3xl transition-all shadow-inner ${val === 0 ? 'bg-neutral-800/40 text-transparent' : val === 2 ? 'bg-amber-100 text-neutral-800' : val === 4 ? 'bg-amber-200 text-neutral-800' : val === 8 ? 'bg-orange-400 text-white' : val === 16 ? 'bg-orange-500 text-white' : val === 32 ? 'bg-red-500 text-white' : val === 64 ? 'bg-red-600 text-white' : 'bg-yellow-400 text-black scale-105'}`}>
                        {val !== 0 ? val : ''}
                      </div>
                    )))}
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-3 font-medium">💡 En PC usa Teclas de Flecha / WASD | En Móvil desliza el dedo sobre el tablero.</p>
                </div>
              )}

              {/* JUGANDO TETRIS */}
              {activeGame === 'tetris' && gamePhase === 'playing' && (() => {
                const ghostY = getTetrisGhostY();
                const displayGrid = tetrisGrid.map(row => [...row]);
                
                if (tetrisCurrent) {
                  for (let r = 0; r < tetrisCurrent.shape.length; r++) {
                    for (let c = 0; c < tetrisCurrent.shape[r].length; c++) {
                      if (tetrisCurrent.shape[r][c]) {
                        let gy = ghostY + r;
                        let gx = tetrisCurrent.x + c;
                        if (gy >= TETRIS_HIDDEN_ROWS && gy < TETRIS_ROWS + TETRIS_HIDDEN_ROWS && gx >= 0 && gx < TETRIS_COLS) {
                          if (displayGrid[gy][gx] === null) {
                            displayGrid[gy][gx] = 'ghost';
                          }
                        }
                      }
                    }
                  }
                  for (let r = 0; r < tetrisCurrent.shape.length; r++) {
                    for (let c = 0; c < tetrisCurrent.shape[r].length; c++) {
                      if (tetrisCurrent.shape[r][c]) {
                        let by = tetrisCurrent.y + r;
                        let bx = tetrisCurrent.x + c;
                        if (by >= TETRIS_HIDDEN_ROWS && by < TETRIS_ROWS + TETRIS_HIDDEN_ROWS && bx >= 0 && bx < TETRIS_COLS) {
                          displayGrid[by][bx] = tetrisCurrent.color;
                        }
                      }
                    }
                  }
                }

                return (
                  <div className="w-full h-full flex items-center justify-center gap-6 p-4 select-none touch-none relative" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
                    {isTetrisPaused && renderUnifiedPauseOverlay(() => setIsTetrisPaused(false), () => setGamePhase('menu'))}
                    
                    <div className="flex flex-col gap-3 w-28 bg-neutral-900/90 p-3 rounded-2xl border border-neutral-800 text-white text-xs">
                      <span className="font-black text-yellow-400 uppercase tracking-wider text-center">Guardada</span>
                      <div className="w-20 h-20 bg-black/50 rounded-xl mx-auto flex items-center justify-center border border-neutral-800 p-2">
                        {tetrisHold ? (
                          <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${tetrisHold.shape[0].length}, 1fr)` }}>
                            {tetrisHold.shape.map((row, ri) => row.map((cell, ci) => (
                              <div key={`${ri}-${ci}`} className={`w-3.5 h-3.5 rounded-sm ${cell ? '' : 'opacity-0'}`} style={{ backgroundColor: cell ? tetrisHold.color : 'transparent' }} />
                            )))}
                          </div>
                        ) : <span className="text-[10px] text-neutral-500">Vacío</span>}
                      </div>
                      <div className="pt-2 border-t border-neutral-800 space-y-1">
                        <p className="text-[10px] text-neutral-400">Puntos: <span className="text-yellow-400 font-black">{score}</span></p>
                        <p className="text-[10px] text-neutral-400">Nivel: <span className="text-yellow-400 font-black">{tetrisLevel}</span></p>
                        <p className="text-[10px] text-neutral-400">Líneas: <span className="text-yellow-400 font-black">{tetrisLines}</span></p>
                      </div>
                      <button onClick={() => setIsTetrisPaused(true)} className="mt-auto py-1.5 bg-neutral-800 hover:bg-neutral-700 text-yellow-400 font-bold rounded-lg text-xs">Pausa</button>
                    </div>

                    <div className="bg-neutral-900 p-2 rounded-2xl border-2 border-neutral-800 shadow-2xl flex flex-col justify-center">
                      <div 
                        className="grid bg-black/80 rounded-xl overflow-hidden border border-neutral-800"
                        style={{ 
                          gridTemplateColumns: `repeat(${TETRIS_COLS}, minmax(0, 1fr))`, 
                          gridTemplateRows: `repeat(${TETRIS_ROWS}, minmax(0, 1fr))`,
                          width: '240px',
                          height: '400px'
                        }}
                      >
                        {displayGrid.slice(TETRIS_HIDDEN_ROWS).map((row, r) => row.map((cell, c) => (
                          <div 
                            key={`${r}-${c}`} 
                            className={`w-full h-full border border-neutral-900/30 ${
                              cell === 'ghost' ? 'border border-dashed border-white/30 bg-white/5' : ''
                            }`}
                            style={{ backgroundColor: cell && cell !== 'ghost' ? cell : undefined }}
                          />
                        )))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 w-32 bg-neutral-900/90 p-3 rounded-2xl border border-neutral-800 text-white text-xs">
                      <span className="font-black text-yellow-400 uppercase tracking-wider text-center">Siguientes</span>
                      <div className="flex flex-col gap-2 overflow-y-auto max-h-[340px] pr-1 custom-scrollbar">
                        {tetrisQueue.slice(0, 5).map((piece, idx) => (
                          <div key={idx} className="w-full h-14 bg-black/50 rounded-xl flex items-center justify-center border border-neutral-800 p-1">
                            <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${piece.shape[0].length}, 1fr)` }}>
                              {piece.shape.map((row, ri) => row.map((cell, ci) => (
                                <div key={`${ri}-${ci}`} className={`w-2.5 h-2.5 rounded-sm ${cell ? '' : 'opacity-0'}`} style={{ backgroundColor: cell ? piece.color : 'transparent' }} />
                              )))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                );
              })()}

              {/* JUGANDO NINJA CUT */}
              {activeGame === 'ninja' && gamePhase === 'playing' && (
                <div className="w-full h-full relative select-none touch-none overflow-hidden flex flex-col">
                  <div className="absolute top-3 left-3 right-16 z-20 flex justify-between items-center pointer-events-none px-4 py-2 bg-black/60 backdrop-blur-md rounded-xl border border-neutral-800 text-white font-bold text-xs">
                    <div>Puntos: <span className="text-yellow-400 text-sm font-black">{score}</span></div>
                    {ninjaMode === 'classic' && (
                      <div className="flex gap-1 items-center">
                        {[1, 2, 3].map(heartIndex => (
                          <span key={heartIndex} className="text-base relative inline-block">
                            {heartIndex <= ninjaLives ? '❤️' : '🖤'}
                          </span>
                        ))}
                      </div>
                    )}
                    {ninjaMode === 'arcade' && <div>⏱️ <span className="text-yellow-400 font-black">{ninjaTimeLeft}s</span></div>}
                    
                    <div className="flex gap-2 pointer-events-auto">
                      <button onClick={() => setNinjaPausedState(true)} className="p-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-yellow-400 flex items-center gap-1" title="Pausar">
                        <Pause size={14} />
                      </button>
                      <button onClick={() => setIsEffectsMuted(!isEffectsMuted)} className="p-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg">
                        {isEffectsMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                      </button>
                    </div>
                  </div>

                  {isNinjaPaused && renderUnifiedPauseOverlay(() => setNinjaPausedState(false), () => { setNinjaPausedState(false); setGamePhase('menu'); })}

                  {comboPopup && (
                    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none animate-bounce">
                      <span className="text-3xl font-black text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)] uppercase">{comboPopup}</span>
                    </div>
                  )}

                  <canvas 
                    ref={canvasRef}
                    onMouseDown={handleNinjaPointerDown}
                    onMouseMove={handleNinjaPointerMove}
                    onMouseUp={handleNinjaPointerUp}
                    onMouseLeave={handleNinjaPointerUp}
                    onTouchStart={handleNinjaPointerDown}
                    onTouchMove={handleNinjaPointerMove}
                    onTouchEnd={handleNinjaPointerUp}
                    className="w-full h-full cursor-crosshair touch-none absolute inset-0 rounded-2xl"
                  />
                </div>
              )}

              {/* JUGANDO MEMORY */}
              {activeGame === 'memory' && gamePhase === 'playing' && (
                <div className="w-full h-full flex flex-col items-center justify-between p-2 sm:p-2.5 relative overflow-hidden">
                  <div className="w-full max-w-[480px] flex justify-between items-center bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-xl shadow-md text-white font-bold z-10 shrink-0">
                    <div className="flex gap-2 sm:gap-3 items-center text-xs">
                      <span className="flex items-center gap-1"><Clock size={13} className="text-yellow-400"/> {formatTime(memStats.time)}</span>
                      <span className="flex items-center gap-1 hidden sm:flex"><RotateCcw size={13} className="text-blue-400"/> Mov: {memStats.moves}</span>
                      <span className="flex items-center gap-1 text-red-400 hidden sm:flex">❌ Err: {memStats.errors}</span>
                    </div>
                    <div className="text-xs">Pts: <span className="text-yellow-400 font-black">{score}</span></div>
                    <div className="flex gap-2">
                       <button onClick={useMemoryHint} disabled={memStats.hints === 0 || isMemoryPaused} className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 rounded-lg flex items-center gap-1 text-xs border border-yellow-500/30">
                         <Lightbulb size={12} className="text-yellow-400" /> ({memStats.hints})
                       </button>
                       <button onClick={() => setIsMemoryPaused(!isMemoryPaused)} className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 rounded-lg flex items-center gap-1 text-xs text-yellow-400">
                         <Pause size={12} /> Pausa
                       </button>
                    </div>
                  </div>

                  {isMemoryPaused && !isWon && renderUnifiedPauseOverlay(() => setIsMemoryPaused(false), () => setGamePhase('menu'))}

                  <div className={`grid gap-0.5 sm:gap-1 w-full ${MEMORY_DIFFICULTIES[memSettings.diff].maxWidth} ${MEMORY_DIFFICULTIES[memSettings.diff].maxHeight} aspect-square mx-auto items-center justify-center my-auto ${MEMORY_DIFFICULTIES[memSettings.diff].gridClass}`}
                       style={{ 
                         gridTemplateColumns: `repeat(${MEMORY_DIFFICULTIES[memSettings.diff].cols}, minmax(0, 1fr))`,
                         gridTemplateRows: `repeat(${MEMORY_DIFFICULTIES[memSettings.diff].rows}, minmax(0, 1fr))` 
                       }}>
                    {memoryCards.map((card, idx) => {
                      const isFlipped = card.flipped || memoryMatched.includes(idx) || card.isHint;
                      const cols = MEMORY_DIFFICULTIES[memSettings.diff].cols;
                      const textSize = cols >= 10 ? 'text-sm sm:text-base md:text-lg' : cols >= 8 ? 'text-base sm:text-lg md:text-xl' : cols >= 6 ? 'text-xl sm:text-2xl md:text-3xl' : 'text-3xl sm:text-4xl md:text-5xl';
                      
                      return (
                        <div key={card.id} 
                             onClick={() => handleFlipCard(idx)}
                             className={`relative w-full h-full aspect-square cursor-pointer ${card.errorAnim ? 'animate-shake' : ''}`}
                             style={{ perspective: '1000px' }}>
                          <div className={`w-full h-full absolute transition-all duration-500 rounded-sm sm:rounded-md shadow-sm border ${memoryMatched.includes(idx) ? 'border-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]' : 'border-neutral-700'}`}
                               style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)', transformOrigin: 'center center' }}>
                            <div className="absolute w-full h-full backface-hidden bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-sm sm:rounded-md flex items-center justify-center overflow-hidden hover:border-yellow-400 transition-colors"
                                 style={{ backfaceVisibility: 'hidden' }}>
                              <Sparkles className="absolute text-yellow-400/30 w-1/3 h-1/3" />
                            </div>
                            <div className={`absolute w-full h-full backface-hidden rounded-sm sm:rounded-md flex items-center justify-center ${textSize} bg-neutral-100`}
                                 style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                              <span className={memoryMatched.includes(idx) ? 'animate-bounce' : ''}>{card.content}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* GAMEOVER PARA 2048, TETRIS, MEMORY Y NINJA */}
              {gamePhase === 'gameover' && activeGame !== 'clicker' && (
                <div className="absolute inset-0 bg-neutral-950/95 z-50 flex flex-col items-center justify-center p-6 text-center text-white rounded-2xl backdrop-blur-md">
                  <h3 className={`text-3xl font-black mb-2 uppercase ${isWon ? 'text-green-400' : 'text-red-500'}`}>{isWon ? '🎉 ¡Victoria!' : '💥 ¡Partida Finalizada!'}</h3>
                  
                  {activeGame === 'memory' && isWon && (
                    <div className="flex gap-2 mb-4">
                       {[1, 2, 3].map(star => (
                         <div key={star} className={`text-4xl ${star <= memoryStars ? 'text-yellow-400 scale-110 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]' : 'text-neutral-700 opacity-50'} transition-all duration-500 transform`}>
                            ⭐
                         </div>
                       ))}
                    </div>
                  )}

                  <p className="text-sm text-neutral-300 mb-6">Puntuación obtenida: <strong className="text-yellow-400 text-xl block mt-1">{score}</strong></p>
                  
                  <div className="flex flex-wrap gap-3 justify-center w-full max-w-md">
                    <button onClick={startPlaying} className="px-5 py-3 bg-yellow-400 text-black font-black rounded-xl text-xs uppercase shadow-lg hover:scale-105 transition-all flex items-center gap-2 flex-1 justify-center min-w-[140px]"><RotateCcw size={16} /> Jugar Otra Vez</button>
                    <button onClick={() => handleShareScore(activeGame === '2048' ? '2048 Classic' : activeGame === 'tetris' ? 'Cyber Tetris Pro' : activeGame === 'memory' ? 'Memoria Pro' : 'Ninja Cut', score)} className="px-5 py-3 bg-green-600 hover:bg-green-700 text-white font-black rounded-xl text-xs uppercase shadow-lg transition-all flex items-center gap-2 flex-1 justify-center min-w-[140px]"><Share2 size={16} /> Compartir</button>
                    <button onClick={() => setGamePhase('menu')} className="px-5 py-3 bg-neutral-800 text-neutral-300 font-bold rounded-xl text-xs hover:bg-neutral-700 transition-all border border-neutral-700 flex items-center gap-2 justify-center w-full"><Home size={16} /> Menú Principal</button>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* COLUMNA DERECHA: TOP GLOBAL + GANADORES DEL MES */}
          <div className="w-full lg:w-64 shrink-0 flex flex-col gap-6">
            
            {/* TOP GLOBAL MENSUAL */}
            <div className="bg-gradient-to-b from-blue-600 to-blue-950 rounded-2xl p-5 text-white shadow-lg border border-blue-500 flex flex-col gap-3">
              <h3 className="text-center font-black text-sm uppercase tracking-wider mb-2 flex items-center justify-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-400" /> TOP GLOBAL MENSUAL
              </h3>
              <div className="space-y-2">
                {fullLeaderboard.map((player, index) => (
                  <div key={index} className={`flex justify-between items-center p-2 rounded-xl text-xs ${player.isMe ? 'bg-yellow-400 text-black font-bold shadow' : 'bg-black/30'}`}>
                    <span>#{index + 1} {player.name}</span>
                    <span className="font-black">{index === 0 ? (highScores[activeGame] || 0) : player.score}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* APARTADO: GANADORES DEL MES (Enero, Febrero, Marzo, etc.) */}
            <div className="bg-gradient-to-b from-purple-900 to-neutral-950 rounded-2xl p-5 text-white shadow-lg border border-purple-500 flex flex-col gap-3">
              <h3 className="text-center font-black text-sm uppercase tracking-wider mb-2 flex items-center justify-center gap-2">
                <Calendar className="w-4 h-4 text-yellow-400" /> GANADORES DEL MES
              </h3>
              
              {Object.keys(monthlyWinners).length === 0 ? (
                <p className="text-[11px] text-center text-purple-300/70 py-4 italic">
                  Aún no hay ganadores registrados de meses anteriores. Se registrarán automáticamente al finalizar cada mes.
                </p>
              ) : (
                <div className="space-y-3 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                  {Object.entries(monthlyWinners).map(([monthName, data], idx) => (
                    <div key={idx} className="bg-black/40 rounded-xl p-3 border border-purple-500/30 text-xs">
                      <p className="font-black text-yellow-400 mb-1 border-b border-purple-500/20 pb-1">📅 {monthName}</p>
                      <p className="text-[10px] text-purple-200 mb-2">Ganador: <span className="font-bold text-white">@{data.user}</span></p>
                      <div className="space-y-1">
                        {Object.entries(data.scores || {}).map(([gKey, gScore], sIdx) => (
                          <div key={sIdx} className="flex justify-between items-center text-[10px] text-purple-300">
                            <span className="capitalize">{gKey}:</span>
                            <span className="font-black text-yellow-300">{gScore} pts</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px) rotate(-5deg); }
          50% { transform: translateX(5px) rotate(5deg); }
          75% { transform: translateX(-5px) rotate(-5deg); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(150,150,150,0.3); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(150,150,150,0.5); }
      `}} />
    </div>
  );
}
