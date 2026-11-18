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

const SYSTEM_PROMPT = `
Eres CapiBaraML 🐹, el asistente virtual y vendedor estrella oficial de CapiBaraML WEB. 

TU PERSONALIDAD Y TONO DE VOZ:
- Eres sumamente amigable, simpático, persuasivo, educado y cercano.
- Tu objetivo principal es VENDER y ayudar al usuario a ahorrar: recomienda productos exactos del catálogo, comparte cupones activos e invita a unirse al grupo oficial de WhatsApp para recibir ofertas flash.
- Respeta estrictamente la categoría que pide el usuario (celular es celular, pantalla es pantalla, laptop es laptop). Nunca mezcles categorías ni recomiendes accesorios o repuestos cuando piden un equipo completo.
- Habla en español latino, usando emojis de forma moderada pero divertida (🚀, ✨, 🐹, 🎟️, 🔥).

REGLAS ESTRICTAS DE FORMATO:
1. NUNCA generes tablas en Markdown.
2. Destaca los precios, descuentos y cupones de los productos que recomiendes.
3. Sé conciso, directo y persuasivo (máximo 3-4 líneas por respuesta).
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

const normalizeText = (str = '') =>
  String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export default function ChatbotWidget({ isLight, cupones = [], products = [], isMobileDevice = false }) {
  const [showChatWindow, setShowChatWindow] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [localCupones, setLocalCupones] = useState([]);
  const [localProducts, setLocalProducts] = useState([]);
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

  // ==========================================
  // TARJETA DE REDES SOCIALES Y GRUPOS
  // ==========================================
  const renderSocialLinksCard = () => {
    const socials = [
      {
        name: 'WhatsApp VIP',
        icon: FaWhatsapp,
        url: WHATSAPP_GROUP_LINK,
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

  // ==========================================
  // TARJETA DE TERMINALES POINT MERCADO PAGO
  // ==========================================
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

  // ==========================================
  // TARJETAS DE CUPONES ACTIVOS
  // ==========================================
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
  // TARJETAS DE PRODUCTOS FILTRADOS
  // ==========================================
  const renderProductCards = (matchedList, introText) => {
    return (
      <div className="flex flex-col gap-3 mt-1">
        <p className="text-xs font-black leading-snug">{introText}</p>
        {matchedList.slice(0, 5).map((prod, idx) => {
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
      </div>
    );
  };

  // ==========================================
  // TARJETA DE BÚSQUEDA EXTERNA + WHATSAPP
  // ==========================================
  const renderExternalSearchCard = (queryText, customReason = null) => (
    <div className="flex flex-col gap-2.5 mt-1">
      <p className="text-xs font-bold leading-snug">
        {customReason || (
          <>
            Ahorita mismo no tengo cargado en nuestra vitrina un artículo exacto de <strong>"{queryText}"</strong>, ¡pero puedes buscarlo directo con ofertas en Mercado Libre o pedirlo en nuestro WhatsApp VIP! 🐹🔥
          </>
        )}
      </p>
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
        className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-black py-2.5 px-3 rounded-xl text-[11px] uppercase flex items-center justify-center gap-1.5 border-2 border-black shadow"
      >
        <FaWhatsapp size={15} /> Pedir oferta en WhatsApp VIP
      </a>
    </div>
  );

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

  const renderMessageWithCouponCards = (msg) => {
    if (msg.isSocialLinks) return renderSocialLinksCard();
    if (msg.isMercadoPagoCard) return renderMercadoPagoTerminalCard();
    if (msg.isCuponesCard) return renderCuponesDirectCards(msg.customCupones, msg.budgetAsked);
    if (msg.isProductCards) return renderProductCards(msg.matchedProducts, msg.introText);
    if (msg.isExternalSearch) return renderExternalSearchCard(msg.searchQuery, msg.customReason);

    const text = msg.text || '';
    return <div>{renderMessageTextWithFormat(text)}</div>;
  };

  // ==========================================
  // EXTRACTOR DE PRESUPUESTO
  // ==========================================
  const extractBudgetFromText = (text) => {
    const clean = text.replace(/,/g, '');
    const patterns = [
      /(?:tengo|presupuesto|maximo|máximo|menos de|hasta|de|por|unos|entre)\s*\$?\s*(\d{2,6})/i,
      /\$\s*(\d{2,6})/i,
    ];
    for (const pat of patterns) {
      const m = clean.match(pat);
      if (m && m[1]) {
        const val = Number(m[1]);
        if (!isNaN(val) && val >= 50 && val <= 500000) return val;
      }
    }
    return null;
  };

  // ==========================================
  // FILTRADOR ESTRICTO DE HARDWARE (CERO ACCESORIOS FALSOS)
  // ==========================================
  const searchCatalogRigorous = (rawQuery) => {
    const normQuery = normalizeText(rawQuery);
    const budget = extractBudgetFromText(rawQuery);

    // Definición estricta de hardware real por categoría
    const categories = [
      {
        name: 'laptop',
        triggers: ['laptop', 'laptops', 'computadora', 'computadoras', 'notebook', 'macbook', 'pc escritorio', 'all in one'],
        // El título DEBE tener obligatoriamente al menos una especificación técnica de equipo completo
        mustHaveKeywords: ['laptop', 'notebook', 'computadora', 'macbook', 'chromebook', 'all in one'],
        hardwareSpecs: ['ram', 'ssd', 'hdd', 'intel', 'ryzen', 'core i', 'windows', 'gb', 'tb', 'ghz'],
        // Si el título incluye esto, se descarta (evita cables MagSafe, cargadores, micas, discos sueltos)
        forbiddenKeywords: ['cable', 'cargador', 'magsafe', 'funda', 'mochila', 'base', 'soporte', 'disco duro', 'ssd', 'hdd', 'memoria ram', 'mouse', 'teclado', 'lentes', 'gafas'],
        cleanLabel: 'Laptop / Computadora'
      },
      {
        name: 'celular',
        triggers: ['celular', 'celulares', 'telefono', 'telefonos', 'smartphone', 'smartphones', 'iphone', 'galaxy', 'xiaomi', 'motorola', 'nothing phone', 'redmi', 'poco'],
        mustHaveKeywords: ['celular', 'smartphone', 'telefono', 'iphone', 'galaxy', 'xiaomi', 'redmi', 'poco', 'motorola', 'moto', 'nothing phone', 'realme', 'honor'],
        hardwareSpecs: ['ram', 'rom', 'gb', 'mp', 'camara', 'dual sim', '5g', 'snapdragon', 'mediatek'],
        forbiddenKeywords: ['cable', 'cargador', 'funda', 'mica', 'cristal', 'audifono', 'audifonos', 'auricular', 'auriculares', 'soporte', 'base', 'reloj', 'smartwatch', 'tablet', 'ipad', 'control remoto', 'enchufe', 'interruptor', 'modul', 'sensor'],
        cleanLabel: 'Celular / Smartphone'
      },
      {
        name: 'pantalla',
        triggers: ['pantalla', 'pantallas', 'televisor', 'televisores', 'television', 'smart tv', 'tv'],
        mustHaveKeywords: ['smart tv', 'televisor', 'television', 'pantalla', 'roku tv', 'google tv', 'qled', 'oled', 'uhd', 'pulgadas'],
        hardwareSpecs: ['pulgadas', '4k', '8k', 'uhd', 'hdmi', 'smart tv', 'hz'],
        forbiddenKeywords: ['audifono', 'audifonos', 'auricular', 'auriculares', 'celular', 'smartphone', 'iphone', 'soporte', 'base', 'brazo', 'funda', 'mica', 'protector', 'reloj', 'smartwatch', 'tableta', 'ipad', 'power bank', 'bateria', 'sensor', 'control remoto', 'cable', 'estuche', 'nintendo'],
        cleanLabel: 'Pantalla / Smart TV'
      },
      {
        name: 'audifono',
        triggers: ['audifono', 'audifonos', 'auricular', 'auriculares', 'headset', 'earbuds', 'buds', 'airpods'],
        mustHaveKeywords: ['audifono', 'audifonos', 'auricular', 'auriculares', 'headset', 'earbuds', 'buds', 'airpods', 'diadema'],
        hardwareSpecs: ['bluetooth', 'inalámbricos', 'inalambricos', 'cancelacion', 'microfono', 'gamer', 'rgb', 'tws'],
        forbiddenKeywords: ['funda', 'estuche', 'almohadilla', 'adaptador', 'celular', 'smartphone', 'cable'],
        cleanLabel: 'Audífonos'
      },
      {
        name: 'tablet',
        triggers: ['tablet', 'tablets', 'ipad'],
        mustHaveKeywords: ['tablet', 'ipad', 'galaxy tab', 'redmi pad'],
        hardwareSpecs: ['ram', 'rom', 'gb', 'wifi', 'cellular'],
        forbiddenKeywords: ['funda', 'mica', 'lapiz', 'teclado', 'soporte'],
        cleanLabel: 'Tablet / iPad'
      },
      {
        name: 'smartwatch',
        triggers: ['reloj', 'smartwatch', 'band'],
        mustHaveKeywords: ['smartwatch', 'reloj inteligente', 'mi band', 'smart watch', 'amazfit', 'huawei watch'],
        hardwareSpecs: ['bluetooth', 'pulsometro', 'monitor', 'gps', 'ip68'],
        forbiddenKeywords: ['extensible', 'correa', 'mica', 'cargador'],
        cleanLabel: 'Smartwatch'
      }
    ];

    const matchedCat = categories.find((cat) =>
      cat.triggers.some((t) => new RegExp(`\\b${t}\\b`, 'i').test(normQuery))
    );

    let candidates = [];
    let cleanSearchLabel = rawQuery;

    if (matchedCat) {
      cleanSearchLabel = matchedCat.cleanLabel;
      candidates = activeValidProducts.filter((prod) => {
        const titleNorm = normalizeText(prod.title || prod.nombre || '');
        const descNorm = normalizeText(prod.description || '');
        const fullText = `${titleNorm} ${descNorm}`;

        // 1. Debe incluir palabra clave principal
        const hasMain = matchedCat.mustHaveKeywords.some((kw) => titleNorm.includes(kw));
        // 2. NUNCA debe incluir accesorios prohibidos en el título
        const hasForbidden = matchedCat.forbiddenKeywords.some((bad) => titleNorm.includes(bad));
        // 3. Verificamos que tenga alguna especificación técnica real en todo el texto del producto
        const hasSpec = matchedCat.hardwareSpecs.some((spec) => fullText.includes(spec));

        return hasMain && !hasForbidden && hasSpec;
      });
    } else {
      // Búsqueda general por términos limpios
      const stopWords = new Set([
        'hola', 'buenos', 'dias', 'tardes', 'noches', 'quiero', 'busco', 'tienes',
        'tienen', 'algun', 'alguna', 'algunos', 'unas', 'unos', 'para', 'con',
        'precio', 'oferta', 'ofertas', 'barato', 'baratos', 'comprar', 'ver',
        'me', 'puedes', 'recomendar', 'recomiendas', 'por', 'favor', 'de', 'la',
        'el', 'los', 'las', 'un', 'una', 'bueno', 'buena', 'buenos', 'tengo',
        'presupuesto', 'menos', 'hasta', 'como', 'que', 'hay', 'plana', 'tienes'
      ]);

      const keywords = normQuery
        .split(' ')
        .filter((w) => w.length >= 3 && !stopWords.has(w) && !/^\d+$/.test(w));

      if (keywords.length > 0) {
        candidates = activeValidProducts.filter((prod) => {
          const titleNorm = normalizeText(prod.title || prod.nombre || '');
          return keywords.slice(0, 2).every((kw) => titleNorm.includes(kw));
        });
      }
    }

    // Ordenar por precio ascendente
    candidates.sort((a, b) => {
      const pa = Number(a.discount_price || a.precio || 999999);
      const pb = Number(b.discount_price || b.precio || 999999);
      return pa - pb;
    });

    // Validar presupuesto
    if (budget && candidates.length > 0) {
      const withinBudget = candidates.filter((prod) => {
        const price = Number(prod.discount_price || prod.precio || 0);
        return price > 0 && price <= budget * 1.05;
      });

      if (withinBudget.length > 0) {
        return {
          status: 'FOUND',
          products: withinBudget,
          budget,
          cleanSearchLabel,
        };
      } else {
        const cheapest = candidates[0];
        const cheapestPrice = Number(cheapest.discount_price || cheapest.precio || 0);
        return {
          status: 'OVER_BUDGET',
          products: candidates.slice(0, 3),
          cheapestPrice,
          budget,
          cleanSearchLabel,
        };
      }
    }

    if (candidates.length > 0) {
      return {
        status: 'FOUND',
        products: candidates,
        budget,
        cleanSearchLabel,
      };
    }

    return {
      status: 'NOT_FOUND',
      products: [],
      budget,
      cleanSearchLabel,
    };
  };

  // ==========================================
  // PROCESADOR DE MENSAJES
  // ==========================================
  const processAndSendMessage = async (textToSend) => {
    if (!textToSend.trim()) return;

    const userText = textToSend.trim();
    const normText = normalizeText(userText);

    const newHistory = [...chatMessages, { sender: 'user', text: userText }];
    setChatMessages(newHistory);
    setInputMessage('');
    setIsTyping(true);

    // 1. Saludo
    if (/^(hola|buenas|buenos dias|buenas tardes|buenas noches|hey|que tal|que onda)$/.test(normText)) {
      setTimeout(() => {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: '¡Hola! 🐹👋 ¿Qué producto o cupón estás buscando hoy? Dime qué buscas y tu presupuesto para conseguirte la mejor opción al instante. 🚀',
          },
        ]);
        setIsTyping(false);
      }, 250);
      return;
    }

    // 2. Redes Sociales
    if (
      normText.includes('whatsapp') ||
      normText.includes('telegram') ||
      normText.includes('facebook') ||
      normText.includes('youtube') ||
      normText.includes('redes') ||
      normText.includes('grupo') ||
      normText.includes('canal') ||
      normText.includes('comunidad')
    ) {
      setTimeout(() => {
        setChatMessages((prev) => [
          ...prev,
          { sender: 'bot', isSocialLinks: true },
        ]);
        setIsTyping(false);
      }, 250);
      return;
    }

    // 3. Terminales Point
    if (
      normText.includes('terminal') ||
      normText.includes('point') ||
      normText.includes('lector') ||
      normText.includes('mercado pago') ||
      normText.includes('cobrar con tarjeta')
    ) {
      setTimeout(() => {
        setChatMessages((prev) => [
          ...prev,
          { sender: 'bot', isMercadoPagoCard: true },
        ]);
        setIsTyping(false);
      }, 250);
      return;
    }

    // 4. Ofertas Top
    if (
      normText.includes('ofertas top') ||
      normText.includes('destacados') ||
      normText.includes('mejores ofertas')
    ) {
      if (activeValidProducts.length > 0) {
        const topProducts = [...activeValidProducts]
          .sort((a, b) => Number(b.discount_percentage || 0) - Number(a.discount_percentage || 0))
          .slice(0, 5);
        setTimeout(() => {
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
        }, 250);
        return;
      }
    }

    // 5. Cupones
    const numericBudget = extractBudgetFromText(userText);
    if (
      normText.includes('cupon') ||
      normText.includes('codigo') ||
      (normText.includes('descuento') && !normText.includes('producto')) ||
      (numericBudget && (normText.includes('gastar') || normText.includes('compra')))
    ) {
      let filtered = activeValidCupones;
      if (numericBudget && numericBudget > 0) {
        filtered = activeValidCupones.filter((c) => {
          const min = Number(c.min_purchase || 0);
          return min === 0 || numericBudget >= min;
        });
      }

      setTimeout(() => {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            isCuponesCard: true,
            customCupones: filtered,
            budgetAsked: numericBudget,
          },
        ]);
        setIsTyping(false);
      }, 250);
      return;
    }

    // 6. Búsqueda rigurosa de hardware en el catálogo local
    const searchResult = searchCatalogRigorous(userText);

    if (searchResult.status === 'FOUND') {
      const intro = searchResult.budget
        ? `¡Mira estas opciones de **${searchResult.cleanSearchLabel}** dentro de tu presupuesto de **$${searchResult.budget.toLocaleString('en-US')}**! 🐹🔥`
        : `¡Mira lo que encontré de **${searchResult.cleanSearchLabel}** en nuestra vitrina de ofertas! 🐹🔥`;

      setTimeout(() => {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            isProductCards: true,
            matchedProducts: searchResult.products,
            introText: intro,
          },
        ]);
        setIsTyping(false);
      }, 300);
      return;
    }

    if (searchResult.status === 'OVER_BUDGET') {
      setTimeout(() => {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            isExternalSearch: true,
            searchQuery: `${searchResult.cleanSearchLabel} menos de $${searchResult.budget}`,
            customReason: (
              <>
                Por <strong>${searchResult.budget.toLocaleString('en-US')}</strong> no tenemos <strong>{searchResult.cleanSearchLabel}</strong> en nuestra vitrina ahorita (los equipos que tenemos arrancan desde <strong>${searchResult.cheapestPrice.toLocaleString('en-US')}</strong> 😅), ¡pero puedes buscar opciones económicas directo en Mercado Libre aquí! 👇
              </>
            ),
          },
        ]);
        setIsTyping(false);
      }, 300);
      return;
    }

    // 7. Fallback externo si no hay stock local exacto
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          isExternalSearch: true,
          searchQuery: searchResult.cleanSearchLabel,
        },
      ]);
      setIsTyping(false);
    }, 300);
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
                  onClick={() => setShowChatWindow(false)}
                  title="Minimizar"
                  className="text-black hover:bg-black/10 rounded-full p-1.5 transition-colors flex items-center justify-center cursor-pointer"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <button
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
                onClick={() => processAndSendMessage('¡Quiero un cupón de descuento urgente!')}
                className="whitespace-nowrap px-3 py-1.5 rounded-full bg-yellow-400 text-black font-black text-[11px] hover:bg-yellow-300 transition shadow-sm cursor-pointer shrink-0"
              >
                🎟️ Cupones Hoy
              </button>
              <button
                onClick={() => processAndSendMessage('Muéstrame las ofertas top')}
                className="whitespace-nowrap px-3 py-1.5 rounded-full bg-red-500 text-white font-black text-[11px] hover:bg-red-600 transition shadow-sm cursor-pointer shrink-0 flex items-center gap-1"
              >
                <Flame size={12} /> Ofertas Top
              </button>
              <button
                onClick={() => processAndSendMessage('¿Qué terminales Point de Mercado Pago me recomiendas?')}
                className="whitespace-nowrap px-3 py-1.5 rounded-full bg-blue-600 text-white font-black text-[11px] hover:bg-blue-500 transition shadow-sm cursor-pointer shrink-0"
              >
                💳 Terminales Point
              </button>
              <button
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
                      ? renderMessageWithCouponCards(msg)
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
                placeholder="Ej: laptop de 8000, iphone, pantalla de tv..."
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
