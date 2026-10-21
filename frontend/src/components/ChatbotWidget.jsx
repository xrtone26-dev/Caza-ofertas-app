import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, X, Copy, Minus, CreditCard, ExternalLink, Tag } from 'lucide-react';
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

// System Prompt conversacional, amigable y flexible
const SYSTEM_PROMPT = `
Eres CapiBaraML 🐹, el asistente virtual oficial de CapiBaraML WEB. 

TU PERSONALIDAD Y TONO DE VOZ:
- Eres sumamente amigable, simpático, cómico, educado y cercano.
- Responde siempre con entusiasmo, buena vibra y naturalidad a cualquier pregunta, broma, duda o saludo del usuario.
- Habla en español latino, usando emojis de forma moderada pero divertida (🚀, ✨, 🐹, 🎟️).
- Si el usuario te hace una broma o comentario informal, síguele la plática de forma ingeniosa y amigable.

REGLAS STRICTAS DE FORMATO:
1. NUNCA generes tablas en Markdown (prohibido usar | Código | Descuento |).
2. NUNCA escribas URLs o enlaces largos en el texto plano.
3. Sé conciso y claro (máximo 2 a 3 párrafos cortos por respuesta).
`;

export default function ChatbotWidget({ isLight, cupones = [] }) {
  const [showChatWindow, setShowChatWindow] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [localCupones, setLocalCupones] = useState(cupones);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const chatEndRef = useRef(null);

  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'bot',
      text: '¡Hola! Soy tu asistente de **CapiBaraML** 🐹. ¿En qué te puedo ayudar hoy o qué descuento andas buscando?',
    },
  ]);

  useEffect(() => {
    const wakeUpServer = async () => {
      try {
        await axios.get(`${API}/offers?type=cupon`);
      } catch (e) {}
    };
    wakeUpServer();
    const interval = setInterval(wakeUpServer, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const hasSeenChat = sessionStorage.getItem('hasSeenChatPopup');
    if (!hasSeenChat) {
      const timer = setTimeout(() => {
        // REGLA DE ORO: No eliminar código, solo comentar. 
        // setShowChatWindow(true); 
        sessionStorage.setItem('hasSeenChatPopup', 'true');
      }, 12000); 
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (cupones && cupones.length > 0) {
      setLocalCupones(cupones);
    } else {
      axios.get(`${API}/offers?type=cupon`)
        .then((res) => setLocalCupones(res.data))
        .catch(() => {});
    }
  }, [cupones]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, showChatWindow, isTyping]);

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

  // Función para ocultar parcialmente el código con asteriscos
  const maskCode = (code) => {
    if (!code) return '';
    const visibleLength = Math.max(2, Math.floor(code.length / 2));
    return code.substring(0, visibleLength) + '*'.repeat(code.length - visibleLength);
  };

  const handleCopiarIrMercadoLibre = (cupon) => {
    if (cupon.code) {
      navigator.clipboard.writeText(cupon.code);
    }
    playSniperSound();
    
    // Pop-up de confirmación
    setToastMessage('¡Cupón copiado al portapapeles! Abriendo Mercado Libre en 3 segundos 🚀');
    setShowToast(true);

    const linkDestino = cupon.link ? cupon.link : 'https://www.mercadolibre.com.mx';

    // Retraso exacto de 3 segundos
    setTimeout(() => {
      setShowToast(false);
      window.open(linkDestino, '_blank', 'noopener,noreferrer');
    }, 3000); 
  };

  const renderSocialLinksCard = () => {
    const socials = [
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

    return (
      <div className="flex flex-col gap-2.5 mt-1">
        <p className="text-xs font-black mb-1">¡Únete a nuestras páginas y canales oficiales! 🚀</p>
        <div className="grid grid-cols-2 gap-2">
          {socials.map((s, idx) => {
            const Icon = s.icon;
            return (
              <a
                key={idx}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`${s.color} text-white p-2.5 rounded-xl flex items-center gap-2 font-black text-xs shadow-md transition-transform hover:scale-105 border border-black/30`}
              >
                <Icon size={20} className="flex-shrink-0" />
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
        <p className="text-xs font-black text-white">¡Adquiere tu Terminal Point de Mercado Pago con descuento exclusivo y comisión preferencial! 💳🚀</p>
        <div className="bg-[#009EE3] text-white border-2 border-black rounded-2xl p-4 shadow-xl flex flex-col gap-3">
          <div className="flex items-center gap-2 font-black text-xs uppercase bg-black/30 py-1.5 px-3 rounded-lg text-center tracking-wide">
            <CreditCard className="w-4 h-4" /> Terminales Point Mercado Pago
          </div>
          <p className="text-xs font-bold text-white/90 leading-tight">
            Acepta todas las tarjetas de crédito, débito y vales con la tarifa más baja del mercado. ¡Incluye envío gratis y cuenta digital sin costo!
          </p>
          <a
            href={MP_POINT_LINK}
            target="_blank"
            rel="noopener noreferrer"
            onClick={playSniperSound}
            className="w-full bg-black hover:bg-neutral-900 text-[#009EE3] font-black py-3 px-4 rounded-xl text-xs uppercase flex items-center justify-center gap-2 transition-transform hover:scale-105 shadow-md border border-black"
          >
            <ExternalLink size={16} /> Ver Terminales con Descuento 🚀
          </a>
        </div>
      </div>
    );
  };

  const renderCuponesDirectCards = () => {
    if (!localCupones || localCupones.length === 0) {
      return (
        <div className="p-3 bg-neutral-800 text-yellow-400 rounded-xl text-xs font-bold text-center border border-yellow-400/30">
          ⚡ No hay cupones activos guardados en este momento. ¡Revisa nuevamente en unos minutos!
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-3 mt-1">
        <p className="text-xs font-black text-white">¡Aquí tienes los cupones activos disponibles para ahorrar hoy! 🎟️🔥</p>
        {localCupones.map((matchedCupon, idx) => {
          let cleanDesc = matchedCupon.description || '';
          let expDateStr = '';

          const expMatch = cleanDesc.match(/\|\|exp:(.*?)\|\|/);
          if (expMatch) {
            expDateStr = expMatch[1].split('T')[0];
            cleanDesc = cleanDesc.replace(/\|\|exp:.*?\|\|/g, '').trim();
          } else if (matchedCupon.expires_at) {
            expDateStr = new Date(matchedCupon.expires_at).toISOString().split('T')[0];
          }

          return (
            <div key={idx} className="bg-[#FFEA00] text-black border-2 border-black rounded-2xl p-3.5 shadow-lg flex flex-col gap-2">
              <div className="font-black text-xs uppercase bg-black text-white py-1.5 px-3 rounded-lg text-center tracking-wide flex items-center justify-center gap-1.5">
                <Tag size={14} className="text-yellow-400" /> {matchedCupon.title || 'Cupón Exclusivo'}
              </div>
              <div className="bg-white/80 border border-black/20 rounded-xl p-2 flex flex-col gap-1 text-xs font-bold text-neutral-900">
                {cleanDesc ? (
                  <p className="leading-tight">{cleanDesc}</p>
                ) : (
                  <p className="leading-tight">Aprovecha este descuento especial en Mercado Libre.</p>
                )}
                {matchedCupon.code && (
                  <div className="text-center font-black text-sm bg-neutral-100 py-1 rounded border border-black/10 mt-1">
                    CÓDIGO: <span className="text-purple-700 tracking-wider">{maskCode(matchedCupon.code)}</span>
                  </div>
                )}
                {expDateStr && (
                  <div className="text-[11px] font-black text-neutral-700 mt-1 flex items-center justify-center gap-1">
                    ⏰ Expira: {expDateStr}
                  </div>
                )}
              </div>
              <button
                onClick={() => handleCopiarIrMercadoLibre(matchedCupon)}
                className="w-full bg-black hover:bg-neutral-900 text-[#FFEA00] font-black py-2.5 px-3 rounded-xl text-xs uppercase flex items-center justify-center gap-2 transition-transform hover:scale-105 shadow border border-black cursor-pointer"
              >
                <Copy size={14} /> Copiar Código e Ir a Meli 🚀
              </button>
            </div>
          );
        })}
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
          <a
            key={`link-${index}`}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-yellow-400 underline hover:text-yellow-300 break-all font-black transition-colors"
          >
            {part}
          </a>
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
    if (msg.isSocialLinks) {
      return renderSocialLinksCard();
    }

    if (msg.isMercadoPagoCard) {
      return renderMercadoPagoTerminalCard();
    }

    if (msg.isCuponesCard) {
      return renderCuponesDirectCards();
    }

    const text = msg.text || '';
    return <div>{renderMessageTextWithFormat(text)}</div>;
  };

  const processAndSendMessage = async (textToSend) => {
    if (!textToSend.trim()) return;

    const userText = textToSend;
    const lowerText = userText.toLowerCase().trim();
    const newHistory = [...chatMessages, { sender: 'user', text: userText }];
    setChatMessages(newHistory);
    setInputMessage('');
    setIsTyping(true);

    // 1. Detección estricta de solicitud de cupones / ofertas
    if (
      lowerText.includes('cupón') ||
      lowerText.includes('cupon') ||
      lowerText.includes('cupones') ||
      lowerText.includes('descuento') ||
      lowerText.includes('descuentos') ||
      lowerText.includes('código') ||
      lowerText.includes('codigo') ||
      lowerText.includes('codigos')
    ) {
      setTimeout(() => {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            isCuponesCard: true,
          },
        ]);
        setIsTyping(false);
      }, 400);
      return;
    }

    // 2. Detección estricta de redes sociales y grupos
    if (
      lowerText.includes('unirse') ||
      lowerText.includes('grupo') ||
      lowerText.includes('grupos') ||
      lowerText.includes('telegram') ||
      lowerText.includes('facebook') ||
      lowerText.includes('comunidad') ||
      lowerText.includes('links') ||
      lowerText.includes('páginas') ||
      lowerText.includes('redes')
    ) {
      setTimeout(() => {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            isSocialLinks: true,
          },
        ]);
        setIsTyping(false);
      }, 400);
      return;
    }

    // 3. Detección estricta de Terminales Mercado Pago / Point
    if (
      lowerText.includes('terminal') ||
      lowerText.includes('terminales') ||
      lowerText.includes('point') ||
      lowerText.includes('mercado pago') ||
      lowerText.includes('mercadopago') ||
      lowerText.includes('lectores')
    ) {
      setTimeout(() => {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            isMercadoPagoCard: true,
          },
        ]);
        setIsTyping(false);
      }, 400);
      return;
    }

    // 4. Consulta conversacional al backend para todo lo demás
    try {
      const response = await axios.post(
        `${API}/chat`,
        {
          message: userText,
          history: newHistory.slice(-6),
          systemPrompt: SYSTEM_PROMPT,
        },
        { timeout: 20000 }
      );

      const botReply =
        response.data && response.data.reply && response.data.reply.trim() !== ''
          ? response.data.reply
          : '¡Uy! Me quedé pensando un momento 🐹. Platícame bien qué buscas o dime si necesitas un cupón o una terminal Point.';

      setChatMessages((prev) => [
        ...prev,
        { sender: 'bot', text: botReply },
      ]);
    } catch (error) {
      console.error('Error al conectar con la API de chat:', error);
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: '¡Tranqui, que no cunda el pánico! 🐹 Tuve un pequeño parpadeo de señal, pero aquí sigo. ¿Qué producto o cupón andas buscando?',
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
            className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] bg-[#FFEA00] text-black border-4 border-black p-4 rounded-2xl shadow-2xl font-black text-xs uppercase max-w-sm text-center"
          >
            {toastMessage}
          </motion.div>
        )}

        {showChatWindow && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.9 }}
            className={`fixed left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 right-auto sm:right-5 bottom-16 sm:bottom-24 z-[90] w-[95%] sm:w-[380px] md:w-[400px] rounded-3xl shadow-2xl border overflow-hidden flex flex-col h-[82vh] sm:h-[600px] max-h-[650px] ${
              isLight ? 'bg-white border-yellow-300 text-gray-800' : 'bg-neutral-900 border-yellow-400/50 text-neutral-100'
            }`}
          >
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 p-4 text-black flex items-center justify-between font-bold border-b border-yellow-300 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-black text-yellow-400 flex items-center justify-center shadow-inner">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-black uppercase tracking-tight leading-tight">
                    Asistente Capibara IA 🐹
                  </p>
                  <span className="text-[10px] text-neutral-800 font-bold flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 bg-emerald-600 rounded-full animate-pulse" />
                    En línea - Listo para ahorrar
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
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

            <div className={`px-3 py-2 border-b flex gap-1.5 overflow-x-auto text-xs ${
              isLight ? 'bg-yellow-50 border-gray-200' : 'bg-neutral-900 border-neutral-800'
            }`}>
              <button
                onClick={() => processAndSendMessage('¡Quiero un cupón de descuento urgente!')}
                className="whitespace-nowrap px-3 py-1.5 rounded-full bg-yellow-400 text-black font-black text-[11px] hover:bg-yellow-300 transition shadow-sm cursor-pointer"
              >
                🎟️ ¡Quiero Cupones!
              </button>
              <button
                onClick={() => processAndSendMessage('¿Qué terminales Point de Mercado Pago me recomiendas?')}
                className="whitespace-nowrap px-3 py-1.5 rounded-full bg-blue-600 text-white font-black text-[11px] hover:bg-blue-500 transition shadow-sm cursor-pointer"
              >
                💳 Terminales Mercado Pago
              </button>
              <button
                onClick={() => processAndSendMessage('¡Muéstrame los links de todas nuestras páginas y redes oficiales!')}
                className="whitespace-nowrap px-3 py-1.5 rounded-full bg-neutral-800 text-yellow-400 border border-yellow-400/40 font-black text-[11px] hover:bg-neutral-700 transition cursor-pointer"
              >
                🏆 Unirme a Grupos
              </button>
            </div>

            <div
              className={`flex-1 p-4 overflow-y-auto space-y-4 text-sm whitespace-pre-line ${
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
                    className={`max-w-[85%] p-3.5 rounded-2xl leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-black rounded-br-none font-bold shadow-md'
                        : isLight
                        ? 'bg-white text-gray-800 shadow-md rounded-bl-none border border-gray-100'
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

            <form
              onSubmit={handleSendChatMessage}
              className={`p-3 flex gap-2 ${isLight ? 'bg-white' : 'bg-neutral-900'}`}
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Escribe lo que buscas..."
                className={`flex-1 px-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all ${
                  isLight
                    ? 'bg-gray-50 border-gray-200 text-gray-800'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-100'
                }`}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isTyping}
                className="bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 disabled:hover:bg-yellow-400 text-black w-12 rounded-xl font-bold flex items-center justify-center transition-all shadow-md cursor-pointer"
              >
                <Send className="w-5 h-5 ml-1" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {!showChatWindow && (
        <motion.div
          initial={{ opacity: 0, x: 20, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ delay: 1.5, type: 'spring', stiffness: 260, damping: 20 }}
          onClick={() => setShowChatWindow(true)}
          className="fixed right-16 sm:right-20 bottom-6 z-40 cursor-pointer group hidden sm:flex items-center gap-2 pointer-events-auto"
        >
          <div className="bg-white text-black font-black text-xs px-4 py-2.5 rounded-2xl shadow-xl border-2 border-black flex items-center gap-2 transition-transform group-hover:scale-105">
            <span>¡Hola! <span className="inline-block animate-wave origin-bottom-right">👋</span></span>
            <span className="text-[10px] text-gray-600 font-bold hidden sm:inline">¿Buscas descuento?</span>
          </div>
          <div className="w-2 h-2 bg-white border-r-2 border-b-2 border-black transform rotate-[-45deg] -ml-3 hidden sm:block"></div>
        </motion.div>
      )}

      <motion.button
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.2, type: 'spring' }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        id="chatbot-fab"
        data-chatbot-slot="customer-service"
        onClick={() => setShowChatWindow(!showChatWindow)}
        className="fixed right-5 bottom-5 z-40 group cursor-pointer"
        aria-label="Abrir chat de atención"
      >
        <span className="absolute inset-0 rounded-full bg-yellow-400/40 blur-xl group-hover:blur-2xl transition" />
        <span className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 text-black shadow-2xl shadow-yellow-400/50 border-2 border-yellow-300">
          <Bot className="w-6 h-6" strokeWidth={2.5} />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-neutral-950 animate-pulse" />
        </span>
      </motion.button>
    </>
  );
}
