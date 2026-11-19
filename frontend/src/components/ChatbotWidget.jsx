import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Bot,
  Send,
  X,
  Copy,
  Minus,
  CreditCard,
  ExternalLink,
  Tag,
  ShoppingBag,
  Flame,
  Search
} from 'lucide-react';
import {
  FaWhatsapp,
  FaTelegram,
  FaFacebook,
  FaYoutube
} from "react-icons/fa";
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const BACKEND_URL = 'https://caza-ofertas-backend.onrender.com';
const API = BACKEND_URL;

const MP_POINT_LINK = 'https://www.mercadopago.com.mx/herramientas-para-vender/lectores-point?code=7XYVCUKISD';
const ML_SEARCH_AFFILIATE = 'https://mercadolibre.com/sec/1XFPeWr';
const WHATSAPP_GROUP_LINK = 'https://chat.whatsapp.com/IRASJWGThXcLi0VcBLolUi?mode=hqrt1';
const WHATSAPP_PERSONAL_NUMBER = '523312229710';

const SYSTEM_PROMPT = `
Eres CapiBaraML 🐹, el asistente virtual oficial de CapiBaraML WEB. 

DIRECTRICES DE VENTAS Y FILTRADO ESTRICTO:
- Tu objetivo es ahorrarle dinero al usuario y ayudarle a encontrar las mejores ofertas, remates y cupones activos en Mercado Libre.
- Responde ÚNICAMENTE sobre la consulta actual del usuario. No mezcles temas de mensajes anteriores.
- NUNCA uses la palabra "afiliado", "link de afiliado" ni "enlace de afiliado". Di siempre "enlace de oferta" o "enlace directo".
- NUNCA inventes links ni escribas "TU_CAMPID_AQUI". Usa únicamente los links reales proporcionados en el catálogo.
- Si no tenemos un producto, invítalo a escribirnos por WhatsApp al 33 1222 9710 para rastrearle la mejor oferta.
- Habla en español latino, usando emojis de forma moderada pero divertida (🚀, ✨, 🐹, 🎟️, 🔥).
- Sé conciso, directo y persuasivo (máximo 3 líneas de texto).
`;

const decodeCouponIfNeeded = (item) => {
  if (!item || typeof item !== 'object') return item;
  const copy = { ...item };
  if (copy.description && typeof copy.description === 'string') {
    const expMatch = copy.description.match(/\|\|exp:(.*?)\|\|/);
    if (expMatch && !copy.expires_at) {
      copy.expires_at = expMatch[1];
    }
    copy.description = copy.description.replace(/\|\|exp:.*?\|\|/g, '').trim();
  }
  return copy;
};

const normalizeStr = (s = '') =>
  String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const hasWholeWord = (text, words) =>
  words.some((w) => new RegExp(`\\b${w}\\b`, 'i').test(text));

const sanitizeBotReply = (text = '') =>
  String(text)
    .replace(/\?campid=TU_CAMPID_AQUI/gi, '')
    .replace(/\b(link|enlace)s?\s+de\s+afiliad[oa]s?\b/gi, 'enlace de oferta')
    .replace(/\bafiliad[oa]s?\b/gi, 'oficiales');

const filterStrictCatalog = (userText, catalog) => {
  const norm = normalizeStr(userText);
  const cleanNumText = userText.replace(/,/g, '');
  const budgetMatch =
    cleanNumText.match(/(?:presupuesto|tengo|cuento con|maximo|máximo|hasta|menos de|de)\s*(?:de\s*)?\$?\s*(\d{2,6})/i) ||
    cleanNumText.match(/\$\s*(\d{2,6})/);
  const budget = budgetMatch && budgetMatch[1] ? Number(budgetMatch[1]) : null;

  const isConversational =
    /^(hola|buenas|buenos dias|buenas tardes|buenas noches|hey|que tal|que onda|gracias|muchas gracias|ok|vale|perfecto|adios|bye)$/.test(norm) ||
    hasWholeWord(norm, ['garantia', 'envio', 'confiable', 'seguro']);

  if (isConversational) {
    return { status: 'GENERAL_CHAT', items: [], budget, categoryLabel: '', isCategorySearch: false };
  }

  const brandFilters = [
    { trigger: ['iphone'], required: ['iphone'], label: 'iPhone', minPrice: 3000 },
    { trigger: ['macbook'], required: ['macbook'], label: 'MacBook', minPrice: 5000 },
    { trigger: ['samsung', 'galaxy'], required: ['samsung', 'galaxy'], label: 'Samsung Galaxy' },
    { trigger: ['xiaomi', 'redmi', 'poco'], required: ['xiaomi', 'redmi', 'poco'], label: 'Xiaomi / Redmi' },
    { trigger: ['motorola'], required: ['motorola', 'moto g', 'moto e', 'moto edge'], label: 'Motorola' },
    { trigger: ['nothing'], required: ['nothing'], label: 'Nothing Phone' },
    { trigger: ['xbox'], required: ['xbox'], label: 'Xbox' },
    { trigger: ['switch', 'nintendo'], required: ['switch', 'nintendo'], label: 'Nintendo Switch' },
    { trigger: ['playstation', 'ps5', 'ps4'], required: ['playstation', 'ps5', 'ps4'], label: 'PlayStation' },
    { trigger: ['ipad'], required: ['ipad'], label: 'iPad', minPrice: 2500 },
  ];
  const requestedBrand = brandFilters.find((b) => hasWholeWord(norm, b.trigger));

  const isLaptopOnly = hasWholeWord(norm, ['laptop', 'laptops', 'lap top', 'portatil', 'portatiles', 'macbook', 'notebook']);
  const isDesktopOrPC = !isLaptopOnly && hasWholeWord(norm, ['computadora', 'computadoras', 'pc', 'all in one', 'escritorio']);
  const isPhone = hasWholeWord(norm, ['celular', 'celulares', 'telefono', 'telefonos', 'smartphone', 'smartphones', 'iphone']);
  const isScreen = hasWholeWord(norm, ['pantalla', 'pantallas', 'tv', 'smart tv', 'televisor', 'televisores', 'television']);
  const isMonitor = hasWholeWord(norm, ['monitor', 'monitores']);
  const isConsole =
    hasWholeWord(norm, ['consola', 'consolas', 'xbox', 'switch', 'nintendo', 'ps5', 'playstation']) &&
    !hasWholeWord(norm, ['control', 'mando', 'estuche', 'funda', 'bateria', 'audifono', 'audifonos', 'headset']);
  const isHeadphones = hasWholeWord(norm, ['audifono', 'audifonos', 'auricular', 'auriculares', 'headset', 'earbuds', 'buds', 'airpods']);

  const accessoryPhrases = [
    'para laptop', 'para macbook', 'para computadora', 'para iphone', 'para celular',
    'para smartphone', 'para telefono', 'para smart tv', 'para tv', 'para pantalla',
    'para nintendo', 'para switch', 'para xbox', 'compatible con', 'pantalla para',
    'lcd para', 'display', 'tactil', 'refaccion', 'repuesto'
  ];

  let categoryLabel = '';
  let minPriceFloor = 0;
  let filtered = [];

  if (isLaptopOnly) {
    categoryLabel = requestedBrand ? requestedBrand.label : 'Laptops / Portátiles';
    minPriceFloor = 2200;
    const mustHave = ['laptop', 'laptops', 'portatil', 'macbook', 'notebook', 'chromebook', 'ultrabook'];
    const exclude = [
      'all in one', 'escritorio', 'prodesk', 'optiplex', 'sff', 'gabinete',
      'iphone', 'celular', 'smartphone', 'funda', 'mochila', 'cargador', 'cable',
      'magsafe', 'disco solido', 'disco duro', 'lentes', 'gafas', 'soporte',
      'base', 'monitor', 'mouse', 'teclado', 'adaptador', 'bateria'
    ];
    filtered = catalog.filter((p) => {
      const t = normalizeStr(p.title || p.nombre || '');
      const price = Number(p.discount_price || p.precio || 0);
      return (
        price >= minPriceFloor &&
        hasWholeWord(t, mustHave) &&
        !hasWholeWord(t, exclude) &&
        !accessoryPhrases.some((ph) => t.includes(ph))
      );
    });
  } else if (isDesktopOrPC) {
    categoryLabel = 'Computadoras / PC';
    minPriceFloor = 2200;
    const mustHave = ['computadora', 'all in one', 'prodesk', 'optiplex', 'pc', 'laptop', 'portatil', 'macbook'];
    const exclude = ['funda', 'mochila', 'cargador', 'cable', 'disco solido', 'disco duro', 'lentes', 'gafas', 'soporte', 'base', 'mouse', 'teclado', 'adaptador', 'audifono', 'audifonos', 'control', 'gamepad'];
    filtered = catalog.filter((p) => {
      const t = normalizeStr(p.title || p.nombre || '');
      const price = Number(p.discount_price || p.precio || 0);
      return (
        price >= minPriceFloor &&
        hasWholeWord(t, mustHave) &&
        !hasWholeWord(t, exclude) &&
        !accessoryPhrases.some((ph) => t.includes(ph))
      );
    });
  } else if (isPhone) {
    categoryLabel = requestedBrand ? requestedBrand.label : 'Celulares / Smartphones';
    minPriceFloor = requestedBrand?.minPrice || 1200;
    const mustHave = ['iphone', 'celular', 'smartphone', 'telefono', 'galaxy', 'xiaomi', 'redmi', 'poco', 'motorola', 'realme', 'honor', 'nothing phone', 'oppo', 'huawei'];
    const exclude = ['laptop', 'macbook', 'portatil', 'ipad', 'tablet', 'funda', 'mica', 'cristal', 'cargador', 'cable', 'audifono', 'audifonos', 'auricular', 'auriculares', 'buds', 'airpods', 'reloj', 'smartwatch', 'watch', 'camara', 'vigilancia', 'seguridad', 'adaptador', 'soporte', 'base', 'control', 'remoto', 'enchufe', 'interruptor', 'sensor', 'modulo', 'bocina'];
    filtered = catalog.filter((p) => {
      const t = normalizeStr(p.title || p.nombre || '');
      const price = Number(p.discount_price || p.precio || 0);
      return (
        price >= minPriceFloor &&
        hasWholeWord(t, mustHave) &&
        !hasWholeWord(t, exclude) &&
        !accessoryPhrases.some((ph) => t.includes(ph))
      );
    });
  } else if (isScreen) {
    categoryLabel = 'Pantallas / Smart TV';
    minPriceFloor = 1500;
    const mustHave = ['smart tv', 'televisor', 'television', 'pantalla', 'roku tv', 'google tv', 'qled', 'oled'];
    const exclude = [
      'pc', 'prodesk', 'all in one', 'escritorio', 'windows', 'ssd', 'ram', 'graphics',
      'core i3', 'core i5', 'core i7', 'ryzen', 'laptop', 'portatil', 'iphone', 'celular',
      'smartphone', 'audifono', 'audifonos', 'auricular', 'control', 'remoto', 'cable',
      'hdmi', 'soporte', 'base', 'brazo', 'power bank', 'bateria', 'sensor', 'echo show',
      'bocina', 'soundbar', 'barra de sonido', 'proyector', 'nintendo', 'switch',
      'camara', 'vigilancia', 'seguridad', 'tira led', 'led rgb', 'funda', 'estuche',
      'kit', 'zte', 'huawei', 'motorola', 'xiaomi'
    ];
    filtered = catalog.filter((p) => {
      const t = normalizeStr(p.title || p.nombre || '');
      const price = Number(p.discount_price || p.precio || 0);
      return (
        price >= minPriceFloor &&
        hasWholeWord(t, mustHave) &&
        !hasWholeWord(t, exclude) &&
        !accessoryPhrases.some((ph) => t.includes(ph))
      );
    });
  } else if (isMonitor) {
    categoryLabel = 'Monitores';
    minPriceFloor = 700;
    const mustHave = ['monitor'];
    const exclude = ['soporte', 'base', 'brazo', 'cable', 'funda', 'camara', 'bebe', 'presion', 'cardiaco'];
    filtered = catalog.filter((p) => {
      const t = normalizeStr(p.title || p.nombre || '');
      const price = Number(p.discount_price || p.precio || 0);
      return price >= minPriceFloor && hasWholeWord(t, mustHave) && !hasWholeWord(t, exclude);
    });
  } else if (isConsole) {
    categoryLabel = requestedBrand ? `Consolas ${requestedBrand.label}` : 'Consolas de Videojuegos';
    minPriceFloor = 3500;
    const mustHave = ['consola', 'console', 'xbox series', 'nintendo switch', 'playstation', 'ps5'];
    const exclude = [
      'audifono', 'audifonos', 'auricular', 'auriculares', 'headset', 'diadema', 'microfono',
      'control', 'controlador', 'mando', 'gamepad', 'joystick', 'estuche', 'funda', 'kit',
      'accesorios', 'bateria', 'cargador', 'soporte', 'cable', 'game pass', 'tarjeta'
    ];
    filtered = catalog.filter((p) => {
      const t = normalizeStr(p.title || p.nombre || '');
      const price = Number(p.discount_price || p.precio || 0);
      return (
        price >= minPriceFloor &&
        hasWholeWord(t, mustHave) &&
        !hasWholeWord(t, exclude) &&
        !accessoryPhrases.some((ph) => t.includes(ph))
      );
    });
  } else if (isHeadphones) {
    categoryLabel = 'Audífonos';
    minPriceFloor = 100;
    const mustHave = ['audifono', 'audifonos', 'auricular', 'auriculares', 'headset', 'earbuds', 'buds', 'airpods'];
    const exclude = ['funda', 'estuche', 'almohadilla', 'adaptador', 'cable', 'celular', 'smartphone'];
    filtered = catalog.filter((p) => {
      const t = normalizeStr(p.title || p.nombre || '');
      const price = Number(p.discount_price || p.precio || 0);
      return price >= minPriceFloor && hasWholeWord(t, mustHave) && !hasWholeWord(t, exclude);
    });
  } else {
    const stopWords = new Set([
      'hola', 'tengo', 'un', 'una', 'unos', 'unas', 'el', 'la', 'los', 'las',
      'de', 'del', 'con', 'por', 'para', 'presupuesto', 'recomiendame', 'recomienda',
      'busco', 'quiero', 'dame', 'algun', 'alguna', 'bueno', 'buena', 'buenos',
      'buenas', 'barato', 'barata', 'maximo', 'hasta', 'menos', 'cuento', 'tienes', 'tienen'
    ]);
    const terms = norm
      .split(' ')
      .filter((w) => w.length >= 3 && !stopWords.has(w) && !/^\d+$/.test(w));

    categoryLabel = terms.join(' ');
    if (terms.length > 0) {
      filtered = catalog.filter((p) => {
        const t = normalizeStr(p.title || p.nombre || '');
        return terms.every((term) => new RegExp(`\\b${term}`, 'i').test(t));
      });
    }
  }

  if (requestedBrand && filtered.length > 0) {
    filtered = filtered.filter((p) => {
      const t = normalizeStr(p.title || p.nombre || '');
      return hasWholeWord(t, requestedBrand.required);
    });
  }

  if (budget && budget > 0 && filtered.length > 0) {
    const withinBudget = filtered.filter((p) => {
      const price = Number(p.discount_price || p.precio || 0);
      return price > 0 && price <= budget;
    });

    if (withinBudget.length > 0) {
      withinBudget.sort(
        (a, b) => Number(b.discount_price || b.precio || 0) - Number(a.discount_price || a.precio || 0)
      );
      return { status: 'FOUND', items: withinBudget, budget, categoryLabel };
    }

    filtered.sort(
      (a, b) => Number(a.discount_price || a.precio || 999999) - Number(b.discount_price || b.precio || 999999)
    );
    const cheapestPrice = Number(filtered[0].discount_price || filtered[0].precio || 0);
    return { status: 'OVER_BUDGET', items: [], budget, cheapestPrice, categoryLabel };
  }

  if (filtered.length > 0) {
    filtered.sort((a, b) => Number(b.discount_percentage || 0) - Number(a.discount_percentage || 0));
    return { status: 'FOUND', items: filtered, budget, categoryLabel };
  }

  return { status: 'NOT_FOUND_IN_CAT', items: [], budget, categoryLabel: categoryLabel || userText };
};

export default function ChatbotWidget({ isLight, cupones = [], products = [], isMobileDevice = false }) {
  const [showChatWindow, setShowChatWindow] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [localCupones, setLocalCupones] = useState([]);
  const [localProducts, setLocalProducts] = useState([]);
  const [visibleCounts, setVisibleCounts] = useState({});
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const chatEndRef = useRef(null);

  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'bot',
      text: '¡Hola! Soy tu asistente **CapiBaraML** 🐹. ¿Qué oferta, producto o cupón andas buscando hoy? ¡Dime qué buscas y tu presupuesto para conseguirte la mejor opción al instante! 🚀',
    },
  ]);

  useEffect(() => {
    const syncCatalog = async () => {
      try {
        const [cupRes, prodRes] = await Promise.all([
          axios.get(`${API}/offers?type=cupon&t=${Date.now()}`).catch(() => null),
          axios.get(`${API}/products?t=${Date.now()}`).catch(() => null),
        ]);
        if (cupRes && Array.isArray(cupRes.data)) {
          setLocalCupones(cupRes.data.map(decodeCouponIfNeeded));
        }
        if (prodRes && Array.isArray(prodRes.data)) {
          setLocalProducts(prodRes.data);
        }
      } catch (e) {}
    };

    syncCatalog();
    const interval = setInterval(syncCatalog, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (Array.isArray(cupones) && cupones.length > 0) {
      setLocalCupones(cupones.map(decodeCouponIfNeeded));
    }
  }, [cupones]);

  useEffect(() => {
    if (Array.isArray(products) && products.length > 0) {
      setLocalProducts(products);
    }
  }, [products]);

  const activeValidCupones = useMemo(() => {
    const now = Date.now();
    return localCupones.filter((c) => {
      if (!c) return false;
      if (!c.expires_at) return true;
      const expTime = new Date(c.expires_at).getTime();
      return isNaN(expTime) || expTime > now;
    });
  }, [localCupones]);

  const activeValidProducts = useMemo(() => {
    return localProducts.filter((p) => p && p.active !== false);
  }, [localProducts]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, showChatWindow, isTyping]);

  useEffect(() => {
    if (showChatWindow && window.innerWidth < 640) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showChatWindow]);

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

  const maskCode = (code) => {
    if (!code) return '';
    const str = String(code);
    const visibleLength = Math.max(3, Math.floor(str.length / 2));
    return str.substring(0, visibleLength) + '••••';
  };

  const handleCopiarIrMercadoLibre = (cupon) => {
    if (cupon.code) {
      navigator.clipboard.writeText(cupon.code);
    }
    playSniperSound();
    
    setToastMessage('¡Cupón copiado! Abriendo Mercado Libre 🚀');
    setShowToast(true);

    const linkDestino = cupon.link ? cupon.link : 'https://www.mercadolibre.com.mx';

    setTimeout(() => {
      setShowToast(false);
      window.open(linkDestino, '_blank', 'noopener,noreferrer');
    }, 1800); 
  };

  const handleCopyProductCoupon = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    playSniperSound();
    setToastMessage(`¡Cupón ${code} copiado al portapapeles! 🎟️`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  const handleLoadMoreProducts = (msgIndex) => {
    setVisibleCounts((prev) => ({
      ...prev,
      [msgIndex]: (prev[msgIndex] || 10) + 10,
    }));
  };

  const renderSocialLinksCard = () => {
    const socials = [
      { name: 'WhatsApp VIP', icon: FaWhatsapp, url: WHATSAPP_GROUP_LINK, color: 'bg-[#25D366] hover:bg-[#20bd5a]' },
      { name: 'Telegram', icon: FaTelegram, url: 'https://t.me/+QFHGS37AyAk5M2Ex', color: 'bg-[#229ED9] hover:bg-[#1a8ac2]' },
      { name: 'Facebook', icon: FaFacebook, url: 'https://www.facebook.com/share/1RpfPkSzit/', color: 'bg-[#1877F2] hover:bg-[#1367d5]' },
      { name: 'YouTube', icon: FaYoutube, url: 'https://www.youtube.com/@CazaOfertasML06', color: 'bg-[#FF0000] hover:bg-[#cc0000]' },
    ];

    return (
      <div className="flex flex-col gap-2.5 mt-1">
        <p className="text-xs font-black mb-0.5 leading-snug">
          ¡Únete gratis a nuestras redes y recibe errores de precio y cupones flash antes que nadie! 🚀
        </p>
        <div className="grid grid-cols-2 gap-2">
          {socials.map((s, idx) => {
            const Icon = s.icon;
            return (
              <a
                key={idx}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={playSniperSound}
                className={`${s.color} text-white p-2.5 rounded-xl flex items-center gap-2 font-black text-[11px] shadow-md transition-transform hover:scale-105 border border-black/30`}
              >
                <Icon size={18} className="flex-shrink-0" />
                <span className="truncate">{s.name}</span>
              </a>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMercadoPagoTerminalCard = () => {
    return (
      <div className="flex flex-col gap-2.5 mt-1">
        <p className="text-xs font-black leading-snug">
          ¡Acepta tarjetas en tu negocio con Terminal Point de Mercado Pago con descuento exclusivo! 💳🚀
        </p>
        <div className="bg-[#009EE3] text-white border-2 border-black rounded-2xl p-3.5 shadow-xl flex flex-col gap-2.5">
          <div className="flex items-center justify-center gap-1.5 font-black text-[11px] uppercase bg-black/30 py-1.5 px-3 rounded-lg tracking-wide">
            <CreditCard className="w-4 h-4 shrink-0" /> Terminales Point Mercado Pago
          </div>
          <p className="text-[11px] font-bold text-white/95 leading-snug">
            Sin renta mensual ni RFC. Recibe tu dinero al instante, envío gratis y tarjeta Debit Mastercard® incluida.
          </p>
          <a
            href={MP_POINT_LINK}
            target="_blank"
            rel="noopener noreferrer"
            onClick={playSniperSound}
            className="w-full bg-[#FFE600] hover:bg-yellow-300 text-black font-black py-2.5 px-3 rounded-xl text-xs uppercase flex items-center justify-center gap-1.5 transition-transform hover:scale-105 shadow-md border-2 border-black"
          >
            <ExternalLink size={15} /> Elegir Terminal con Descuento
          </a>
        </div>
      </div>
    );
  };

  const renderCuponesDirectCards = (customList = null, budgetAsked = null) => {
    const listToRender = customList || activeValidCupones;

    if (!listToRender || listToRender.length === 0) {
      return (
        <div className="flex flex-col gap-2.5">
          <div className="p-3 bg-neutral-900 text-yellow-400 rounded-xl text-xs font-bold text-center border border-yellow-400/30">
            {budgetAsked
              ? `⚡ Por ahora no tenemos un cupón activo aplicable para $${budgetAsked.toLocaleString('en-US')}.`
              : '⚡ No hay cupones activos en este momento. ¡Únete a nuestro WhatsApp para avisarte en cuanto salgan!'}
          </div>
          <a
            href={WHATSAPP_GROUP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#25D366] text-black font-black py-2.5 px-3 rounded-xl text-xs uppercase flex items-center justify-center gap-2 border-2 border-black shadow"
          >
            <FaWhatsapp size={16} /> Avisarme en WhatsApp
          </a>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-3 mt-1">
        <p className="text-xs font-black leading-snug">
          {budgetAsked
            ? `¡Estos cupones aplican perfecto para tu compra de $${budgetAsked.toLocaleString('en-US')}! 🎟️🔥`
            : '¡Aquí tienes los cupones activos disponibles hoy! Toca para copiar e ir directo a Mercado Libre: 🎟️🔥'}
        </p>
        {listToRender.slice(0, 6).map((matchedCupon, idx) => {
          let cleanDesc = matchedCupon.description || '';
          let expDateStr = '';

          if (matchedCupon.expires_at) {
            try {
              expDateStr = new Date(matchedCupon.expires_at).toLocaleDateString('es-MX', {
                day: '2-digit',
                month: 'short',
              });
            } catch {}
          }

          return (
            <div key={idx} className="bg-[#FFEA00] text-black border-2 border-black rounded-2xl p-3 shadow-lg flex flex-col gap-2">
              <div className="font-black text-[11px] uppercase bg-black text-white py-1.5 px-2.5 rounded-lg text-center tracking-wide flex items-center justify-center gap-1.5">
                <Tag size={13} className="text-yellow-400 shrink-0" />
                <span className="truncate">{matchedCupon.title || 'Cupón Exclusivo'}</span>
              </div>
              <div className="bg-white/90 border border-black/20 rounded-xl p-2 flex flex-col gap-1 text-[11px] font-bold text-neutral-900">
                <p className="leading-tight">
                  {matchedCupon.min_purchase
                    ? `Compra mínima: $${Number(matchedCupon.min_purchase).toLocaleString('en-US')}${matchedCupon.max_discount ? ` | Tope: $${matchedCupon.max_discount}` : ''}`
                    : (cleanDesc || 'Válido en productos seleccionados de Mercado Libre.')}
                </p>
                {matchedCupon.code && (
                  <div className="text-center font-black text-xs bg-neutral-100 py-1 rounded border border-black/15 mt-0.5 font-mono">
                    CÓDIGO: <span className="text-purple-700 tracking-wider">{maskCode(matchedCupon.code)}</span>
                  </div>
                )}
                {expDateStr && (
                  <div className="text-[10px] font-black text-neutral-600 flex items-center justify-center gap-1">
                    ⏰ Vigencia estimada: {expDateStr}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleCopiarIrMercadoLibre(matchedCupon)}
                className="w-full bg-[#22a947] hover:bg-[#1c8e3b] text-white font-black py-2 px-3 rounded-full text-[11px] uppercase flex items-center justify-center gap-1.5 transition-transform hover:scale-[1.02] active:scale-95 shadow-md cursor-pointer"
              >
                <span>Copiar cupón e ir a comprar</span>
                <ExternalLink size={13} strokeWidth={2.5} />
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  // ==========================================
  // TARJETAS DE PRODUCTOS (10 INICIALES + BOTÓN "VER MÁS" HASTA AGOTAR GALERÍA)
  // ==========================================
  const renderProductCards = (matchedList, introText, msgIndex) => {
    const visibleLimit = visibleCounts[msgIndex] || 10;
    const visibleItems = matchedList.slice(0, visibleLimit);
    const remaining = matchedList.length - visibleItems.length;

    return (
      <div className="flex flex-col gap-3 mt-1">
        <p className="text-xs font-black leading-snug">{renderMessageTextWithFormat(introText)}</p>
        <p className="text-[10px] font-bold opacity-75 -mt-1.5">
          Mostrando {visibleItems.length} de {matchedList.length} ofertas encontradas
        </p>

        {visibleItems.map((prod, idx) => {
          const title = prod.title || prod.nombre || 'Oferta Destacada';
          const finalPrice = Number(prod.discount_price || prod.precio || 0);
          const origPrice = Number(prod.original_price || 0);
          const link = prod.affiliate_link || prod.link || prod.url || ML_SEARCH_AFFILIATE;

          return (
            <div
              key={idx}
              className="bg-white text-gray-900 border-2 border-black rounded-2xl p-3 shadow-lg flex flex-col gap-2"
            >
              <div className="flex gap-2.5 items-center">
                {prod.image_url && (
                  <img
                    src={prod.image_url}
                    alt=""
                    className="w-16 h-16 object-contain rounded-xl border border-gray-200 bg-white p-1 shrink-0"
                  />
                )}
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-black text-gray-900 line-clamp-2 leading-tight">
                    {title}
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1 flex-wrap">
                    {finalPrice > 0 && (
                      <span className="text-base font-black text-green-600">
                        ${finalPrice.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                      </span>
                    )}
                    {origPrice > finalPrice && (
                      <span className="text-[11px] font-bold text-gray-400 line-through">
                        ${origPrice.toLocaleString('en-US')}
                      </span>
                    )}
                    {prod.discount_percentage && (
                      <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md">
                        -{prod.discount_percentage}%
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {prod.coupon && (
                <button
                  type="button"
                  onClick={() => handleCopyProductCoupon(prod.coupon)}
                  className="w-full bg-yellow-100 hover:bg-yellow-200 border border-dashed border-yellow-600 text-yellow-900 rounded-lg py-1 px-2 text-[10px] font-black flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Copy size={11} /> Cupón extra: {prod.coupon} (Clic para copiar)
                </button>
              )}

              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={playSniperSound}
                className="w-full bg-[#22a947] hover:bg-[#1c8e3b] text-white font-black py-2 px-3 rounded-full text-[11px] uppercase flex items-center justify-center gap-1.5 shadow transition-transform hover:scale-[1.02]"
              >
                <ShoppingBag size={13} /> Ver Oferta en Mercado Libre
              </a>
            </div>
          );
        })}

        {remaining > 0 && (
          <button
            type="button"
            onClick={() => handleLoadMoreProducts(msgIndex)}
            className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black py-2.5 px-3 rounded-xl text-xs uppercase flex items-center justify-center gap-1.5 border-2 border-black shadow-md transition-transform hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            <span>Ver más ofertas ({remaining} disponibles) 👇</span>
          </button>
        )}
      </div>
    );
  };

  // ==========================================
  // TARJETA DE BÚSQUEDA EXTERNA + CONTACTO DIRECTO A TU WHATSAPP (3312229710)
  // ==========================================
  const renderExternalSearchCard = (queryText, customReason = null) => {
    const waDirectText = `Hola, estoy buscando "${queryText}" en CapiBaraML. ¿Me puedes ayudar a rastrear la mejor oferta o cupón? 🐹`;
    const waDirectUrl = `https://wa.me/${WHATSAPP_PERSONAL_NUMBER}?text=${encodeURIComponent(waDirectText)}`;

    return (
      <div className="flex flex-col gap-2.5 mt-1">
        <p className="text-xs font-bold leading-snug">
          {customReason || (
            <>
              Ahorita mismo no tengo cargado en nuestra vitrina un artículo exacto de <strong>"{queryText}"</strong>, ¡pero escríbenos directo a nuestro WhatsApp y nuestro equipo te lo rastrea al mejor precio! 🐹🔥
            </>
          )}
        </p>
        <a
          href={waDirectUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={playSniperSound}
          className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-black py-2.5 px-3 rounded-xl text-[11px] uppercase flex items-center justify-center gap-1.5 border-2 border-black shadow"
        >
          <FaWhatsapp size={16} /> Pedir por WhatsApp (33 1222 9710)
        </a>
        <a
          href={ML_SEARCH_AFFILIATE}
          target="_blank"
          rel="noopener noreferrer"
          onClick={playSniperSound}
          className="w-full bg-[#FFE600] hover:bg-yellow-300 text-black font-black py-2.5 px-3 rounded-xl text-[11px] uppercase flex items-center justify-center gap-1.5 border-2 border-black shadow"
        >
          <Search size={14} /> Buscar "{queryText}" en Mercado Libre
        </a>
        <a
          href={WHATSAPP_GROUP_LINK}
          target="_blank"
          rel="noopener noreferrer"
          onClick={playSniperSound}
          className="w-full bg-neutral-900 hover:bg-neutral-800 text-[#25D366] font-black py-2 px-3 rounded-xl text-[10px] uppercase flex items-center justify-center gap-1.5 border border-[#25D366]/50 shadow"
        >
          <FaWhatsapp size={14} /> Unirme al Grupo VIP de Ofertas
        </a>
      </div>
    );
  };

  const renderMessageTextWithFormat = (text) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+[^.,;!?)\]])/g;
    const parts = text.split(urlRegex);
    
    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <div key={`link-btn-${index}`} className="my-2">
            <a
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              onClick={playSniperSound}
              className="inline-flex items-center gap-1.5 bg-[#22a947] hover:bg-[#1c8e3b] text-white font-black px-3.5 py-2 rounded-full text-xs shadow-md transition-transform hover:scale-105"
            >
              <ShoppingBag size={14} /> Ver Oferta en Mercado Libre 🚀
            </a>
          </div>
        );
      }
      
      const boldParts = part.split(/\*\*(.*?)\*\*/g);
      return boldParts.map((bPart, bIndex) => {
        if (bIndex % 2 === 1) {
          return (
            <strong 
              key={`bold-${index}-${bIndex}`} 
              className={isLight ? 'text-purple-700 font-black' : 'text-yellow-400 font-black'}
            >
              {bPart}
            </strong>
          );
        }
        return <span key={`text-${index}-${bIndex}`}>{bPart}</span>;
      });
    });
  };

  const renderMessageWithCouponCards = (msg, msgIndex) => {
    if (msg.isSocialLinks) return renderSocialLinksCard();
    if (msg.isMercadoPagoCard) return renderMercadoPagoTerminalCard();
    if (msg.isCuponesCard) return renderCuponesDirectCards(msg.customCupones, msg.budgetAsked);
    if (msg.isProductCards) return renderProductCards(msg.matchedProducts, msg.introText, msgIndex);
    if (msg.isExternalSearch) return renderExternalSearchCard(msg.searchQuery, msg.customReason);

    const text = msg.text || '';
    return <div>{renderMessageTextWithFormat(text)}</div>;
  };

  const processAndSendMessage = async (textToSend) => {
    if (!textToSend.trim()) return;

    const userText = textToSend.trim();
    const lowerText = normalizeStr(userText);

    const newHistory = [...chatMessages, { sender: 'user', text: userText }];
    setChatMessages(newHistory);
    setInputMessage('');
    setIsTyping(true);

    // 0. Preguntas sobre qué hace / para qué sirve el bot
    const isAboutBot =
      lowerText.includes('para que sirves') ||
      lowerText.includes('cual es tu funcion') ||
      lowerText.includes('que haces') ||
      lowerText.includes('que se supone que haces') ||
      lowerText.includes('como me puedes ayudar') ||
      lowerText.includes('como me ayudas') ||
      lowerText.includes('que puedes hacer') ||
      lowerText.includes('como funcionas') ||
      lowerText.includes('como funciona') ||
      lowerText.includes('quien eres') ||
      lowerText.includes('que eres') ||
      hasWholeWord(lowerText, ['funcion', 'sirves', 'duda', 'dudas', 'ayuda']);

    if (isAboutBot) {
      setTimeout(() => {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            text:
              '¡Hola! Soy **CapiBaraML** 🐹, tu cazador personal de ofertas. Mi misión es **ahorrarte dinero y tiempo** al comprar en Mercado Libre:\n\n' +
              '🔍 **Busco por ti:** Dime qué producto necesitas y tu presupuesto (ej. *"laptop de $10,000"* o *"iPhone"*) y te muestro las mejores ofertas reales.\n' +
              '🎟️ **Cupones activos:** Te paso los códigos de descuento vigentes del día listos para copiar.\n' +
              '🔥 **Remates verificados:** Monitoreamos precios bajos y liquidaciones 24/7.\n' +
              '💬 **Atención directa:** Si no tenemos lo que buscas en vitrina, te conecto con nuestro equipo por WhatsApp para rastrearlo al mejor precio.\n\n' +
              '¿Qué oferta te gustaría buscar ahorita? 🚀',
          },
        ]);
        setIsTyping(false);
      }, 250);
      return;
    }

    if (hasWholeWord(lowerText, ['whatsapp', 'telegram', 'facebook', 'youtube', 'redes', 'grupo', 'grupos', 'canal', 'canales'])) {
      setTimeout(() => {
        setChatMessages((prev) => [...prev, { sender: 'bot', isSocialLinks: true }]);
        setIsTyping(false);
      }, 250);
      return;
    }

    if (hasWholeWord(lowerText, ['terminal', 'terminales', 'point', 'lector', 'mercado pago'])) {
      setTimeout(() => {
        setChatMessages((prev) => [...prev, { sender: 'bot', isMercadoPagoCard: true }]);
        setIsTyping(false);
      }, 250);
      return;
    }

    if (hasWholeWord(lowerText, ['cupon', 'cupones', 'codigo', 'codigos'])) {
      setTimeout(() => {
        setChatMessages((prev) => [...prev, { sender: 'bot', isCuponesCard: true }]);
        setIsTyping(false);
      }, 250);
      return;
    }

    let catalogToSearch = activeValidProducts;
    if (catalogToSearch.length === 0) {
      try {
        const res = await axios.get(`${API}/products?t=${Date.now()}`, { timeout: 12000 });
        if (Array.isArray(res.data)) {
          setLocalProducts(res.data);
          catalogToSearch = res.data.filter((p) => p && p.active !== false);
        }
      } catch (e) {}
    }

    if (lowerText.includes('ofertas top') || lowerText.includes('destacados') || lowerText.includes('mejores ofertas')) {
      if (catalogToSearch.length > 0) {
        const topProducts = [...catalogToSearch]
          .sort((a, b) => Number(b.discount_percentage || 0) - Number(a.discount_percentage || 0));
        setChatMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            isProductCards: true,
            matchedProducts: topProducts,
            introText: '🔥 ¡Estas son las ofertas con mayor descuento disponibles ahora mismo en nuestra página!',
          },
        ]);
        setIsTyping(false);
        return;
      }
    }

    // 1. Búsqueda estricta por categoría, marca, piso de precio y presupuesto
    const catalogResult = filterStrictCatalog(userText, catalogToSearch);

    if (catalogResult.status === 'FOUND') {
      const intro = catalogResult.budget
        ? `¡Aquí tienes las mejores opciones de **${catalogResult.categoryLabel}** dentro de tu presupuesto de **$${catalogResult.budget.toLocaleString('en-US')}**! 🐹🔥`
        : `¡Aquí tienes las mejores opciones de **${catalogResult.categoryLabel}** en nuestra vitrina! 🐹🔥`;

      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          isProductCards: true,
          matchedProducts: catalogResult.items,
          introText: intro,
        },
      ]);
      setIsTyping(false);
      return;
    }

    if (catalogResult.status === 'OVER_BUDGET') {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          isExternalSearch: true,
          searchQuery: `${catalogResult.categoryLabel} hasta $${catalogResult.budget}`,
          customReason: (
            <>
              Por <strong>${catalogResult.budget.toLocaleString('en-US')}</strong> no tenemos <strong>{catalogResult.categoryLabel}</strong> en nuestra vitrina ahorita (los que tenemos arrancan desde <strong>${catalogResult.cheapestPrice.toLocaleString('en-US')}</strong> 😅). ¡Escríbenos directo por WhatsApp y te rastreamos una opción en tu presupuesto! 👇
            </>
          ),
        },
      ]);
      setIsTyping(false);
      return;
    }

    if (catalogResult.status === 'NOT_FOUND_IN_CAT') {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          isExternalSearch: true,
          searchQuery: catalogResult.categoryLabel || userText,
        },
      ]);
      setIsTyping(false);
      return;
    }

    // 2. Consulta conversacional general a la IA
    const cleanProductsCatalog = catalogToSearch.slice(0, 25).map((p) => ({
      title: String(p.title || p.nombre || ''),
      price: Number(p.discount_price || p.precio || 0),
      link: String(p.affiliate_link || p.link || p.url || ''),
    }));

    try {
      const response = await axios.post(
        `${API}/chat`,
        {
          message: userText,
          history: [{ sender: 'user', text: userText }],
          systemPrompt: SYSTEM_PROMPT,
          products: cleanProductsCatalog,
        },
        { timeout: 20000 }
      );

      const botReply = response.data?.reply?.trim();

      if (botReply) {
        const cleanReply = sanitizeBotReply(botReply);
        setChatMessages((prev) => [
          ...prev,
          { sender: 'bot', text: cleanReply },
        ]);
      } else {
        throw new Error('Respuesta vacía');
      }
    } catch (error) {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          isExternalSearch: true,
          searchQuery: userText,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendChatMessage = (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    processAndSendMessage(inputMessage);
  };

  return (
    <>
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-[9999] bg-[#FFEA00] text-black border-4 border-black px-4 py-3 rounded-2xl shadow-2xl font-black text-xs uppercase w-[90%] max-w-sm text-center"
          >
            {toastMessage}
          </motion.div>
        )}

        {showChatWindow && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.94 }}
            transition={{ type: 'spring', damping: 24, stiffness: 300 }}
            className={`fixed inset-x-2 bottom-2 top-[56px] sm:inset-auto sm:right-5 sm:bottom-24 z-[95] w-auto sm:w-[390px] md:w-[410px] h-[calc(100dvh-64px)] sm:h-[600px] sm:max-h-[82vh] rounded-3xl shadow-2xl border-2 overflow-hidden flex flex-col ${
              isLight
                ? 'bg-white border-yellow-400 text-gray-800'
                : 'bg-neutral-900 border-yellow-400/60 text-neutral-100'
            }`}
          >
            {/* ENCABEZADO DEL CHAT */}
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 px-3.5 py-3 sm:p-4 text-black flex items-center justify-between font-bold border-b-2 border-black shadow-sm shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black text-yellow-400 flex items-center justify-center shadow-inner shrink-0">
                  <Bot className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-black uppercase tracking-tight leading-tight truncate">
                    Asistente CapiBara IA 🐹
                  </p>
                  <span className="text-[10px] text-neutral-900 font-bold flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 bg-emerald-600 rounded-full animate-pulse shrink-0" />
                    <span className="truncate">En línea • Cazando descuentos</span>
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowChatWindow(false)}
                  title="Minimizar"
                  className="text-black hover:bg-black/10 rounded-full p-1.5 transition-colors flex items-center justify-center cursor-pointer"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowChatWindow(false)}
                  title="Cerrar"
                  className="text-black hover:bg-black/10 rounded-full p-1.5 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* BARRA DE ACCIONES RÁPIDAS (CHIPS TÁCTILES) */}
            <div
              className={`px-2.5 py-2 border-b flex gap-1.5 overflow-x-auto no-scrollbar shrink-0 ${
                isLight ? 'bg-yellow-50 border-gray-200' : 'bg-neutral-900 border-neutral-800'
              }`}
            >
              <button
                type="button"
                onClick={() => processAndSendMessage('¡Quiero un cupón de descuento urgente!')}
                className="whitespace-nowrap px-3 py-1.5 rounded-full bg-yellow-400 text-black font-black text-[11px] hover:bg-yellow-300 transition shadow-sm cursor-pointer shrink-0"
              >
                🎟️ Cupones Hoy
              </button>
              <button
                type="button"
                onClick={() => processAndSendMessage('Muéstrame las ofertas top')}
                className="whitespace-nowrap px-3 py-1.5 rounded-full bg-red-500 text-white font-black text-[11px] hover:bg-red-600 transition shadow-sm cursor-pointer shrink-0 flex items-center gap-1"
              >
                <Flame size={12} /> Ofertas Top
              </button>
              <button
                type="button"
                onClick={() => processAndSendMessage('¿Qué terminales Point de Mercado Pago me recomiendas?')}
                className="whitespace-nowrap px-3 py-1.5 rounded-full bg-blue-600 text-white font-black text-[11px] hover:bg-blue-500 transition shadow-sm cursor-pointer shrink-0"
              >
                💳 Terminales Point
              </button>
              <button
                type="button"
                onClick={() => processAndSendMessage('Pásame sus redes oficiales y WhatsApp')}
                className="whitespace-nowrap px-3 py-1.5 rounded-full bg-[#25D366] text-black font-black text-[11px] hover:bg-[#20bd5a] transition shadow-sm cursor-pointer shrink-0"
              >
                💬 WhatsApp y Redes
              </button>
            </div>

            {/* ÁREA DE MENSAJES */}
            <div
              className={`flex-1 p-3 sm:p-4 overflow-y-auto space-y-3.5 text-xs sm:text-sm whitespace-pre-line ${
                isLight ? 'bg-gray-50' : 'bg-neutral-950'
              }`}
            >
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${
                    msg.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[90%] sm:max-w-[85%] p-3 sm:p-3.5 rounded-2xl leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-black rounded-br-none font-bold shadow-md'
                        : isLight
                        ? 'bg-white text-gray-800 shadow-md rounded-bl-none border border-gray-200'
                        : 'bg-neutral-800 text-neutral-100 shadow-md rounded-bl-none border border-neutral-700'
                    }`}
                  >
                    {msg.sender === 'bot'
                      ? renderMessageWithCouponCards(msg, index)
                      : renderMessageTextWithFormat(msg.text)}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div
                    className={`px-4 py-3 rounded-2xl shadow-sm flex items-center gap-2 ${
                      isLight
                        ? 'bg-white text-gray-400'
                        : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                    }`}
                  >
                    <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* CAJA DE ENTRADA DE TEXTO */}
            <form
              onSubmit={handleSendChatMessage}
              className={`p-2.5 sm:p-3 border-t flex gap-2 shrink-0 ${
                isLight ? 'bg-white border-gray-200' : 'bg-neutral-900 border-neutral-800'
              }`}
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ej: laptop de 8000, iphone, pantalla..."
                className={`flex-1 min-w-0 px-3.5 py-2.5 sm:py-3 text-base sm:text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all ${
                  isLight
                    ? 'bg-gray-50 border-gray-300 text-gray-800'
                    : 'bg-neutral-950 border-neutral-700 text-neutral-100'
                }`}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isTyping}
                className="bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 disabled:hover:bg-yellow-400 text-black w-11 sm:w-12 rounded-xl font-bold flex items-center justify-center transition-all shadow-md cursor-pointer shrink-0 border border-black"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GLOBO DE SALUDO FLOTANTE */}
      {!showChatWindow && (
        <motion.div
          initial={{ opacity: 0, x: 20, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ delay: 1.5, type: 'spring', stiffness: 260, damping: 20 }}
          onClick={() => setShowChatWindow(true)}
          className="fixed right-[68px] sm:right-20 bottom-5 sm:bottom-6 z-40 cursor-pointer group flex items-center gap-2 pointer-events-auto"
        >
          <div className="bg-white text-black font-black text-[11px] sm:text-xs px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl shadow-xl border-2 border-black flex items-center gap-1.5 transition-transform group-hover:scale-105">
            <span>¡Hola! 👋</span>
            <span className="text-[10px] text-gray-700 font-bold">¿Buscas ofertas?</span>
          </div>
          <div className="w-2 h-2 bg-white border-r-2 border-b-2 border-black transform rotate-[-45deg] -ml-3"></div>
        </motion.div>
      )}

      {/* BOTÓN FLOTANTE PRINCIPAL (FAB) */}
      <motion.button
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.2, type: 'spring' }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        id="chatbot-fab"
        data-chatbot-slot="customer-service"
        onClick={() => setShowChatWindow(!showChatWindow)}
        className="fixed right-3.5 sm:right-5 bottom-4 sm:bottom-5 z-50 group cursor-pointer pointer-events-auto"
        aria-label="Abrir chat de atención"
      >
        <span className="absolute inset-0 rounded-full bg-yellow-400/40 blur-xl group-hover:blur-2xl transition" />
        <span className="relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 text-black shadow-2xl shadow-yellow-400/50 border-2 border-black">
          <Bot className="w-6 h-6" strokeWidth={2.5} />
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-neutral-950 animate-pulse" />
        </span>
      </motion.button>
    </>
  );
}
