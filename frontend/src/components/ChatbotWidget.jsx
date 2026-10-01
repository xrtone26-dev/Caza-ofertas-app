import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, X, Copy, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const BACKEND_URL = 'https://caza-ofertas-backend.onrender.com';
const API = BACKEND_URL;

const SYSTEM_PROMPT = `
Rol e Identidad:
Eres CapiBaraML, el asistente virtual experto, conversacional, cómico y una bestia de ventas de CapiBaraML WEB 🚀✨. Tu misión es interactuar naturalmente con el usuario, responder sus dudas, dar recomendaciones de compra y entregar los códigos de cupones exactos de inmediato.

REGLAS DE INTERACCIÓN:
1. SALUDOS Y CONVERSACIÓN: Si el usuario solo saluda, devuélvele el saludo con energía y ofrécele el cupón sorpresa del día.
2. RESPUESTAS DE VENTAS: Sé persuasivo. En cada respuesta sobre productos, cupones o terminales Point, resalta el ahorro y empuja sutilmente al usuario a reclamar su beneficio en las tarjetas interactivas.

REGLAS CRÍTICAS PARA CUPONES Y OFERTAS:
3. ENTREGA DIRECTA: Si el usuario PIDE cupones o descuentos, entrégaselos de inmediato mencionando el código exacto y limpio. NUNCA uses asteriscos (*) para ocultar códigos.
4. PROHIBIDO ENVIAR ENLACES SUELTOS: Nunca escribas URLs en tus respuestas de texto. La redirección ocurre únicamente a través de la tarjeta interactiva que se despliega automáticamente.

Reglas de Comportamiento y Tono:
- Tono General: Directo, dinámico, cómico, vendedor y lleno de energía (✨).
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
      text: '¡Hola! Soy tu asistente de **CapiBaraML** 🐹. ¿Qué producto buscamos hoy o qué cupón necesitas?',
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
        setShowChatWindow(true);
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

  const handleCopiarIrMercadoLibre = (cupon) => {
    if (cupon.code) {
      navigator.clipboard.writeText(cupon.code);
    }
    playSniperSound();
    setToastMessage('¡Cupón copiado! Abriendo Mercado Libre en 5 segundos 🚀');
    setShowToast(true);

    const nuevaPestana = window.open('about:blank', '_blank');

    setTimeout(() => {
      setShowToast(false);
      const linkDestino = cupon.link ? cupon.link : 'https://www.mercadolibre.com.mx';
      
      if (nuevaPestana) {
        nuevaPestana.location.href = linkDestino;
      } else {
        window.location.href = linkDestino;
      }
    }, 5000); 
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

  const renderMessageWithCouponCards = (text) => {
    if (text.includes('canales oficiales') || text.includes('WhatsApp Grupo')) {
      return <div>{renderMessageTextWithFormat(text)}</div>;
    }

    const matchedCupones = localCupones.filter((c) => {
      if (!c.code) return false;
      const upperCode = c.code.toUpperCase();
      const upperText = text.toUpperCase();
      
      if (upperText.includes(upperCode)) return true;
      
      if (upperCode.length >= 4) {
        const maskedCode = upperCode.substring(0, 4) + '*';
        if (upperText.includes(maskedCode)) return true;
      }
      return false;
    });

    return (
      <div className="flex flex-col gap-3">
        <div>{renderMessageTextWithFormat(text)}</div>
        {matchedCupones.map((matchedCupon, idx) => {
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
            <div key={idx} className="bg-[#FFEA00] text-black border-2 border-black rounded-2xl p-3.5 shadow-lg flex flex-col gap-2 mt-2">
              <div className="font-black text-xs uppercase bg-black text-white py-1.5 px-3 rounded-lg text-center tracking-wide">
                🎟️ {matchedCupon.title || 'Cupón Exclusivo'}
              </div>
              <div className="bg-white/80 border border-black/20 rounded-xl p-2 flex flex-col gap-1 text-xs font-bold text-neutral-900">
                {cleanDesc ? (
                  <p className="leading-tight">{cleanDesc}</p>
                ) : (
                  <p className="leading-tight">Aprovecha este descuento especial en Mercado Libre.</p>
                )}
                {expDateStr && (
                  <div className="text-[11px] font-black text-neutral-700 mt-1 flex items-center justify-center gap-1">
                    ⏰ Expira: {expDateStr}
                  </div>
                )}
              </div>
              <button
                onClick={() => handleCopiarIrMercadoLibre(matchedCupon)}
                className="w-full bg-black hover:bg-neutral-900 text-[#FFEA00] font-black py-2.5 px-3 rounded-xl text-xs uppercase flex items-center justify-center gap-2 transition-transform hover:scale-105 shadow border border-black"
              >
                <Copy size={14} /> Copiar Código e Ir a Meli 🚀
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  const processAndSendMessage = async (textToSend) => {
    if (!textToSend.trim()) return;

    const userText = textToSend;
    const lowerText = userText.toLowerCase();
    const newHistory = [...chatMessages, { sender: 'user', text: userText }];
    setChatMessages(newHistory);
    setInputMessage('');
    setIsTyping(true);

    if (
      lowerText.includes('unirse') ||
      lowerText.includes('grupo') ||
      lowerText.includes('telegram') ||
      lowerText.includes('facebook') ||
      lowerText.includes('comunidad')
    ) {
      setTimeout(() => {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: '¡Únete a nuestros canales oficiales para no perderte nada:\n💬 WhatsApp Grupo: https://chat.whatsapp.com/IRASJWGThXcLi0VcBLolUi?mode=hqrt1\n✈ Telegram: https://t.me/LadyOfertas2026\n📘 Facebook: https://www.facebook.com/CazaOfertasml1',
          },
        ]);
        setIsTyping(false);
      }, 800);
      return;
    }

    const coldStartTimer = setTimeout(() => {
      if (isTyping) {
        setChatMessages((prev) => [
          ...prev,
          { sender: 'bot', text: '⚡ (Despertando motores de IA en el servidor... un segundo más, ¡las mejores ofertas valen la espera!)' }
        ]);
      }
    }, 4000);

    try {
      const response = await axios.post(`${API}/chat`, {
        message: userText,
        history: newHistory.slice(-6),
        systemPrompt: SYSTEM_PROMPT 
      });
      
      clearTimeout(coldStartTimer);
      setChatMessages((prev) => [
        ...prev,
        { sender: 'bot', text: response.data.reply },
      ]);
    } catch (error) {
      clearTimeout(coldStartTimer);
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: '¡Rayos! El servidor está tomando vuelo. Pero revisa los cupones activos aquí arriba o ve directo al carrusel principal 🚀',
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
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed top-20 right-5 z-[100] bg-[#FFEA00] text-black border-4 border-black p-4 rounded-2xl shadow-2xl font-black text-xs uppercase max-w-xs text-center"
          >
            {toastMessage}
          </motion.div>
        )}

        {showChatWindow && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.9 }}
            className={`fixed right-5 bottom-24 z-[90] w-[92%] max-w-sm rounded-3xl shadow-2xl border overflow-hidden flex flex-col h-[520px] ${
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
                onClick={() => processAndSendMessage('¿Cómo gano dinero o premios con la comunidad?')}
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
                      ? renderMessageWithCouponCards(msg.text)
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
          className="fixed right-20 bottom-6 z-40 cursor-pointer group flex items-center gap-2 pointer-events-auto"
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
